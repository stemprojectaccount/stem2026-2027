import React, { useState, useMemo, useEffect } from "react";
import { Trophy, Sunrise, Flame, BookOpen, PenTool, Compass, Crown, GraduationCap, Check, Lock, ArrowRight, Award, Target, Clock, BadgeCheck } from "lucide-react";
import { Lesson, QuizAttempt, UserProgress } from "../types";
import { loadQuizHistory } from "../lib/quizAnalytics";

export type AchievementCategory = "quiz" | "habit" | "lesson";

export interface AchievementItem {
  id: string;
  title: string;
  englishSubtitle: string;
  description: string;
  requirementLabel: string;
  category: AchievementCategory;
  emoji: string;
  titleBadgeValue: string;
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  accentGradient: string;
  iconBg: string;
  iconColor: string;
  ctaTab?: string;
  ctaLabel?: string;
}

interface AchievementsProps {
  progress: UserProgress;
  lessons: Lesson[];
  activeTitleBadge?: string;
  onEquipTitleBadge?: (titleBadge: string) => void;
  onNavigateTab?: (tab: string) => void;
}

// Was "Night Owl" (studying 22:00–05:00); a badge for staying up late is wrong for 11–15 year olds, so it now
// rewards morning study. New storage key: the old flag meant "studied at night".
const NIGHT_OWL_STORAGE_KEY = "smart_study_early_bird_unlocked_v1";

function isNightOwlHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 5 && hour < 8;
}

function detectNightStudySessions(lessons: Lesson[], quizAttempts: QuizAttempt[], lastActive?: string): number {
  let nightSessions = 0;

  try {
    if (localStorage.getItem(NIGHT_OWL_STORAGE_KEY) === "true") {
      nightSessions = Math.max(nightSessions, 1);
    }
  } catch {
    // Ignore storage access errors in restricted sandboxes
  }

  if (isNightOwlHour(new Date())) {
    nightSessions = Math.max(nightSessions, 1);
    try {
      localStorage.setItem(NIGHT_OWL_STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
  }

  for (const attempt of quizAttempts) {
    if (!attempt.timestamp) continue;
    const parsed = new Date(attempt.timestamp);
    if (!isNaN(parsed.getTime()) && isNightOwlHour(parsed)) {
      nightSessions += 1;
    }
  }

  for (const lesson of lessons) {
    const timestamps = [lesson.completedAt, lesson.createdAt].filter(Boolean) as string[];
    for (const ts of timestamps) {
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime()) && isNightOwlHour(parsed)) {
        nightSessions += 1;
        break;
      }
    }
  }

  if (lastActive) {
    const parsed = new Date(lastActive);
    if (!isNaN(parsed.getTime()) && isNightOwlHour(parsed)) {
      nightSessions = Math.max(nightSessions, 1);
    }
  }

  return nightSessions;
}

// Medal tiers: bronze → silver → gold, so there is always a next goal in sight.
const TIER_STYLE = [
  { name: "Đồng", accentGradient: "from-orange-400 to-amber-600 text-white", iconBg: "bg-orange-100 border-orange-300", iconColor: "text-orange-700" },
  { name: "Bạc", accentGradient: "from-slate-400 to-slate-600 text-white", iconBg: "bg-slate-100 border-slate-300", iconColor: "text-slate-700" },
  { name: "Vàng", accentGradient: "from-amber-400 to-yellow-600 text-white", iconBg: "bg-amber-100 border-amber-300", iconColor: "text-amber-700" },
];

type TierSeries = {
  key: string;
  title: string;
  englishSubtitle: string;
  emoji: string;
  category: AchievementCategory;
  value: number;
  targets: number[];
  describe: (n: number) => string;
  unit: string;
  ctaTab: string;
  ctaLabel: string;
};

