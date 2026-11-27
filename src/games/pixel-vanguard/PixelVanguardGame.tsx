import React, { useState, useEffect, useRef, useCallback } from "react";
import { enterGameMode, exitGameMode, isGameModeNative } from "../../lib/gameMode";
import { GameComponentProps } from "../types";
import { supportSeconds, useSupportProfile } from "../../lib/support/profile";
import { signalFeedback } from "../../lib/support/feedback";
import { rewardStep, rewardText } from "../shared/rewards";
import {
  Clock,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ShoppingBag,
  Settings,
  Sparkles,
  Shield,
  Heart,
  Zap,
  CheckCircle2,
  XCircle,
  BookOpen,
  RotateCcw,
  Award,
  Coins,
  HelpCircle,
  ChevronRight,
  Lock,
  Check,
  AlertTriangle,
  Swords,
  Gift,
} from "lucide-react";
import MathText from "../../components/MathText";
import {
  SupportedGradeNumber,
  getStudentProfile,
  setStudentGradePreference,
} from "../../lib/studentProfile";
import {
  PVMathQuestion,
  fetchBatchQuestionsForRun,
  getGradeTopicsList,
  getLocalFallbackQuestions,
  recordPVQuestionAttempt,
  recordPVRunStudySummary,
} from "../../lib/pixelVanguardQuestions";
import {
  PVHeroId,
  PVHeroMeta,
  PVProfileState,
  PVUpgrades,
  PV_DAILY_COIN_CAP,
  PV_GACHA_COST,
  PV_HERO_CATALOG,
  PV_PITY_THRESHOLD,
  PV_UPGRADE_METAS,
  addPVTransaction,
  loadPVProfile,
  rollPVHeroGacha,
  savePVProfile,
} from "./pixelVanguardStore";

type TriggerReason = "roomClear" | "card" | "revive" | "boss";

interface ActiveQuestionPrompt {
  reason: TriggerReason;
  floor: number;
  level: number;
  question: PVMathQuestion;
  attempt: number; // 1 hoặc 2 (cho phép thử lại 1 lần khi mở thẻ Buff)
}

interface RunSummaryData {
  win: boolean;
  floor: number;
  level: number;
  kills: number;
  gold: number;
  score: number;
  questionsAsked: number;
  questionsCorrect: number;
  coinsEarnedInRun: number;
  xpEarnedInRun: number;
  wrongQuestions: {
    question: PVMathQuestion;
    selectedIndex: number;
  }[];
}

/**
 * Vẽ avatar Pixel Art sắc nét cho 10 nhân vật bằng SVG
 */
export function HeroPixelAvatar({
  heroId,
  accentColor,
  size = 56,
}: {
  heroId: PVHeroId;
  accentColor: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className="rounded-xl bg-slate-950 border border-slate-800 shrink-0"
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      <rect width="16" height="16" fill="#0d1021" />
      {/* Hào quang nền */}
      <rect x="2" y="2" width="12" height="12" fill={accentColor} fillOpacity="0.16" />
      {/* Thân giáp */}
      <rect x="4" y="9" width="8" height="5" fill={accentColor} />
      <rect x="5" y="10" width="6" height="3" fill="#1e293b" />
      {/* Đầu & Mũ chiến binh */}
      <rect x="4" y="3" width="8" height="6" fill={accentColor} />
      <rect x="5" y="5" width="6" height="3" fill="#0f172a" />
      {/* Mắt phát sáng đặc trưng theo từng nhân vật */}
      <rect
        x="6"
        y="6"
        width="1.5"
        height="1.5"
        fill={heroId === "vampire_noctis" ? "#ff2a55" : "#ffffff"}
      />
      <rect
        x="9"
        y="6"
        width="1.5"
        height="1.5"
        fill={heroId === "vampire_noctis" ? "#ff2a55" : "#ffffff"}
      />
      {/* Phụ kiện mũ/sừng/vương miện theo class */}
      {(heroId === "knight" || heroId === "paladin" || heroId === "frost_valkyrie") && (
        <rect x="7" y="1" width="2" height="2" fill="#fde047" />
      )}
      {(heroId === "wizard" || heroId === "pyromancer") && (
        <polygon points="8,1 4,4 12,4" fill={accentColor} />
      )}
      {(heroId === "cyber_scientist" || heroId === "hazmat_commando") && (
        <rect x="5" y="5" width="6" height="2" fill="#38bdf8" />
      )}
      {(heroId === "ninja_kage" || heroId === "plague_chemist") && (
        <rect x="3" y="4" width="10" height="1" fill="#f43f5e" />
      )}
    </svg>
  );
}

const REASON_LABELS: Record<
  TriggerReason,
  { badge: string; title: string; subtitle: string; colorClass: string }
