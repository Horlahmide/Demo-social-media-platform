import { NextResponse } from "next/server";

interface RateLimitOptions {
  limit: number; // Maximum requests allowed in the window
  windowMs: number; // Window size in milliseconds
}

// In-memory request timestamp store per IP address
const tracker = new Map<string, number[]>();

/**
 * IP-based rate limiting helper for Next.js Route Handlers.
 * Returns a 429 NextResponse if rate limit is exceeded, or null if request is allowed.
 */
export function rateLimit(request: Request, options: RateLimitOptions) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const now = Date.now();
  const windowStart = now - options.windowMs;

  // Retrieve existing timestamps for this IP and remove those outside the current window
  const timestamps = (tracker.get(ip) || []).filter((t) => t > windowStart);

  if (timestamps.length >= options.limit) {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);

    return NextResponse.json(
      {
        message: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSeconds.toString(),
        },
      },
    );
  }

  timestamps.push(now);
  tracker.set(ip, timestamps);

  return null;
}
