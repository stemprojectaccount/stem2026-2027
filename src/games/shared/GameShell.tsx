// Shared frame for the learning games:
//   start screen (grade / subject / difficulty / 1–2 players) → play (the game's own scene, render
//   prop) → results (score, accuracy, every mistake with its explanation, replay / review).
// Also: the standard question box (QuestionPanel), pause overlay, optional full-screen game mode,
// and fair rewards (XP/coins from correct answers, capped).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CheckCircle2, HelpCircle, Pause, Play, RotateCcw, Trophy, Users, User, XCircle } from "lucide-react";
import type { GameComponentProps } from "../types";
import { GAME_GRADES } from "../../data/gameCurriculum";
import { createQuestionSource, GAME_SUBJECT_OPTIONS, type Difficulty, type GameQuestion, type GameSubject, type QuestionSource } from "./questionEngine";
import { enterGameMode, exitGameMode } from "../../lib/gameMode";
import { signalFeedback } from "../../lib/support/feedback";
import { useSupportProfile } from "../../lib/support/profile";

const MathMarkdown = React.lazy(() => import("../../components/MathMarkdown"));

export interface GameSettings {
  grade: string;
  subject: GameSubject;
  difficulty: Difficulty;
  players: 1 | 2;
}

export interface GameResult {
  score: number;
  /** For 2-player games: score of each side (index 0 = left / player 1). */
  playerScores?: number[];
  note?: string;
}

export interface GameContext {
  settings: GameSettings;
  /** One question source per player. */
  sources: QuestionSource[];
  paused: boolean;
  setPaused: (p: boolean) => void;
  finish: (result: GameResult) => void;
  /** Keep the shell informed of the score so "end round" from the pause menu keeps it. */
  setLiveScore: (score: number, playerScores?: number[]) => void;
  reducedMotion: boolean;
}

export interface GameShellProps extends Pick<GameComponentProps, "highScore" | "onSaveHighScore" | "onAwardReward" | "onLogEvent" | "progress"> {
  gameKey: string; // settings/memory key, e.g. "pool-math"
  title: string;
  tagline: string;
  howToPlay: string[];
  /** Subjects the student may choose; one entry = fixed subject (no picker). */
  subjects: GameSubject[];
  allowTwoPlayers?: boolean;
  fullscreen?: boolean;
  accent?: string; // tailwind gradient classes for the start banner
  art?: React.ReactNode;
  /** Extra controls on the start screen (e.g. a unit picker); receives the current settings. */
  extraSetup?: (settings: GameSettings) => React.ReactNode;
  children: (ctx: GameContext) => React.ReactNode;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: "Dễ", 2: "Vừa", 3: "Khó" };

import { rewardFor } from "./rewards";
export { rewardFor };

function useReducedMotion() {
  const fewerEffects = useSupportProfile().reduceMotion;
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setR(mq.matches);
    const on = () => setR(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return r || fewerEffects;
}

export function Rich({ text, className }: { text: string; className?: string }) {
  if (!text.includes("$")) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      <React.Suspense fallback={text}>
        <MathMarkdown text={text} inline />
      </React.Suspense>
    </span>
  );
}

