type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const requests = new Map<string, RateLimitEntry>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  const existing = requests.get(key);

  if (!existing || now >= existing.resetAt) {
    requests.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      success: true,
      remaining: limit - 1,
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
    };
  }

  existing.count++;

  return {
    success: true,
    remaining: limit - existing.count,
  };
}
