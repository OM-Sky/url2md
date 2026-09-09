interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const LIMIT = 10;

function getResetAt(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return midnight.getTime();
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: getResetAt() };
  }

  if (entry.count >= LIMIT) {
    store.set(ip, entry);
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(ip, entry);
  return { allowed: true, remaining: LIMIT - entry.count, resetAt: entry.resetAt };
}
