import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import LessonForm from "./components/LessonForm";
import LessonReader from "./components/LessonReader";
import QuizArena from "./components/QuizArena";
import Profile from "./components/Profile";
import Shop from "./components/Shop";
import Leaderboard from "./components/Leaderboard";
import Flashcards from "./components/Flashcards";
import PKArena from "./components/PKArena";
import ConfettiCelebration from "./components/ConfettiCelebration";
import TiltCard from "./components/TiltCard";
import { Lesson, QuizSession, UserProgress, DailyQuest } from "./types";
import { SAMPLE_LESSONS, SAMPLE_QUIZ } from "./data";
import { Sparkles, HelpCircle, Bell, Search, Info, CheckCircle2, GraduationCap, Flame, X, Wifi, WifiOff, MoreVertical, Trash2, Edit3, Check, Share2, LayoutGrid, List, Filter, SlidersHorizontal, Pin, Clock } from "lucide-react";
import { getAvatarAtLevel } from "./lib/avatarEvolution";

const getDifficulty = (content: string = "") => {
  const length = content.length;
  if (length < 1500) {
    return { label: "Dễ", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  } else if (length < 3500) {
    return { label: "Trung bình", className: "bg-amber-50 text-amber-700 border-amber-100" };
  } else {
    return { label: "Khó", className: "bg-rose-50 text-rose-700 border-rose-100" };
  }
};


export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeMenuLessonId, setActiveMenuLessonId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [animatingOutLessonId, setAnimatingOutLessonId] = useState<string | null>(null);
  const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">(
    () => (localStorage.getItem("library_lessons_view_mode") as "grid" | "list") || "grid"
  );
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "Dễ" | "Trung bình" | "Khó">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [flippedLessons, setFlippedLessons] = useState<Record<string, boolean>>({});

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("smart_study_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistoryDesktop, setShowHistoryDesktop] = useState<boolean>(false);
  const [showHistoryMobile, setShowHistoryMobile] = useState<boolean>(false);

  const addToSearchHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, 3);
      localStorage.setItem("smart_study_search_history", JSON.stringify(next));
      return next;
    });
  };

  const deleteHistoryItem = (item: string) => {
    setSearchHistory((prev) => {
      const next = prev.filter((h) => h !== item);
      localStorage.setItem("smart_study_search_history", JSON.stringify(next));
      return next;
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("smart_study_search_history");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addToSearchHistory(searchQuery);
      (e.target as HTMLInputElement).blur();
    }
  };

  const toggleLibraryViewMode = (mode: "grid" | "list") => {
    setLibraryViewMode(mode);
    localStorage.setItem("library_lessons_view_mode", mode);
  };

  const filteredLessons = lessons.filter((lesson) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchSearch = 
        lesson.title.toLowerCase().includes(q) ||
        lesson.bookName.toLowerCase().includes(q) ||
        lesson.grade.toLowerCase().includes(q) ||
        (lesson.topic && lesson.topic.toLowerCase().includes(q)) ||
        (lesson.curriculum && lesson.curriculum.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    if (difficultyFilter !== "all") {
      const difficulty = getDifficulty(lesson.content).label;
      if (difficulty !== difficultyFilter) return false;
    }

    if (statusFilter !== "all") {
      const isCompleted = !!lesson.completed;
      if (statusFilter === "completed" && !isCompleted) return false;
      if (statusFilter === "incomplete" && isCompleted) return false;
    }

    return true;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
  const [progress, setProgress] = useState<UserProgress>({
    points: 0,
    level: 1,
    streak: 0,
    lastActive: null,
    lessonsCompletedCount: 0,
    testsTakenCount: 0,
    coins: 0
  });
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("smart_study_avatar_idx_v2");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleSelectAvatar = (idx: number) => {
    setSelectedAvatarIdx(idx);
    localStorage.setItem("smart_study_avatar_idx_v2", idx.toString());
  };
  const [levelUpAward, setLevelUpAward] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  
  const [generatingLesson, setGeneratingLesson] = useState<boolean>(false);
  const [generatingQuiz, setGeneratingQuiz] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Online connection tracking & manual simulator mode
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [isManualOffline, setIsManualOffline] = useState<boolean>(false);
  const [swStatus, setSwStatus] = useState<"active" | "installing" | "error" | "unsupported">("installing");

  const effectiveOnline = isOnline && !isManualOffline;

  // Simulated push notification states
  const [simulatedPush, setSimulatedPush] = useState<{
    id: string;
    title: string;
    body: string;
    actionTab: string;
    actionText: string;
  } | null>(null);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn("Web Audio API blocked or not supported:", err);
    }
  };

  const triggerSimulatedPush = (title: string, body: string, actionTab: string = "quiz", actionText: string = "Học Ngay 🚀") => {
    // Try sending native notification
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body });
          }
        });
      }
    }

    // Play ding ping sound
    playNotificationSound();

    // Trigger in-app slide-in
    setSimulatedPush({
      id: "push-" + Date.now(),
      title,
      body,
      actionTab,
      actionText
    });
  };

  // Daily Quests configuration
  const QUEST_POOL = [
    { type: "complete_lesson", text: "Chuyên Cần Đọc Sách: Hoàn thành 1 bài học bất kỳ", target: 1, rewardXp: 20, rewardCoins: 10, icon: "BookOpen" },
    { type: "score_quiz", text: "Đỉnh Cao Trí Tuệ: Đạt từ 80% điểm số trong bài kiểm tra", target: 1, rewardXp: 30, rewardCoins: 15, icon: "GraduationCap" },
    { type: "create_lesson", text: "Nhà Sáng Tạo Trẻ: Soạn một bài giảng mới cùng trợ lý AI", target: 1, rewardXp: 15, rewardCoins: 10, icon: "Sparkles" },
    { type: "answer_quiz_question", text: "Giải Đố Chớp Nhoáng: Trả lời đúng 3 câu trắc nghiệm", target: 3, rewardXp: 20, rewardCoins: 10, icon: "HelpCircle" },
    { type: "earn_coins", text: "Tích Tiểu Thành Đại: Thu thập thêm 15 Xu Trí Tuệ từ học tập", target: 15, rewardXp: 15, rewardCoins: 5, icon: "Coins" }
  ];

  const generateDailyQuests = () => {
    const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map((q, idx) => ({
      id: `quest-${Date.now()}-${idx}`,
      type: q.type,
      text: q.text,
      target: q.target,
      current: 0,
      completed: false,
      claimed: false,
      rewardXp: q.rewardXp,
      rewardCoins: q.rewardCoins,
      icon: q.icon
    }));
  };

  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);

  // Initialize daily quests
  useEffect(() => {
    try {
      const saved = localStorage.getItem("smart_study_daily_quests_v2");
      const today = new Date().toLocaleDateString("sv-SE");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today && Array.isArray(parsed.quests)) {
          setDailyQuests(parsed.quests);
          return;
        }
      }
      const newQuests = generateDailyQuests();
      setDailyQuests(newQuests);
      localStorage.setItem("smart_study_daily_quests_v2", JSON.stringify({
        date: today,
        quests: newQuests
      }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const progressQuest = (type: string, amount: number = 1) => {
    setDailyQuests((prev) => {
      let changed = false;
      const updated = prev.map((q) => {
        if (q.type === type && !q.completed) {
          const nextCurrent = Math.min(q.target, q.current + amount);
          const isCompleted = nextCurrent >= q.target;
          if (isCompleted && !q.completed) {
            triggerSuccessMessage(`🎯 Đã hoàn thành nhiệm vụ: ${q.text.split(":")[0]}! Hãy nhận thưởng nhé!`);
          }
          changed = true;
          return {
            ...q,
            current: nextCurrent,
            completed: isCompleted
          };
        }
        return q;
      });

      if (changed) {
        try {
          const today = new Date().toLocaleDateString("sv-SE");
          localStorage.setItem("smart_study_daily_quests_v2", JSON.stringify({
            date: today,
            quests: updated
          }));
        } catch (err) {
          console.error(err);
        }
      }
      return updated;
    });
  };

  const handleClaimQuest = (questId: string) => {
    setDailyQuests((prev) => {
      const targetQuest = prev.find(q => q.id === questId);
      if (!targetQuest || !targetQuest.completed || targetQuest.claimed) return prev;

      updateProgress({
        points: progress.points + targetQuest.rewardXp,
        coins: (progress.coins || 0) + targetQuest.rewardCoins
      });

      triggerSuccessMessage(`🎁 Nhận thành công quà nhiệm vụ! +${targetQuest.rewardXp} XP và +${targetQuest.rewardCoins} Xu Trí Tuệ!`);

      const updated = prev.map(q => q.id === questId ? { ...q, claimed: true } : q);
      try {
        const today = new Date().toLocaleDateString("sv-SE");
        localStorage.setItem("smart_study_daily_quests_v2", JSON.stringify({
          date: today,
          quests: updated
        }));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };


  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedLessons = localStorage.getItem("smart_study_lessons_v2");
      if (storedLessons) {
        setLessons(JSON.parse(storedLessons));
      } else {
        setLessons([]);
      }

      const storedProgress = localStorage.getItem("smart_study_progress_v2");
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        if (parsed.coins === undefined) {
          parsed.coins = 0;
        }
        setProgress(parsed);
      } else {
        setProgress({
          points: 0,
          level: 1,
          streak: 0,
          lastActive: null,
          lessonsCompletedCount: 0,
          testsTakenCount: 0,
          coins: 0
        });
      }
    } catch (err) {
      console.error("Local storage error:", err);
    }
  }, []);

  const [hasCheckedInactivity, setHasCheckedInactivity] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSimulatedPush(
        "🟢 Đã khôi phục kết nối mạng!",
        "Ứng dụng đã kết nối trở lại. Tính năng học AI đầy đủ đã sẵn sàng!",
        "dashboard",
        "Xem Dashboard 📊"
      );
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerSimulatedPush(
        "🔴 Đã ngắt kết nối mạng!",
        "SmartStudy đã tự chuyển sang Chế độ Ngoại tuyến. Em vẫn học bài & ôn thi được 100% bình thường nhé!",
        "dashboard",
        "Học Ngoại Tuyến 💾"
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register actual Service Worker
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered successfully with scope:", reg.scope);
          setSwStatus("active");
        })
        .catch((err) => {
          console.warn("Service worker registration not permitted or failed in sandbox:", err);
          setSwStatus("unsupported");
        });
    } else {
      setSwStatus("unsupported");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    // Wait until progress is fully loaded
    if (progress.lastActive !== undefined && !hasCheckedInactivity) {
      const todayString = new Date().toLocaleDateString("sv-SE");
      if (!progress.lastActive) {
        // First login ever: set lastActive to today
        updateProgress({ lastActive: todayString });
        setHasCheckedInactivity(true);
      } else {
        const lastDate = new Date(progress.lastActive);
        const todayDate = new Date(todayString);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 1) {
          // Trigger a notification simulation based on inactivity!
          setTimeout(() => {
            triggerSimulatedPush(
              diffDays >= 2 ? "🔥 Cứu Chuỗi Học Tập (Streak)!" : "📚 Nhắc nhở: Duy trì Streak hôm nay!",
              diffDays >= 2 
                ? `Đã ${diffDays} ngày em chưa đăng nhập. Chuỗi học tập ${progress.streak} ngày đang bị đe dọa!` 
                : `Hãy dành 3 phút hôm nay học tập để bảo vệ chuỗi học tập ${progress.streak} ngày của em nhé!`,
              "dashboard",
              diffDays >= 2 ? "Cứu Streak Ngay 🩹" : "Học Ngay Để Giữ Streak ⚡"
            );
          }, 1500);
        } else {
          // If logged in today, only update lastActive if it has changed
          if (progress.lastActive !== todayString) {
            updateProgress({ lastActive: todayString });
          }
        }
        setHasCheckedInactivity(true);
      }
    }
  }, [progress.lastActive, hasCheckedInactivity]);

  // Update progress helper and save
  const updateProgress = (updates: Partial<UserProgress>) => {
    setProgress((prev) => {
      const next = { ...prev, ...updates };
      
      // Ensure coins exists
      if (next.coins === undefined) {
        next.coins = prev.coins || 0;
      }

      // Check coins increase for daily quest
      const coinDiff = (next.coins || 0) - (prev.coins || 0);
      if (coinDiff > 0) {
        setTimeout(() => {
          progressQuest("earn_coins", coinDiff);
        }, 10);
      }

      // Check level up (100 XP per level)
      const calculatedLevel = Math.floor(next.points / 100) + 1;
      if (calculatedLevel > prev.level) {
        next.level = calculatedLevel;
        next.coins = (next.coins || 0) + 50; // Give 50 coins for leveling up!
        // Schedule level-up modal display warning-free
        setTimeout(() => {
          setLevelUpAward(calculatedLevel);
        }, 10);
        triggerSuccessMessage(`🎉 Chúc mừng em đã thăng cấp lên LEVEL ${calculatedLevel}! Nhận thêm +50 Xu Trí Tuệ nhé!`);
      }
      localStorage.setItem("smart_study_progress_v2", JSON.stringify(next));
      return next;
    });
  };

  const triggerSuccessMessage = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // 1. Action: AI Lesson Drafting
  const handleGenerateLesson = async (formData: {
    bookName: string;
    grade: string;
    curriculum: string;
    topicDescription: string;
  }) => {
    setGeneratingLesson(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể kết nối đến máy chủ AI soạn giáo án.");
      }

      // Add new lesson
      const newLesson: Lesson = {
        id: "lesson-" + Date.now(),
        title: data.metadata.topic ? `📖 Bài học: ${data.metadata.topic}` : `📖 Bài học ${formData.bookName}`,
        content: data.lesson,
        bookName: formData.bookName,
        grade: formData.grade,
        curriculum: formData.curriculum,
        topic: data.metadata.topic,
        createdAt: new Date().toISOString(),
        notes: "",
        completed: false
      };

      const updatedLessons = [newLesson, ...lessons];
      setLessons(updatedLessons);
      localStorage.setItem("smart_study_lessons_v2", JSON.stringify(updatedLessons));

      // Progress daily quest
      progressQuest("create_lesson", 1);

      // Auto reward
      updateProgress({
        points: progress.points + 50, // +50 XP for compiling new lessons
      });

      setSelectedLesson(newLesson);
      setActiveTab("review"); // switch tab to reader
      triggerSuccessMessage("✨ AI đã biên soạn giáo án thành công! Nhận ngay +50 XP!");
    } catch (err: any) {
      console.warn("Generating with simulated data since API key might be missing:", err.message);
      
      // Fallback: Generate mock data so the student experience never breaks!
      const simulatedTitle = formData.topicDescription 
        ? `📖 Thám hiểm: ${formData.topicDescription}` 
        : `📖 Khám phá tri thức ${formData.bookName}`;

      const simulatedContent = `# 🚀 Thám Hiểm: ${formData.topicDescription || "Chương trình nâng cao"}

---

## ⚡ TikTok Hook (Khởi động cực bốc)
> "Ai cũng nghĩ chủ đề này cực kỳ nhức đầu đúng không? 🧠 Nhưng thực ra nó chỉ là trò chơi xếp gạch! Chỉ trong 2 phút nữa, em sẽ có ngay 'bí kíp' để đạt điểm 10 tuyệt đối khiến cả lớp lác mắt!"

---

## 📖 Kiến Thức Cốt Lõi (Core Knowledge)

### 1. Bí mật ẩn giấu thứ nhất
Hãy tưởng tượng kiến thức này giống như cách hoạt động của mạng xã hội Facebook hay TikTok. Chúng ta có nguồn dữ liệu đầu vào, bộ lọc thuật toán, và hiển thị bảng tin.
*   **Điểm xuất phát**: Mọi khái niệm đều đi từ thực tiễn gần gũi nhất.
*   **Công thức diệu kỳ**: Tận dụng tối đa phương pháp ghi nhớ liên tưởng hình ảnh sinh động.

### 2. Ví dụ thực tế dễ hiểu
Nếu ví chủ đề này như một bàn cờ vua ♟️:
1.  **Quân Tốt**: Những khái niệm cơ bản nhất mà ai cũng phải học.
2.  **Quân Vua**: Kết quả cuối cùng mà em cần chinh phục và bảo vệ.

---

## 💡 Hộp Thông Tin Siêu Thú Trị (Did you know?)
> **Bí mật khoa học cực đỉnh!**
> Các nhà khoa học chứng minh rằng, khi học tập đi kèm với tiếng cười và tâm trạng vui tươi, bộ não sẽ tiết ra chất Dopamine giúp ghi nhớ lâu hơn gấp 5 lần so với việc học thuộc lòng khô khan! 🧠✨

---

## 🧠 Thử Thách Siêu Tốc (Quick Challenges)
*   **Thử thách 1**: Khái niệm này áp dụng vào thực tế cuộc sống ở đâu nhiều nhất?
*   **Thử thách 2**: Có thể liên kết kiến thức này với bài học cũ nào không?

---

## 🎯 Bản Đồ Tóm Tắt (TikTok Summary)
*   🔥 **Ghi nhớ**: Học bằng hình ảnh liên tưởng.
*   📊 **Áp dụng**: Làm bài trắc nghiệm ngay để tích lũy XP.
*   🎯 **Bản đồ**: Đọc tóm tắt cuối bài học.`;

      const newLesson: Lesson = {
        id: "lesson-" + Date.now(),
        title: simulatedTitle,
        content: simulatedContent,
        bookName: formData.bookName,
        grade: formData.grade,
        curriculum: formData.curriculum,
        topic: formData.topicDescription || "Kiến thức nâng cao",
        createdAt: new Date().toISOString(),
        notes: "",
        completed: false
      };

      const updatedLessons = [newLesson, ...lessons];
      setLessons(updatedLessons);
      localStorage.setItem("smart_study_lessons", JSON.stringify(updatedLessons));

      // Progress daily quest
      progressQuest("create_lesson", 1);

      updateProgress({
        points: progress.points + 40,
      });

      setSelectedLesson(newLesson);
      setActiveTab("review");
      triggerSuccessMessage("💡 Chế độ mô phỏng: Biên soạn thành công bài học mẫu mới! Nhận +40 XP!");
    } finally {
      setGeneratingLesson(false);
    }
  };

  // 2. Action: Start custom quiz based on lesson
  const handleStartQuizFromLesson = async (lesson: Lesson) => {
    setGeneratingQuiz(true);
    setActiveTab("quiz");
    setErrorMessage(null);
    try {
      // Fetch quiz from Express
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentLesson: {
            title: lesson.title,
            bookName: lesson.bookName,
            grade: lesson.grade,
            content: lesson.content
          }
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tải bài trắc nghiệm.");
      }

      setQuizSession({
        questions: data.quiz,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(data.quiz.length).fill(null),
        completed: false,
        score: 0
      });
    } catch (err: any) {
      console.warn("Using sample quiz due to API unavailability:", err.message);
      
      // Fallback test
      setQuizSession({
        questions: SAMPLE_QUIZ,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(SAMPLE_QUIZ.length).fill(null),
        completed: false,
        score: 0
      });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // 3. Action: Start general cumulative quiz (based on old lessons)
  const handleStartRandomQuiz = async () => {
    setGeneratingQuiz(true);
    setActiveTab("quiz");
    setErrorMessage(null);
    try {
      const activeOldLessons = lessons.filter(l => l.completed).slice(0, 3);
      
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldLessons: activeOldLessons.map(l => ({
            title: l.title,
            bookName: l.bookName,
            content: l.content
          }))
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tải bài trắc nghiệm.");
      }

      setQuizSession({
        questions: data.quiz,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(data.quiz.length).fill(null),
        completed: false,
        score: 0
      });
    } catch (err) {
      setQuizSession({
        questions: SAMPLE_QUIZ,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(SAMPLE_QUIZ.length).fill(null),
        completed: false,
        score: 0
      });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // 4. Action: Quiz gameplay mechanics
  const handleSelectAnswer = (optionIndex: number) => {
    if (!quizSession || quizSession.selectedAnswer !== null) return;

    const currentQ = quizSession.questions[quizSession.currentQuestionIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;
    
    const nextAnswers = [...quizSession.answers];
    nextAnswers[quizSession.currentQuestionIndex] = optionIndex;

    const nextScore = isCorrect ? quizSession.score + 1 : quizSession.score;

    setQuizSession({
      ...quizSession,
      selectedAnswer: optionIndex,
      answers: nextAnswers,
      score: nextScore
    });

    // Instant XP & Coin gain
    if (isCorrect) {
      progressQuest("answer_quiz_question", 1);
      updateProgress({
        points: progress.points + 20,
        coins: (progress.coins || 0) + 5
      });
    }
  };

  const handleNextQuestion = () => {
    if (!quizSession) return;
    setQuizSession({
      ...quizSession,
      currentQuestionIndex: quizSession.currentQuestionIndex + 1,
      selectedAnswer: null
    });
  };

  const handleFinishQuiz = () => {
    if (!quizSession) return;
    
    // Check perfect score
    const isPerfect = quizSession.score === quizSession.questions.length && quizSession.questions.length > 0;
    const bonusCoins = isPerfect ? 30 : 0;

    // Check if score is >= 80% for daily quest
    const scorePercentage = quizSession.questions.length > 0 
      ? (quizSession.score / quizSession.questions.length) 
      : 0;
    if (scorePercentage >= 0.8) {
      progressQuest("score_quiz", 1);
    }

    // Add cumulative completion stat
    updateProgress({
      testsTakenCount: progress.testsTakenCount + 1,
      streak: progress.streak === 0 ? 1 : progress.streak, // verify active streak
      coins: (progress.coins || 0) + bonusCoins
    });

    if (isPerfect) {
      triggerSuccessMessage("👑 Tuyệt đối 100%! Em được tặng thêm +30 Xu Trí Tuệ!");
    }

    setQuizSession({
      ...quizSession,
      completed: true
    });
  };

  const handleRestartQuiz = () => {
    handleStartRandomQuiz();
  };

  // 5. Action: Update student personal notes
  const handleUpdateNotes = (lessonId: string, notesText: string) => {
    const updated = lessons.map((l) => {
      if (l.id === lessonId) {
        return { ...l, notes: notesText };
      }
      return l;
    });
    setLessons(updated);
    localStorage.setItem("smart_study_lessons_v2", JSON.stringify(updated));
  };

  // 6. Action: Toggle lesson completed
  const handleToggleComplete = (lessonId: string) => {
    const updated = lessons.map((l) => {
      if (l.id === lessonId) {
        const isNowCompleted = !l.completed;
        if (isNowCompleted) {
          progressQuest("complete_lesson", 1);
          updateProgress({
            points: progress.points + 30, // reward completed lesson
            lessonsCompletedCount: progress.lessonsCompletedCount + 1,
            coins: (progress.coins || 0) + 15
          });
          triggerSuccessMessage("🎉 Em đã hoàn thành thêm bài học! Nhận ngay +30 XP và +15 Xu bứt phá!");
        } else {
          updateProgress({
            lessonsCompletedCount: Math.max(0, progress.lessonsCompletedCount - 1)
          });
        }
        return { 
          ...l, 
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : undefined 
        };
      }
      return l;
    });
    setLessons(updated);
    localStorage.setItem("smart_study_lessons_v2", JSON.stringify(updated));
  };

  // 6.5. Action: Delete and Rename Lessons
  const handleDeleteLesson = (lessonId: string) => {
    setAnimatingOutLessonId(lessonId);
    setDeletingLessonId(null);
    setActiveMenuLessonId(null);
    
    setTimeout(() => {
      const updated = lessons.filter((l) => l.id !== lessonId);
      setLessons(updated);
      localStorage.setItem("smart_study_lessons_v2", JSON.stringify(updated));
      triggerSuccessMessage("🗑️ Đã xóa giáo án thành công!");
      setAnimatingOutLessonId(null);
    }, 300);
  };

  const handleRenameLesson = (lessonId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updated = lessons.map((l) => {
      if (l.id === lessonId) {
        return { ...l, title: newTitle.trim() };
      }
      return l;
    });
    setLessons(updated);
    localStorage.setItem("smart_study_lessons_v2", JSON.stringify(updated));
    triggerSuccessMessage("✏️ Đã đổi tên giáo án thành công!");
    setEditingLessonId(null);
    setActiveMenuLessonId(null);
  };

  const handleShareLesson = (lesson: Lesson) => {
    const simulatedLink = `${window.location.origin}/share/lesson-${lesson.id}`;
    navigator.clipboard.writeText(simulatedLink)
      .then(() => {
        triggerSuccessMessage(`🔗 Đã sao chép liên kết chia sẻ của "${lesson.title}" vào bộ nhớ tạm!`);
      })
      .catch(() => {
        triggerSuccessMessage("❌ Không thể sao chép liên kết!");
      });
    setActiveMenuLessonId(null);
  };

  const handleTogglePinLesson = (lessonId: string) => {
    const updated = lessons.map((l) => {
      if (l.id === lessonId) {
        const nextPinned = !l.pinned;
        if (nextPinned) {
          triggerSuccessMessage(`📌 Đã ghim giáo án "${l.title}" lên đầu thư viện!`);
        } else {
          triggerSuccessMessage(`📍 Đã bỏ ghim giáo án "${l.title}".`);
        }
        return { ...l, pinned: nextPinned };
      }
      return l;
    });
    setLessons(updated);
    localStorage.setItem("smart_study_lessons_v2", JSON.stringify(updated));
  };

  // 7. Action: Reset user progress
  const handleResetProgress = () => {
    localStorage.removeItem("smart_study_lessons_v2");
    localStorage.removeItem("smart_study_progress_v2");
    localStorage.removeItem("smart_study_avatar_idx_v2");
    localStorage.removeItem("smart_study_inventory");
    localStorage.removeItem("smart_study_daily_quests_v2");
    const freshQuests = generateDailyQuests();
    setDailyQuests(freshQuests);
    setLessons([]);
    setProgress({
      points: 0,
      level: 1,
      streak: 0,
      lastActive: null,
      lessonsCompletedCount: 0,
      testsTakenCount: 0,
      coins: 0
    });
    setSelectedLesson(null);
    setQuizSession(null);
    setActiveTab("dashboard");
    triggerSuccessMessage("⚙️ Đã đặt lại dữ liệu học tập về 0 thành công!");
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setActiveTab("review");
  };

  const currentAvatarStage = getAvatarAtLevel(selectedAvatarIdx, progress.level);

  return (
    <div id="app_root" className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans antialiased">
      
      {/* Dynamic Success notifications banner */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-in max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold leading-relaxed">{successMessage}</span>
        </div>
      )}

      {/* Simulated Push Notification Toast */}
      {simulatedPush && (
        <div className="fixed top-24 right-6 z-50 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl rounded-[1.5rem] p-4.5 max-w-sm w-80 animate-slide-in relative">
          <button 
            onClick={() => setSimulatedPush(null)}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition-all"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
              <Bell className="w-5 h-5 fill-indigo-200/20 animate-pulse" />
            </div>
            
            <div className="space-y-1.5 flex-1 pr-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">SmartStudy AI</span>
                <span className="text-[9px] font-medium text-slate-400">Vừa xong</span>
              </div>
              <h4 className="text-xs font-black text-slate-850 leading-snug">
                {simulatedPush.title}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {simulatedPush.body}
              </p>
              
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab(simulatedPush.actionTab);
                    setSimulatedPush(null);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  {simulatedPush.actionText}
                </button>
                <button
                  onClick={() => setSimulatedPush(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "review") {
            setSelectedLesson(null); // reset selected lesson view if switching tabs
          }
        }} 
        progress={progress} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Sleek Mobile Header */}
        <header className="flex md:hidden bg-white border-b border-slate-100 px-4 py-3 items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-display font-black text-sm text-slate-850">
                SmartStudy <span className="text-indigo-600">AI</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile streak indicator */}
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-100/50 px-2.5 py-1 rounded-lg">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-50 animate-pulse" />
              <span className="text-xs font-black text-amber-700">{progress.streak}d</span>
            </div>

            {/* Mobile level badge */}
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-black">
              Lvl {progress.level}
            </div>

            {/* Profile trigger */}
            <button 
              onClick={() => setActiveTab("profile")}
              className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-sm shadow-sm"
            >
              {currentAvatarStage.emoji}
            </button>
          </div>
        </header>

        {/* Universal Top Nav Header (Desktop Only) */}
        <header className="hidden md:flex bg-white border-b border-slate-100 px-6 py-4 items-center justify-between sticky top-0 z-40">
          {/* Fully Functional Search widget */}
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl w-72 text-slate-500 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all relative">
            <button
              onClick={() => addToSearchHistory(searchQuery)}
              className="hover:scale-110 active:scale-95 transition-transform shrink-0 p-0.5 rounded hover:bg-indigo-50 text-indigo-500"
              title="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>
            <input 
              type="text" 
              placeholder="Tìm kiếm giáo án..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "review") {
                  setActiveTab("review");
                  setSelectedLesson(null);
                }
              }}
              onFocus={() => setShowHistoryDesktop(true)}
              onBlur={() => setTimeout(() => setShowHistoryDesktop(false), 200)}
              onKeyDown={handleSearchKeyDown}
              className="bg-transparent border-none text-xs focus:outline-none w-full font-medium text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 hover:bg-slate-100 rounded-full transition-all"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Recent Searches Dropdown */}
            {showHistoryDesktop && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-50 flex justify-between items-center">
                  <span>Tìm kiếm gần đây</span>
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearSearchHistory();
                    }}
                    className="text-[9px] font-bold text-rose-500 hover:text-rose-700 hover:underline"
                  >
                    Xóa hết
                  </button>
                </div>
                {searchHistory.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchQuery(item);
                      if (activeTab !== "review") {
                        setActiveTab("review");
                        setSelectedLesson(null);
                      }
                      setShowHistoryDesktop(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate w-full text-left">{item}</span>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteHistoryItem(item);
                      }}
                      className="text-slate-350 hover:text-rose-500 p-0.5 rounded hover:bg-slate-100 transition-all ml-auto"
                      title="Xóa"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Quick motivators */}
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100">
              <span className="text-xs font-extrabold flex items-center gap-1">
                ⚡ LEVEL {progress.level}
              </span>
            </div>

            {/* Simulated Notification bell */}
            <button className="w-10 h-10 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-center justify-center relative cursor-pointer text-slate-500">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-pink-500 rounded-full" />
            </button>

            {/* Profile Avatar Trigger */}
            <button 
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xl shadow-md border border-slate-100 group-hover:scale-105 transition-all">
                {currentAvatarStage.emoji}
              </div>
            </button>
          </div>
        </header>

        {/* Outer content padding - Optimized for mobile layout */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {/* Global Offline Mode Notice Banner */}
          {!effectiveOnline && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/60 rounded-2xl flex items-center justify-between gap-4 shadow-sm animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-650 shrink-0 mt-0.5">
                  <WifiOff className="w-5 h-5 text-red-600" />
                </div>
                <div className="space-y-1">
                  <span className="font-black text-xs text-red-950 block">CHẾ ĐỘ NGOẠI TUYẾN (OFFLINE MODE) ĐANG HOẠT ĐỘNG!</span>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    Hệ thống đã tự động lưu trữ các bài học của em. Em vẫn có thể tự do đọc sách, học bài, viết ghi chú và giải bài tập bình thường mà không cần mạng!
                  </p>
                </div>
              </div>
              
              {isManualOffline && (
                <button
                  onClick={() => setIsManualOffline(false)}
                  className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-100 text-red-700 font-extrabold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm shrink-0 uppercase"
                >
                  Kết nối lại ⚡
                </button>
              )}
            </div>
          )}

          {/* Missing API Key notice banner (Graceful degradation) */}
          {!process.env.GEMINI_API_KEY && (
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl flex items-start gap-3 shadow-sm animate-fade-in">
              <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-xs text-orange-950 block">Mách nhỏ học sinh:</span>
                <p className="text-[11px] text-orange-800 leading-relaxed">
                  Ứng dụng chưa phát hiện <strong>GEMINI_API_KEY</strong> trong cấu hình hệ thống. Đừng lo lắng! SmartStudy đã kích hoạt **Bộ Mô Phỏng Giáo Án Thông Minh** để em tự do soạn bài, học thử, và giải đố trắc nghiệm đầy đủ 100% tính năng một cách mượt mà nhất nhé! Để dùng dữ liệu thật từ AI, em có thể thêm API Key trong <strong>Settings &gt; Secrets</strong> bất cứ lúc nào.
                </p>
              </div>
            </div>
          )}

          {/* Core Tab Switcher */}
          {activeTab === "dashboard" && (
            <Dashboard 
              lessons={lessons} 
              progress={progress} 
              onSelectTab={setActiveTab}
              onSelectLesson={handleSelectLesson}
              dailyQuests={dailyQuests}
              onClaimQuest={handleClaimQuest}
              onTriggerSimulatedPush={triggerSimulatedPush}
              onUpdateProgress={updateProgress}
              setHasCheckedInactivity={setHasCheckedInactivity}
              isOnline={isOnline}
              isManualOffline={isManualOffline}
              onToggleManualOffline={() => setIsManualOffline(!isManualOffline)}
              swStatus={swStatus}
            />
          )}

          {activeTab === "learn" && (
            <LessonForm 
              onGenerateLesson={handleGenerateLesson} 
              loading={generatingLesson} 
            />
          )}

          {activeTab === "review" && (
            selectedLesson ? (
              <LessonReader 
                lesson={selectedLesson}
                onBack={() => setSelectedLesson(null)}
                onUpdateNotes={handleUpdateNotes}
                onToggleComplete={handleToggleComplete}
                onStartQuizFromLesson={handleStartQuizFromLesson}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display font-black text-2xl text-slate-800">Thư Viện Bài Ôn Tập</h2>
                    <p className="text-xs text-slate-400">Danh sách các giáo án em đã biên soạn để ôn luyện và ghi chú</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {/* View Mode Switcher */}
                    <div className="flex items-center justify-center bg-slate-100 p-1 rounded-xl border border-slate-150 shadow-inner self-end sm:self-auto">
                      <button
                        onClick={() => toggleLibraryViewMode("grid")}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          libraryViewMode === "grid" 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                        title="Chế độ lưới"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleLibraryViewMode("list")}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          libraryViewMode === "list" 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                        title="Chế độ danh sách"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search box for mobile + additional convenience */}
                    <div className="relative w-full sm:w-80">
                      <button
                        onClick={() => addToSearchHistory(searchQuery)}
                        className="absolute left-3 top-2.5 hover:scale-110 active:scale-95 transition-transform text-slate-400 hover:text-indigo-500 cursor-pointer p-0.5 rounded z-10"
                        title="Tìm kiếm"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        placeholder="Tìm bài học theo tên, môn, lớp..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowHistoryMobile(true)}
                        onBlur={() => setTimeout(() => setShowHistoryMobile(false), 200)}
                        onKeyDown={handleSearchKeyDown}
                        className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 hover:bg-slate-100 rounded-full transition-all"
                          title="Xóa tìm kiếm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Recent Searches Dropdown for Mobile / review view */}
                      {showHistoryMobile && searchHistory.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                          <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-50 flex justify-between items-center">
                            <span>Tìm kiếm gần đây</span>
                            <button 
                              onMouseDown={(e) => {
                                e.preventDefault();
                                clearSearchHistory();
                              }}
                              className="text-[9px] font-bold text-rose-500 hover:text-rose-700 hover:underline"
                            >
                              Xóa hết
                            </button>
                          </div>
                          {searchHistory.map((item, idx) => (
                            <div
                              key={idx}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSearchQuery(item);
                                setShowHistoryMobile(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate w-full text-left">{item}</span>
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteHistoryItem(item);
                                }}
                                className="text-slate-350 hover:text-rose-500 p-0.5 rounded hover:bg-slate-100 transition-all ml-auto"
                                title="Xóa"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Filters Bar */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-4.5">
                    {/* Difficulty Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
                        Độ khó:
                      </span>
                      <div className="flex bg-white border border-slate-150 p-0.5 rounded-xl shadow-inner">
                        {(["all", "Dễ", "Trung bình", "Khó"] as const).map((diff) => (
                          <button
                            key={diff}
                            onClick={() => setDifficultyFilter(diff)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              difficultyFilter === diff
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {diff === "all" ? "Tất cả" : diff}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="hidden md:block w-[1px] h-5 bg-slate-250 mx-0.5" />

                    {/* Status Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                        Trạng thái:
                      </span>
                      <div className="flex bg-white border border-slate-150 p-0.5 rounded-xl shadow-inner">
                        {(["all", "completed", "incomplete"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              statusFilter === status
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {status === "all" ? "Tất cả" : status === "completed" ? "Đã học" : "Chưa học"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Clear Filter button if any is active */}
                  {(difficultyFilter !== "all" || statusFilter !== "all" || searchQuery !== "") && (
                    <button
                      onClick={() => {
                        setDifficultyFilter("all");
                        setStatusFilter("all");
                        setSearchQuery("");
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 self-start md:self-auto hover:bg-white border border-transparent hover:border-slate-150 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm bg-white/50"
                    >
                      <span>Xóa bộ lọc</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {filteredLessons.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Search className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-black text-slate-850 text-base">Không tìm thấy giáo án phù hợp</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Không tìm thấy bài học nào phù hợp với từ khóa <strong className="text-indigo-600">"{searchQuery}"</strong>. Thử tìm kiếm với từ khóa khác hoặc tạo thêm giáo án mới nhé!
                      </p>
                    </div>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-sm"
                    >
                      Đặt lại tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div className={libraryViewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {filteredLessons.map((lesson) => {
                      const difficulty = getDifficulty(lesson.content);
                      const isFlipped = !!flippedLessons[lesson.id];
                      return libraryViewMode === "grid" ? (
                        <div 
                          key={lesson.id}
                          className={`relative w-full min-h-[220px] [perspective:1000px] ${
                            isFlipped ? "z-30" : "hover:z-20"
                          } ${
                            animatingOutLessonId === lesson.id ? "animate-scale-fade-out pointer-events-none" : ""
                          }`}
                        >
                          <div 
                            className="relative w-full h-full duration-500 ease-out transition-transform"
                            style={{ 
                              transformStyle: "preserve-3d",
                              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                            }}
                          >
                            {/* FRONT FACE */}
                            <div 
                              className="w-full h-full"
                              style={{ 
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden"
                              }}
                            >
                              <TiltCard 
                                onClick={() => handleSelectLesson(lesson)}
                                disabled={animatingOutLessonId === lesson.id || isFlipped}
                                className={`p-6 rounded-[2rem] cursor-pointer transition-all flex flex-col justify-between group min-h-[220px] h-full relative border ${
                                  lesson.pinned 
                                    ? "bg-gradient-to-br from-white to-amber-50/10 border-amber-200 shadow-2xl shadow-amber-100/30 hover:border-amber-300" 
                                    : "bg-white border-slate-100 hover:border-indigo-100/80 shadow-2xl shadow-indigo-50/20 hover:shadow-indigo-50/50"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[10px] font-extrabold text-indigo-600 mb-2 relative">
                                    <span className="truncate pr-4 flex items-center gap-1">
                                      {lesson.pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                                      {lesson.bookName} • {lesson.grade}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold transition-all duration-300 ${difficulty.className}`}>
                                        {difficulty.label}
                                      </span>
                                      {lesson.completed && (
                                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                          Đã học xong
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTogglePinLesson(lesson.id);
                                        }}
                                        className={`p-1 rounded-lg transition-colors cursor-pointer relative z-10 ${
                                          lesson.pinned 
                                            ? "bg-amber-50 text-amber-600 border border-amber-200/50 hover:bg-amber-100" 
                                            : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
                                        }`}
                                        title={lesson.pinned ? "Bỏ ghim giáo án" : "Ghim giáo án"}
                                      >
                                        <Pin className={`w-3.5 h-3.5 ${lesson.pinned ? "fill-current rotate-45" : ""}`} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenuLessonId(activeMenuLessonId === lesson.id ? null : lesson.id);
                                        }}
                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer relative z-10"
                                        title="Tùy chọn"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <h3 className="font-display font-bold text-slate-850 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug text-sm">
                                    {lesson.title}
                                  </h3>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-3 mt-4 relative z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFlippedLessons(prev => ({ ...prev, [lesson.id]: true }));
                                    }}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-600 font-extrabold rounded-lg border border-indigo-100/50 transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 z-20 relative animate-pulse"
                                  >
                                    <span>Quick View 🔍</span>
                                  </button>
                                  <span className="font-extrabold text-indigo-600 group-hover:underline">Ôn tập ngay →</span>
                                </div>

                                {/* Quick action menu overlay */}
                                {activeMenuLessonId === lesson.id && (
                                  <div 
                                    className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 rounded-[2rem] p-5 flex flex-col justify-between animate-slide-down"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tùy chọn giáo án</span>
                                        <button
                                          onClick={() => setActiveMenuLessonId(null)}
                                          className="text-slate-450 hover:text-slate-600 cursor-pointer p-0.5 hover:bg-slate-50 rounded-full"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>

                                      <div className="space-y-1.5">
                                        <button
                                          onClick={() => {
                                            handleTogglePinLesson(lesson.id);
                                            setActiveMenuLessonId(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-amber-600 hover:bg-amber-50/50 rounded-xl transition-all cursor-pointer text-left"
                                        >
                                          <Pin className={`w-4 h-4 ${lesson.pinned ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                                          <span>{lesson.pinned ? "Bỏ ghim giáo án" : "Ghim giáo án"}</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setEditingLessonId(lesson.id);
                                            setEditingTitle(lesson.title);
                                            setActiveMenuLessonId(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all cursor-pointer text-left"
                                        >
                                          <Edit3 className="w-4 h-4 text-indigo-500" />
                                          <span>Đổi tên giáo án</span>
                                        </button>

                                        <button
                                          onClick={() => handleShareLesson(lesson)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-xl transition-all cursor-pointer text-left"
                                        >
                                          <Share2 className="w-4 h-4 text-emerald-500" />
                                          <span>Chia sẻ giáo án</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setDeletingLessonId(lesson.id);
                                            setActiveMenuLessonId(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer text-left"
                                        >
                                          <Trash2 className="w-4 h-4 text-rose-500" />
                                          <span>Xóa giáo án</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="text-[9px] text-slate-400 text-center border-t border-slate-50 pt-2 font-medium">
                                      Nhấn vào dấu X để đóng bảng chọn
                                    </div>
                                  </div>
                                )}
                              </TiltCard>
                            </div>

                            {/* BACK FACE */}
                            <div 
                              className="absolute inset-0 bg-white border border-indigo-100 p-5 rounded-[2rem] shadow-2xl shadow-indigo-100/30 flex flex-col justify-between z-10"
                              style={{ 
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)"
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className="flex items-center justify-between text-[9px] font-black uppercase text-indigo-500 tracking-wider mb-2 shrink-0">
                                  <span>Tóm tắt bài học • {lesson.bookName}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFlippedLessons(prev => ({ ...prev, [lesson.id]: false }));
                                    }}
                                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                    title="Quay lại mặt trước"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
                                  <h4 className="font-display font-bold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-1">
                                    {lesson.title}
                                  </h4>
                                  
                                  <div className="space-y-2 text-left">
                                    {lesson.topic && (
                                      <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                                        <span className="font-extrabold text-indigo-600 text-[9px] block uppercase mb-0.5">Chủ đề chính</span>
                                        <p className="text-slate-650 font-semibold text-[10px] leading-tight line-clamp-1">{lesson.topic}</p>
                                      </div>
                                    )}
                                    
                                    {lesson.notes ? (
                                      <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100/50">
                                        <span className="font-extrabold text-amber-600 text-[9px] block uppercase mb-0.5">Ghi chú quan trọng</span>
                                        <p className="text-slate-650 font-medium text-[10px] leading-relaxed line-clamp-2">{lesson.notes}</p>
                                      </div>
                                    ) : (
                                      <div className="bg-indigo-50/30 p-2 rounded-xl border border-indigo-100/30">
                                        <span className="font-extrabold text-indigo-600 text-[9px] block uppercase mb-0.5">Xem nhanh nội dung</span>
                                        <p className="text-slate-650 font-medium text-[10px] leading-relaxed line-clamp-2">
                                          {lesson.content ? lesson.content.replace(/[#*`~_>-]/g, '').replace(/\s+/g, ' ').substring(0, 150) + "..." : "Chưa có nội dung"}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFlippedLessons(prev => ({ ...prev, [lesson.id]: false }));
                                  }}
                                  className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <span>← Quay lại</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectLesson(lesson);
                                  }}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-150 flex items-center gap-1"
                                >
                                  <span>Vào học ngay</span>
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                    ) : (
                      <div 
                        key={lesson.id}
                        onClick={animatingOutLessonId === lesson.id ? undefined : () => handleSelectLesson(lesson)}
                        className={`group p-4.5 rounded-2xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden border ${
                          lesson.pinned 
                            ? "bg-gradient-to-r from-amber-50/15 to-white border-amber-200 shadow-md" 
                            : "bg-white border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md"
                        } ${
                          animatingOutLessonId === lesson.id ? "animate-scale-fade-out pointer-events-none" : ""
                        }`}
                      >
                        <div className={`absolute top-0 left-0 w-1.5 h-full transition-all ${
                          lesson.pinned 
                            ? "bg-gradient-to-b from-amber-400 to-amber-500 opacity-100" 
                            : "bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100"
                        }`} />
                        
                        <div className="flex-1 space-y-2 pl-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {lesson.pinned && (
                              <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 text-[9px] font-extrabold">
                                <Pin className="w-2.5 h-2.5 fill-current" /> Đã ghim
                              </span>
                            )}
                            <span className="text-[10px] font-extrabold text-indigo-600">
                              {lesson.bookName} • {lesson.grade}
                            </span>
                            <span className="text-[10px] text-slate-450">•</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold ${difficulty.className}`}>
                              {difficulty.label}
                            </span>
                            {lesson.completed && (
                              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100 text-[9px] font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3 stroke-[3]" /> Đã học xong
                              </span>
                            )}
                          </div>
                          <h3 className="font-display font-bold text-slate-850 group-hover:text-indigo-600 transition-colors leading-snug text-sm sm:text-base">
                            {lesson.title}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-slate-50 pt-2.5 sm:pt-0">
                          <span className="text-[10px] text-slate-400 hidden sm:inline">Được soạn bởi AI</span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePinLesson(lesson.id);
                            }}
                            className={`p-2 rounded-lg transition-colors cursor-pointer relative z-10 ${
                              lesson.pinned 
                                ? "bg-amber-50 text-amber-600 border border-amber-200/50 hover:bg-amber-100" 
                                : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
                            }`}
                            title={lesson.pinned ? "Bỏ ghim giáo án" : "Ghim giáo án"}
                          >
                            <Pin className={`w-3.5 h-3.5 ${lesson.pinned ? "fill-current rotate-45" : ""}`} />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuLessonId(activeMenuLessonId === lesson.id ? null : lesson.id);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer relative z-10"
                            title="Tùy chọn"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50/50 group-hover:bg-indigo-50 border border-indigo-100/50 px-3 py-1.5 rounded-xl transition-all">
                            <span>Ôn tập</span>
                            <Sparkles className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>

                        {/* Quick action menu overlay */}
                        {activeMenuLessonId === lesson.id && (
                          <div 
                            className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 rounded-2xl p-4 flex flex-col justify-between animate-slide-down"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tùy chọn giáo án</span>
                                <button
                                  onClick={() => setActiveMenuLessonId(null)}
                                  className="text-slate-450 hover:text-slate-600 cursor-pointer p-0.5 hover:bg-slate-50 rounded-full"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => {
                                    handleTogglePinLesson(lesson.id);
                                    setActiveMenuLessonId(null);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-amber-600 hover:bg-amber-50/50 border border-slate-100 hover:border-amber-100 rounded-xl transition-all cursor-pointer"
                                >
                                  <Pin className={`w-3.5 h-3.5 ${lesson.pinned ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                                  <span>{lesson.pinned ? "Bỏ ghim" : "Ghim"}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingLessonId(lesson.id);
                                    setEditingTitle(lesson.title);
                                    setActiveMenuLessonId(null);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 rounded-xl transition-all cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Đổi tên</span>
                                </button>

                                <button
                                  onClick={() => handleShareLesson(lesson)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-100 rounded-xl transition-all cursor-pointer"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Chia sẻ</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setDeletingLessonId(lesson.id);
                                    setActiveMenuLessonId(null);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 border border-slate-100 hover:border-rose-100 rounded-xl transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Xóa</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === "quiz" && (
            <QuizArena 
              session={quizSession}
              loading={generatingQuiz}
              onSelectAnswer={handleSelectAnswer}
              onNextQuestion={handleNextQuestion}
              onFinishQuiz={handleFinishQuiz}
              onRestartQuiz={handleRestartQuiz}
              onBackToDashboard={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "flashcards" && (
            <Flashcards 
              lessons={lessons}
              progress={progress}
              onUpdateProgress={updateProgress}
              onTriggerPush={triggerSimulatedPush}
              isOnline={isOnline}
            />
          )}

          {activeTab === "shop" && (
            <Shop 
              progress={progress}
              onUpdateProgress={updateProgress}
              selectedAvatarIdx={selectedAvatarIdx}
              triggerSuccess={triggerSuccessMessage}
            />
          )}

          {activeTab === "leaderboard" && (
            <Leaderboard 
              progress={progress}
              selectedAvatarIdx={selectedAvatarIdx}
              onNavigateToQuiz={() => setActiveTab("quiz")}
            />
          )}

          {activeTab === "pk" && (
            <PKArena 
              progress={progress}
              selectedAvatarIdx={selectedAvatarIdx}
              updateProgress={updateProgress}
              triggerSuccessMessage={triggerSuccessMessage}
              lessons={lessons}
            />
          )}

          {activeTab === "profile" && (
            <Profile 
              progress={progress} 
              lessons={lessons}
              onResetProgress={handleResetProgress}
              selectedAvatarIdx={selectedAvatarIdx}
              onSelectAvatar={handleSelectAvatar}
            />
          )}
        </main>
      </div>

      {/* Level Up Celebration Modal */}
      {levelUpAward !== null && (
        <>
          {/* Confetti element */}
          <ConfettiCelebration duration={7000} />
          
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[90] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl shadow-indigo-200/50 relative overflow-hidden text-center space-y-6 animate-scale-up">
              {/* Glowing back decoration */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-64 h-64 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 rounded-full blur-2xl pointer-events-none" />
              
              {/* Badge visual */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 rounded-full animate-spin-slow opacity-85" />
                <div className="absolute inset-1.5 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-4xl animate-bounce">{currentAvatarStage.emoji}</span>
                  <span className="text-xs font-black text-indigo-600 tracking-wider">LEVEL {levelUpAward}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="font-display font-black text-2xl text-slate-850 tracking-tight leading-tight">
                  TIẾN HÓA & THĂNG CẤP! 🎉
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed px-2">
                  Tuyệt vời! Em đã chính thức đạt <strong className="text-indigo-600">Cấp độ {levelUpAward}</strong>. Đồng hành cùng em, linh thú <strong>{currentAvatarStage.title}</strong> đã vươn mình tiến hóa sang trạng thái cực mạnh!
                </p>
              </div>

              {/* Reward list */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 text-left space-y-3">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest text-center mb-1">QUÀ TẶNG VINH DANH</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shrink-0">🎁</span>
                  <span className="text-slate-600 font-bold">Huy hiệu "Chiến Thần Tri Thức {levelUpAward}" được mở khóa!</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shrink-0">⚡</span>
                  <span className="text-slate-600 font-bold">Tốc độ tích lũy XP tăng thêm +10%</span>
                </div>
              </div>

              {/* Claim reward button */}
              <button
                onClick={() => setLevelUpAward(null)}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 text-white font-extrabold text-sm rounded-2xl hover:from-indigo-700 hover:to-violet-700 shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Nhận Thưởng & Tiếp Tục Học 🚀
              </button>
            </div>
          </div>
        </>
      )}

      {/* Rename Lesson Modal */}
      {editingLessonId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Đổi tên giáo án</span>
              </h3>
              <button
                onClick={() => setEditingLessonId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase">Tên giáo án mới</label>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Nhập tên giáo án mới..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editingTitle.trim()) {
                      handleRenameLesson(editingLessonId, editingTitle);
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingLessonId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-150 text-slate-600 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleRenameLesson(editingLessonId, editingTitle)}
                disabled={!editingTitle.trim()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md text-center"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lesson Confirmation Modal */}
      {deletingLessonId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <span>Xác nhận xóa giáo án</span>
              </h3>
              <button
                onClick={() => setDeletingLessonId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                Em có chắc chắn muốn xóa giáo án <strong className="text-slate-850 font-bold">"{lessons.find(l => l.id === deletingLessonId)?.title}"</strong>?
              </p>
              <p className="text-[10px] text-rose-500 font-semibold bg-rose-50 p-3 rounded-2xl border border-rose-100 leading-relaxed">
                ⚠️ Hành động này không thể hoàn tác. Mọi tiến trình học tập liên quan đến giáo án này sẽ bị gỡ bỏ khỏi thư viện cá nhân của em.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingLessonId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-150 text-slate-600 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleDeleteLesson(deletingLessonId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md text-center"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
