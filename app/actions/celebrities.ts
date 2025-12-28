"use server";

import { auth } from "@/lib/auth";
import { isApprovedAdmin } from "@/lib/admins";
import { z } from "zod";
import { ddb, CELEBRITIES_TABLE_NAME, MATCHUPS_TABLE_NAME } from "@/lib/aws/dynamodb";
import {
  TransactWriteCommand,
  BatchGetCommand,
  ScanCommand,
  UpdateCommand,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  type Celebrity,
} from "@/types/celebrity";
import { type Matchup, type MatchupSkip } from "@/types/matchup";
import { buildMatchDeltas, type Winner } from "@/lib/elo";
import { fetchWikipediaData } from "@/lib/wikipedia";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";

// Helper: Extract client IP address from request headers
async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    return (headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            headerList.get("x-real-ip") ||
            "unknown") as string;
  } catch {
    // If headers are unavailable, fall back to unknown
    return "unknown";
  }
}

// Helper: Generate normalized matchup key for head-to-head record tracking
function createMatchupKey(celebAId: string, celebBId: string): string {
  const ids = [celebAId, celebBId].sort();
  return ids.join("|");
}

// Helper: Log a matchup vote for analytics and feedback
async function logMatchup(params: {
  celebAId: string;
  celebBId: string;
  celebAName: string;
  celebBName: string;
  winner: "A" | "B";
  kFactor: number;
  celebAEloBefore: number;
  celebBEloBefore: number;
  celebAEloAfter: number;
  celebBEloAfter: number;
  clientIp: string;
}): Promise<void> {
  const {
    celebAId,
    celebBId,
    celebAName,
    celebBName,
    winner,
    kFactor,
    celebAEloBefore,
    celebBEloBefore,
    celebAEloAfter,
    celebBEloAfter,
    clientIp,
  } = params;

  const matchup: Matchup = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    matchupKey: createMatchupKey(celebAId, celebBId),
    eventType: "vote",
    celebAId,
    celebBId,
    celebAName,
    celebBName,
    winner,
    kFactor,
    celebAEloBefore,
    celebBEloBefore,
    celebAEloAfter,
    celebBEloAfter,
    clientIp,
  };

  await ddb.send(
    new PutCommand({
      TableName: MATCHUPS_TABLE_NAME,
      Item: matchup,
    })
  );
}

// Log a skipped matchup for engagement/feedback analytics
export async function logMatchupSkip(params: {
  celebAId: string;
  celebBId: string;
}): Promise<void> {
  const schema = z.object({
    celebAId: z.string().uuid(),
    celebBId: z.string().uuid(),
  });
  const { celebAId, celebBId } = schema.parse(params);

  // Per-IP rate limit to prevent skip spam
  const clientIp = await getClientIp();
  const { ok, retryAfterMs } = rateLimit({ key: `skip:${clientIp}`, windowMs: 60_000, max: 30 });
  if (!ok) {
    const waitSeconds = Math.max(1, Math.ceil((retryAfterMs || 0) / 1000));
    throw new Error(`Rate limit exceeded. Try again in ${waitSeconds}s.`);
  }

  // Get celeb names for denormalization
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

  const skip: Matchup = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    matchupKey: createMatchupKey(celebAId, celebBId),
    eventType: "skip",
    celebAId,
    celebBId,
    celebAName: a.name,
    celebBName: b.name,
    clientIp,
  };

  await ddb.send(
    new PutCommand({
      TableName: MATCHUPS_TABLE_NAME,
      Item: skip,
    })
  );
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
  const clientIp = await getClientIp();
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

  // Log the matchup (fire-and-forget to avoid blocking)
  logMatchup({
    celebAId,
    celebBId,
    celebAName: a.name,
    celebBName: b.name,
    winner,
    kFactor: k || 32,
    celebAEloBefore: a.elo ?? 1000,
    celebBEloBefore: b.elo ?? 1000,
    celebAEloAfter: da.newElo,
    celebBEloAfter: db.newElo,
    clientIp,
  }).catch((err) => {
    console.error("Failed to log matchup:", err);
  });

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
const ELO_GSI_PARTITION_VALUE = "GLOBAL";

