// Shared question engine for the learning games ("1 question set – many ways to play").
//
// Sources, in order of use:
//   1. review queue: questions answered wrong come back 3–5 questions later (retrieval practice)
//   2. AI questions (/api/study-gate/questions, no repeats thanks to the "seen" memory), mixed in
//      when available
//   3. offline banks: Math 6–9 (pixelVanguardQuestions) and 7 subjects (studyGateBank)
//   4. the student's word book (Tra từ & Dịch) for English vocabulary
// Prefetches so a game never waits, and never fails: if everything else is gone it reuses the bank.
import { bankQuestions, GATE_SUBJECTS, type GateQuestion } from "../../data/studyGateBank";
import { normalizeQuestionKey } from "../../data/gameCurriculum";
import { loadSeen, rememberSeen } from "./questionMemory";
import type { WordBookItem } from "../../features/dictionary/types";

export type GameSubject = (typeof GATE_SUBJECTS)[number]["id"] | "wordbook";
export type Difficulty = 1 | 2 | 3;

export interface GameQuestion {
  id: string;
  subject: GameSubject;
  grade: string;
  topic?: string;
  difficulty: Difficulty;
  prompt: string; // may contain LaTeX in $...$
  options: string[];
  correctIndex: number;
  explanation: string;
  source: "bank" | "ai" | "wordbook";
  isReview?: boolean;
}

export interface SourceOptions {
  grade: string; // "Lớp 6"
  subject: GameSubject;
  difficulty: Difficulty;
  topic?: string;
  /** Memory key for "already seen" (per game). */
  memoryKey?: string;
  /** Share of AI questions when AI works (0..1). */
  aiShare?: number;
  /** Add offline-generated questions to the fixed bank (default true). */
  generate?: boolean;
  // Injectable for tests
  fetchAi?: (body: Record<string, unknown>) => Promise<GateQuestion[]>;
  loadWordbook?: () => Promise<WordBookItem[]>;
  random?: () => number;
}

export interface QuestionSource {
  next(): Promise<GameQuestion>;
  /** A game served its own question (e.g. generated mental math): count it for review timing. */
  noteServed(q: GameQuestion): void;
  reportAnswer(q: GameQuestion, correct: boolean): void;
  mistakes(): GameQuestion[];
  stats(): { served: number; correct: number; wrong: number; aiAvailable: boolean | null };
  /** Pre-load questions (call when the start screen shows). */
  warmUp(): Promise<void>;
}

const keyOf = (q: { prompt?: string; question?: string }) => normalizeQuestionKey(q.prompt || q.question || "");

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Same question with its options in a new order (review copies should not be memorised by position). */
// Options that refer to other options by position/meaning must keep their order.
const ORDER_BOUND = /tất cả|cả hai|cả [a-d] và|[a-d] và [a-d]|các (ý|đáp án) trên|không (có )?(ý|đáp án) nào|all of the above|none of the above|both [a-d]/i;

function reshuffle(q: GameQuestion, rnd: () => number): GameQuestion {
  if (q.options.some((o) => ORDER_BOUND.test(o))) return q;
  const order = shuffle(q.options.map((_, i) => i), rnd);
  return { ...q, options: order.map((i) => q.options[i]), correctIndex: order.indexOf(q.correctIndex) };
}

async function defaultFetchAi(body: Record<string, unknown>): Promise<GateQuestion[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch("/api/study-gate/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(data?.questions)) throw new Error(data?.error || `HTTP ${res.status}`);
    return data.questions;
  } finally {
    clearTimeout(t);
  }
}

async function defaultLoadWordbook(): Promise<WordBookItem[]> {
  const { listWordbook } = await import("../../features/dictionary/dictStore");
  const { withVietnamese } = await import("../../features/dictionary/offlineDict");
  const items = await listWordbook();
  return Promise.all(items.map(async (it) => ({ ...it, entry: await withVietnamese(it.entry).catch(() => it.entry) })));
}

