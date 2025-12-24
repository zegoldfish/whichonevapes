"use server";

import { z } from "zod";
import { ddb, CELEBRITIES_TABLE_NAME } from "@/lib/aws/dynamodb";
import {
  TransactWriteCommand,
  BatchGetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  type Celebrity,
} from "@/types/celebrity";
import { buildMatchDeltas, type Winner } from "@/lib/elo";
import { fetchWikipediaData } from "@/lib/wikipedia";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";

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
              "SET elo = :elo, updatedAt = :now ADD wins :wins, matches :one",
            ExpressionAttributeValues: {
              ":elo": da.newElo,
              ":wins": da.winsDelta,
              ":one": 1,
              ":now": now,
            },
            ConditionExpression: "attribute_exists(id)",
          },
        },
        {
          Update: {
            TableName: CELEBRITIES_TABLE_NAME,
            Key: { id: b.id },
            UpdateExpression:
              "SET elo = :elo, updatedAt = :now ADD wins :wins, matches :one",
            ExpressionAttributeValues: {
              ":elo": db.newElo,
              ":wins": db.winsDelta,
              ":one": 1,
              ":now": now,
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

// Admin: set confirmed vaper flag for a celebrity
export async function setCelebrityConfirmedVaper(params: {
  id: string;
  confirmed: boolean;
  adminCode: string;
}): Promise<Celebrity> {
  const schema = z.object({
    id: z.string().uuid(),
    confirmed: z.boolean(),
    adminCode: z.string().min(1),
  });
  const { id, confirmed, adminCode } = schema.parse(params);

  const expected = process.env.ADMIN_CODE || process.env.CONFIRM_ADMIN_CODE;
  if (!expected || adminCode !== expected) {
    throw new Error("Unauthorized: invalid admin code");
  }

  const now = new Date().toISOString();
  await ddb.send(
    new UpdateCommand({
      TableName: CELEBRITIES_TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET confirmedVaper = :c, updatedAt = :now",
      ExpressionAttributeValues: {
        ":c": confirmed,
        ":now": now,
      },
      ConditionExpression: "attribute_exists(id)",
    })
  );

  // Return the updated item
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
    throw new Error("Celebrity not found after update");
  }
  // Bust local cache next time by resetting timestamp
  cachedCelebrities = [];
  lastCacheUpdate = 0;
  return celebrity;
}
