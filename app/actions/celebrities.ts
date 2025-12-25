"use server";

import { z } from "zod";
import { ddb, CELEBRITIES_TABLE_NAME } from "@/lib/aws/dynamodb";
import {
  TransactWriteCommand,
  BatchGetCommand,
  ScanCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  type Celebrity,
} from "@/types/celebrity";
import { buildMatchDeltas, type Winner } from "@/lib/elo";
import { fetchWikipediaData } from "@/lib/wikipedia";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";

// DynamoDB cursor helpers (base64url-encoded JSON)
function encodeCursor(key?: Record<string, unknown> | null): string | undefined {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key)).toString("base64url");
}

function decodeCursor(cursor?: string | null): Record<string, unknown> | undefined {
  if (!cursor) return undefined;
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

// Record a head-to-head vote between two celebrities using Elo
export async function voteBetweenCelebrities(params: {
  celebAId: string;
  celebBId: string;
  winner: Winner; // "A" or "B"
  k?: number;
}): Promise<{ newA: number; newB: number }> {
  const schema = z.object({
    celebAId: z.string().uuid(),
    celebBId: z.string().uuid(),
    winner: z.enum(["A", "B"]),
    k: z.number().int().min(1).max(64).optional(),
  });
  const { celebAId, celebBId, winner, k } = schema.parse(params);

  // Per-IP rate limit to reduce vote abuse (instance-local; use shared store in prod)
  let clientIp = "unknown";
  try {
    const headerList = await headers();
    clientIp = (headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               headerList.get("x-real-ip") ||
               "unknown") as string;
  } catch {
    // If headers are unavailable, fall back to unknown
  }
  const { ok, retryAfterMs } = rateLimit({ key: `vote:${clientIp}`, windowMs: 60_000, max: 30 });
  if (!ok) {
    const waitSeconds = Math.max(1, Math.ceil((retryAfterMs || 0) / 1000));
    throw new Error(`Rate limit exceeded. Try again in ${waitSeconds}s.`);
  }

  // Fetch both celebs
  const batch = await ddb.send(
    new BatchGetCommand({
      RequestItems: {
        [CELEBRITIES_TABLE_NAME]: {
          Keys: [{ id: celebAId }, { id: celebBId }],
        },
      },
    })
  );

  const items = (batch.Responses?.[CELEBRITIES_TABLE_NAME] || []) as Celebrity[];
  const a = items.find((i) => i.id === celebAId);
  const b = items.find((i) => i.id === celebBId);
  if (!a || !b) {
    throw new Error("One or both celebrities not found");
  }

  const { a: da, b: db } = buildMatchDeltas(a.elo ?? 1000, b.elo ?? 1000, winner, k);
  const now = new Date().toISOString();

  // Transactional update: update both items atomically
  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: CELEBRITIES_TABLE_NAME,
            Key: { id: a.id },
            UpdateExpression:
              "SET elo = :elo, updatedAt = :now, rankPartition = if_not_exists(rankPartition, :pk) ADD wins :wins, matches :one",
            ExpressionAttributeValues: {
              ":elo": da.newElo,
              ":wins": da.winsDelta,
              ":one": 1,
              ":now": now,
              ":pk": ELO_GSI_PARTITION_VALUE,
            },
            ConditionExpression: "attribute_exists(id)",
          },
        },
        {
          Update: {
            TableName: CELEBRITIES_TABLE_NAME,
            Key: { id: b.id },
            UpdateExpression:
              "SET elo = :elo, updatedAt = :now, rankPartition = if_not_exists(rankPartition, :pk) ADD wins :wins, matches :one",
            ExpressionAttributeValues: {
              ":elo": db.newElo,
              ":wins": db.winsDelta,
              ":one": 1,
              ":now": now,
              ":pk": ELO_GSI_PARTITION_VALUE,
            },
            ConditionExpression: "attribute_exists(id)",
          },
        },
      ],
    })
  );

  return { newA: da.newElo, newB: db.newElo };
}