> = {
  roomClear: {
    badge: "Mở rương kho báu phòng đấu",
    title: "Giải toán mở rương chiến lợi phẩm!",
    subtitle: "Trả lời đúng để mở rương nhận vũ khí/vật phẩm quý. Trả lời sai vẫn nhận quà khích lệ nhỏ.",
    colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  card: {
    badge: "Mở khoá thẻ cường hoá (buff)",
    title: "Vượt thử thách để chọn thẻ sức mạnh!",
    subtitle: "Trả lời đúng để chọn 1 trong 3 thẻ Buff cho tầng tiếp theo (Được phép thử lại 1 lần nếu sai).",
    colorClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  revive: {
    badge: "Cơ hội hồi sinh giữa trận",
    title: "Giải đúng để hồi sinh chiến binh!",
    subtitle: "Nhân vật vừa cạn HP! Trả lời đúng câu hỏi này để hồi sinh ngay với 60% HP và đầy Giáp (tối đa 1 lần/lượt).",
    colorClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  },
  boss: {
    badge: "Đột phá giai đoạn 2 trùm cuối",
    title: "Câu hỏi tổng hợp khắc chế boss!",
    subtitle: "Boss đang bước vào trạng thái cuồng nộ! Trả lời đúng để hồi +2 HP, nạp đầy Giáp và đóng băng Boss 2,2 giây.",
    colorClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
};

export default function PixelVanguardGame({
  highScore,
  onSaveHighScore,
  onAwardReward,
  onLogEvent,
  progress,
  onUpdateProgress,
  onNavigateTab,
  onTriggerSuccess,
  onOpenRewardShop,
}: GameComponentProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);

  // Hồ sơ học sinh & khối lớp chuẩn
  const [studentProfile, setStudentProfile] = useState(() =>
    getStudentProfile(progress)
  );
  const [pvProfile, setPvProfile] = useState<PVProfileState>(() =>
    loadPVProfile()
  );
  // Giây cho mỗi câu Toán sau cài đặt "Thời gian làm bài" (Hỗ trợ học tập); 0 = không giới hạn
  const qTimer = supportSeconds(pvProfile.settings.timerSeconds || 0, useSupportProfile()) ?? 0;

  const activeGrade: SupportedGradeNumber =
    pvProfile.settings.gradeOverride || studentProfile.gradeNumber;

  // Trạng thái ván chơi hiện tại
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Ngân hàng câu hỏi cho lượt chơi hiện tại
  const [questionQueue, setQuestionQueue] = useState<PVMathQuestion[]>(() =>
    getLocalFallbackQuestions(activeGrade, 15)
  );
  const usedQuestionIdsRef = useRef<Set<string>>(new Set());

  // Thống kê câu hỏi trong 1 lượt chạy (run)
  const [runQuestionsAsked, setRunQuestionsAsked] = useState<number>(0);
  const [runQuestionsCorrect, setRunQuestionsCorrect] = useState<number>(0);
  const [runCoinsEarned, setRunCoinsEarned] = useState<number>(0);
  const [runXpEarned, setRunXpEarned] = useState<number>(0);
  const [continueReady, setContinueReady] = useState(true);
  const [runWrongList, setRunWrongList] = useState<
    { question: PVMathQuestion; selectedIndex: number }[]
  >([]);

  // Overlay câu hỏi đang mở
  const [activePrompt, setActivePrompt] = useState<ActiveQuestionPrompt | null>(
    null
  );
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(30);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    canRetryCard: boolean;
    coinsDelta: number;
    xpDelta: number;
  } | null>(null);

  // Modals: Cửa hàng Tướng & Gacha, Cài đặt, Tổng kết sau lượt chơi
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [shopTab, setShopTab] = useState<"heroes" | "gacha" | "upgrades" | "history">("heroes");
  const [gachaSpinning, setGachaSpinning] = useState<boolean>(false);
  const [gachaResult, setGachaResult] = useState<{
    hero: PVHeroMeta;
    isDuplicate: boolean;
    refundCoins: number;
    fragmentsGained: number;
    pityTriggered: boolean;
  } | null>(null);
  const [shopBannerMsg, setShopBannerMsg] = useState<string | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [runSummary, setRunSummary] = useState<RunSummaryData | null>(null);
  const [restReminderShown, setRestReminderShown] = useState<boolean>(false);

  // Số dư Xu Trí Tuệ thực tế từ ứng dụng
  const currentCoins = progress?.coins ?? 0;

  // Hàm gửi message an toàn xuống iframe game
  const postToGame = useCallback((type: string, payload: Record<string, any> = {}) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type, ...payload }, "*");
    } catch {
      // Ignore cross-frame errors
    }
  }, []);

  // Đồng bộ hồ sơ & cấu hình xuống iframe
  const syncGameBridge = useCallback(
    (prof: PVProfileState) => {
      postToGame("pv:profile", {
        unlocked: prof.unlocked,
        upgrades: prof.upgrades,
        selectedHero: prof.selectedHero,
      });
      postToGame("pv:config", {
        mode: prof.settings.mode,
        rooms: 5,
        hideDev: true,
        questionsEnabled: prof.settings.questionsEnabled,
      });
    },
    [postToGame]
  );

  // Mở cửa hàng điểm thưởng tích hợp ngay trong GameHub (hoặc chuyển tới tab Shop nếu cần)
  const handleNavigateToAppShop = useCallback(
    (heroId?: string) => {
      postToGame("pv:pause");
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      try {
        localStorage.setItem("smart_study_shop_initial_tab", "pixel_vanguard");
        if (heroId) {
          localStorage.setItem("smart_study_shop_initial_hero", heroId);
        }
      } catch {
        // Ignore storage errors
      }
      const heroMeta = heroId
        ? PV_HERO_CATALOG.find((h) => h.id === heroId)
        : undefined;
      onTriggerSuccess?.(
        heroMeta
          ? `🛒 Đã mở Cửa hàng điểm thưởng để đổi ${heroMeta.vietnameseName}!`
          : "🛒 Đã mở Cửa hàng điểm thưởng · Chiến Binh Pixel!"
      );
      if (onOpenRewardShop) {
        onOpenRewardShop("pixel_vanguard", heroId);
      } else if (onNavigateTab) {
        onNavigateTab("shop");
      } else {
        setShowShopModal(true);
      }
    },
    [onNavigateTab, onOpenRewardShop, onTriggerSuccess, postToGame]
  );

  // Hàm xử lý Toast Notification tập trung trong Pixel Vanguard:
  // Phát sự kiện postMessage 'pv:openShop' tới ứng dụng chính khi có thông báo về trạng thái mua sắm hoặc thiếu shard
  const handlePVToastNotification = useCallback(
    (
      message: string,
      options?: {
        requiresShop?: boolean;
        missingShards?: boolean;
        clicked?: boolean;
        heroId?: string;
        reason?: string;
      }
    ) => {
      setShopBannerMsg(message);

      const lowerMsg = message.toLowerCase();
      const detectedMissingShard =
        Boolean(options?.missingShards) ||
        lowerMsg.includes("shard") ||
        lowerMsg.includes("không đủ") ||
        lowerMsg.includes("khong du") ||
        lowerMsg.includes("thiếu") ||
        lowerMsg.includes("thieu") ||
        lowerMsg.includes("not enough") ||
        lowerMsg.includes("chưa đủ");

      const detectedShoppingNeed =
        Boolean(options?.requiresShop) ||
        Boolean(options?.clicked) ||
        detectedMissingShard ||
        lowerMsg.includes("cửa hàng") ||
        lowerMsg.includes("cua hang") ||
        lowerMsg.includes("mở khoá") ||
        lowerMsg.includes("mo khoa") ||
        lowerMsg.includes("mua sắm") ||
        lowerMsg.includes("cần ") ||
        lowerMsg.includes("khoá") ||
        lowerMsg.includes("unlock") ||
        lowerMsg.includes("shop");

      if (detectedShoppingNeed) {
        try {
          window.postMessage(
            {
              type: "pv:openShop",
              targetTab: "shop",
              targetSubTab: "pixel_vanguard",
              pageName: "Cửa hàng điểm thưởng",
              hero: options?.heroId,
              message,
              missingShards: detectedMissingShard,
              reason:
                options?.reason ||
                (detectedMissingShard
                  ? "missing_shards"
                  : options?.clicked
                  ? "toast_clicked"
                  : "shopping_state_detected"),
            },
            window.location.origin
          );
        } catch {
          // Ignore postMessage error
        }
        handleNavigateToAppShop(options?.heroId);
      }
    },
    [handleNavigateToAppShop]
  );

  // Tải gói 12–15 câu hỏi Toán đúng khối lớp khi bắt đầu / đổi lớp
  const reloadQuestionBatch = useCallback(
    async (targetGrade: SupportedGradeNumber, diff?: 1 | 2 | 3, topic?: string) => {
      const result = await fetchBatchQuestionsForRun(
        { ...(progress || {}), grade: `Lớp ${targetGrade}` },
        {
          count: 14,
          difficultyTarget: diff,
          topicFilter: topic === "all" ? undefined : topic,
        }
      );
      setQuestionQueue(result.questions);
    },
    [progress]
  );

  useEffect(() => {
    reloadQuestionBatch(
      activeGrade,
      pvProfile.settings.preferredDifficulty,
      pvProfile.settings.topicFilter
    );
  }, [
    activeGrade,
    pvProfile.settings.preferredDifficulty,
    pvProfile.settings.topicFilter,
    reloadQuestionBatch,
  ]);

  // Lấy 1 câu hỏi kế tiếp từ hàng đợi (đảm bảo đúng activeGrade 100%)
  const pickNextQuestion = useCallback(
    (reason: TriggerReason): PVMathQuestion => {
      const preferredDiff: 1 | 2 | 3 =
        reason === "boss"
          ? 3
          : reason === "revive"
          ? 2
          : pvProfile.settings.preferredDifficulty;

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
    [activeGrade, pvProfile.settings.preferredDifficulty, questionQueue]
  );

  // Mở overlay câu hỏi khi nhận yêu cầu từ bridge
  const openQuestionOverlay = useCallback(
    (reason: TriggerReason, floor: number, level: number, attempt = 1) => {
      const nextQ = pickNextQuestion(reason);
      setSelectedOption(null);
      setAnswerFeedback(null);
      setQuestionTimeLeft(qTimer);
      setActivePrompt({
        reason,
        floor,
        level,
        question: nextQ,
        attempt,
      });
      postToGame("pv:pause");
    },
    [pickNextQuestion, postToGame, qTimer]
  );

  // Lắng nghe postMessage từ iframe Pixel Vanguard
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data.type !== "string" || !data.type.startsWith("pv:")) {
        return;
      }

      if (data.type === "pv:ready") {
        const latest = loadPVProfile();
        setPvProfile(latest);
        syncGameBridge(latest);
        onLogEvent("state", "Pixel Vanguard đã sẵn sàng và đồng bộ hồ sơ học sinh.");
      } else if (data.type === "pv:muteState") {
        setIsMuted(Boolean(data.muted));
      } else if (data.type === "pv:toast") {
        const toastMsg =
          typeof data.message === "string" && data.message.trim()
            ? data.message
            : "Mở cửa hàng điểm thưởng để đổi nhân vật và nâng cấp";
        const heroId = typeof data.hero === "string" ? data.hero : undefined;
        handlePVToastNotification(toastMsg, {
          requiresShop: Boolean(data.requiresShop),
          missingShards: Boolean(data.missingShards),
          heroId,
          reason: typeof data.reason === "string" ? data.reason : undefined,
        });
      } else if (data.type === "pv:openShop") {
        handleNavigateToAppShop(
          typeof data.hero === "string" ? data.hero : undefined
        );
      } else if (data.type === "pv:roomCleared") {
        setCurrentFloor(Number(data.floor) || 1);
        setCurrentLevel(Number(data.level) || 1);
        const computedScore =
          (Number(data.floor) || 1) * 120 +
          (Number(data.kills) || 0) * 10 +
          (Number(data.gold) || 0) * 2;
        setLiveScore(computedScore);
        if (computedScore > highScore) {
          onSaveHighScore(computedScore);
        }
      } else if (data.type === "pv:needQuestion") {
        const reason = (data.reason || "roomClear") as TriggerReason;
        const floor = Number(data.floor) || 1;
        const level = Number(data.level) || 1;
        openQuestionOverlay(reason, floor, level, 1);
      } else if (data.type === "pv:runEnd") {
        const win = Boolean(data.win);
        const floor = Number(data.floor) || 1;
        const level = Number(data.level) || 1;
        const kills = Number(data.kills) || 0;
        const gold = Number(data.gold) || 0;
        const finalScore =
          floor * 150 + kills * 12 + gold * 3 + (win ? 500 : 0);

        setLiveScore(finalScore);
        if (finalScore > highScore) {
          onSaveHighScore(finalScore);
        }

        // XP/Xu đã được trao theo từng câu đúng (quy tắc chung, có trần mỗi lượt) – không cộng thêm thưởng cuối lượt.
        const bonusCoins = 0;
        const bonusXp = 0;
        const latestProf = loadPVProfile();

        const updatedProf = savePVProfile(
          addPVTransaction(
            {
              ...latestProf,
              bestFloor: Math.max(latestProf.bestFloor, floor),
              totalRunsCompleted: latestProf.totalRunsCompleted + 1,
              dailyCoinsEarned: latestProf.dailyCoinsEarned + bonusCoins,
            },
            "earn",
            bonusCoins,
            `Hoàn thành lượt chơi Tầng ${floor}-${level}`
          )
        );
        setPvProfile(updatedProf);

        recordPVRunStudySummary({
          grade: activeGrade,
          totalQuestions: runQuestionsAsked,
          correctCount: runQuestionsCorrect,
          topicsCovered: runWrongList.map((w) => w.question.topic),
        });

        setRunSummary({
          win,
          floor,
          level,
          kills,
          gold,
          score: finalScore,
          questionsAsked: runQuestionsAsked,
          questionsCorrect: runQuestionsCorrect,
          coinsEarnedInRun: runCoinsEarned + bonusCoins,
          xpEarnedInRun: runXpEarned + bonusXp,
          wrongQuestions: runWrongList,
        });

        // Reset bộ đếm lượt chơi để chuẩn bị cho lượt mới
        setRunQuestionsAsked(0);
        setRunQuestionsCorrect(0);
        setRunCoinsEarned(0);
        setRunXpEarned(0);
        setRunWrongList([]);
        reloadQuestionBatch(
          activeGrade,
          updatedProf.settings.preferredDifficulty,
          updatedProf.settings.topicFilter
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    activeGrade,
    handleNavigateToAppShop,
    handlePVToastNotification,
    highScore,
    onAwardReward,
    onLogEvent,
    onSaveHighScore,
    openQuestionOverlay,
    reloadQuestionBatch,
    runCoinsEarned,
    runQuestionsAsked,
    runQuestionsCorrect,
    runWrongList,
    runXpEarned,
    syncGameBridge,
  ]);

  // Tự động tạm dừng game khi đổi tab trình duyệt hoặc khi mở modal / focus vào ô nhập
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        postToGame("pv:pause");
      }
    };
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        postToGame("pv:pause");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focusin", handleFocusIn);
    };
  }, [postToGame]);

  // Bộ đếm thời gian chơi trong phiên & kiểm tra giới hạn phút chơi mỗi ngày
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden || activePrompt || showShopModal || showSettingsModal || runSummary) {
        return;
      }
      setSessionSeconds((s) => s + 1);
      setPvProfile((prev) => {
        const nextDailySec = prev.dailyPlaySeconds + 1;
        const limitSec = (prev.settings.dailyLimitMinutes || 20) * 60;
        if (nextDailySec >= limitSec && !restReminderShown) {
          setRestReminderShown(true);
          postToGame("pv:pause");
        }
        if (nextDailySec % 10 === 0) {
          const updated = { ...prev, dailyPlaySeconds: nextDailySec };
          savePVProfile(updated);
          return updated;
        }
        return { ...prev, dailyPlaySeconds: nextDailySec };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [
    activePrompt,
    postToGame,
    restReminderShown,
    runSummary,
    showSettingsModal,
    showShopModal,
  ]);

  // Đồng hồ đếm ngược cho câu hỏi Toán (nếu bật giới hạn thời gian)
  useEffect(() => {
    if (!activePrompt || selectedOption !== null) return;
    if (qTimer <= 0) return;
    if (questionTimeLeft <= 0) {
      handleSelectOption(-1); // Hết giờ tính là trả lời sai
      return;
    }
    const t = setInterval(() => {
      setQuestionTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [activePrompt, qTimer, questionTimeLeft, selectedOption]);

  // Xử lý khi học sinh chọn đáp án Toán
  const handleSelectOption = (optionIdx: number) => {
    if (!activePrompt || selectedOption !== null) return;
    setSelectedOption(optionIdx);

    const q = activePrompt.question;
    const isCorrect = optionIdx === q.answerIndex;
    signalFeedback(isCorrect ? "correct" : "wrong");
    const elapsedMs = Math.max(
      1000,
      ((qTimer || 30) - questionTimeLeft) * 1000
    );

    recordPVQuestionAttempt(q, optionIdx >= 0 ? optionIdx : null, elapsedMs);
    setRunQuestionsAsked((n) => n + 1);

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setRunQuestionsCorrect((n) => n + 1);

      // Thưởng theo quy tắc chung của mọi trò chơi: từ câu đúng thứ 3, mỗi câu 4 XP + 2 Xu, trần 50 XP / 30 Xu mỗi lượt
      setContinueReady(true);
      const step = rewardStep(runQuestionsCorrect + 1, { xp: runXpEarned, coins: runCoinsEarned });
      const latestProf = loadPVProfile();
      const remainingDailyCoins = Math.max(
        0,
        PV_DAILY_COIN_CAP - latestProf.dailyCoinsEarned
      );
      const coinsAwarded = Math.min(remainingDailyCoins, step.coins);
      const xpAwarded = step.xp;

      if (coinsAwarded > 0 || xpAwarded > 0) {
        onAwardReward({
          xp: xpAwarded,
          coins: coinsAwarded,
          reason: `Trả lời đúng Toán Lớp ${q.grade} (${q.topic})`,
        });
      }

      const updatedProf = savePVProfile(
        addPVTransaction(
          {
            ...latestProf,
            dailyCoinsEarned: latestProf.dailyCoinsEarned + coinsAwarded,
          },
          "earn",
          coinsAwarded,
          `Giải đúng câu hỏi ${q.topic} (Lớp ${q.grade})`
        )
      );
      setPvProfile(updatedProf);
      setRunCoinsEarned((c) => c + coinsAwarded);
      setRunXpEarned((x) => x + xpAwarded);

      setAnswerFeedback({
        isCorrect: true,
        canRetryCard: false,
        coinsDelta: coinsAwarded,
        xpDelta: xpAwarded,
      });
    } else {
      setStreak(0);
      setRunWrongList((prev) => [...prev, { question: q, selectedIndex: optionIdx }]);
      // đọc giải thích ít nhất 2 giây trước khi quay lại trận
      setContinueReady(false);
      window.setTimeout(() => setContinueReady(true), 2000);
      const canRetryCard =
        activePrompt.reason === "card" && activePrompt.attempt === 1;
      setAnswerFeedback({
        isCorrect: false,
        canRetryCard,
        coinsDelta: 0,
        xpDelta: 0,
      });
    }
  };

  // Tiếp tục vào game sau khi xem lời giải câu hỏi
  const handleContinueAfterQuestion = () => {
    if (!activePrompt || !answerFeedback) return;

    // Nếu là màn chọn thẻ Buff (card) và sai lần 1 -> cho thử lại 1 câu mới
    if (answerFeedback.canRetryCard) {
      openQuestionOverlay(
        "card",
        activePrompt.floor,
        activePrompt.level,
        2
      );
      return;
    }

    const reason = activePrompt.reason;
    const correct = answerFeedback.isCorrect;
    setActivePrompt(null);
    setSelectedOption(null);
    setAnswerFeedback(null);

    postToGame("pv:questionResult", {
      reason,
      correct,
    });
    postToGame("pv:resume");
    iframeRef.current?.focus();
  };

  // Bật / tắt âm thanh game
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    postToGame("pv:setMuted", { muted: next });
  };

  // Bật / tắt Toàn màn hình (hỗ trợ cả Fullscreen API lẫn Full-Viewport trên điện thoại iOS/Android)
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

  // Mở khoá hoặc chọn nhân vật trong Cửa hàng
  const handleUnlockOrSelectHero = (hero: PVHeroMeta, useFragments = false) => {
    const isOwned = pvProfile.unlocked.includes(hero.id);
    if (isOwned) {
      const updated = savePVProfile({
        ...pvProfile,
        selectedHero: hero.id,
      });
      setPvProfile(updated);
      postToGame("pv:selectHero", { hero: hero.id });
      syncGameBridge(updated);
      setShopBannerMsg(`Đã chọn chiến binh: ${hero.vietnameseName}!`);
      return;
    }

    if (useFragments) {
      if (pvProfile.heroFragments < 3) {
        handlePVToastNotification(
          "Chưa đủ 3 Mảnh Anh Hùng để đổi nhân vật này! Đang chuyển tới Cửa hàng quà...",
          {
            requiresShop: true,
            heroId: hero.id,
            reason: "insufficient_fragments",
          }
        );
        return;
      }
      const nextUnlocked = [...pvProfile.unlocked, hero.id];
      const updated = savePVProfile(
        addPVTransaction(
          {
            ...pvProfile,
            unlocked: nextUnlocked,
            selectedHero: hero.id,
            heroFragments: pvProfile.heroFragments - 3,
          },
          "spend",
          0,
          `Đổi 3 Mảnh Anh Hùng mở khoá ${hero.vietnameseName}`
        )
      );
      setPvProfile(updated);
      syncGameBridge(updated);
      postToGame("pv:selectHero", { hero: hero.id });
      setShopBannerMsg(`Đổi thành công! Đã mở khoá và trang bị ${hero.vietnameseName}.`);
      return;
    }

    if (currentCoins < hero.priceCoins) {
      handlePVToastNotification(
        `Chưa đủ Xu Trí Tuệ! Cần thêm ${hero.priceCoins - currentCoins} Xu tại Cửa hàng quà.`,
        {
          requiresShop: true,
          heroId: hero.id,
          reason: "insufficient_coins_hero",
        }
      );
      return;
    }

    onUpdateProgress?.({
      coins: currentCoins - hero.priceCoins,
    });

    const nextUnlocked = [...pvProfile.unlocked, hero.id];
    const updated = savePVProfile(
      addPVTransaction(
        {
          ...pvProfile,
          unlocked: nextUnlocked,
          selectedHero: hero.id,
        },
        "spend",
        hero.priceCoins,
        `Mở khoá nhân vật ${hero.vietnameseName}`
      )
    );
    setPvProfile(updated);
    syncGameBridge(updated);
    postToGame("pv:selectHero", { hero: hero.id });
    setShopBannerMsg(`Đã mở khoá và chọn ${hero.vietnameseName}!`);
  };

  // Quay Gacha mở nhân vật ngẫu nhiên
  const handleRollGacha = () => {
    if (gachaSpinning) return;
    if (currentCoins < PV_GACHA_COST) {
      handlePVToastNotification(
        `Cần ${PV_GACHA_COST} Xu Trí Tuệ để mở Hộp Anh Hùng Bí Ẩn (Hiện có ${currentCoins} Xu).`,
        {
          requiresShop: true,
          reason: "insufficient_coins_gacha",
        }
      );
      return;
    }

    setGachaSpinning(true);
    setGachaResult(null);
    setShopBannerMsg(null);

    setTimeout(() => {
      const result = rollPVHeroGacha(pvProfile);
      const netCost = PV_GACHA_COST - result.refundCoins;
      onUpdateProgress?.({
        coins: Math.max(0, currentCoins - netCost),
      });
      setPvProfile(result.updatedProfile);
      syncGameBridge(result.updatedProfile);
      setGachaResult(result);
      setGachaSpinning(false);
    }, 900);
  };

  // Nâng cấp chỉ số vĩnh viễn
  const handleBuyUpgrade = (key: keyof PVUpgrades) => {
    const meta = PV_UPGRADE_METAS.find((m) => m.key === key);
    if (!meta) return;
    const currentLv = pvProfile.upgrades[key] || 0;
    if (currentLv >= 3) return;

    const cost = meta.costs[currentLv];
    if (currentCoins < cost) {
      handlePVToastNotification(
        `Chưa đủ Xu Trí Tuệ! Cần ${cost} Xu để nâng cấp ${meta.name} lên Cấp ${currentLv + 1}.`,
        {
          requiresShop: true,
          reason: "insufficient_coins_upgrade",
        }
      );
      return;
    }

    onUpdateProgress?.({
      coins: currentCoins - cost,
    });

    const nextUpgrades: PVUpgrades = {
      ...pvProfile.upgrades,
      [key]: currentLv + 1,
    };
    const updated = savePVProfile(
      addPVTransaction(
        {
          ...pvProfile,
          upgrades: nextUpgrades,
        },
        "spend",
        cost,
        `Nâng cấp ${meta.name} lên Cấp ${currentLv + 1}`
      )
    );
    setPvProfile(updated);
    syncGameBridge(updated);
    setShopBannerMsg(`Đã nâng cấp ${meta.name} lên Cấp ${currentLv + 1}/3!`);
  };

  // Đổi khối lớp trong Cài đặt
  const handleChangeGrade = (newGrade: SupportedGradeNumber) => {
    const updatedStudent = setStudentGradePreference(newGrade);
    onUpdateProgress?.({ grade: `Lớp ${newGrade}` });
    setStudentProfile(updatedStudent);
    const updatedPv = savePVProfile({
      ...pvProfile,
      settings: {
        ...pvProfile.settings,
        gradeOverride: newGrade,
      },
    });
    setPvProfile(updatedPv);
    usedQuestionIdsRef.current.clear();
    reloadQuestionBatch(
      newGrade,
      updatedPv.settings.preferredDifficulty,
      updatedPv.settings.topicFilter
    );
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const selectedHeroMeta =
    PV_HERO_CATALOG.find((h) => h.id === pvProfile.selectedHero) ||
    PV_HERO_CATALOG[0];

  const availableTopics: string[] = getGradeTopicsList(activeGrade);

  return (
    <div className="space-y-4">
      {/* Thanh thông báo Toast có thể nhấn để chuyển ngay tới trang Cửa hàng quà */}
      {shopBannerMsg && !showShopModal && (
        <div
          role="status"
          onClick={() =>
            handlePVToastNotification(shopBannerMsg, {
              requiresShop: true,
              clicked: true,
              reason: "toast_banner_clicked",
            })
          }
          className="bg-amber-50 hover:bg-amber-100/80 border border-amber-300 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-amber-950">
            <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{shopBannerMsg} — Nhấn để mở Cửa hàng quà ngay!</span>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-extrabold shrink-0">
            Mở Cửa hàng quà
          </span>
        </div>
      )}

      {/* Thanh xác nhận Lớp lần đầu nếu học sinh chưa từng xác nhận khối lớp */}
      {!studentProfile.isGradeConfirmed && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-amber-950">
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Chọn đúng khối lớp của em để hệ thống tạo câu hỏi Toán vừa sức 100%:
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {([6, 7, 8, 9] as SupportedGradeNumber[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleChangeGrade(g)}
                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                  activeGrade === g
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-amber-300 hover:bg-amber-100/60"
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Scoreboard & Economy Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            Thời gian
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-slate-900">
            {formatTime(sessionSeconds)}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            Điểm màn (Tầng {currentFloor}-{currentLevel})
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-blue-600">
            {liveScore}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            Chuỗi đúng
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-amber-700">
            x{streak}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-emerald-600" />
            Kỷ lục
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-emerald-700">
            {Math.max(highScore, liveScore)}
          </span>
        </div>

        {/* Số dư Điểm kiếm được từ học tập */}
        <div className="col-span-2 lg:col-span-1 bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <div className="min-w-0">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-800 truncate">
              Điểm kiếm được từ học tập
            </span>
            <span className="text-sm font-black font-mono tabular-nums text-amber-900 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              {currentCoins} Xu
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-[11px] font-extrabold text-blue-700 shrink-0">
            Toán Lớp {activeGrade}
          </span>
        </div>
      </div>

      {/* Thanh công cụ điều khiển nhanh: Nhân vật đang chọn, Mở Shop Tướng/Gacha, Cài đặt, Âm thanh, Toàn màn hình */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <HeroPixelAvatar
            heroId={selectedHeroMeta.id}
            accentColor={selectedHeroMeta.accentColor}
            size={40}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-900 truncate">
                {selectedHeroMeta.vietnameseName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-[10px] font-bold text-blue-700">
                {pvProfile.settings.mode === "study"
                  ? "Chế độ Học mà chơi (5 phòng + Boss)"
                  : "Chế độ Phiêu lưu đầy đủ"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Đã mở {pvProfile.unlocked.length}/10 chiến binh • Thưởng hôm nay:{" "}
              <strong className="font-mono text-slate-700">
                {pvProfile.dailyCoinsEarned}/{PV_DAILY_COIN_CAP} Xu
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleNavigateToAppShop()}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đổi tướng · gacha · nâng cấp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              postToGame("pv:pause");
              setShowSettingsModal(true);
            }}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span>Cài đặt (Lớp {activeGrade})</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Đang tắt tiếng</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Âm thanh</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label="Toàn màn hình"
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Thu nhỏ</span>
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

      {/* Khung Game 16:9 chính + Chế độ Full Màn Hình Điện Thoại + Overlay câu hỏi Toán bằng HTML */}
      <div
        ref={stageContainerRef}
        className={
          isFullscreen
            ? "game-mode-stage fixed inset-0 z-[300] w-full h-[100dvh] bg-[#0a0c18] flex flex-col overflow-hidden"
            : "relative w-full h-[clamp(360px,68dvh,740px)] sm:h-auto sm:min-h-[420px] sm:aspect-video lg:max-h-[calc(100dvh-10.5rem)] rounded-2xl overflow-hidden bg-[#0a0c18] border-2 border-slate-800 shadow-lg flex flex-col"
        }
      >
        {isFullscreen && (
          <div className="game-mode-hud" role="toolbar" aria-label="Điều khiển trò chơi">
            <span className="game-mode-hud__info">
              Tầng {currentFloor}-{currentLevel} · {currentCoins} Xu · {liveScore} điểm
            </span>
            <div className="game-mode-hud__actions">
              <button type="button" onClick={() => handleNavigateToAppShop()} className="game-mode-hud__btn game-mode-hud__btn--shop" aria-label="Đổi quà">
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
          src="/game/index.html"
          title="Pixel Vanguard · Chiến Binh Pixel"
          sandbox="allow-scripts allow-same-origin"
          allow="autoplay; fullscreen"
          className="w-full flex-1 h-full border-0 block"
        />

        {/* OVERLAY CÂU HỎI TOÁN HỌC (HTML/CSS hỗ trợ đầy đủ tiếng Việt & LaTeX) */}
        {activePrompt && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pv-question-modal-title"
            className="absolute inset-0 z-30 bg-slate-950/88 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <div className="w-full max-w-2xl bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
              {/* Header của câu hỏi */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                      REASON_LABELS[activePrompt.reason].colorClass
                    }`}
                  >
                    {REASON_LABELS[activePrompt.reason].badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                    Toán Lớp {activePrompt.question.grade} • {activePrompt.question.topic}
                  </span>
                  {activePrompt.attempt === 2 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-bold">
                      Lượt thử lại (1/1)
                    </span>
                  )}
                </div>

                {qTimer > 0 && selectedOption === null && (
                  <div
                    className={`px-3 py-1 rounded-xl font-mono text-xs font-extrabold flex items-center gap-1.5 border ${
                      questionTimeLeft <= 8
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                        : "bg-slate-800 border-slate-700 text-slate-200"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{questionTimeLeft}s</span>
                  </div>
                )}
              </div>

              {/* Tiêu đề & mô tả ngữ cảnh trong game */}
              <div>
                <h3
                  id="pv-question-modal-title"
                  className="text-base sm:text-lg font-black text-white"
                >
                  {REASON_LABELS[activePrompt.reason].title}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {REASON_LABELS[activePrompt.reason].subtitle}
                </p>
              </div>

              {/* Nội dung câu hỏi Toán (render công thức bằng MathText) */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Nguồn bài học: {activePrompt.question.lessonRef}</span>
                  <span>
                    Độ khó:{" "}
                    {activePrompt.question.difficulty === 3
                      ? "Vận dụng (★★★)"
                      : activePrompt.question.difficulty === 2
                      ? "Thông hiểu (★★)"
                      : "Nhận biết (★)"}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  <MathText content={activePrompt.question.question} />
                </div>
              </div>

              {/* 4 Phương án trả lời */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activePrompt.question.options.map((opt, idx) => {
                  const isPicked = selectedOption === idx;
                  const isRight = idx === activePrompt.question.answerIndex;
                  const optionLetter = ["A", "B", "C", "D"][idx] || String(idx + 1);

                  let btnStyle =
                    "bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-100";
                  if (selectedOption !== null) {
                    if (isRight) {
                      btnStyle =
                        "bg-emerald-600/30 border-emerald-400 text-emerald-100";
                    } else if (isPicked && !isRight) {
                      btnStyle =
                        "bg-rose-600/30 border-rose-400 text-rose-100";
                    } else {
                      btnStyle =
                        "bg-slate-900/60 border-slate-800 text-slate-400 opacity-70";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={selectedOption !== null}
                      onClick={() => handleSelectOption(idx)}
                      className={`min-h-[48px] p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${btnStyle}`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-slate-950/70 border border-slate-700 flex items-center justify-center font-mono text-xs font-black shrink-0">
                        {optionLetter}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold leading-snug flex-1">
                        <MathText content={opt} />
                      </span>
                      {selectedOption !== null && isRight && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {selectedOption !== null && isPicked && !isRight && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Phản hồi & Giải thích ngắn sau khi chọn đáp án */}
              {answerFeedback && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    answerFeedback.isCorrect
                      ? "bg-emerald-950/60 border-emerald-700/80 text-emerald-100"
                      : "bg-rose-950/60 border-rose-700/80 text-rose-100"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                      {answerFeedback.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>
                            Chính xác!{" "}
                            {rewardText({ xp: answerFeedback.xpDelta, coins: answerFeedback.coinsDelta }) ||
                              (runQuestionsCorrect < 3 ? "Đúng từ 3 câu trong lượt để nhận XP/Xu." : "Đã đạt mức thưởng tối đa của lượt.")}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>
                            {selectedOption === -1
                              ? "Hết thời gian suy nghĩ!"
                              : "Chưa chính xác rồi!"}
                          </span>
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={handleContinueAfterQuestion}
                      disabled={!continueReady}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-wait shadow-sm"
                    >
                      <span>
                        {!continueReady
                          ? "Đọc giải thích…"
                          : answerFeedback.canRetryCard
                          ? "Thử lại 1 câu khác để mở thẻ"
                          : "Tiếp tục chiến đấu"}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-200 leading-relaxed pt-1 border-t border-white/10">
                    <strong className="text-white">Giải thích: </strong>
                    <MathText content={activePrompt.question.explanation} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nhắc nghỉ ngơi khi chạm giới hạn thời gian chơi trong ngày */}
        {restReminderShown &&
          pvProfile.dailyPlaySeconds >=
            (pvProfile.settings.dailyLimitMinutes || 20) * 60 && (
            <div className="absolute inset-0 z-25 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-slate-900 text-white border border-amber-500/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black">
                  Đã đến giờ giải lao mắt rồi!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Em đã hoàn thành{" "}
                  <strong>{pvProfile.settings.dailyLimitMinutes} phút</strong>{" "}
                  vừa chơi vừa ôn Toán hôm nay. Hãy thư giãn mắt vài phút hoặc quay lại ôn bài học nhé!
                </p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = savePVProfile({
                        ...pvProfile,
                        settings: {
                          ...pvProfile.settings,
                          dailyLimitMinutes:
                            (pvProfile.settings.dailyLimitMinutes || 20) + 10,
                        },
                      });
                      setPvProfile(updated);
                      postToGame("pv:resume");
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Thêm 10 phút nữa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRestReminderShown(false);
                      postToGame("pv:resume");
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    Đã hiểu, tiếp tục
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Thanh hướng dẫn điều khiển bằng tiếng Việt bên dưới khung game */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Điều khiển nhanh:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
            <kbd className="font-mono font-bold text-slate-900">WASD</kbd> / Mũi tên: Di chuyển
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
            <kbd className="font-mono font-bold text-slate-900">Chuột trái</kbd>: Bắn / Chém
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
            <kbd className="font-mono font-bold text-slate-900">K</kbd> / Chuột phải: Kỹ năng đặc biệt
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
            <kbd className="font-mono font-bold text-slate-900">Q</kbd>: Đổi vũ khí
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
            <kbd className="font-mono font-bold text-slate-900">E</kbd>: Nhặt đồ / Mở cổng
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
            <kbd className="font-mono font-bold text-slate-900">P</kbd> / <kbd className="font-mono font-bold text-slate-900">Esc</kbd>: Tạm dừng
          </span>
        </div>
      </div>

      {/* ================= MODAL CỬA HÀNG TƯỚNG, GACHA & NÂNG CẤP VĨNH VIỄN ================= */}
      {showShopModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pv-shop-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3
                  id="pv-shop-modal-title"
                  className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2"
                >
                  <Swords className="w-5 h-5 text-blue-600" />
                  <span>Kho chiến binh Pixel Vanguard và nâng cấp</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Dùng <strong>Xu Trí Tuệ (Điểm kiếm được từ học tập)</strong> để chiêu mộ nhân vật mới, mở gói Gacha hoặc nâng cấp chỉ số vĩnh viễn.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-900">
                    Số dư: <strong className="font-mono text-sm">{currentCoins} Xu</strong>
                  </span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900">
                  Mảnh tướng: <strong className="font-mono">{pvProfile.heroFragments}/3</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowShopModal(false);
                    postToGame("pv:resume");
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {shopBannerMsg && (
              <div
                onClick={() => handleNavigateToAppShop()}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-900 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors"
              >
                <span>{shopBannerMsg} (Nhấn để mở Cửa hàng trong Shop)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShopBannerMsg(null);
                  }}
                  className="text-blue-700 underline text-[11px] cursor-pointer shrink-0"
                >
                  Ẩn
                </button>
              </div>
            )}

            {/* Tabs trong modal */}
            <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setShopTab("heroes")}
                className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  shopTab === "heroes"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Đổi Nhân Vật ({pvProfile.unlocked.length}/10)
              </button>
              <button
                type="button"
                onClick={() => setShopTab("gacha")}
                className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  shopTab === "gacha"
                    ? "bg-white text-purple-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Gói Random Nhân Vật (Gacha)
              </button>
              <button
                type="button"
                onClick={() => setShopTab("upgrades")}
                className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  shopTab === "upgrades"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Nâng cấp vĩnh viễn
              </button>
              <button
                type="button"
                onClick={() => setShopTab("history")}
                className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  shopTab === "history"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Lịch Sử Điểm ({pvProfile.transactions.length})
              </button>
            </div>

            {/* TAB 1: DANH SÁCH 10 NHÂN VẬT */}
            {shopTab === "heroes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PV_HERO_CATALOG.map((hero) => {
                  const isOwned = pvProfile.unlocked.includes(hero.id);
                  const isSelected = pvProfile.selectedHero === hero.id;
                  return (
                    <div
                      key={hero.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/40"
                          : isOwned
                          ? "border-slate-200 bg-white"
                          : "border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <HeroPixelAvatar
                          heroId={hero.id}
                          accentColor={hero.accentColor}
                          size={56}
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-slate-900">
                              {hero.vietnameseName}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${hero.badgeBg}`}
                            >
                              {hero.rarityLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{hero.title}</p>

                          {/* Chỉ số cơ bản */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono font-bold text-slate-700">
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              HP: {hero.hp}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                              Giáp: {hero.armor}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              NL: {hero.energy}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Tốc: {hero.speed}
                            </span>
                          </div>

                          <div className="pt-1 text-xs text-slate-700 space-y-0.5">
                            <p>
                              <strong className="text-slate-900">Kỹ năng (K):</strong>{" "}
                              {hero.skillName} — {hero.skillDesc}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              <strong>Nội tại:</strong> {hero.passiveDesc}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                        {isOwned ? (
                          <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            <span>Đã sở hữu</span>
                          </span>
                        ) : (
                          <span className="text-xs font-extrabold text-amber-800 font-mono">
                            Giá mở khoá: {hero.priceCoins} Xu
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {!isOwned && pvProfile.heroFragments >= 3 && (
                            <button
                              type="button"
                              onClick={() => handleUnlockOrSelectHero(hero, true)}
                              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold cursor-pointer"
                            >
                              Đổi 3 Mảnh
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleUnlockOrSelectHero(hero, false)}
                            disabled={isSelected}
                            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white cursor-default"
                                : isOwned
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-amber-500 hover:bg-amber-600 text-white"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Đang chọn</span>
                              </>
                            ) : isOwned ? (
                              <span>Chọn nhân vật</span>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Mở ({hero.priceCoins} Xu)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: GÓI RANDOM NHÂN VẬT (GACHA) */}
            {shopTab === "gacha" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-7 bg-slate-900 text-white rounded-2xl p-6 space-y-4 border border-slate-800">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-extrabold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hộp anh hùng bí ẩn · gacha công bằng</span>
                  </div>
                  <h4 className="text-xl font-black">
                    Triệu Hồi Ngẫu Nhiên Chiến Binh Pixel
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Mỗi lần mở hộp tiêu tốn <strong>{PV_GACHA_COST} Xu Trí Tuệ</strong>. Tỉ lệ rơi minh bạch theo độ hiếm:
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <span className="block text-[11px] text-sky-300 font-bold">
                        Mặc định / Hiếm
                      </span>
                      <span className="text-base font-black font-mono">60%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <span className="block text-[11px] text-rose-300 font-bold">
                        Sử thi (Epic)
                      </span>
                      <span className="text-base font-black font-mono">30%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <span className="block text-[11px] text-amber-300 font-bold">
                        Huyền thoại
                      </span>
                      <span className="text-base font-black font-mono">10%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <p>
                      • <strong>Cơ chế Bảo hiểm (Pity):</strong> Đã quay{" "}
                      <strong className="text-amber-300 font-mono">
                        {pvProfile.pityCounter}/{PV_PITY_THRESHOLD}
                      </strong>{" "}
                      lần. Lần thứ {PV_PITY_THRESHOLD} chắc chắn nhận 1 nhân vật{" "}
                      <strong>chưa sở hữu</strong>!
                    </p>
                    <p>
                      • <strong>Trùng nhân vật:</strong> Hoàn lại ngay{" "}
                      <strong className="text-emerald-300">45 Xu</strong> + tặng{" "}
                      <strong className="text-purple-300">1 Mảnh Anh Hùng</strong> (Đủ 3 mảnh đổi miễn phí 1 tướng bất kỳ).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRollGacha}
                    disabled={gachaSpinning}
                    className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-black inline-flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    <Gift className="w-5 h-5" />
                    <span>
                      {gachaSpinning
                        ? "Đang triệu hồi chiến binh..."
                        : `Mở Hộp Anh Hùng Bí Ẩn (${PV_GACHA_COST} Xu)`}
                    </span>
                  </button>
                </div>

                <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[260px]">
                  {gachaSpinning ? (
                    <div className="space-y-3 py-8">
                      <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center mx-auto animate-spin">
                        <Sparkles className="w-8 h-8 text-amber-600" />
                      </div>
                      <p className="text-sm font-black text-slate-800">
                        Đang giải mã cổng năng lượng Pixel...
                      </p>
                    </div>
                  ) : gachaResult ? (
                    <div className="space-y-3">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black uppercase">
                        {gachaResult.pityTriggered
                          ? "Nổ bảo hiểm · tướng mới!"
                          : gachaResult.isDuplicate
                          ? "Nhân vật trùng · hoàn 45 Xu + 1 mảnh"
                          : "Mở khoá chiến binh mới!"}
                      </span>
                      <div className="flex justify-center">
                        <HeroPixelAvatar
                          heroId={gachaResult.hero.id}
                          accentColor={gachaResult.hero.accentColor}
                          size={72}
                        />
                      </div>
                      <div>
                        <h5 className="text-base font-black text-slate-900">
                          {gachaResult.hero.vietnameseName}
                        </h5>
                        <p className="text-xs text-slate-600">
                          {gachaResult.hero.title}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-blue-700">
                        Kỹ năng: {gachaResult.hero.skillName}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-500">
                      <Gift className="w-10 h-10 mx-auto text-slate-400" />
                      <p className="text-xs font-semibold">
                        Nhấn nút Mở Hộp để thử vận may triệu hồi các chiến binh Sử thi và Huyền thoại!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: NÂNG CẤP CHỈ SỐ VĨNH VIỄN */}
            {shopTab === "upgrades" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PV_UPGRADE_METAS.map((up) => {
                  const lv = pvProfile.upgrades[up.key] || 0;
                  const isMax = lv >= 3;
                  const nextCost = isMax ? 0 : up.costs[lv];

                  return (
                    <div
                      key={up.key}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            {up.key === "hp" && <Heart className="w-4 h-4 text-rose-600" />}
                            {up.key === "armor" && <Shield className="w-4 h-4 text-sky-600" />}
                            {up.key === "energy" && <Zap className="w-4 h-4 text-amber-500" />}
                            {up.key === "cd" && <Clock className="w-4 h-4 text-emerald-600" />}
                            <span>{up.name}</span>
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 font-mono text-xs font-black text-blue-700">
                            Cấp {lv}/3
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{up.desc}</p>
                        <p className="text-xs font-bold text-emerald-700">
                          Hiệu quả: {up.effectPerLevel}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <div className="flex gap-1">
                          {[1, 2, 3].map((step) => (
                            <span
                              key={step}
                              className={`w-6 h-2 rounded-full ${
                                step <= lv ? "bg-blue-600" : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={isMax}
                          onClick={() => handleBuyUpgrade(up.key)}
                          className={`min-h-[44px] px-4 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                            isMax
                              ? "bg-emerald-100 text-emerald-800 cursor-default"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {isMax ? "Đã tối đa" : `Nâng cấp (${nextCost} Xu)`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 4: LỊCH SỬ GIAO DỊCH ĐIỂM HỌC TẬP */}
            {shopTab === "history" && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {pvProfile.transactions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    Chưa có giao dịch nào. Hãy trả lời đúng câu hỏi Toán trong game để nhận Xu Trí Tuệ!
                  </p>
                ) : (
                  pvProfile.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{tx.reason}</span>
                        <span className="block text-[11px] text-slate-500 font-mono">
                          {tx.timestamp}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-black ${
                          tx.type === "earn" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {tx.type === "earn" ? `+${tx.amount}` : `-${tx.amount}`} Xu
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL CÀI ĐẶT CHẾ ĐỘ HỌC MÀ CHƠI & KHỐI LỚP ================= */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pv-settings-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3
                id="pv-settings-modal-title"
                className="text-lg font-black text-slate-900 flex items-center gap-2"
              >
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Cài đặt học mà chơi (Pixel Vanguard)</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  postToGame("pv:resume");
                }}
                className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-800 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Chọn khối lớp (6, 7, 8, 9) */}
              <div className="space-y-1.5">
                <label className="block font-extrabold text-slate-900">
                  Khối lớp chương trình Toán hiện tại:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([6, 7, 8, 9] as SupportedGradeNumber[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleChangeGrade(g)}
                      className={`min-h-[44px] rounded-xl font-extrabold border cursor-pointer ${
                        activeGrade === g
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Lớp {g}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Mọi câu hỏi sinh ra đều khóa chặt ở chương trình Toán Lớp {activeGrade}, không lẫn kiến thức lớp khác.
                </p>
              </div>

              {/* Chọn chế độ độ dài lượt chơi */}
              <div className="space-y-1.5">
                <label className="block font-extrabold text-slate-900">
                  Chế độ lượt chơi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = savePVProfile({
                        ...pvProfile,
                        settings: { ...pvProfile.settings, mode: "study" },
                      });
                      setPvProfile(updated);
                      syncGameBridge(updated);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      pvProfile.settings.mode === "study"
                        ? "border-blue-600 bg-blue-50 text-blue-950 font-bold"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <span className="block font-extrabold">Học mà chơi (Khuyên dùng)</span>
                    <span className="text-[11px] text-slate-500">
                      5 phòng ngắn gọn + 1 Boss (~5–8 phút/lượt)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = savePVProfile({
                        ...pvProfile,
                        settings: { ...pvProfile.settings, mode: "adventure" },
                      });
                      setPvProfile(updated);
                      syncGameBridge(updated);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      pvProfile.settings.mode === "adventure"
                        ? "border-blue-600 bg-blue-50 text-blue-950 font-bold"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <span className="block font-extrabold">Phiêu lưu tiêu chuẩn</span>
                    <span className="text-[11px] text-slate-500">
                      Đi trọn vẹn 8 tầng hầm ngục
                    </span>
                  </button>
                </div>
              </div>

              {/* Độ khó câu hỏi ưu tiên */}
              <div className="space-y-1.5">
                <label className="block font-extrabold text-slate-900">
                  Độ khó câu hỏi Toán:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { lv: 1, label: "Nhận biết (+6 Xu)" },
                    { lv: 2, label: "Thông hiểu (+10 Xu)" },
                    { lv: 3, label: "Vận dụng (+14 Xu)" },
                  ] as const).map((item) => (
                    <button
                      key={item.lv}
                      type="button"
                      onClick={() => {
                        const updated = savePVProfile({
                          ...pvProfile,
                          settings: {
                            ...pvProfile.settings,
                            preferredDifficulty: item.lv,
                          },
                        });
                        setPvProfile(updated);
                      }}
                      className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        pvProfile.settings.preferredDifficulty === item.lv
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chủ đề Toán ưu tiên */}
              <div className="space-y-1.5">
                <label
                  htmlFor="pv-topic-select"
                  className="block font-extrabold text-slate-900"
                >
                  Chủ đề Toán Lớp {activeGrade} muốn ôn:
                </label>
                <select
                  id="pv-topic-select"
                  value={pvProfile.settings.topicFilter}
                  onChange={(e) => {
                    const updated = savePVProfile({
                      ...pvProfile,
                      settings: {
                        ...pvProfile.settings,
                        topicFilter: e.target.value,
                      },
                    });
                    setPvProfile(updated);
                  }}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold"
                >
                  <option value="all">Tất cả chủ đề Toán Lớp {activeGrade}</option>
                  {availableTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thời gian suy nghĩ mỗi câu & Giới hạn phút chơi mỗi ngày */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="pv-timer-select"
                    className="block text-xs font-extrabold text-slate-900"
                  >
                    Thời gian trả lời câu hỏi:
                  </label>
                  <select
                    id="pv-timer-select"
                    value={pvProfile.settings.timerSeconds}
                    onChange={(e) => {
                      const updated = savePVProfile({
                        ...pvProfile,
                        settings: {
                          ...pvProfile.settings,
                          timerSeconds: Number(e.target.value),
                        },
                      });
                      setPvProfile(updated);
                    }}
                    className="w-full min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900"
                  >
                    <option value={30}>30 giây / câu</option>
                    <option value={45}>45 giây / câu</option>
                    <option value={60}>60 giây / câu</option>
                    <option value={0}>Không giới hạn giờ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="pv-daily-limit"
                    className="block text-xs font-extrabold text-slate-900"
                  >
                    Nhắc nghỉ ngơi sau:
                  </label>
                  <select
                    id="pv-daily-limit"
                    value={pvProfile.settings.dailyLimitMinutes}
                    onChange={(e) => {
                      const updated = savePVProfile({
                        ...pvProfile,
                        settings: {
                          ...pvProfile.settings,
                          dailyLimitMinutes: Number(e.target.value),
                        },
                      });
                      setPvProfile(updated);
                    }}
                    className="w-full min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900"
                  >
                    <option value={15}>15 phút / ngày</option>
                    <option value={20}>20 phút / ngày (Mặc định)</option>
                    <option value={30}>30 phút / ngày</option>
                    <option value={45}>45 phút / ngày</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TỔNG KẾT HỌC TẬP & CHIẾN ĐẤU SAU LƯỢT CHƠI ================= */}
      {runSummary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pv-summary-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    runSummary.win
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="pv-summary-modal-title"
                    className="text-lg font-black text-slate-900"
                  >
                    {runSummary.win
                      ? "Chiến thắng hầm ngục · tổng kết ôn tập!"
                      : "Tổng kết lượt chơi và kiến thức đã ôn"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tầng đạt tới: {runSummary.floor}-{runSummary.level} • Hạ gục:{" "}
                    {runSummary.kills} quái • Điểm: {runSummary.score}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRunSummary(null)}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-800 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* 4 ô chỉ số học tập & phần thưởng */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="block text-[11px] text-slate-500 font-semibold">
                  Câu Toán đã giải
                </span>
                <span className="text-lg font-black font-mono text-slate-900">
                  {runSummary.questionsCorrect}/{runSummary.questionsAsked}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="block text-[11px] text-slate-500 font-semibold">
                  Tỉ lệ chính xác
                </span>
                <span className="text-lg font-black font-mono text-blue-600">
                  {runSummary.questionsAsked > 0
                    ? Math.round(
                        (runSummary.questionsCorrect / runSummary.questionsAsked) * 100
                      )
                    : 100}
                  %
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="block text-[11px] text-amber-800 font-semibold">
                  Xu Trí Tuệ nhận
                </span>
                <span className="text-lg font-black font-mono text-amber-700">
                  +{runSummary.coinsEarnedInRun} Xu
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="block text-[11px] text-emerald-800 font-semibold">
                  Điểm XP nhận
                </span>
                <span className="text-lg font-black font-mono text-emerald-700">
                  +{runSummary.xpEarnedInRun} XP
                </span>
              </div>
            </div>

            {/* Danh sách các câu trả lời sai cần ôn lại */}
            {runSummary.wrongQuestions.length > 0 ? (
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
                  Các câu Toán cần xem lại ({runSummary.wrongQuestions.length} câu):
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {runSummary.wrongQuestions.map((item, idx) => (
                    <div
                      key={`${item.question.id}-${idx}`}
                      className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-800">
                        <span>
                          {item.question.topic} • {item.question.lessonRef}
                        </span>
                        <span>Lớp {item.question.grade}</span>
                      </div>
                      <div className="font-bold text-slate-900">
                        <MathText content={item.question.question} />
                      </div>
                      <p className="text-emerald-800 font-semibold">
                        Đáp án đúng:{" "}
                        <MathText
                          content={
                            item.question.options[item.question.answerIndex]
                          }
                        />
                      </p>
                      <p className="text-slate-600">
                        <strong>Giải thích:</strong>{" "}
                        <MathText content={item.question.explanation} />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 text-center">
                Tuyệt vời! Em không làm sai câu hỏi Toán nào trong lượt chạy vừa rồi.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRunSummary(null);
                  handleNavigateToAppShop();
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Mở cửa hàng đổi tướng</span>
              </button>
              <button
                type="button"
                onClick={() => setRunSummary(null)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tiếp tục chơi lượt mới</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
