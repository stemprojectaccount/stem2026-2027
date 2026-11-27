// Thành Trì Rồng Lửa: Bản Đồ Sử – Địa.
// Mode "Chinh phục": 10 strongholds held by the dragon. Each round is a history/geography clue:
//   tap the place on the map, or pick its name; rounds 4 and 8 are "dragon questions" from the shared
//   engine (Lịch sử & Địa lí bank/AI – also where earlier mistakes come back for review).
// Mode "Nhớ bản đồ": a few places glow with their names for 2–3 s, then vanish; tap them again when
//   each name is called (spatial memory + real places).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flag, MapPin, Brain } from "lucide-react";
import type { GameComponentProps } from "../types";
import GameShell, { QuestionPanel, type GameContext, type GameSettings } from "../shared/GameShell";
import type { Difficulty, GameQuestion } from "../shared/questionEngine";
import VietnamMap, { type MapPin as Pin } from "./VietnamMap";
import { cluesForGrade, dist, PLACES, placeXY, type ClueRef, type Place } from "./places";
import "./historyMap.css";
import { supportSeconds } from "../../lib/support/profile";
import { speakVi } from "../../features/tools/conversation/speakVi";

const MODE_KEY = "smartstudy_histmap_mode_v1";
type Mode = "conquest" | "memory";
const loadMode = (): Mode => {
  try {
    return localStorage.getItem(MODE_KEY) === "memory" ? "memory" : "conquest";
  } catch {
    return "conquest";
  }
};

const ROUNDS = 10;
const TAP_TOL: Record<Difficulty, number> = { 1: 7, 2: 5.5, 3: 4.2 }; // map units (≈ 0.9° / 0.7° / 0.5°)
const CHOICE_SHARE: Record<Difficulty, number> = { 1: 0.5, 2: 0.35, 3: 0.2 };
const SHOW_MS: Record<Difficulty, number> = { 1: 3200, 2: 2600, 3: 2000 };
const MEMORY_SIZES = [3, 3, 4, 4, 5, 5];

const gradeNum = (g: string) => Number(g.replace(/\D/g, "")) || 6;

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Multiple-choice version of a clue: the right place + 3 places far away from it. */
export function clueQuestion(ref: ClueRef, settings: GameSettings): GameQuestion {
  const here = placeXY(ref.place);
  const others = shuffle(PLACES.filter((p) => p.id !== ref.place.id && dist(placeXY(p), here) > 8)).slice(0, 3);
  const options = shuffle([ref.place.name, ...others.map((p) => p.name)]);
  return {
    id: `map-${ref.key}`,
    subject: "lich-su-dia-ly",
    grade: settings.grade,
    topic: `${ref.clue.topic} · Lớp ${ref.clue.grade}`,
    difficulty: settings.difficulty,
    prompt: `${ref.clue.text}. Đó là ở đâu?`,
    options,
    correctIndex: options.indexOf(ref.place.name),
    explanation: ref.clue.explain.startsWith(ref.place.name.split(" (")[0]) ? ref.clue.explain : `${ref.place.name}: ${ref.clue.explain}`,
    source: "bank",
  };
}


// ---------------------------------------------------------------- Chinh phục
type RoundKind = "tap" | "choice" | "dragon";
interface Round {
  kind: RoundKind;
  ref: ClueRef | null;
}

