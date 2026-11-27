import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Check, 
  X, 
  HelpCircle, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  CheckCircle2,
  Lock,
  Clock,
  Trash2,
  RotateCw,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Award
} from "lucide-react";
import { Lesson, UserProgress, Flashcard } from "../types";
import { 
  scheduleFSRSReview, 
  RecallRating, 
  getDueFlashcards 
} from "../lib/spacedRepetition";

// Static flashcard seeds for default sample lessons to guarantee reliable initial states offline
const SEED_FLASHCARDS: Omit<Flashcard, "id">[] = [
  {
    lessonId: "sample-1",
    lessonTitle: "Khám phá bí mật vũ trụ số tự nhiên",
    front: "Tập hợp N",
    back: "Là tập hợp các số tự nhiên từ 0 đến vô cùng: {0, 1, 2, 3, 4, ...}. Bắt đầu từ số 0.",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-1",
    lessonTitle: "Khám phá bí mật vũ trụ số tự nhiên",
    front: "Tập hợp N*",
    back: "Là tập hợp các số tự nhiên khác 0: {1, 2, 3, 4, 5, ...}. Không bao gồm số 0.",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-1",
    lessonTitle: "Khám phá bí mật vũ trụ số tự nhiên",
    front: "Quy luật Tia số",
    back: "Biểu diễn số tự nhiên tăng dần từ trái sang phải. Điểm nằm bên trái luôn nhỏ hơn điểm nằm bên phải.",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-2",
    lessonTitle: "Cuộc du ngoạn kỳ thú của giọt nước",
    front: "Bay hơi (Evaporation)",
    back: "Quá trình nước lỏng hấp thụ nhiệt lượng từ Mặt Trời rồi chuyển sang thể khí bay lên không trung.",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-2",
    lessonTitle: "Cuộc du ngoạn kỳ thú của giọt nước",
    front: "Thoát hơi nước (Transpiration)",
    back: "Quá trình cây xanh giải phóng hơi nước qua các lỗ khí (khí khổng) ở lá lên bầu khí quyển.",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-2",
    lessonTitle: "Cuộc du ngoạn kỳ thú của giọt nước",
    front: "Ngưng tụ (Condensation)",
    back: "Hơi nước lên cao gặp lạnh, chuyển từ thể khí sang những hạt nước lỏng li ti tạo thành mây.",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  }
];

interface FlashcardsProps {
  lessons: Lesson[];
  progress: UserProgress;
  onUpdateProgress: (updates: Partial<UserProgress>) => void;
  onTriggerPush?: (title: string, body: string, tab?: string, actionText?: string) => void;
  isOnline?: boolean;
}

