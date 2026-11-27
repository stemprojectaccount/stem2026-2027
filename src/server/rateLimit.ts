// One per-key limiter shared by all routes, so one device cannot use up the shared AI credit.
const hits = new Map<string, number[]>();

/** True while `key` made fewer than `perMinute` allowed calls in the last minute. */
export function allow(key: string, perMinute: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < 60_000);
  if (list.length >= perMinute) return false;
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear(); // shortcut: forgets everyone at once, fine for a school-sized server
  return true;
}
