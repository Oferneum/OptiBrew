import { Ratelimit } from '@upstash/ratelimit';
import { Redis }     from '@upstash/redis';

// Returns null when Upstash env vars are absent (local dev / CI without Redis).
// Every caller must fail open so a missing Redis never blocks real users.
function makeLimiter(requests: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`): Ratelimit | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis:   new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix:  'dialed:rl',
  });
}

// Standard AI endpoints: 10 req / 10 min per user
export const aiLimiter   = makeLimiter(10, '10 m');

// Bag scan: Gemini Vision is expensive — tighter quota: 5 req / 10 min per user
export const scanLimiter = makeLimiter(5,  '10 m');

/**
 * Check whether `identifier` has exceeded the limiter's quota.
 * Returns true  → rate-limited (caller should return 429).
 * Returns false → allowed, or Upstash is unavailable (fail-open).
 */
export async function isRateLimited(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<boolean> {
  if (!limiter) return false;
  try {
    const { success } = await limiter.limit(identifier);
    return !success;
  } catch {
    // Never block users because of a Redis hiccup
    return false;
  }
}
