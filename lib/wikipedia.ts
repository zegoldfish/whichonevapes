/**
 * Wikipedia API utilities for fetching celebrity information
 */

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";

interface WikipediaResult {
  title: string;
  bio: string | null;
  image: string | null;
}

/**
 * Fetch photo and bio from Wikipedia's API
 * @param pageId - The Wikipedia page ID of the celebrity
 * @returns Object containing title, bio, and image URL
 */
export async function fetchWikipediaData(
  pageId: string
): Promise<WikipediaResult> {
  try {
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

    const response = await fetch(`${WIKIPEDIA_API}?${params}`);
    
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

    return {
      title: page.title || "",
      bio: page.extract || null,
      image: page.thumbnail?.source || null,
    };
  } catch (error) {
    console.error(`Error fetching Wikipedia data for page ID ${pageId}:`, error);
    return { title: "", bio: null, image: null };
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
  return Promise.all(pageIds.map((pageId) => fetchWikipediaData(pageId)));
}