function fromGate(q: GateQuestion, grade: string, difficulty: Difficulty, source: "bank" | "ai", subject: GameSubject): GameQuestion | null {
  if (!q?.question || !Array.isArray(q.options) || q.options.length < 2) return null;
  if (!(q.correctIndex >= 0 && q.correctIndex < q.options.length)) return null;
  return {
    id: `${source}-${q.id || Math.random().toString(36).slice(2)}`,
    subject,
    grade,
    difficulty,
    prompt: q.question,
    options: q.options.map(String),
    correctIndex: q.correctIndex,
    explanation: q.explanation || "",
    source,
  };
}

/** Vocabulary questions from the word book: "What does X mean?" with other saved words as distractors. */
export function wordbookQuestions(items: WordBookItem[], grade: string, rnd: () => number = Math.random): GameQuestion[] {
  const usable = items
    .map((it) => ({ word: it.word, meaning: it.entry.partsOfSpeech[0]?.senses[0]?.meaningVi || "", ipa: it.entry.ipaUs || it.entry.ipaUk || "" }))
    .filter((x) => x.meaning);
  if (usable.length < 4) return [];
  return usable.map((w) => {
    const others = shuffle(usable.filter((o) => o.word !== w.word && o.meaning !== w.meaning), rnd).slice(0, 3).map((o) => o.meaning);
    const options = shuffle([w.meaning, ...others], rnd);
    return {
      id: `wb-${w.word}`,
      subject: "wordbook" as const,
      grade,
      difficulty: 1 as Difficulty,
      prompt: `"${w.word}" ${w.ipa} nghĩa là gì?`,
      options,
      correctIndex: options.indexOf(w.meaning),
      explanation: `${w.word} = ${w.meaning}`,
      source: "wordbook" as const,
    };
  });
}

