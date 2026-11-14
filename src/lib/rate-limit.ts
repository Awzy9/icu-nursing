/**
 * Best-effort, per-instance sliding-window limiter for server actions.
 * Serverless instances do not share memory, so this only blunts bursts; the real defences are
 * Supabase Auth's own rate limits and the hosting firewall (see docs/SECURITY.md).
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 8, windowMs = 60_000, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return true;
}

export const _resetRateLimit = () => hits.clear();
