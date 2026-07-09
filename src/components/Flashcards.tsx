import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Check, 
  X, 
  HelpCircle, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  TrendingUp, 
  GraduationCap, 
  Plus, 
  Search,
  CheckCircle2,
  Lock,
  WifiOff,
  Coins
} from "lucide-react";
import { Lesson, UserProgress, Flashcard } from "../types";

// Static premium flashcard seeds for default sample lessons to guarantee beautiful initial states offline
const SEED_FLASHCARDS: Omit<Flashcard, "id">[] = [
  {
    lessonId: "sample-1",
    lessonTitle: "🌌 Khám Phá Bí Mật Vũ Trụ Số Tự Nhiên",
    front: "Tập hợp N",
    back: "Là tập hợp các số tự nhiên từ 0 đến vô cùng: {0, 1, 2, 3, 4, ...}. Bắt đầu từ số 0 tròn trĩnh!",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-1",
    lessonTitle: "🌌 Khám Phá Bí Mật Vũ Trụ Số Tự Nhiên",
    front: "Tập hợp N*",
    back: "Là tập hợp các số tự nhiên khác 0: {1, 2, 3, 4, 5, ...}. Không chấp nhận số 0 hư vô!",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-1",
    lessonTitle: "🌌 Khám Phá Bí Mật Vũ Trụ Số Tự Nhiên",
    front: "Quy luật Tia số",
    back: "Biểu diễn số tự nhiên tăng dần từ trái sang phải. Số nằm bên trái luôn nhỏ hơn số bên phải!",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-2",
    lessonTitle: "💧 Cuộc Du Ngoạn Kỳ Thú Của Giọt Nước",
    front: "Bay hơi (Evaporation)",
    back: "Quá trình nước lỏng hấp thụ nhiệt lượng từ Mặt Trời rồi chuyển sang thể khí vô hình bay lên không trung.",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-2",
    lessonTitle: "💧 Cuộc Du Ngoạn Kỳ Thú Của Giọt Nước",
    front: "Thoát hơi nước (Transpiration)",
    back: "Quá trình cây cối 'đổ mồ hôi', giải phóng hơi nước mát lành qua các lỗ khí ở kẽ lá lên khí quyển.",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: "new"
  },
  {
    lessonId: "sample-2",
    lessonTitle: "💧 Cuộc Du Ngoạn Kỳ Thú Của Giọt Nước",
    front: "Ngưng tụ (Condensation)",
    back: "Hơi nước lên cao gặp không khí lạnh co cụm lại, chuyển ngược từ thể khí sang hạt nước lỏng li ti tạo thành mây.",
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
      if (isOnline && process.env.GEMINI_API_KEY) {
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

          // Remove any previous automatic cards for this lesson to avoid clutter
          const filtered = flashcards.filter(c => c.lessonId !== lesson.id);
          const updated = [...newCards, ...filtered];
          saveFlashcards(updated);
          
          onUpdateProgress({
            points: progress.points + 25,
            coins: (progress.coins || 0) + 5
          });

          if (onTriggerPush) {
            onTriggerPush(
              "🤖 Trợ lý AI đã trích xuất Flashcards!",
              `Đã tạo thành công ${newCards.length} thẻ ghi nhớ Spaced Repetition từ bài học "${lesson.title}". Nhận +25 XP và +5 xu vàng!`,
              "flashcards"
            );
          }
          return;
        }
      }

      // Offline / No Key Fallback - Smart client-side regex rule extractor
      const extracted: Flashcard[] = [];
      
      // Parse markdown bold points or bullet lines starting with specific formats
      const lines = lesson.content.split("\n");
      let extractedCount = 0;
      
      lines.forEach((line) => {
        // Find lines like: *   **Key word**: Explanation
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

      // If nothing extracted, create generic core cards based on lesson sections
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
          "💾 Đã trích xuất Thẻ Ngoại Tuyến!",
          `Đã giải nén thành công ${extracted.length} thẻ ghi nhớ từ bài học đã lưu trước đó. Nhận +15 XP!`,
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
        "🗂️ Đã tạo Flashcard thành công!",
        "Hệ thống đã xếp thẻ của em vào hộp ôn tập Spaced Repetition số 1.",
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

  // Spaced Repetition Algorithm (SuperMemo-2 SM-2 inspired Leitner Engine)
  const handleGradeCard = (grade: "hard" | "good" | "easy") => {
    if (activeCards.length === 0) return;
    const currentCard = activeCards[currentIndex];

    let newInterval = currentCard.interval;
    let newEase = currentCard.easeFactor;
    let newReps = currentCard.repetitions;
    let newStatus: "new" | "learning" | "reviewing" | "mastered" = currentCard.status;

    if (grade === "hard") {
      // Forget card / Reset interval
      newReps = 0;
      newInterval = 1; // back to review tomorrow
      newEase = Math.max(1.3, currentCard.easeFactor - 0.2);
      newStatus = "learning";
    } else if (grade === "good") {
      // Retained well
      if (newReps === 0) {
        newInterval = 1;
      } else if (newReps === 1) {
        newInterval = 3;
      } else {
        newInterval = Math.ceil(currentCard.interval * currentCard.easeFactor);
      }
      newReps += 1;
      newStatus = "reviewing";
    } else {
      // Mastered / Super easy
      newEase = currentCard.easeFactor + 0.15;
      if (newReps === 0) {
        newInterval = 2;
      } else if (newReps === 1) {
        newInterval = 5;
      } else {
        newInterval = Math.ceil(currentCard.interval * currentCard.easeFactor * 1.3);
      }
      newReps += 1;
      newStatus = "mastered";
    }

    // Schedule next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    // Update state & reward
    const updatedCard: Flashcard = {
      ...currentCard,
      interval: newInterval,
      easeFactor: Number(newEase.toFixed(2)),
      repetitions: newReps,
      nextReviewDate: nextReview.toISOString(),
      status: newStatus
    };

    const updatedList = flashcards.map(c => c.id === currentCard.id ? updatedCard : c);
    saveFlashcards(updatedList);

    // Gamified Rewards
    const xpReward = grade === "easy" ? 8 : grade === "good" ? 5 : 2;
    const coinsReward = grade === "easy" ? 2 : 1;
    onUpdateProgress({
      points: progress.points + xpReward,
      coins: (progress.coins || 0) + coinsReward
    });

    // Reset card flipped state
    setIsFlipped(false);

    // Transition to next card or stay
    setTimeout(() => {
      if (currentIndex < activeCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0); // wrap around
      }
    }, 200);
  };

  // Filter cards by selected lesson and determine which cards are active
  const filteredCards = selectedLessonId === "all" 
    ? flashcards 
    : flashcards.filter(c => c.lessonId === selectedLessonId);

  // Separate due cards (for Spaced Repetition scheduling) vs general reviewing
  const todayStr = new Date().toISOString().split("T")[0];
  const dueCards = filteredCards.filter(c => {
    const cardDateStr = c.nextReviewDate.split("T")[0];
    return cardDateStr <= todayStr || c.repetitions === 0;
  });

  const activeCards = dueCards.length > 0 ? dueCards : filteredCards;

  // Finished lessons helper for select dropdowns
  const completedLessons = lessons.filter(l => l.completed);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-pink-500 via-indigo-600 to-violet-600 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full font-black tracking-widest uppercase">
                SPACED REPETITION ENGINE 🧠
              </span>
              <h2 className="font-display font-black text-2xl md:text-3xl mt-1.5">
                Thẻ Flashcard Thông Minh
              </h2>
              <p className="text-xs text-indigo-100 mt-1">
                Ứng dụng cơ chế lặp lại ngắt quãng để ghi nhớ sâu mọi thuật ngữ, từ vựng và công thức khó nhất!
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-103 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4.5 h-4.5 stroke-[3]" />
              <span>Tự tạo thẻ mới</span>
            </button>
          </div>

          {/* Gamified Leitner Boxes Indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
              <span className="text-[9px] font-black text-indigo-200 block uppercase tracking-wider">Hộp 1: Chưa Thuộc</span>
              <span className="font-display font-black text-xl block mt-0.5">
                {flashcards.filter(c => c.status === "new" || c.status === "learning").length}
              </span>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
              <span className="text-[9px] font-black text-indigo-200 block uppercase tracking-wider">Hộp 2: Đang Học</span>
              <span className="font-display font-black text-xl block mt-0.5">
                {flashcards.filter(c => c.status === "reviewing").length}
              </span>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
              <span className="text-[9px] font-black text-indigo-200 block uppercase tracking-wider">Hộp 3: Đã Thành Thạo</span>
              <span className="font-display font-black text-xl block mt-0.5">
                {flashcards.filter(c => c.status === "mastered").length}
              </span>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
              <span className="text-[9px] font-black text-indigo-200 block uppercase tracking-wider">Cần ôn hôm nay ⏱️</span>
              <span className="font-display font-black text-xl text-yellow-300 block mt-0.5 animate-pulse">
                {dueCards.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Manual creation form */}
      {showForm && (
        <form onSubmit={handleAddCustomFlashcard} className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-6 space-y-4 animate-slide-in">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="font-display font-black text-slate-800 text-sm flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>Biên Soạn Flashcard Thủ Công</span>
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Mặt trước (Từ khóa/Khái niệm)</label>
              <input 
                type="text" 
                value={customFront}
                onChange={(e) => setCustomFront(e.target.value)}
                placeholder="Ví dụ: Tập hợp N*" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Mặt sau (Định nghĩa/Giải thích)</label>
              <input 
                type="text" 
                value={customBack}
                onChange={(e) => setCustomBack(e.target.value)}
                placeholder="Ví dụ: Là tập hợp số tự nhiên bỏ đi số 0" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Liên kết giáo án học tập</label>
              <select
                value={customLessonId}
                onChange={(e) => setCustomLessonId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">-- Kiến thức tổng hợp --</option>
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Tạo Thẻ Tức Thì 💾
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Synchronizer Controls */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-4.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Selector filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider shrink-0">Chủ đề học:</span>
          <select
            value={selectedLessonId}
            onChange={(e) => {
              setSelectedLessonId(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="w-full md:w-64 px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none"
          >
            <option value="all">📚 Tất cả thẻ có sẵn ({flashcards.length})</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>

        {/* AI automated sync panel based on completed lessons */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <span className="text-[10px] text-slate-400 font-extrabold leading-tight">Đồng bộ AI bài đã học:</span>
          {completedLessons.length === 0 ? (
            <span className="text-[10px] text-amber-600 font-black bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Hãy học xong 1 bài mới mở khóa trích xuất AI!</span>
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {completedLessons.slice(0, 3).map(lesson => {
                const hasCards = flashcards.some(c => c.lessonId === lesson.id);
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleAISyncLessonFlashcards(lesson)}
                    disabled={generating}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
                      hasCards 
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100/50" 
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100 animate-pulse"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{lesson.title.slice(0, 15)}... {hasCards ? "♻️ Đồng bộ lại" : "🤖 Trích xuất"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Flashcard interactive gameplay */}
      {activeCards.length > 0 ? (
        <div className="space-y-6 max-w-xl mx-auto">
          
          {/* Card counter and status */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-450 px-2">
            <span className="flex items-center gap-1">
              <span>Đang học:</span>
              <strong className="text-slate-800">{currentIndex + 1} / {activeCards.length}</strong>
              {dueCards.length > 0 && <span className="bg-yellow-100 text-yellow-700 text-[9px] px-1.5 py-0.5 rounded ml-1 font-black uppercase">Ưu tiên ôn ⏱️</span>}
            </span>
            <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-[10px]">
              Bài gốc: <strong className="text-indigo-600">{activeCards[currentIndex].lessonTitle.slice(0, 20)}...</strong>
            </span>
          </div>

          {/* 3D Flip Card stage */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="group h-80 w-full cursor-pointer perspective-1000"
          >
            <div className={`relative h-full w-full rounded-[2.5rem] shadow-2xl transition-all duration-500 transform style-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}>
              
              {/* Card FRONT side */}
              <div className="absolute inset-0 h-full w-full rounded-[2.5rem] bg-gradient-to-br from-white to-slate-50 border-2 border-slate-100 p-8 flex flex-col justify-between backface-hidden shadow-indigo-100/30 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">THẺ GHI NHỚ</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                    {activeCards[currentIndex].status === "mastered" ? "🥇 ĐÃ THUỘC" : "🎓 CHƯA THUỘC"}
                  </span>
                </div>

                <div className="text-center py-6">
                  <h3 className="font-display font-black text-2xl md:text-3xl text-slate-800 tracking-tight leading-snug">
                    {activeCards[currentIndex].front}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest animate-pulse">
                    Click chuột để lật xem đáp án 🔄
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold border-t border-slate-50 pt-3">
                  <span>Hộp: {activeCards[currentIndex].repetitions || 1} • Nhớ: {Math.ceil(activeCards[currentIndex].interval)} ngày</span>
                  <button
                    onClick={(e) => handleDeleteCard(activeCards[currentIndex].id, e)}
                    className="text-red-400 hover:text-red-600 hover:scale-105 transition-all p-1"
                  >
                    Xóa thẻ 🗑️
                  </button>
                </div>
              </div>

              {/* Card BACK side */}
              <div className="absolute inset-0 h-full w-full rounded-[2.5rem] bg-gradient-to-br from-indigo-900 to-indigo-950 border-2 border-indigo-950 p-8 flex flex-col justify-between rotate-y-180 backface-hidden shadow-2xl shadow-indigo-900/30 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">ĐÁP ÁN & GIẢI THÍCH</span>
                  </div>
                  <span className="text-[10px] bg-indigo-800/80 text-indigo-200 font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                    Học liệu AI
                  </span>
                </div>

                <div className="text-center py-4 space-y-3">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">Giải thích cốt lõi:</span>
                  <p className="font-sans font-medium text-sm md:text-base leading-relaxed text-indigo-50">
                    {activeCards[currentIndex].back}
                  </p>
                </div>

                <div className="border-t border-indigo-800/50 pt-3 flex items-center justify-between text-[10px] text-indigo-300">
                  <span>Kiến thức từ: {activeCards[currentIndex].lessonTitle.slice(0, 20)}...</span>
                  <span className="font-extrabold uppercase text-indigo-400">Ấn để xem lại mặt trước 🔄</span>
                </div>
              </div>

            </div>
          </div>

          {/* Feedback & Spaced Repetition Grading Actions */}
          <div className="space-y-3">
            {isFlipped ? (
              <div className="space-y-2 text-center animate-fade-in">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Em hãy đánh giá độ nhớ của mình để xếp lịch ôn tập:</span>
                <div className="grid grid-cols-3 gap-3">
                  {/* Hard Option */}
                  <button
                    onClick={() => handleGradeCard("hard")}
                    className="p-3.5 bg-red-50 hover:bg-red-100 border border-red-150 hover:border-red-300 rounded-2xl text-center transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition-all">
                      <X className="w-4.5 h-4.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-black text-red-950 block">Hơi quên / Khó</span>
                    <span className="text-[8px] text-red-600 font-bold block mt-0.5">Ôn lại ngày mai (+2 XP)</span>
                  </button>

                  {/* Good Option */}
                  <button
                    onClick={() => handleGradeCard("good")}
                    className="p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-150 hover:border-amber-300 rounded-2xl text-center transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition-all">
                      <HelpCircle className="w-4.5 h-4.5 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black text-amber-950 block">Nhớ tạm / Vừa</span>
                    <span className="text-[8px] text-amber-600 font-bold block mt-0.5">Giãn cách vừa (+5 XP)</span>
                  </button>

                  {/* Easy Option */}
                  <button
                    onClick={() => handleGradeCard("easy")}
                    className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 hover:border-emerald-300 rounded-2xl text-center transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition-all">
                      <Check className="w-4.5 h-4.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-black text-emerald-950 block">Nhớ rõ / Dễ</span>
                    <span className="text-[8px] text-emerald-600 font-bold block mt-0.5">Giãn cách xa (+8 XP)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs font-semibold text-slate-500">
                💡 Ấn vào thẻ để lật xem lời giải thích và các nút chấm điểm lặp lại ngắt quãng.
              </div>
            )}
          </div>

          {/* Quick Manual Carousel controls */}
          <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-50">
            <button
              onClick={() => {
                setIsFlipped(false);
                setTimeout(() => {
                  setCurrentIndex(prev => prev > 0 ? prev - 1 : activeCards.length - 1);
                }, 100);
              }}
              className="text-xs font-black text-indigo-600 hover:underline cursor-pointer"
            >
              ← Thẻ trước
            </button>
            
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Lặp lại ngắt quãng hoạt động 100% ngoại tuyến
            </span>

            <button
              onClick={() => {
                setIsFlipped(false);
                setTimeout(() => {
                  setCurrentIndex(prev => prev < activeCards.length - 1 ? prev + 1 : 0);
                }, 100);
              }}
              className="text-xs font-black text-indigo-600 hover:underline cursor-pointer"
            >
              Thẻ sau →
            </button>
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-black text-slate-800 text-base">Chưa có Flashcard nào cho bài học này!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Em hãy dùng tính năng **Trích xuất AI** ở thanh điều khiển phía trên để tự động tách từ khóa từ các giáo trình đã soạn, hoặc ấn **Tự tạo thẻ mới** nhé!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
