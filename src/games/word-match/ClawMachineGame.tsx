// Máy Gắp Thuật Ngữ – a claw machine full of answer capsules.
// The definition (or question) is on the screen; move the claw over the capsule holding the right
// term and grab it. Aim matters: grabbing off-centre may let the capsule slip (3 grabs per
// question). A correct capsule wins a plush toy for the student's collection.
// Questions: short-term bank (termBank.ts) mixed with the shared engine (bank, AI, review, word book).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Hand } from "lucide-react";
import type { GameComponentProps } from "../types";
import GameShell, { Rich, type GameContext } from "../shared/GameShell";
import type { GameQuestion } from "../shared/questionEngine";
import { hasTermBank, termQuestion, TERM_SUBJECTS } from "./termBank";
import { signalFeedback } from "../../lib/support/feedback";

const QUESTIONS_PER_ROUND = 10;
const GRABS_PER_QUESTION = 3;
const TOYS = ["🧸", "🐰", "🐱", "🐶", "🐼", "🦊", "🐸", "🐵", "🐧", "🦁", "🐯", "🐨"];
const COLLECTION_KEY = "smartstudy_claw_collection_v1";
const CAPSULE_COLORS = ["#f472b6", "#60a5fa", "#facc15", "#34d399"];
const SLOTS = [13, 37, 63, 87]; // capsule centres (% of the glass width)
const HALF_WIDTH = 10.5; // capsule half width in %
const SURE_GRAB = 4; // within this distance the grab never slips

const plain = (s: string) => s.replace(/\$|\\[a-z]+|[{}]/gi, "");
const fitsCapsule = (q: GameQuestion) => q.options.length === 4 && q.options.every((o) => plain(o).length <= 32);

function loadCollection(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(COLLECTION_KEY) || "{}");
  } catch {
    return {};
  }
}
function addToCollection(toy: string) {
  const c = loadCollection();
  c[toy] = (c[toy] || 0) + 1;
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(c));
  } catch {
    // ignore
  }
}

type Phase = "loading" | "aim" | "drop" | "rise" | "result";

interface Capsule {
  opt: number; // option index
  x: number; // centre %
  color: string;
}

