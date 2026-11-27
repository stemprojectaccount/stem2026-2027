import React, { useState, useEffect, useRef, useCallback } from "react";
import { enterGameMode, exitGameMode, isGameModeNative } from "../../lib/gameMode";
import { GameComponentProps } from "../types";
import { signalFeedback } from "../../lib/support/feedback";
import {
  Clock,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  XCircle,
  BookOpen,
  RotateCcw,
  Award,
  Coins,
  ChevronRight,
  Gift,
  ShieldAlert,
  Play,
} from "lucide-react";
import MathText from "../../components/MathText";
import { rewardStep, rewardText } from "../shared/rewards";
import {
  SupportedGradeNumber,
  getStudentProfile,
  setStudentGradePreference,
} from "../../lib/studentProfile";
import {
  PVMathQuestion,
  fetchBatchQuestionsForRun,
  getLocalFallbackQuestions,
  recordPVQuestionAttempt,
  recordPVRunStudySummary,
} from "../../lib/pixelVanguardQuestions";
import {
  PV_DAILY_COIN_CAP,
  addPVTransaction,
  loadPVProfile,
  savePVProfile,
} from "../pixel-vanguard/pixelVanguardStore";

import {
  INK_SIEGE_SAVE_KEY,
  INK_SIEGE_SURVIVORS,
  loadInkSiegeSaveSummary,
  grantInkSiegeRewardToStorage,
  type InkSiegeSurvivorMeta,
  type InkSiegeSaveSummary,
} from "./inkSiegeStore";

export {
  INK_SIEGE_SAVE_KEY,
  INK_SIEGE_SURVIVORS,
  loadInkSiegeSaveSummary,
  grantInkSiegeRewardToStorage,
  type InkSiegeSurvivorMeta,
  type InkSiegeSaveSummary,
};

type InkTriggerReason = "levelUp" | "bossKilled";

interface ActiveInkPrompt {
  reason: InkTriggerReason;
  levelOrBoss: string;
  question: PVMathQuestion;
}

