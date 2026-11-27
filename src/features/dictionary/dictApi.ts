// Client calls for the dictionary, with the on-device cache in front (works offline for words
// looked up before).
import type { DictEntry, TranslateResult } from "./types";
import { getEntry, putEntry } from "./dictStore";
import { offlineEntry, withVietnamese } from "./offlineDict";
import { translateOnDevice } from "./offlineTranslate";

export class DictError extends Error {
  constructor(message: string, public offline = false, public notFound = false) {
    super(message);
  }
}

const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

async function postJson(url: string, body: unknown, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(t);
  }
}

const ENTRY_TTL = 30 * 86400_000;

/** Look up an English word; Vietnamese meanings are guaranteed from the offline dictionary when the AI has none. */
export async function lookupWord(word: string): Promise<DictEntry> {
  try {
    return await withVietnamese(await lookupWordRaw(word));
  } catch (err) {
    // server / network failed: the offline dictionary still knows most words
    const off = await offlineEntry(word);
    if (off) return off;
    throw err;
  }
}

async function lookupWordRaw(word: string): Promise<DictEntry> {
  const key = word.trim().toLowerCase();
  const cached = await getEntry(key);
  if (cached && (Date.now() - cached.fetchedAt < ENTRY_TTL || isOffline())) return cached;
  if (isOffline()) throw new DictError("Đang ngoại tuyến. Từ này chưa được tra trước đó nên chưa có trên máy.", true);
  try {
    const r = await postJson("/api/dict/lookup", { word: key }, 25000);
    if (r.ok && r.data?.entry) {
      const entry = r.data.entry as DictEntry;
      if (entry.source.includes("ai")) await putEntry(entry);
      return entry;
    }
    if (cached) return cached;
    throw new DictError(r.data?.error || "Chưa tra được từ này.", false, r.status === 404);
  } catch (err) {
    if (err instanceof DictError) throw err;
    if (cached) return cached;
    throw new DictError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.", true);
  }
}

async function deviceTranslate(text: string, from: "auto" | "en" | "vi", to: "en" | "vi"): Promise<TranslateResult | null> {
  const src = from === "auto" ? (to === "vi" ? "en" : "vi") : from;
  const out = await translateOnDevice(text, src, to).catch(() => null);
  return out ? { translation: out, detectedLang: src, notes: ["Dịch trên máy (không cần mạng, Google ML Kit) – có thể chưa tự nhiên, hãy đọc lại nhé."] } : null;
}

export async function translateText(text: string, from: "auto" | "en" | "vi", to: "en" | "vi"): Promise<TranslateResult> {
  if (isOffline()) {
    const local = await deviceTranslate(text, from, to);
    if (local) return local;
    throw new DictError("Đang ngoại tuyến. Dịch câu cần có mạng (hoặc bật “Dịch không cần mạng” trên điện thoại Android).", true);
  }
  let firstError: DictError;
  try {
    const r = await postJson("/api/translate", { text, from, to }, 40000);
    if (r.ok && r.data?.result) return r.data.result as TranslateResult;
    firstError = new DictError(r.data?.error || "Chưa dịch được lúc này.");
  } catch (err) {
    firstError = err instanceof DictError ? err : new DictError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.", true);
  }
  // AI unavailable: on-device translation (Android, if enabled), then free machine translation (MyMemory)
  const local = await deviceTranslate(text, from, to);
  if (local) return local;
  const fallback = await machineTranslate(text, from, to).catch(() => null);
  if (fallback) return fallback;
  throw firstError;
}

async function machineTranslate(text: string, from: "auto" | "en" | "vi", to: "en" | "vi"): Promise<TranslateResult | null> {
  const src = from === "auto" ? (to === "vi" ? "en" : "vi") : from;
  if (src === to) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${src}|${to}`;
    const res = await fetch(url, { signal: ctrl.signal });
    const data = await res.json();
    const out = String(data?.responseData?.translatedText || "").trim();
    if (!out || data?.responseStatus !== 200 || out.toLowerCase() === text.trim().toLowerCase()) return null;
    return {
      translation: out,
      detectedLang: src,
      notes: ["Bản dịch máy (MyMemory) vì AI đang tạm nghỉ – có thể chưa tự nhiên, hãy đọc lại nhé."],
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Short English input (1–3 words) → dictionary; anything else → translation. */
export function isDictionaryQuery(text: string): boolean {
  const t = text.trim();
  return /^[A-Za-z][A-Za-z'’ -]*$/.test(t) && t.split(/\s+/).length <= 3 && t.length <= 60;
}
