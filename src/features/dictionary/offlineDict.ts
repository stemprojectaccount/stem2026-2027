// Offline English⇄Vietnamese dictionary (Wiktionary data, CC BY-SA – see public/dict/LICENSE.txt).
// Built by scripts/build-offline-dict.cjs into gzip-compressed buckets public/dict/{en,vi}/<letter>.dat,
// loaded on demand (one small file per first letter) and kept in memory.
// Used when the AI cannot give Vietnamese meanings (no credit / offline) and for Vietnamese → English search.
import type { DictEntry } from "./types";

type EnRec = { w: string; i?: string; p: [string, string, string[]][] };
type ViRec = { w: string; p?: [string, string[]][]; x?: string[] };

const POS_VI: Record<string, string> = { n: "Danh từ", v: "Động từ", adj: "Tính từ", adv: "Phó từ", pron: "Đại từ", prep: "Giới từ", conj: "Liên từ", intj: "Thán từ", det: "Mạo từ / Hạn định từ", num: "Số từ", part: "Tiểu từ", phr: "Cụm từ", abbr: "Viết tắt", x: "Khác" };
const POS_EN: Record<string, string> = { n: "noun", v: "verb", adj: "adjective", adv: "adverb", pron: "pronoun", prep: "preposition", conj: "conjunction", intj: "interjection", det: "determiner", num: "numeral", part: "particle", phr: "phrase", abbr: "abbreviation", x: "other" };
export const posViLabel = (code: string) => POS_VI[code] || code;

// keep in sync with scripts/build-offline-dict.cjs
const TONE_FIX: [string, string][] = [["òa", "oà"], ["óa", "oá"], ["ỏa", "oả"], ["õa", "oã"], ["ọa", "oạ"], ["òe", "oè"], ["óe", "oé"], ["ỏe", "oẻ"], ["õe", "oẽ"], ["ọe", "oẹ"], ["ùy", "uỳ"], ["úy", "uý"], ["ủy", "uỷ"], ["ũy", "uỹ"], ["ụy", "uỵ"]];
export function viKey(s: string): string {
  let t = s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
  for (const [a, b] of TONE_FIX) t = t.split(a).join(b);
  return t;
}
const stripVi = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
const bucketEn = (w: string) => (/^[a-z]/.test(w) ? w[0] : "_");
const bucketVi = (w: string) => {
  const c = stripVi(w).toLowerCase()[0] || "_";
  return /[a-z]/.test(c) ? c : "_";
};