export default function InkSiegeGame({
  highScore,
  onSaveHighScore,
  onAwardReward,
  onLogEvent,
  progress,
  onOpenRewardShop,
  onNavigateTab,
  onTriggerSuccess,
}: GameComponentProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);

  const [studentProfile, setStudentProfile] = useState(() =>
    getStudentProfile(progress)
  );
  const [pvProfile, setPvProfile] = useState(() => loadPVProfile());

  const activeGrade: SupportedGradeNumber =
    pvProfile.settings.gradeOverride || studentProfile.gradeNumber;

  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const [questionQueue, setQuestionQueue] = useState<PVMathQuestion[]>(() =>
    getLocalFallbackQuestions(activeGrade, 15)
  );
  const usedQuestionIdsRef = useRef<Set<string>>(new Set());

  const [activePrompt, setActivePrompt] = useState<ActiveInkPrompt | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    coinsDelta: number;
    xpDelta: number;
    gemsDelta: number;
  } | null>(null);

  const [runSummary, setRunSummary] = useState<{
    win: boolean;
    timeSurvived: number;
    kills: number;
    goldEarned: number;
    score: number;
    asked: number;
    correct: number;
    reward: { xp: number; coins: number };
    wrong: { question: PVMathQuestion; selectedIndex: number }[];
  } | null>(null);
  // Questions of the current run (shared reward rule: rewards follow correct answers, capped per run)
  const runRef = useRef({ asked: 0, correct: 0, given: { xp: 0, coins: 0 }, wrong: [] as { question: PVMathQuestion; selectedIndex: number }[] });
  const [continueReady, setContinueReady] = useState(true);

  const currentCoins = progress?.coins ?? 0;

  const postToInkGame = useCallback(
    (type: string, data: Record<string, any> = {}) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      try {
        win.postMessage({ type, data }, "*");
      } catch {
        // Ignore cross-frame error
      }
    },
    []
  );

  const reloadQuestionBatch = useCallback(
    async (targetGrade: SupportedGradeNumber) => {
      const result = await fetchBatchQuestionsForRun(
        { ...(progress || {}), grade: `Lớp ${targetGrade}` },
        { count: 14 }
      );
      setQuestionQueue(result.questions);
    },
    [progress]
  );

  useEffect(() => {
    reloadQuestionBatch(activeGrade);
  }, [activeGrade, reloadQuestionBatch]);

  const pickNextQuestion = useCallback(
    (reason: InkTriggerReason): PVMathQuestion => {
      const preferredDiff: 1 | 2 | 3 = reason === "bossKilled" ? 3 : 2;
      const validQueue = questionQueue.filter((q) => q.grade === activeGrade);
      let unused = validQueue.filter((q) => !usedQuestionIdsRef.current.has(q.id));
      if (unused.length === 0) {
        usedQuestionIdsRef.current.clear();
        unused =
          validQueue.length > 0
            ? validQueue
            : getLocalFallbackQuestions(activeGrade, 15);
      }
      const byDiff = unused.filter((q) => q.difficulty === preferredDiff);
      const chosen =
        byDiff.length > 0
          ? byDiff[Math.floor(Math.random() * byDiff.length)]
          : unused[Math.floor(Math.random() * unused.length)];
      usedQuestionIdsRef.current.add(chosen.id);
      return chosen;
    },
    [activeGrade, questionQueue]
  );

  const openQuestionOverlay = useCallback(
    (reason: InkTriggerReason, levelOrBoss: string) => {
      const nextQ = pickNextQuestion(reason);
      setSelectedOption(null);
      setAnswerFeedback(null);
      setActivePrompt({
        reason,
        levelOrBoss,
        question: nextQ,
      });
      postToInkGame("sv:pause");
    },
    [pickNextQuestion, postToInkGame]
  );

  const handleOpenRewardShop = useCallback(() => {
    postToInkGame("sv:pause");
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    if (onOpenRewardShop) {
      onOpenRewardShop("ink_siege");
    } else if (onNavigateTab) {
      onNavigateTab("shop");
    }
  }, [onNavigateTab, onOpenRewardShop, postToInkGame]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg.type !== "string") return;

      if (msg.type === "sv:ready") {
        onLogEvent(
          "state",
          "Người Giữ Trang (Ink Siege) đã khởi động và kết nối SmartStudy Bridge."
        );
      } else if (msg.type === "sv:levelUp") {
        const lv = Number(msg.data?.level) || 2;
        setCurrentLevel(lv);
        const computed = lv * 140;
        if (computed > liveScore) setLiveScore(computed);
        // Mỗi 2 cấp độ trong trận mở 1 câu hỏi Toán tiếp sức
        if (lv % 2 === 0 && !activePrompt) {
          openQuestionOverlay("levelUp", `Cấp ${lv}`);
        }
      } else if (msg.type === "sv:bossKilled") {
        const bossName = String(msg.data?.name || "Trùm Mực");
        openQuestionOverlay("bossKilled", bossName);
      } else if (msg.type === "sv:toast") {
        const text = String(msg.data?.message || "");
        setBannerNotice(text);
        if (msg.data?.requiresShop) {
          handleOpenRewardShop();
        }
      } else if (msg.type === "pv:openShop" && msg.game === "ink-siege") {
        handleOpenRewardShop();
      } else if (msg.type === "sv:runEnd") {
        const d = msg.data || {};
        const win = Boolean(d.win);
        const timeSurvived = Number(d.timeSurvived) || 0;
        const kills = Number(d.kills) || 0;
        const goldEarned = Number(d.goldEarned) || 0;
        const finalScore =
          kills * 8 + timeSurvived * 5 + goldEarned * 2 + (win ? 800 : 0);

        setLiveScore(finalScore);
        if (finalScore > highScore) {
          onSaveHighScore(finalScore);
        }

        // XP/Xu were already given answer by answer (shared rule, capped per run) – no extra bonus here.
        const run = runRef.current;
        if (run.asked > 0) {
          recordPVRunStudySummary({
            grade: activeGrade,
            totalQuestions: run.asked,
            correctCount: run.correct,
            topicsCovered: run.wrong.map((w) => w.question.topic),
          });
        }

        setRunSummary({
          win,
          timeSurvived,
          kills,
          goldEarned,
          score: finalScore,
          asked: run.asked,
          correct: run.correct,
          reward: { ...run.given },
          wrong: [...run.wrong],
        });
        runRef.current = { asked: 0, correct: 0, given: { xp: 0, coins: 0 }, wrong: [] };
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    activeGrade,
    activePrompt,
    handleOpenRewardShop,
    highScore,
    liveScore,
    onAwardReward,
    onLogEvent,
    onSaveHighScore,
    openQuestionOverlay,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden || activePrompt || runSummary) return;
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activePrompt, runSummary]);

  const handleSelectOption = (optionIdx: number) => {
    if (!activePrompt || selectedOption !== null) return;
    setSelectedOption(optionIdx);

    const q = activePrompt.question;
    const isCorrect = optionIdx === q.answerIndex;
    signalFeedback(isCorrect ? "correct" : "wrong");
    recordPVQuestionAttempt(q, optionIdx, 5000);
    const run = runRef.current;
    run.asked += 1;

    if (isCorrect) {
      setContinueReady(true);
      const nextStreak = streak + 1;
      setStreak(nextStreak);

      run.correct += 1;
      const step = rewardStep(run.correct, run.given);
      const latestProf = loadPVProfile();
      const remainingDaily = Math.max(
        0,
        PV_DAILY_COIN_CAP - latestProf.dailyCoinsEarned
      );
      const coinsDelta = Math.min(remainingDaily, step.coins);
      const xpDelta = step.xp;
      run.given = { xp: run.given.xp + xpDelta, coins: run.given.coins + coinsDelta };
      const gemsDelta = activePrompt.reason === "bossKilled" ? 120 : 60;

      if (coinsDelta > 0 || xpDelta > 0) {
        onAwardReward({
          xp: xpDelta,
          coins: coinsDelta,
          reason: `Giải đúng Toán Lớp ${q.grade} trong Người Giữ Trang`,
        });
      }

      const updatedProf = savePVProfile(
        addPVTransaction(
          {
            ...latestProf,
            dailyCoinsEarned: latestProf.dailyCoinsEarned + coinsDelta,
          },
          "earn",
          coinsDelta,
          `Giải đúng Toán (${q.topic}) trong Người Giữ Trang`
        )
      );
      setPvProfile(updatedProf);

      // Cộng Ngọc Tri Thức & hồi máu trực tiếp vào trận Ink Siege
      postToInkGame("sv:grantReward", {
        gems: gemsDelta,
        gold: 80,
        healRun: true,
        toast: `Giải Toán đúng! +${gemsDelta} Ngọc Tri Thức và Hồi 35% HP!`,
      });

      setAnswerFeedback({
        isCorrect: true,
        coinsDelta,
        xpDelta,
        gemsDelta,
      });
    } else {
      setStreak(0);
      run.wrong.push({ question: q, selectedIndex: optionIdx });
      // read the explanation at least 2 seconds before going back to the fight
      setContinueReady(false);
      window.setTimeout(() => setContinueReady(true), 2000);
      postToInkGame("sv:grantReward", {
        gold: 25,
        healRun: false,
        toast: "Thưởng khích lệ +25 Vàng Thư Viện!",
      });
      setAnswerFeedback({
        isCorrect: false,
        coinsDelta: 0,
        xpDelta: 0,
        gemsDelta: 0,
      });
    }
  };

  const handleContinueAfterQuestion = () => {
    setActivePrompt(null);
    setSelectedOption(null);
    setAnswerFeedback(null);
    postToInkGame("sv:resume");
    iframeRef.current?.focus();
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    postToInkGame("sv:config", { muted: next });
  };

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      void enterGameMode(stageContainerRef.current, () => setIsFullscreen(false));
      setTimeout(() => iframeRef.current?.focus(), 120);
    } else {
      setIsFullscreen(false);
      void exitGameMode();
    }
  };

  // Leaving browser full screen (Esc, swipe) leaves game mode too
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreen && !isGameModeNative()) {
        setIsFullscreen(false);
        void exitGameMode();
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [isFullscreen]);

  // Never leave the app stuck in game mode when the game closes
  useEffect(() => () => void exitGameMode(), []);

  const handleQuickStartRun = () => {
    postToInkGame("sv:startQuickRun");
    iframeRef.current?.focus();
  };

  const handleSelectGrade = (newGrade: SupportedGradeNumber) => {
    setStudentGradePreference(newGrade);
    setStudentProfile(getStudentProfile({ ...(progress || {}), grade: `Lớp ${newGrade}` }));
    const updated = savePVProfile({
      ...pvProfile,
      settings: {
        ...pvProfile.settings,
        gradeOverride: newGrade,
      },
    });
    setPvProfile(updated);
    onTriggerSuccess?.(`📚 Đã chuyển ngân hàng câu hỏi sang Toán Lớp ${newGrade}!`);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* 1. BẢNG THỐNG KÊ TRẬN ĐẤU & SỐ DƯ XU TRÍ TUỆ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-sky-200/90 px-4 py-3 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-blue-700 border border-sky-200 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Thời gian</p>
            <p className="text-base font-black text-slate-900 font-mono tabular-nums">
              {formatTimer(sessionSeconds)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-sky-200/90 px-4 py-3 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Điểm màn</p>
            <p className="text-base font-black text-slate-900 font-mono tabular-nums">
              {liveScore} (Cấp {currentLevel})
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-sky-200/90 px-4 py-3 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Chuỗi đúng</p>
            <p className="text-base font-black text-slate-900 font-mono tabular-nums">
              {streak} liên tiếp
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-sky-200/90 px-4 py-3 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Kỷ lục</p>
            <p className="text-base font-black text-slate-900 font-mono tabular-nums">
              {Math.max(highScore, liveScore)}
            </p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl px-4 py-3 shadow-2xs flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
              Toán Lớp {activeGrade}
            </p>
            <p className="text-sm font-black font-mono tabular-nums flex items-center gap-1 mt-0.5">
              <Coins className="w-4 h-4 text-amber-300" />
              <span>{currentCoins} Xu</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenRewardShop}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Đổi Quà</span>
          </button>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ NHANH & TỐI ƯU ĐIỆN THOẠI */}
      <div className="bg-white rounded-2xl border border-sky-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleQuickStartRun}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <span>▶ Vào trận</span>
          </button>

          <button
            type="button"
            onClick={() => {
              postToInkGame("sv:openInGameShop");
              iframeRef.current?.focus();
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            <span>Shop trong game (random mảnh và đồ)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenRewardShop}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cửa hàng điểm thưởng (đổi và random đồ)</span>
          </button>

          {/* Bộ chọn nhanh Khối lớp */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            {([6, 7, 8, 9] as SupportedGradeNumber[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleSelectGrade(g)}
                className={`min-h-[44px] px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  activeGrade === g
                    ? "bg-[#2e5cb8] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-600" />
                <span>Đã tắt tiếng</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-blue-700" />
                <span>Âm thanh</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Thu nhỏ màn hình</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Toàn màn hình (ĐT / PC)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {bannerNotice && (
        <div
          onClick={handleOpenRewardShop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenRewardShop();
            }
          }}
          className="bg-amber-50 hover:bg-amber-100/80 border border-amber-300 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs font-bold text-amber-950 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Thông báo từ Người Giữ Trang: <strong>{bannerNotice}</strong> — Nhấn vào đây để đổi Ngọc Tri Thức / Mở Thủ Thư bằng Xu Trí Tuệ!
            </span>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-extrabold shrink-0">
            Mở cửa hàng điểm thưởng
          </span>
        </div>
      )}

      {/* 3. KHUNG GAME (TỐI ƯU MOBILE DỌC + 16:9 DESKTOP + CHẾ ĐỘ FULL MÀN HÌNH ĐIỆN THOẠI) */}
      <div
        ref={stageContainerRef}
        className={
          isFullscreen
            ? "game-mode-stage fixed inset-0 z-[300] w-full h-[100dvh] bg-slate-950 flex flex-col overflow-hidden"
            : "relative w-full h-[clamp(440px,74dvh,780px)] lg:aspect-video lg:max-h-[calc(100dvh-10.5rem)] bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-lg flex flex-col"
        }
      >
        {/* Thanh điều khiển nổi khi ở chế độ Toàn màn hình (đặc biệt tiện trên điện thoại) */}
        {isFullscreen && (
          <div className="game-mode-hud" role="toolbar" aria-label="Điều khiển trò chơi">
            <span className="game-mode-hud__info">
              Lớp {activeGrade} · {currentCoins} Xu · {liveScore} điểm
            </span>
            <div className="game-mode-hud__actions">
              <button type="button" onClick={handleQuickStartRun} className="game-mode-hud__btn game-mode-hud__btn--play" aria-label="Vào trận">
                <Play className="w-[18px] h-[18px] fill-current" />
              </button>
              <button type="button" onClick={handleOpenRewardShop} className="game-mode-hud__btn game-mode-hud__btn--shop" aria-label="Đổi quà">
                <ShoppingBag className="w-[18px] h-[18px]" />
              </button>
              <button type="button" onClick={handleToggleMute} className="game-mode-hud__btn" aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}>
                {isMuted ? <VolumeX className="w-[18px] h-[18px] text-rose-300" /> : <Volume2 className="w-[18px] h-[18px]" />}
              </button>
              <button type="button" onClick={handleToggleFullscreen} className="game-mode-hud__btn game-mode-hud__btn--exit" aria-label="Thoát toàn màn hình">
                <Minimize2 className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        )}

        {/* Nút nổi bật Full màn hình nhanh trên góc trái cho người dùng Điện thoại khi chưa phóng to */}
        {!isFullscreen && (
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="sm:hidden absolute top-2.5 left-2.5 z-20 min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900/90 border border-amber-400/60 text-amber-300 text-sm font-black inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Chơi toàn màn hình</span>
          </button>
        )}

        <iframe
          ref={iframeRef}
          src="/ink-siege/index.html"
          title="Người Giữ Trang · Ink Siege"
          sandbox="allow-scripts allow-same-origin"
          allow="autoplay; fullscreen"
          className="w-full flex-1 h-full border-0 block"
        />

        {/* OVERLAY CÂU HỎI TOÁN HỌC TIẾP SỨC */}
        {activePrompt && (
          <div className="absolute inset-0 z-30 bg-slate-950/88 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 text-white rounded-3xl border border-slate-700 shadow-2xl p-5 sm:p-7 space-y-5 my-auto">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold border bg-indigo-500/20 text-indigo-300 border-indigo-400/40">
                  {activePrompt.reason === "bossKilled"
                    ? `Thưởng Hạ Trùm: ${activePrompt.levelOrBoss}`
                    : `Tiếp Sức Tri Thức · ${activePrompt.levelOrBoss}`}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-sky-300 text-xs font-bold border border-slate-700">
                  Toán Lớp {activePrompt.question.grade} · {activePrompt.question.topic}
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Giải toán nhận Ngọc Tri Thức và hồi phục thủ thư!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Trả lời đúng để nhận ngay <strong>+60 Ngọc Tri Thức</strong>, <strong>+80 Vàng</strong>, hồi <strong>35% HP</strong> trong trận và tích lũy Xu Trí Tuệ!
                </p>
              </div>

              <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-4 sm:p-5">
                <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  <MathText content={activePrompt.question.question} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activePrompt.question.options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  const isAnswer = idx === activePrompt.question.answerIndex;
                  let btnStyle =
                    "bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-white";
                  if (selectedOption !== null) {
                    if (isAnswer) {
                      btnStyle =
                        "bg-emerald-600/30 border-emerald-400 text-emerald-100";
                    } else if (isChosen) {
                      btnStyle = "bg-rose-600/30 border-rose-400 text-rose-100";
                    } else {
                      btnStyle = "bg-slate-900/50 border-slate-800 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={selectedOption !== null}
                      onClick={() => handleSelectOption(idx)}
                      className={`min-h-[54px] p-3.5 rounded-2xl border-2 text-left font-bold text-sm transition-all flex items-center gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-slate-950/60 border border-white/15 flex items-center justify-center text-xs font-black shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <MathText content={opt} />
                      </span>
                    </button>
                  );
                })}
              </div>

              {answerFeedback && (
                <div
                  className={`rounded-2xl p-4 border ${
                    answerFeedback.isCorrect
                      ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-100"
                      : "bg-amber-950/60 border-amber-500/50 text-amber-100"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                      {answerFeedback.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>
                            Chính xác!{" "}
                            {rewardText({ xp: answerFeedback.xpDelta, coins: answerFeedback.coinsDelta }, [`+${answerFeedback.gemsDelta} Ngọc Tri Thức`])}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
                          <span>
                            Chưa chính xác! Đã nhận +25 Vàng khích lệ vào trận.
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-white/10">
                    <strong className="text-sky-300">Giải thích: </strong>
                    <MathText content={activePrompt.question.explanation} />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleContinueAfterQuestion}
                      disabled={!continueReady}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-slate-500 disabled:text-slate-200 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer disabled:cursor-wait"
                    >
                      <span>{continueReady ? "Tiếp tục bảo vệ Thư Viện" : "Đọc giải thích…"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL TỔNG KẾT SAU LƯỢT CHƠI */}
        {runSummary && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 text-white rounded-3xl border border-slate-700 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black">
                    {runSummary.win ? "Bảo vệ thư viện thành công!" : "Kết thúc ca gác thư viện"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Người Giữ Trang · Toán Lớp {activeGrade}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-bold">Thời gian</p>
                  <p className="text-base font-black text-white font-mono mt-0.5">
                    {formatTimer(runSummary.timeSurvived)}
                  </p>
                </div>
                <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-bold">Quái mực</p>
                  <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {runSummary.kills}
                  </p>
                </div>
                <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-bold">Tổng điểm</p>
                  <p className="text-base font-black text-amber-300 font-mono mt-0.5">
                    {runSummary.score}
                  </p>
                </div>
              </div>

              <div className="text-sm text-slate-300">
                Câu hỏi Toán: <b className="text-white">{runSummary.correct}/{runSummary.asked}</b> câu đúng
                {runSummary.reward.xp > 0 || runSummary.reward.coins > 0 ? (
                  <> · đã nhận {rewardText(runSummary.reward)}</>
                ) : runSummary.asked > 0 && runSummary.correct < 3 ? (
                  <> · đúng từ 3 câu để nhận XP/Xu</>
                ) : null}
              </div>

              {runSummary.wrong.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  <p className="text-xs font-bold text-amber-300">Xem lại câu đã sai ({runSummary.wrong.length})</p>
                  {runSummary.wrong.map((w, i) => (
                    <div key={i} className="rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs space-y-1">
                      <div className="font-bold text-white"><MathText content={w.question.question} /></div>
                      <div className="text-emerald-300">✓ <MathText content={w.question.options[w.question.answerIndex]} /></div>
                      <div className="text-slate-300"><MathText content={w.question.explanation} /></div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRunSummary(null);
                    handleOpenRewardShop();
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>Đổi thủ thư và ngọc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRunSummary(null)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi tiếp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. HƯỚNG DẪN ĐIỀU KHIỂN NGẮN GỌN */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/90 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold">
          <BookOpen className="w-4 h-4 text-[#2e5cb8] shrink-0" />
          <span>
            <strong>Điều khiển Người Giữ Trang:</strong> Di chuyển bằng <strong>WASD / Phím mũi tên</strong> (hoặc kéo chạm trên màn hình). Vũ khí tự động ngắm bắn; nhấn <strong>Space / E</strong> để tung Kỹ năng Đặc trưng của Thủ thư, <strong>P / Esc</strong> để tạm dừng.
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#2e5cb8]">
          Mỗi 2 cấp độ hoặc khi hạ Boss sẽ mở câu hỏi Toán Lớp {activeGrade} để nhận Ngọc Tri Thức!
        </span>
      </div>
    </div>
  );
}