// Paginated fetch of ranked celebrities (cursor-based)
// Loads all celebrities and filters/sorts in-memory for reliable search & pagination
export async function getRankedCelebritiesPage(params: {
  pageSize?: number;
  cursor?: string | null;
  search?: string | null;
}): Promise<{
  items: Array<Celebrity & { rank: number }>;
  nextCursor?: string;
  totalCount: number;
}> {
  const schema = z.object({
    pageSize: z.number().int().min(1).max(100).optional(),
    cursor: z.string().optional().nullable(),
    search: z.string().optional().nullable(),
  });

  const { pageSize = 24, cursor, search } = schema.parse(params);
  const normalizedSearch = search?.trim().toLowerCase() || "";

  // Load all celebrities from cache (refreshed every 5 min)
  const allCelebs = await getCachedCelebrities();
  
  // Filter to only approved celebrities
  const approvedCelebs = allCelebs.filter(c => c.approved === undefined || c.approved === true);
  
  // Sort by Elo descending
  const sortedCelebs = approvedCelebs
    .slice()
    .sort((a, b) => (b.elo ?? 1000) - (a.elo ?? 1000))
    .map((celeb, index) => ({
      ...celeb,
      rank: index + 1,
    }));

  // Filter by search if provided (preserving global ranks)
  const filteredCelebs = normalizedSearch
    ? sortedCelebs.filter((c) => c.name?.toLowerCase().includes(normalizedSearch))
    : sortedCelebs;

  // Parse cursor (now just a numeric offset)
  let offset = 0;
  if (cursor) {
    const parsed = parseInt(cursor, 10);
    // Validate: must be a valid non-negative number
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
    // Invalid cursor defaults to 0; silently reset pagination
  }
  
  // Paginate
  const paginatedItems = filteredCelebs.slice(offset, offset + pageSize);
  const hasMore = offset + pageSize < filteredCelebs.length;
  const nextCursor = hasMore ? String(offset + pageSize) : undefined;

  return {
    items: paginatedItems,
    nextCursor,
    totalCount: filteredCelebs.length,
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

  // Filter to only approved celebrities
  const approvedItems = items.filter(c => c.approved === undefined || c.approved === true);

  if (approvedItems.length < 2) {
    throw new Error("Not enough celebrities in database");
  }

  // Simple random selection
  const idx1 = Math.floor(Math.random() * approvedItems.length);
  let idx2 = Math.floor(Math.random() * approvedItems.length);
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * approvedItems.length);
  }

  return { a: approvedItems[idx1], b: approvedItems[idx2] };
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
  fallbackImage?: string | null;
}> {
  const wikiData = await fetchWikipediaData(pageId);
  return {
    bio: wikiData.bio,
    image: wikiData.image,
    fallbackImage: wikiData.fallbackImage,
  };
}

// Search Wikipedia for pages by query (title), returning pageId, title, and optional thumbnail
export async function searchWikipedia(params: {
  query: string;
  limit?: number;
}): Promise<Array<{ pageId: string; title: string; thumbnail?: string }>> {
  const schema = z.object({
    query: z.string().min(2),
    limit: z.number().int().min(1).max(20).optional(),
  });
  const { query, limit = 5 } = schema.parse(params);

  const clientIp = await getClientIp();

  const { ok, retryAfterMs } = rateLimit({ key: `wiki-search:${clientIp}`, windowMs: 60_000, max: 30 });
  if (!ok) {
    const waitSeconds = Math.max(1, Math.ceil((retryAfterMs || 0) / 1000));
    throw new Error(`Rate limit exceeded. Try again in ${waitSeconds}s.`);
  }

  const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
  const paramsSearch = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: query,
    gsrlimit: String(limit),
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "120",
    origin: "*",
  });

  const res = await fetch(`${WIKIPEDIA_API}?${paramsSearch.toString()}`, {
    headers: {
      "User-Agent": "whichonevapes/1.0 (contact: admin@whichonevapes.net)",
    },
  });
  if (!res.ok) {
    throw new Error(`Wikipedia search failed: ${res.statusText}`);
  }
  const data = await res.json();
  const pages = data?.query?.pages || {};

  const results: Array<{ pageId: string; title: string; thumbnail?: string }> = Object.values(pages)
    .map((p: any) => ({
      pageId: String(p.pageid),
      title: p.title as string,
      thumbnail: p.thumbnail?.source as string | undefined,
    }))
    // Wikipedia can return duplicates or non-person pages; basic filter to enforce presence of title
    .filter((r) => !!r.title);

  return results;
}