export default function Flashcards({ 
  lessons, 
  progress, 
  onUpdateProgress, 
  onTriggerPush,
  isOnline = true
}: FlashcardsProps) {
  // Core state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [generating, setGenerating] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Custom Flashcard creation form state
  const [customFront, setCustomFront] = useState<string>("");
  const [customBack, setCustomBack] = useState<string>("");
  const [customLessonId, setCustomLessonId] = useState<string>("");

  // Load and sync flashcards with LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("smart_study_flashcards");
    if (saved) {
      try {
        setFlashcards(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing flashcards:", e);
        initializeSeedCards();
      }
    } else {
      initializeSeedCards();
    }
  }, []);

  const initializeSeedCards = () => {
    const seeded: Flashcard[] = SEED_FLASHCARDS.map((card, idx) => ({
      ...card,
      id: `seeded-${idx}-${Date.now()}`
    }));
    setFlashcards(seeded);
    localStorage.setItem("smart_study_flashcards", JSON.stringify(seeded));
  };

  const saveFlashcards = (updated: Flashcard[]) => {
    setFlashcards(updated);
    localStorage.setItem("smart_study_flashcards", JSON.stringify(updated));
  };

  // Extract / Generate Flashcards with AI
  const handleAISyncLessonFlashcards = async (lesson: Lesson) => {
    if (generating) return;
    setGenerating(true);

    try {
      if (isOnline) {
        const response = await fetch("/api/generate-flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lesson.title,
            content: lesson.content
          })
        });
        const data = await response.json();
        if (response.ok && data.success && data.flashcards) {
          const newCards: Flashcard[] = data.flashcards.map((c: any, idx: number) => ({
            id: `ai-${lesson.id}-${idx}-${Date.now()}`,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            front: c.front,
            back: c.back,
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: new Date().toISOString(),
            status: "new"
          }));

          const filtered = flashcards.filter(c => c.lessonId !== lesson.id);
          const updated = [...newCards, ...filtered];
          saveFlashcards(updated);
          
          onUpdateProgress({
            points: progress.points + 25,
            coins: (progress.coins || 0) + 5
          });

          if (onTriggerPush) {
            onTriggerPush(
              "Đã trích xuất thẻ ghi nhớ mới",
              `Đã tạo thành công ${newCards.length} thẻ ghi nhớ từ bài học "${lesson.title}". Nhận +25 XP và +5 Xu!`,
              "flashcards"
            );
          }
          return;
        }
      }

      // Offline / No Key Fallback - Smart client-side regex rule extractor
      const extracted: Flashcard[] = [];
      const lines = lesson.content.split("\n");
      let extractedCount = 0;
      
      lines.forEach((line) => {
        const match = line.match(/^\*\s+\*\*([^*]+)\*\*:\s+(.+)$/);
        if (match && match[1] && match[2] && extractedCount < 5) {
          extracted.push({
            id: `local-ext-${lesson.id}-${extractedCount}-${Date.now()}`,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            front: match[1].trim(),
            back: match[2].trim(),
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: new Date().toISOString(),
            status: "new"
          });
          extractedCount++;
        }
      });

      if (extracted.length === 0) {
        extracted.push({
          id: `local-gen-1-${lesson.id}-${Date.now()}`,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          front: `Khái niệm chủ chốt của "${lesson.topic || "Bài Học"}"`,
          back: `Em hãy đọc kỹ các chương kiến thức cốt lõi và ví dụ thực tế trong sách để ghi nhớ nội dung này.`,
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
          nextReviewDate: new Date().toISOString(),
          status: "new"
        });
        extracted.push({
          id: `local-gen-2-${lesson.id}-${Date.now()}`,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          front: `Ý nghĩa ứng dụng của "${lesson.title}"`,
          back: `Ghi chú cá nhân của em: "${lesson.notes || "Hãy viết ghi chú để khắc sâu hơn!"}"`,
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
          nextReviewDate: new Date().toISOString(),
          status: "new"
        });
      }

      const filtered = flashcards.filter(c => c.lessonId !== lesson.id);
      const updated = [...extracted, ...filtered];
      saveFlashcards(updated);

      onUpdateProgress({
        points: progress.points + 15,
        coins: (progress.coins || 0) + 2
      });

      if (onTriggerPush) {
        onTriggerPush(
          "Đã trích xuất thẻ ngoại tuyến",
          `Đã tạo thành công ${extracted.length} thẻ ghi nhớ từ bài học đã lưu. Nhận +15 XP!`,
          "flashcards"
        );
      }
    } catch (err) {
      console.error("Flashcards sync error:", err);
    } finally {
      setGenerating(false);
    }
  };

  // Add a brand new Custom Flashcard
  const handleAddCustomFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFront || !customBack) return;

    const matchedLesson = lessons.find(l => l.id === customLessonId) || lessons[0];
    const newCard: Flashcard = {
      id: `custom-${Date.now()}`,
      lessonId: customLessonId || "general",
      lessonTitle: matchedLesson ? matchedLesson.title : "Kiến thức chung",
      front: customFront,
      back: customBack,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: new Date().toISOString(),
      status: "new"
    };

    const updated = [newCard, ...flashcards];
    saveFlashcards(updated);

    onUpdateProgress({
      points: progress.points + 10,
      coins: (progress.coins || 0) + 1
    });

    setCustomFront("");
    setCustomBack("");
    setShowForm(false);

    if (onTriggerPush) {
      onTriggerPush(
        "Đã tạo thẻ ghi nhớ mới",
        "Thẻ của em đã được thêm vào danh sách ôn tập hôm nay.",
        "flashcards"
      );
    }
  };

  // Delete a flashcard
  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = flashcards.filter(c => c.id !== id);
    saveFlashcards(updated);
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1);
    }
  };

  // FSRS / SM-2 Spaced Repetition Algorithm
  const handleGradeCard = (grade: RecallRating) => {
    if (activeCards.length === 0) return;
    const currentCard = activeCards[currentIndex];

    const result = scheduleFSRSReview(currentCard, grade);

    const updatedCard: Flashcard = {
      ...currentCard,
      interval: result.interval,
      easeFactor: result.easeFactor,
      repetitions: result.repetitions,
      nextReviewDate: result.nextReviewDate,
      status: result.status,
      stability: result.stability
    } as Flashcard;

    const updatedList = flashcards.map(c => c.id === currentCard.id ? updatedCard : c);
    saveFlashcards(updatedList);

    // Gamified Rewards based on cognitive recall quality
    onUpdateProgress({
      points: progress.points + result.xpEarned,
      coins: (progress.coins || 0) + result.coinsEarned
    });

    // Reset card flipped state
    setIsFlipped(false);

    // Transition to next card or stay
    setTimeout(() => {
      if (currentIndex < activeCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 200);
  };

  // Filter cards by selected lesson and determine which cards are active
  const filteredCards = selectedLessonId === "all" 
    ? flashcards 
    : flashcards.filter(c => c.lessonId === selectedLessonId);

  // Algorithmic FSRS Due Queue
  const dueCards = getDueFlashcards(filteredCards);
  const activeCards = dueCards.length > 0 ? dueCards : filteredCards;

  // Finished lessons helper for select dropdowns
  const completedLessons = lessons.filter(l => l.completed);

  // Clean lesson title helper (removes leading decorative emojis if present in cached data)
  const cleanTitle = (raw: string) => raw.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*/u, "");

  return (
    <div data-quick-lookup className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* 1. Clean Academic Header & Memory Progress Summary */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-xl md:text-2xl text-slate-900 tracking-tight">
              Thẻ ghi nhớ Flashcard
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Ôn tập khái niệm, công thức và từ vựng theo lịch nhắc nhở thông minh để nhớ lâu trước kỳ kiểm tra.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-2xs hover:scale-103 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tự tạo thẻ mới</span>
          </button>
        </div>

        {/* Memory Mastery Stages (Student-friendly labels instead of technical Leitner Box numbers) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-600 block">Mới và Đang làm quen</span>
              <span className="font-mono font-bold text-xl text-slate-900 block mt-0.5 tabular-nums">
                {flashcards.filter(c => c.status === "new" || c.status === "learning").length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-600 block">Đang củng cố</span>
              <span className="font-mono font-bold text-xl text-slate-900 block mt-0.5 tabular-nums">
                {flashcards.filter(c => c.status === "reviewing").length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-600 block">Đã thuộc lòng</span>
              <span className="font-mono font-bold text-xl text-emerald-700 block mt-0.5 tabular-nums">
                {flashcards.filter(c => c.status === "mastered").length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-blue-50/70 rounded-xl p-3.5 border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-800 block">Cần ôn hôm nay</span>
              <span className="font-mono font-bold text-xl text-blue-700 block mt-0.5 animate-pulse tabular-nums">
                {dueCards.length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter & Lesson Extraction Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <label htmlFor="flashcard-topic-filter" className="text-xs font-semibold text-slate-600 shrink-0">
              Bộ thẻ bài học:
            </label>
            <select
              id="flashcard-topic-filter"
              value={selectedLessonId}
              onChange={(e) => {
                setSelectedLessonId(e.target.value);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="w-full md:w-72 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              <option value="all">Tất cả thẻ ghi nhớ ({flashcards.length})</option>
              {lessons.map(l => (
                <option key={l.id} value={l.id}>{cleanTitle(l.title)}</option>
              ))}
            </select>
          </div>

          {/* Automated Lesson Extraction */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
            <span className="text-xs text-slate-500 font-medium">Tạo nhanh từ bài đã học:</span>
            {completedLessons.length === 0 ? (
              <span className="text-xs text-amber-800 font-medium bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Hoàn thành 1 bài học để trích xuất thẻ tự động</span>
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {completedLessons.slice(0, 3).map(lesson => {
                  const hasCards = flashcards.some(c => c.lessonId === lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => handleAISyncLessonFlashcards(lesson)}
                      disabled={generating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        hasCards 
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200" 
                          : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 animate-pulse"
                      }`}
                    >
                      {hasCards ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                      <span>{cleanTitle(lesson.title).slice(0, 18)}… ({hasCards ? "Cập nhật" : "Trích xuất"})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Collapsible Manual Creation Form */}
      {showForm && (
        <form onSubmit={handleAddCustomFlashcard} className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-4 animate-slide-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Tạo thẻ ghi nhớ mới</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Đóng biểu mẫu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="custom-card-front" className="text-xs font-semibold text-slate-700 block">
                Mặt trước (Từ khóa / Công thức / Câu hỏi)
              </label>
              <input 
                id="custom-card-front"
                type="text" 
                value={customFront}
                onChange={(e) => setCustomFront(e.target.value)}
                placeholder="Ví dụ: Tập hợp N* là gì?" 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="custom-card-back" className="text-xs font-semibold text-slate-700 block">
                Mặt sau (Định nghĩa / Đáp án giải thích)
              </label>
              <input 
                id="custom-card-back"
                type="text" 
                value={customBack}
                onChange={(e) => setCustomBack(e.target.value)}
                placeholder="Ví dụ: Là tập hợp các số tự nhiên khác 0: {1, 2, 3, ...}" 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <label htmlFor="custom-card-lesson" className="text-xs font-semibold text-slate-700 block">
                Gắn với bài học
              </label>
              <select
                id="custom-card-lesson"
                value={customLessonId}
                onChange={(e) => setCustomLessonId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Kiến thức tổng hợp --</option>
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>{cleanTitle(l.title)}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Lưu thẻ ghi nhớ
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. Main 3D Flashcard Study Stage */}
      {activeCards.length > 0 ? (
        <div className="space-y-5 max-w-2xl mx-auto">
          {/* Card Counter & Source Lesson Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Thẻ đang học:</span>
              <strong className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                {currentIndex + 1} / {activeCards.length}
              </strong>
              {dueCards.length > 0 && (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Đến hạn ôn tập</span>
                </span>
              )}
            </div>
            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs text-slate-600 truncate max-w-xs">
              Bài học: <strong className="text-slate-900 font-semibold">{cleanTitle(activeCards[currentIndex].lessonTitle)}</strong>
            </span>
          </div>

          {/* 3D Flip Card Stage */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="group h-84 md:h-92 w-full cursor-pointer perspective-1000"
          >
            <div className={`relative h-full w-full rounded-2xl transition-all duration-500 transform style-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}>
              
              {/* Card FRONT Side */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-white border border-slate-200/90 shadow-xs p-6 md:p-8 flex flex-col justify-between backface-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Mặt trước · Khái niệm / Câu hỏi</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                    activeCards[currentIndex].status === "mastered"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}>
                    {activeCards[currentIndex].status === "mastered" ? (
                      <>
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã thuộc lòng</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        <span>Đang ghi nhớ</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="text-center py-6 px-2 my-auto">
                  <h3 className="font-display font-bold text-2xl md:text-3xl text-slate-900 tracking-tight leading-snug">
                    {activeCards[currentIndex].front}
                  </h3>
                  <p className="text-xs text-blue-600 mt-5 font-semibold inline-flex items-center gap-1.5 bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Chạm vào thẻ để lật xem đáp án</span>
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3.5">
                  <span className="font-mono tabular-nums">
                    Lần ôn: {activeCards[currentIndex].repetitions || 1} · Chu kỳ: {Math.ceil(activeCards[currentIndex].interval)} ngày
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCard(activeCards[currentIndex].id, e)}
                    className="text-slate-400 hover:text-rose-600 transition-all px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa thẻ</span>
                  </button>
                </div>
              </div>

              {/* Card BACK Side */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 flex flex-col justify-between rotate-y-180 backface-hidden shadow-md text-white">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-300">Mặt sau · Đáp án và Giải thích</span>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-200 font-semibold px-2.5 py-1 rounded-md border border-slate-700">
                    SmartStudy
                  </span>
                </div>

                <div className="text-center py-4 px-2 my-auto space-y-2.5">
                  <span className="text-xs font-semibold text-blue-300 block">Nội dung cần nhớ:</span>
                  <p className="font-sans font-medium text-base md:text-lg leading-relaxed text-white max-w-lg mx-auto">
                    {activeCards[currentIndex].back}
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-3.5 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[60%]">{cleanTitle(activeCards[currentIndex].lessonTitle)}</span>
                  <span className="font-semibold text-blue-300 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Chạm để lật lại mặt trước</span>
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 4. Spaced Repetition Self-Grading Controls */}
          <div className="space-y-3">
            {isFlipped ? (
              <div className="space-y-2.5 text-center animate-fade-in">
                <span className="text-xs font-semibold text-slate-600 block">
                  Em nhớ kiến thức này ở mức nào? Chọn để hệ thống xếp lịch ôn tiếp theo:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {/* Hard Option */}
                  <button
                    type="button"
                    onClick={() => handleGradeCard("hard")}
                    className="p-3.5 bg-white hover:bg-rose-50/70 border border-rose-200 rounded-xl text-center transition-all cursor-pointer group active:scale-[0.98] shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-all">
                      <X className="w-4 h-4" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-slate-900 block">Chưa nhớ rõ</span>
                    <span className="text-xs text-rose-700 font-medium block mt-0.5">Ôn lại ngày mai (+2 XP)</span>
                  </button>

                  {/* Good Option */}
                  <button
                    type="button"
                    onClick={() => handleGradeCard("good")}
                    className="p-3.5 bg-white hover:bg-amber-50/70 border border-amber-200 rounded-xl text-center transition-all cursor-pointer group active:scale-[0.98] shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-all">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-slate-900 block">Nhớ vừa phải</span>
                    <span className="text-xs text-amber-700 font-medium block mt-0.5">Ôn sau vài ngày (+5 XP)</span>
                  </button>

                  {/* Easy Option */}
                  <button
                    type="button"
                    onClick={() => handleGradeCard("easy")}
                    className="p-3.5 bg-white hover:bg-emerald-50/70 border border-emerald-200 rounded-xl text-center transition-all cursor-pointer group active:scale-[0.98] shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-all">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-slate-900 block">Nhớ rất kỹ</span>
                    <span className="text-xs text-emerald-700 font-medium block mt-0.5">Giãn cách xa (+8 XP)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl text-center text-xs font-medium text-slate-600 flex items-center justify-center gap-2 shadow-2xs">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Hãy tự nhẩm câu trả lời trong đầu rồi chạm vào thẻ để kiểm tra đáp án.</span>
              </div>
            )}
          </div>

          {/* 5. Previous / Next Card Navigation */}
          <div className="flex items-center justify-between px-1 pt-2 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setIsFlipped(false);
                setTimeout(() => {
                  setCurrentIndex(prev => prev > 0 ? prev - 1 : activeCards.length - 1);
                }, 100);
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Thẻ trước</span>
            </button>
            
            <span className="text-xs text-slate-500 font-medium">
              Ôn tập ngắt quãng theo trí nhớ
            </span>

            <button
              type="button"
              onClick={() => {
                setIsFlipped(false);
                setTimeout(() => {
                  setCurrentIndex(prev => prev < activeCards.length - 1 ? prev + 1 : 0);
                }, 100);
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Thẻ tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-2xs text-center space-y-3 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-base">Chưa có thẻ ghi nhớ cho bài học này</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Em hãy bấm nút <strong>Trích xuất</strong> ở thanh công cụ phía trên để tạo thẻ tự động từ bài học, hoặc bấm <strong>Tự tạo thẻ mới</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