// ---------- Standard question box ----------
export function QuestionPanel({
  q,
  onDone,
  keys = ["1", "2", "3", "4"],
  compact = false,
  disabled = false,
  label,
  onPick,
  hiddenOptions = [],
}: {
  q: GameQuestion;
  onDone: (correct: boolean) => void;
  /** Called as soon as an option is chosen (before the explanation / onDone). */
  onPick?: (correct: boolean) => void;
  /** Options removed by a hint power-up (shown crossed out, not clickable). */
  hiddenOptions?: number[];
  /** Keyboard keys for the options (2-player games give each side its own keys). */
  keys?: string[];
  compact?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [canGoOn, setCanGoOn] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    setPicked(null);
    setCanGoOn(false);
    doneRef.current = false;
  }, [q.id]);

  const finish = useCallback(
    (ok: boolean) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone(ok);
    },
    [onDone]
  );

  const choose = useCallback(
    (i: number) => {
      if (picked !== null || disabled || hiddenOptions.includes(i)) return;
      setPicked(i);
      const ok = i === q.correctIndex;
      signalFeedback(ok ? "correct" : "wrong");
      onPick?.(ok);
      if (ok) setTimeout(() => finish(true), 650);
      // Wrong: the explanation stays until the student is ready (at least 2 s)
      else setTimeout(() => setCanGoOn(true), 2000);
    },
    [picked, disabled, q.correctIndex, finish, onPick, hiddenOptions]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      const i = keys.indexOf(e.key);
      if (i >= 0 && i < q.options.length) {
        e.preventDefault();
        choose(i);
      } else if ((e.key === "Enter" || e.key === " ") && canGoOn && keys[0] === "1") {
        e.preventDefault();
        finish(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keys, q.options.length, choose, canGoOn, finish]);

  const wrong = picked !== null && picked !== q.correctIndex;

  return (
    <div className={`bg-white/95 rounded-2xl border border-slate-200 shadow-lg ${compact ? "p-3" : "p-4 sm:p-5"}`} role="group" aria-label={label || "Câu hỏi"}>
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500 mb-1">
        <span>{q.isReview ? "🔁 Ôn lại câu đã sai" : q.topic || ""}</span>
        <span>{DIFFICULTY_LABEL[q.difficulty]}</span>
      </div>
      <p className={`${compact ? "text-base" : "text-lg sm:text-xl"} font-bold text-slate-900 leading-snug`}>
        <Rich text={q.prompt} />
      </p>
      <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        {q.options.map((opt, i) => {
          const removed = hiddenOptions.includes(i) && picked === null;
          const state = removed ? "dim" : picked === null ? "idle" : i === q.correctIndex ? "right" : i === picked ? "wrong" : "dim";
          return (
            <button
              key={i}
              type="button"
              disabled={picked !== null || disabled || removed}
              aria-label={removed ? "Đáp án đã bị loại" : undefined}
              onClick={() => choose(i)}
              className={
                `${compact ? "min-h-[44px] text-sm px-2 py-1.5" : "min-h-[48px] text-base px-3 py-2"} w-full text-left rounded-xl border-2 flex items-center gap-2 transition-colors ` +
                (state === "idle"
                  ? "border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50"
                  : state === "right"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : state === "wrong"
                  ? "border-red-400 bg-red-50 text-red-900"
                  : "border-slate-100 text-slate-500")
              }
            >
              <kbd className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-sm font-bold flex items-center justify-center">{keys[i] ?? i + 1}</kbd>
              <span className={`flex-1 min-w-0 break-words ${removed ? "line-through opacity-40" : ""}`}><Rich text={opt} /></span>
              {state === "right" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-label="Đáp án đúng" />}
              {state === "wrong" && <XCircle className="w-5 h-5 text-red-500 shrink-0" aria-label="Bạn chọn" />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-3" role="status" aria-live="polite">
          <p className={`font-bold ${wrong ? "text-red-700" : "text-emerald-700"}`}>{wrong ? "Chưa đúng." : "Chính xác!"}</p>
          {wrong && q.explanation && (
            <p className="text-sm text-slate-700 mt-1">
              <Rich text={q.explanation} />
            </p>
          )}
          {wrong && (
            <button
              type="button"
              disabled={!canGoOn}
              onClick={() => finish(false)}
              className="mt-2 min-h-[44px] px-5 rounded-xl bg-indigo-600 disabled:bg-slate-300 text-white font-semibold"
            >
              {canGoOn ? "Hiểu rồi, chơi tiếp" : "Đọc giải thích…"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Results ----------
function GameResults({
  title,
  result,
  sources,
  players,
  reward,
  onReplay,
  onBack,
}: {
  title: string;
  result: GameResult;
  sources: QuestionSource[];
  players: 1 | 2;
  reward: { xp: number; coins: number };
  onReplay: () => void;
  onBack: () => void;
}) {
  const totals = sources.map((s) => s.stats());
  const correct = totals.reduce((n, s) => n + s.correct, 0);
  const answered = totals.reduce((n, s) => n + s.correct + s.wrong, 0);
  const mistakes = sources.flatMap((s) => s.mistakes());
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const winner =
    players === 2 && result.playerScores && result.playerScores.length === 2
      ? result.playerScores[0] === result.playerScores[1]
        ? "Hoà!"
        : result.playerScores[0] > result.playerScores[1]
        ? "Người chơi 1 thắng!"
        : "Người chơi 2 thắng!"
      : null;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
      <div className="text-center">
        <Trophy className="w-10 h-10 mx-auto text-amber-500" />
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{winner || "Hoàn thành ván chơi!"}</h3>
        <p className="text-slate-600">{title}{result.note ? ` · ${result.note}` : ""}</p>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-indigo-50 p-3">
          <p className="text-xs font-semibold text-indigo-700">Điểm</p>
          <p className="text-2xl font-bold text-indigo-900 tabular-nums">{players === 2 && result.playerScores ? result.playerScores.join(" – ") : result.score}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-700">Câu đúng</p>
          <p className="text-2xl font-bold text-emerald-900 tabular-nums">{correct}/{answered}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-700">Chính xác</p>
          <p className="text-2xl font-bold text-amber-900 tabular-nums">{accuracy}%</p>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-slate-600">
        {reward.xp > 0 ? `Nhận +${reward.xp} XP và +${reward.coins} Xu.` : "Trả lời đúng từ 3 câu trở lên để nhận XP và Xu."}
      </p>

      {mistakes.length > 0 && (
        <section className="mt-5">
          <h4 className="font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600" /> Xem lại câu đã sai ({mistakes.length})</h4>
          <ul className="mt-2 space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {mistakes.map((m) => (
              <li key={m.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold text-slate-900"><Rich text={m.prompt} /></p>
                <p className="text-sm text-emerald-800 mt-1">✓ <Rich text={m.options[m.correctIndex]} /></p>
                {m.explanation && <p className="text-sm text-slate-600 mt-0.5"><Rich text={m.explanation} /></p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onReplay} className="min-h-[48px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Chơi ván mới
        </button>
        <button type="button" onClick={onBack} className="min-h-[48px] px-6 rounded-xl border-2 border-slate-200 font-semibold text-slate-700">
          Đổi cài đặt
        </button>
      </div>
    </div>
  );
}

// ---------- Shell ----------
export default function GameShell(props: GameShellProps) {
  const { gameKey, title, tagline, howToPlay, subjects, allowTwoPlayers, fullscreen, accent, art, extraSetup, children, highScore, onSaveHighScore, onAwardReward, onLogEvent, progress } = props;
  const settingsKey = `smartstudy_game_settings_v1:${gameKey}`;
  const defaultGrade = GAME_GRADES.includes(progress?.grade as never) ? (progress!.grade as string) : "Lớp 6";
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey) || "null");
      if (saved && subjects.includes(saved.subject)) return { ...saved, players: allowTwoPlayers ? saved.players || 1 : 1 };
    } catch {
      // ignore
    }
    return { grade: defaultGrade, subject: subjects[0], difficulty: 1, players: 1 };
  });
  const [phase, setPhase] = useState<"start" | "play" | "results">("start");
  const [paused, setPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [reward, setReward] = useState({ xp: 0, coins: 0 });
  const [round, setRound] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const liveScore = useRef<{ score: number; playerScores?: number[] }>({ score: 0 });
  const setLiveScore = useCallback((score: number, playerScores?: number[]) => {
    liveScore.current = { score, playerScores };
  }, []);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings, settingsKey]);

  // New question sources for every round (fresh mistakes list, shared "seen" memory)
  const sources = useMemo(
    () =>
      Array.from({ length: settings.players }, () =>
        createQuestionSource({ grade: settings.grade, subject: settings.subject, difficulty: settings.difficulty, memoryKey: `game:${gameKey}:${settings.subject}` })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round, settings.grade, settings.subject, settings.difficulty, settings.players, gameKey]
  );

  useEffect(() => {
    if (phase === "start") sources.forEach((s) => void s.warmUp());
  }, [phase, sources]);

  // Load the formula renderer early so the first question never shows raw LaTeX
  useEffect(() => {
    void import("../../components/MathMarkdown");
  }, []);

  const leaveFullscreen = useCallback(() => {
    if (fullscreen) void exitGameMode();
  }, [fullscreen]);

  useEffect(() => () => leaveFullscreen(), [leaveFullscreen]);

  const start = async () => {
    setResult(null);
    setPaused(false);
    liveScore.current = settings.players === 2 ? { score: 0, playerScores: [0, 0] } : { score: 0 };
    setPhase("play");
    onLogEvent("state", `Bắt đầu ${title}: ${settings.grade}, ${GAME_SUBJECT_OPTIONS.find((s) => s.id === settings.subject)?.label}, ${DIFFICULTY_LABEL[settings.difficulty]}, ${settings.players} người.`);
    if (fullscreen) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      void enterGameMode(stageRef.current, () => setPaused(true));
    }
  };

  const finish = useCallback(
    (r: GameResult) => {
      leaveFullscreen();
      const correct = sources.reduce((n, s) => n + s.stats().correct, 0);
      const rw = rewardFor(correct);
      setReward(rw);
      setResult(r);
      setPhase("results");
      if (r.score > highScore) onSaveHighScore(r.score);
      if (rw.xp > 0) onAwardReward({ xp: rw.xp, coins: rw.coins, reason: `${title} – ${correct} câu đúng` });
      onLogEvent("score", `${title}: ${r.score} điểm, ${correct} câu đúng.`);
    },
    [sources, highScore, onSaveHighScore, onAwardReward, onLogEvent, title, leaveFullscreen]
  );

  const replay = () => {
    setRound((x) => x + 1);
    void start();
  };

  if (phase === "results" && result) {
    return (
      <GameResults
        title={title}
        result={result}
        sources={sources}
        players={settings.players}
        reward={reward}
        onReplay={replay}
        onBack={() => {
          setRound((x) => x + 1);
          setPhase("start");
        }}
      />
    );
  }

  if (phase === "play") {
    return (
      <div ref={stageRef} className="game-shell-stage relative">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="font-bold text-slate-800 truncate">{title}</p>
          <button type="button" onClick={() => setPaused(true)} aria-label="Tạm dừng" className="min-h-[44px] px-3 rounded-xl border-2 border-slate-200 bg-white font-semibold inline-flex items-center gap-1.5">
            <Pause className="w-4 h-4" /> <span className="hidden sm:inline">Tạm dừng</span>
          </button>
        </div>
        {children({ settings, sources, paused, setPaused, finish, setLiveScore, reducedMotion })}
        {paused && (
          <div role="dialog" aria-modal="true" aria-label="Tạm dừng" className="absolute inset-0 z-30 bg-slate-900/60 rounded-2xl flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
              <h3 className="text-xl font-bold text-slate-900">Tạm dừng</h3>
              <div className="mt-4 grid gap-2">
                <button type="button" autoFocus onClick={() => setPaused(false)} className="min-h-[48px] rounded-xl bg-indigo-600 text-white font-semibold inline-flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" /> Chơi tiếp
                </button>
                <button type="button" onClick={() => { setPaused(false); finish({ ...liveScore.current, note: "Kết thúc sớm" }); }} className="min-h-[48px] rounded-xl border-2 border-slate-200 font-semibold text-slate-700">
                  Kết thúc ván
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- start screen ----------
  const pick = (patch: Partial<GameSettings>) => setSettings((s) => ({ ...s, ...patch }));
  const subjectOptions = GAME_SUBJECT_OPTIONS.filter((s) => subjects.includes(s.id));
  return (
    <div className="max-w-3xl mx-auto">
      <div className={`rounded-2xl p-5 sm:p-7 text-white bg-gradient-to-br ${accent || "from-indigo-600 to-sky-500"} relative overflow-hidden`}>
        <div className="relative z-10 max-w-[70%]">
          <h2 className="text-2xl sm:text-3xl font-black">{title}</h2>
          <p className="mt-1 text-white/90">{tagline}</p>
        </div>
        {art && <div className="absolute right-2 bottom-0 w-32 sm:w-44 opacity-95" aria-hidden="true">{art}</div>}
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Lớp</span>
            <select value={settings.grade} onChange={(e) => pick({ grade: e.target.value })} className="mt-1 w-full min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-base">
              {GAME_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <div>
            <span className="text-sm font-bold text-slate-700">Độ khó</span>
            <div className="mt-1 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Độ khó">
              {([1, 2, 3] as Difficulty[]).map((d) => (
                <button key={d} type="button" role="radio" aria-checked={settings.difficulty === d} onClick={() => pick({ difficulty: d })} className={`min-h-[44px] rounded-lg border-2 font-semibold ${settings.difficulty === d ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-700"}`}>
                  {DIFFICULTY_LABEL[d]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {subjectOptions.length > 1 && (
          <div>
            <span className="text-sm font-bold text-slate-700">Môn học</span>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Môn học">
              {subjectOptions.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={settings.subject === s.id} onClick={() => pick({ subject: s.id })} className={`min-h-[48px] px-2 rounded-lg border-2 text-sm font-semibold flex items-center gap-1.5 ${settings.subject === s.id ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-700"}`}>
                  <span aria-hidden="true">{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
            {settings.subject === "wordbook" && <p className="mt-1 text-xs text-slate-600">Cần ít nhất 4 từ đã lưu trong Sổ từ (mục Tra từ và Dịch).</p>}
          </div>
        )}

        {extraSetup?.(settings)}

        {allowTwoPlayers && (
          <div>
            <span className="text-sm font-bold text-slate-700">Số người chơi</span>
            <div className="mt-1 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Số người chơi">
              <button type="button" role="radio" aria-checked={settings.players === 1} onClick={() => pick({ players: 1 })} className={`min-h-[48px] rounded-lg border-2 font-semibold inline-flex items-center justify-center gap-2 ${settings.players === 1 ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-700"}`}>
                <User className="w-4 h-4" /> 1 người
              </button>
              <button type="button" role="radio" aria-checked={settings.players === 2} onClick={() => pick({ players: 2 })} className={`min-h-[48px] rounded-lg border-2 font-semibold inline-flex items-center justify-center gap-2 ${settings.players === 2 ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-700"}`}>
                <Users className="w-4 h-4" /> 2 người cùng máy
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="button" onClick={start} className="min-h-[52px] px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold inline-flex items-center gap-2">
            <Play className="w-5 h-5" /> Bắt đầu
          </button>
          <button type="button" onClick={() => setShowHelp((s) => !s)} aria-expanded={showHelp} className="min-h-[48px] px-4 rounded-xl border-2 border-slate-200 font-semibold text-slate-700 inline-flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Cách chơi
          </button>
          {highScore > 0 && <span className="text-sm text-slate-600 ml-auto">Kỷ lục: <b className="tabular-nums">{highScore}</b></span>}
        </div>
        {showHelp && (
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            {howToPlay.map((h) => <li key={h}>{h}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
