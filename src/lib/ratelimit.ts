// In-memory rate limiter for dev. In production, back with Redis.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((b.resetAt - now) / 1000),
    };
  }
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}
