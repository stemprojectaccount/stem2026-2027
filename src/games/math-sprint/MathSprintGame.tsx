// Hồ Bơi Tính Nhẩm – mental-math diving game (1 player, or 2 players racing on one device).
// Every correct answer is a dive: faster answers and longer streaks give fancier dives and more
// points; a wrong answer is a belly flop with the explanation (time stops while reading it in
// 1-player mode). Questions: half generated mental math with mistake-based options (mentalMath.ts),
// half from the shared engine (bank + AI + review of earlier mistakes).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Flame } from "lucide-react";
import type { GameComponentProps } from "../types";
import GameShell, { QuestionPanel, type GameContext } from "../shared/GameShell";
import type { GameQuestion } from "../shared/questionEngine";
import { mentalMathQuestion } from "./mentalMath";
import { supportSeconds } from "../../lib/support/profile";
import PoolCanvas, { type DiveEvent } from "./PoolCanvas";
import "./pool.css";

const ROUND_SECONDS = 90;
const GENERATED_SHARE = 0.5;

function diveFor(streak: number): { flips: number; name: string } {
  if (streak >= 8) return { flips: 3, name: "Lộn 3 vòng xoắn!" };
  if (streak >= 5) return { flips: 2, name: "Lộn 2 vòng!" };
  if (streak >= 3) return { flips: 1, name: "Lộn 1 vòng!" };
  return { flips: 0, name: "Nhảy đẹp!" };
}

/** Nhãn ngắn hiện ở góc (màn hình đọc được + người không xem kịp hiệu ứng). */
function DiveBadge({ dive }: { dive: DiveEvent | null }) {
  if (!dive) return null;
  const flop = dive.kind === "flop";
  return (
    <span key={dive.id} className={`pool-badge-pop absolute right-2 top-2 px-2.5 py-1 rounded-xl text-sm font-black ${flop ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
      {dive.name}
      {dive.points > 0 ? ` +${dive.points}` : ""}
    </span>
  );
}

interface LaneProps {
  ctx: GameContext;
  idx: number;
  keys: string[];
  compact: boolean;
  running: boolean;
  color: string;
  label: string;
  onScore: (score: number) => void;
  onReading: (reading: boolean) => void;
}

function Lane({ ctx, idx, keys, compact, running, color, label, onScore, onReading }: LaneProps) {
  const [q, setQ] = useState<GameQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [jump, setJump] = useState<DiveEvent | null>(null);
  const shownAt = useRef(Date.now());
  const jumpId = useRef(0);
  const source = ctx.sources[idx];

  const loadNext = useCallback(async () => {
    let next: GameQuestion;
    if (Math.random() < GENERATED_SHARE) {
      next = mentalMathQuestion(ctx.settings.grade, ctx.settings.difficulty);
      source.noteServed(next);
    } else {
      next = await source.next();
    }
    shownAt.current = Date.now();
    setQ(next);
  }, [ctx.settings.grade, ctx.settings.difficulty, source]);

  useEffect(() => {
    void loadNext();
  }, [loadNext]);

  const onPick = (ok: boolean) => {
    if (!q) return;
    source.reportAnswer(q, ok);
    if (ok) {
      const secs = (Date.now() - shownAt.current) / 1000;
      const nextStreak = streak + 1;
      const pts = 10 + (secs < 4 ? 5 : secs < 8 ? 3 : 0) + Math.min(10, nextStreak * 2);
      const total = score + pts;
      const d = diveFor(nextStreak);
      setStreak(nextStreak);
      setBest((b) => Math.max(b, nextStreak));
      setScore(total);
      onScore(total);
      setJump({ id: ++jumpId.current, kind: "dive", flips: d.flips, name: d.name, points: pts, streak: nextStreak, fast: secs < 4 });
    } else {
      setStreak(0);
      setJump({ id: ++jumpId.current, kind: "flop", flips: 0, name: "Bụp! Rơi bụng", points: 0, streak: 0, fast: false });
      onReading(true);
    }
  };

  const onDone = () => {
    onReading(false);
    void loadNext();
  };

  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2 text-sm font-bold">
        <span className="tabular-nums text-slate-900">{label}: {score} điểm</span>
        <span className="inline-flex items-center gap-1 text-amber-700" title="Chuỗi đúng">
          <Flame className="w-4 h-4" /> x{streak}
          {!compact && best > 0 && <span className="text-slate-500 font-semibold"> · tốt nhất {best}</span>}
        </span>
      </div>
      <div className="relative">
        <PoolCanvas dive={jump} color={color} compact={compact} paused={ctx.paused} reducedMotion={ctx.reducedMotion} />
        {!compact && <DiveBadge dive={jump} />}
      </div>
      {q && <QuestionPanel q={q} keys={keys} compact={compact} disabled={!running} onPick={onPick} onDone={onDone} label={`Câu hỏi của ${label}`} />}
    </div>
  );
}

function PoolRound({ ctx }: { ctx: GameContext }) {
  const two = ctx.settings.players === 2;
  // "Thời gian làm bài" (Hỗ trợ học tập): 1 player may play with no clock (end via Tạm dừng → Kết thúc ván);
  // a 2-player race needs an end, so "no limit" gives it double time instead.
  const [noClock] = useState(() => !two && supportSeconds(ROUND_SECONDS) === null);
  const [timeLeft, setTimeLeft] = useState(() => supportSeconds(ROUND_SECONDS) ?? ROUND_SECONDS * 2);
  const [scores, setScores] = useState([0, 0]);
  const [reading, setReading] = useState([false, false]);
  const finished = useRef(false);
  // 1 player: the clock waits while the explanation is read. 2 players: it never waits (fair race).
  const clockStopped = noClock || ctx.paused || (!two && reading[0]);

  useEffect(() => {
    if (clockStopped || finished.current) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [clockStopped]);

  useEffect(() => {
    if (timeLeft > 0 || finished.current) return;
    finished.current = true;
    ctx.finish(two ? { score: Math.max(...scores), playerScores: scores } : { score: scores[0] });
  }, [timeLeft, two, scores, ctx]);

  const setScoreAt = (i: number) => (s: number) => {
    setScores((prev) => {
      const next = [...prev];
      next[i] = s;
      ctx.setLiveScore(two ? Math.max(...next) : next[0], two ? next : undefined);
      return next;
    });
  };
  const setReadingAt = (i: number) => (r: boolean) => setReading((prev) => prev.map((v, k) => (k === i ? r : v)));

  const running = !ctx.paused && timeLeft > 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        {noClock ? (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-base bg-sky-100 text-sky-900" role="timer">
            <Clock className="w-5 h-5" /> Không giới hạn giờ · muốn dừng: Tạm dừng → Kết thúc ván
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black tabular-nums text-lg ${timeLeft <= 10 ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-900"}`} role="timer" aria-label={`Còn ${timeLeft} giây`}>
            <Clock className="w-5 h-5" /> {timeLeft}s
          </span>
        )}
        {!noClock && !two && reading[0] && <span className="text-xs font-semibold text-slate-600">(đồng hồ dừng khi đọc giải thích)</span>}
      </div>
      <div className={two ? "flex gap-3" : ""}>
        <Lane ctx={ctx} idx={0} keys={["1", "2", "3", "4"]} compact={two} running={running} color="#2563eb" label={two ? "Người 1 (phím 1–4)" : "Bạn"} onScore={setScoreAt(0)} onReading={setReadingAt(0)} />
        {two && <Lane ctx={ctx} idx={1} keys={["7", "8", "9", "0"]} compact running={running} color="#db2777" label="Người 2 (phím 7–0)" onScore={setScoreAt(1)} onReading={setReadingAt(1)} />}
      </div>
    </div>
  );
}