function tieredAchievements(progress: UserProgress, quizzesDone: number, perfectQuizzes: number, lessonsDone: number, notesWritten: number): Omit<AchievementItem, "progressPercent">[] {
  const series: TierSeries[] = [
    { key: "quiz-count", title: "Chăm Luyện Đề", englishSubtitle: "Practice", emoji: "📝", category: "quiz", value: Math.max(quizzesDone, progress.testsTakenCount || 0), targets: [10, 30, 100], describe: (n) => `Làm xong ${n} bài luyện đề.`, unit: "bài luyện đề", ctaTab: "quiz", ctaLabel: "Luyện đề ngay" },
    { key: "perfect", title: "Không Sai Câu Nào", englishSubtitle: "Flawless", emoji: "🎯", category: "quiz", value: perfectQuizzes, targets: [15, 40], describe: (n) => `Đạt 100% trong ${n} bài luyện đề.`, unit: "bài đạt 100%", ctaTab: "quiz", ctaLabel: "Luyện đề ngay" },
    { key: "streak", title: "Ngọn Lửa Bền Bỉ", englishSubtitle: "Long Streak", emoji: "📅", category: "habit", value: progress.streak, targets: [14, 30], describe: (n) => `Học liên tục ${n} ngày.`, unit: "ngày liên tiếp", ctaTab: "quiz", ctaLabel: "Học hôm nay" },
    { key: "lessons", title: "Đọc Bài Đều Đặn", englishSubtitle: "Reader", emoji: "📚", category: "lesson", value: lessonsDone, targets: [5, 10, 25], describe: (n) => `Hoàn thành ${n} bài học.`, unit: "bài học", ctaTab: "lessons", ctaLabel: "Học bài tiếp" },
    { key: "level", title: "Lên Cấp", englishSubtitle: "Level Up", emoji: "⭐", category: "habit", value: progress.level, targets: [5, 10, 20], describe: (n) => `Đạt cấp ${n}.`, unit: "cấp", ctaTab: "quiz", ctaLabel: "Kiếm thêm XP" },
    { key: "notes", title: "Sổ Tay Chăm Chỉ", englishSubtitle: "Note Keeper", emoji: "🗒️", category: "lesson", value: notesWritten, targets: [5], describe: (n) => `Viết ghi chú trong ${n} bài học.`, unit: "bài có ghi chú", ctaTab: "lessons", ctaLabel: "Viết ghi chú" },
  ];
  return series.flatMap((s) =>
    s.targets.map((target, i) => {
      const tier = TIER_STYLE[s.targets.length === 1 ? 1 : Math.min(i, 2)];
      const title = `${s.title} ${s.targets.length > 1 ? tier.name : ""}`.trim();
      return {
        id: `${s.key}-${target}`,
        title,
        englishSubtitle: `${s.englishSubtitle} ${target}`,
        description: s.describe(target),
        requirementLabel: `${Math.min(s.value, target)} / ${target} ${s.unit}`,
        category: s.category,
        emoji: s.emoji,
        titleBadgeValue: `${s.emoji} ${title}`,
        unlocked: s.value >= target,
        currentValue: Math.min(s.value, target),
        targetValue: target,
        accentGradient: tier.accentGradient,
        iconBg: tier.iconBg,
        iconColor: tier.iconColor,
        ctaTab: s.ctaTab,
        ctaLabel: s.ctaLabel,
      };
    }),
  );
}

