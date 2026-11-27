// AI key pool with automatic failover.
//
// Keys live in the api-keys/ folder (api-keys/keys.env, see api-keys/HUONG-DAN.txt). Each key is
// either a Google Gemini key, or a key from an "OpenAI-compatible" host bought online (any
// service with a /v1/chat/completions endpoint). Keys are tried in order; when one fails
// (out of credit, quota, wrong key, host down) it is rested for a while and the next key is used
// automatically. The rest of the server keeps calling ai.models.generateContent(...) as before.
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  AllKeysFailedError,
  ApiKeyRotationManager,
  classifyFailure,
  type FailureInfo,
  type PoolKey,
  type PoolStatusItem,
} from "../services/apiKeyManager";

export interface AiKeyEntry {
  name: string;
  type: "gemini" | "openai";
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

/** The subset of @google/genai used by the server. */
export interface AiClient {
  models: { generateContent(params: any): Promise<any> };
}

const clean = (v: unknown) => String(v ?? "").trim();

function parseKeysEnv(text: string): AiKeyEntry[] {
  const vars = dotenv.parse(text);
  const out: AiKeyEntry[] = [];
  for (let i = 1; i <= 20; i++) {
    const apiKey = clean(vars[`KEY_${i}_API_KEY`]);
    if (!apiKey) continue;
    const rawType = clean(vars[`KEY_${i}_TYPE`]).toLowerCase();
    out.push({
      name: clean(vars[`KEY_${i}_NAME`]) || `Khoá ${i}`,
      type: rawType === "openai" || rawType === "openai-compatible" ? "openai" : "gemini",
      apiKey,
      baseUrl: clean(vars[`KEY_${i}_BASE_URL`]).replace(/\/+$/, "") || undefined,
      model: clean(vars[`KEY_${i}_MODEL`]) || undefined,
    });
  }
  return out;
}

/** All configured keys, in priority order. */
export function loadAiKeys(): AiKeyEntry[] {
  const keys: AiKeyEntry[] = [];
  // 1. Packaged desktop app: keys embedded (encrypted) at build time
  if (process.env.SMARTSTUDY_AI_KEYS_JSON) {
    try {
      const arr = JSON.parse(process.env.SMARTSTUDY_AI_KEYS_JSON);
      if (Array.isArray(arr)) keys.push(...arr.filter((k) => k && k.apiKey));
    } catch {
      // ignore
    }
  }
  // 2. api-keys/keys.env next to the server
  for (const root of [process.env.SMARTSTUDY_APP_ROOT, process.cwd()]) {
    if (!root) continue;
    const file = path.join(root, "api-keys", "keys.env");
    if (fs.existsSync(file)) {
      keys.push(...parseKeysEnv(fs.readFileSync(file, "utf8")));
      break;
    }
  }
  // 3. Older single key (api-keys.env / .env / environment)
  const legacy = clean(process.env.GEMINI_API_KEY);
  if (legacy) keys.push({ name: "GEMINI_API_KEY", type: "gemini", apiKey: legacy });

  const seen = new Set<string>();
  return keys.filter((k) => (seen.has(k.apiKey) ? false : (seen.add(k.apiKey), true)));
}

// ---------- error classification ----------
function statusOf(err: any): number {
  const s = Number(err?.status ?? err?.code ?? err?.response?.status);
  if (Number.isFinite(s) && s > 0) return s;
  const m = String(err?.message || "").match(/\b(4\d\d|5\d\d)\b/);
  return m ? Number(m[1]) : 0;
}

/** How long to rest a key after this error (ms); 0 = do not rest (request problem, not the key). */
function restFor(err: any): number {
  const status = statusOf(err);
  const msg = String(err?.message || "").toLowerCase();
  if (status === 402 || /credit|billing|insufficient|balance|quota|exhausted/.test(msg)) return 30 * 60_000;
  if (status === 401 || status === 403 || /api key|apikey|unauthori[sz]ed|permission/.test(msg)) return 60 * 60_000;
  if (status === 429 || /rate limit|too many/.test(msg)) return 2 * 60_000;
  if (status >= 500 || status === 0) return 60_000; // host down / network
  return 0;
}

// A key that has not answered by then is treated as down, so the next key gets the request.
// shortcut: a very long answer (whole lesson) slower than this fails over too, raise it if that shows up in the logs
const KEY_TIMEOUT_MS = 45_000;
// gemini-3.8-flash often took over 2 minutes (Nov 2026); flash-lite answers the same prompt in ~1.5 s
const FAST_GEMINI: Record<string, string> = { "gemini-3.8-flash": "gemini-3.5-flash-lite" };

// ---------- OpenAI-compatible hosts ----------
function partsToText(parts: any[]): { text: string; images: string[] } {
  let text = "";
  const images: string[] = [];
  for (const p of parts || []) {
    if (typeof p === "string") text += p;
    else if (p?.text) text += p.text;
    else if (p?.inlineData?.data) images.push(`data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}`);
  }
  return { text, images };
}

function toMessages(params: any) {
  const messages: any[] = [];
  const sys = params?.config?.systemInstruction;
  const sysText = typeof sys === "string" ? sys : sys?.parts ? partsToText(sys.parts).text : sys?.text || "";
  let system = sysText;
  const cfg = params?.config || {};
  if (cfg.responseMimeType === "application/json") {
    system += `${system ? "\n\n" : ""}Chỉ trả về JSON hợp lệ, không giải thích, không bọc trong \`\`\`.`;
    if (cfg.responseSchema) system += `\nJSON phải đúng cấu trúc (schema kiểu Google) sau:\n${JSON.stringify(cfg.responseSchema)}`;
  }
  if (system) messages.push({ role: "system", content: system });

  const contents = params?.contents;
  const list = typeof contents === "string" ? [{ role: "user", parts: [{ text: contents }] }] : Array.isArray(contents) ? contents : [contents];
  for (const c of list) {
    if (!c) continue;
    if (typeof c === "string") {
      messages.push({ role: "user", content: c });
      continue;
    }
    const { text, images } = partsToText(c.parts || (c.text ? [c] : []));
    const role = c.role === "model" ? "assistant" : "user";
    if (images.length && role === "user") {
      messages.push({ role, content: [{ type: "text", text }, ...images.map((url) => ({ type: "image_url", image_url: { url } }))] });
    } else {
      messages.push({ role, content: text });
    }
  }
  return messages;
}

/** Hosts often wrap JSON in ``` fences or add a sentence: keep only the JSON. */
function extractJson(text: string): string {
  let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const first = t.search(/[[{]/);
  if (first > 0) t = t.slice(first);
  const lastObj = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (lastObj >= 0 && lastObj < t.length - 1) t = t.slice(0, lastObj + 1);
  return t;
}

async function callOpenAi(entry: AiKeyEntry, params: any) {
  const base = entry.baseUrl || "https://api.openai.com/v1";
  const cfg = params?.config || {};
  const body: any = {
    model: entry.model || params.model,
    messages: toMessages(params),
  };
  if (typeof cfg.temperature === "number") body.temperature = cfg.temperature;
  if (typeof cfg.maxOutputTokens === "number") body.max_tokens = cfg.maxOutputTokens;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), KEY_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${entry.apiKey}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data: any = await res.json().catch(() => null);
    if (!res.ok) {
      const err: any = new Error(`${entry.name}: HTTP ${res.status} ${data?.error?.message || ""}`.trim());
      err.status = res.status;
      throw err;
    }
    let text = String(data?.choices?.[0]?.message?.content ?? "");
    if (!text) throw Object.assign(new Error(`${entry.name}: phản hồi rỗng`), { status: 502 });
    if (cfg.responseMimeType === "application/json") text = extractJson(text);
    return { text, candidates: [{ content: { parts: [{ text }] } }] };
  } catch (err: any) {
    if (err?.name === "AbortError") throw Object.assign(new Error(`${entry.name}: hết thời gian chờ`), { status: 504 });
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- pool (rotation + failover: src/services/apiKeyManager.ts) ----------
type KeyMeta = Omit<AiKeyEntry, "apiKey" | "name">;

class AiPool implements AiClient {
  private gemini = new Map<string, GoogleGenAI>();
  readonly manager = new ApiKeyRotationManager<KeyMeta>({
    classify: classifyAiError,
    log: (m) => console.warn(`[AI] ${m}`),
  });
  readonly models = { generateContent: (params: any) => this.generate(params) };

  constructor(keys: AiKeyEntry[]) {
    this.setKeys(keys);
  }

  setKeys(keys: AiKeyEntry[]) {
    this.manager.setKeyEntries(keys.map((k) => ({ key: k.apiKey, name: k.name, meta: { type: k.type, baseUrl: k.baseUrl, model: k.model } })));
    // drop clients of keys that are gone
    const live = new Set(keys.map((k) => k.apiKey));
    for (const key of [...this.gemini.keys()]) if (!live.has(key)) this.gemini.delete(key);
  }

  get size() {
    return this.manager.size;
  }

  private geminiClient(apiKey: string, baseUrl?: string) {
    let c = this.gemini.get(apiKey);
    if (!c) {
      c = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" }, timeout: KEY_TIMEOUT_MS, ...(baseUrl ? { baseUrl } : {}) },
      });
      this.gemini.set(apiKey, c);
    }
    return c;
  }

  private async generate(params: any) {
    if (!this.size) {
      throw Object.assign(new Error("Chưa có khoá AI. Thêm khoá vào thư mục api-keys (xem HUONG-DAN.txt) hoặc trong Cài đặt của app."), { status: 401 });
    }
    const cfg = params?.config || {};
    // Audio (text-to-speech) and Google Search grounding only work with Gemini keys
    const geminiOnly = (Array.isArray(cfg.responseModalities) && cfg.responseModalities.some((m: string) => String(m).toUpperCase() !== "TEXT")) || Array.isArray(cfg.tools);
    const filter = geminiOnly ? (k: PoolKey<KeyMeta>) => k.meta?.type !== "openai" : undefined;
    if (filter && !this.manager.getAvailableKeyObject(filter)) {
      throw Object.assign(new Error("Tính năng này cần khoá Google Gemini."), { status: 400 });
    }
    try {
      return await this.manager.executeWithFailover(async (apiKey, k) => {
        const meta = k.meta || { type: "gemini" as const };
        // a 400 from a router often means "this host cannot do it" (e.g. no images): let the next key try
        if (meta.type === "openai")
          return callOpenAi({ name: k.name, apiKey, ...meta }, params).catch((e) => {
            if (statusOf(e) === 400) e.hostRejected = true;
            throw e;
          });
        const model = geminiOnly ? params.model : meta.model || FAST_GEMINI[params.model] || params.model;
        return this.geminiClient(apiKey, meta.baseUrl).models.generateContent({ ...params, model });
      }, { filter });
    } catch (err: any) {
      // every key failed: hand the last real error to the route (same behaviour as before)
      if (err instanceof AllKeysFailedError && err.lastError) throw err.lastError;
      throw err;
    }
  }
}

/** The pool's view of errors: same rest times as before, plus quota/limit wording. */
function classifyAiError(err: unknown): FailureInfo {
  const base = classifyFailure(err);
  if (base.failover) return base;
  // the router refused this one request: try the next key, rest only 1 s (it still serves text)
  if ((err as { hostRejected?: boolean })?.hostRejected) return { failover: true, cooldownMs: 1000, exhausted: false, status: 400 };
  // Previously every unknown failure (status 0 = network) rested the key; keep that
  const rest = restFor(err);
  return rest ? { failover: true, cooldownMs: rest, exhausted: rest >= 30 * 60_000, status: statusOf(err) } : base;
}

// ---------- keys the user adds in the app (Windows app: kept on this computer only) ----------
export function userKeysFile(): string {
  const dir = process.env.SMARTSTUDY_DATA_DIR || process.cwd();
  return path.join(dir, "api-keys", "user-keys.json");
}

export function loadUserKeys(): AiKeyEntry[] {
  try {
    const data = JSON.parse(fs.readFileSync(userKeysFile(), "utf8"));
    const list = Array.isArray(data?.keys) ? data.keys : [];
    return list
      .map((k: any, i: number): AiKeyEntry | null => {
        const apiKey = clean(typeof k === "string" ? k : k?.apiKey ?? k?.key);
        if (apiKey.length < 8) return null;
        const type = k?.type === "openai" ? "openai" : "gemini";
        return {
          name: clean(k?.name) || `Khoá của bạn ${i + 1}`,
          type,
          apiKey,
          baseUrl: clean(k?.baseUrl).replace(/\/+$/, "") || undefined,
          model: clean(k?.model) || undefined,
        };
      })
      .filter(Boolean) as AiKeyEntry[];
  } catch {
    return [];
  }
}

export function saveUserKeys(keys: AiKeyEntry[]) {
  const file = userKeysFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ updatedAt: new Date().toISOString(), keys }, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(tmp, file);
}

let shared: AiPool | null = null;

/** User keys first (their own quota), then the keys that ship with the app. */
function allKeys(): AiKeyEntry[] {
  const seen = new Set<string>();
  return [...loadUserKeys(), ...loadAiKeys()].filter((k) => (seen.has(k.apiKey) ? false : (seen.add(k.apiKey), true)));
}

/** One shared pool for the whole server. */
export function getAiClient(): AiClient & { size: number } {
  if (!shared) {
    shared = new AiPool(allKeys());
    console.log(`[AI] ${shared.size} khoá AI sẵn sàng${shared.size ? " (tự xoay vòng khi một khoá hết hạn mức)" : " (chưa có khoá nào: tính năng AI sẽ tắt)"}`);
  }
  return shared;
}

/** Re-reads every key source (after the user saved new keys). Health of unchanged keys is kept. */
export function reloadAiKeys(): number {
  const pool = getAiClient() as AiPool;
  pool.setKeys(allKeys());
  return pool.size;
}

/** Masked status for the settings screen: never the keys themselves. */
export function getAiKeyStatus(): PoolStatusItem[] {
  return (getAiClient() as AiPool).manager.getPoolStatusForUI();
}

export function userKeyCount(): number {
  return loadUserKeys().length;
}