const PoolArt = (
  <svg viewBox="0 0 120 90">
    <rect x="8" y="10" width="6" height="80" fill="#e2e8f0" />
    <rect x="8" y="10" width="40" height="5" rx="2" fill="#fb923c" />
    <circle cx="60" cy="30" r="7" fill="#fcd34d" />
    <rect x="54" y="37" width="12" height="10" rx="4" fill="#1d4ed8" transform="rotate(30 60 42)" />
    <rect x="0" y="70" width="120" height="20" fill="#0ea5e9" />
    <path d="M0 72 Q15 66 30 72 T60 72 T90 72 T120 72" stroke="#e0f2fe" strokeWidth="3" fill="none" />
  </svg>
);

export default function MathSprintGame(props: GameComponentProps) {
  return (
    <GameShell
      gameKey="pool-math"
      title="Hồ Bơi Tính Nhẩm"
      tagline="Tính nhẩm thật nhanh để nhảy cầu thật đẹp! Toán lớp 6–9."
      howToPlay={[
        `${supportSeconds(ROUND_SECONDS) === null ? `Không giới hạn giờ (chơi 2 người: ${ROUND_SECONDS * 2} giây)` : `Mỗi ván ${supportSeconds(ROUND_SECONDS)} giây`}. Trả lời đúng = một cú nhảy cầu: trả lời càng nhanh và đúng liên tiếp càng nhiều, cú nhảy càng đẹp, càng nhiều điểm.`,
        "Sai thì 'rơi bụng' và mất chuỗi; đọc giải thích rồi bấm 'Hiểu rồi' (chơi 1 người: đồng hồ dừng trong lúc đọc).",
        "Câu sai sẽ quay lại sau vài câu để bạn sửa.",
        "2 người: Người 1 dùng phím 1–4 (bên trái), Người 2 dùng phím 7–0 (bên phải), hoặc chạm vào đáp án.",
      ]}
      subjects={["toan"]}
      allowTwoPlayers
      fullscreen
      accent="from-sky-500 to-cyan-400"
      art={PoolArt}
      highScore={props.highScore}
      onSaveHighScore={props.onSaveHighScore}
      onAwardReward={props.onAwardReward}
      onLogEvent={props.onLogEvent}
      progress={props.progress}
    >
      {(ctx) => <PoolRound ctx={ctx} />}
    </GameShell>
  );
}
