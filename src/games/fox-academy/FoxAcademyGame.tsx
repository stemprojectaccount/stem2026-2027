// Học Viện Cáo: Nghe – Viết – English listening & spelling.
// Professor Fox says a word (the dictionary's real recording when available, otherwise the
// device voice). Easy: choose the written word among 4. Medium: arrange the letter tiles
// (with 2 extra letters). Hard: type it (one letter off → "almost", one more try).
// Words: a Global Success unit of the chosen grade (or all units), or the student's word book.
// After each answer: IPA, meaning, example from "Tra từ & Dịch". Missed words go to the word book.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Delete, RotateCcw, Star, Turtle, Volume2 } from "lucide-react";
import type { GameComponentProps } from "../types";
import GameShell, { type GameContext, type GameSettings } from "../shared/GameShell";
import type { GameQuestion } from "../shared/questionEngine";
import { ENGLISH_UNITS } from "../../data/gameCurriculum";
import { TEXTBOOK_WORDS, wordsOfUnit } from "../../data/textbookWords";
import { speak } from "../../features/dictionary/pronunciation";
import { lookupWord } from "../../features/dictionary/dictApi";
import { listWordbook, saveWord, setWordStatus } from "../../features/dictionary/dictStore";
import type { DictEntry } from "../../features/dictionary/types";

const WORDS_PER_ROUND = 10;
const MAX_REPLAYS = 3;
const UNIT_KEY = "smartstudy_fox_unit_v1";

const isSingleWord = (w: string) => /^[a-z]{3,12}$/i.test(w);

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadUnit(): string {
  try {
    return localStorage.getItem(UNIT_KEY) || "all";
  } catch {
    return "all";
  }
}

function UnitPicker({ settings }: { settings: GameSettings }) {
  const [unit, setUnit] = useState(loadUnit);
  if (settings.subject === "wordbook") return <p className="text-sm text-slate-600">Dùng các từ trong <b>Sổ từ</b> của bạn (mục Tra từ và Dịch). Cần ít nhất 4 từ.</p>;
  const units = ENGLISH_UNITS[settings.grade as keyof typeof ENGLISH_UNITS] || [];
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">Unit trong sách Global Success</span>
      <select
        value={units.some((u) => u.id === unit) ? unit : "all"}
        onChange={(e) => {
          setUnit(e.target.value);
          try {
            localStorage.setItem(UNIT_KEY, e.target.value);
          } catch {
            // ignore
          }
        }}
        className="mt-1 w-full min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-base"
      >
        <option value="all">Tất cả Unit của {settings.grade}</option>
        {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
      </select>
    </label>
  );
}

async function buildWordList(settings: GameSettings, mode: 1 | 2 | 3): Promise<string[]> {
  let words: string[];
  if (settings.subject === "wordbook") {
    words = (await listWordbook()).map((w) => w.word.toLowerCase());
  } else {
    const unit = loadUnit();
    const gradeUnits = (ENGLISH_UNITS[settings.grade as keyof typeof ENGLISH_UNITS] || []).map((u) => u.id);
    words = unit !== "all" && gradeUnits.includes(unit) ? wordsOfUnit(unit) : TEXTBOOK_WORDS.filter((t) => t.grade === settings.grade).map((t) => t.word);
  }
  words = [...new Set(words)];
  if (mode !== 1) words = words.filter(isSingleWord); // arranging / typing: single words only
  return words;
}

// ---------- one word ----------
interface WordState {
  word: string;
  entry: DictEntry | null;
  choices: string[]; // mode 1
  tiles: { ch: string; used: boolean }[]; // mode 2
}