// Paginated list of unapproved celebrities for review
export async function getUnapprovedCelebritiesPage(params: {
  pageSize?: number;
  cursor?: string | null; // numeric offset encoded as string
}): Promise<{
  items: Array<Pick<Celebrity, "id" | "name" | "slug" | "wikipediaPageId" | "createdAt" | "updatedAt">>;
  nextCursor?: string;
  totalCount: number;
}> {
  const schema = z.object({
    pageSize: z.number().int().min(1).max(50).optional(),
    cursor: z.string().optional().nullable(),
  });

  const { pageSize = 10, cursor } = schema.parse(params);
  const offset = cursor ? parseInt(cursor, 10) : 0;

  // Verify user is authenticated
  const session = await auth();
  if (!session || !session.user?.email) {
    throw new Error("Unauthorized: You must be logged in as an admin");
  }

  // Verify user is an approved admin
  const isAdmin = await isApprovedAdmin(session.user.email);
  if (!isAdmin) {
    throw new Error("Forbidden: You are not authorized to perform this action");
  }

  // Use cached list and filter to unapproved
  const allCelebs = await getCachedCelebrities();
  const unapproved = allCelebs
    .filter((c) => c.approved === false)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const paginated = unapproved.slice(offset, offset + pageSize);
  const hasMore = offset + pageSize < unapproved.length;

  return {
    items: paginated.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      wikipediaPageId: c.wikipediaPageId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    nextCursor: hasMore ? String(offset + pageSize) : undefined,
    totalCount: unapproved.length,
  };
}

// Search for celebrities by name (approved only)
export async function searchCelebrities(params: {
  searchTerm: string;
}): Promise<Celebrity[]> {
  const schema = z.object({
    searchTerm: z.string().min(1),
  });
  const { searchTerm } = schema.parse(params);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  // Load all approved celebrities from cache
  const allCelebs = await getCachedCelebrities();
  
  // Filter by search term (only approved celebrities)
  const filtered = allCelebs
    .filter((c) => 
      (c.approved === undefined || c.approved === true) && 
      c.name?.toLowerCase().includes(normalizedSearch)
    )
    .sort((a, b) => (b.elo ?? 1000) - (a.elo ?? 1000))
    .slice(0, 10); // Limit to top 10 results

  return filtered;
}