export function createQuestionSource(opts: SourceOptions): QuestionSource {
  const rnd = opts.random || Math.random;
  const fetchAi = opts.fetchAi || defaultFetchAi;
  const loadWb = opts.loadWordbook || defaultLoadWordbook;
  const memoryKey = opts.memoryKey || "game-engine";
  const aiShare = opts.aiShare ?? 0.5;

  const servedKeys = new Set<string>();
  const recent: string[] = []; // last served keys (avoid back-to-back repeats when recycling)
  const bankPool: GameQuestion[] = [];
  const aiPool: GameQuestion[] = [];
  const review: { q: GameQuestion; dueAt: number }[] = [];
  const wrongList = new Map<string, GameQuestion>();
  let served = 0;
  let correct = 0;
  let wrong = 0;
  let aiAvailable: boolean | null = opts.subject === "wordbook" ? false : null;
  let aiInFlight: Promise<void> | null = null;
  let bankLoaded = false;

  const seenBefore = new Set(loadSeen(memoryKey).map(normalizeQuestionKey));

  async function loadBank() {
    if (bankLoaded) return;
    bankLoaded = true;
    let list: GameQuestion[];
    if (opts.subject === "wordbook") {
      list = wordbookQuestions(await loadWb().catch(() => []), opts.grade, rnd);
    } else {
      list = bankQuestions(opts.subject, opts.grade)
        .map((q) => fromGate(q, opts.grade, opts.difficulty, "bank", opts.subject))
        .filter((q): q is GameQuestion => !!q);
      // The fixed bank is small (8–30 questions): add generated questions so games do not repeat
      if (opts.generate !== false) {
        const { generatedQuestions } = await import("./offlineGenerators");
        const gen = await generatedQuestions(opts.subject, opts.grade, opts.difficulty, 60, rnd).catch(() => [] as GameQuestion[]);
        const keys = new Set(list.map(keyOf));
        for (const q of gen) if (!keys.has(keyOf(q))) (keys.add(keyOf(q)), list.push(q));
      }
    }
    // Unseen first, then the rest (a student who played a lot still gets questions)
    const fresh = shuffle(list.filter((q) => !seenBefore.has(keyOf(q))), rnd);
    const old = shuffle(list.filter((q) => seenBefore.has(keyOf(q))), rnd);
    bankPool.push(...fresh, ...old);
  }

  function refillAi(): Promise<void> {
    if (aiAvailable === false || aiInFlight || aiPool.length >= 3) return aiInFlight || Promise.resolve();
    aiInFlight = (async () => {
      try {
        const got = await fetchAi({
          subject: opts.subject,
          grade: opts.grade,
          difficulty: opts.difficulty,
          topic: opts.topic,
          count: 5,
          exclude: [...loadSeen(memoryKey).slice(-50), ...recent.slice(-20)],
        });
        const added = got
          .map((q) => fromGate(q, opts.grade, opts.difficulty, "ai", opts.subject))
          .filter((q): q is GameQuestion => !!q && !servedKeys.has(keyOf(q)));
        aiPool.push(...added);
        aiAvailable = added.length > 0 || aiAvailable === true;
        if (!added.length && aiAvailable !== true) aiAvailable = false;
      } catch {
        aiAvailable = false; // offline / no credit: the bank carries the game
      } finally {
        aiInFlight = null;
      }
    })();
    return aiInFlight;
  }

  function take(pool: GameQuestion[]): GameQuestion | undefined {
    const i = pool.findIndex((q) => !servedKeys.has(keyOf(q)));
    if (i < 0) return undefined;
    return pool.splice(i, 1)[0];
  }

  function serve(q: GameQuestion): GameQuestion {
    served++;
    const k = keyOf(q);
    servedKeys.add(k);
    recent.push(k);
    if (recent.length > 40) recent.shift();
    rememberSeen(memoryKey, [q.prompt.slice(0, 150)]);
    return q;
  }

  return {
    async warmUp() {
      await loadBank();
      void refillAi();
    },

    async next() {
      await loadBank();
      // 1. a mistake that is due again
      const dueIdx = review.findIndex((r) => r.dueAt <= served);
      if (dueIdx >= 0) {
        const { q } = review.splice(dueIdx, 1)[0];
        served++;
        return { ...reshuffle(q, rnd), id: `${q.id}-r${served}`, isReview: true };
      }
      // 2. AI (mixed with the bank) when available
      // (never wait for the AI: bank questions keep the game going while AI questions load)
      if (aiAvailable === null && !aiPool.length) void refillAi();
      const useAi = aiAvailable !== false && aiPool.length > 0 && rnd() < aiShare;
      let q = useAi ? take(aiPool) : undefined;
      if (aiPool.length < 2) void refillAi();
      // 3. bank, then whatever AI left
      q = q || take(bankPool) || take(aiPool);
      // 4. everything used: recycle the bank, avoiding the last few questions
      if (!q) {
        const avoid = new Set(recent.slice(-10));
        servedKeys.clear();
        avoid.forEach((k) => servedKeys.add(k));
        bankLoaded = false;
        bankPool.length = 0;
        await loadBank();
        q = take(bankPool);
        if (!q) {
          servedKeys.clear();
          q = take(bankPool);
        }
      }
      if (!q) throw new Error("Chưa có câu hỏi cho lựa chọn này.");
      // Banks (and some AI answers) put the right answer first – never let position give it away.
      return serve(reshuffle(q, rnd));
    },

    noteServed(q) {
      serve(q);
    },

    reportAnswer(q, ok) {
      if (ok) correct++;
      else {
        wrong++;
        const base = { ...q, id: q.id.replace(/-r\d+$/, ""), isReview: false };
        wrongList.set(keyOf(q), base);
        // Comes back after 3–5 other questions (only once per mistake)
        if (!q.isReview) review.push({ q: base, dueAt: served + 3 + Math.floor(rnd() * 3) });
      }
    },

    mistakes: () => [...wrongList.values()],
    stats: () => ({ served, correct, wrong, aiAvailable }),
  };
}

export const GAME_SUBJECT_OPTIONS: { id: GameSubject; label: string; emoji: string }[] = [
  ...GATE_SUBJECTS.map((s) => ({ id: s.id as GameSubject, label: s.label, emoji: s.emoji })),
  { id: "wordbook", label: "Sổ từ của tôi", emoji: "⭐" },
];