// Fetch all celebrities
export async function getAllCelebrities(): Promise<Celebrity[]> {
  const items: Celebrity[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const page = await ddb.send(
      new ScanCommand({
        TableName: CELEBRITIES_TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    items.push(...((page.Items || []) as Celebrity[]));
    lastEvaluatedKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  // Sort by ELO descending
  return items.sort((a, b) => (b.elo ?? 1000) - (a.elo ?? 1000));
}

const ELO_GSI_NAME = "elo-gsi";
const ELO_GSI_PARTITION_VALUE = process.env.CELEBRITIES_ELO_PARTITION || "GLOBAL";

// Paginated fetch of ranked celebrities (cursor-based)
export async function getRankedCelebritiesPage(params: {
  pageSize?: number;
  cursor?: string | null;
  search?: string | null;
}): Promise<{
  items: Celebrity[];
  nextCursor?: string;
}> {
  const schema = z.object({
    pageSize: z.number().int().min(1).max(100).optional(),
    cursor: z.string().optional().nullable(),
    search: z.string().optional().nullable(),
  });

  const { pageSize = 24, cursor, search } = schema.parse(params);
  const normalizedSearch = search?.trim().toLowerCase() || "";

  let exclusiveStartKey = decodeCursor(cursor);
  const items: Celebrity[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  const fetchPage = async () => {
    if (ELO_GSI_NAME) {
      return ddb.send(
        new QueryCommand({
          TableName: CELEBRITIES_TABLE_NAME,
          IndexName: ELO_GSI_NAME,
          KeyConditionExpression: "rankPartition = :pk",
          ExpressionAttributeValues: {
            ":pk": ELO_GSI_PARTITION_VALUE,
          },
          Limit: pageSize,
          ExclusiveStartKey: exclusiveStartKey,
          ScanIndexForward: false, // highest elo first
        })
      );
    }

    return ddb.send(
      new ScanCommand({
        TableName: CELEBRITIES_TABLE_NAME,
        Limit: pageSize,
        ExclusiveStartKey: exclusiveStartKey,
      })
    );
  };

  // Keep fetching until we have enough items (or exhaust table)
  while (items.length < pageSize) {
    const result = await fetchPage();

    const pageItems = (result.Items || []) as Celebrity[];
    const filtered = normalizedSearch
      ? pageItems.filter((item) => item.name?.toLowerCase().includes(normalizedSearch))
      : pageItems;

    items.push(...filtered);
    lastEvaluatedKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;

    if (!lastEvaluatedKey) {
      break;
    }

    exclusiveStartKey = lastEvaluatedKey;
  }

  const ordered = ELO_GSI_NAME
    ? items.slice(0, pageSize) // already sorted by GSI
    : items.sort((a, b) => (b.elo ?? 1000) - (a.elo ?? 1000)).slice(0, pageSize);

  return {
    items: ordered,
    nextCursor: encodeCursor(lastEvaluatedKey),
  };
}

// Simple in-memory cache for celebrity list (refreshed periodically)
let cachedCelebrities: Celebrity[] = [];
let lastCacheUpdate = 0;
const CACHE_TTL_MS = 300_000; // 5 minutes

async function getCachedCelebrities(): Promise<Celebrity[]> {
  const now = Date.now();
  
  if (cachedCelebrities.length === 0 || now - lastCacheUpdate > CACHE_TTL_MS) {
    const items: Celebrity[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    do {
      const scan = await ddb.send(
        new ScanCommand({
          TableName: CELEBRITIES_TABLE_NAME,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      items.push(...((scan.Items || []) as Celebrity[]));
      lastEvaluatedKey = scan.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastEvaluatedKey);

    cachedCelebrities = items;
    lastCacheUpdate = now;
  }

  return cachedCelebrities;
}

export async function getCelebrityById(id: string): Promise<Celebrity | null> {
  // Try cache first
  const cached = cachedCelebrities.find((c) => c.id === id);
  if (cached) return cached;

  // Fetch directly
  const batch = await ddb.send(
    new BatchGetCommand({
      RequestItems: {
        [CELEBRITIES_TABLE_NAME]: {
          Keys: [{ id }],
        },
      },
    })
  );
  const items = (batch.Responses?.[CELEBRITIES_TABLE_NAME] || []) as Celebrity[];
  const celeb = items[0];
  if (celeb) {
    // Update cache entry for future calls
    cachedCelebrities = [...cachedCelebrities.filter((c) => c.id !== id), celeb];
  }
  return celeb ?? null;
}

export async function getCelebrityBySlug(slug: string): Promise<Celebrity | null> {
  // Try cache first
  const cached = cachedCelebrities.find((c) => c.slug === slug);
  if (cached) return cached;

  // Query using the GSI on slug
  const result = await ddb.send(
    new QueryCommand({
      TableName: CELEBRITIES_TABLE_NAME,
      IndexName: "slug",
      KeyConditionExpression: "slug = :slug",
      ExpressionAttributeValues: {
        ":slug": slug,
      },
      Limit: 1,
    })
  );

  const celeb = (result.Items?.[0] || null) as Celebrity | null;
  if (celeb) {
    // Update cache entry for future calls
    cachedCelebrities = [...cachedCelebrities.filter((c) => c.id !== celeb.id), celeb];
  }
  return celeb;
}

// Fetch a random pair of celebrities
export async function getRandomCelebrityPair(): Promise<{
  a: Celebrity;
  b: Celebrity;
}> {
  const items = await getCachedCelebrities();

  if (items.length < 2) {
    throw new Error("Not enough celebrities in database");
  }

  // Simple random selection
  const idx1 = Math.floor(Math.random() * items.length);
  let idx2 = Math.floor(Math.random() * items.length);
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * items.length);
  }

  return { a: items[idx1], b: items[idx2] };
}

// Fetch Wikipedia photo and bio for a celebrity on demand
export async function enrichCelebrityWithWikipedia(
  celebrityId: string
): Promise<Celebrity> {
  const schema = z.object({
    id: z.string().uuid(),
  });
  const { id } = schema.parse({ id: celebrityId });

  // Get the celebrity from DB
  const batch = await ddb.send(
    new BatchGetCommand({
      RequestItems: {
        [CELEBRITIES_TABLE_NAME]: {
          Keys: [{ id }],
        },
      },
    })
  );

  const items = (batch.Responses?.[CELEBRITIES_TABLE_NAME] || []) as Celebrity[];
  const celebrity = items[0];
  
  if (!celebrity) {
    throw new Error("Celebrity not found");
  }

  if (!celebrity.wikipediaPageId) {
    throw new Error("Celebrity does not have a Wikipedia page ID");
  }

  // Fetch Wikipedia data
  const wikiData = await fetchWikipediaData(celebrity.wikipediaPageId);

  // Return enriched celebrity data without writing to DynamoDB (read-only)
  return {
    ...celebrity,
    image: wikiData.image || celebrity.image || undefined,
    bio: wikiData.bio || celebrity.bio || undefined,
  };
}

// Fetch Wikipedia data for a celebrity without saving to DB
export async function getCelebrityWikipediaData(pageId: string): Promise<{
  bio: string | null;
  image: string | null;
}> {
  const wikiData = await fetchWikipediaData(pageId);
  return {
    bio: wikiData.bio,
    image: wikiData.image,
  };
}

// Vote on whether a celebrity is a confirmed vaper
export async function voteConfirmedVaper(params: {
  celebrityId: string;
  isVaper: boolean; // true for "yes, confirmed vaper", false for "no, not a vaper"
}): Promise<{ yesVotes: number; noVotes: number }> {
  const schema = z.object({
    celebrityId: z.string().uuid(),
    isVaper: z.boolean(),
  });
  const { celebrityId, isVaper } = schema.parse(params);

  // Per-IP rate limit to reduce vote abuse
  let clientIp = "unknown";
  try {
    const headerList = await headers();
    clientIp = (headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               headerList.get("x-real-ip") ||
               "unknown") as string;
  } catch {
    // If headers are unavailable, fall back to unknown
  }
  const { ok, retryAfterMs } = rateLimit({ 
    key: `vaper-vote:${clientIp}`, 
    windowMs: 60_000, 
    max: 20 
  });
  if (!ok) {
    const waitSeconds = Math.max(1, Math.ceil((retryAfterMs || 0) / 1000));
    throw new Error(`Rate limit exceeded. Try again in ${waitSeconds}s.`);
  }

  // Update the vote count
  const now = new Date().toISOString();
  const voteAttribute = isVaper ? "confirmedVaperYesVotes" : "confirmedVaperNoVotes";
  
  const result = await ddb.send(
    new UpdateCommand({
      TableName: CELEBRITIES_TABLE_NAME,
      Key: { id: celebrityId },
      UpdateExpression: `SET updatedAt = :now ADD ${voteAttribute} :one`,
      ExpressionAttributeValues: {
        ":now": now,
        ":one": 1,
      },
      ConditionExpression: "attribute_exists(id)",
      ReturnValues: "ALL_NEW",
    })
  );

  const updated = result.Attributes as Celebrity;
  
  // Invalidate cache for this celebrity
  cachedCelebrities = cachedCelebrities.filter((c) => c.id !== celebrityId);

  return {
    yesVotes: updated.confirmedVaperYesVotes ?? 0,
    noVotes: updated.confirmedVaperNoVotes ?? 0,
  };
}
