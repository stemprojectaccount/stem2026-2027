// On-device storage for the dictionary: cached entries (offline lookups), search history and the
// word book. IndexedDB when available, localStorage otherwise.
import type { DictEntry, WordBookItem } from "./types";

const DB_NAME = "smartstudy-dict";
const DB_VERSION = 1;
const STORES = ["entries", "history", "wordbook"] as const;
type StoreName = (typeof STORES)[number];

export interface HistoryItem {
  q: string; // word or text
  kind: "word" | "text";
  at: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

const lsKey = (store: StoreName) => `smartstudy_dict_${store}_v1`;
function lsRead(store: StoreName): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(lsKey(store)) || "{}");
  } catch {
    return {};
  }
}
function lsWrite(store: StoreName, data: Record<string, unknown>) {
  try {
    localStorage.setItem(lsKey(store), JSON.stringify(data));
  } catch {
    // full
  }
}

async function get<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return lsRead(store)[key] as T | undefined;
  return new Promise((resolve) => {
    const r = db.transaction(store, "readonly").objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => resolve(undefined);
  });
}

async function put(store: StoreName, key: string, value: unknown): Promise<void> {
  const db = await openDb();
  if (!db) {
    const all = lsRead(store);
    all[key] = value;
    lsWrite(store, all);
    return;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function del(store: StoreName, key: string): Promise<void> {
  const db = await openDb();
  if (!db) {
    const all = lsRead(store);
    delete all[key];
    lsWrite(store, all);
    return;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function all<T>(store: StoreName): Promise<T[]> {
  const db = await openDb();
  if (!db) return Object.values(lsRead(store)) as T[];
  return new Promise((resolve) => {
    const r = db.transaction(store, "readonly").objectStore(store).getAll();
    r.onsuccess = () => resolve((r.result || []) as T[]);
    r.onerror = () => resolve([]);
  });
}

// ---------- entries ----------
export const getEntry = (word: string) => get<DictEntry>("entries", word.toLowerCase());
export const putEntry = (entry: DictEntry) => put("entries", entry.word.toLowerCase(), entry);

// ---------- history ----------
export async function addHistory(item: Omit<HistoryItem, "at">) {
  const key = `${item.kind}:${item.q.toLowerCase().slice(0, 120)}`;
  await put("history", key, { ...item, at: Date.now() });
  const items = await all<HistoryItem & { at: number }>("history");
  if (items.length > 100) {
    const old = items.sort((a, b) => a.at - b.at).slice(0, items.length - 100);
    for (const o of old) await del("history", `${o.kind}:${o.q.toLowerCase().slice(0, 120)}`);
  }
}
export async function listHistory(limit = 20): Promise<HistoryItem[]> {
  return (await all<HistoryItem>("history")).sort((a, b) => b.at - a.at).slice(0, limit);
}
export async function clearHistory() {
  for (const h of await all<HistoryItem>("history")) await del("history", `${h.kind}:${h.q.toLowerCase().slice(0, 120)}`);
}

// ---------- word book ----------
const WB_EVENT = "smartstudy-wordbook-changed";
export const onWordbookChange = (cb: () => void) => {
  window.addEventListener(WB_EVENT, cb);
  return () => window.removeEventListener(WB_EVENT, cb);
};
const notify = () => window.dispatchEvent(new Event(WB_EVENT));

export async function saveWord(entry: DictEntry) {
  const existing = await get<WordBookItem>("wordbook", entry.word.toLowerCase());
  await put("wordbook", entry.word.toLowerCase(), {
    ...(existing || { status: "new", addedAt: Date.now() }),
    word: entry.word,
    entry,
  } as WordBookItem);
  notify();
}
export async function removeWord(word: string) {
  await del("wordbook", word.toLowerCase());
  notify();
}
export async function setWordStatus(word: string, status: WordBookItem["status"]) {
  const item = await get<WordBookItem>("wordbook", word.toLowerCase());
  if (!item) return;
  await put("wordbook", word.toLowerCase(), { ...item, status });
  notify();
}
/** Update a saved word (returns the new item, or null if the word is not saved). */
export async function updateWord(word: string, patch: Partial<WordBookItem>): Promise<WordBookItem | null> {
  const item = await get<WordBookItem>("wordbook", word.toLowerCase());
  if (!item) return null;
  const next = { ...item, ...patch };
  await put("wordbook", word.toLowerCase(), next);
  notify();
  return next;
}
/** Pronunciation practice on a saved word: count attempts and good ones (returns false if the word is not saved). */
export async function notePractice(word: string, good: boolean): Promise<boolean> {
  const item = await get<WordBookItem>("wordbook", word.toLowerCase());
  if (!item) return false;
  await put("wordbook", word.toLowerCase(), { ...item, practiceCount: (item.practiceCount || 0) + 1, practiceGood: (item.practiceGood || 0) + (good ? 1 : 0) });
  notify();
  return true;
}
export const isSaved = async (word: string) => !!(await get<WordBookItem>("wordbook", word.toLowerCase()));
export async function listWordbook(): Promise<WordBookItem[]> {
  return (await all<WordBookItem>("wordbook")).sort((a, b) => b.addedAt - a.addedAt);
}
