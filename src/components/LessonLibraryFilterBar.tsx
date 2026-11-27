import React from "react";
import { createPortal } from "react-dom";
import { 
  BookOpen, 
  GraduationCap, 
  X, 
  CheckCircle2, 
  Clock, 
  Bookmark,
  RotateCcw,
  Layers,
  Flame,
  FileText,
  PenTool,
  Zap,
  SlidersHorizontal
} from "lucide-react";
import { Lesson } from "../types";

export interface SubjectItem {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  accentColor: string;
  borderActive: string;
  bgActive: string;
  bgLight: string;
  textLight: string;
}

export type LessonDifficultyLevel = "Dễ" | "Trung bình" | "Khó";
export type LessonContentType = "Lý thuyết" | "Bài tập" | "Tóm tắt";

export interface DifficultyOptionItem {
  id: "all" | LessonDifficultyLevel;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  activeClass: string;
  dotColor: string;
}

export interface ContentTypeOptionItem {
  id: "all" | LessonContentType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  badgeClass: string;
  activeClass: string;
}

export const DIFFICULTY_OPTIONS: DifficultyOptionItem[] = [
  {
    id: "all",
    label: "Tất cả mức độ",
    shortLabel: "Tất cả",
    description: "Hiển thị mọi mức độ bài học",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    activeClass: "bg-[#2e5cb8] text-white border-[#2e5cb8] shadow-2xs",
    dotColor: "bg-slate-400"
  },
  {
    id: "Dễ",
    label: "Cơ bản (Dễ)",
    shortLabel: "Cơ bản",
    description: "Kiến thức nền tảng, dễ hiểu, nắm bắt nhanh",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-2xs",
    dotColor: "bg-emerald-500"
  },
  {
    id: "Trung bình",
    label: "Trung bình (Vận dụng)",
    shortLabel: "Trung bình",
    description: "Kết hợp lý thuyết và phân tích tình huống",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    activeClass: "bg-amber-600 text-white border-amber-600 shadow-2xs",
    dotColor: "bg-amber-500"
  },
  {
    id: "Khó",
    label: "Nâng cao (Khó)",
    shortLabel: "Nâng cao",
    description: "Chuyên đề sâu, biến đổi công thức và vận dụng cao",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    activeClass: "bg-rose-600 text-white border-rose-600 shadow-2xs",
    dotColor: "bg-rose-500"
  }
];

export const CONTENT_TYPE_OPTIONS: ContentTypeOptionItem[] = [
  {
    id: "all",
    label: "Tất cả loại",
    shortLabel: "Tất cả",
    description: "Toàn bộ tài liệu học tập",
    icon: "📚",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    activeClass: "bg-[#2e5cb8] text-white border-[#2e5cb8] shadow-2xs"
  },
  {
    id: "Lý thuyết",
    label: "Lý thuyết",
    shortLabel: "Lý thuyết",
    description: "Khái niệm cốt lõi, giải thích bản chất và định nghĩa",
    icon: "📖",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    activeClass: "bg-sky-600 text-white border-sky-600 shadow-2xs"
  },
  {
    id: "Bài tập",
    label: "Bài tập",
    shortLabel: "Bài tập",
    description: "Bài tập tự luyện, ví dụ giải chi tiết và câu hỏi củng cố",
    icon: "✍️",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    activeClass: "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
  },
  {
    id: "Tóm tắt",
    label: "Tóm tắt",
    shortLabel: "Tóm tắt",
    description: "Bảng công thức, sơ đồ so sánh và ghi nhớ trọng tâm",
    icon: "⚡",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    activeClass: "bg-purple-600 text-white border-purple-600 shadow-2xs"
  }
];

