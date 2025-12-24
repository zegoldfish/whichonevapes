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

export function rateLimit({ key, windowMs = 60_000, max = 30 }: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

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
