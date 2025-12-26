"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * useImageWithFallback
 *
 * Maintains a current image source with automatic fallback when the primary image fails.
 * Resets on primary `src` changes to attempt loading again.
 */
export function useImageWithFallback(
  src: string | null | undefined,
  fallback?: string | null
) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src ?? null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // When the source changes, reset state and try the new src
    setCurrentSrc(src ?? null);
    setError(false);
  }, [src]);

  const onError = useCallback(() => {
    if (!error && fallback && currentSrc !== fallback) {
      console.warn(
        `Image failed to load: ${currentSrc ?? "(none)"}, falling back to: ${fallback}`
      );
      setCurrentSrc(fallback);
      setError(true);
    }
  }, [error, fallback, currentSrc]);

  return { currentSrc, onError, error, setCurrentSrc } as const;
}