export function computeUserAchievements(
  progress: UserProgress,
  lessons: Lesson[],
  quizAttemptsInput?: QuizAttempt[]
): AchievementItem[] {
  const quizAttempts = quizAttemptsInput ?? loadQuizHistory();

  const completedLessonsCount = Math.max(
    lessons.filter((l) => l.completed).length,
    progress.lessonsCompletedCount || 0
  );
  const noteWroteCount = lessons.filter((l) => l.notes && l.notes.trim().length > 0).length;

  // Count perfect quiz scores (100% accuracy)
  const perfectQuizCount = quizAttempts.filter(
    (a) => a.percentage === 100 || (a.totalQuestions > 0 && a.score >= a.totalQuestions)
  ).length;

  // Early Bird detection (05:00 - 07:59 study activity)
  const nightSessionsCount = detectNightStudySessions(lessons, quizAttempts, progress.lastActive);

  const rawItems: Omit<AchievementItem, "progressPercent">[] = [
    {
      id: "quiz-master",
      title: "Bậc Thầy Trắc Nghiệm",
      englishSubtitle: "Quiz Master",
      description: "Đạt điểm tuyệt đối (100%) trong 5 bài kiểm tra trắc nghiệm bất kỳ.",
      requirementLabel: `${Math.min(perfectQuizCount, 5)} / 5 bài đạt 100%`,
      category: "quiz",
      emoji: "🏆",
      titleBadgeValue: "🏆 Quiz Master",
      unlocked: perfectQuizCount >= 5,
      currentValue: Math.min(perfectQuizCount, 5),
      targetValue: 5,
      accentGradient: "from-amber-500 to-orange-600 text-white",
      iconBg: "bg-amber-100 border-amber-300",
      iconColor: "text-amber-700",
      ctaTab: "quiz",
      ctaLabel: "Luyện đề ngay"
    },
    {
      id: "night-owl",
      title: "Chim Sớm Chăm Chỉ",
      englishSubtitle: "Early Bird",
      description: "Học bài hoặc làm đề ôn tập vào buổi sáng sớm (5:00 – 7:59), lúc đầu óc tỉnh táo nhất.",
      requirementLabel: nightSessionsCount >= 1 ? "Đã ghi nhận học buổi sáng" : "Học từ 5:00 – 7:59",
      category: "habit",
      emoji: "🐦",
      titleBadgeValue: "🐦 Chim Sớm",
      unlocked: nightSessionsCount >= 1,
      currentValue: Math.min(nightSessionsCount, 1),
      targetValue: 1,
      accentGradient: "from-amber-400 to-orange-500 text-white",
      iconBg: "bg-amber-100 border-amber-300",
      iconColor: "text-amber-700",
      ctaTab: "lessons",
      ctaLabel: "Vào ôn bài"
    },
    {
      id: "badge-1",
      title: "Học Sinh Mới",
      englishSubtitle: "First Step",
      description: "Gia nhập giảng đường SmartStudy và khởi động hành trình tự học.",
      requirementLabel: "1 / 1 hoàn thành",
      category: "habit",
      emoji: "🎒",
      titleBadgeValue: "🎒 Học Sinh Mới",
      unlocked: true,
      currentValue: 1,
      targetValue: 1,
      accentGradient: "from-sky-500 to-blue-600 text-white",
      iconBg: "bg-sky-100 border-sky-300",
      iconColor: "text-sky-700"
    },
    {
      id: "badge-2",
      title: "Chúa Tể Ghi Chú",
      englishSubtitle: "Note Crafter",
      description: "Viết ghi chép tự học chi tiết trong ít nhất 1 bài học.",
      requirementLabel: `${Math.min(noteWroteCount, 1)} / 1 bài có ghi chú`,
      category: "lesson",
      emoji: "✍️",
      titleBadgeValue: "✍️ Chúa Tể Ghi Chú",
      unlocked: noteWroteCount >= 1,
      currentValue: Math.min(noteWroteCount, 1),
      targetValue: 1,
      accentGradient: "from-blue-600 to-teal-600 text-white",
      iconBg: "bg-blue-100 border-blue-300",
      iconColor: "text-blue-700",
      ctaTab: "lessons",
      ctaLabel: "Viết ghi chú"
    },
    {
      id: "badge-3",
      title: "Vua Khám Phá",
      englishSubtitle: "Curriculum Explorer",
      description: "Sở hữu hoặc tạo thành công ít nhất 3 bài học trong thư viện.",
      requirementLabel: `${Math.min(lessons.length, 3)} / 3 bài học`,
      category: "lesson",
      emoji: "🧭",
      titleBadgeValue: "🧭 Vua Khám Phá",
      unlocked: lessons.length >= 3,
      currentValue: Math.min(lessons.length, 3),
      targetValue: 3,
      accentGradient: "from-cyan-500 to-sky-600 text-white",
      iconBg: "bg-cyan-100 border-cyan-300",
      iconColor: "text-cyan-700",
      ctaTab: "create",
      ctaLabel: "Tạo bài học mới"
    },
    {
      id: "badge-4",
      title: "Bất Bại Đấu Trường",
      englishSubtitle: "Arena Centurion",
      description: "Tích lũy cột mốc 100 XP đầu tiên qua các thử thách học tập.",
      requirementLabel: `${Math.min(progress.points, 100)} / 100 XP`,
      category: "quiz",
      emoji: "👑",
      titleBadgeValue: "👑 Bất Bại Đấu Trường",
      unlocked: progress.points >= 100,
      currentValue: Math.min(progress.points, 100),
      targetValue: 100,
      accentGradient: "from-amber-400 to-yellow-600 text-white",
      iconBg: "bg-amber-100 border-amber-300",
      iconColor: "text-amber-700",
      ctaTab: "quiz",
      ctaLabel: "Kiếm thêm XP"
    },
    {
      id: "badge-5",
      title: "Kiên Trì Bền Bỉ",
      englishSubtitle: "Streak Keeper",
      description: "Duy trì chuỗi ngày học tập liên tục từ 3 ngày trở lên.",
      requirementLabel: `${Math.min(progress.streak, 3)} / 3 ngày liên tiếp`,
      category: "habit",
      emoji: "🔥",
      titleBadgeValue: "🔥 Kiên Trì Bền Bỉ",
      unlocked: progress.streak >= 3,
      currentValue: Math.min(progress.streak, 3),
      targetValue: 3,
      accentGradient: "from-orange-500 to-rose-600 text-white",
      iconBg: "bg-orange-100 border-orange-300",
      iconColor: "text-orange-700",
      ctaTab: "lessons",
      ctaLabel: "Duy trì chuỗi"
    },
    {
      id: "badge-6",
      title: "Nhà Bác Học Trẻ",
      englishSubtitle: "Young Scholar",
      description: "Hoàn thành trọn vẹn tối thiểu 2 bài học trong chương trình.",
      requirementLabel: `${Math.min(completedLessonsCount, 2)} / 2 bài hoàn thành`,
      category: "lesson",
      emoji: "🧠",
      titleBadgeValue: "🧠 Nhà Bác Học Trẻ",
      unlocked: completedLessonsCount >= 2,
      currentValue: Math.min(completedLessonsCount, 2),
      targetValue: 2,
      accentGradient: "from-emerald-500 to-teal-600 text-white",
      iconBg: "bg-emerald-100 border-emerald-300",
      iconColor: "text-emerald-700",
      ctaTab: "lessons",
      ctaLabel: "Học bài tiếp"
    },
    {
      id: "streak-7",
      title: "Chiến Thần Chuỗi Lửa",
      englishSubtitle: "7-Day Igniter",
      description: "Duy trì ngọn lửa hiếu học suốt 7 ngày liên tiếp không gián đoạn.",
      requirementLabel: `${Math.min(progress.streak, 7)} / 7 ngày liên tiếp`,
      category: "habit",
      emoji: "⚡",
      titleBadgeValue: "⚡ Chiến Thần Chuỗi Lửa",
      unlocked: progress.streak >= 7,
      currentValue: Math.min(progress.streak, 7),
      targetValue: 7,
      accentGradient: "from-rose-500 to-red-600 text-white",
      iconBg: "bg-rose-100 border-rose-300",
      iconColor: "text-rose-700",
      ctaTab: "quiz",
      ctaLabel: "Giữ lửa hôm nay"
    },
    ...tieredAchievements(progress, quizAttempts.length, perfectQuizCount, completedLessonsCount, noteWroteCount)
  ];

  return rawItems.map((item) => ({
    ...item,
    progressPercent: Math.min(
      100,
      Math.round((item.currentValue / Math.max(1, item.targetValue)) * 100)
    )
  }));
}

