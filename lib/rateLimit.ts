// Lightweight in-memory rate limiter (per-instance). For multi-instance deployments,
// use a shared store such as Redis/Upstash instead.
interface RateLimitConfig {
  key: string;
  windowMs?: number;
  max?: number;
}

interface RateLimitResult {
  ok: boolean;
  retryAfterMs?: number;
}

const buckets = new Map<string, number[]>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 300_000; // Clean up every 5 minutes

export function rateLimit({ key, windowMs = 60_000, max = 30 }: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Periodic cleanup: remove entries that have no timestamps in current window
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [k, timestamps] of buckets.entries()) {
      const validTimestamps = timestamps.filter((ts) => ts > now - windowMs);
      if (validTimestamps.length === 0) {
        buckets.delete(k);
      } else {
        buckets.set(k, validTimestamps);
      }
    }
    lastCleanup = now;
  }

  const recent = (buckets.get(key) || []).filter((ts) => ts > windowStart);

  if (recent.length >= max) {
    const retryAfterMs = (recent[0] + windowMs) - now;
    buckets.set(key, recent);
    return { ok: false, retryAfterMs };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { ok: true };
}