export const SUBJECT_DEFINITIONS: SubjectItem[] = [
  {
    id: "all",
    name: "Tất cả môn",
    shortName: "Tất cả",
    icon: "📚",
    accentColor: "sky",
    borderActive: "border-sky-500",
    bgActive: "bg-sky-600 text-white shadow-sm",
    bgLight: "bg-sky-100 text-sky-800",
    textLight: "text-sky-700"
  },
  {
    id: "math",
    name: "Toán học",
    shortName: "Toán",
    icon: "📐",
    accentColor: "indigo",
    borderActive: "border-indigo-500",
    bgActive: "bg-indigo-600 text-white shadow-sm",
    bgLight: "bg-indigo-50 text-indigo-700 border-indigo-200",
    textLight: "text-indigo-700"
  },
  {
    id: "english",
    name: "Tiếng Anh",
    shortName: "Tiếng Anh",
    icon: "🇬🇧",
    accentColor: "emerald",
    borderActive: "border-emerald-500",
    bgActive: "bg-emerald-600 text-white shadow-sm",
    bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    textLight: "text-emerald-700"
  },
  {
    id: "literature",
    name: "Ngữ văn",
    shortName: "Văn",
    icon: "✍️",
    accentColor: "rose",
    borderActive: "border-rose-500",
    bgActive: "bg-rose-600 text-white shadow-sm",
    bgLight: "bg-rose-50 text-rose-700 border-rose-200",
    textLight: "text-rose-700"
  },
  {
    id: "science",
    name: "Khoa học Tự nhiên",
    shortName: "KHTN",
    icon: "🔬",
    accentColor: "teal",
    borderActive: "border-teal-500",
    bgActive: "bg-teal-600 text-white shadow-sm",
    bgLight: "bg-teal-50 text-teal-700 border-teal-200",
    textLight: "text-teal-700"
  },
  {
    id: "social",
    name: "Lịch sử và Địa lý",
    shortName: "Sử - Địa",
    icon: "🌍",
    accentColor: "amber",
    borderActive: "border-amber-500",
    bgActive: "bg-amber-600 text-white shadow-sm",
    bgLight: "bg-amber-50 text-amber-700 border-amber-200",
    textLight: "text-amber-700"
  },
  {
    id: "informatics",
    name: "Tin học",
    shortName: "Tin học",
    icon: "💻",
    accentColor: "cyan",
    borderActive: "border-cyan-500",
    bgActive: "bg-cyan-600 text-white shadow-sm",
    bgLight: "bg-cyan-50 text-cyan-700 border-cyan-200",
    textLight: "text-cyan-700"
  },
  {
    id: "civic",
    name: "GDCD / Đạo đức",
    shortName: "GDCD",
    icon: "⚖️",
    accentColor: "purple",
    borderActive: "border-purple-500",
    bgActive: "bg-purple-600 text-white shadow-sm",
    bgLight: "bg-purple-50 text-purple-700 border-purple-200",
    textLight: "text-purple-700"
  },
  {
    id: "other",
    name: "Môn khác",
    shortName: "Khác",
    icon: "🎨",
    accentColor: "slate",
    borderActive: "border-slate-500",
    bgActive: "bg-slate-700 text-white shadow-sm",
    bgLight: "bg-slate-100 text-slate-700 border-slate-200",
    textLight: "text-slate-700"
  }
];

export const GRADE_OPTIONS = [
  { id: "all", label: "Tất cả khối lớp" },
  { id: "Lớp 6", label: "Khối Lớp 6" },
  { id: "Lớp 7", label: "Khối Lớp 7" },
  { id: "Lớp 8", label: "Khối Lớp 8" },
  { id: "Lớp 9", label: "Khối Lớp 9" },
  { id: "Khác", label: "Khối khác" }
];

