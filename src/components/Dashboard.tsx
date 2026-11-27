import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  ChevronRight, 
  RotateCcw, 
  Award, 
  CheckCircle2, 
  FileText, 
  Flame, 
  BarChart3, 
  ArrowRight, 
  Layers, 
  Play, 
  Pause,
  Check, 
  Zap, 
  BookOpen,
  GraduationCap,
  TrendingUp,
  Bookmark,
  Target,
  Compass,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  Trophy,
  Headphones
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  ReferenceLine,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { Lesson, UserProgress, DailyQuest, QuizAttempt } from "../types";
import { detectLessonSubject, SUBJECT_DEFINITIONS } from "./LessonLibraryFilterBar";
import { loadQuizHistory, buildScoreImprovementTimeline, identifyWeakTopics } from "../lib/quizAnalytics";
import { getStoredDueFlashcardsCount } from "../lib/spacedRepetition";
import { 
  WisdomCoinIcon, 
  MagicGiftBox, 
  getMascotComponent,
  Edupia3DLock 
} from "./CustomMascots";
import { UserAvatar } from "./UserAvatar";
import WeeklyGoalProgressRing from "./WeeklyGoalProgressRing";
import { usePodcast } from "../context/PodcastContext";

interface DashboardProps {
  lessons: Lesson[];
  progress: UserProgress;
  onSelectTab: (tab: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  dailyQuests?: DailyQuest[];
  onClaimQuest?: (id: string) => void;
  onTriggerSimulatedPush?: (title: string, body: string, actionTab?: string, actionText?: string) => void;
  onUpdateProgress?: (updates: Partial<UserProgress>) => void;
  setHasCheckedInactivity?: (checked: boolean) => void;
  isOnline?: boolean;
  isManualOffline?: boolean;
  onToggleManualOffline?: () => void;
  swStatus?: "active" | "installing" | "error" | "unsupported";
  selectedAvatarIdx?: number;
  quizHistory?: QuizAttempt[];
}

// 7-day habit timeline item
interface HabitDay {
  dayName: string;
  dateStr: string;
  isToday: boolean;
  isCompleted: boolean;
  xpReward: number;
  coinReward: number;
}

// Custom Viewport Reveal hook using IntersectionObserver
function useInView(options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
      }
    }, { threshold: 0.1, ...options });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}