// Suggest a new celebrity (creates unapproved entry)
export async function suggestCelebrity(params: {
  name: string;
  wikipediaPageId?: string;
}): Promise<{ success: boolean; message: string }> {
  const schema = z.object({
    name: z.string().min(1).max(100),
    wikipediaPageId: z.string().optional(),
  });
  const { name, wikipediaPageId } = schema.parse(params);

  // Per-IP rate limit for suggestions
  const clientIp = await getClientIp();
  const { ok, retryAfterMs } = rateLimit({ 
    key: `suggest:${clientIp}`, 
    windowMs: 300_000, // 5 minutes
    max: 5 
  });
  if (!ok) {
    const waitSeconds = Math.max(1, Math.ceil((retryAfterMs || 0) / 1000));
    throw new Error(`Rate limit exceeded. Try again in ${waitSeconds}s.`);
  }

  // Check if celebrity with this name already exists (approved or unapproved)
  const allCelebs = await getCachedCelebrities();
  const existing = allCelebs.find(
    (c) => c.name.toLowerCase() === name.trim().toLowerCase()
  );
  
  if (existing) {
    if (existing.approved === false) {
      return {
        success: false,
        message: "This celebrity has already been suggested and is pending approval.",
      };
    }
    return {
      success: false,
      message: "This celebrity already exists in our database!",
    };
  }

  // Create slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const now = new Date().toISOString();
  const newCelebrity: Celebrity = {
    id: crypto.randomUUID(),
    name: name.trim(),
    slug,
    wikipediaPageId,
    vapesVotes: 0,
    doesNotVapeVotes: 0,
    elo: 1000,
    wins: 0,
    matches: 0,
    confirmedVaper: false,
    confirmedVaperYesVotes: 0,
    confirmedVaperNoVotes: 0,
    approved: false,
    createdAt: now,
    updatedAt: now,
  };

  // Insert into DynamoDB
  const { PutCommand } = await import("@aws-sdk/lib-dynamodb");
  await ddb.send(
    new PutCommand({
      TableName: CELEBRITIES_TABLE_NAME,
      Item: newCelebrity,
      ConditionExpression: "attribute_not_exists(id)",
    })
  );

  // Invalidate cache
  cachedCelebrities = [];

  return {
    success: true,
    message: "Thank you! Your celebrity suggestion has been submitted for review.",
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
  const clientIp = await getClientIp();
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

// Approve a celebrity (admin only)
export async function approveCelebrity(params: {
  celebrityId: string;
}): Promise<{ success: boolean; message: string }> {
  // Verify user is authenticated
  const session = await auth();
  if (!session || !session.user?.email) {
    return {
      success: false,
      message: "Unauthorized: You must be logged in as an admin",
    };
  }

  // Verify user is an approved admin
  const isAdmin = await isApprovedAdmin(session.user.email);
  if (!isAdmin) {
    return {
      success: false,
      message: "Forbidden: You are not authorized to perform this action",
    };
  }

  const schema = z.object({
    celebrityId: z.string().uuid(),
  });
  const { celebrityId } = schema.parse(params);

  const now = new Date().toISOString();
  
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: CELEBRITIES_TABLE_NAME,
        Key: { id: celebrityId },
        UpdateExpression: "SET approved = :true, updatedAt = :now",
        ExpressionAttributeValues: {
          ":true": true,
          ":now": now,
        },
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "ALL_NEW",
      })
    );

    // Invalidate cache
    cachedCelebrities = [];

    return {
      success: true,
      message: "Celebrity approved successfully",
    };
  } catch (error) {
    console.error("Error approving celebrity:", error);
    return {
      success: false,
      message: "Failed to approve celebrity",
    };
  }
}

// Reject/delete a celebrity (admin only)
export async function rejectCelebrity(params: {
  celebrityId: string;
}): Promise<{ success: boolean; message: string }> {
  // Verify user is authenticated
  const session = await auth();
  if (!session || !session.user?.email) {
    return {
      success: false,
      message: "Unauthorized: You must be logged in as an admin",
    };
  }

  // Verify user is an approved admin
  const isAdmin = await isApprovedAdmin(session.user.email);
  if (!isAdmin) {
    return {
      success: false,
      message: "Forbidden: You are not authorized to perform this action",
    };
  }

  const schema = z.object({
    celebrityId: z.string().uuid(),
  });
  const { celebrityId } = schema.parse(params);

  try {
    await ddb.send(
      new DeleteCommand({
        TableName: CELEBRITIES_TABLE_NAME,
        Key: { id: celebrityId },
        ConditionExpression: "attribute_exists(id)",
      })
    );

    // Invalidate cache
    cachedCelebrities = [];

    return {
      success: true,
      message: "Celebrity rejected and removed",
    };
  } catch (error) {
    console.error("Error rejecting celebrity:", error);
    return {
      success: false,
      message: "Failed to reject celebrity",
    };
  }
}