const cache = new Map<string, Promise<Record<string, unknown>>>();
async function loadBucket(kind: "en" | "vi", b: string): Promise<Record<string, unknown>> {
  const key = `${kind}/${b}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      const res = await fetch(`/dict/${key}.dat`);
      if (!res.ok || !res.body) throw new Error(`dict ${key}: ${res.status}`);
      if (typeof DecompressionStream === "undefined") throw new Error("DecompressionStream unsupported");
      const stream = res.body.pipeThrough(new DecompressionStream("gzip"));
      return (await new Response(stream).json()) as Record<string, unknown>;
    })();
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

/** Vietnamese meanings of an English word/phrase, or null. */
export async function offlineEnVi(word: string): Promise<EnRec | null> {
  const k = word.trim().toLowerCase().replace(/’/g, "'");
  if (!k) return null;
  try {
    const b = await loadBucket("en", bucketEn(k));
    return (b[k] as EnRec) || null;
  } catch {
    return null;
  }
}

/** Groups of Vietnamese meanings, ready for the word card. */
export function viGroups(rec: EnRec): { pos: string; posVi: string; meanings: string[] }[] {
  return rec.p.map(([c, title, m]) => ({ pos: POS_EN[c] || c, posVi: title || POS_VI[c] || c, meanings: m }));
}

const CLASSIFIERS = /^(con|cái|chiếc|quyển|cuốn|quả|trái|cây|người|sự|việc|bức|tờ|đôi|bộ)\s+/;

export interface ViEnResult {
  word: string;
  groups: { pos: string; posVi: string; english: string[] }[];
  related: string[];
}
/** English equivalents of a Vietnamese word/phrase (also tries without a classifier: "con chó" → "chó"). */
export async function offlineViEn(text: string): Promise<ViEnResult | null> {
  const tries = [viKey(text)];
  const without = tries[0].replace(CLASSIFIERS, "");
  if (without !== tries[0]) tries.push(without);
  for (const k of tries) {
    try {
      const b = await loadBucket("vi", bucketVi(k));
      const r = b[k] as ViRec | undefined;
      if (!r) continue;
      return {
        word: r.w,
        groups: (r.p || []).map(([c, m]) => ({ pos: POS_EN[c] || c, posVi: POS_VI[c] || c, english: m })),
        related: (r.x || []).filter((e) => !(r.p || []).some(([, m]) => m.some((g) => g.toLowerCase() === e.toLowerCase()))),
      };
    } catch {
      return null;
    }
  }
  return null;
}

/** Does the text look Vietnamese (has Vietnamese letters / tone marks)? */
export const looksVietnamese = (t: string) => /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(t);

/**
 * Make sure an entry has Vietnamese meanings: when the AI gave none, the offline Vietnamese meanings
 * become the main senses and the English definitions move to `enDefinitions`.
 */
const brokenIpa = (s?: string) => !s || /^\/?\s*[-‐]/.test(s) || s.replace(/[/\s]/g, "").length < 2;

export async function withVietnamese(entry: DictEntry): Promise<DictEntry> {
  const hasVi = entry.partsOfSpeech.some((p) => p.senses.some((s) => s.meaningVi));
  const needIpa = brokenIpa(entry.ipaUs) || (!!entry.ipaUk && brokenIpa(entry.ipaUk));
  if (hasVi && !needIpa) return entry;
  const rec = await offlineEnVi(entry.word);
  if (!rec) return entry;
  // the online dictionary sometimes gives only part of the IPA ("/-mɪnt/"): use the full one
  if (needIpa && rec.i) {
    entry = { ...entry, ipaUs: brokenIpa(entry.ipaUs) ? rec.i : entry.ipaUs, ipaUk: entry.ipaUk && brokenIpa(entry.ipaUk) ? undefined : entry.ipaUk };
  }
  if (hasVi) return entry;
  const enDefinitions = entry.partsOfSpeech
    .map((p) => ({ pos: p.pos, defs: p.senses.filter((s) => s.meaningEn).map((s) => ({ en: s.meaningEn as string, example: s.examples[0]?.en })) }))
    .filter((d) => d.defs.length);
  const examplesByPos = new Map(entry.partsOfSpeech.map((p) => [p.pos, p.senses.flatMap((s) => s.examples).slice(0, 2)]));
  return {
    ...entry,
    ipaUs: brokenIpa(entry.ipaUs) ? rec.i : entry.ipaUs,
    partsOfSpeech: viGroups(rec).map((g) => ({
      pos: g.pos,
      posVi: g.posVi,
      senses: g.meanings.map((m, i) => ({ meaningVi: m, examples: i === 0 ? examplesByPos.get(g.pos) || [] : [] })),
    })),
    enDefinitions: enDefinitions.length ? enDefinitions : entry.enDefinitions,
    source: entry.source.includes("offline") ? entry.source : [...entry.source, "offline"],
  };
}

// ---------- core entries of the textbook words (scripts/build-offline-core.ts) ----------
type CoreRec = { ipaUs?: string; ipaUk?: string; audioUs?: string; audioUk?: string; d: { pos: string; defs: { en: string; example?: string }[] }[]; syn?: string[] };
let corePromise: Promise<Record<string, CoreRec>> | null = null;
async function coreEntry(word: string): Promise<CoreRec | null> {
  if (!corePromise) {
    corePromise = (async () => {
      const res = await fetch("/dict/core.dat");
      if (!res.ok || !res.body || typeof DecompressionStream === "undefined") return {};
      return (await new Response(res.body.pipeThrough(new DecompressionStream("gzip"))).json()) as Record<string, CoreRec>;
    })().catch(() => ({}));
  }
  return (await corePromise)[word.toLowerCase()] || null;
}

async function unitsOf(word: string): Promise<DictEntry["textbookUnits"]> {
  const [{ TEXTBOOK_WORDS }, { ENGLISH_UNITS }] = await Promise.all([import("../../data/textbookWords"), import("../../data/gameCurriculum")]);
  const w = word.toLowerCase();
  return TEXTBOOK_WORDS.filter((t) => t.word === w).map((t) => {
    const unit = (ENGLISH_UNITS as Record<string, { id: string; label: string }[]>)[t.grade]?.find((u) => u.id === t.unitId);
    return { grade: t.grade, unitId: t.unitId, label: unit?.label || t.unitId };
  });
}

/** A complete entry from the offline data alone (no internet / server). */
export async function offlineEntry(word: string): Promise<DictEntry | null> {
  const rec = await offlineEnVi(word);
  if (!rec) return null;
  const [core, units] = await Promise.all([coreEntry(rec.w), unitsOf(rec.w).catch(() => [])]);
  return {
    word: rec.w,
    ipaUs: core?.ipaUs && !brokenIpa(core.ipaUs) ? core.ipaUs : rec.i,
    ipaUk: core?.ipaUk && !brokenIpa(core.ipaUk) ? core.ipaUk : undefined,
    audioUs: core?.audioUs,
    audioUk: core?.audioUk,
    partsOfSpeech: viGroups(rec).map((g) => ({ pos: g.pos, posVi: g.posVi, senses: g.meanings.map((m) => ({ meaningVi: m, examples: [] })) })),
    enDefinitions: core?.d.length ? core.d : undefined,
    collocations: [],
    synonyms: core?.syn || [],
    antonyms: [],
    wordFamily: [],
    textbookUnits: units,
    source: core ? ["offline", "freedict"] : ["offline"],
    fetchedAt: Date.now(),
  };
}