export function detectLessonSubject(lesson: Lesson): string {
  const combined = `${lesson.bookName || ""} ${lesson.title || ""} ${lesson.topic || ""}`.toLowerCase();
  
  if (combined.includes("toán") || combined.includes("math") || combined.includes("đại số") || combined.includes("hình học") || combined.includes("số tự nhiên") || combined.includes("phân số") || combined.includes("hằng đẳng thức")) {
    return "math";
  }
  if (combined.includes("tiếng anh") || combined.includes("english") || combined.includes("anh văn") || combined.includes("tenses") || combined.includes("grammar") || combined.includes("conditional") || combined.includes("hiện tại")) {
    return "english";
  }
  if (combined.includes("văn") || combined.includes("ngữ văn") || combined.includes("tiếng việt") || combined.includes("lão hạc") || combined.includes("thơ") || combined.includes("truyện")) {
    return "literature";
  }
  if (combined.includes("khoa học") || combined.includes("khtn") || combined.includes("vật lý") || combined.includes("vật lí") || combined.includes("hóa học") || combined.includes("sinh học") || combined.includes("nước") || combined.includes("quang hợp")) {
    return "science";
  }
  if (combined.includes("lịch sử") || combined.includes("địa lý") || combined.includes("địa lí") || combined.includes("sử") || combined.includes("địa") || combined.includes("amazon") || combined.includes("phù nam")) {
    return "social";
  }
  if (combined.includes("tin học") || combined.includes("tin") || combined.includes("công nghệ") || combined.includes("python") || combined.includes("lập trình") || combined.includes("thuật toán")) {
    return "informatics";
  }
  if (combined.includes("công dân") || combined.includes("gdcd") || combined.includes("đạo đức")) {
    return "civic";
  }
  return "other";
}

export function normalizeLessonGrade(rawGrade: string = ""): string {
  const g = rawGrade.toLowerCase();
  if (g.includes("6")) return "Lớp 6";
  if (g.includes("7")) return "Lớp 7";
  if (g.includes("8")) return "Lớp 8";
  if (g.includes("9")) return "Lớp 9";
  return "Khác";
}

/**
 * Phân loại Độ khó bài học (Dễ / Trung bình / Khó) dựa trên nội dung, khối lớp và chủ đề
 */
export function detectLessonDifficulty(lesson: Lesson): {
  level: LessonDifficultyLevel;
  shortLabel: string;
  className: string;
} {
  const titleAndTopic = `${lesson.title || ""} ${lesson.topic || ""}`.toLowerCase();
  const content = lesson.content || "";
  const normGrade = normalizeLessonGrade(lesson.grade);

  if (
    titleAndTopic.includes("nâng cao") ||
    titleAndTopic.includes("chinh phục") ||
    titleAndTopic.includes("hằng đẳng thức") ||
    titleAndTopic.includes("vận dụng cao") ||
    normGrade === "Lớp 8" ||
    normGrade === "Lớp 9" ||
    content.length >= 2800
  ) {
    return {
      level: "Khó",
      shortLabel: "Nâng cao",
      className: "bg-rose-50 text-rose-700 border-rose-200"
    };
  }

  if (
    titleAndTopic.includes("phân biệt") ||
    titleAndTopic.includes("vận dụng") ||
    titleAndTopic.includes("so sánh") ||
    normGrade === "Lớp 7" ||
    content.length >= 1650
  ) {
    return {
      level: "Trung bình",
      shortLabel: "Trung bình",
      className: "bg-amber-50 text-amber-700 border-amber-200"
    };
  }

  return {
    level: "Dễ",
    shortLabel: "Cơ bản",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200"
  };
}

/**
 * Phân loại Loại nội dung chính của bài học (Lý thuyết / Bài tập / Tóm tắt)
 */
export function detectLessonContentType(lesson: Lesson): {
  type: LessonContentType;
  icon: string;
  className: string;
} {
  const titleAndTopic = `${lesson.title || ""} ${lesson.topic || ""}`.toLowerCase();
  const content = (lesson.content || "").toLowerCase();

  // 1. Tóm tắt & Công thức
  if (
    titleAndTopic.includes("tóm tắt") ||
    titleAndTopic.includes("hằng đẳng thức") ||
    titleAndTopic.includes("công thức") ||
    titleAndTopic.includes("phân biệt") ||
    titleAndTopic.includes("so sánh") ||
    titleAndTopic.includes("sơ đồ") ||
    content.includes("bảng hệ thống công thức") ||
    content.includes("bảng so sánh chi tiết")
  ) {
    return {
      type: "Tóm tắt",
      icon: "⚡",
      className: "bg-purple-50 text-purple-800 border-purple-200"
    };
  }

  // 2. Bài tập & Vận dụng
  if (
    titleAndTopic.includes("bài tập") ||
    titleAndTopic.includes("luyện tập") ||
    titleAndTopic.includes("thử thách") ||
    titleAndTopic.includes("chinh phục") ||
    titleAndTopic.includes("vận dụng") ||
    titleAndTopic.includes("ôn tập") ||
    content.includes("bài tập củng cố") ||
    content.includes("thử thách siêu tốc")
  ) {
    return {
      type: "Bài tập",
      icon: "✍️",
      className: "bg-indigo-50 text-indigo-800 border-indigo-200"
    };
  }

  // 3. Lý thuyết trọng tâm
  return {
    type: "Lý thuyết",
    icon: "📖",
    className: "bg-sky-50 text-sky-800 border-sky-200"
  };
}

