import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle2, Coffee, Flame, X, BellRing } from "lucide-react";

export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";

interface PomodoroPhaseConfig {
  id: PomodoroPhase;
  label: string;
  shortLabel: string;
  durationSeconds: number;
  badgeText: string;
}

const POMODORO_PHASES: Record<PomodoroPhase, PomodoroPhaseConfig> = {
  focus: {
    id: "focus",
    label: "Học tập trung (25 phút)",
    shortLabel: "25p Tập trung",
    durationSeconds: 25 * 60,
    badgeText: "POMODORO 25:00"
  },
  shortBreak: {
    id: "shortBreak",
    label: "Giải lao ngắn (5 phút)",
    shortLabel: "5p Giải lao",
    durationSeconds: 5 * 60,
    badgeText: "GIẢI LAO 05:00"
  },
  longBreak: {
    id: "longBreak",
    label: "Giải lao dài (15 phút)",
    shortLabel: "15p Nghỉ dài",
    durationSeconds: 15 * 60,
    badgeText: "NGHỈ DÀI 15:00"
  }
};

const STORAGE_KEY = "smart_study_pomodoro_stats_v1";

interface PomodoroTimerProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  isDarkMode?: boolean;
  onCompleteSession?: (phase: PomodoroPhase, completedCount: number) => void;
}

