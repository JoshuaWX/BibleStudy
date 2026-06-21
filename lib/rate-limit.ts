type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export function createMemoryRateLimiter(windowMs: number, maxRequests: number) {
  const entries = new Map<string, RateLimitEntry>();

  return function isRateLimited(key: string) {
    const now = Date.now();
    const current = entries.get(key);

    if (!current || current.resetAt <= now) {
      entries.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    current.count += 1;
    return current.count > maxRequests;
  };
}