/**
 * Renders subject icon cleanly without broken Windows flag glyphs ("GB")
 */
export function renderSubjectBadgeIcon(sub: { id: string; icon: string }): string {
  if (sub.id === "english" || sub.icon === "🇬🇧") return "EN";
  if (sub.id === "all") return "ALL";
  if (sub.id === "math") return "∑";
  if (sub.id === "literature") return "VĂN";
  if (sub.id === "science") return "KHTN";
  if (sub.id === "social") return "SỬ";
  if (sub.id === "informatics") return "TIN";
  if (sub.id === "civic") return "GDCD";
  return "•";
}

interface LessonLibraryFilterBarProps {
  lessons: Lesson[];
  selectedSubject: string;
  onSelectSubject: (subId: string) => void;
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
  statusFilter: "all" | "completed" | "incomplete" | "pinned";
  onSelectStatus: (status: "all" | "completed" | "incomplete" | "pinned") => void;
  difficultyFilter: "all" | LessonDifficultyLevel;
  onSelectDifficulty: (diff: "all" | LessonDifficultyLevel) => void;
  contentTypeFilter: "all" | LessonContentType;
  onSelectContentType: (type: "all" | LessonContentType) => void;
  userGrade?: string;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export default function LessonLibraryFilterBar({
  lessons,
  selectedSubject,
  onSelectSubject,
  selectedGrade,
  onSelectGrade,
  statusFilter,
  onSelectStatus,
  difficultyFilter,
  onSelectDifficulty,
  contentTypeFilter,
  onSelectContentType,
  userGrade,
  onResetFilters,
  filteredCount,
  totalCount
}: LessonLibraryFilterBarProps) {
  // Calculate counts for each subject
  const subjectCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: lessons.length };
    SUBJECT_DEFINITIONS.forEach((s) => {
      if (s.id !== "all") counts[s.id] = 0;
    });

