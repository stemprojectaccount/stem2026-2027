// "Tra từ & Dịch": English–Vietnamese dictionary, text translation and English read-aloud.
//
//  POST /api/dict/lookup  { word }                → { success, entry: DictEntry }
//  POST /api/translate    { text, from, to }      → { success, result: TranslateResult }
//  GET  /api/dict/tts?text=&lang=en-US|en-GB&slow → audio/mpeg
//
// Lookup pipeline: cache (memory + JSON file) → Free Dictionary API (IPA, real recordings,
// English definitions; community "best effort" service, so short timeout) → AI through the key
// pool (Vietnamese meanings, examples, collocations…) using the English data as grounding.
import type { Express, Request } from "express";
import { Type } from "@google/genai";
import fs from "fs";
import path from "path";
import type { AiClient } from "./aiPool";
import { allow as rateAllow } from "./rateLimit";
import { EDGE_VOICES, edgeSpeakVoice } from "./edgeTts";
import type { DictEntry, TranslateResult, Cefr } from "../features/dictionary/types";
import { ENGLISH_UNITS, GAME_GRADES } from "../data/gameCurriculum";
import { TEXTBOOK_WORDS } from "../data/textbookWords";

const MODEL = "gemini-3.8-flash";
const CACHE_DAYS = 30;
const MAX_ENTRIES = 2000;
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

// ---------- small helpers ----------
class Lru<V> {
  private map = new Map<string, V>();
  constructor(private max: number) {}
  get(k: string) {
    const v = this.map.get(k);
    if (v !== undefined) {
      this.map.delete(k);
      this.map.set(k, v);
    }
    return v;
  }
  set(k: string, v: V) {
    this.map.delete(k);
    this.map.set(k, v);
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }
  entries() {
    return [...this.map.entries()];
  }
}


export function normalizeWord(raw: unknown): string | null {
  const w = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ");
  if (!w || w.length > 60) return null;
  if (!/^[a-z][a-z' -]*$/.test(w)) return null;
  if (w.split(" ").length > 3) return null;
  return w;
}

function textbookUnitsFor(word: string): DictEntry["textbookUnits"] {
  const out: DictEntry["textbookUnits"] = [];
  const seen = new Set<string>();
  const add = (grade: string, unitId: string) => {
    if (seen.has(unitId)) return;
    const label = ENGLISH_UNITS[grade as keyof typeof ENGLISH_UNITS]?.find((u) => u.id === unitId)?.label;
    if (!label) return;
    seen.add(unitId);
    out.push({ grade, unitId, label });
  };
  for (const t of TEXTBOOK_WORDS) if (t.word.toLowerCase() === word) add(t.grade, t.unitId);
  // Unit titles themselves ("Unit 2: My House" → house)
  if (word.length >= 4) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i");
    for (const g of GAME_GRADES) for (const u of ENGLISH_UNITS[g]) if (re.test(u.label.replace(/^Unit \d+:\s*/, ""))) add(g, u.id);
  }
  return out.slice(0, 4);
}

// ---------- Free Dictionary API ----------
interface FreeDictData {
  ipaUs?: string;
  ipaUk?: string;
  ipa?: string;
  audioUs?: string;
  audioUk?: string;
  meanings: { pos: string; definitions: { def: string; example?: string }[] }[];
  synonyms: string[];
  antonyms: string[];
}

export async function fetchFreeDictionary(word: string, fetchImpl: typeof fetch = fetch): Promise<FreeDictData | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetchImpl(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    const out: FreeDictData = { meanings: [], synonyms: [], antonyms: [] };
    for (const entry of data) {
      if (!out.ipa && entry.phonetic) out.ipa = entry.phonetic;
      for (const p of entry.phonetics || []) {
        const audio = String(p.audio || "");
        if (audio && /-us\.mp3$/i.test(audio) && !out.audioUs) {
          out.audioUs = audio;
          if (p.text) out.ipaUs = p.text;
        } else if (audio && /-(uk|gb)\.mp3$/i.test(audio) && !out.audioUk) {
          out.audioUk = audio;
          if (p.text) out.ipaUk = p.text;
        }
        if (!out.ipa && p.text) out.ipa = p.text;
      }
      for (const m of entry.meanings || []) {
        out.meanings.push({
          pos: String(m.partOfSpeech || ""),
          definitions: (m.definitions || []).slice(0, 3).map((d: any) => ({ def: clip(d.definition, 240), example: d.example ? clip(d.example, 160) : undefined })),
        });
        out.synonyms.push(...(m.synonyms || []));
        out.antonyms.push(...(m.antonyms || []));
      }
    }
    out.synonyms = [...new Set(out.synonyms)].slice(0, 8);
    out.antonyms = [...new Set(out.antonyms)].slice(0, 6);
    return out;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- AI ----------
const LOOKUP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isEnglish: { type: Type.BOOLEAN, description: "true nếu đây là từ/cụm từ tiếng Anh có thật" },
    ipaUs: { type: Type.STRING },
    ipaUk: { type: Type.STRING },
    partsOfSpeech: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pos: { type: Type.STRING, description: "noun, verb, adjective..." },
          posVi: { type: Type.STRING, description: "danh từ, động từ, tính từ..." },
          senses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                meaningVi: { type: Type.STRING },
                meaningEn: { type: Type.STRING },
                cefr: { type: Type.STRING, description: "A1, A2, B1, B2, C1 hoặc C2" },
                examples: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, vi: { type: Type.STRING } }, required: ["en", "vi"] },
                },
              },
              required: ["meaningVi", "examples"],
            },
          },
        },
        required: ["pos", "posVi", "senses"],
      },
    },
    collocations: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, vi: { type: Type.STRING } }, required: ["en", "vi"] },
    },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
    antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
    wordFamily: { type: Type.ARRAY, items: { type: Type.STRING } },
    memoryTip: { type: Type.STRING },
  },
  required: ["isEnglish", "partsOfSpeech"],
};

