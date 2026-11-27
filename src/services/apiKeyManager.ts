/**
 * MODULE: Smart 4+ API Keys Rotation & Auto-Failover Engine
 * Phụ trách bởi: CLAUDE CODE 1 (xem TRAO-DOI-CLAUDE-1.md)
 *
 * Plain engine with no secrets inside: it keeps a pool of keys, picks the current healthy key,
 * and when a call fails because of the key (429 / 401 / 403 / 5xx / quota / rate limit /
 * exhausted) it rests that key (cooldown) and retries the same call with the next key at once.
 *
 *  - The server (src/server/aiPool.ts) uses it for the real Gemini / OpenAI-compatible keys.
 *    Keys never reach the browser.
 *  - New keys reach the server through POST /api/ai-keys (local app only, see server.ts).
 *  - Tests can use `new ApiKeyRotationManager()` directly with fake keys.
 *
 * Contract (AGENT_SYNC / Cursor / OpenCode):
 *   executeWithFailover(async (apiKey) => …), setApiKeys(keys[]), getPoolStatusForUI()
 */

export type KeyStatus = "ACTIVE" | "COOLDOWN" | "EXHAUSTED";

export interface PoolKey<M = unknown> {
  id: string; // API_KEY_1, API_KEY_2…
  key: string;
  name: string;
  meta?: M; // e.g. { type: "gemini" | "openai", baseUrl, model } on the server
  status: KeyStatus;
  cooldownUntil: number;
  failCount: number;
  successCount: number;
  lastError?: string;
  lastStatus?: number;
}

export interface KeyEntryInput<M = unknown> {
  key: string;
  name?: string;
  meta?: M;
}

export interface PoolStatusItem {
  id: string;
  name: string;
  maskedKey: string;
  status: KeyStatus;
  isCurrent: boolean;
  failCount: number;
  successCount: number;
  cooldownRemainingMs: number;
  lastError?: string;
  type?: string;
}

/** Optional place to keep the user's own keys (server: userData/ai-keys.json). */
export interface KeyStorage {
  load(): Promise<string[] | null> | string[] | null;
  save(keys: string[]): Promise<void> | void;
}

export interface FailureInfo {
  /** true: the key is the problem → rest it and try the next key */
  failover: boolean;
  /** how long to rest the key (ms) */
  cooldownMs: number;
  /** wrong / blocked / out-of-credit key (EXHAUSTED) rather than a short rate limit (COOLDOWN) */
  exhausted: boolean;
  status: number;
}

const MIN = 60_000;

export function statusOfError(err: unknown): number {
  const e = err as { status?: unknown; code?: unknown; response?: { status?: unknown }; message?: unknown };
  const s = Number(e?.status ?? e?.response?.status ?? e?.code);
  if (Number.isFinite(s) && s >= 100 && s < 600) return s;
  const m = String(e?.message ?? "").match(/\b(4\d\d|5\d\d)\b/);
  return m ? Number(m[1]) : 0;
}

/**
 * Is this error the key's fault, and how long should the key rest?
 *  - out of credit / quota / exhausted   → EXHAUSTED 30 min
 *  - 401 / 403 / invalid key              → EXHAUSTED 60 min
 *  - 429 / rate limit / too many requests → COOLDOWN 60 s
 *  - 5xx / network / timeout              → COOLDOWN 60 s
 *  - anything else (400 bad request…)    → not the key: no failover, the error is returned
 */
export function classifyFailure(err: unknown): FailureInfo {
  const status = statusOfError(err);
  const msg = String((err as { message?: unknown })?.message ?? err ?? "").toLowerCase();
  const name = String((err as { name?: unknown })?.name ?? "");
  if (status === 402 || /quota|exhausted|credit|billing|insufficient|balance/.test(msg)) {
    // A per-minute quota comes back in a minute; a daily quota / no credit does not
    const perMinute = /per minute|perminute|per_minute|requests per min/.test(msg);
    return perMinute
      ? { failover: true, cooldownMs: MIN, exhausted: false, status }
      : { failover: true, cooldownMs: 30 * MIN, exhausted: true, status };
  }
  if (status === 401 || status === 403 || /api key not valid|invalid api key|api_key_invalid|unauthori[sz]ed|permission denied|forbidden/.test(msg)) {
    return { failover: true, cooldownMs: 60 * MIN, exhausted: true, status };
  }
  if (status === 429 || /rate limit|rate_limit|too many requests/.test(msg)) {
    return { failover: true, cooldownMs: MIN, exhausted: false, status };
  }
  if (status >= 500 || name === "AbortError" || /timeout|timed out|econnreset|enotfound|network|fetch failed|overloaded|unavailable|hết thời gian/.test(msg)) {
    return { failover: true, cooldownMs: MIN, exhausted: false, status };
  }
  return { failover: false, cooldownMs: 0, exhausted: false, status };
}

