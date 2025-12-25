import { useEffect, useState } from "react";
import { getCelebrityWikipediaData } from "@/app/actions/celebrities";

interface UseWikipediaDataProps {
  wikipediaPageId?: string;
  initialImage?: string | null;
  initialBio?: string | null;
}

interface UseWikipediaDataReturn {
  imgSrc: string | null;
  bio: string | null;
  loading: boolean;
}

/**
 * Hook for fetching and managing Wikipedia data (image and bio)
 * Fetches from Wikipedia if data is not already available
 */
export function useWikipediaData({
  wikipediaPageId,
  initialImage = null,
  initialBio = null,
}: UseWikipediaDataProps): UseWikipediaDataReturn {
  const [imgSrc, setImgSrc] = useState<string | null>(initialImage);
  const [bio, setBio] = useState<string | null>(initialBio);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setImgSrc(initialImage || null);
    setBio(initialBio || null);
  }, [initialImage, initialBio]);

  // Fetch Wikipedia data if needed
  useEffect(() => {
    if ((imgSrc && bio) || !wikipediaPageId || loading) return;

    let active = true;
    setLoading(true);

    getCelebrityWikipediaData(wikipediaPageId)
      .then((data) => {
        if (!active) return;
        if (data.image && !imgSrc) {
          setImgSrc(data.image);
        }
        if (data.bio && !bio) {
          setBio(data.bio);
        }
      })
      .catch((err) => {
        console.error("Failed to load Wikipedia data:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [wikipediaPageId, imgSrc, bio, loading]);

  return { imgSrc, bio, loading };
}
