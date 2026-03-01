/**
 * Simple in-memory rate limiter for Netlify Functions.
 * Note: Each function instance has its own memory, so this is per-instance.
 * For distributed rate limiting, use a database or Redis.
 * This still provides protection against rapid-fire requests to a single instance.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

/**
 * Check if a request should be rate limited.
 * @param key - Unique identifier (e.g., IP address)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if the request should be BLOCKED
 */
export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

/** Extract client IP from Netlify function event headers */
export function getClientIp(headers: Record<string, string | undefined>): string {
  return headers['x-forwarded-for']?.split(',')[0]?.trim()
    || headers['x-nf-client-connection-ip']
    || headers['client-ip']
    || 'unknown';
}