export function maskKey(key: string): string {
  const k = String(key || "");
  if (k.length <= 10) return "••••••••";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}

/** Thrown when every key failed; `errors` holds one entry per key tried. */
export class AllKeysFailedError extends Error {
  status: number;
  errors: { id: string; message: string; status: number }[];
  lastError: unknown;
  constructor(tried: { id: string; message: string; status: number }[], lastError: unknown) {
    super(
      tried.length
        ? `Đã thử toàn bộ ${tried.length} API key dự phòng nhưng đều lỗi. Lỗi cuối: ${tried[tried.length - 1].message}`
        : "Chưa có API key nào."
    );
    this.name = "AllKeysFailedError";
    this.errors = tried;
    this.lastError = lastError;
    // keep the most meaningful status for the caller (e.g. 429 → "quá tải, thử lại sau")
    this.status = statusOfError(lastError) || (tried.length ? 503 : 401);
  }
}

export interface ManagerOptions {
  keys?: (string | KeyEntryInput)[];
  storage?: KeyStorage;
  /** override error classification (default: classifyFailure) */
  classify?: (err: unknown) => FailureInfo;
  /** for tests */
  now?: () => number;
  /** log each switch (default: console.warn) */
  log?: (message: string) => void;
}

export class ApiKeyRotationManager<M = unknown> {
  private keyPool: PoolKey<M>[] = [];
  private currentIndex = 0;
  private readonly storage?: KeyStorage;
  private readonly classify: (err: unknown) => FailureInfo;
  private readonly now: () => number;
  private readonly log: (message: string) => void;

  constructor(options: ManagerOptions = {}) {
    this.storage = options.storage;
    this.classify = options.classify || classifyFailure;
    this.now = options.now || (() => Date.now());
    this.log = options.log || ((m) => console.warn(m));
    if (options.keys) this.setKeyEntries(options.keys as (string | KeyEntryInput<M>)[]);
  }

  get size() {
    return this.keyPool.length;
  }

  /** Loads the user's saved keys from the storage (if any). Returns how many were loaded. */
  async initKeyPool(): Promise<number> {
    if (!this.storage) return this.keyPool.length;
    const saved = await this.storage.load();
    if (Array.isArray(saved) && saved.length) this.setKeyEntries(saved);
    return this.keyPool.length;
  }

  /** Replaces the pool without saving (server built-in keys, tests). Keeps health counters of keys that stay. */
  setKeyEntries(entries: (string | KeyEntryInput<M>)[]) {
    const old = new Map(this.keyPool.map((k) => [k.key, k]));
    const seen = new Set<string>();
    const next: PoolKey<M>[] = [];
    for (const raw of entries || []) {
      const e: KeyEntryInput<M> = typeof raw === "string" ? { key: raw } : raw;
      const key = String(e?.key ?? "").trim();
      if (key.length <= 5 || seen.has(key)) continue;
      seen.add(key);
      const prev = old.get(key);
      const n = next.length + 1;
      next.push({
        id: `API_KEY_${n}`,
        key,
        name: e.name || prev?.name || `Khoá ${n}`,
        meta: e.meta ?? prev?.meta,
        status: prev?.status ?? "ACTIVE",
        cooldownUntil: prev?.cooldownUntil ?? 0,
        failCount: prev?.failCount ?? 0,
        successCount: prev?.successCount ?? 0,
        lastError: prev?.lastError,
        lastStatus: prev?.lastStatus,
      });
    }
    this.keyPool = next;
    if (this.currentIndex >= next.length) this.currentIndex = 0;
  }

  /** User / settings screen: new keys (4+ recommended). Saved to the storage when there is one. */
  async setApiKeys(newKeys: string[]): Promise<void> {
    if (!Array.isArray(newKeys)) return;
    const clean = newKeys.map((k) => String(k ?? "").trim()).filter((k) => k.length > 5);
    this.setKeyEntries(clean);
    this.currentIndex = 0;
    if (this.storage) await this.storage.save(clean);
  }

