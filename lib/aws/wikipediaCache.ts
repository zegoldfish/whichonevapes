import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { ddb } from "./dynamodb";
import { GetCommand, PutCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const REGION = process.env.AWS_REGION || "us-east-1";
const WIKIPEDIA_CACHE_BUCKET = process.env.WIKIPEDIA_CACHE_BUCKET || "whichonevapes-wikipedia-cache";
const WIKIPEDIA_CACHE_TABLE = process.env.WIKIPEDIA_CACHE_TABLE || "WikipediaCache";
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL || "";
const CACHE_TTL_DAYS = 180; // 6 months

const s3Client = new S3Client({ region: REGION });

interface CachedWikipediaData {
  pageId: string;
  title: string;
  bio: string | null;
  imageUrl: string | null; // CloudFront URL
  originalImageUrl: string | null; // Original Wikipedia URL
  s3Key: string | null;
  cachedAt: string;
  expiresAt: number;
}

/**
 * Generate a consistent S3 key for an image URL.
 * Uses a non-security-critical hash purely for stable naming/deduplication.
 */
function generateImageKey(imageUrl: string, pageId: string): string {
  const hash = crypto.createHash("sha256").update(imageUrl).digest("hex");
  const ext = imageUrl.split(".").pop()?.split("?")[0] || "jpg";
  return `wikipedia/${pageId}/${hash}.${ext}`;
}

/**
 * Download image from URL and upload to S3
 */
async function cacheImageToS3(
  imageUrl: string,
  pageId: string
): Promise<string> {
  try {
    // Download image from Wikipedia
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const s3Key = generateImageKey(imageUrl, pageId);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: WIKIPEDIA_CACHE_BUCKET,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000", // 1 year
        Metadata: {
          pageId,
          originalUrl: imageUrl,
          cachedAt: new Date().toISOString(),
        },
      })
    );

    // Return CloudFront URL if available, otherwise S3 URL
    if (CLOUDFRONT_URL) {
      return `${CLOUDFRONT_URL}/${s3Key}`;
    }
    return `https://${WIKIPEDIA_CACHE_BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
  } catch (error) {
    // Return original URL as fallback
    return imageUrl;
  }
}

/**
 * Get cached Wikipedia data from DynamoDB
 */
export async function getCachedWikipediaData(
  pageId: string
): Promise<CachedWikipediaData | null> {
  try {
    const result = await ddb.send(
      new GetCommand({
        TableName: WIKIPEDIA_CACHE_TABLE,
        Key: { pageId },
      })
    );

    if (!result.Item) {
      return null;
    }

    const item = result.Item as CachedWikipediaData;

    // Check if expired
    if (item.expiresAt && item.expiresAt < Date.now() / 1000) {
      return null;
    }

    return item;
  } catch (error) {
    return null;
  }
}

/**
 * Save Wikipedia data to DynamoDB cache with S3 image
 */
export async function cacheWikipediaData(
  pageId: string,
  title: string,
  bio: string | null,
  originalImageUrl: string | null
): Promise<CachedWikipediaData> {
  const now = new Date().toISOString();
  const expiresAt = Math.floor(Date.now() / 1000) + CACHE_TTL_DAYS * 24 * 60 * 60;

  let cachedImageUrl: string | null = null;
  let s3Key: string | null = null;

  // Cache image to S3 if available
  if (originalImageUrl) {
    try {
      cachedImageUrl = await cacheImageToS3(originalImageUrl, pageId);
      s3Key = generateImageKey(originalImageUrl, pageId);
    } catch (error) {
      cachedImageUrl = originalImageUrl; // Fallback to original
    }
  }

  const cachedData: CachedWikipediaData = {
    pageId,
    title,
    bio,
    imageUrl: cachedImageUrl,
    originalImageUrl,
    s3Key,
    cachedAt: now,
    expiresAt,
  };

  try {
    await ddb.send(
      new PutCommand({
        TableName: WIKIPEDIA_CACHE_TABLE,
        Item: cachedData,
      })
    );
  } catch (error) {
    // Silently fail - data will be re-fetched on next request
  }

  return cachedData;
}

/**
 * Batch get cached Wikipedia data
 */
export async function batchGetCachedWikipediaData(
  pageIds: string[]
): Promise<Map<string, CachedWikipediaData>> {
  if (pageIds.length === 0) {
    return new Map();
  }

  const result = new Map<string, CachedWikipediaData>();
  const now = Date.now() / 1000;

  // DynamoDB BatchGetItem supports up to 100 items
  const BATCH_SIZE = 100;
  for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
    const batch = pageIds.slice(i, i + BATCH_SIZE);

    try {
      const response = await ddb.send(
        new BatchGetCommand({
          RequestItems: {
            [WIKIPEDIA_CACHE_TABLE]: {
              Keys: batch.map((pageId) => ({ pageId })),
            },
          },
        })
      );

      const items = (response.Responses?.[WIKIPEDIA_CACHE_TABLE] || []) as CachedWikipediaData[];

      for (const item of items) {
        // Only include non-expired items
        if (!item.expiresAt || item.expiresAt > now) {
          result.set(item.pageId, item);
        }
      }
    } catch (error) {
      // Silently fail - will attempt to fetch missing items from Wikipedia API
    }
  }

  return result;
}