function ClawRound({ ctx }: { ctx: GameContext }) {
  const source = ctx.sources[0];
  const subject = ctx.settings.subject;
  const [q, setQ] = useState<GameQuestion | null>(null);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [clawX, setClawX] = useState(50);
  const [phase, setPhase] = useState<Phase>("loading");
  const [holding, setHolding] = useState<number | null>(null); // capsule index in the claw
  const [message, setMessage] = useState<string | null>(null);
  const [grabsLeft, setGrabsLeft] = useState(GRABS_PER_QUESTION);
  const [result, setResult] = useState<{ ok: boolean; toy?: string; points: number } | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [count, setCount] = useState(0);
  const [score, setScore] = useState(0);
  const [toys, setToys] = useState<string[]>([]);
  const usedTerms = useRef(new Set<string>());
  const moveTimer = useRef<number | null>(null);
  const finished = useRef(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const nextQuestion = useCallback(async () => {
    setPhase("loading");
    setResult(null);
    setHolding(null);
    setMessage(null);
    setCanContinue(false);
    setGrabsLeft(GRABS_PER_QUESTION);
    let next: GameQuestion | null = null;
    if (hasTermBank(subject) && Math.random() < 0.5) {
      next = termQuestion(subject, ctx.settings.grade, usedTerms.current);
      if (next) source.noteServed(next);
    }
    // From the engine, keep questions whose answers fit on a capsule
    for (let i = 0; !next && i < 5; i++) {
      const cand = await source.next();
      if (fitsCapsule(cand) || i === 4) next = cand;
    }
    if (!next || !fitsCapsule(next)) {
      const fallbackSubject = hasTermBank(subject) ? subject : TERM_SUBJECTS[0];
      const t = termQuestion(fallbackSubject, ctx.settings.grade, usedTerms.current);
      if (t) {
        source.noteServed(t);
        next = t;
      }
    }
    if (!next) return;
    usedTerms.current.add(next.options[next.correctIndex]);
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    setCapsules(
      order.map((opt, slot) => ({
        opt,
        x: SLOTS[slot] + (Math.random() * 4 - 2),
        color: CAPSULE_COLORS[slot],
      }))
    );
    setQ(next);
    setClawX(50);
    setPhase("aim");
  }, [ctx.settings.grade, source, subject]);

  useEffect(() => {
    void nextQuestion();
  }, [nextQuestion]);

  const finishRound = useCallback(
    (finalScore: number, gotToys: string[]) => {
      if (finished.current) return;
      finished.current = true;
      ctx.finish({ score: finalScore, note: gotToys.length ? `Gắp được ${gotToys.length} thú bông: ${gotToys.join(" ")}` : undefined });
    },
    [ctx]
  );

  const settle = (ok: boolean, holdIdx: number | null) => {
    if (!q) return;
    signalFeedback(ok ? "correct" : "wrong");
    source.reportAnswer(q, ok);
    if (ok) {
      const pts = 20 + (grabsLeft === GRABS_PER_QUESTION ? 10 : 0);
      const toy = TOYS[Math.floor(Math.random() * TOYS.length)];
      addToCollection(toy);
      const newScore = score + pts;
      const newToys = [...toys, toy];
      setScore(newScore);
      setToys(newToys);
      ctx.setLiveScore(newScore);
      setResult({ ok: true, toy, points: pts });
      setPhase("result");
      later(() => advance(newScore, newToys), 1500);
    } else {
      setResult({ ok: false, points: 0 });
      setPhase("result");
      setHolding(holdIdx);
      later(() => setCanContinue(true), 2000);
    }
  };

  const advance = (s = score, t = toys) => {
    const n = count + 1;
    setCount(n);
    if (n >= QUESTIONS_PER_ROUND) finishRound(s, t);
    else void nextQuestion();
  };

  const grab = () => {
    if (phase !== "aim" || ctx.paused || !q) return;
    setPhase("drop");
    setMessage(null);
    later(() => {
      // nearest capsule under the claw
      let best = -1;
      let dist = Infinity;
      capsules.forEach((c, i) => {
        const d = Math.abs(c.x - clawX);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      const reach = dist <= HALF_WIDTH;
      const slipChance = dist <= SURE_GRAB ? 0 : Math.min(0.85, (dist - SURE_GRAB) / (HALF_WIDTH - SURE_GRAB));
      const slipped = reach && Math.random() < slipChance;
      setHolding(reach && !slipped ? best : null);
      setPhase("rise");
      later(() => {
        if (reach && !slipped) {
          settle(capsules[best].opt === q.correctIndex, best);
          return;
        }
        const left = grabsLeft - 1;
        setGrabsLeft(left);
        if (left <= 0) {
          setMessage("Hết lượt gắp! Xem đáp án đúng nhé.");
          settle(false, null);
        } else {
          setMessage(slipped ? "Tuột mất rồi! Canh giữa viên nang hơn nhé." : "Trượt rồi! Không có viên nang nào bên dưới.");
          setPhase("aim");
        }
      }, 750);
    }, 750);
  };

  // ---------- controls ----------
  const nudge = (dx: number) => setClawX((x) => Math.max(4, Math.min(96, x + dx)));
  const startMove = (dx: number) => {
    if (phase !== "aim") return;
    nudge(dx);
    stopMove();
    moveTimer.current = window.setInterval(() => nudge(dx), 30);
  };
  const stopMove = () => {
    if (moveTimer.current) window.clearInterval(moveTimer.current);
    moveTimer.current = null;
  };
  useEffect(() => stopMove, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ctx.paused) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (phase === "aim") nudge(-2.5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (phase === "aim") nudge(2.5);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (phase === "aim") grab();
        else if (phase === "result" && result && !result.ok && canContinue) advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onGlassPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "aim" || ctx.paused) return;
    const r = e.currentTarget.getBoundingClientRect();
    setClawX(Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100)));
  };

  const clawTop = phase === "drop" ? 58 : 6; // % of the glass height
  const correctCapsule = q ? capsules.findIndex((c) => c.opt === q.correctIndex) : -1;

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
        <span className="tabular-nums">Câu {Math.min(count + 1, QUESTIONS_PER_ROUND)}/{QUESTIONS_PER_ROUND} · {score} điểm</span>
        <span className="inline-flex items-center gap-1" aria-label={`Còn ${grabsLeft} lượt gắp`}>
          {Array.from({ length: GRABS_PER_QUESTION }, (_, i) => (
            <Hand key={i} className={`w-4 h-4 ${i < grabsLeft ? "text-pink-600" : "text-slate-300"}`} />
          ))}
        </span>
        <span className="text-lg" aria-label={`Thú bông ván này: ${toys.length}`}>{toys.join("") || "—"}</span>
      </div>

      {/* Question */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-3 sm:p-4" role="group" aria-label="Định nghĩa">
        <p className="text-xs font-semibold text-slate-500">{q?.isReview ? "🔁 Ôn lại câu đã sai · " : ""}Gắp viên nang có đáp án đúng:</p>
        <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{q ? <Rich text={q.prompt} /> : "Đang chuẩn bị máy gắp…"}</p>
      </div>

      {/* Machine */}
      <div className="rounded-3xl p-2.5 sm:p-3 bg-gradient-to-b from-pink-500 to-fuchsia-600 shadow-lg">
        <div
          className="relative h-64 sm:h-72 rounded-2xl overflow-hidden touch-none select-none cursor-pointer"
          style={{ background: "linear-gradient(180deg,#e0f2fe 0%,#f0f9ff 60%,#fce7f3 100%)" }}
          onPointerDown={onGlassPointer}
          role="application"
          aria-label="Máy gắp. Mũi tên trái/phải để di chuyển cần gắp, phím cách để gắp."
        >
          {/* rail */}
          <div className="absolute left-0 right-0 top-0 h-3 bg-slate-400" />
          {/* cable + claw */}
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${clawX}%`, transition: phase === "aim" ? "left 60ms linear" : "left 0s" }}
          >
            <div className="w-0.5 bg-slate-500" style={{ height: `calc(${clawTop}% + 12px)`, minHeight: 12, transition: "height 0.7s ease-in-out" }} />
          </div>
          <div
            className="absolute -translate-x-1/2"
            style={{ left: `${clawX}%`, top: `calc(${clawTop}% + 12px)`, transition: `top 0.7s ease-in-out, left ${phase === "aim" ? "60ms linear" : "0s"}` }}
            aria-hidden="true"
          >
            <svg width="56" height="40" viewBox="0 0 56 40">
              <rect x="20" y="0" width="16" height="10" rx="3" fill="#475569" />
              <path d={holding !== null || phase === "drop" ? "M22 10 L10 30 L18 38" : "M22 10 L6 26 L12 38"} stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d={holding !== null || phase === "drop" ? "M34 10 L46 30 L38 38" : "M34 10 L50 26 L44 38"} stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
            {holding !== null && q && capsules[holding] && (
              <div className="-mt-3 mx-auto w-20 sm:w-24">
                <CapsuleView text={q.options[capsules[holding].opt]} color={capsules[holding].color} state={phase === "result" && result ? (result.ok ? "right" : "wrong") : "idle"} />
              </div>
            )}
          </div>
          {/* capsules on the floor */}
          {q &&
            capsules.map((c, i) =>
              holding === i ? null : (
                <div key={i} className="absolute bottom-2" style={{ left: `${c.x}%`, width: `${HALF_WIDTH * 2}%`, transform: "translateX(-50%)" }}>
                  <CapsuleView text={q.options[c.opt]} color={c.color} state={phase === "result" && result && !result.ok && i === correctCapsule ? "right" : "idle"} />
                </div>
              )
            )}
          {message && (
            <div role="status" className="absolute left-1/2 top-12 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-900/85 text-white text-sm font-bold whitespace-nowrap max-w-[95%] truncate">
              {message}
            </div>
          )}
          {phase === "result" && result?.ok && (
            <div role="status" className="absolute inset-x-0 top-14 text-center">
              <span className="inline-block px-4 py-2 rounded-2xl bg-white/95 shadow text-emerald-700 font-black text-lg">
                Đúng rồi! +{result.points} {result.toy}
              </span>
            </div>
          )}
        </div>

        {/* controls */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Sang trái"
            onPointerDown={() => startMove(-1.4)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            onPointerCancel={stopMove}
            disabled={phase !== "aim"}
            className="w-16 h-14 rounded-2xl bg-white/90 disabled:opacity-50 text-fuchsia-700 flex items-center justify-center shadow"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <button
            type="button"
            onClick={grab}
            disabled={phase !== "aim" || ctx.paused}
            className="flex-1 h-14 rounded-2xl bg-yellow-300 hover:bg-yellow-200 disabled:opacity-60 text-fuchsia-900 text-lg font-black shadow"
          >
            GẮP!
          </button>
          <button
            type="button"
            aria-label="Sang phải"
            onPointerDown={() => startMove(1.4)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            onPointerCancel={stopMove}
            disabled={phase !== "aim"}
            className="w-16 h-14 rounded-2xl bg-white/90 disabled:opacity-50 text-fuchsia-700 flex items-center justify-center shadow"
          >
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Explanation after a wrong answer */}
      {phase === "result" && result && !result.ok && q && (
        <div className="rounded-2xl bg-white border border-rose-200 p-3 sm:p-4" role="status">
          <p className="font-bold text-rose-700">{message || "Chưa đúng."}</p>
          <p className="text-sm text-slate-800 mt-1">
            Đáp án đúng: <b><Rich text={q.options[q.correctIndex]} /></b>
          </p>
          {q.explanation && <p className="text-sm text-slate-600 mt-1"><Rich text={q.explanation} /></p>}
          <button type="button" disabled={!canContinue} onClick={() => advance()} className="mt-2 min-h-[44px] px-5 rounded-xl bg-indigo-600 disabled:bg-slate-300 text-white font-semibold">
            {canContinue ? "Hiểu rồi, gắp tiếp" : "Đọc giải thích…"}
          </button>
        </div>
      )}
      {phase === "aim" && <p className="text-center text-xs text-slate-600">Chạm vào kính để đưa cần gắp tới đó, hoặc giữ nút ◀ ▶ (máy tính: phím mũi tên, phím cách để gắp). Canh giữa viên nang để không bị tuột!</p>}
    </div>
  );
}

function CapsuleView({ text, color, state }: { text: string; color: string; state: "idle" | "right" | "wrong" }) {
  return (
    <div
      className={`rounded-[999px] overflow-hidden border-2 shadow text-center ${state === "right" ? "border-emerald-500 ring-4 ring-emerald-300" : state === "wrong" ? "border-rose-500 ring-4 ring-rose-300" : "border-white"}`}
    >
      <div className="h-3 sm:h-4" style={{ background: color }} />
      <div className="bg-white/95 px-1 py-1 min-h-[2.6rem] flex items-center justify-center">
        <span className="text-[11px] sm:text-xs font-bold leading-tight text-slate-900 line-clamp-3 break-words">
          <Rich text={text} />
        </span>
      </div>
    </div>
  );
}

const ClawArt = (
  <svg viewBox="0 0 120 90">
    <rect x="20" y="4" width="80" height="82" rx="10" fill="#f9a8d4" stroke="#fff" strokeWidth="3" />
    <rect x="28" y="12" width="64" height="50" rx="6" fill="#e0f2fe" />
    <line x1="60" y1="12" x2="60" y2="30" stroke="#475569" strokeWidth="2" />
    <path d="M54 30 L48 40 M66 30 L72 40" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
    <circle cx="44" cy="54" r="7" fill="#60a5fa" />
    <circle cx="62" cy="55" r="7" fill="#facc15" />
    <circle cx="78" cy="54" r="7" fill="#34d399" />
    <rect x="44" y="68" width="32" height="10" rx="4" fill="#fde047" />
  </svg>
);

export default function ClawMachineGame(props: GameComponentProps) {
  return (
    <GameShell
      gameKey="claw-terms"
      title="Máy Gắp Thuật Ngữ"
      tagline="Đọc định nghĩa, gắp đúng viên nang, sưu tầm thú bông!"
      howToPlay={[
        `Mỗi ván ${QUESTIONS_PER_ROUND} câu. Đọc định nghĩa hoặc câu hỏi, rồi gắp viên nang có đáp án đúng.`,
        "Di chuyển cần gắp: chạm vào kính máy, giữ nút ◀ ▶, hoặc phím mũi tên. Bấm GẮP (phím cách).",
        `Mỗi câu có ${GRABS_PER_QUESTION} lượt gắp. Canh lệch khỏi giữa viên nang thì dễ bị tuột!`,
        "Gắp đúng ngay lần đầu được thêm điểm và một thú bông cho bộ sưu tập. Gắp nhầm thì xem giải thích rồi chơi tiếp.",
      ]}
      subjects={["toan", "khtn", "ngu-van", "lich-su-dia-ly", "tieng-anh", "tin-hoc", "gdcd", "wordbook"]}
      fullscreen
      accent="from-pink-500 to-fuchsia-500"
      art={ClawArt}
      highScore={props.highScore}
      onSaveHighScore={props.onSaveHighScore}
      onAwardReward={props.onAwardReward}
      onLogEvent={props.onLogEvent}
      progress={props.progress}
    >
      {(ctx) => <ClawRound ctx={ctx} />}
    </GameShell>
  );
}