function FoxRound({ ctx }: { ctx: GameContext }) {
  const mode = ctx.settings.difficulty;
  const source = ctx.sources[0];
  const [pool, setPool] = useState<string[] | null>(null);
  const [cur, setCur] = useState<WordState | null>(null);
  const [index, setIndex] = useState(0);
  const [replays, setReplays] = useState(0);
  const [picked, setPicked] = useState<string[]>([]); // mode 2 letters
  const [typed, setTyped] = useState("");
  const [almostUsed, setAlmostUsed] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; almost?: boolean; given?: string } | null>(null);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [canGo, setCanGo] = useState(false);
  const order = useRef<string[]>([]);
  const entries = useRef(new Map<string, DictEntry | null>());
  const inputRef = useRef<HTMLInputElement>(null);
  const finished = useRef(false);

  const fetchEntry = useCallback(async (w: string) => {
    if (entries.current.has(w)) return entries.current.get(w) || null;
    try {
      const e = await lookupWord(w);
      entries.current.set(w, e);
      return e;
    } catch {
      entries.current.set(w, null);
      return null;
    }
  }, []);

  // word list
  useEffect(() => {
    buildWordList(ctx.settings, mode).then((list) => {
      order.current = shuffle(list).slice(0, WORDS_PER_ROUND);
      setPool(list);
    });
  }, [ctx.settings, mode]);

  const say = useCallback(
    (w: string, slow = false) => {
      const e = entries.current.get(w);
      void speak(w, { accent: "us", slow, audio: e?.audioUs || e?.audioUk });
    },
    []
  );

  const setupWord = useCallback(
    async (i: number) => {
      const w = order.current[i];
      if (!w || !pool) return;
      const entry = await Promise.race([fetchEntry(w), new Promise<null>((r) => setTimeout(() => r(null), 2500))]);
      // distractors: other words of the list, preferring the same first letter or similar length
      const others = shuffle(pool.filter((o) => o !== w));
      others.sort((a, b) => Number(b[0] === w[0]) - Number(a[0] === w[0]) || Math.abs(a.length - w.length) - Math.abs(b.length - w.length));
      const choices = shuffle([w, ...others.slice(0, 3)]);
      const extra = shuffle("abcdefghijklmnoprstuwy".split("").filter((c) => !w.includes(c))).slice(0, 2);
      const tiles = shuffle([...w.split(""), ...extra]).map((ch) => ({ ch, used: false }));
      setCur({ word: w, entry: entry || entries.current.get(w) || null, choices, tiles });
      setReplays(0);
      setPicked([]);
      setTyped("");
      setAlmostUsed(false);
      setFeedback(null);
      setCanGo(false);
      // prefetch the next word's dictionary entry (audio + meaning)
      const nxt = order.current[i + 1];
      if (nxt) void fetchEntry(nxt);
      setTimeout(() => say(w), 250);
      if (mode === 3) setTimeout(() => inputRef.current?.focus(), 300);
    },
    [pool, fetchEntry, say, mode]
  );

  useEffect(() => {
    if (pool && pool.length >= 4) void setupWord(0);
  }, [pool, setupWord]);

  const asQuestion = (w: string, e: DictEntry | null): GameQuestion => {
    const meaning = e?.partsOfSpeech[0]?.senses[0]?.meaningVi || e?.partsOfSpeech[0]?.senses[0]?.meaningEn || "";
    return {
      id: `fox-${w}`,
      subject: ctx.settings.subject,
      grade: ctx.settings.grade,
      topic: "Nghe – viết",
      difficulty: mode,
      prompt: `Nghe và viết từ: 🔊 (${w.length} chữ cái)`,
      options: [w],
      correctIndex: 0,
      explanation: `${w} ${e?.ipaUs || e?.ipaUk || ""}${meaning ? ` – ${meaning}` : ""}`,
      source: ctx.settings.subject === "wordbook" ? "wordbook" : "bank",
    };
  };

  const settle = (ok: boolean, given?: string) => {
    if (!cur || feedback) return;
    const q = asQuestion(cur.word, cur.entry);
    source.noteServed(q);
    source.reportAnswer(q, ok);
    if (ok) {
      const pts = 10 + (replays <= 1 ? 5 : 0) + (mode === 3 ? 5 : 0);
      const s = score + pts;
      setScore(s);
      setStars((x) => x + 1);
      ctx.setLiveScore(s);
      setFeedback({ ok: true });
      setTimeout(() => setCanGo(true), 600);
    } else {
      setFeedback({ ok: false, given });
      setTimeout(() => setCanGo(true), 2000);
      // missed word → word book ("đang học") so it comes back in reviews
      if (cur.entry) void saveWord(cur.entry).then(() => setWordStatus(cur.word, "learning"));
    }
  };

  const next = () => {
    const n = index + 1;
    if (n >= order.current.length) {
      if (!finished.current) {
        finished.current = true;
        ctx.finish({ score, note: `${stars} sao học bổng` });
      }
      return;
    }
    setIndex(n);
    void setupWord(n);
  };

  // keyboard: 1–4 (easy), Enter to continue
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ctx.paused || !cur) return;
      if (feedback && canGo && e.key === "Enter") {
        e.preventDefault();
        next();
        return;
      }
      if (mode === 1 && !feedback && ["1", "2", "3", "4"].includes(e.key)) {
        const c = cur.choices[Number(e.key) - 1];
        if (c) settle(c === cur.word, c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ----- mode 2: letter tiles -----
  const tapTile = (i: number) => {
    if (!cur || feedback || cur.tiles[i].used) return;
    const tiles = cur.tiles.map((t, k) => (k === i ? { ...t, used: true } : t));
    const nextPicked = [...picked, cur.tiles[i].ch];
    setCur({ ...cur, tiles });
    setPicked(nextPicked);
    if (nextPicked.length === cur.word.length) settle(nextPicked.join("") === cur.word, nextPicked.join(""));
  };
  const undoTile = () => {
    if (!cur || feedback || !picked.length) return;
    const last = picked[picked.length - 1];
    let restored = false;
    const tiles = [...cur.tiles].reverse().map((t) => {
      if (!restored && t.used && t.ch === last) {
        restored = true;
        return { ...t, used: false };
      }
      return t;
    }).reverse();
    setCur({ ...cur, tiles });
    setPicked(picked.slice(0, -1));
  };

  // ----- mode 3: typing -----
  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cur || feedback) return;
    const t = typed.trim().toLowerCase();
    if (!t) return;
    if (t === cur.word) return settle(true);
    if (!almostUsed && levenshtein(t, cur.word) === 1) {
      setAlmostUsed(true);
      setFeedback(null);
      setTyped(t);
      setReplays((r) => r); // keep
      flashAlmost();
      return;
    }
    settle(false, t);
  };
  const [almostMsg, setAlmostMsg] = useState(false);
  const flashAlmost = () => {
    setAlmostMsg(true);
    setTimeout(() => setAlmostMsg(false), 2500);
  };

  const replay = (slow = false) => {
    if (!cur || replays >= MAX_REPLAYS) return;
    setReplays((r) => r + 1);
    say(cur.word, slow);
  };

  // ---------- render ----------
  if (pool && pool.length < 4) {
    return (
      <div className="rounded-2xl bg-white border border-amber-200 p-6 text-center">
        <p className="font-bold text-slate-900">Chưa đủ từ để chơi.</p>
        <p className="text-slate-600 mt-1">{ctx.settings.subject === "wordbook" ? "Hãy lưu ít nhất 4 từ vào Sổ từ (mục Tra từ và Dịch) rồi quay lại nhé." : "Chọn Unit khác hoặc độ khó Dễ."}</p>
        <button type="button" onClick={() => ctx.finish({ score: 0, note: "Chưa đủ từ" })} className="mt-3 min-h-[44px] px-5 rounded-xl border-2 border-slate-200 font-semibold">Quay lại</button>
      </div>
    );
  }
  if (!cur) return <p role="status" className="text-center text-slate-600 py-10">Giáo sư Cáo đang chuẩn bị từ…</p>;

  const e = cur.entry;
  const meaning = e?.partsOfSpeech[0]?.senses[0]?.meaningVi || e?.partsOfSpeech[0]?.senses[0]?.meaningEn;
  const example = e?.partsOfSpeech[0]?.senses[0]?.examples[0];

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="tabular-nums">Từ {index + 1}/{order.current.length} · {score} điểm</span>
        <span className="inline-flex items-center gap-1 text-amber-600"><Star className="w-4 h-4 fill-amber-400" /> {stars} sao học bổng</span>
      </div>

      {/* Professor Fox */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 border border-orange-200 p-4 flex items-center gap-4">
        <svg viewBox="0 0 80 80" className="w-16 h-16 shrink-0" aria-hidden="true">
          <polygon points="18,28 24,6 36,22" fill="#ea580c" />
          <polygon points="62,28 56,6 44,22" fill="#ea580c" />
          <circle cx="40" cy="42" r="24" fill="#f97316" />
          <ellipse cx="40" cy="52" rx="15" ry="11" fill="#fff7ed" />
          <circle cx="32" cy="38" r="6" fill="none" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="48" cy="38" r="6" fill="none" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="32" cy="38" r="2.2" fill="#1e293b" />
          <circle cx="48" cy="38" r="2.2" fill="#1e293b" />
          <circle cx="40" cy="50" r="2.5" fill="#1e293b" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-orange-900">Giáo sư Cáo đọc một từ. {mode === 1 ? "Chọn từ bạn nghe được." : mode === 2 ? "Xếp các chữ cái thành từ đó." : "Gõ lại từ đó."}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => replay(false)} disabled={replays >= MAX_REPLAYS || !!feedback} className="min-h-[44px] px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold inline-flex items-center gap-2">
              <Volume2 className="w-5 h-5" /> Nghe lại ({MAX_REPLAYS - replays})
            </button>
            <button type="button" onClick={() => replay(true)} disabled={replays >= MAX_REPLAYS || !!feedback} className="min-h-[44px] px-4 rounded-xl bg-white border-2 border-orange-300 text-orange-800 font-bold disabled:opacity-50 inline-flex items-center gap-2">
              <Turtle className="w-5 h-5" /> Nghe chậm
            </button>
          </div>
          {mode !== 1 && <p className="text-xs text-orange-900/80 mt-1">Gợi ý: từ có {cur.word.length} chữ cái{e?.ipaUs ? `, phiên âm ${e.ipaUs}` : ""}.</p>}
        </div>
      </div>

      {/* Answer area */}
      {mode === 1 && (
        <div className="grid grid-cols-2 gap-2">
          {cur.choices.map((c, i) => {
            const state = !feedback ? "idle" : c === cur.word ? "right" : c === feedback.given ? "wrong" : "dim";
            return (
              <button key={c} type="button" disabled={!!feedback || ctx.paused} onClick={() => settle(c === cur.word, c)} className={`min-h-[56px] rounded-xl border-2 text-lg font-bold flex items-center gap-2 px-3 ${state === "idle" ? "bg-white border-slate-200 hover:border-orange-400" : state === "right" ? "bg-emerald-50 border-emerald-500 text-emerald-900" : state === "wrong" ? "bg-rose-50 border-rose-400 text-rose-900" : "bg-white border-slate-100 text-slate-400"}`}>
                <kbd className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-sm flex items-center justify-center">{i + 1}</kbd>
                <span lang="en">{c}</span>
              </button>
            );
          })}
        </div>
      )}

      {mode === 2 && (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-center gap-1.5 min-h-[56px]" aria-label="Từ bạn đang xếp" aria-live="polite">
            {Array.from({ length: cur.word.length }, (_, i) => (
              <span key={i} className={`w-10 h-12 sm:w-11 sm:h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black uppercase ${picked[i] ? (feedback ? (feedback.ok ? "border-emerald-500 bg-emerald-50" : "border-rose-400 bg-rose-50") : "border-orange-400 bg-orange-50") : "border-dashed border-slate-300 bg-white"}`}>
                {picked[i] || ""}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {cur.tiles.map((t, i) => (
              <button key={i} type="button" disabled={t.used || !!feedback || ctx.paused} onClick={() => tapTile(i)} className="w-12 h-12 rounded-xl bg-amber-300 hover:bg-amber-200 disabled:opacity-30 text-amber-950 text-xl font-black uppercase shadow" aria-label={`Chữ ${t.ch}`}>
                {t.ch}
              </button>
            ))}
            <button type="button" onClick={undoTile} disabled={!picked.length || !!feedback} aria-label="Xoá chữ cuối" className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 disabled:opacity-40 flex items-center justify-center">
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {mode === 3 && (
        <form onSubmit={submitTyped} className="flex gap-2">
          <label className="sr-only" htmlFor="fox-input">Gõ từ bạn nghe được</label>
          <input
            id="fox-input"
            ref={inputRef}
            value={typed}
            onChange={(ev) => setTyped(ev.target.value.replace(/[^a-zA-Z' -]/g, "").slice(0, 20))}
            disabled={!!feedback || ctx.paused}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang="en"
            placeholder="Gõ từ tiếng Anh…"
            className="flex-1 min-h-[52px] px-4 rounded-xl border-2 border-slate-300 focus:border-orange-500 outline-none text-xl font-bold"
          />
          <button type="submit" disabled={!!feedback || !typed.trim()} className="min-h-[52px] px-5 rounded-xl bg-orange-500 disabled:opacity-50 text-white font-bold">Kiểm tra</button>
        </form>
      )}
      {almostMsg && <p role="status" className="text-center font-bold text-amber-700">Gần đúng rồi! Sai 1 chữ cái – nghe lại và sửa nhé (còn 1 lần).</p>}

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-2xl border p-4 ${feedback.ok ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`} role="status">
          <p className={`font-bold ${feedback.ok ? "text-emerald-800" : "text-rose-800"}`}>{feedback.ok ? "Chính xác! +1 sao học bổng" : "Chưa đúng."}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900" lang="en">{cur.word}</span>
            {(e?.ipaUs || e?.ipaUk) && <span className="font-mono text-slate-700">{e?.ipaUs || e?.ipaUk}</span>}
            <button type="button" onClick={() => say(cur.word)} aria-label="Nghe lại từ" className="w-9 h-9 rounded-lg bg-white border border-slate-200 inline-flex items-center justify-center"><Volume2 className="w-4 h-4" /></button>
          </div>
          {meaning && <p className="text-slate-800">{meaning}</p>}
          {example && <p className="text-sm text-slate-600 italic mt-1" lang="en">{example.en}{example.vi ? <span className="not-italic"> → {example.vi}</span> : null}</p>}
          {!feedback.ok && feedback.given && <p className="text-sm text-rose-700 mt-1">Bạn đã chọn/viết: <b>{feedback.given}</b>. Từ này đã được thêm vào Sổ từ để ôn lại.</p>}
          <button type="button" disabled={!canGo} onClick={next} className="mt-3 min-h-[44px] px-5 rounded-xl bg-indigo-600 disabled:bg-slate-300 text-white font-semibold inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> {index + 1 >= order.current.length ? "Xem kết quả" : "Từ tiếp theo"}
          </button>
        </div>
      )}
    </div>
  );
}

const FoxArt = (
  <svg viewBox="0 0 120 90">
    <polygon points="38,34 46,8 58,28" fill="#ea580c" />
    <polygon points="82,34 74,8 62,28" fill="#ea580c" />
    <circle cx="60" cy="50" r="30" fill="#f97316" />
    <ellipse cx="60" cy="62" rx="19" ry="13" fill="#fff7ed" />
    <circle cx="50" cy="46" r="7" fill="none" stroke="#1e293b" strokeWidth="3" />
    <circle cx="70" cy="46" r="7" fill="none" stroke="#1e293b" strokeWidth="3" />
    <rect x="44" y="14" width="32" height="6" fill="#1e293b" />
    <polygon points="60,4 84,14 60,22 36,14" fill="#1e293b" />
  </svg>
);

export default function FoxAcademyGame(props: GameComponentProps) {
  const setup = useMemo(() => (s: GameSettings) => <UnitPicker settings={s} />, []);
  return (
    <GameShell
      gameKey="fox-listen"
      title="Học Viện Cáo: Nghe – Viết"
      tagline="Nghe Giáo sư Cáo đọc từ, chọn – xếp – gõ đúng chính tả!"
      howToPlay={[
        `Mỗi ván ${WORDS_PER_ROUND} từ lấy từ Unit trong sách Global Success hoặc Sổ từ của bạn.`,
        "Dễ: nghe rồi chọn từ đúng trong 4 từ. Vừa: xếp các chữ cái (có 2 chữ thừa). Khó: gõ lại từ.",
        `Mỗi từ được nghe lại ${MAX_REPLAYS} lần, có nút nghe chậm. Ở mức Khó, sai đúng 1 chữ cái thì được sửa 1 lần.`,
        "Sau mỗi từ: phiên âm, nghĩa và câu ví dụ. Từ làm sai được thêm vào Sổ từ để ôn.",
      ]}
      subjects={["tieng-anh", "wordbook"]}
      fullscreen
      accent="from-orange-500 to-amber-400"
      art={FoxArt}
      extraSetup={setup}
      highScore={props.highScore}
      onSaveHighScore={props.onSaveHighScore}
      onAwardReward={props.onAwardReward}
      onLogEvent={props.onLogEvent}
      progress={props.progress}
    >
      {(ctx) => <FoxRound ctx={ctx} />}
    </GameShell>
  );
}