  /** Masked status for the settings screen. Never contains the key itself. */
  getPoolStatusForUI(): PoolStatusItem[] {
    const now = this.now();
    return this.keyPool.map((k, idx) => {
      this.refresh(k, now);
      return {
        id: k.id,
        name: k.name,
        maskedKey: maskKey(k.key),
        status: k.status,
        isCurrent: idx === this.currentIndex,
        failCount: k.failCount,
        successCount: k.successCount,
        cooldownRemainingMs: Math.max(0, k.cooldownUntil - now),
        lastError: k.lastError,
        type: (k.meta as { type?: string } | undefined)?.type,
      };
    });
  }

  private refresh(k: PoolKey<M>, now: number) {
    if (k.status !== "ACTIVE" && now >= k.cooldownUntil) k.status = "ACTIVE";
  }

  /** The healthy key to use now (rotating from the current one), or the one that rests the shortest. */
  getAvailableKeyObject(filter?: (k: PoolKey<M>) => boolean): PoolKey<M> | null {
    return this.attemptOrder(filter)[0] || null;
  }

  /** Every usable key once: healthy keys from the current one onwards, then resting keys (shortest rest first). */
  private attemptOrder(filter?: (k: PoolKey<M>) => boolean): PoolKey<M>[] {
    const now = this.now();
    const total = this.keyPool.length;
    const healthy: PoolKey<M>[] = [];
    const resting: PoolKey<M>[] = [];
    for (let offset = 0; offset < total; offset++) {
      const k = this.keyPool[(this.currentIndex + offset) % total];
      if (filter && !filter(k)) continue;
      this.refresh(k, now);
      (k.status === "ACTIVE" ? healthy : resting).push(k);
    }
    resting.sort((a, b) => a.cooldownUntil - b.cooldownUntil);
    return [...healthy, ...resting];
  }

  /** Rests the key and moves the pointer to the next key. */
  markKeyFailed(keyObj: PoolKey<M>, errOrStatus: unknown = 429) {
    const info =
      typeof errOrStatus === "number"
        ? this.classify(Object.assign(new Error(`HTTP ${errOrStatus}`), { status: errOrStatus }))
        : this.classify(errOrStatus);
    keyObj.failCount += 1;
    keyObj.lastStatus = info.status;
    keyObj.lastError = String((errOrStatus as { message?: unknown })?.message ?? `HTTP ${info.status}`).slice(0, 200);
    keyObj.status = info.exhausted ? "EXHAUSTED" : "COOLDOWN";
    keyObj.cooldownUntil = this.now() + (info.cooldownMs || MIN);
    const idx = this.keyPool.indexOf(keyObj);
    if (idx >= 0 && this.keyPool.length) this.currentIndex = (idx + 1) % this.keyPool.length;
  }

  markKeySucceeded(keyObj: PoolKey<M>) {
    keyObj.successCount += 1;
    keyObj.failCount = 0;
    keyObj.status = "ACTIVE";
    keyObj.cooldownUntil = 0;
    keyObj.lastError = undefined;
    const idx = this.keyPool.indexOf(keyObj);
    if (idx >= 0) this.currentIndex = idx; // stay on the key that works
  }

  /**
   * Runs `apiCallFn(apiKey)` with the current key. If the key is out of quota / rate limited /
   * rejected / the host is down, the key is rested and the call is retried at once with the next
   * key, until one works or every key was tried once. Errors that are not the key's fault
   * (e.g. a bad request) are thrown straight away.
   */
  async executeWithFailover<R>(
    apiCallFn: (apiKey: string, keyObj: PoolKey<M>) => Promise<R>,
    options: { filter?: (k: PoolKey<M>) => boolean } = {}
  ): Promise<R> {
    const order = this.attemptOrder(options.filter);
    if (!order.length) throw new AllKeysFailedError([], Object.assign(new Error("Chưa có API key nào."), { status: 401 }));
    const tried: { id: string; message: string; status: number }[] = [];
    let lastError: unknown = null;
    for (const keyObj of order) {
      try {
        const result = await apiCallFn(keyObj.key, keyObj);
        this.markKeySucceeded(keyObj);
        return result;
      } catch (error) {
        const info = this.classify(error);
        if (!info.failover) throw error; // the request itself is wrong: another key would not help
        lastError = error;
        tried.push({ id: keyObj.id, message: String((error as { message?: unknown })?.message ?? error).slice(0, 200), status: info.status });
        this.markKeyFailed(keyObj, error);
        this.log(`[Auto-Failover] ${keyObj.name} (${keyObj.id}) lỗi ${info.status || "mạng"} → chuyển sang khoá tiếp theo`);
      }
    }
    throw new AllKeysFailedError(tried, lastError);
  }
}