function lookupPrompt(word: string, fd: FreeDictData | null) {
  const grounding = fd
    ? `Dữ liệu từ điển tiếng Anh (dùng làm căn cứ, không mâu thuẫn với nó):\n${fd.meanings
        .map((m) => `- ${m.pos}: ${m.definitions.map((d) => d.def).join(" | ")}`)
        .join("\n")}`
    : "Không có dữ liệu từ điển tiếng Anh cho từ này.";
  return [
    `Soạn mục từ điển Anh–Việt cho học sinh THCS Việt Nam (lớp 6–9) cho từ/cụm từ: "${word}".`,
    grounding,
    "Yêu cầu:",
    "- Liệt kê các loại từ; mỗi loại tối đa 4 nghĩa tiếng Việt, nghĩa thường gặp nhất trước; nghĩa ngắn gọn, đúng.",
    "- Mỗi nghĩa 1–2 câu ví dụ tiếng Anh ngắn (≤ 12 từ), đời thường, phù hợp trẻ em, kèm bản dịch tiếng Việt tự nhiên.",
    "- cefr: cấp độ ước lượng của nghĩa đó.",
    "- collocations: tối đa 5 cụm từ hay đi cùng, có nghĩa tiếng Việt. synonyms ≤ 5, antonyms ≤ 4, wordFamily ≤ 6 (các dạng/từ cùng gốc).",
    "- memoryTip: 1 mẹo nhớ ngắn bằng tiếng Việt.",
    "- ipaUs, ipaUk: phiên âm IPA trong dấu / /.",
    "- Không bịa. Nếu không phải từ tiếng Anh có thật thì isEnglish=false và partsOfSpeech rỗng.",
  ].join("\n");
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function buildEntry(word: string, fd: FreeDictData | null, ai: any | null): DictEntry | null {
  const partsOfSpeech: DictEntry["partsOfSpeech"] = arr<any>(ai?.partsOfSpeech)
    .map((p) => ({
      pos: clip(p.pos, 30),
      posVi: clip(p.posVi, 30),
      senses: arr<any>(p.senses)
        .slice(0, 4)
        .map((s) => ({
          meaningVi: clip(s.meaningVi, 200),
          meaningEn: s.meaningEn ? clip(s.meaningEn, 240) : undefined,
          cefr: CEFR.includes(String(s.cefr).toUpperCase()) ? (String(s.cefr).toUpperCase() as Cefr) : undefined,
          examples: arr<any>(s.examples).slice(0, 2).map((e) => ({ en: clip(e.en, 160), vi: clip(e.vi, 200) })).filter((e) => e.en),
        }))
        .filter((s) => s.meaningVi),
    }))
    .filter((p) => p.senses.length);

  // AI unavailable: still show the English dictionary data
  if (!partsOfSpeech.length && fd?.meanings.length) {
    for (const m of fd.meanings.slice(0, 3)) {
      partsOfSpeech.push({
        pos: m.pos,
        posVi: "",
        senses: m.definitions.slice(0, 2).map((d) => ({ meaningVi: "", meaningEn: d.def, examples: d.example ? [{ en: d.example, vi: "" }] : [] })),
      });
    }
  }
  if (!partsOfSpeech.length) return null;

  const source: DictEntry["source"] = [];
  if (fd) source.push("freedict");
  if (ai) source.push("ai");
  return {
    word,
    ipaUs: fd?.ipaUs || clip(ai?.ipaUs, 60) || fd?.ipa || undefined,
    ipaUk: fd?.ipaUk || clip(ai?.ipaUk, 60) || undefined,
    audioUs: fd?.audioUs,
    audioUk: fd?.audioUk,
    partsOfSpeech,
    collocations: arr<any>(ai?.collocations).slice(0, 5).map((c) => ({ en: clip(c.en, 80), vi: clip(c.vi, 120) })).filter((c) => c.en),
    synonyms: [...new Set([...arr<string>(ai?.synonyms), ...(fd?.synonyms || [])].map((s) => clip(s, 40)).filter(Boolean))].slice(0, 6),
    antonyms: [...new Set([...arr<string>(ai?.antonyms), ...(fd?.antonyms || [])].map((s) => clip(s, 40)).filter(Boolean))].slice(0, 5),
    wordFamily: arr<string>(ai?.wordFamily).map((s) => clip(s, 40)).filter(Boolean).slice(0, 6),
    memoryTip: ai?.memoryTip ? clip(ai.memoryTip, 200) : undefined,
    textbookUnits: textbookUnitsFor(word),
    source,
    fetchedAt: Date.now(),
  };
}

// ---------- routes ----------
export function registerDictionaryRoutes(app: Express, ai: AiClient, opts: { dataDir: string; fetchImpl?: typeof fetch }) {
  const fetchImpl = opts.fetchImpl || fetch;
  const cacheFile = path.join(opts.dataDir, "data", "dict-cache.json");
  const entries = new Lru<DictEntry>(MAX_ENTRIES);
  const translations = new Lru<TranslateResult>(500);
  const ttsCache = new Lru<Buffer>(300);
  const allow = (req: Request) => rateAllow(`dict:${req.ip}`, 30); // 30 per minute: protects the AI credit

  try {
    const saved = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    for (const e of Array.isArray(saved) ? saved : []) if (e?.word && Date.now() - e.fetchedAt < CACHE_DAYS * 86400_000) entries.set(e.word, e);
  } catch {
    // no cache yet
  }
  let saveTimer: NodeJS.Timeout | null = null;
  const scheduleSave = () => {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
        fs.writeFileSync(cacheFile, JSON.stringify(entries.entries().map(([, v]) => v)));
      } catch {
        // read-only disk: memory cache still works
      }
    }, 5000);
  };

  app.post("/api/dict/lookup", async (req, res) => {
    const word = normalizeWord(req.body?.word);
    if (!word) return res.status(400).json({ success: false, error: "Nhập 1 từ hoặc cụm từ tiếng Anh (tối đa 3 từ)." });
    const hit = entries.get(word);
    if (hit && Date.now() - hit.fetchedAt < CACHE_DAYS * 86400_000) return res.json({ success: true, entry: hit, cached: true });
    if (!allow(req)) return res.status(429).json({ success: false, error: "Bạn tra hơi nhanh, đợi một chút rồi thử lại nhé." });

    const fd = await fetchFreeDictionary(word, fetchImpl);
    let aiData: any = null;
    try {
      const r = await ai.models.generateContent({
        model: MODEL,
        contents: lookupPrompt(word, fd),
        config: {
          responseMimeType: "application/json",
          responseSchema: LOOKUP_SCHEMA,
          temperature: 0.2,
          systemInstruction: "Bạn là biên soạn viên từ điển Anh–Việt cho học sinh. Chính xác, ngắn gọn, nội dung phù hợp trẻ em.",
        },
      });
      aiData = JSON.parse(String(r.text || "{}").trim());
      if (aiData?.isEnglish === false && !fd) {
        return res.status(404).json({ success: false, error: `Không tìm thấy "${word}" trong tiếng Anh. Kiểm tra lại chính tả nhé.` });
      }
    } catch (err: any) {
      console.warn("[dict] AI lookup failed:", String(err?.message || err).slice(0, 160));
    }
    const entry = buildEntry(word, fd, aiData);
    if (!entry) {
      return res.status(fd === null && aiData === null ? 503 : 404).json({
        success: false,
        error: fd === null && aiData === null ? "Chưa tra được từ này, thử lại sau." : `Không tìm thấy "${word}".`,
      });
    }
    // Only keep complete entries (with Vietnamese meanings) in the long cache
    if (entry.source.includes("ai")) {
      entries.set(word, entry);
      scheduleSave();
    }
    return res.json({ success: true, entry });
  });

  app.post("/api/translate", async (req, res) => {
    const text = clip(req.body?.text, 2000);
    const from = ["auto", "en", "vi"].includes(req.body?.from) ? req.body.from : "auto";
    const to = req.body?.to === "en" ? "en" : "vi";
    if (!text) return res.status(400).json({ success: false, error: "Hãy nhập nội dung cần dịch." });
    const key = `${from}|${to}|${text}`;
    const hit = translations.get(key);
    if (hit) return res.json({ success: true, result: hit, cached: true });
    if (!allow(req)) return res.status(429).json({ success: false, error: "Bạn dịch hơi nhanh, đợi một chút rồi thử lại nhé." });
    try {
      const target = to === "vi" ? "tiếng Việt" : "tiếng Anh";
      const r = await ai.models.generateContent({
        model: MODEL,
        contents: [
          `Dịch sang ${target}${from === "auto" ? " (tự nhận diện ngôn ngữ gốc)" : from === "en" ? " từ tiếng Anh" : " từ tiếng Việt"}.`,
          "Giữ nguyên xuống dòng, không thêm bớt ý. notes: tối đa 3 ghi chú ngắn bằng tiếng Việt về ngữ pháp/từ khó đáng học (bỏ trống nếu không cần).",
          "alternatives: tối đa 2 cách dịch khác nếu văn bản ngắn (dưới 15 từ), nếu không thì để trống.",
          "detectedLang: en, vi hoặc other.",
          "Văn bản:",
          '"""',
          text,
          '"""',
        ].join("\n"),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: { type: Type.STRING },
              detectedLang: { type: Type.STRING },
              notes: { type: Type.ARRAY, items: { type: Type.STRING } },
              alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["translation", "detectedLang"],
          },
          temperature: 0.2,
          systemInstruction: "Bạn là người dịch Anh–Việt cho học sinh THCS: dịch tự nhiên, đúng nghĩa, dễ hiểu.",
        },
      });
      const d = JSON.parse(String(r.text || "{}").trim());
      const result: TranslateResult = {
        translation: clip(d.translation, 6000),
        detectedLang: d.detectedLang === "en" || d.detectedLang === "vi" ? d.detectedLang : "other",
        notes: arr<string>(d.notes).map((n) => clip(n, 240)).filter(Boolean).slice(0, 3),
        alternatives: arr<string>(d.alternatives).map((n) => clip(n, 400)).filter(Boolean).slice(0, 2),
      };
      if (!result.translation) throw new Error("empty translation");
      translations.set(key, result);
      return res.json({ success: true, result });
    } catch (err: any) {
      console.warn("[dict] translate failed:", String(err?.message || err).slice(0, 160));
      return res.status(503).json({ success: false, error: "Chưa dịch được lúc này. Kiểm tra mạng hoặc thử lại sau." });
    }
  });

  app.get("/api/dict/tts", async (req, res) => {
    const text = clip(req.query.text, 400);
    const lang = req.query.lang === "en-GB" ? "en-GB" : "en-US";
    const slow = req.query.slow === "1";
    if (!text || !/^[\x20-\x7E’]+$/.test(text)) return res.status(400).json({ error: "Văn bản không hợp lệ." });
    const key = `${lang}|${slow}|${text}`;
    let buf = ttsCache.get(key);
    if (!buf) {
      // natural neural voice first (Ava US / Sonia UK), then the older Google voice
      buf = await edgeSpeakVoice(text, EDGE_VOICES[lang], slow ? "-35%" : "-5%").catch(() => undefined);
      if (buf) ttsCache.set(key, buf);
    }
    if (!buf) {
      try {
        // Unofficial endpoint (same one the Vietnamese read-aloud used): last resort only.
        const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang === "en-GB" ? "en-GB" : "en-US"}&ttsspeed=${slow ? "0.3" : "1"}&q=${encodeURIComponent(text)}`;
        const r = await fetchImpl(url, { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://translate.google.com/" } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        buf = Buffer.from(await r.arrayBuffer());
        ttsCache.set(key, buf);
      } catch {
        return res.status(503).json({ error: "Chưa đọc được lúc này." });
      }
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=604800");
    return res.end(buf);
  });
}