    lessons.forEach((l) => {
      const subId = detectLessonSubject(l);
      counts[subId] = (counts[subId] || 0) + 1;
    });
    return counts;
  }, [lessons]);

  // Calculate counts for each grade
  const gradeCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: lessons.length };
    GRADE_OPTIONS.forEach((g) => {
      if (g.id !== "all") counts[g.id] = 0;
    });

    lessons.forEach((l) => {
      const gNorm = normalizeLessonGrade(l.grade);
      counts[gNorm] = (counts[gNorm] || 0) + 1;
    });
    return counts;
  }, [lessons]);

  // Calculate counts for each difficulty level
  const difficultyCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: lessons.length,
      "Dễ": 0,
      "Trung bình": 0,
      "Khó": 0
    };
    lessons.forEach((l) => {
      const diff = detectLessonDifficulty(l).level;
      counts[diff] = (counts[diff] || 0) + 1;
    });
    return counts;
  }, [lessons]);

  // Calculate counts for each content type
  const contentTypeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: lessons.length,
      "Lý thuyết": 0,
      "Bài tập": 0,
      "Tóm tắt": 0
    };
    lessons.forEach((l) => {
      const cType = detectLessonContentType(l).type;
      counts[cType] = (counts[cType] || 0) + 1;
    });
    return counts;
  }, [lessons]);

  // Active filters count
  const activeFiltersCount = 
    (selectedSubject !== "all" ? 1 : 0) +
    (selectedGrade !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (difficultyFilter !== "all" ? 1 : 0) +
    (contentTypeFilter !== "all" ? 1 : 0);

  const bookmarkedCount = React.useMemo(
    () => lessons.filter((l) => Boolean(l.pinned)).length,
    [lessons]
  );

  const activeSubjectItem = SUBJECT_DEFINITIONS.find((s) => s.id === selectedSubject);
  const activeGradeItem = GRADE_OPTIONS.find((g) => g.id === selectedGrade);
  const activeDifficultyItem = DIFFICULTY_OPTIONS.find((d) => d.id === difficultyFilter);
  const activeContentTypeItem = CONTENT_TYPE_OPTIONS.find((c) => c.id === contentTypeFilter);

  const [isMobileFilterSheetOpen, setIsMobileFilterSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMobileFilterSheetOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let pushedState = false;
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      window.history.pushState({ mobileSheet: "library-filter" }, "");
      pushedState = true;
    }

    const handlePopState = () => {
      setIsMobileFilterSheetOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("popstate", handlePopState);
      if (pushedState && window.history.state?.mobileSheet === "library-filter") {
        window.history.back();
      }
    };
  }, [isMobileFilterSheetOpen]);

  return (
    <>
      {/* MOBILE COMPACT FILTER BAR (<= 768px): 1 horizontal scroll-snap row + "Bộ lọc" Bottom Sheet trigger (R7) */}
      <div className="md:hidden bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileFilterSheetOpen(true)}
            aria-label="Mở bảng Bộ lọc bài học"
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 cursor-pointer border transition-colors ${
              activeFiltersCount > 0
                ? "bg-[#243c6e] text-white border-[#243c6e]"
                : "bg-slate-100 text-slate-800 border-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>Bộ lọc</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white text-[#243c6e] text-xs font-mono font-black tabular-nums">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Single horizontal scroll-snap row of subject chips */}
          <div className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar py-0.5">
            {SUBJECT_DEFINITIONS.map((sub) => {
              const count = subjectCounts[sub.id] || 0;
              if (sub.id !== "all" && count === 0 && selectedSubject !== sub.id) {
                return null;
              }
              const isSelected = selectedSubject === sub.id;
              return (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() => onSelectSubject(sub.id)}
                  className={`snap-start min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold shrink-0 cursor-pointer border transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 text-slate-800 border-slate-200"
                  }`}
                >
                  <span>{sub.shortName}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-mono font-bold tabular-nums ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact result summary & quick reset */}
        <div className="flex items-center justify-between gap-2 text-sm text-slate-600 px-0.5">
          <div>
            Hiển thị <span className="font-mono font-bold text-slate-900">{filteredCount}</span>/{totalCount} bài học
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-sm font-bold text-rose-600 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg active:bg-rose-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET FOR FULL FILTERS (<= 768px) */}
      {/* Portaled to <body> so the bottom tab bar can never cover the sheet (R4) */}
      {isMobileFilterSheetOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[120] flex items-end md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70"
            onClick={() => setIsMobileFilterSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Bộ lọc bài học"
            className="relative z-10 w-full max-h-[85dvh] bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl flex flex-col overflow-hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <h3 className="font-display font-black text-base text-slate-900">
                  Bộ lọc Thư viện bài học
                </h3>
                <p className="text-sm text-slate-600">
                  Đang khớp {filteredCount} / {totalCount} bài học
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterSheetOpen(false)}
                aria-label="Đóng bộ lọc"
                className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Single scroll region inside bottom sheet */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Khối lớp */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Khối lớp</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {GRADE_OPTIONS.map((grade) => {
                    const count = gradeCounts[grade.id] || 0;
                    const isSelected = selectedGrade === grade.id;
                    return (
                      <button
                        type="button"
                        key={grade.id}
                        onClick={() => onSelectGrade(grade.id)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold border cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-800 border-slate-200"
                        }`}
                      >
                        {grade.label.replace("Khối ", "")} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mức độ & Độ khó */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>Mức độ và Độ khó</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map((diff) => {
                    const isSelected = difficultyFilter === diff.id;
                    const count = difficultyCounts[diff.id] ?? 0;
                    return (
                      <button
                        type="button"
                        key={diff.id}
                        onClick={() => onSelectDifficulty(diff.id)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold border cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? diff.activeClass
                            : "bg-slate-50 text-slate-800 border-slate-200"
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? "bg-white" : diff.dotColor}`} />
                        <span>{diff.shortLabel} ({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loại nội dung */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Loại nội dung tài liệu</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPE_OPTIONS.map((item) => {
                    const isSelected = contentTypeFilter === item.id;
                    const count = contentTypeCounts[item.id] ?? 0;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => onSelectContentType(item.id)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold border cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? item.activeClass
                            : "bg-slate-50 text-slate-800 border-slate-200"
                        }`}
                      >
                        <span>{item.shortLabel} ({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trạng thái học */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-900">Trạng thái học tập</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectStatus("all")}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold border cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-800 border-slate-200"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectStatus("completed")}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold border cursor-pointer flex items-center justify-center gap-1.5 ${
                      statusFilter === "completed"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-800 border-slate-200"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã học</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectStatus("incomplete")}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold border cursor-pointer flex items-center justify-center gap-1.5 ${
                      statusFilter === "incomplete"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-slate-50 text-slate-800 border-slate-200"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Chưa học</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectStatus("pinned")}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold border cursor-pointer flex items-center justify-center gap-1.5 ${
                      statusFilter === "pinned"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-800 border-slate-200"
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Đã ghim ({bookmarkedCount})</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onResetFilters}
                className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-sm cursor-pointer"
              >
                Đặt lại
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterSheetOpen(false)}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#2e5cb8] text-white font-black text-base cursor-pointer"
              >
                Xem {filteredCount} bài học
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DESKTOP FILTER BAR (> 768px): 100% UNCHANGED */}
      <div className="hidden md:block bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
      
      {/* ROW 1: MÔN HỌC (SUBJECT PILLS FILTER) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Lọc theo môn học</span>
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono tabular-nums">
              {SUBJECT_DEFINITIONS.filter(s => s.id === "all" || (subjectCounts[s.id] || 0) > 0).length - 1} môn
            </span>
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-blue-50"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Scrollable Subject Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {SUBJECT_DEFINITIONS.map((sub) => {
            const count = subjectCounts[sub.id] || 0;
            if (sub.id !== "all" && count === 0 && selectedSubject !== sub.id) {
              return null;
            }

            const isSelected = selectedSubject === sub.id;

            return (
              <button
                type="button"
                key={sub.id}
                onClick={() => onSelectSubject(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/90"
                }`}
              >
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isSelected ? "bg-white/20 text-white" : "bg-white text-slate-600 border border-slate-200/80"
                }`}>
                  {renderSubjectBadgeIcon(sub)}
                </span>
                <span>{sub.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-md font-mono font-bold tabular-nums ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ROW 2: BỘ LỌC NÂNG CAO — LOẠI NỘI DUNG (LÝ THUYẾT / BÀI TẬP / TÓM TẮT) & ĐỘ KHÓ (CƠ BẢN / TRUNG BÌNH / NÂNG CAO) */}
      <div className="pt-3.5 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Cột 1: Loại nội dung */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Loại nội dung tài liệu</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              Tìm nhanh theo mục đích ôn tập
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo loại nội dung">
            {CONTENT_TYPE_OPTIONS.map((item) => {
              const isSelected = contentTypeFilter === item.id;
              const count = contentTypeCounts[item.id] ?? 0;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onSelectContentType(item.id)}
                  title={item.description}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? item.activeClass
                      : "bg-white hover:bg-slate-100/90 text-slate-700 border-slate-200/90"
                  }`}
                >
                  <span className="text-xs leading-none">{item.icon}</span>
                  <span>{item.shortLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold tabular-nums ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cột 2: Độ khó bài học */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Mức độ và Độ khó</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              Từ nền tảng đến nâng cao
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo độ khó bài học">
            {DIFFICULTY_OPTIONS.map((diff) => {
              const isSelected = difficultyFilter === diff.id;
              const count = difficultyCounts[diff.id] ?? 0;

              return (
                <button
                  type="button"
                  key={diff.id}
                  onClick={() => onSelectDifficulty(diff.id)}
                  title={diff.description}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? diff.activeClass
                      : "bg-white hover:bg-slate-100/90 text-slate-700 border-slate-200/90"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSelected ? "bg-white" : diff.dotColor
                    }`}
                  />
                  <span>{diff.shortLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold tabular-nums ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 3: KHỐI LỚP (GRADE FILTER) + TRẠNG THÁI HỌC */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        
        {/* Khối lớp filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Khối lớp:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {GRADE_OPTIONS.map((grade) => {
              const count = gradeCounts[grade.id] || 0;
              const isSelected = selectedGrade === grade.id;
              const isUserGrade = userGrade && normalizeLessonGrade(userGrade) === grade.id;

              return (
                <button
                  type="button"
                  key={grade.id}
                  onClick={() => onSelectGrade(grade.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900"
                      : isUserGrade
                      ? "bg-blue-50 text-blue-800 border-blue-200 font-bold"
                      : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  <span>{grade.label.replace("Khối ", "")}</span>
                  {grade.id !== "all" && (
                    <span className={`ml-1 text-[10px] font-mono tabular-nums ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                      ({count})
                    </span>
                  )}
                  {isUserGrade && !isSelected && (
                    <span className="ml-1 text-[9px] px-1 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">
                      Em
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trạng thái học */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => onSelectStatus("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => onSelectStatus("completed")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === "completed" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Đã học</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectStatus("incomplete")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === "incomplete" ? "bg-amber-600 text-white shadow-2xs" : "text-slate-600 hover:text-amber-700"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Chưa học</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectStatus("pinned")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === "pinned" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:text-blue-700"
              }`}
              title="Lọc nhanh các bài học đã đánh dấu Bookmark"
            >
              <Bookmark className={`w-3 h-3 ${statusFilter === "pinned" ? "fill-white" : "fill-amber-400 text-amber-600"}`} />
              <span>Đã ghim</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold tabular-nums ${
                  statusFilter === "pinned" ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {bookmarkedCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ROW 4: ACTIVE FILTER TAGS & RESULT SUMMARY */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-slate-500">
        <div className="flex flex-wrap items-center gap-1.5">
          <span>Đang hiển thị</span>
          <span className="font-mono font-bold text-slate-900 tabular-nums">{filteredCount}</span>
          <span>/ {totalCount} bài học</span>

          {/* Active chips tags */}
          {selectedSubject !== "all" && activeSubjectItem && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px] ml-1">
              <span>{activeSubjectItem.name}</span>
              <button 
                type="button"
                onClick={() => onSelectSubject("all")}
                className="hover:text-rose-600 p-0.5 cursor-pointer"
                title="Bỏ lọc môn"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {contentTypeFilter !== "all" && activeContentTypeItem && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 font-semibold text-[11px]">
              <span>{activeContentTypeItem.icon} Loại: {activeContentTypeItem.shortLabel}</span>
              <button 
                type="button"
                onClick={() => onSelectContentType("all")}
                className="hover:text-rose-600 p-0.5 cursor-pointer"
                title="Bỏ lọc loại nội dung"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {difficultyFilter !== "all" && activeDifficultyItem && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200 font-semibold text-[11px]">
              <span>Độ khó: {activeDifficultyItem.shortLabel}</span>
              <button 
                type="button"
                onClick={() => onSelectDifficulty("all")}
                className="hover:text-rose-600 p-0.5 cursor-pointer"
                title="Bỏ lọc độ khó"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedGrade !== "all" && activeGradeItem && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-[11px]">
              <span>{activeGradeItem.label}</span>
              <button 
                type="button"
                onClick={() => onSelectGrade("all")}
                className="hover:text-rose-600 p-0.5 cursor-pointer"
                title="Bỏ lọc khối lớp"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-[11px]">
              <span>
                {statusFilter === "completed" ? "Đã học" : statusFilter === "incomplete" ? "Chưa học" : "Đã ghim"}
              </span>
              <button 
                type="button"
                onClick={() => onSelectStatus("all")}
                className="hover:text-rose-600 p-0.5 cursor-pointer"
                title="Bỏ lọc trạng thái"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Clear all link if filtered */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
          >
            Xóa hết bộ lọc
          </button>
        )}
      </div>
      </div>
    </>
  );
}