// Fetch paginated skip events for admin dashboard
export async function getSkipEventsPage(params: {
  pageSize?: number;
  pageNumber?: number;
}): Promise<{
  items: MatchupSkip[];
  totalCount: number;
}> {
  const schema = z.object({
    pageSize: z.number().int().min(1).max(100).optional(),
    pageNumber: z.number().int().min(0).optional(),
  });

  const { pageSize = 10, pageNumber = 0 } = schema.parse(params);

  // Verify user is authenticated
  const session = await auth();
  if (!session || !session.user?.email) {
    throw new Error("Unauthorized: You must be logged in as an admin");
  }

  // Verify user is an approved admin
  const isAdmin = await isApprovedAdmin(session.user.email);
  if (!isAdmin) {
    throw new Error("Forbidden: You are not authorized to perform this action");
  }

  const items: Matchup[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  // Scan the entire matchups table to find skip events
  do {
    const scan = await ddb.send(
      new ScanCommand({
        TableName: MATCHUPS_TABLE_NAME,
        FilterExpression: "eventType = :skip",
        ExpressionAttributeValues: {
          ":skip": "skip",
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    items.push(...((scan.Items || []) as Matchup[]));
    lastEvaluatedKey = scan.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  // Sort by timestamp descending (newest first)
  const sortedItems = items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Paginate
  const offset = pageNumber * pageSize;
  const paginatedItems = sortedItems.slice(offset, offset + pageSize) as MatchupSkip[];

  return {
    items: paginatedItems,
    totalCount: sortedItems.length,
  };
}

// Fetch skip statistics aggregated by celebrity
export async function getSkipStatsByCelebrity(params?: {
  pageSize?: number;
  pageNumber?: number;
}): Promise<{
  items: Array<{
    celebrityId: string;
    celebrityName: string;
    skipCount: number;
  }>;
  totalCount: number;
}> {
  const schema = z.object({
    pageSize: z.number().int().min(1).max(100).optional(),
    pageNumber: z.number().int().min(0).optional(),
  });

  const { pageSize = 10, pageNumber = 0 } = schema.parse(params || {});

  // Verify user is authenticated
  const session = await auth();
  if (!session || !session.user?.email) {
    throw new Error("Unauthorized: You must be logged in as an admin");
  }

  // Verify user is an approved admin
  const isAdmin = await isApprovedAdmin(session.user.email);
  if (!isAdmin) {
    throw new Error("Forbidden: You are not authorized to perform this action");
  }

  const items: Matchup[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  // Scan the entire matchups table to find skip events
  do {
    const scan = await ddb.send(
      new ScanCommand({
        TableName: MATCHUPS_TABLE_NAME,
        FilterExpression: "eventType = :skip",
        ExpressionAttributeValues: {
          ":skip": "skip",
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    items.push(...((scan.Items || []) as Matchup[]));
    lastEvaluatedKey = scan.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  // Aggregate skips by celebrity (both A and B)
  const skipStats = new Map<string, { name: string; count: number }>();

  for (const skip of items as any[]) {
    // Count celebrity A skips
    const aKey = skip.celebAId;
    const aName = skip.celebAName;
    skipStats.set(aKey, {
      name: aName,
      count: (skipStats.get(aKey)?.count ?? 0) + 1,
    });

    // Count celebrity B skips
    const bKey = skip.celebBId;
    const bName = skip.celebBName;
    skipStats.set(bKey, {
      name: bName,
      count: (skipStats.get(bKey)?.count ?? 0) + 1,
    });
  }

  // Convert to array and sort by skip count descending
  const allStats = Array.from(skipStats.entries())
    .map(([id, data]) => ({
      celebrityId: id,
      celebrityName: data.name,
      skipCount: data.count,
    }))
    .sort((a, b) => b.skipCount - a.skipCount);

  // Paginate
  const offset = pageNumber * pageSize;
  const paginatedStats = allStats.slice(offset, offset + pageSize);

  return {
    items: paginatedStats,
    totalCount: allStats.length,
  };
}