export default function PomodoroTimer({
  isOpen,
  onToggleOpen,
  onClose,
  isDarkMode = false,
  onCompleteSession
}: PomodoroTimerProps) {
  const [phase, setPhase] = useState<PomodoroPhase>("focus");
  const [secondsLeft, setSecondsLeft] = useState<number>(POMODORO_PHASES.focus.durationSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const today = new Date().toISOString().slice(0, 10);
        if (parsed.date === today && typeof parsed.count === "number") {
          return parsed.count;
        }
      }
    } catch {}
    return 0;
  });
  const [justFinishedPhase, setJustFinishedPhase] = useState<PomodoroPhase | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Phát chuông báo hoàn thành bằng Web Audio API (không phụ thuộc file âm thanh ngoài)
  const playCompletionChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.16);

        gain.gain.setValueAtTime(0.001, now + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.24, now + idx * 0.16 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.16);
        osc.stop(now + idx * 0.16 + 0.7);
      });

      window.setTimeout(() => {
        ctx.close().catch(() => {});
      }, 1800);
    } catch {
      // Ignore audio errors if blocked by browser autoplay policy
    }
  }, [soundEnabled]);

  // Đóng popover khi click ra ngoài hoặc bấm phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Bộ đếm ngược thời gian thực
  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);
          setJustFinishedPhase(phase);
          playCompletionChime();

          if (phase === "focus") {
            setCompletedPomodoros((prevCount) => {
              const nextCount = prevCount + 1;
              try {
                const today = new Date().toISOString().slice(0, 10);
                localStorage.setItem(
                  STORAGE_KEY,
                  JSON.stringify({ date: today, count: nextCount })
                );
              } catch {}
              if (onCompleteSession) {
                onCompleteSession("focus", nextCount);
              }
              return nextCount;
            });
          } else if (onCompleteSession) {
            onCompleteSession(phase, completedPomodoros);
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, phase, playCompletionChime, onCompleteSession, completedPomodoros]);

  const handleSelectPhase = (nextPhase: PomodoroPhase) => {
    setIsRunning(false);
    setJustFinishedPhase(null);
    setPhase(nextPhase);
    setSecondsLeft(POMODORO_PHASES[nextPhase].durationSeconds);
  };

  const handleToggleStartPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setJustFinishedPhase(null);
    if (secondsLeft === 0) {
      setSecondsLeft(POMODORO_PHASES[phase].durationSeconds);
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setJustFinishedPhase(null);
    setSecondsLeft(POMODORO_PHASES[phase].durationSeconds);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const totalDuration = POMODORO_PHASES[phase].durationSeconds;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalDuration - secondsLeft) / totalDuration) * 100))
  );

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Nút Pomodoro trên thanh Header chính */}
      <div
        className={`inline-flex items-center rounded-full border transition-all duration-200 shadow-2xs ${
          isRunning
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.4)]"
            : isOpen
            ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white border-blue-400 shadow-xs"
            : isDarkMode
            ? "bg-slate-800/90 hover:bg-slate-700 text-sky-200 border-slate-600"
            : "bg-white/85 hover:bg-white text-blue-700 border-sky-200/90"
        }`}
      >
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={`Đồng hồ Pomodoro ${formatTime(secondsLeft)}`}
          title="Đồng hồ Pomodoro 25 phút học tập trung"
          className="h-9 pl-2.5 pr-2 flex items-center gap-1.5 text-xs font-extrabold cursor-pointer focus-visible:outline-none"
        >
          <Timer className={`w-4 h-4 shrink-0 ${isRunning ? "animate-pulse" : ""}`} />
          <span className="font-mono text-[11px] sm:text-xs font-black tabular-nums tracking-tight">
            {formatTime(secondsLeft)}
          </span>
          <span className="hidden xl:inline text-[10px] font-bold opacity-90">
            {phase === "focus" ? "Pomodoro" : "Giải lao"}
          </span>
        </button>

        {/* Nút Play/Pause nhanh ngay trên thanh Header */}
        <button
          type="button"
          onClick={handleToggleStartPause}
          aria-label={isRunning ? "Tạm dừng Pomodoro" : "Bắt đầu phiên Pomodoro 25 phút"}
          title={isRunning ? "Tạm dừng phiên học" : "Bắt đầu ngay phiên Pomodoro 25 phút"}
          className={`h-7 w-7 mr-1 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isRunning
              ? "bg-white/20 hover:bg-white/30 text-white"
              : isOpen
              ? "bg-white/20 hover:bg-white/30 text-white"
              : isDarkMode
              ? "bg-slate-700 hover:bg-amber-500 text-amber-300 hover:text-white"
              : "bg-sky-100 hover:bg-amber-500 text-blue-700 hover:text-white"
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>
      </div>

      {/* Popover bảng điều khiển Pomodoro 25 phút */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Bảng điều khiển đồng hồ học tập Pomodoro 25 phút"
          className={`fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-88 rounded-3xl border shadow-2xl z-50 overflow-hidden animate-fade-in ${
            isDarkMode
              ? "bg-slate-900/95 border-slate-700 text-slate-100"
              : "bg-white/95 border-sky-200/90 text-slate-800"
          } backdrop-blur-xl`}
        >
          {/* Header Popover */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
              isDarkMode
                ? "bg-slate-800/90 border-slate-700/80"
                : "bg-gradient-to-r from-amber-50/90 via-sky-50/80 to-indigo-50/80 border-sky-200/80"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Timer className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-black text-xs sm:text-sm leading-tight truncate">
                  Đồng Hồ Pomodoro Tập Trung
                </h3>
                <p className={`text-[10px] font-semibold truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  25 phút học sâu • Có chuông báo khi hoàn thành
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng Pomodoro"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDarkMode
                  ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                  : "hover:bg-slate-200/70 text-slate-500 hover:text-slate-800"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Chuyển đổi chế độ: 25p Tập trung / 5p Giải lao / 15p Nghỉ dài */}
            <div
              role="tablist"
              aria-label="Chọn chế độ Pomodoro"
              className={`grid grid-cols-3 gap-1 p-1 rounded-2xl border text-[11px] font-extrabold ${
                isDarkMode ? "bg-slate-800 border-slate-700" : "bg-sky-100/80 border-sky-200/80"
              }`}
            >
              {(Object.keys(POMODORO_PHASES) as PomodoroPhase[]).map((key) => {
                const cfg = POMODORO_PHASES[key];
                const active = phase === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleSelectPhase(key)}
                    className={`py-1.5 px-2 rounded-xl transition-all cursor-pointer truncate ${
                      active
                        ? key === "focus"
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "bg-sky-600 text-white shadow-2xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-600 hover:text-sky-950"
                    }`}
                  >
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Màn hình hiển thị số phút giây lớn */}
            <div
              className={`rounded-2xl p-4 text-center border relative overflow-hidden space-y-2.5 ${
                isDarkMode
                  ? "bg-slate-800/70 border-slate-700"
                  : phase === "focus"
                  ? "bg-gradient-to-b from-amber-50/70 to-sky-50/60 border-amber-200/80"
                  : "bg-gradient-to-b from-sky-50/80 to-emerald-50/50 border-sky-200/80"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                {phase === "focus" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
                    <Flame className="w-3 h-3" />
                    <span>{POMODORO_PHASES[phase].badgeText}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    <Coffee className="w-3 h-3" />
                    <span>{POMODORO_PHASES[phase].badgeText}</span>
                  </span>
                )}
              </div>

              <div
                aria-live="polite"
                className="font-mono font-black text-4xl sm:text-5xl tracking-tight tabular-nums select-none"
              >
                {formatTime(secondsLeft)}
              </div>

              {/* Thanh tiến độ phiên học */}
              <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    phase === "focus"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : "bg-gradient-to-r from-emerald-500 to-sky-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className={`text-[11px] font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                {isRunning
                  ? phase === "focus"
                    ? "Đang tập trung cao độ... Chuông sẽ báo khi hết 25 phút!"
                    : "Đang nghỉ giải lao thư giãn mắt..."
                  : secondsLeft === totalDuration
                  ? "Nhấn Bắt đầu để khởi động phiên học 25 phút tập trung."
                  : "Phiên đồng hồ đang tạm dừng."}
              </p>
            </div>

            {/* Thông báo hoàn thành phiên học */}
            {justFinishedPhase && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-between gap-2 text-xs animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    {justFinishedPhase === "focus"
                      ? "Hoàn thành 25 phút tập trung! Hãy nghỉ ngơi 5 phút nhé."
                      : "Đã hết giờ giải lao! Sẵn sàng vào phiên học mới."}
                  </span>
                </div>
                {justFinishedPhase === "focus" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectPhase("shortBreak");
                      setIsRunning(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shrink-0 cursor-pointer"
                  >
                    Nghỉ 5p
                  </button>
                )}
              </div>
            )}

            {/* Nút điều khiển chính: Bắt đầu / Tạm dừng & Đặt lại */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleStartPause()}
                className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  isRunning
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Tạm dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{secondsLeft < totalDuration && secondsLeft > 0 ? "Tiếp tục" : "Bắt đầu 25 phút"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                aria-label="Đặt lại đồng hồ Pomodoro"
                title="Đặt lại về đầu"
                className={`p-2.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
                  isDarkMode
                    ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Cài đặt Âm báo hoàn thành & Thống kê số phiên hoàn thành hôm nay */}
            <div
              className={`pt-3 border-t flex items-center justify-between gap-2 text-[11px] ${
                isDarkMode ? "border-slate-800 text-slate-300" : "border-sky-200/70 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  aria-pressed={soundEnabled}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                    soundEnabled
                      ? "bg-sky-500/15 border-sky-400/50 text-sky-700 dark:text-sky-300"
                      : "bg-slate-200/60 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? "Chuông báo: Bật" : "Chuông báo: Tắt"}</span>
                </button>

                {soundEnabled && (
                  <button
                    type="button"
                    onClick={playCompletionChime}
                    title="Nghe thử âm báo hoàn thành Pomodoro"
                    className={`px-2 py-1 rounded-lg border font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                      isDarkMode
                        ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300"
                        : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800"
                    }`}
                  >
                    <BellRing className="w-3 h-3" />
                    <span>Thử chuông</span>
                  </button>
                )}
              </div>

              <div className="inline-flex items-center gap-1 font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hôm nay: {completedPomodoros} phiên</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