// Helper: Làm sạch cú pháp Markdown thô (#, ##, ---, **, *, `) để hiển thị đoạn trích bài học tự nhiên
function cleanLessonExcerpt(raw?: string): string {
  if (!raw) {
    return "Nắm vững kiến thức trọng tâm, công thức cốt lõi và vận dụng giải nhanh các dạng bài tập tự luyện.";
  }
  const stripped = raw
    .replace(/<[^>]*>?/gm, " ")
    .replace(/^#+\s.*$/gm, " ") // Bỏ dòng tiêu đề lặp lại ở đầu bài (# Bài 10...)
    .replace(/---+/g, " ")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*|\*|__|`|~~|>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) {
    return "Nắm vững kiến thức trọng tâm, công thức cốt lõi và vận dụng giải nhanh các dạng bài tập tự luyện.";
  }
  return stripped.length > 145 ? `${stripped.substring(0, 145).trim()}...` : stripped;
}

export default function Dashboard({ 
  lessons, 
  progress, 
  onSelectTab, 
  onSelectLesson,
  dailyQuests = [],
  onClaimQuest,
  onTriggerSimulatedPush,
  onUpdateProgress,
  isOnline = true,
  selectedAvatarIdx = 0,
  quizHistory = []
}: DashboardProps) {
  // 1. Phân loại chuyên đề học tập
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [chartMode, setChartMode] = useState<"daily" | "weekly">("daily");
  const [activeSheenId, setActiveSheenId] = useState<string | null>(null);

  const {
    listeningHistory30Days,
    totalCumulativeMinutes30Days,
    monthlyListeningGoalMinutes
  } = usePodcast();

  const podcastGoalPct = Math.min(
    100,
    Math.round((totalCumulativeMinutes30Days / Math.max(1, monthlyListeningGoalMinutes)) * 100)
  );
  const podcastProgressBarData = useMemo(
    () => [
      {
        name: "Podcast 30 ngày",
        listened: Math.min(totalCumulativeMinutes30Days, monthlyListeningGoalMinutes),
        remaining: Math.max(0, Math.round((monthlyListeningGoalMinutes - totalCumulativeMinutes30Days) * 10) / 10)
      }
    ],
    [totalCumulativeMinutes30Days, monthlyListeningGoalMinutes]
  );

  // Viewport Reveal references for Layer 3 sections
  const [analyticsRef, analyticsInView] = useInView();
  const [subjectDistRef, subjectDistInView] = useInView();
  const [scoreTimelineRef, scoreTimelineInView] = useInView();
  const [weakTopicsRef, weakTopicsInView] = useInView();
  const [studyUnitsRef, studyUnitsInView] = useInView();

  // Mục tiêu học tập tuần này (Weekly Study Goal)
  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("smart_study_weekly_lesson_goal");
      return saved ? parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  const handleUpdateWeeklyGoal = (newGoal: number) => {
    setWeeklyGoal(newGoal);
    try {
      localStorage.setItem("smart_study_weekly_lesson_goal", newGoal.toString());
    } catch {}
  };

  const completedLessonsCount = useMemo(() => {
    const fromList = lessons.filter((l) => l.completed).length;
    return fromList > 0 ? fromList : (progress.lessonsCompletedCount || 0);
  }, [lessons, progress.lessonsCompletedCount]);

  // Primary Anchor Lesson (In-progress or next up)
  const currentActiveLesson = useMemo(() => {
    if (!lessons || lessons.length === 0) return null;
    const inProgress = lessons.find(l => !l.completed);
    return inProgress || lessons[0];
  }, [lessons]);

  // Dynamic FSRS Due Flashcards count
  const [dueCardsCount, setDueCardsCount] = useState<number>(() => getStoredDueFlashcardsCount());

  // 2. Pomodoro Mini Focus Station & 7-Day Study Minutes Tracking
  const [focusSeconds, setFocusSeconds] = useState<number>(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState<boolean>(false);
  const [focusMode, setFocusMode] = useState<"focus" | "shortBreak">("focus");
  const [hasCompletedTodayCheckIn, setHasCompletedTodayCheckIn] = useState<boolean>(false);
  const [focusCheckInAnswered, setFocusCheckInAnswered] = useState<boolean>(false);

  const [dailyStudyTargetMins, setDailyStudyTargetMins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("smart_study_daily_target_mins_v1");
      return saved ? parseInt(saved, 10) : 30;
    } catch {
      return 30;
    }
  });

  const handleUpdateDailyTargetMins = (target: number) => {
    setDailyStudyTargetMins(target);
    try {
      localStorage.setItem("smart_study_daily_target_mins_v1", target.toString());
    } catch {}
  };

  const [studyMinutesByDate, setStudyMinutesByDate] = useState<Record<string, number>>(() => {
    const today = new Date();
    const baselineTime = [25, 45, 30, 60, 40, 20, 35];
    const seeded: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoKey = d.toISOString().split("T")[0];
      seeded[isoKey] = baselineTime[6 - i];
    }
    try {
      const raw = localStorage.getItem("smart_study_weekly_minutes_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return { ...seeded, ...parsed };
        }
      }
    } catch {}
    return seeded;
  });

  const addTodayStudyMinutes = (addedMins: number) => {
    const todayKey = new Date().toISOString().split("T")[0];
    setStudyMinutesByDate((prev) => {
      const current = prev[todayKey] ?? 35;
      const updated = {
        ...prev,
        [todayKey]: Math.max(0, current + addedMins)
      };
      try {
        localStorage.setItem("smart_study_weekly_minutes_v1", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isFocusRunning && focusSeconds > 0) {
      interval = setInterval(() => {
        setFocusSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isFocusRunning && focusSeconds === 0) {
      setIsFocusRunning(false);
      if (focusMode === "focus") {
        addTodayStudyMinutes(25);
      }
      if (onUpdateProgress) {
        onUpdateProgress({
          coins: (progress.coins || 0) + 15,
          points: (progress.points || 0) + 25
        });
      }
      if (onTriggerSimulatedPush) {
        onTriggerSimulatedPush(
          "Phiên tập trung hoàn thành!",
          "Em đã hoàn thành xuất sắc 25 phút tập trung sâu. Đã cộng +25 phút vào Tiến Độ Học Tập Tuần Qua, thưởng +15 Xu và +25 XP!",
          "dashboard",
          "Nhận thưởng"
        );
      }
      setFocusSeconds(focusMode === "focus" ? 5 * 60 : 25 * 60);
      setFocusMode(focusMode === "focus" ? "shortBreak" : "focus");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocusRunning, focusSeconds, focusMode, onUpdateProgress, progress.coins, progress.points, onTriggerSimulatedPush]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const triggerItemClick = (id: string, callback?: () => void) => {
    setActiveSheenId(id);
    setTimeout(() => {
      setActiveSheenId(null);
    }, 1200);
    if (callback) callback();
  };

  // 3. Lộ trình 7 ngày học tập tuần này
  const habitWeek: HabitDay[] = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const daysLabels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
    return daysLabels.map((name, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const isToday = d.toDateString() === today.toDateString();
      const isPast = d < today && !isToday;
      return {
        dayName: name,
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        isToday,
        isCompleted: isPast || (isToday && hasCompletedTodayCheckIn),
        xpReward: 20,
        coinReward: 10
      };
    });
  }, [hasCompletedTodayCheckIn]);

  const handleDailyCheckIn = () => {
    if (hasCompletedTodayCheckIn) return;
    setHasCompletedTodayCheckIn(true);
    addTodayStudyMinutes(10);
    if (onUpdateProgress) {
      onUpdateProgress({
        streak: (progress.streak || 1) + 1,
        coins: (progress.coins || 0) + 15,
        points: (progress.points || 0) + 20
      });
    }
    if (onTriggerSimulatedPush) {
      onTriggerSimulatedPush(
        "Điểm danh thành công!",
        "Chuỗi chuyên cần được nối dài thêm 1 ngày! Em nhận được +15 Xu Tri Thức và +10 phút học tập hôm nay.",
        "dashboard",
        "Tuyệt vời"
      );
    }
  };

  // 4. Danh sách các Unit Chuyên đề học tập EduQuest
  const studyUnits = [
    {
      id: "unit-1",
      title: "Unit 1: Nền tảng Ngữ pháp và Cấu trúc Nâng cao",
      category: "grammar",
      description: "Hệ thống các thì trọng điểm, mệnh đề quan hệ và câu điều kiện ứng dụng.",
      lessonsCount: 6,
      completedCount: 6,
      progressPct: 100,
      duration: "45 phút",
      status: "completed",
      isLocked: false
    },
    {
      id: "unit-2",
      title: "Unit 2: Từ vựng Học thuật và Cụm từ Collocations",
      category: "vocabulary",
      description: "Bộ từ vựng chủ đề Giáo dục, Công nghệ và Môi trường thường gặp.",
      lessonsCount: 8,
      completedCount: 5,
      progressPct: 62,
      duration: "60 phút",
      status: "in_progress",
      isLocked: false
    },
    {
      id: "unit-3",
      title: "Unit 3: Kỹ năng Đọc hiểu Chuyên sâu và Phản xạ",
      category: "reading",
      description: "Phương pháp Skimming, Scanning và giải mã bẫy đọc hiểu trong các kỳ thi.",
      lessonsCount: 5,
      completedCount: 1,
      progressPct: 20,
      duration: "40 phút",
      status: "in_progress",
      isLocked: false
    },
    {
      id: "unit-4",
      title: "Unit 4: Tư duy Phân tích và Viết Luận Học thuật",
      category: "logic",
      description: "Xây dựng lập luận logic, liên kết câu mạch lạc và phản biện đa chiều.",
      lessonsCount: 6,
      completedCount: 0,
      progressPct: 0,
      duration: "50 phút",
      status: "locked",
      isLocked: true
    }
  ];

  const filteredUnits = useMemo(() => {
    if (selectedCategory === "all") return studyUnits;
    return studyUnits.filter(u => u.category === selectedCategory);
  }, [selectedCategory]);

  // 5. Dữ liệu Biểu đồ Recharts: Weekly Progress (7 ngày qua & 4 tuần qua)
  const weeklyStudyDailyData = useMemo(() => {
    const data = [];
    const today = new Date();
    const baselineLessons = [1, 2, 1, 3, 2, 1, 2];
    const baselineTime = [25, 45, 30, 60, 40, 20, 35];
    const shortWeekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const fullWeekdays = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoKey = d.toISOString().split("T")[0];
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      const shortDay = shortWeekdays[d.getDay()];
      const fullDay = fullWeekdays[d.getDay()];
      const isToday = i === 0;
      const minutes = studyMinutesByDate[isoKey] ?? baselineTime[6 - i];
      const metTarget = minutes >= dailyStudyTargetMins;

      data.push({
        isoKey,
        name: isToday ? `Hôm nay (${dateStr})` : `${shortDay} (${dateStr})`,
        shortLabel: isToday ? "Hôm nay" : `${shortDay} ${dateStr}`,
        fullDateLabel: `${fullDay}, ngày ${dateStr}`,
        minutes,
        "Thời gian học (phút)": minutes,
        "Bài hoàn thành": baselineLessons[6 - i],
        targetMinutes: dailyStudyTargetMins,
        isToday,
        metTarget
      });
    }
    return data;
  }, [studyMinutesByDate, dailyStudyTargetMins]);

  const weeklyProgressSummary = useMemo(() => {
    const totalMinutes = weeklyStudyDailyData.reduce((acc, item) => acc + item.minutes, 0);
    const avgMinutes = Math.round(totalMinutes / 7);
    const consistentDays = weeklyStudyDailyData.filter((item) => item.minutes >= dailyStudyTargetMins).length;
    const todayMinutes = weeklyStudyDailyData[weeklyStudyDailyData.length - 1]?.minutes || 0;
    const bestDay = weeklyStudyDailyData.reduce(
      (best, cur) => (cur.minutes > best.minutes ? cur : best),
      weeklyStudyDailyData[0] || { shortLabel: "-", minutes: 0 }
    );
    return {
      totalMinutes,
      avgMinutes,
      consistentDays,
      todayMinutes,
      bestDay
    };
  }, [weeklyStudyDailyData, dailyStudyTargetMins]);

  const getWeeklyData = () => {
    return [
      { name: "4 tuần trước", shortLabel: "Tuần -3", fullDateLabel: "4 tuần trước", "Bài hoàn thành": 5, "Thời gian học (phút)": 165, minutes: 165, isToday: false, metTarget: true },
      { name: "3 tuần trước", shortLabel: "Tuần -2", fullDateLabel: "3 tuần trước", "Bài hoàn thành": 7, "Thời gian học (phút)": 210, minutes: 210, isToday: false, metTarget: true },
      { name: "2 tuần trước", shortLabel: "Tuần -1", fullDateLabel: "2 tuần trước", "Bài hoàn thành": 6, "Thời gian học (phút)": 185, minutes: 185, isToday: false, metTarget: true },
      { name: "Tuần này", shortLabel: "Tuần này", fullDateLabel: "7 ngày gần nhất", "Bài hoàn thành": completedLessonsCount || 4, "Thời gian học (phút)": weeklyProgressSummary.totalMinutes, minutes: weeklyProgressSummary.totalMinutes, isToday: true, metTarget: weeklyProgressSummary.totalMinutes >= dailyStudyTargetMins * 5 },
    ];
  };

  const chartData = chartMode === "daily" ? weeklyStudyDailyData : getWeeklyData();

  // 6. Biểu đồ Cột (Bar Chart): Phân Bổ Theo Môn Học
  const [barChartMetric, setBarChartMetric] = useState<"stacked" | "total">("stacked");

  const subjectBarData = useMemo(() => {
    const counts: Record<string, { total: number; completed: number; inProgress: number }> = {};
    SUBJECT_DEFINITIONS.forEach((sub) => {
      counts[sub.id] = { total: 0, completed: 0, inProgress: 0 };
    });

    lessons.forEach((l) => {
      const subId = detectLessonSubject(l);
      if (!counts[subId]) {
        counts[subId] = { total: 0, completed: 0, inProgress: 0 };
      }
      counts[subId].total += 1;
      if (l.completed) {
        counts[subId].completed += 1;
      } else {
        counts[subId].inProgress += 1;
      }
    });

    const subjectColors: Record<string, string> = {
      math: "#4f46e5",
      english: "#0e7f62",
      literature: "#e11d48",
      science: "#0d9488",
      social: "#d97706",
      informatics: "#0284c7"
    };

    return SUBJECT_DEFINITIONS.filter(
      (sub) => sub.id !== "other" || (counts["other"] && counts["other"].total > 0)
    ).map((sub) => {
      const data = counts[sub.id] || { total: 0, completed: 0, inProgress: 0 };
      return {
        id: sub.id,
        name: sub.name,
        shortName: sub.shortName,
        icon: sub.icon,
        "Đã hoàn thành": data.completed,
        "Đang ôn tập": data.inProgress,
        "Tổng số bài": data.total,
        fillColor: subjectColors[sub.id] || "#0284c7"
      };
    });
  }, [lessons]);

  const topFocusedSubject = useMemo(() => {
    if (!subjectBarData || subjectBarData.length === 0) return null;
    const sorted = [...subjectBarData].sort((a, b) => b["Tổng số bài"] - a["Tổng số bài"]);
    return sorted[0]["Tổng số bài"] > 0 ? sorted[0] : null;
  }, [subjectBarData]);

  // 7. Biểu đồ Đường (Line Chart): Tiến Bộ Điểm Số
  const [selectedScoreSubject, setSelectedScoreSubject] = useState<string>("all");
  const [scoreChartMetric, setScoreChartMetric] = useState<"score10" | "percentage">("score10");

  const effectiveQuizHistory = useMemo(() => {
    if (quizHistory && quizHistory.length > 0) return quizHistory;
    return loadQuizHistory();
  }, [quizHistory]);

  const {
    timeline: rawScoreTimeline,
    subjectStats: scoreSubjectStats,
    overallImprovementDelta,
    strongestSubject,
    fastestGrowingSubject
  } = useMemo(() => buildScoreImprovementTimeline(effectiveQuizHistory), [effectiveQuizHistory]);

  const scoreChartData = useMemo(() => {
    return rawScoreTimeline.map(pt => {
      if (scoreChartMetric === "percentage") {
        return {
          ...pt,
          math: pt.math !== undefined ? Math.round(pt.math * 10) : undefined,
          english: pt.english !== undefined ? Math.round(pt.english * 10) : undefined,
          literature: pt.literature !== undefined ? Math.round(pt.literature * 10) : undefined,
          science: pt.science !== undefined ? Math.round(pt.science * 10) : undefined,
          social: pt.social !== undefined ? Math.round(pt.social * 10) : undefined,
          informatics: pt.informatics !== undefined ? Math.round(pt.informatics * 10) : undefined,
          overallAvg: pt.overallAvg !== undefined ? Math.round(pt.overallAvg * 10) : undefined,
        };
      }
      return pt;
    });
  }, [rawScoreTimeline, scoreChartMetric]);

  // 8. Phân Tích Lỗ Hổng Kiến Thức (Weak Topics)
  const weakTopicRecs = useMemo(() => {
    return identifyWeakTopics(effectiveQuizHistory, lessons);
  }, [effectiveQuizHistory, lessons]);

  // Daily quests completion tally
  const completedQuestsCount = useMemo(() => {
    return dailyQuests.filter(q => q.completed).length;
  }, [dailyQuests]);

  const activeDailyQuest = useMemo(() => {
    return dailyQuests.find(q => !q.completed) || dailyQuests[0];
  }, [dailyQuests]);

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          LAYER 1: ALWAYS VISIBLE - ACADEMIC CONTEXT BAR (ZERO-PILL METADATA)
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 text-xs sm:text-xs">
        <div className="flex flex-wrap items-center gap-2 font-medium text-slate-500 min-w-0">
          <span 
            className="hover:text-slate-900 cursor-pointer transition-colors font-semibold text-slate-700" 
            onClick={() => onSelectTab("dashboard")}
          >
            SmartStudy
          </span>
          <span className="text-slate-300">/</span>
          <span className="breadcrumb-wrap text-slate-900 font-bold lg:truncate">Tổng quan học tập và Lộ trình</span>
        </div>

        {/* Clean Typographic Metadata (No pills, subtle middots) */}
        <div className="flex items-center gap-x-3 gap-y-1 sm:gap-2 text-xs text-slate-600 font-medium shrink-0 flex-wrap">
          <span className="font-semibold text-slate-800">Chương trình {progress.grade || "Lớp 6"}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Học kỳ I</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="font-semibold text-amber-700 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-mono tabular-nums">{progress.streak || 5}</span> ngày liên tiếp
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="font-semibold text-blue-700">
            Lv.<span className="font-mono tabular-nums">{progress.level || 1}</span> {progress.titleBadge || "Tập Sự"}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <button
            type="button"
            onClick={() => onSelectTab("flashcards")}
            className="min-h-6 font-semibold text-slate-700 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
          >
            Thẻ cần ôn: <span className="font-mono tabular-nums text-blue-700 font-bold">{dueCardsCount}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          LAYER 1: ALWAYS VISIBLE & LAYER 2: HOVER REVEAL
          TOP FOCAL ZONE (PRIMARY HERO LESSON ANCHOR + HABIT & QUEST COMPANION)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* PRIMARY HERO CARD: BÀI HỌC ĐANG DANG DỞ (FOCAL POINT #1 - 60% VISUAL ATTENTION) */}
        <div className="lg:col-span-8 group relative bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-7 shadow-2xs card-academic-elevate flex flex-col justify-between overflow-hidden">
          <div className="relative z-10 space-y-4">
            {/* Context line */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-medium flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-bold text-[11px]">
                  Bài đang học dở
                </span>
                <span className="font-bold text-slate-700">
                  {currentActiveLesson ? (SUBJECT_DEFINITIONS.find((s) => s.id === detectLessonSubject(currentActiveLesson))?.name ?? "Môn khác") : "Toán học"}
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="truncate max-w-[240px] sm:max-w-xs">{currentActiveLesson?.topic || "Chương 1: Tập hợp các số tự nhiên"}</span>
                <span aria-hidden="true" className="text-slate-300 hidden lg:inline">·</span>
                <span className="text-slate-500 hidden lg:inline">~12 phút</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 font-mono tabular-nums hidden sm:inline-block shrink-0">
                Mục tiêu tuần: {completedLessonsCount}/{weeklyGoal} bài
              </span>
            </div>

            {/* Main Lesson Title and Clean Excerpt (No raw markdown) */}
            <div className="space-y-2">
              <h2 className="font-display font-extrabold text-xl sm:text-2xl md:text-[26px] text-slate-900 tracking-tight leading-snug">
                {currentActiveLesson?.title || "Bài 1: Tập hợp và phần tử của tập hợp"}
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                {cleanLessonExcerpt(currentActiveLesson?.content)}
              </p>
            </div>

            {/* Layer 1 Slim Progress Bar -> Layer 2 Hover Reveal Expanded Detail */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-xs font-semibold text-slate-600">
                  Tiến độ hoàn thành bài học
                </span>
                <span className="font-mono font-bold text-xs text-blue-700 tabular-nums whitespace-nowrap shrink-0">
                  {currentActiveLesson?.completed ? "100%" : "65% hoàn thành"}
                </span>
              </div>
              
              {/* Progress track with reveal animation */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden transition-all duration-200">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ width: currentActiveLesson?.completed ? "100%" : "65%" }}
                />
              </div>

              {/* Layer 2: Hover Reveal Details (Outline Checkpoints) */}
              <div className="reveal-on-hover pt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Lý thuyết trọng tâm
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Ví dụ minh họa
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="flex items-center gap-1 text-blue-700 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> Phần tiếp theo: Bài tập vận dụng
                </span>
              </div>
            </div>
          </div>

          {/* Action Row: 1 Dominant Solid CTA Button + Secondary Action */}
          <div className="relative z-10 pt-4 sm:pt-5 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 sm:gap-2.5 sm:flex-wrap sm:[&>button]:whitespace-nowrap [&>button]:min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (currentActiveLesson) {
                    onSelectLesson(currentActiveLesson);
                  } else {
                    onSelectTab("learn");
                  }
                }}
                className="w-full sm:w-auto justify-center min-h-[48px] sm:min-h-[44px] lg:min-h-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-[0.98] text-white font-bold text-base sm:text-sm lg:text-xs transition-all duration-180 flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Tiếp tục học bài này</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("quiz")}
                className="flex-1 sm:flex-none justify-center min-h-[44px] lg:min-h-0 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-blue-600" />
                <span>Luyện đề trắc nghiệm</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("review")}
                className="min-h-[44px] lg:min-h-0 px-3 py-2.5 rounded-xl text-slate-600 max-lg:inline-flex max-lg:items-center hover:text-slate-900 hover:bg-slate-100 max-sm:border max-sm:border-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Thư viện ({lessons.length} bài)
              </button>
            </div>

            <div className="text-sm sm:text-xs text-slate-600 flex items-center gap-1.5">
              <span>Học gần nhất:</span>
              <span className="font-semibold text-slate-800">Hôm nay</span>
            </div>
          </div>
        </div>

        {/* HABIT & QUESTS COMPANION (LAYER 1 SNAPSHOT + LAYER 2 HOVER REVEAL) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col lg:justify-between">
          
          {/* Card A: Streak & Consistency */}
          <div className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs card-academic-elevate transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Chuỗi chuyên cần</h4>
                  <p className="text-xs sm:text-[11px] text-slate-500">Giữ vững nhịp độ mỗi ngày</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-xl text-slate-900 tabular-nums">
                  {progress.streak || 5}
                </span>
                <span className="text-xs text-slate-500 font-semibold"> ngày</span>
              </div>
            </div>

            {/* Layer 2: Hover Reveal of 7-Day Completion Dots & Freeze Shield */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-[11px] text-slate-600">
                <span>Tuần này</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Khiên bảo vệ sẵn sàng
                </span>
              </div>
              
              {/* 7-day mini dots (T2-CN >= 14px on mobile) */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {habitWeek.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-sm sm:text-[11px] font-semibold text-slate-600">{day.dayName.replace("Thứ ", "T")}</span>
                    <div 
                      className={`w-7 h-7 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-xs sm:text-[10px] font-mono font-bold transition-all ${
                        day.isCompleted
                          ? "bg-emerald-500 text-white"
                          : day.isToday
                          ? "bg-sky-600 text-white ring-2 ring-sky-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                      title={`${day.dayName} (${day.dateStr}): ${day.isCompleted ? "Đã học" : "Chưa hoàn thành"}`}
                    >
                      {day.isCompleted ? "✓" : day.dateStr.split("/")[0]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reveal-on-hover reward callout */}
              <div className="reveal-on-hover pt-1 flex items-center justify-between text-xs sm:text-[10px] text-slate-600">
                <span>Điểm danh hôm nay:</span>
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <WisdomCoinIcon size={12} /> +15 Xu và +20 XP
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Daily Missions Snapshot (Hugs content height on mobile, no giant empty gap, always shows tasks on mobile) */}
          <div className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs card-academic-elevate transition-all lg:flex-1 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0">
                    <Target className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Nhiệm vụ hôm nay</h4>
                    <p className="text-xs sm:text-[11px] text-slate-500">Mở hộp quà tri thức</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-sky-700 tabular-nums">
                  {completedQuestsCount}/3 xong
                </span>
              </div>

              {/* Top Urgent Task (Layer 1 Visible) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center text-sky-600 shrink-0">
                    {activeDailyQuest?.completed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-sky-600" />}
                  </div>
                  <span className="text-sm sm:text-xs font-medium text-slate-800 leading-snug">
                    {activeDailyQuest?.text || "Giải 5 câu trắc nghiệm củng cố"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTab("quiz")}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
                >
                  Làm ngay
                </button>
              </div>

              {/* Full Quest Breakdown: always visible on mobile/touch via CSS + clean spacing */}
              <div className="reveal-on-hover space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 text-sm sm:text-[11px] text-slate-700">
                  <span>1. Giải trắc nghiệm kiến thức</span>
                  <span className="text-amber-700 font-semibold font-mono tabular-nums shrink-0">+20 Xu</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm sm:text-[11px] text-slate-700">
                  <span>2. Tạo bài học và ghi chú cùng AI</span>
                  <span className="text-amber-700 font-semibold font-mono tabular-nums shrink-0">+25 Xu</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm sm:text-[11px] text-slate-700">
                  <span>3. Tập trung 25 phút Pomodoro</span>
                  <span className="text-amber-700 font-semibold font-mono tabular-nums shrink-0">+15 Xu</span>
                </div>
              </div>
            </div>

            {/* Bottom Reward indicator */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <MagicGiftBox size={16} /> Hộp quà cuối ngày
              </span>
              <span className="font-bold text-sky-700">+50 Xu thưởng</span>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          LAYER 3: VIEWPORT REVEAL SECTION
          TRIGGERED ON SCROLL / VIEWPORT EXPLORATION (REDUCED COGNITIVE LOAD)
          ========================================================================= */}

      {/* SECTION 1: CHỦ ĐỀ CẦN CỦNG CỐ (DIAGNOSTIC WEAK TOPIC RECOMMENDATIONS) */}
      <div 
        ref={weakTopicsRef} 
        className={`transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          weakTopicsInView ? "opacity-100 translate-y-0" : "opacity-90 translate-y-2"
        }`}
      >
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 md:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-display font-black text-lg text-slate-900">
                  Chủ đề cần củng cố
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab("quiz")}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Luyện đề trắc nghiệm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards for Weak Topics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {weakTopicRecs.slice(0, 3).map((rec, idx) => (
              <div
                key={idx}
                className="group p-4 rounded-xl border border-slate-200/80 hover:border-sky-300 bg-slate-50/60 hover:bg-white transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-sky-700">{rec.subjectName}</span>
                    <span className="font-mono text-amber-700 font-bold tabular-nums">
                      Đúng {rec.accuracy}%
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-sky-900 transition-colors">
                    {rec.topic}
                  </h4>

                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {rec.reason}
                  </p>
                </div>

                {/* Layer 2 Hover Reveal Button */}
                <div className="pt-3 mt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                    Sai {rec.totalTested - rec.correctCount}/{rec.totalTested} câu
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectTab("quiz")}
                    className="min-h-6 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Luyện 5 câu</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: LEARNING ANALYTICS (RECHARTS AREA & LINE CHARTS) */}
      <div 
        ref={analyticsRef}
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          analyticsInView ? "opacity-100 translate-y-0" : "opacity-90 translate-y-2"
        }`}
      >
        {/* LEFT COLUMN (8/12): WEEKLY PROGRESS, SCORE TIMELINE & STUDY UNITS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CHART 0: WEEKLY PROGRESS BAR CHART (TIẾN ĐỘ HỌC TẬP TUẦN QUA) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 md:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="font-display font-extrabold text-lg text-slate-900">
                    Tiến độ học tập trong tuần
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 font-mono tabular-nums">
                    {weeklyProgressSummary.consistentDays}/7 ngày đạt mục tiêu
                  </span>
                </div>
                <p className="text-xs text-slate-500 sm:pl-10">
                  Tổng số phút tự học mỗi ngày trong 7 ngày qua để theo dõi thói quen học đều đặn
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {/* Quick Log Study Minutes */}
                <div className="flex items-center gap-1 bg-emerald-50/90 border border-emerald-200/80 p-1 rounded-xl text-[11px]">
                  <span className="px-2 font-semibold text-emerald-800">Hôm nay:</span>
                  <button
                    type="button"
                    onClick={() => addTodayStudyMinutes(15)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold font-mono tabular-nums transition-colors cursor-pointer shadow-2xs"
                    title="Ghi nhận thêm 15 phút tự học hôm nay"
                  >
                    +15p
                  </button>
                  <button
                    type="button"
                    onClick={() => addTodayStudyMinutes(30)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold font-mono tabular-nums transition-colors cursor-pointer shadow-2xs"
                    title="Ghi nhận thêm 30 phút tự học hôm nay"
                  >
                    +30p
                  </button>
                </div>

                {/* Daily vs Weekly Mode Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setChartMode("daily")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartMode === "daily" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    7 ngày qua
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode("weekly")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartMode === "weekly" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    4 tuần
                  </button>
                </div>
              </div>
            </div>

            {/* Consistency Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tổng tuần này
                </span>
                <p className="text-base font-black text-slate-900 font-mono tabular-nums">
                  {weeklyProgressSummary.totalMinutes}{" "}
                  <span className="text-xs font-normal text-slate-500">phút</span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Trung bình / ngày
                </span>
                <p className="text-base font-black text-indigo-700 font-mono tabular-nums">
                  {weeklyProgressSummary.avgMinutes}{" "}
                  <span className="text-xs font-normal text-slate-500">phút/ngày</span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Độ đều đặn
                </span>
                <p className="text-base font-black text-emerald-700 font-mono tabular-nums">
                  {weeklyProgressSummary.consistentDays}/7{" "}
                  <span className="text-xs font-normal text-slate-500">ngày ≥ {dailyStudyTargetMins}p</span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-0.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Mục tiêu ngày
                  </span>
                  <div className="flex items-center gap-1">
                    {[20, 30, 45].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleUpdateDailyTargetMins(mins)}
                        aria-pressed={dailyStudyTargetMins === mins}
                        aria-label={`Mục tiêu ${mins} phút mỗi ngày`}
                        className={`min-w-6 min-h-6 text-[10px] font-mono tabular-nums px-1 rounded transition-colors cursor-pointer ${
                          dailyStudyTargetMins === mins
                            ? "bg-amber-100 text-amber-800 font-bold"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {mins}p
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-base font-black text-amber-700 font-mono tabular-nums">
                  {dailyStudyTargetMins}{" "}
                  <span className="text-xs font-normal text-slate-500">phút/ngày</span>
                </p>
              </div>
            </div>

            {/* Recharts Weekly Progress BarChart */}
            <div className="h-64 sm:h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart title="Biểu đồ thời gian học" data={chartData} margin={{ top: 16, right: 16, left: -18, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit="p"
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white rounded-xl px-3.5 py-2.5 shadow-lg border border-slate-800 text-xs space-y-1">
                          <p className="font-bold text-slate-200">{item.fullDateLabel || item.name}</p>
                          <p className="font-mono tabular-nums text-emerald-400 font-black text-sm">
                            {item["Thời gian học (phút)"]} phút học tập
                          </p>
                          <p className="text-[11px] text-slate-300 font-mono tabular-nums">
                            Bài hoàn thành: {item["Bài hoàn thành"]} bài
                          </p>
                          {chartMode === "daily" && (
                            <p className="text-[10px] font-semibold text-amber-300">
                              {item.metTarget
                                ? `✓ Đạt mục tiêu đều đặn (≥ ${dailyStudyTargetMins} phút)`
                                : `Còn thiếu ${Math.max(0, dailyStudyTargetMins - item.minutes)} phút để đạt mục tiêu`}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  {chartMode === "daily" && (
                    <ReferenceLine
                      y={dailyStudyTargetMins}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Mục tiêu ${dailyStudyTargetMins}p`,
                        position: "insideTopRight",
                        fill: "#b45309",
                        fontSize: 10,
                        fontWeight: 700
                      }}
                    />
                  )}
                  <Bar
                    dataKey="Thời gian học (phút)"
                    name="Thời gian học (phút)"
                    radius={[6, 6, 0, 0]}
                    barSize={chartMode === "daily" ? 32 : 44}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`weekly-progress-cell-${idx}`}
                        fill={
                          entry.isToday
                            ? "#4f46e5"
                            : entry.metTarget
                            ? "#0e7f62"
                            : "#38bdf8"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & Consistency Note */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                  <span className="font-semibold text-slate-700">Hôm nay ({weeklyProgressSummary.todayMinutes}p)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                  <span>Đạt chuẩn đều đặn (≥ {dailyStudyTargetMins}p)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 inline-block" />
                  <span>Dưới mục tiêu ngày</span>
                </span>
              </div>
              <span className="font-mono tabular-nums text-slate-600">
                Ngày cao nhất: <strong className="text-slate-900">{weeklyProgressSummary.bestDay.shortLabel} ({weeklyProgressSummary.bestDay.minutes} phút)</strong>
              </span>
            </div>
          </div>

          {/* CHART A: TIẾN BỘ ĐIỂM SỐ THEO THỜI GIAN (LINE CHART) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 md:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    Tiến độ điểm số theo môn
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 font-mono tabular-nums">
                    +{overallImprovementDelta} điểm
                  </span>
                </div>
                <p className="text-xs text-slate-500 sm:pl-10">
                  Theo dõi xu hướng nâng cao điểm qua các bài test năng lực
                </p>
              </div>

              {/* Subject Filter Buttons (Zero-pill segmented buttons, no broken flag emoji) */}
              <div className="mobile-tab-scroll flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedScoreSubject("all")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedScoreSubject === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tất cả
                </button>
                {[
                  { id: "math", name: "Toán" },
                  { id: "english", name: "Tiếng Anh" },
                  { id: "literature", name: "Ngữ văn" },
                  { id: "science", name: "KHTN" }
                ].map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedScoreSubject(sub.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedScoreSubject === sub.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Summary Strips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mức tăng trưởng</span>
                <p className="text-base font-black text-emerald-700 font-mono tabular-nums">
                  +{overallImprovementDelta} <span className="text-xs font-normal text-slate-500">điểm</span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Môn bứt phá nhất</span>
                <p className="text-sm font-black text-slate-900 truncate">
                  {SUBJECT_DEFINITIONS.find(s => s.id === fastestGrowingSubject)?.name || "Toán học"}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Điểm trung bình</span>
                <p className="text-base font-black text-sky-900 font-mono tabular-nums">
                  {rawScoreTimeline[rawScoreTimeline.length - 1]?.overallAvg || 8.6} <span className="text-xs font-normal text-slate-500">/ 10</span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Môn cao nhất</span>
                <p className="text-sm font-black text-slate-900 truncate">
                  {SUBJECT_DEFINITIONS.find(s => s.id === strongestSubject)?.name || "Toán học"}
                </p>
              </div>
            </div>

            {/* Recharts Line Chart */}
            <div className="h-60 sm:h-64 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart title="Biểu đồ tiến độ điểm số theo môn" data={scoreChartData} margin={{ top: 12, right: 16, left: -20, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: "#64748b", fontSize: 11 }} 
                    axisLine={{ stroke: "#e2e8f0" }} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    tick={{ fill: "#94a3b8", fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0f172a", 
                      borderRadius: "12px", 
                      border: "none", 
                      color: "#ffffff",
                      fontSize: "12px"
                    }} 
                  />
                  {(selectedScoreSubject === "all" || selectedScoreSubject === "math") && (
                    <Line 
                      type="monotone" 
                      dataKey="math" 
                      name="Toán"
                      stroke="#4f46e5" 
                      strokeWidth={2.5} 
                      dot={{ r: 3.5, fill: "#ffffff", stroke: "#4f46e5" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {(selectedScoreSubject === "all" || selectedScoreSubject === "english") && (
                    <Line 
                      type="monotone" 
                      dataKey="english" 
                      name="Anh"
                      stroke="#0e7f62" 
                      strokeWidth={2.5} 
                      dot={{ r: 3.5, fill: "#ffffff", stroke: "#0e7f62" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {(selectedScoreSubject === "all" || selectedScoreSubject === "literature") && (
                    <Line 
                      type="monotone" 
                      dataKey="literature" 
                      name="Văn"
                      stroke="#e11d48" 
                      strokeWidth={2.5} 
                      dot={{ r: 3.5, fill: "#ffffff", stroke: "#e11d48" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {(selectedScoreSubject === "all" || selectedScoreSubject === "science") && (
                    <Line 
                      type="monotone" 
                      dataKey="science" 
                      name="KHTN"
                      stroke="#0d9488" 
                      strokeWidth={2.5} 
                      dot={{ r: 3.5, fill: "#ffffff", stroke: "#0d9488" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART B: PHÂN BỔ BÀI HỌC THEO MÔN (BAR CHART) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 md:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                  </div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    Phân bổ bài ôn tập theo môn
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                    ({lessons.length} bài)
                  </span>
                </div>
                <p className="text-xs text-slate-500 sm:pl-10">
                  Đối sánh số bài đã hoàn thành và số bài đang cần ôn luyện
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBarChartMetric("stacked")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    barChartMetric === "stacked" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tiến độ
                </button>
                <button
                  type="button"
                  onClick={() => setBarChartMetric("total")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    barChartMetric === "total" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tổng số bài
                </button>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-60 sm:h-64 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart title="Biểu đồ phân bổ bài ôn tập theo môn" data={subjectBarData} margin={{ top: 12, right: 12, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="shortName" 
                    tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }} 
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: "#94a3b8", fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0f172a", 
                      borderRadius: "12px", 
                      border: "none", 
                      color: "#ffffff",
                      fontSize: "12px"
                    }} 
                  />
                  {barChartMetric === "stacked" ? (
                    <>
                      <Bar dataKey="Đã hoàn thành" stackId="a" fill="#0e7f62" radius={[0, 0, 0, 0]} barSize={28} />
                      <Bar dataKey="Đang ôn tập" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={28} />
                    </>
                  ) : (
                    <Bar dataKey="Tổng số bài" radius={[4, 4, 0, 0]} barSize={28}>
                      {subjectBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fillColor} />
                      ))}
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHUYÊN ĐỀ TRỌNG ĐIỂM (STUDY MODULES) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 md:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-black text-lg text-slate-900">
                  Chuyên đề trọng điểm
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lộ trình học theo từng năng lực cốt lõi
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "grammar", label: "Ngữ pháp" },
                  { id: "vocabulary", label: "Từ vựng" },
                  { id: "reading", label: "Đọc hiểu" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedCategory === cat.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Units */}
            <div className="space-y-3">
              {filteredUnits.map((unit) => (
                <div
                  key={unit.id}
                  onClick={() => {
                    if (!unit.isLocked) {
                      triggerItemClick(unit.id, () => onSelectTab("review"));
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    unit.isLocked
                      ? "bg-slate-50/70 border-slate-200 opacity-60"
                      : "bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Quiet Unboxed Metadata with middots */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>{unit.completedCount}/{unit.lessonsCount} bài</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>{unit.duration}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-mono tabular-nums">{unit.progressPct}%</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{unit.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{unit.description}</p>

                      {/* Slim progress bar track */}
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
                        <div 
                          className="bg-sky-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${unit.progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      {unit.isLocked ? (
                        <Edupia3DLock locked={true} size={32} />
                      ) : (
                        <button 
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          {unit.status === "completed" ? "Ôn lại" : "Tiếp tục"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (4/12): KNOWLEDGE MAP, POMODORO FOCUS, 7-DAY TIMELINE */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* TOOL 1: BẢN ĐỒ TRI THỨC D3 (KNOWLEDGE MAP) */}
          <div 
            onClick={() => onSelectTab("knowledge-map")}
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs card-academic-elevate cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0">
                  <Compass className="w-5 h-5 text-sky-600 group-hover:rotate-45 transition-transform duration-300" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Bản đồ tri thức</h4>
                  <p className="text-[11px] text-slate-500">Sơ đồ liên kết các chủ đề bài học</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Khám phá mối tương quan giữa các định lý, công thức và chủ đề tiên quyết trên sơ đồ đồ thị tương tác.
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{completedLessonsCount} bài đã mở khóa</span>
              <span className="font-bold text-sky-700">Mở toàn màn hình</span>
            </div>
          </div>

          {/* TOOL 1.5: TIẾN ĐỘ NGHE PODCAST LŨY KẾ 30 NGÀY (RECHARTS PROGRESS BAR & CURVE) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
                  <Headphones className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Podcast 30 ngày qua</h4>
                  <p className="text-[11px] text-slate-500">Thời lượng nghe tích lũy</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-bold tabular-nums">
                {podcastGoalPct}%
              </span>
            </div>

            {/* Recharts Horizontal Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600">Tổng thời lượng 30 ngày qua</span>
                <span className="font-mono font-bold text-blue-700 tabular-nums">
                  {totalCumulativeMinutes30Days} / {monthlyListeningGoalMinutes} phút
                </span>
              </div>
              <div className="h-5 w-full rounded-xl overflow-hidden bg-slate-100 p-0.5 border border-slate-200/70">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    accessibilityLayer={false} /* the minutes are already written above as text */
                    data={podcastProgressBarData}
                    layout="vertical"
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" domain={[0, monthlyListeningGoalMinutes]} hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val} phút`,
                        name === "listened" ? "Đã nghe (30 ngày)" : "Còn lại"
                      ]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "10px",
                        border: "none",
                        color: "#ffffff",
                        fontSize: "11px"
                      }}
                    />
                    <Bar dataKey="listened" stackId="pod" fill="#2563eb" radius={[6, 0, 0, 6]} />
                    <Bar dataKey="remaining" stackId="pod" fill="#e2e8f0" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 30-Day Cumulative Recharts Area Curve */}
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart title="Biểu đồ phút nghe podcast 30 ngày" data={listeningHistory30Days} margin={{ top: 6, right: 4, left: -26, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashPodcastCumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} phút`, "Lũy kế 30 ngày"]}
                    labelFormatter={(label) => `Ngày ${label}`}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "10px",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "11px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeMinutes"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dashPodcastCumGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Giọng đọc chậm rõ 0.5x · 0.75x</span>
              <button
                type="button"
                onClick={() => onSelectTab("podcast")}
                className="min-h-6 py-1 font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
              >
                <span>Mở Podcast</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* TOOL 2: TRẠM TẬP TRUNG POMODORO MINI */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Trạm tập trung Pomodoro</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {focusMode === "focus" ? "Học sâu 25p" : "Giải lao 5p"}
              </span>
            </div>

            {/* Timer countdown display with WCAG accessibility */}
            <div 
              role="timer" 
              aria-live="polite" 
              aria-label={`Đồng hồ Pomodoro: ${formatTimer(focusSeconds)}`}
              className="text-center py-2 space-y-1"
            >
              <div className="font-mono text-3xl font-black text-slate-900 tracking-wider tabular-nums">
                {formatTimer(focusSeconds)}
              </div>
              <p className="text-[11px] text-slate-500">
                {isFocusRunning ? "Đang đếm ngược... Giữ tập trung tối đa!" : "Bấm bắt đầu để kích hoạt chuỗi học sâu"}
              </p>
            </div>

            {/* Active comprehension checkpoint to prevent passive streak/coin farming */}
            {isFocusRunning && focusSeconds <= 15 * 60 && !focusCheckInAnswered && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2 animate-fade-in">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                  <span>Điểm danh tập trung: Em vẫn đang theo sát bài học chứ?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFocusCheckInAnswered(true);
                    if (onUpdateProgress) {
                      onUpdateProgress({ points: (progress.points || 0) + 5 });
                    }
                  }}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                >
                  Em đang học tập trung ✓ (+5 XP)
                </button>
              </div>
            )}

            {/* Timer controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFocusRunning(!isFocusRunning)}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  isFocusRunning
                    ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                    : "bg-sky-600 hover:bg-sky-700 text-white"
                }`}
              >
                {isFocusRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Tạm dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Bắt đầu tập trung</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFocusRunning(false);
                  setFocusSeconds(25 * 60);
                  setFocusMode("focus");
                }}
                aria-label="Đặt lại đồng hồ Pomodoro 25 phút"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Đặt lại 25 phút"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Phần thưởng hoàn thành:</span>
              <span className="font-bold text-amber-700 flex items-center gap-1">
                <WisdomCoinIcon size={12} /> +15 Xu và +25 XP
              </span>
            </div>
          </div>

          {/* TOOL 3: LỜI KHUYÊN SƯ PHẠM SMARTSTUDY */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Gợi ý phương pháp học tập</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tự nhớ lại kiến thức vừa học (Active Recall) kết hợp ôn tập ngắt quãng qua thẻ Flashcard giúp em ghi nhớ công thức và từ vựng bền vững hơn gấp 3 lần so với chỉ đọc lại sách.
            </p>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400">— Gợi ý học tập SmartStudy</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
