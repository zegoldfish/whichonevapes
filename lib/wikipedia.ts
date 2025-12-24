/**
 * Wikipedia API utilities for fetching celebrity information
 */

import { rateLimit } from "./rateLimit";

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const GLOBAL_WINDOW_MS = 60_000;
const GLOBAL_MAX = 20; // Max global calls per minute per instance
const PER_PAGE_MAX = 3; // Max calls per page per minute

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
    const globalLimit = rateLimit({ key: "wikipedia:global", windowMs: GLOBAL_WINDOW_MS, max: GLOBAL_MAX });
    const pageLimit = rateLimit({ key: `wikipedia:${pageId}`, windowMs: GLOBAL_WINDOW_MS, max: PER_PAGE_MAX });

    // If limited and we have stale cache, serve stale; otherwise surface the limit
    if (!globalLimit.ok || !pageLimit.ok) {
      const retryMs = Math.max(globalLimit.retryAfterMs || 0, pageLimit.retryAfterMs || 0);
      if (cached) {
        return cached.value;
      }
      const retrySeconds = Math.max(1, Math.ceil(retryMs / 1000));
      throw new Error(`Wikipedia rate limit exceeded. Retry after ${retrySeconds}s.`);
    }

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
 * Fetch photo and bio for multiple celebrities
 * @param pageIds - Array of Wikipedia page IDs
 * @returns Array of Wikipedia results
 */
export async function fetchWikipediaDataBatch(
  pageIds: string[]
): Promise<WikipediaResult[]> {
  const results = await Promise.allSettled(
    pageIds.map((pageId) => fetchWikipediaData(pageId))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    console.error(
      `Error fetching Wikipedia data for page ID ${pageIds[index]}:`,
      result.reason
    );

    return { title: "", bio: null, image: null };
  });
}
