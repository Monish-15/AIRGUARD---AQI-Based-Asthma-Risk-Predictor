import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  RATE_LIMIT_CONFIG,
} from "@/lib/rateLimit";

const MAX_BODY_BYTES = 64 * 1024; // 64 KB maximum payload
const MAX_URL_LENGTH = 2048;

/**
 * Standard OWASP security headers attached to all responses
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
};

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Enforce URL length restriction
  if (request.url.length > MAX_URL_LENGTH) {
    return applySecurityHeaders(
      NextResponse.json(
        { error: "URI Too Long", detail: "Request URL exceeds maximum permitted length of 2048 characters." },
        { status: 414 }
      )
    );
  }

  // Only apply API defenses to /api routes
  if (!pathname.startsWith("/api")) {
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  }

  // 2. Reject oversized payloads
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return applySecurityHeaders(
      NextResponse.json(
        {
          error: "Payload Too Large",
          detail: `Request body exceeds maximum allowed size of ${MAX_BODY_BYTES / 1024} KB.`,
        },
        { status: 413 }
      )
    );
  }

  // 3. Rate limiting by Client IP
  const clientIp = getClientIp(request);
  const isLoginRoute =
    pathname === "/api/auth/login" || pathname.startsWith("/api/auth/login/");

  const config = isLoginRoute
    ? RATE_LIMIT_CONFIG.LOGIN
    : RATE_LIMIT_CONFIG.GENERAL;

  const keyPrefix = isLoginRoute ? "login" : "general";
  const rateLimitKey = `${keyPrefix}:${clientIp}`;

  const result = checkRateLimit(rateLimitKey, config.limit, config.windowMs);
  const rateHeaders = getRateLimitHeaders(result);

  if (!result.success) {
    const detail = isLoginRoute
      ? `Too many login attempts. Maximum 5 attempts allowed per 15 minutes. Please try again in ${result.retryAfter} seconds.`
      : `Rate limit exceeded. Too many requests. Please try again in ${result.retryAfter} seconds.`;

    const errRes = NextResponse.json(
      {
        error: "Too Many Requests",
        detail,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: rateHeaders,
      }
    );
    return applySecurityHeaders(errRes);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ratelimit-applied", "1");

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Attach rate limit headers and security headers
  for (const [key, value] of Object.entries(rateHeaders)) {
    response.headers.set(key, value);
  }
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/api/:path*"],
};