function renderAchievementIcon(id: string, className: string) {
  if (id.startsWith("quiz-count-")) return <Target className={className} />;
  if (id.startsWith("perfect-")) return <BadgeCheck className={className} />;
  if (id.startsWith("streak-") && id !== "streak-7") return <Clock className={className} />;
  if (id.startsWith("level-")) return <Award className={className} />;
  if (id.startsWith("notes-")) return <PenTool className={className} />;
  switch (id) {
    case "quiz-master":
      return <Trophy className={className} />;
    case "night-owl":
      return <Sunrise className={className} />;
    case "badge-1":
      return <GraduationCap className={className} />;
    case "badge-2":
      return <PenTool className={className} />;
    case "badge-3":
      return <Compass className={className} />;
    case "badge-4":
      return <Crown className={className} />;
    case "badge-5":
    case "streak-7":
      return <Flame className={className} />;
    case "badge-6":
    default:
      return <BookOpen className={className} />;
  }
}

export function Achievements({
  progress,
  lessons,
  activeTitleBadge,
  onEquipTitleBadge,
  onNavigateTab
}: AchievementsProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | AchievementCategory>("all");
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>(() => loadQuizHistory());
  const [nightOwlSimulated, setNightOwlSimulated] = useState<boolean>(false);

  useEffect(() => {
    setQuizHistory(loadQuizHistory());
  }, [progress.points, progress.testsTakenCount, lessons.length]);

  const achievements = useMemo(
    () => computeUserAchievements(progress, lessons, quizHistory),
    [progress, lessons, quizHistory, nightOwlSimulated]
  );

  const unlockedCount = useMemo(
    () => achievements.filter((a) => a.unlocked).length,
    [achievements]
  );

  const overallCompletionPercent = useMemo(
    () => Math.round((unlockedCount / Math.max(1, achievements.length)) * 100),
    [unlockedCount, achievements.length]
  );

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      if (statusFilter === "unlocked" && !item.unlocked) return false;
      if (statusFilter === "locked" && item.unlocked) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    });
  }, [achievements, statusFilter, categoryFilter]);

  const currentHour = new Date().getHours();
  const isCurrentlyNightWindow = currentHour >= 5 && currentHour < 8;

  const handleCheckInNightStudy = () => {
    try {
      localStorage.setItem(NIGHT_OWL_STORAGE_KEY, "true");
    } catch {
      // Ignore storage error
    }
    setNightOwlSimulated((prev) => !prev);
  };

  return (
    <section
      aria-labelledby="achievements-heading"
      data-testid="achievements-section"
      className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5"
    >
      {/* Top Header & Progress Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="achievements-heading"
                className="font-display font-black text-slate-900 text-base sm:text-lg flex items-center gap-2"
              >
                <span>Thành tựu và huy chương</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300/80 tabular-nums">
                  {unlockedCount} / {achievements.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Chinh phục các cột mốc học tập như <strong>Quiz Master</strong> (5 lần 100 điểm) hoặc{" "}
                <strong>Chim Sớm</strong> (học buổi sáng) để nhận danh hiệu.
              </p>
            </div>
          </div>
        </div>

        {/* Overall Achievement Meter */}
        <div className="w-full lg:w-64 bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-sky-600" />
              <span>Tiến độ bộ sưu tập</span>
            </span>
            <span className="text-sky-700 font-black tabular-nums">{overallCompletionPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${overallCompletionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter */}
        <div className="inline-flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
          {(
            [
              { id: "all", label: `Tất cả (${achievements.length})` },
              { id: "unlocked", label: `Đã mở khóa (${unlockedCount})` },
              { id: "locked", label: `Đang chinh phục (${achievements.length - unlockedCount})` }
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  active
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: "Mọi nhóm" },
              { id: "quiz", label: "Trắc nghiệm" },
              { id: "habit", label: "Thói quen" },
              { id: "lesson", label: "Bài học" }
            ] as const
          ).map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  active
                    ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievement Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700">
            Không có huy chương nào trong bộ lọc này.
          </p>
          <p className="text-xs text-slate-500">
            Hãy chuyển sang bộ lọc "Tất cả" để xem toàn bộ danh sách thành tựu.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold transition-colors cursor-pointer"
          >
            Xem tất cả huy chương
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((badge) => {
            const isEquipped = activeTitleBadge === badge.titleBadgeValue;

            return (
              <article
                key={badge.id}
                data-testid={`achievement-card-${badge.id}`}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-all relative ${
                  badge.unlocked
                    ? isEquipped
                      ? "bg-amber-50/40 border-amber-400 ring-2 ring-amber-400/20"
                      : "bg-white border-slate-200/90 hover:border-sky-300"
                    : "bg-slate-50/80 border-slate-200/70"
                }`}
              >
                {/* Top Row: Icon + Titles + Status */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                      badge.unlocked
                        ? `bg-gradient-to-br ${badge.accentGradient} border-transparent shadow-xs`
                        : "bg-slate-200/80 border-slate-300 text-slate-500"
                    }`}
                  >
                    {badge.unlocked ? (
                      renderAchievementIcon(badge.id, "w-6 h-6 stroke-[2.2]")
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-slate-500 truncate">
                        {badge.englishSubtitle}
                      </span>
                      {badge.unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Đã mở
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md shrink-0">
                          Khóa
                        </span>
                      )}
                    </div>

                    <h4
                      className={`font-display font-black text-sm leading-snug ${
                        badge.unlocked ? "text-slate-900" : "text-slate-600"
                      }`}
                    >
                      {badge.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Progress Bar & Interactive Action */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">{badge.requirementLabel}</span>
                      <span
                        className={`tabular-nums font-extrabold ${
                          badge.unlocked ? "text-emerald-700" : "text-slate-600"
                        }`}
                      >
                        {badge.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.unlocked
                            ? "bg-emerald-500"
                            : "bg-sky-500"
                        }`}
                        style={{ width: `${badge.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {badge.unlocked ? (
                      onEquipTitleBadge ? (
                        <button
                          type="button"
                          onClick={() => onEquipTitleBadge(badge.titleBadgeValue)}
                          disabled={isEquipped}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isEquipped
                              ? "bg-amber-100 text-amber-900 border border-amber-300 cursor-default"
                              : "bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200"
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <BadgeCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>Đang dùng làm danh hiệu</span>
                            </>
                          ) : (
                            <>
                              <Award className="w-3.5 h-3.5 text-sky-600" />
                              <span>Trang bị danh hiệu: {badge.titleBadgeValue}</span>
                            </>
                          )}
                        </button>
                      ) : null
                    ) : badge.id === "night-owl" && isCurrentlyNightWindow ? (
                      <button
                        type="button"
                        onClick={handleCheckInNightStudy}
                        className="w-full py-2 px-3 rounded-xl bg-[#2e5cb8] hover:bg-[#243c6e] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Điểm danh học buổi sáng</span>
                      </button>
                    ) : badge.ctaTab && onNavigateTab ? (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(badge.ctaTab!)}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>{badge.ctaLabel || "Thực hiện ngay"}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
