/**
 * In-Memory Sliding Window Rate Limiter for AirGuard
 * Supports custom limits per endpoint category (e.g. strict limits for login routes).
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds to wait
}

export const RATE_LIMIT_CONFIG = {
  // Login route: strictly max 5 attempts per 15 minutes
  LOGIN: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes in ms
  },
  // All other API endpoints: 100 requests per 15 minutes per IP
  GENERAL: {
    limit: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes in ms
  },
};

// Global in-memory storage to survive across requests in Node process
const rateLimitStore = new Map<string, number[]>();

// Cleanup stale records periodically (every 10 minutes)
if (typeof setInterval !== "undefined") {
  const CLEANUP_INTERVAL = 10 * 60 * 1000;
  const timer = setInterval(() => {
    const now = Date.now();
    const maxWindow = Math.max(RATE_LIMIT_CONFIG.LOGIN.windowMs, RATE_LIMIT_CONFIG.GENERAL.windowMs);
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const valid = timestamps.filter((t) => now - t < maxWindow);
      if (valid.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, valid);
      }
    }
  }, CLEANUP_INTERVAL);
  if (timer.unref) {
    timer.unref();
  }
}

/**
 * Check if request key exceeds limit within windowMs using sliding window log.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const current = rateLimitStore.get(key) || [];
  const validTimestamps = current.filter((t) => t > windowStart);

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    const resetTime = Math.ceil((oldest + windowMs) / 1000);

    return {
      success: false,
      limit,
      remaining: 0,
      resetTime,
      retryAfter,
    };
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, validTimestamps);

  const oldest = validTimestamps[0];
  const resetTime = Math.ceil((oldest + windowMs) / 1000);
  const remaining = Math.max(0, limit - validTimestamps.length);

  return {
    success: true,
    limit,
    remaining,
    resetTime,
    retryAfter: 0,
  };
}

/**
 * Extract client IP address safely from request headers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

/**
 * Generate standard HTTP RateLimit headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  };

  if (!result.success && result.retryAfter > 0) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Helper to reset rate limits (useful for testing or administrative resets)
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
