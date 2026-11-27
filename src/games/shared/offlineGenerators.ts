// Offline question generators: plenty of different questions when the AI is unavailable, so games
// do not keep repeating the same small bank.
//   toán            → mental-math generator (endless, by grade)
//   tiếng Anh       → Global Success unit words + offline English–Vietnamese dictionary (both directions)
//   lịch sử & địa lí → history/geography place clues (Bản Đồ Sử – Địa data)
//   other subjects  → term ↔ definition pairs (both directions)
import type { Difficulty, GameQuestion, GameSubject } from "./questionEngine";
import { mentalMathQuestion } from "../math-sprint/mentalMath";
import { termPairs } from "../word-match/termBank";
import { TEXTBOOK_WORDS } from "../../data/textbookWords";
import { cluesForGrade, dist, PLACES, placeXY } from "../history-map/places";

const gradeNum = (g: string) => Number(String(g).replace(/\D/g, "")) || 6;

export function shuffled<T>(a: T[], rnd: () => number = Math.random): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** "Quả táo, quả táo tây" → short option text. */
export const shortMeaning = (m: string) =>
  m
    .split(/[;(]/)[0]
    .split(/,\s/)
    .slice(0, 2)
    .join(", ")
    .replace(/[.,:]+$/, "")
    .trim()
    .slice(0, 44);

// ---------- English vocabulary ----------
export interface VocabItem {
  word: string;
  meaning: string; // short Vietnamese meaning
  pos?: string;
  unitId: string;
}

const vocabCache = new Map<string, Promise<VocabItem[]>>();
/** Unit words of a grade (or one unit) with their Vietnamese meaning from the offline dictionary. */
export function vocabItems(grade: string, unitId?: string): Promise<VocabItem[]> {
  const key = `${grade}|${unitId || "all"}`;
  let p = vocabCache.get(key);
  if (!p) {
    p = (async () => {
      const { offlineEnVi } = await import("../../features/dictionary/offlineDict");
      const words = TEXTBOOK_WORDS.filter((w) => w.grade === grade && (!unitId || unitId === "all" || w.unitId === unitId));
      const out: VocabItem[] = [];
      for (const w of words) {
        const rec = await offlineEnVi(w.word);
        const first = rec?.p[0];
        const meaning = first ? shortMeaning(first[2][0] || "") : "";
        if (meaning) out.push({ word: w.word, meaning, pos: first?.[1], unitId: w.unitId });
      }
      return out;
    })();
    p.catch(() => vocabCache.delete(key));
    vocabCache.set(key, p);
  }
  return p;
}

function vocabQuestion(item: VocabItem, pool: VocabItem[], grade: string, difficulty: Difficulty, reverse: boolean, rnd: () => number): GameQuestion | null {
  const others = shuffled(pool.filter((o) => o.word !== item.word && o.meaning.toLowerCase() !== item.meaning.toLowerCase()), rnd);
  if (others.length < 3) return null;
  if (reverse) {
    const options = shuffled([item.word, ...others.slice(0, 3).map((o) => o.word)], rnd);
    return {
      id: `gen-vi-${item.word}`,
      subject: "tieng-anh",
      grade,
      topic: "Từ vựng (Việt → Anh)",
      difficulty,
      prompt: `Từ tiếng Anh nào có nghĩa là "${item.meaning}"?`,
      options,
      correctIndex: options.indexOf(item.word),
      explanation: `${item.word} = ${item.meaning}${item.pos ? ` (${item.pos.toLowerCase()})` : ""}.`,
      source: "bank",
    };
  }
  const uniq = [...new Set(others.map((o) => o.meaning))].slice(0, 3);
  const options = shuffled([item.meaning, ...uniq], rnd);
  return {
    id: `gen-en-${item.word}`,
    subject: "tieng-anh",
    grade,
    topic: "Từ vựng (Anh → Việt)",
    difficulty,
    prompt: `"${item.word}" nghĩa là gì?`,
    options,
    correctIndex: options.indexOf(item.meaning),
    explanation: `${item.word} = ${item.meaning}.`,
    source: "bank",
  };
}

// ---------- history & geography ----------
function placeQuestions(grade: string, difficulty: Difficulty, rnd: () => number): GameQuestion[] {
  return cluesForGrade(gradeNum(grade)).map((ref) => {
    const here = placeXY(ref.place);
    const others = shuffled(PLACES.filter((p) => p.id !== ref.place.id && dist(placeXY(p), here) > 8), rnd).slice(0, 3);
    const options = shuffled([ref.place.name, ...others.map((p) => p.name)], rnd);
    return {
      id: `gen-place-${ref.key}`,
      subject: "lich-su-dia-ly" as GameSubject,
      grade,
      topic: `${ref.clue.topic} · Lớp ${ref.clue.grade}`,
      difficulty,
      prompt: `${ref.clue.text}. Đó là ở đâu?`,
      options,
      correctIndex: options.indexOf(ref.place.name),
      explanation: ref.clue.explain,
      source: "bank" as const,
    };
  });
}

// ---------- terms ----------
function termQuestions(subject: GameSubject, grade: string, difficulty: Difficulty, rnd: () => number): GameQuestion[] {
  const pairs = termPairs(subject);
  if (pairs.length < 4) return [];
  const out: GameQuestion[] = [];
  for (const [term, def, expl] of pairs) {
    const others = shuffled(pairs.filter(([t]) => t !== term), rnd).slice(0, 3);
    const o1 = shuffled([term, ...others.map(([t]) => t)], rnd);
    out.push({ id: `gen-term-${subject}-${term}`, subject, grade, topic: "Thuật ngữ", difficulty, prompt: `${def}. Đó là gì?`, options: o1, correctIndex: o1.indexOf(term), explanation: `${term}: ${def}.${expl ? ` ${expl}` : ""}`, source: "bank" });
    const o2 = shuffled([def, ...others.map(([, d]) => d)], rnd);
    out.push({ id: `gen-def-${subject}-${term}`, subject, grade, topic: "Thuật ngữ", difficulty, prompt: `"${term}" là gì?`, options: o2, correctIndex: o2.indexOf(def), explanation: `${term}: ${def}.${expl ? ` ${expl}` : ""}`, source: "bank" });
  }
  return out;
}

/**
 * A batch of generated questions for a subject (different every call for maths; the full generated
 * set, shuffled, for the other subjects).
 */
export async function generatedQuestions(subject: GameSubject, grade: string, difficulty: Difficulty, count = 60, rnd: () => number = Math.random): Promise<GameQuestion[]> {
  if (subject === "toan") {
    const seen = new Set<string>();
    const out: GameQuestion[] = [];
    for (let i = 0; i < count * 3 && out.length < count; i++) {
      const q = mentalMathQuestion(grade, difficulty, rnd);
      if (seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      out.push({ ...q, id: `gen-math-${i}-${q.id}` });
    }
    return out;
  }
  if (subject === "tieng-anh") {
    const pool = await vocabItems(grade).catch(() => [] as VocabItem[]);
    const out: GameQuestion[] = [];
    for (const it of shuffled(pool, rnd).slice(0, count)) {
      const q = vocabQuestion(it, pool, grade, difficulty, rnd() < 0.4, rnd);
      if (q) out.push(q);
    }
    return out;
  }
  if (subject === "lich-su-dia-ly") return shuffled(placeQuestions(grade, difficulty, rnd), rnd).concat(shuffled(termQuestions(subject, grade, difficulty, rnd), rnd)).slice(0, count);
  if (subject === "wordbook") return [];
  return shuffled(termQuestions(subject, grade, difficulty, rnd), rnd).slice(0, count);
}

export { vocabQuestion };
