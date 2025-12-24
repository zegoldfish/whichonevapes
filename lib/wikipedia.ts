/**
 * Wikipedia API utilities for fetching celebrity information
 */

import { rateLimit } from "./rateLimit";

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const GLOBAL_WINDOW_MS = 60_000;
const GLOBAL_MAX = 100; // Max global calls per minute per instance (Wikipedia allows 200/s for bots)
const PER_PAGE_MAX = 10; // Max calls per page per minute
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

interface WikipediaResult {
  title: string;
  bio: string | null;
  image: string | null;
}

const cache = new Map<string, { expires: number; value: WikipediaResult }>();
const inFlight = new Map<string, Promise<WikipediaResult>>();

/**
 * Fetch photo and bio from Wikipedia's API
 * @param pageId - The Wikipedia page ID of the celebrity
 * @returns Object containing title, bio, and image URL
 */
export async function fetchWikipediaData(
  pageId: string
): Promise<WikipediaResult> {
  const now = Date.now();

  // Fresh cache hit
  const cached = cache.get(pageId);
  if (cached && cached.expires > now) {
    return cached.value;
  }

  // Deduplicate concurrent requests for the same page
  const existing = inFlight.get(pageId);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    // Try with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const globalLimit = rateLimit({ key: "wikipedia:global", windowMs: GLOBAL_WINDOW_MS, max: GLOBAL_MAX });
      const pageLimit = rateLimit({ key: `wikipedia:${pageId}`, windowMs: GLOBAL_WINDOW_MS, max: PER_PAGE_MAX });

      // If limited, check if we should retry or return cached
      if (!globalLimit.ok || !pageLimit.ok) {
        const retryMs = Math.max(globalLimit.retryAfterMs || 0, pageLimit.retryAfterMs || 0);
        
        // If we have cached data, serve it (stale-while-revalidate pattern)
        if (cached) {
          return cached.value;
        }

        // If this is our last attempt, throw
        if (attempt === MAX_RETRIES) {
          const retrySeconds = Math.max(1, Math.ceil(retryMs / 1000));
          throw new Error(`Wikipedia rate limit exceeded. Retry after ${retrySeconds}s.`);
        }

        // Exponential backoff: wait before retrying
        const backoffDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, Math.min(backoffDelay, retryMs)));
        continue;
      }

      // Rate limit check passed, break out of retry loop
      break;
    } // End of retry loop

    const params = new URLSearchParams({
      action: "query",
      format: "json",
      pageids: pageId,
      prop: "extracts|pageimages",
      exintro: "true", // Only get the intro section
      explaintext: "true", // Plain text instead of HTML
      piprop: "thumbnail",
      pithumbsize: "500", // Image size in pixels
      origin: "*", // Enable CORS
    });

    try {
      const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
        headers: {
          // User-Agent strongly recommended by Wikimedia
          "User-Agent": "whichonevapes/1.0 (contact: admin@whichonevapes.net)",
        },
      });

      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.statusText}`);
      }

      const data = await response.json();
      const pages = data.query?.pages;

      if (!pages) {
        return { title: "", bio: null, image: null };
      }

      const page = Object.values(pages)[0] as any;

      // Check if page was not found
      if (page.missing) {
        return { title: "", bio: null, image: null };
      }

      const result: WikipediaResult = {
        title: page.title || "",
        bio: page.extract || null,
        image: page.thumbnail?.source || null,
      };

      cache.set(pageId, { value: result, expires: now + CACHE_TTL_MS });
      return result;
    } catch (error) {
      console.error(`Error fetching Wikipedia data for page ID ${pageId}:`, error);
      // Return stale cache if available
      if (cached) {
        return cached.value;
      }
      return { title: "", bio: null, image: null };
    }
  })();

  inFlight.set(pageId, request);
  try {
    return await request;
  } finally {
    inFlight.delete(pageId);
  }
}

/**
 * Fetch photo and bio for multiple celebrities using Wikipedia's batch API
 * @param pageIds - Array of Wikipedia page IDs
 * @returns Array of Wikipedia results
 */
export async function fetchWikipediaDataBatch(
  pageIds: string[]
): Promise<WikipediaResult[]> {
  if (pageIds.length === 0) {
    return [];
  }

  // Check cache first
  const now = Date.now();
  const results: (WikipediaResult | null)[] = new Array(pageIds.length).fill(null);
  const uncachedIndices: number[] = [];
  const uncachedPageIds: string[] = [];

  pageIds.forEach((pageId, index) => {
    const cached = cache.get(pageId);
    if (cached && cached.expires > now) {
      results[index] = cached.value;
    } else {
      uncachedIndices.push(index);
      uncachedPageIds.push(pageId);
    }
  });

  // If everything is cached, return early
  if (uncachedPageIds.length === 0) {
    return results as WikipediaResult[];
  }

  // Wikipedia API supports up to 50 page IDs per request
  const BATCH_SIZE = 50;
  const batches: string[][] = [];
  for (let i = 0; i < uncachedPageIds.length; i += BATCH_SIZE) {
    batches.push(uncachedPageIds.slice(i, i + BATCH_SIZE));
  }

  // Fetch all batches
  for (const batch of batches) {
    try {
      const globalLimit = rateLimit({ key: "wikipedia:global", windowMs: GLOBAL_WINDOW_MS, max: GLOBAL_MAX });
      if (!globalLimit.ok) {
        // For batch requests, if rate limited, fall back to individual requests
        const individualResults = await Promise.allSettled(
          batch.map((pageId) => fetchWikipediaData(pageId))
        );
        individualResults.forEach((result, i) => {
          const pageId = batch[i];
          const originalIndex = pageIds.indexOf(pageId);
          if (result.status === "fulfilled") {
            results[originalIndex] = result.value;
          } else {
            results[originalIndex] = { title: "", bio: null, image: null };
          }
        });
        continue;
      }

      const params = new URLSearchParams({
        action: "query",
        format: "json",
        pageids: batch.join("|"),
        prop: "extracts|pageimages",
        exintro: "true",
        explaintext: "true",
        piprop: "thumbnail",
        pithumbsize: "500",
        origin: "*",
      });

      const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
        headers: {
          "User-Agent": "whichonevapes/1.0 (contact: admin@whichonevapes.net)",
        },
      });

      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.statusText}`);
      }

      const data = await response.json();
      const pages = data.query?.pages || {};

      // Process each page in the batch
      batch.forEach((pageId) => {
        const page = pages[pageId];
        const originalIndex = pageIds.indexOf(pageId);
        
        if (!page || page.missing) {
          results[originalIndex] = { title: "", bio: null, image: null };
          return;
        }

        const result: WikipediaResult = {
          title: page.title || "",
          bio: page.extract || null,
          image: page.thumbnail?.source || null,
        };

        cache.set(pageId, { value: result, expires: now + CACHE_TTL_MS });
        results[originalIndex] = result;
      });
    } catch (error) {
      console.error(`Error fetching Wikipedia batch:`, error);
      // Fill in empty results for failed batch
      batch.forEach((pageId) => {
        const originalIndex = pageIds.indexOf(pageId);
        if (results[originalIndex] === null) {
          results[originalIndex] = { title: "", bio: null, image: null };
        }
      });
    }
  }

  return results as WikipediaResult[];
}