function ConquestRound({ ctx }: { ctx: GameContext }) {
  const { settings } = ctx;
  const source = ctx.sources[0];
  const tol = TAP_TOL[settings.difficulty];
  const rounds = useMemo<Round[]>(() => {
    const pool = shuffle(cluesForGrade(gradeNum(settings.grade)));
    const used = new Set<string>();
    const refs = pool.filter((r) => (used.has(r.place.id) ? false : (used.add(r.place.id), true)));
    let k = 0;
    return Array.from({ length: ROUNDS }, (_, i) => {
      if (i === 3 || i === 7) return { kind: "dragon" as const, ref: null };
      const ref = refs[k++ % refs.length];
      return { kind: Math.random() < CHOICE_SHARE[settings.difficulty] ? ("choice" as const) : ("tap" as const), ref };
    });
  }, [settings.grade, settings.difficulty]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [flags, setFlags] = useState<Place[]>([]);
  const [streak, setStreak] = useState(0);
  const [q, setQ] = useState<GameQuestion | null>(null);
  const [tap, setTap] = useState<{ x: number; y: number; ok: boolean } | null>(null);
  const [answer, setAnswer] = useState<{ place: Place; ok: boolean } | null>(null);
  const [canGoOn, setCanGoOn] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const finished = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const round = rounds[idx];
  const scoreRef = useRef(0);
  scoreRef.current = score;

  // prepare the question of the round
  useEffect(() => {
    let alive = true;
    setTap(null);
    setAnswer(null);
    setCanGoOn(false);
    setMsg(null);
    if (!round) return;
    if (round.kind === "dragon") {
      setQ(null);
      source
        .next()
        .then((x) => alive && setQ(x))
        .catch(() => {
          // no bank question: fall back to a map clue
          const ref = cluesForGrade(gradeNum(settings.grade))[0];
          if (alive) setQ(clueQuestion(ref, settings));
        });
    } else {
      const cq = clueQuestion(round.ref!, settings);
      source.noteServed(cq);
      setQ(cq);
    }
    return () => {
      alive = false;
    };
  }, [idx, round, source, settings]);

  useEffect(() => {
    ctx.setLiveScore(score);
  }, [score, ctx]);

  const reward = (ok: boolean, base: number, place?: Place) => {
    if (ok) {
      const s = streak + 1;
      setStreak(s);
      const bonus = s >= 3 ? 20 : 0;
      setScore((x) => x + base + bonus);
      if (place) setFlags((f) => (f.some((p) => p.id === place.id) ? f : [...f, place]));
      setMsg(`+${base + bonus} điểm${bonus ? " (chuỗi đúng!)" : ""}`);
    } else setStreak(0);
  };

  const nextRound = useCallback(() => {
    if (finished.current) return;
    if (idx + 1 >= ROUNDS) {
      finished.current = true;
      ctx.finish({ score: scoreRef.current, note: `Cắm cờ ${flags.length}/${ROUNDS} thành trì` });
      return;
    }
    setIdx((i) => i + 1);
    topRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [idx, ctx, flags.length]);

  // tap on the map
  const onTap = (x: number, y: number) => {
    if (!round || round.kind !== "tap" || tap || ctx.paused || !q) return;
    const place = round.ref!.place;
    const d = dist([x, y], placeXY(place));
    const ok = d <= tol;
    setTap({ x, y, ok });
    setAnswer({ place, ok });
    source.reportAnswer(q, ok);
    reward(ok, 60 + Math.round(40 * Math.max(0, 1 - d / tol)), place);
    if (ok) window.setTimeout(() => setCanGoOn(true), 400);
    else window.setTimeout(() => setCanGoOn(true), 2000);
  };

  // choice / dragon question
  const onPick = (ok: boolean) => {
    if (!q || !round) return;
    source.reportAnswer(q, ok);
    if (round.kind === "choice") {
      setAnswer({ place: round.ref!.place, ok });
      reward(ok, 70, round.ref!.place);
    } else {
      reward(ok, 80); // dragon questions weaken the dragon (shown by the castle counter)
    }
  };

  const pins: Pin[] = [
    ...flags.map((p) => {
      const [x, y] = placeXY(p);
      return { id: `f-${p.id}`, x, y, kind: "flag" as const };
    }),
  ];
  if (answer) {
    const [x, y] = placeXY(answer.place);
    pins.push({ id: "ans", x, y, kind: answer.ok ? "found" : "missed", label: answer.place.name });
  }

  const correctSoFar = source.stats().correct;
  const castlesLeft = Math.max(0, ROUNDS - correctSoFar);

  const promptBox =
    round?.kind === "tap" && q ? (
      <div className="rounded-2xl bg-white border border-slate-200 shadow p-3 sm:p-4" role="group" aria-label="Câu hỏi bản đồ">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            <MapPin className="inline w-3.5 h-3.5 mr-0.5" />
            Chạm bản đồ · {round.ref!.clue.topic} · Lớp {round.ref!.clue.grade}
          </span>
        </div>
        <p className="mt-1 text-base sm:text-lg font-bold text-slate-900 leading-snug">{round.ref!.clue.text}</p>
        {!answer && <p className="mt-1 text-sm text-indigo-700 font-semibold">👉 Chạm vào vị trí đó trên bản đồ.</p>}
        {answer && (
          <div role="status" aria-live="polite" className="mt-2">
            <p className={`font-bold ${answer.ok ? "text-emerald-700" : "text-red-700"}`}>
              {answer.ok ? `Chính xác! ${msg || ""}` : `Chưa đúng – vị trí đúng là ${answer.place.name} (chấm đỏ).`}
            </p>
            <p className="text-sm text-slate-700 mt-1">{round.ref!.clue.explain}</p>
            <button type="button" disabled={!canGoOn} onClick={nextRound} className="mt-2 min-h-[44px] px-5 rounded-xl bg-indigo-600 disabled:bg-slate-300 text-white font-semibold">
              {canGoOn ? (idx + 1 >= ROUNDS ? "Xem kết quả" : "Thành trì tiếp theo") : "Đọc giải thích…"}
            </button>
          </div>
        )}
      </div>
    ) : q ? (
      <div>
        {round?.kind === "dragon" && <p className="mb-1 text-sm font-bold text-rose-700">🐉 Câu hỏi của Rồng Lửa!</p>}
        <QuestionPanel q={q} compact disabled={ctx.paused} onPick={onPick} onDone={nextRound} label={round?.kind === "dragon" ? "Câu hỏi của Rồng" : "Câu hỏi chọn địa danh"} />
      </div>
    ) : (
      <p role="status" className="text-sm text-slate-600">Rồng đang chuẩn bị câu hỏi…</p>
    );

  return (
    <div ref={topRef} className="space-y-2 max-w-5xl mx-auto">
      <div className="grid grid-cols-3 gap-2 text-sm font-bold">
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2">Thành trì {Math.min(idx + 1, ROUNDS)}/{ROUNDS}</div>
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 flex items-center gap-1" aria-label={`Rồng còn giữ ${castlesLeft} thành trì`}>
          🐉 <span className="tabular-nums">{castlesLeft}</span> <span className="hidden sm:inline">thành còn giữ</span>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-1">
          <Flag className="w-4 h-4 text-red-600" /> <span className="tabular-nums">{score}</span> điểm
        </div>
      </div>
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-4 gap-2 items-start">
        <div className="w-full lg:order-2 lg:sticky lg:top-2">{promptBox}</div>
        <div className="w-full lg:order-1">
          <div className="hm-map-box rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-sm">
            <VietnamMap pins={pins} tap={tap} onTap={round?.kind === "tap" ? onTap : undefined} disabled={!!tap || ctx.paused} ariaLabel="Bản đồ Việt Nam – chạm để chọn vị trí" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Nhớ bản đồ
function pickSpread(refs: ClueRef[], n: number): ClueRef[] {
  const out: ClueRef[] = [];
  for (const r of shuffle(refs)) {
    if (out.some((o) => o.place.id === r.place.id || dist(placeXY(o.place), placeXY(r.place)) < 9)) continue;
    out.push(r);
    if (out.length >= n) break;
  }
  return out;
}

function MemoryRound({ ctx }: { ctx: GameContext }) {
  const { settings } = ctx;
  const source = ctx.sources[0];
  const tol = TAP_TOL[settings.difficulty] * 1.3;
  const pool = useMemo(() => cluesForGrade(gradeNum(settings.grade)), [settings.grade]);
  const [level, setLevel] = useState(0);
  const [targets, setTargets] = useState<ClueRef[]>([]);
  const [phase, setPhase] = useState<"show" | "recall" | "between">("show");
  const [left, setLeft] = useState(SHOW_MS[settings.difficulty]);
  const [order, setOrder] = useState<ClueRef[]>([]);
  const [ask, setAsk] = useState(0);
  const [results, setResults] = useState<{ ref: ClueRef; ok: boolean }[]>([]);
  const [tap, setTap] = useState<{ x: number; y: number; ok: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [found, setFound] = useState(0);
  const [total, setTotal] = useState(0);
  const finished = useRef(false);

  // new level
  useEffect(() => {
    const n = MEMORY_SIZES[level] + (settings.difficulty === 3 ? 1 : 0);
    const t = pickSpread(pool, n);
    setTargets(t);
    setOrder(shuffle(t));
    setAsk(0);
    setResults([]);
    setTap(null);
    setLeft(showMs(n));
    setPhase("show");
  }, [level, pool, settings.difficulty]);

  // "Thời gian làm bài" (Hỗ trợ học tập): double memorising time, or no clock + a "Mình nhớ rồi" button
  const [noClock] = useState(() => supportSeconds(1) === null);
  const showMs = (n: number) => (supportSeconds(1) ?? 1) * (SHOW_MS[settings.difficulty] + (n - 3) * 400);

  // countdown while showing (stops while paused)
  useEffect(() => {
    if (phase !== "show" || ctx.paused || noClock) return;
    const t = window.setInterval(() => setLeft((x) => x - 100), 100);
    return () => window.clearInterval(t);
  }, [phase, ctx.paused, noClock]);
  useEffect(() => {
    if (phase === "show" && left <= 0) setPhase("recall");
  }, [left, phase]);

  useEffect(() => {
    if (phase === "recall" && order[ask]) speakVi(order[ask].place.name);
  }, [phase, ask, order]);

  useEffect(() => ctx.setLiveScore(score), [score, ctx]);

  const finishGame = useCallback(
    (s: number, f: number, tot: number) => {
      if (finished.current) return;
      finished.current = true;
      ctx.finish({ score: s, note: `Nhớ đúng ${f}/${tot} địa danh` });
    },
    [ctx]
  );

  const onTap = (x: number, y: number) => {
    if (phase !== "recall" || tap || ctx.paused) return;
    const want = order[ask];
    const remaining = order.slice(ask);
    // the nearest still-hidden place must be the one asked, and close enough
    let nearest = remaining[0];
    for (const r of remaining) if (dist([x, y], placeXY(r.place)) < dist([x, y], placeXY(nearest.place))) nearest = r;
    const ok = nearest.place.id === want.place.id && dist([x, y], placeXY(want.place)) <= tol;
    setTap({ x, y, ok });
    const q = clueQuestion(want, settings);
    source.noteServed(q);
    source.reportAnswer(q, ok);
    const s = score + (ok ? 50 + level * 5 : 0);
    const f = found + (ok ? 1 : 0);
    const tot = total + 1;
    setScore(s);
    setFound(f);
    setTotal(tot);
    window.setTimeout(
      () => {
        setResults((r) => [...r, { ref: want, ok }]);
        setTap(null);
        if (ask + 1 < order.length) setAsk((a) => a + 1);
        else if (level + 1 >= MEMORY_SIZES.length) finishGame(s, f, tot);
        else setPhase("between");
      },
      ok ? 700 : 1600
    );
  };

  const pins: Pin[] = [];
  if (phase === "show")
    targets.forEach((r) => {
      const [x, y] = placeXY(r.place);
      pins.push({ id: r.place.id, x, y, kind: "glow", label: r.place.name });
    });
  else {
    results.forEach(({ ref, ok }) => {
      const [x, y] = placeXY(ref.place);
      pins.push({ id: ref.place.id, x, y, kind: ok ? "found" : "missed", label: ref.place.name });
    });
    if (tap && !tap.ok && order[ask]) {
      const [x, y] = placeXY(order[ask].place);
      pins.push({ id: "truth", x, y, kind: "missed", label: order[ask].place.name });
    }
  }

  const want = order[ask];
  return (
    <div className="space-y-2 max-w-5xl mx-auto">
      <div className="grid grid-cols-3 gap-2 text-sm font-bold">
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2">Vòng {level + 1}/{MEMORY_SIZES.length}</div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
          <Brain className="inline w-4 h-4" /> {found}/{total}
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 tabular-nums">{score} điểm</div>
      </div>
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-4 gap-2 items-start">
        <div className="w-full lg:order-2 rounded-2xl bg-white border border-slate-200 shadow p-3 sm:p-4" role="status" aria-live="polite">
          {phase === "show" && (
            <>
              <p className="font-bold text-slate-900">Ghi nhớ {targets.length} địa danh đang sáng!</p>
              {noClock ? (
                <button type="button" onClick={() => setPhase("recall")} className="mt-2 min-h-[48px] w-full rounded-xl bg-[#2e5cb8] px-4 font-bold text-white">
                  Mình nhớ rồi
                </button>
              ) : (
                <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-amber-500 transition-[width] duration-100" style={{ width: `${Math.max(0, (left / showMs(targets.length)) * 100)}%` }} />
                </div>
              )}
            </>
          )}
          {phase === "recall" && want && (
            <>
              <p className="text-xs font-semibold text-slate-500">
                Địa danh {ask + 1}/{order.length}
              </p>
              <p className="text-lg font-black text-indigo-800">📍 {want.place.name}</p>
              <p className="text-sm text-slate-600">Chạm lại đúng chỗ vừa sáng trên bản đồ.</p>
              {tap && <p className={`mt-1 font-bold ${tap.ok ? "text-emerald-700" : "text-red-700"}`}>{tap.ok ? "Nhớ chính xác!" : "Chưa đúng – xem chấm đỏ."}</p>}
            </>
          )}
          {phase === "between" && (
            <>
              <p className="font-bold text-slate-900">Xong vòng {level + 1}! Lần sau sẽ có nhiều địa danh hơn.</p>
              <ul className="mt-1 text-sm text-slate-700 list-disc pl-5">
                {results.map(({ ref, ok }) => (
                  <li key={ref.place.id}>
                    {ok ? "✅" : "❌"} <b>{ref.place.name}</b> – {ref.clue.text}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setLevel((l) => l + 1)} className="mt-2 min-h-[44px] px-5 rounded-xl bg-indigo-600 text-white font-semibold">
                Vòng tiếp theo
              </button>
            </>
          )}
        </div>
        <div className="w-full lg:order-1">
          <div className="hm-map-box rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-sm">
            <VietnamMap pins={pins} tap={tap} onTap={phase === "recall" ? onTap : undefined} disabled={!!tap || ctx.paused} ariaLabel="Bản đồ Việt Nam – chạm lại các địa danh đã sáng" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- shell
function ModePicker() {
  const [mode, setMode] = useState<Mode>(loadMode);
  const pick = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // ignore
    }
  };
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-1">Chế độ chơi</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Chế độ chơi">
        {([
          ["conquest", "🏯 Chinh phục", "Đọc gợi ý, chạm đúng địa danh"],
          ["memory", "🧠 Nhớ bản đồ", "Địa danh sáng rồi tắt – chạm lại"],
        ] as const).map(([id, label, desc]) => (
          <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => pick(id)} className={`min-h-[56px] rounded-lg border-2 px-2 py-1 text-left ${mode === id ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-700"}`}>
            <span className="block font-semibold">{label}</span>
            <span className="block text-xs text-slate-600">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlayRound({ ctx }: { ctx: GameContext }) {
  const [mode] = useState<Mode>(loadMode);
  return mode === "memory" ? <MemoryRound ctx={ctx} /> : <ConquestRound ctx={ctx} />;
}

const DragonArt = (
  <svg viewBox="0 0 120 90">
    <rect width="120" height="90" fill="#bae6fd" />
    <path d="M40 10 l8 6 l-2 8 l6 8 l-4 10 l8 12 l6 10 l10 8 l4 12 l-6 4 l-8 -10 l-10 -6 l-6 -12 l-8 -10 l-4 -14 l2 -12z" fill="#bbf7d0" stroke="#15803d" strokeWidth="1.5" />
    <path d="M86 20 q10 -8 20 2 q-6 2 -8 8 q-4 -6 -12 -10z" fill="#dc2626" />
    <circle cx="101" cy="22" r="1.5" fill="#fff" />
    <line x1="52" y1="32" x2="52" y2="20" stroke="#7c2d12" strokeWidth="1.5" />
    <path d="M52 20 l8 3 l-8 3z" fill="#dc2626" />
  </svg>
);

export default function HistoryMapGame(props: GameComponentProps) {
  return (
    <GameShell
      gameKey="history-map"
      title="Thành Trì Rồng Lửa: Bản Đồ Sử – Địa"
      tagline="Đọc gợi ý lịch sử – địa lí, chạm đúng địa danh trên bản đồ Việt Nam để cắm cờ, giành lại thành trì từ Rồng Lửa!"
      howToPlay={[
        "Chinh phục: 10 thành trì. Mỗi lượt là một gợi ý (sự kiện, di tích, điểm cực…) – chạm đúng vị trí trên bản đồ hoặc chọn đúng tên địa danh. Chạm càng gần càng nhiều điểm.",
        "Thành trì 4 và 8 là 'Câu hỏi của Rồng' (Lịch sử và Địa lí) – câu bạn làm sai sẽ quay lại ở đây để ôn.",
        "Nhớ bản đồ: vài địa danh sáng lên kèm tên trong 2–3 giây rồi tắt. Khi tên được gọi, chạm lại đúng chỗ. Mỗi vòng thêm địa danh.",
        "Dễ/Vừa/Khó thay đổi độ chính xác cần thiết khi chạm và thời gian ghi nhớ. Bản đồ là hình minh hoạ, tỉ lệ phỏng chừng.",
      ]}
      subjects={["lich-su-dia-ly"]}
      fullscreen
      accent="from-rose-500 to-amber-500"
      art={DragonArt}
      extraSetup={() => <ModePicker />}
      highScore={props.highScore}
      onSaveHighScore={props.onSaveHighScore}
      onAwardReward={props.onAwardReward}
      onLogEvent={props.onLogEvent}
      progress={props.progress}
    >
      {(ctx) => <PlayRound ctx={ctx} />}
    </GameShell>
  );
}
