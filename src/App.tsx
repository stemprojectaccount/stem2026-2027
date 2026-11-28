import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { OPEN_TOOL_EVENT } from "./features/tools/openTool";
import { Capacitor } from "@capacitor/core";
// Heavy, rarely-first-needed modules load on demand to keep startup light
const MathMarkdown = React.lazy(() => import("./components/MathMarkdown"));
const AIChatBot = React.lazy(() => import("./components/AIChatBot"));
const MiniPodcastPlayer = React.lazy(() => import("./components/MiniPodcastPlayer"));
import { RefreshCw, MousePointer2, Lightbulb, FileText } from "lucide-react";
import type confettiFn from "canvas-confetti";
// Loaded on the first celebration / share popover, not at startup
const confetti = (opts: Parameters<typeof confettiFn>[0]) => void import("canvas-confetti").then((m) => m.default(opts));
const LessonQRCode = React.lazy(() => import("./components/LessonQRCode"));
// Main tabs, fetched while the app is idle after start so the first tap on a tab opens without a wait
const prefetchMainTabs = () => [
  () => import("./components/Dashboard"), () => import("./components/LessonReader"), () => import("./components/QuizArena"),
  () => import("./components/GameHub"), () => import("./features/tools/ToolsHub"), () => import("./components/Profile"),
  () => import("./features/dictionary/DictionaryPage"), () => import("./components/Flashcards"), () => import("./components/Shop"),
].forEach((load, i) => setTimeout(() => void load().catch(() => {}), i * 400)); // staggered: never one big stall
import { useFirestoreSync } from "./hooks/useFirestoreSync";
import { ROLE_EVENT, getRoleForUser } from "./lib/familyLink";
import AuthAccountWidget from "./components/AuthAccountModal";
import FullScreenAuthPortal from "./components/FullScreenAuthPortal";
import { PUBLIC_SHARE_BASE_URL, buildPublicLessonUrl } from "./lib/shareLink";
import Sidebar from "./components/Sidebar";
const ParentTeacherPortal = React.lazy(() => import('./components/ParentTeacherPortal'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const LessonForm = React.lazy(() => import('./components/LessonForm'));
const LessonReader = React.lazy(() => import('./components/LessonReader'));
const QuizArena = React.lazy(() => import('./components/QuizArena'));
const Profile = React.lazy(() => import('./components/Profile'));
const Shop = React.lazy(() => import('./components/Shop'));
const Leaderboard = React.lazy(() => import('./components/Leaderboard'));
const Flashcards = React.lazy(() => import('./components/Flashcards'));
const PKArena = React.lazy(() => import('./components/PKArena'));
const KnowledgeMap = React.lazy(() => import('./components/KnowledgeMap'));
const ReadingComprehension = React.lazy(() => import('./components/ReadingComprehension'));
const EssayArena = React.lazy(() => import('./components/EssayArena'));
const PodcastPage = React.lazy(() => import('./components/PodcastPage'));
const GameHub = React.lazy(() => import('./components/GameHub'));
const AppDownloadPage = React.lazy(() => import('./components/AppDownloadPage'));
const GeoMathBoard = React.lazy(() => import('./features/geomath/GeoMathBoard'));
const ToolsHub = React.lazy(() => import('./features/tools/ToolsHub'));
const DictionaryPage = React.lazy(() => import('./features/dictionary/DictionaryPage'));
const QuickLookup = React.lazy(() => import('./features/dictionary/QuickLookup'));
import QuickLookupSetting from './features/dictionary/QuickLookupSetting';
import { LocalLibrarySync } from './components/LocalLibrary';
import SupportSettingsCard from './components/support/SupportSettingsCard';
import FeedbackFlash from './components/support/FeedbackFlash';
import { BreakReminder, ReadingRuler } from './components/support/StudyHelpers';
import SupportFirstRun from './components/support/SupportFirstRun';
import VoiceControl, { ASK_AI_EVENT } from './components/support/VoiceControl';
import HandSignControl from './components/support/HandSignControl';
import { levelFromXp } from "./lib/levels";
import { signalFeedback } from './lib/support/feedback';
import { getSupportProfile, prefersLessMotion, useSupportMode } from './lib/support/profile';
import { OPEN_DICTIONARY_EVENT } from './features/dictionary/quickLookupPrefs';
const StudyLockSettings = React.lazy(() => import('./components/StudyLockSettings'));
const StudyLockHost = React.lazy(() => import('./components/StudyLockHost'));
const AppUsageReminder = React.lazy(() => import('./components/AppUsageReminder'));
const ParentSync = React.lazy(() => import('./components/ParentSync'));
const ParentCommands = React.lazy(() => import('./components/ParentCommands'));
const ParentSetupGate = React.lazy(() => import('./components/ParentSetupGate'));
const AccountCenter = React.lazy(() => import('./components/AccountCenter'));
const ParentHome = React.lazy(() => import('./components/ParentHome'));
import { PodcastProvider } from "./context/PodcastContext";
import ConfettiCelebration from "./components/ConfettiCelebration";
import TiltCard from "./components/TiltCard";
import { STUDIO_ASCII_THEMES, ALL_ASCII_MOOD_TAGS, ASCII_MOOD_TAG_ICONS, AsciiMoodTag } from "./data/asciiThemes";
import { Lesson, Question, QuizSession, UserProgress, DailyQuest, QuizAttempt, WeakTopicRecommendation } from "./types";
import { SAMPLE_LESSONS, SAMPLE_QUIZ } from "./data";
import { bankQuestions, GATE_SUBJECTS } from "./data/studyGateBank";
import LessonLibraryFilterBar, {
  detectLessonSubject,
  normalizeLessonGrade,
  detectLessonDifficulty,
  detectLessonContentType,
  LessonDifficultyLevel,
  LessonContentType,
  SUBJECT_DEFINITIONS
} from "./components/LessonLibraryFilterBar";
import { loadQuizHistory, recordNewQuizAttempt, identifyWeakTopics } from "./lib/quizAnalytics";
import { Sparkles, HelpCircle, MessageSquare, StickyNote, Plus, Bell, Search, Info, CheckCircle2, GraduationCap, Flame, X, Wifi, WifiOff, MoreVertical, Trash2, Edit3, Check, Share2, LayoutGrid, List, Filter, SlidersHorizontal, Pin, Bookmark, Clock, BookOpen, RotateCcw, ArrowRight, LayoutDashboard, FolderOpen, Trophy, Menu, Headphones, Layers, Zap, ShoppingBag, Compass, Mic, MicOff, Settings, Moon, Sun, Volume2, VolumeX, Gamepad2, Eye, EyeOff, PanelLeft, Palette, ChevronDown, Star } from "lucide-react";
import { getAvatarAtLevel } from "./lib/avatarEvolution";
import { useStudyReminder } from "./hooks/useStudyReminder";
import { useModalFocus } from "./hooks/useModalFocus";
import { useVoiceToText } from "./hooks/useVoiceToText";
import { BrandLogo, WisdomCoinIcon, getMascotComponent } from "./components/CustomMascots";
import { UserAvatar } from "./components/UserAvatar";
import NotificationBell, { NotificationItem } from "./components/NotificationBell";
import VoiceCommandOverlay from "./components/VoiceCommandOverlay";
import PomodoroTimer from "./components/PomodoroTimer";

// AI slow or out of credits: after this the quiz uses the built-in questions instead of a long spinner
const QUIZ_AI_WAIT_MS = 8_000;
// After one AI failure the next quizzes skip the AI for a while (kept across app restarts), so they open at once
const QUIZ_AI_REST_MS = 10 * 60_000;
const QUIZ_AI_DOWN_KEY = "smartstudy_quiz_ai_down_until";
const quizAiDown = () => !navigator.onLine || Date.now() < Number(localStorage.getItem(QUIZ_AI_DOWN_KEY) || 0);
const markQuizAiDown = () => { try { localStorage.setItem(QUIZ_AI_DOWN_KEY, String(Date.now() + QUIZ_AI_REST_MS)); } catch { /* storage blocked */ } };
const BANK_SUBJECT: Record<string, string> = { math: "toan", english: "tieng-anh", literature: "ngu-van", science: "khtn", "khoa-hoc": "khtn", social: "lich-su-dia-ly", informatics: "tin-hoc", civic: "gdcd" };
/** 5 offline questions for this subject and grade (all subjects mixed when none given); SAMPLE_QUIZ if the bank is empty. */
function offlineQuiz(subject: string | undefined, grade: string): Question[] {
  const pool = subject ? bankQuestions(BANK_SUBJECT[subject] || subject, grade) : GATE_SUBJECTS.flatMap((s) => bankQuestions(s.id, grade));
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
  return picked.length ? picked.map(({ question, options, correctIndex, explanation }) => ({ question, options, correctIndex, explanation })) : SAMPLE_QUIZ;
}

const getDifficulty = (lessonOrContent: Lesson | string = "") => {
  if (typeof lessonOrContent !== "string") {
    const diff = detectLessonDifficulty(lessonOrContent);
    return { label: diff.shortLabel, level: diff.level, className: diff.className };
  }
  const length = (lessonOrContent || "").length;
  if (length < 1500) {
    return { label: "Cơ bản", level: "Dễ" as const, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  } else if (length < 2800) {
    return { label: "Trung bình", level: "Trung bình" as const, className: "bg-amber-50 text-amber-700 border-amber-200" };
  } else {
    return { label: "Nâng cao", level: "Khó" as const, className: "bg-rose-50 text-rose-700 border-rose-200" };
  }
};

/**
 * Hiệu ứng pháo hoa toàn màn hình (Full-screen Fireworks celebration) sử dụng canvas-confetti
 * Bắn pháo hoa rực rỡ từ nhiều vị trí ngẫu nhiên khi học sinh đạt điểm tuyệt đối 100% trong bài kiểm tra.
 */
export const triggerFireworksCelebration = () => {
  // "Hỗ trợ học tập": finished = frame + vibration; no fireworks when fewer effects are wanted
  signalFeedback("done");
  if (prefersLessMotion()) return;
  const duration = 4000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 99999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  // Hiệu ứng âm thanh hợp âm vinh quang (C5, E5, G5, C6)
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }, i * 110);
    });
  } catch {
    // AudioContext might be restricted by browser policy before user interaction
  }

  // 1. Chùm pháo hoa mở màn bùng nổ từ trung tâm
  confetti({
    ...defaults,
    particleCount: 85,
    spread: 120,
    origin: { x: 0.5, y: 0.6 },
    colors: ["#ffd700", "#ff4757", "#2ed573", "#1e90ff", "#ffa502", "#e056fd"],
  });

  // 2. Loạt pháo hoa nở rộ liên tục từ nhiều vị trí khắp màn hình
  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 40 * (timeLeft / duration);

    // Chùm pháo bên trái
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.35), y: Math.random() - 0.2 },
      colors: ["#fffa65", "#ff4d4d", "#ffaf40", "#32ff7e", "#7d5fff", "#18dcff"],
    });

    // Chùm pháo bên phải
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.65, 0.9), y: Math.random() - 0.2 },
      colors: ["#fffa65", "#ff4d4d", "#ffaf40", "#32ff7e", "#7d5fff", "#18dcff"],
    });

    // Chùm pháo trung tâm trên cao
    confetti({
      ...defaults,
      particleCount: Math.floor(particleCount * 0.75),
      origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.1 },
      colors: ["#ffd32a", "#ff3838", "#ff9f1a", "#05c46b", "#0fbcf9", "#be2edd"],
    });
  }, 250);

  // 3. Màn kết đại bác pháo hoa rực sáng sau 2.2 giây
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 110,
      spread: 360,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.45 },
      colors: ["#ffd700", "#ffffff", "#ff6b81", "#70a1ff", "#2ed573"],
    });
  }, 2200);
};


export default function App() {
  const studyReminder = useStudyReminder();
  useEffect(() => {
    const start = () => prefetchMainTabs();
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 4000 }) : window.setTimeout(start, 2500);
    return () => (w.requestIdleCallback ? (window as any).cancelIdleCallback?.(id) : clearTimeout(id));
  }, []);
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      // A QR code from "Chia sẻ nhanh" (?c=CODE / ?p=...) opens the tool directly
      if (/[?&](c|p)=/.test(window.location.search)) return "tools";
      const saved = localStorage.getItem("eduquest_active_tab");
      return (saved && saved !== "home") ? saved : "dashboard";
    } catch {
      return "dashboard";
    }
  });
  // "Xem đầy đủ" from Tra nhanh (or anywhere): open the dictionary tab with that word
  const [dictRequest, setDictRequest] = useState<{ word?: string; n: number }>({ n: 0 });
  useEffect(() => {
    const onOpen = (e: Event) => {
      const word = String((e as CustomEvent).detail?.word || "").trim();
      if (!word) return;
      setDictRequest((r) => ({ word, n: r.n + 1 }));
      setActiveTab("dictionary");
    };
    window.addEventListener(OPEN_DICTIONARY_EVENT, onOpen);
    // openTool(): e.g. "Gõ thay nói" in Hỗ trợ học tập opens the conversation board
    const onTool = () => {
      setIsSettingsModalOpen(false);
      setActiveTab("tools");
    };
    window.addEventListener(OPEN_TOOL_EVENT, onTool);
    return () => {
      window.removeEventListener(OPEN_DICTIONARY_EVENT, onOpen);
      window.removeEventListener(OPEN_TOOL_EVENT, onTool);
    };
  }, []);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  // a spoken question the voice assistant hands over: open (and so mount) the chat, which then sends it
  useEffect(() => {
    const open = () => setIsAIChatOpen(true);
    window.addEventListener(ASK_AI_EVENT, open);
    return () => window.removeEventListener(ASK_AI_EVENT, open);
  }, []);
  // download the on-device AI in the background soon after start, so it is there when the network is not
  useEffect(() => {
    const t = setTimeout(() => void import("./lib/onDeviceLLM").then((m) => m.autoDownloadModel()), 15_000);
    return () => clearTimeout(t);
  }, []);

  // Secondary widgets (chat assistant, mini podcast player) mount once the browser is idle
  // after first paint, unless the chat is opened before that.
  const [areIdleWidgetsReady, setAreIdleWidgetsReady] = useState(false);
  useEffect(() => {
    const ric = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
    if (ric) {
      const id = ric(() => setAreIdleWidgetsReady(true), { timeout: 3000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setAreIdleWidgetsReady(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  const [aiSearchState, setAiSearchState] = useState<'idle'|'searching'|'done'>('idle');
  const [aiSearchResult, setAiSearchResult] = useState('');
  
  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    setAiSearchState('searching');
    setAiSearchResult('');
    
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      if (data.success) {
        setAiSearchResult(data.answer);
      } else {
        setAiSearchResult('Xin lỗi em, có lỗi xảy ra khi tìm kiếm thông tin.');
      }
    } catch (e) {
      setAiSearchResult('Không thể kết nối đến máy chủ AI tìm kiếm.');
    } finally {
      setAiSearchState('done');
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeMenuLessonId, setActiveMenuLessonId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [animatingOutLessonId, setAnimatingOutLessonId] = useState<string | null>(null);
  const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">(
    () => (localStorage.getItem("library_lessons_view_mode") as "grid" | "list") || "grid"
  );
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | LessonDifficultyLevel>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<"all" | LessonContentType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "incomplete" | "pinned">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [flippedLessons, setFlippedLessons] = useState<Record<string, boolean>>({});
  const [expandedPreviewLessonId, setExpandedPreviewLessonId] = useState<string | null>(null);

  const handleToggleExpandLessonCard = (lessonId: string) => {
    setExpandedPreviewLessonId((prev) => (prev === lessonId ? null : lessonId));
  };

  const getLessonPreviewDetails = (lesson: Lesson) => {
    const raw = lesson.content || "";
    const headings = Array.from(raw.matchAll(/^#{1,3}\s+(.+)$/gm))
      .map((m) => m[1].replace(/[*_`~]/g, "").trim())
      .filter(Boolean)
      .slice(0, 4);

    const cleanParagraphs = raw
      .split(/\n{2,}/)
      .map((block) =>
        block
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/[*_`~>|]/g, "")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter((p) => p.length > 35 && !p.startsWith("---"))
      .slice(0, 2);

    const wordCount = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));
    const difficulty = getDifficulty(lesson);
    const contentType = detectLessonContentType(lesson);

    return {
      headings,
      cleanParagraphs,
      readingMinutes,
      difficulty,
      contentType,
    };
  };
  const [isFocusReaderMode, setIsFocusReaderMode] = useState<boolean>(false);

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
    // 1. Tìm kiếm văn bản
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

    // 2. Lọc theo Môn Học
    if (selectedSubject !== "all") {
      const lessonSub = detectLessonSubject(lesson);
      if (lessonSub !== selectedSubject) return false;
    }

    // 3. Lọc theo Khối Lớp
    if (selectedGrade !== "all") {
      const normGrade = normalizeLessonGrade(lesson.grade);
      if (normGrade !== selectedGrade && lesson.grade !== selectedGrade) return false;
    }

    // 4. Lọc theo Độ Khó (Cơ bản / Trung bình / Nâng cao)
    if (difficultyFilter !== "all") {
      const difficulty = detectLessonDifficulty(lesson).level;
      if (difficulty !== difficultyFilter) return false;
    }

    // 5. Lọc theo Loại Nội Dung (Lý thuyết / Bài tập / Tóm tắt)
    if (contentTypeFilter !== "all") {
      const cType = detectLessonContentType(lesson).type;
      if (cType !== contentTypeFilter) return false;
    }

    // 6. Lọc theo Trạng Thái
    if (statusFilter === "completed" && !lesson.completed) return false;
    if (statusFilter === "incomplete" && lesson.completed) return false;
    if (statusFilter === "pinned" && !lesson.pinned) return false;

    return true;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
  
  const [progress, setProgress] = useState<UserProgress>(() => {
    let savedProgress: Partial<UserProgress> = {};
    let savedOutfit = "default";
    let savedUnlocked = ["default"];
    let savedGrade = "Lớp 6";
    let savedAvatarIdx = 0;

    try {
      const idxStored = localStorage.getItem("smart_study_avatar_idx_v2");
      if (idxStored !== null) {
        const p = parseInt(idxStored, 10);
        if (!isNaN(p) && p >= 0 && p < 6) savedAvatarIdx = p;
      }

      const stored = localStorage.getItem("smart_study_progress_v2");
      if (stored) {
        savedProgress = JSON.parse(stored);
        if (savedProgress.equippedOutfit) savedOutfit = savedProgress.equippedOutfit;
        if (savedProgress.unlockedOutfits) savedUnlocked = savedProgress.unlockedOutfits;
        if (savedProgress.grade) savedGrade = savedProgress.grade;
      }
      const outfitDirect = localStorage.getItem("smart_study_mascot_outfit");
      if (outfitDirect) savedOutfit = outfitDirect;
      const unlockedDirect = localStorage.getItem("smart_study_unlocked_outfits");
      if (unlockedDirect) savedUnlocked = JSON.parse(unlockedDirect);
      const gradeDirect = localStorage.getItem("smart_study_user_grade");
      if (gradeDirect) savedGrade = gradeDirect;
    } catch {}

    const initialAvatar = savedProgress.avatarUrl || `mascot:${savedAvatarIdx}`;

    return {
      points: savedProgress.points ?? 0,
      level: savedProgress.level ?? 1,
      streak: savedProgress.streak ?? 0,
      lastActive: savedProgress.lastActive ?? null,
      lessonsCompletedCount: savedProgress.lessonsCompletedCount ?? 0,
      testsTakenCount: savedProgress.testsTakenCount ?? 0,
      coins: savedProgress.coins ?? 0,
      equippedOutfit: savedOutfit,
      unlockedOutfits: savedUnlocked,
      grade: savedGrade,
      displayName: savedProgress.displayName || "Học sinh SmartStudy",
      school: savedProgress.school || "THCS Trưng Vương",
      bio: savedProgress.bio || "Học tập là hạt giống của ngày mai • Quyết tâm đạt điểm 10!",
      titleBadge: savedProgress.titleBadge || "🌟 Thủ Khoa Tương Lai",
      avatarUrl: initialAvatar
    };
  });

  // Sync to Firestore & Firebase Auth
  const {
    user,
    loading: authLoading,
    syncStatus,
    lastSyncedTime,
    forceSync,
    logInWithGoogle,
    logOut
  } = useFirestoreSync(lessons, setLessons, progress, setProgress);

  // Parent accounts get their own screen (child monitoring only, no learning features)
  const [accountRole, setAccountRoleState] = useState<string | null>(() => (user ? getRoleForUser(user.uid) : null));
  useEffect(() => {
    const sync = () => setAccountRoleState(user ? getRoleForUser(user.uid) : null);
    sync();
    window.addEventListener(ROLE_EVENT, sync);
    return () => window.removeEventListener(ROLE_EVENT, sync);
  }, [user?.uid]);
  const isParentMode = !!user && accountRole === "parent";

  // Full-screen auth portal state - allow visitors to freely explore landing page and open portal on demand
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isGuestSession, setIsGuestSession] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("smartstudy_guest_mode") === "true";
    } catch {
      return false;
    }
  });

  // Only auto-show if accessing authenticated-only tools without guest mode, or when explicitly requested
  // first launch: the portal opens on its own so the student picks standard or support mode before anything else
  // read once: after picking a mode the portal stays for the sign-in step until login or "Khách"
  const supportMode = useSupportMode(); // "Giao diện hỗ trợ": fewer menu entries
  // No guest mode any more (2026-11): signed out = the portal (mode chooser, then Google sign-in).
  // isGuestSession is now only set by a shared lesson link, so a shared lesson still opens without an account.
  const shouldShowAuthPortal = !user && !authLoading && (isAuthModalOpen || (!isGuestSession && activeTab !== "parent-teacher" && activeTab !== "download-app"));

  const handleOpenAuthPortal = () => {
    setIsAuthModalOpen(true);
  };

  const handleCustomLogOut = async () => {
    try {
      await logOut();
      setIsGuestSession(false);
      try {
        sessionStorage.removeItem("smartstudy_guest_mode");
      } catch {}
      setIsAuthModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState<number>(() => {
    try {
      // 1. Check progress.avatarUrl first as the single source of truth
      const stored = localStorage.getItem("smart_study_progress_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.avatarUrl && typeof parsed.avatarUrl === "string" && parsed.avatarUrl.startsWith("mascot:")) {
          const idx = parseInt(parsed.avatarUrl.replace("mascot:", ""), 10);
          if (!isNaN(idx) && idx >= 0 && idx < 6) {
            localStorage.setItem("smart_study_avatar_idx_v2", idx.toString());
            return idx;
          }
        }
      }
      // 2. Fall back to dedicated avatar index key
      const saved = localStorage.getItem("smart_study_avatar_idx_v2");
      if (saved !== null) {
        const p = parseInt(saved, 10);
        if (!isNaN(p) && p >= 0 && p < 6) return p;
      }
    } catch (e) {
      console.error("Lỗi đọc avatar index ban đầu:", e);
    }
    return 0;
  });

  // Keep selectedAvatarIdx in sync with progress.avatarUrl whenever avatarUrl is updated
  useEffect(() => {
    if (progress.avatarUrl && progress.avatarUrl.startsWith("mascot:")) {
      const idx = parseInt(progress.avatarUrl.replace("mascot:", ""), 10);
      if (!isNaN(idx) && idx >= 0 && idx < 6 && idx !== selectedAvatarIdx) {
        try {
          localStorage.setItem("smart_study_avatar_idx_v2", idx.toString());
        } catch {}
        setSelectedAvatarIdx(idx);
      }
    }
  }, [progress.avatarUrl, selectedAvatarIdx]);

  const handleUpdateProgress = (updated: Partial<UserProgress>) => {
    let targetAvatarIdx: number | null = null;
    if (updated.avatarUrl && typeof updated.avatarUrl === "string" && updated.avatarUrl.startsWith("mascot:")) {
      const idx = parseInt(updated.avatarUrl.replace("mascot:", ""), 10);
      if (!isNaN(idx) && idx >= 0 && idx < 6) {
        targetAvatarIdx = idx;
      }
    }

    // 1. Update localStorage IMMEDIATELY before React state update & UI re-render
    try {
      if (targetAvatarIdx !== null) {
        localStorage.setItem("smart_study_avatar_idx_v2", targetAvatarIdx.toString());
      }
      const stored = localStorage.getItem("smart_study_progress_v2");
      let base = progress;
      if (stored) {
        try {
          base = { ...base, ...JSON.parse(stored) };
        } catch {}
      }
      const nextProgress: UserProgress = { ...base, ...updated };
      localStorage.setItem("smart_study_progress_v2", JSON.stringify(nextProgress));
    } catch (err) {
      console.error("Lỗi cập nhật tiến trình vào localStorage:", err);
    }

    // 2. Synchronously trigger React state updates
    if (targetAvatarIdx !== null) {
      setSelectedAvatarIdx(targetAvatarIdx);
    }
    setProgress((prev) => ({ ...prev, ...updated }));
    setSuccessMessage("Đã cập nhật thông tin hồ sơ và avatar thành công!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSelectAvatar = (idx: number) => {
    const validIdx = Math.max(0, Math.min(5, idx));
    const newAvatarUrl = `mascot:${validIdx}`;

    // 1. Update localStorage IMMEDIATELY before React state update & UI re-render
    try {
      localStorage.setItem("smart_study_avatar_idx_v2", validIdx.toString());
      const stored = localStorage.getItem("smart_study_progress_v2");
      let base = progress;
      if (stored) {
        try {
          base = { ...base, ...JSON.parse(stored) };
        } catch {}
      }
      const nextProgress: UserProgress = { ...base, avatarUrl: newAvatarUrl };
      localStorage.setItem("smart_study_progress_v2", JSON.stringify(nextProgress));
    } catch (err) {
      console.error("Lỗi cập nhật linh vật vào localStorage:", err);
    }

    // 2. Synchronously trigger React state updates
    setSelectedAvatarIdx(validIdx);
    setProgress((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
    setSuccessMessage("Đã chọn linh vật đồng hành mới!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  const [levelUpAward, setLevelUpAward] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLessonFocusDimmed, setIsLessonFocusDimmed] = useState<boolean>(true);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>(() => loadQuizHistory());

  const weakTopicRecommendations = React.useMemo(
    () => identifyWeakTopics(quizHistory, lessons),
    [quizHistory, lessons]
  );
  
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

  // Notification bell & Settings (Fullscreen Dark Mode + Notification Preferences) states
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const notificationTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const settingsModalRef = useRef<HTMLDivElement>(null);
  useModalFocus(isSettingsModalOpen, settingsModalRef);
  const [isVoiceCommandOpen, setIsVoiceCommandOpen] = useState<boolean>(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState<boolean>(false);

  const [isFullscreenDarkMode, setIsFullscreenDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("smart_study_fullscreen_dark_mode_v1") === "true";
    } catch {
      return false;
    }
  });

  // Dialogs rendered into <body> through portals (Settings…) sit outside #app_root, so the dark
  // mode class is mirrored on <html> for them (CSS: html.ss-dark … in index.css).
  useEffect(() => {
    document.documentElement.classList.toggle("ss-dark", isFullscreenDarkMode);
    return () => document.documentElement.classList.remove("ss-dark");
  }, [isFullscreenDarkMode]);

  const handleToggleFullscreenDarkMode = (nextValue?: boolean) => {
    setIsFullscreenDarkMode((prev) => {
      const target = typeof nextValue === "boolean" ? nextValue : !prev;
      try {
        localStorage.setItem("smart_study_fullscreen_dark_mode_v1", String(target));
      } catch {}
      triggerSuccessMessage(
        target
          ? "Đã bật chế độ tối toàn màn hình!"
          : "Đã chuyển về chế độ sáng!"
      );
      return target;
    });
  };

  interface NotificationPreferences {
    streakAlerts: boolean;
    questAlerts: boolean;
    soundEffects: boolean;
  }

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem("smart_study_notification_prefs_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          streakAlerts: parsed.streakAlerts ?? true,
          questAlerts: parsed.questAlerts ?? true,
          soundEffects: parsed.soundEffects ?? true
        };
      }
    } catch {}
    return {
      streakAlerts: true,
      questAlerts: true,
      soundEffects: true
    };
  });

  const handleUpdateNotificationPref = (key: keyof NotificationPreferences, value: boolean) => {
    setNotificationPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem("smart_study_notification_prefs_v1", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const playNotificationSound = () => {
    if (!notificationPrefs.soundEffects) return;
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

  const triggerSimulatedPush = (title: string, body: string, actionTab: string = "quiz", actionText: string = "Học ngay") => {
    // Try sending native notification safely on supported browsers
    try {
      if (typeof window !== "undefined" && "Notification" in window && typeof Notification !== "undefined") {
        if (Notification.permission === "granted") {
          new Notification(title, { body });
        } else if (Notification.permission !== "denied" && typeof Notification.requestPermission === "function") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification(title, { body });
            }
          }).catch(() => {});
        }
      }
    } catch (notifErr) {
      console.warn("Native Notification not supported or blocked:", notifErr);
    }

    // Play ding ping sound
    playNotificationSound();

    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }

    // Trigger directly in notification bell
    const notif: NotificationItem = {
      id: "push-" + Date.now(),
      title,
      body,
      actionTab,
      actionText,
      timestamp: new Date()
    };
    setActiveNotification(notif);
    setIsNotificationOpen(true);

    // Auto dismiss after exactly 10s: "hiện lên trg 10s và mất nhé"
    notificationTimerRef.current = setTimeout(() => {
      setIsNotificationOpen(false);
      setTimeout(() => {
        setActiveNotification(null);
      }, 300);
    }, 10000);
  };

  // Daily Quests configuration
  const QUEST_POOL = [
    { type: "complete_lesson", text: "Chuyên Cần Đọc Sách: Hoàn thành 1 bài học bất kỳ", target: 1, rewardXp: 20, rewardCoins: 10, icon: "BookOpen" },
    { type: "score_quiz", text: "Đỉnh Cao Trí Tuệ: Đạt từ 80% điểm số trong bài kiểm tra", target: 1, rewardXp: 30, rewardCoins: 15, icon: "GraduationCap" },
    { type: "create_lesson", text: "Nhà Sáng Tạo Trẻ: Tạo một bài học mới cùng trợ lý AI", target: 1, rewardXp: 15, rewardCoins: 10, icon: "Sparkles" },
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
          if (isCompleted && !q.completed && notificationPrefs.questAlerts) {
            triggerSuccessMessage(`Đã hoàn thành nhiệm vụ: ${q.text.split(":")[0]}! Hãy nhận thưởng nhé!`, true);
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

      triggerSuccessMessage(`Nhận thành công quà nhiệm vụ! +${targetQuest.rewardXp} XP và +${targetQuest.rewardCoins} Xu Trí Tuệ!`);

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
        const parsed = JSON.parse(storedLessons);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((l: Lesson) => l.id));
          const missingSamples = SAMPLE_LESSONS.filter(s => !existingIds.has(s.id));
          const combined = missingSamples.length > 0 ? [...parsed, ...missingSamples] : parsed;
          setLessons(combined);
          if (missingSamples.length > 0) {
            localStorage.setItem("smart_study_lessons_v2", JSON.stringify(combined));
          }
        } else {
          setLessons(SAMPLE_LESSONS);
          localStorage.setItem("smart_study_lessons_v2", JSON.stringify(SAMPLE_LESSONS));
        }
      } else {
        setLessons(SAMPLE_LESSONS);
        localStorage.setItem("smart_study_lessons_v2", JSON.stringify(SAMPLE_LESSONS));
      }

      const storedProgress = localStorage.getItem("smart_study_progress_v2");
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        if (parsed.coins === undefined) {
          parsed.coins = 0;
        }
        if (!parsed.avatarUrl) {
          const savedAvatar = localStorage.getItem("smart_study_avatar_idx_v2");
          const idx = savedAvatar ? parseInt(savedAvatar, 10) : 0;
          parsed.avatarUrl = `mascot:${!isNaN(idx) && idx >= 0 && idx < 6 ? idx : 0}`;
        }
        if (parsed.avatarUrl && parsed.avatarUrl.startsWith("mascot:")) {
          const idx = parseInt(parsed.avatarUrl.replace("mascot:", ""), 10);
          if (!isNaN(idx) && idx >= 0 && idx < 6) {
            setSelectedAvatarIdx(idx);
          }
        }
        setProgress(parsed);
      } else {
        const savedAvatar = localStorage.getItem("smart_study_avatar_idx_v2");
        const idx = savedAvatar ? parseInt(savedAvatar, 10) : 0;
        const validIdx = !isNaN(idx) && idx >= 0 && idx < 6 ? idx : 0;
        setProgress({
          points: 0,
          level: 1,
          streak: 0,
          lastActive: null,
          lessonsCompletedCount: 0,
          testsTakenCount: 0,
          coins: 0,
          avatarUrl: `mascot:${validIdx}`
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
        "Đã khôi phục kết nối mạng!",
        "Ứng dụng đã kết nối trở lại. Tính năng học AI đầy đủ đã sẵn sàng!",
        "dashboard",
        "Xem Dashboard 📊"
      );
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerSimulatedPush(
        "Đã ngắt kết nối mạng!",
        "Mất mạng nên SmartStudy chuyển sang chế độ ngoại tuyến. Bài đã lưu, trắc nghiệm mẫu và trò chơi vẫn dùng được.",
        "dashboard",
        "Học ngoại tuyến"
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

        if (diffDays >= 1 && notificationPrefs.streakAlerts) {
          // Trigger a notification simulation based on inactivity!
          setTimeout(() => {
            triggerSimulatedPush(
              diffDays >= 2 ? "Cứu chuỗi học tập!" : "Nhắc nhở: giữ chuỗi học hôm nay!",
              diffDays >= 2 
                ? `Đã ${diffDays} ngày em chưa đăng nhập. Chuỗi học tập ${progress.streak} ngày đang bị đe dọa!` 
                : `Hãy dành 3 phút hôm nay học tập để bảo vệ chuỗi học tập ${progress.streak} ngày của em nhé!`,
              "dashboard",
              diffDays >= 2 ? "Cứu chuỗi ngay" : "Học ngay để giữ chuỗi"
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

      // Check level up: each level needs more XP than the last (src/lib/levels.ts)
      const calculatedLevel = levelFromXp(next.points);
      if (calculatedLevel > prev.level) {
        next.level = calculatedLevel;
        next.coins = (next.coins || 0) + 50; // Give 50 coins for leveling up!
        // Schedule level-up modal display warning-free; "Bớt hiệu ứng" keeps the level and coins but not the
        // full-screen modal, which lands in the middle of a quiz for students who lose focus easily
        if (!getSupportProfile().reduceMotion) {
          setTimeout(() => {
            setLevelUpAward(calculatedLevel);
          }, 10);
        }
        triggerSuccessMessage(`Chúc mừng em đã thăng cấp lên LEVEL ${calculatedLevel}! Nhận thêm +50 Xu Trí Tuệ nhé!`);
      }
      localStorage.setItem("smart_study_progress_v2", JSON.stringify(next));
      if (updates.grade) {
        localStorage.setItem("smart_study_user_grade", updates.grade);
      }
      return next;
    });
  };

  /** midTask: pops up while the student is still working (quest done); skipped under "Bớt hiệu ứng". */
  const triggerSuccessMessage = (msg: string, midTask = false) => {
    if (midTask && getSupportProfile().reduceMotion) return;
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
        throw new Error(data.error || "Không thể kết nối đến máy chủ AI tạo bài học.");
      }

      // Add new lesson
      const newLesson: Lesson = {
        id: "lesson-" + Date.now(),
        title: data.metadata.topic ? `Bài học: ${data.metadata.topic}` : `Bài học ${formData.bookName}`,
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
      triggerSuccessMessage("AI đã tạo bài học thành công! Nhận ngay +50 XP!");
    } catch (err: any) {
      console.warn("Generating with simulated data since API key might be missing:", err.message);
      
      // Fallback: Generate mock data so the student experience never breaks!
      const simulatedTitle = formData.topicDescription 
        ? `Bài nháp: ${formData.topicDescription}`
        : `Bài nháp: ${formData.bookName}`;

      // Không bịa kiến thức khi AI lỗi: chỉ đưa khung để em tự ghi, nói rõ đây là bản nháp.
      const simulatedContent = `# Bài nháp: ${formData.topicDescription || formData.bookName}

> Chưa tạo được bài tự động (mất mạng hoặc AI đang bận). Em có thể tự ghi theo khung dưới đây, hoặc thử tạo lại sau.

## 1. Mục tiêu bài học
- Em cần nắm được gì sau bài này?

## 2. Kiến thức trọng tâm
- Định nghĩa, khái niệm chính (chép từ sách giáo khoa).
- Công thức hoặc quy tắc quan trọng.

## 3. Ví dụ
- Một bài tập mẫu trong sách và cách giải.

## 4. Tự kiểm tra
- Kiến thức này dùng ở đâu trong thực tế?
- Nó liên quan đến bài nào em đã học?

## 5. Tóm tắt
- Ghi lại 3 ý quan trọng nhất bằng lời của em.`;

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
      triggerSuccessMessage("Chế độ mô phỏng: Biên soạn thành công bài học mẫu mới! Nhận +40 XP!");
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
      if (quizAiDown()) throw new Error("AI vừa lỗi, dùng câu có sẵn");
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(QUIZ_AI_WAIT_MS),
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

      const lessonSub = detectLessonSubject(lesson);
      const subDef = SUBJECT_DEFINITIONS.find(s => s.id === lessonSub);
      setQuizSession({
        questions: data.quiz,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(data.quiz.length).fill(null),
        completed: false,
        score: 0,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        subjectId: lessonSub,
        subjectName: subDef ? subDef.name : lesson.bookName,
        topic: lesson.topic || lesson.title
      });
    } catch (err: any) {
      console.warn("Using sample quiz due to API unavailability:", err.message);
      
      const lessonSub = detectLessonSubject(lesson);
      const subDef = SUBJECT_DEFINITIONS.find(s => s.id === lessonSub);
      // Fallback test
      const fb = offlineQuiz(lessonSub, lesson.grade);
      markQuizAiDown();
      setQuizSession({
        questions: fb,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(fb.length).fill(null),
        completed: false,
        score: 0,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        subjectId: lessonSub,
        subjectName: subDef ? subDef.name : lesson.bookName,
        topic: lesson.topic || lesson.title
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
      
      if (quizAiDown()) throw new Error("AI vừa lỗi, dùng câu có sẵn");
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(QUIZ_AI_WAIT_MS),
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
        score: 0,
        topic: "Kiến thức tổng hợp",
        subjectId: "math",
        subjectName: "Toán học"
      });
    } catch (err) {
      const fb = offlineQuiz(undefined, progress.grade || "Lớp 6");
      markQuizAiDown();
      setQuizSession({
        questions: fb,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(fb.length).fill(null),
        completed: false,
        score: 0,
        topic: "Kiến thức tổng hợp",
        subjectId: "math",
        subjectName: "Toán học"
      });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // 3.5. Action: Start quiz for a specific recommended weak topic
  const handleStartRecommendedQuiz = async (rec: WeakTopicRecommendation) => {
    setGeneratingQuiz(true);
    setActiveTab("quiz");
    setErrorMessage(null);
    try {
      if (quizAiDown()) throw new Error("AI vừa lỗi, dùng câu có sẵn");
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(QUIZ_AI_WAIT_MS),
        body: JSON.stringify({
          currentLesson: {
            title: rec.topic,
            bookName: rec.subjectName,
            grade: progress.grade || "Lớp 6",
            content: `Chuyên đề củng cố kiến thức: "${rec.topic}". Trọng tâm chẩn đoán: ${rec.reason}. Hãy tạo bộ 5 câu hỏi trắc nghiệm chuẩn mực có tính phân loại để học sinh khắc phục điểm yếu này.`
          }
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tải bài trắc nghiệm gợi ý.");
      }

      setQuizSession({
        questions: data.quiz,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(data.quiz.length).fill(null),
        completed: false,
        score: 0,
        lessonId: rec.lessonId,
        lessonTitle: rec.lessonTitle,
        subjectId: rec.subjectId,
        subjectName: rec.subjectName,
        topic: rec.topic
      });
    } catch (err: any) {
      console.warn("Using sample quiz for recommended topic:", err.message);
      const fb = offlineQuiz(rec.subjectId, progress.grade || "Lớp 6");
      markQuizAiDown();
      setQuizSession({
        questions: fb,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(fb.length).fill(null),
        completed: false,
        score: 0,
        lessonId: rec.lessonId,
        lessonTitle: rec.lessonTitle,
        subjectId: rec.subjectId,
        subjectName: rec.subjectName,
        topic: rec.topic
      });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // 3.8. Action: Start instant trial quiz from LandingHome (First viewport selector)
  const handleStartTrialQuiz = async (grade: string, subjectId: string) => {
    setGeneratingQuiz(true);
    setActiveTab("quiz");
    setErrorMessage(null);

    const subjectMap: Record<string, { name: string; topic: string }> = {
      "toan": { name: "Toán Học", topic: "Tập hợp số và phép tính đại số" },
      "tieng-anh": { name: "Tiếng Anh", topic: "Ngữ pháp và Từ vựng Tiếng Anh Trọng tâm" },
      "ngu-van": { name: "Ngữ Văn", topic: "Văn học, từ vựng và đọc hiểu Ngữ Văn" },
      "khoa-hoc": { name: "Khoa học tự nhiên", topic: "Vật chất, năng lượng và chu trình tự nhiên" },
    };

    const subInfo = subjectMap[subjectId] || { name: "Toán Học", topic: "Kiến thức tổng hợp" };

    // Update student grade preference seamlessly
    updateProgress({ grade });

    try {
      if (quizAiDown()) throw new Error("AI vừa lỗi, dùng câu có sẵn");
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(QUIZ_AI_WAIT_MS),
        body: JSON.stringify({
          currentLesson: {
            title: `Đề Thi Thử ${subInfo.name} - ${grade}`,
            bookName: subInfo.name,
            grade: grade,
            content: `Bộ đề thi thử trắc nghiệm trực tuyến môn ${subInfo.name} dành cho học sinh ${grade}. Chủ đề: ${subInfo.topic}. Gồm 5 câu hỏi có 4 lựa chọn, có giải thích đáp án chi tiết.`
          }
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tải đề thi");
      }

      setQuizSession({
        questions: data.quiz,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(data.quiz.length).fill(null),
        completed: false,
        score: 0,
        topic: `Đề thi thử ${subInfo.name} • ${grade}`,
        subjectId: subjectId,
        subjectName: subInfo.name
      });
    } catch (err) {
      const fb = offlineQuiz(subjectId, grade);
      markQuizAiDown();
      setQuizSession({
        questions: fb,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answers: Array(fb.length).fill(null),
        completed: false,
        score: 0,
        topic: `Đề thi thử ${subInfo.name} • ${grade}`,
        subjectId: subjectId,
        subjectName: subInfo.name
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

    // Record quiz attempt to persistent history & refresh state
    recordNewQuizAttempt(quizSession, lessons);
    setQuizHistory(loadQuizHistory());

    if (isPerfect) {
      triggerFireworksCelebration();
      triggerSuccessMessage(prefersLessMotion() ? "Đúng hết 100%! Thưởng thêm +30 Xu Trí Tuệ." : "TUYỆT ĐỐI 100%! Bắn pháo hoa vinh danh và thưởng thêm +30 Xu Trí Tuệ!");
    } else {
      triggerSuccessMessage("Hoàn thành bài trắc nghiệm! Kết quả đã được cập nhật vào biểu đồ tiến bộ!");
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
          triggerSuccessMessage("Em đã hoàn thành thêm bài học! Nhận ngay +30 XP và +15 Xu bứt phá!");
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
      triggerSuccessMessage("Đã xóa bài học thành công!");
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
    triggerSuccessMessage("Đã đổi tên bài học thành công!");
    setEditingLessonId(null);
    setActiveMenuLessonId(null);
  };

  const toLessonShareSlug = (text: string) => {
    return (text || "bai-hoc")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "bai-hoc";
  };

  const buildStudyShareLink = (lesson: Lesson) => {
    const cleanId = String(lesson.id).replace(/^lesson-/, "");
    const normalizedId = `lesson-${cleanId}`;
    const slug = toLessonShareSlug(lesson.title).slice(0, 28);
    const markerTag = slug ? `${normalizedId}-${slug}` : normalizedId;
    const shareUrl = buildPublicLessonUrl(cleanId, markerTag);
    return { shareUrl, normalizedId, markerTag };
  };

  const markLessonAsSharedLink = (lessonId: string, markerTag: string) => {
    setSharedLessonBadges((prev) => {
      const updated = { ...prev, [lessonId]: markerTag };
      try {
        localStorage.setItem("smart_study_shared_lesson_badges_v1", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleShareLesson = (lesson: Lesson) => {
    const { shareUrl, normalizedId, markerTag } = buildStudyShareLink(lesson);
    setGeneratedShareLink(shareUrl);
    setSharedLessonTitle(lesson.title);
    setSharedLessonMarker(normalizedId);
    setSharedTargetLessonId(lesson.id);
    setShareCopiedState(false);
    setIsSharePopoverOpen(true);
    markLessonAsSharedLink(lesson.id, normalizedId);
    try {
      window.history.replaceState(null, "", `${window.location.pathname}?lesson=${encodeURIComponent(normalizedId)}#${markerTag}`);
    } catch {}
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShareCopiedState(true);
        setTimeout(() => setShareCopiedState(false), 2500);
        triggerSuccessMessage(`Đã tạo và sao chép liên kết chia sẻ (#${normalizedId}) của "${lesson.title}"!`);
      })
      .catch(() => {
        triggerSuccessMessage("Không thể sao chép liên kết!");
      });
    setActiveMenuLessonId(null);
  };

  const handleTogglePinLesson = (lessonId: string) => {
    const updated = lessons.map((l) => {
      if (l.id === lessonId) {
        const nextPinned = !l.pinned;
        if (nextPinned) {
          triggerSuccessMessage(`Đã ghim bài học "${l.title}" lên đầu thư viện!`);
        } else {
          triggerSuccessMessage(`Đã bỏ ghim bài học "${l.title}".`);
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
    setSelectedAvatarIdx(0);
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
      coins: 0,
      avatarUrl: "mascot:0"
    });
    setSelectedLesson(null);
    setQuizSession(null);
    setActiveTab("dashboard");
    triggerSuccessMessage("Đã đặt lại dữ liệu học tập về 0 thành công!");
  };

  const currentAvatarStage = getAvatarAtLevel(selectedAvatarIdx, progress.level);

  // Trạng thái đóng/mở danh sách Menu hệ thống mở rộng (chứa Flashcard, Đấu trường, Đổi quà & các tính năng khác)
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState<boolean>(false);
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem("smart_study_questora_sidebar_v1") !== "false";
    } catch {
      return true;
    }
  });
  const [isTopHeaderHidden, setIsTopHeaderHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem("smart_study_top_header_hidden_v1") === "true";
    } catch {
      return false;
    }
  });
  const [isVibrantBlurMode, setIsVibrantBlurMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("smart_study_vibrant_blur_mode_v1") !== "false"; // blue top bar by default, as in 1.6.16
    } catch {
      return true;
    }
  });
  const [isSpotlightHoverEnabled, setIsSpotlightHoverEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("smart_study_spotlight_hover_v1") !== "false";
    } catch {
      return true;
    }
  });
  const handleToggleBackgroundClarity = (forceVibrantBlur?: boolean) => {
    setIsVibrantBlurMode((prev) => {
      const next = typeof forceVibrantBlur === "boolean" ? forceVibrantBlur : !prev;
      try {
        localStorage.setItem("smart_study_vibrant_blur_mode_v1", String(next));
        localStorage.setItem("smart_study_vibrant_blur_v1", String(next));
      } catch {}
      triggerSuccessMessage(
        next
          ? "Thanh công cụ: đã chuyển sang nền kính mờ."
          : "Thanh công cụ: đã chuyển sang nền đặc (nhẹ máy hơn)."
      );
      return next;
    });
  };
  const handleToggleSpotlightHover = (forceVal?: boolean) => {
    setIsSpotlightHoverEnabled((prev) => {
      const next = typeof forceVal === "boolean" ? forceVal : !prev;
      try {
        localStorage.setItem("smart_study_spotlight_hover_v1", String(next));
      } catch {}
      triggerSuccessMessage(
        next
          ? "Đã BẬT hiệu ứng ẩn hiện và làm nổi bật khi di chuột qua các thanh Tab!"
          : "Đã TẮT hiệu ứng ẩn hiện khi di chuột để tối ưu siêu mượt, giảm lag!"
      );
      return next;
    });
  };
  const [isCompactToolsOpen, setIsCompactToolsOpen] = useState<boolean>(false);

  // Danh sách 5 mục truy cập gần nhất (History dropdown trên #app_root header)
  interface RecentAccessedItem {
    id: string;
    type: "lesson" | "tab";
    title: string;
    subtitle: string;
    tabId: string;
    lessonId?: string;
    accessedAt: string;
  }

  const TAB_METADATA_MAP: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: "Trang chủ", subtitle: "Tổng quan tiến độ và nhiệm vụ" },
    review: { title: "Thư viện Bài học", subtitle: "Sách giáo khoa và ghi chú" },
    quiz: { title: "Luyện đề Trắc nghiệm", subtitle: "Kiểm tra theo chủ đề bài học" },
    flashcards: { title: "Flashcard", subtitle: "Thẻ nhớ ôn tập ngắt quãng" },
    pk: { title: "Đấu trường", subtitle: "Thi đấu phản xạ kiến thức" },
    podcast: { title: "Podcast Học tập", subtitle: "Đối thoại bài giảng Minh và Lan" },
    shop: { title: "Cửa hàng Đổi quà", subtitle: "Vật phẩm và trang phục linh thú" },
    "knowledge-map": { title: "Bản đồ Tri thức", subtitle: "Sơ đồ cây kiến thức trực quan" },
    learn: { title: "Tự học và Ghi chú AI", subtitle: "Soạn bài giảng thông minh" },
    reading: { title: "Đọc hiểu Ngữ liệu", subtitle: "Luyện kỹ năng đọc hiểu" },
    essay: { title: "Luyện Tự luận AI", subtitle: "Chấm chữa bài tự luận chi tiết" },
    leaderboard: { title: "Bảng vàng Danh dự", subtitle: "Xếp hạng thành tích học tập" },
    "parent-teacher": { title: "Góc Phụ huynh và Thầy cô", subtitle: "Theo dõi và giao bài tập" },
    games: { title: "Khu vực Game và Sandbox", subtitle: "Các thư mục trò chơi và chế độ test" },
    profile: { title: "Hồ sơ cá nhân", subtitle: "Tài khoản, linh thú và cấp độ" },
    "download-app": { title: "Tải app về máy", subtitle: "Android, iPhone và Windows" },
    geomath: { title: "Vẽ hình nháp", subtitle: "Bảng vẽ hình học để nháp bài Toán" },
    tools: { title: "Hộp công cụ", subtitle: "Công cụ nhỏ hỗ trợ học tập hằng ngày" },
    "study-lock": { title: "Khoá học tập", subtitle: "Học trước, chơi sau" },
    dictionary: { title: "Tra từ và Dịch", subtitle: "Từ điển Anh–Việt, phát âm, dịch câu" }
  };

  const [recentAccessedItems, setRecentAccessedItems] = useState<RecentAccessedItem[]>(() => {
    try {
      const saved = localStorage.getItem("eduquest_recent_history_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 5);
        }
      }
    } catch {}
    const initialSamples = SAMPLE_LESSONS.slice(0, 3).map((l) => ({
      id: `lesson:${l.id}`,
      type: "lesson" as const,
      title: l.title,
      subtitle: `${l.bookName} • ${l.grade}`,
      tabId: "review",
      lessonId: l.id,
      accessedAt: "Gần đây"
    }));
    return [
      {
        id: "tab:dashboard",
        type: "tab",
        title: "Trang chủ",
        subtitle: "Tổng quan tiến độ và nhiệm vụ",
        tabId: "dashboard",
        accessedAt: "Vừa xong"
      },
      {
        id: "tab:quiz",
        type: "tab",
        title: "Luyện đề Trắc nghiệm",
        subtitle: "Kiểm tra theo chủ đề bài học",
        tabId: "quiz",
        accessedAt: "Gần đây"
      },
      ...initialSamples
    ].slice(0, 5);
  });

  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState<boolean>(false);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [helpPreviewTab, setHelpPreviewTab] = useState<string>("dashboard");
  const [generatedShareLink, setGeneratedShareLink] = useState<string>("");
  const [sharedLessonTitle, setSharedLessonTitle] = useState<string>("");
  const [sharedLessonMarker, setSharedLessonMarker] = useState<string>("");
  const [sharedTargetLessonId, setSharedTargetLessonId] = useState<string | null>(null);
  const [shareCopiedState, setShareCopiedState] = useState<boolean>(false);
  const [sharedLessonBadges, setSharedLessonBadges] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("smart_study_shared_lesson_badges_v1");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  interface ContextHelpGuide {
    title: string;
    subtitle: string;
    summary: string;
    steps: { title: string; detail: string }[];
    shortcuts: { keyCombo: string; label: string }[];
    proTip: string;
    quickActions: { label: string; targetTab: string }[];
  }

  const CONTEXT_HELP_GUIDE_MAP: Record<string, ContextHelpGuide> = {
    dashboard: {
      title: "Trang chủ · Tổng quan Học tập",
      subtitle: "Theo dõi tiến độ, chuỗi ngày học (Streak) và nhiệm vụ hằng ngày",
      summary: "Màn hình trung tâm giúp em nắm bắt mục tiêu trong ngày, xem các chủ đề cần củng cố và truy cập nhanh vào bài học gần nhất.",
      steps: [
        { title: "Kiểm tra Nhiệm vụ hằng ngày", detail: "Hoàn thành các mục tiêu đọc bài, làm đề trắc nghiệm hoặc ôn thẻ nhớ để nhận thưởng XP và Xu trí tuệ." },
        { title: "Xem Gợi ý ôn tập thông minh", detail: "Hệ thống tự động phân tích kết quả làm bài để đề xuất các chuyên đề em còn yếu cần ôn lại ngay." },
        { title: "Tiếp tục bài học đang dở", detail: "Nhấn vào thẻ bài học gần nhất hoặc nút 'History' trên thanh công cụ để quay lại đúng nội dung vừa xem." }
      ],
      shortcuts: [
        { keyCombo: "Hover 150ms", label: "Xem chú thích nhanh các nút trên thanh công cụ máy tính" },
        { keyCombo: "Giữ 300ms", label: "Mở chú thích nút điều hướng trên Điện thoại / iPad" },
        { keyCombo: "Help", label: "Mở bảng Hướng dẫn và Phím tắt theo ngữ cảnh màn hình" },
        { keyCombo: "Esc", label: "Đóng nhanh các hộp thoại, Menu hoặc cửa sổ trợ giúp" }
      ],
      proTip: "Duy trì chuỗi ngày học (Streak) liên tục mỗi ngày để nhân đôi tốc độ tích lũy XP và mở khóa cấp độ Linh thú mới!",
      quickActions: [
        { label: "Mở Thư viện Bài học", targetTab: "review" },
        { label: "Vào Luyện đề ngay", targetTab: "quiz" }
      ]
    },
    review: {
      title: "Thư viện Bài học và Đọc sách",
      subtitle: "Hệ thống bài giảng SGK, công thức Toán - KHTN và ghi chú thông minh",
      summary: "Tra cứu bài học theo khối lớp và môn học kèm chế độ đọc tập trung.",
      steps: [
        { title: "Lọc bài học theo Môn và Khối lớp", detail: "Sử dụng thanh bộ lọc hoặc ô tìm kiếm để tìm nhanh bài giảng theo chương trình SGK của em." },
        { title: "Đọc bài và Ghi chú trực tiếp", detail: "Nhấn vào một bài học để mở trình đọc chi tiết, xem sơ đồ tóm tắt và lưu lại ghi chú quan trọng." },
        { title: "Luyện tập ngay sau khi đọc", detail: "Từ trong bài học, nhấn nút làm Trắc nghiệm hoặc mở Flashcard để khắc sâu kiến thức vừa đọc." }
      ],
      shortcuts: [
        { keyCombo: "Share", label: "Tạo và sao chép liên kết chia sẻ nhanh bài học đang mở" },
        { keyCombo: "History", label: "Chuyển nhanh giữa 5 bài học và mục vừa truy cập gần đây" },
        { keyCombo: "Chế độ Tập trung", label: "Ẩn thanh công cụ để mở rộng tối đa không gian đọc bài" },
        { keyCombo: "Esc", label: "Thoát hộp thoại hoặc đóng bảng tra cứu nhanh" }
      ],
      proTip: "Sau khi đọc xong lý thuyết một bài, hãy bấm tạo đề trắc nghiệm ngay để ghi nhớ lâu hơn gấp 3 lần!",
      quickActions: [
        { label: "Tự soạn bài học AI", targetTab: "learn" },
        { label: "Xem Bản đồ Tri thức", targetTab: "knowledge-map" }
      ]
    },
    quiz: {
      title: "Luyện đề Trắc nghiệm Thông minh",
      subtitle: "Rèn kỹ năng giải đề theo chủ đề với lời giải chi tiết từng câu",
      summary: "Hệ thống câu hỏi trắc nghiệm bám sát bài học, tự động chấm điểm, giải thích đáp án và thưởng pháo hoa khi đạt 100%.",
      steps: [
        { title: "Chọn chủ đề hoặc bài học cần kiểm tra", detail: "Chọn đề có sẵn trong thư viện hoặc tạo đề mới từ bài học em đang ôn tập." },
        { title: "Làm bài và Theo dõi thời gian", detail: "Đọc kỹ câu hỏi, chọn đáp án đúng nhất và kiểm tra tiến độ câu hỏi trên thanh trạng thái." },
        { title: "Xem giải thích chi tiết sau khi nộp", detail: "Đọc kỹ phần phân tích vì sao đáp án đúng/sai để tránh lặp lại lỗi nhầm lẫn trong kỳ thi thật." }
      ],
      shortcuts: [
        { keyCombo: "Chọn đáp án", label: "Nhấn trực tiếp vào phương án A, B, C, D trong câu hỏi" },
        { keyCombo: "Nộp bài", label: "Chấm điểm tức thì và lưu lịch sử phân tích lỗ hổng kiến thức" },
        { keyCombo: "Đạt 100%", label: "Kích hoạt pháo hoa chúc mừng và nhận thưởng tối đa XP + Xu" },
        { keyCombo: "Esc", label: "Đóng bảng trợ giúp để quay lại bài thi" }
      ],
      proTip: "Những câu làm sai sẽ được hệ thống ghi nhận vào mục 'Chủ đề cần củng cố' ở Trang chủ để em ôn lại đúng trọng tâm.",
      quickActions: [
        { label: "Ôn lại bằng Flashcard", targetTab: "flashcards" },
        { label: "Thử sức Đấu trường PK", targetTab: "pk" }
      ]
    },
    flashcards: {
      title: "Flashcard · Thẻ nhớ Ngắt quãng",
      subtitle: "Ghi nhớ từ vựng, định nghĩa và công thức bằng phương pháp lặp lại ngắt quãng",
      summary: "Lật thẻ mặt trước (câu hỏi/thuật ngữ) và mặt sau (đáp án/giải thích) để tự đánh giá mức độ thuộc bài nhanh chóng.",
      steps: [
        { title: "Đọc câu hỏi ở mặt trước thẻ", detail: "Tự nhẩm câu trả lời hoặc công thức trong đầu trước khi chạm vào thẻ để lật mặt sau." },
        { title: "Chạm để lật thẻ đối chiếu đáp án", detail: "Kiểm tra đáp án chính xác kèm ví dụ minh họa ngắn gọn ở mặt sau của thẻ." },
        { title: "Đánh dấu mức độ ghi nhớ", detail: "Phân loại thẻ 'Đã thuộc' hoặc 'Cần ôn lại' để hệ thống ưu tiên nhắc lại các thẻ khó." }
      ],
      shortcuts: [
        { keyCombo: "Click / Chạm", label: "Lật mặt trước / mặt sau của thẻ nhớ Flashcard" },
        { keyCombo: "Chuyển thẻ", label: "Đi tới thẻ trước hoặc thẻ tiếp theo trong bộ ôn tập" },
        { keyCombo: "Trộn thẻ", label: "Xáo trộn thứ tự thẻ để tránh học vẹt theo vị trí" },
        { keyCombo: "Esc", label: "Đóng cửa sổ hướng dẫn" }
      ],
      proTip: "Ôn Flashcard 5–10 phút mỗi tối trước khi đi ngủ giúp não bộ chuyển kiến thức từ trí nhớ ngắn hạn sang dài hạn hiệu quả nhất.",
      quickActions: [
        { label: "Kiểm tra bằng Trắc nghiệm", targetTab: "quiz" },
        { label: "Về Thư viện Bài học", targetTab: "review" }
      ]
    },
    pk: {
      title: "Đấu trường Khiêu chiến Boss và Bot AI",
      subtitle: "Thi đấu tốc độ trả lời câu hỏi cùng Boss và Bot AI để rèn bản lĩnh phòng thi",
      summary: "Chế độ thi đấu tính giờ với hệ thống Boss và Bot AI đa cấp độ, yêu cầu cả độ chính xác lẫn tốc độ phản xạ để giành chiến thắng và leo hạng Bảng vàng.",
      steps: [
        { title: "Chọn Boss / Bot AI và bắt đầu trận đấu", detail: "Chọn Boss hoặc Bot AI theo cấp độ khó và trả lời chuỗi câu hỏi nhanh thuộc chương trình lớp của em." },
        { title: "Trả lời nhanh để tích điểm Combo", detail: "Trả lời đúng liên tiếp trong thời gian ngắn để vượt qua tốc độ giải đề của Boss AI." },
        { title: "Hạ gục Boss AI và nhận thưởng", detail: "Xem tỷ số chung cuộc trước Boss/Bot AI, nhận điểm XP cộng thêm và thăng hạng." }
      ],
      shortcuts: [
        { keyCombo: "Phản xạ nhanh", label: "Trả lời càng sớm trong khung giờ vàng càng được cộng nhiều điểm" },
        { keyCombo: "Combo liên tiếp", label: "Giữ chuỗi trả lời đúng để kích hoạt điểm thưởng bứt phá" },
        { keyCombo: "XP Header", label: "Nhấn vào huy hiệu XP trên thanh công cụ để xem Bảng xếp hạng" },
        { keyCombo: "Esc", label: "Đóng hộp thoại trợ giúp" }
      ],
      proTip: "Đọc lướt từ khóa quan trọng trong câu hỏi trước khi nhìn 4 đáp án để tiết kiệm 2–3 giây quý giá trước Boss AI!",
      quickActions: [
        { label: "Xem Bảng vàng Danh dự", targetTab: "leaderboard" },
        { label: "Luyện đề chuẩn bị đấu Boss", targetTab: "quiz" }
      ]
    },
    podcast: {
      title: "Podcast Học tập · Đối thoại Minh và Lan",
      subtitle: "Nghe giảng bài sinh động qua cuộc trò chuyện tự nhiên, dễ hiểu",
      summary: "Biến kiến thức sách giáo khoa khô khan thành cuộc trò chuyện thú vị giữa hai nhân vật Minh và Lan, có thể vừa nghe vừa xem phụ đề.",
      steps: [
        { title: "Chọn tập Podcast theo chủ đề bài học", detail: "Duyệt danh sách các tập phát sóng phù hợp với môn học và bài giảng em quan tâm." },
        { title: "Điều khiển phát/tạm dừng và theo dõi lời thoại", detail: "Bấm Play để nghe đối thoại, theo dõi nội dung văn bản đồng bộ và ghi nhớ ý chính." },
        { title: "Nghe thu nhỏ (Mini Player) khi chuyển trang", detail: "Em có thể vừa nghe Podcast vừa chuyển sang đọc bài hoặc xem trang khác nhờ trình phát thu nhỏ." }
      ],
      shortcuts: [
        { keyCombo: "Play / Pause", label: "Phát hoặc tạm dừng nhanh tập Podcast đang mở" },
        { keyCombo: "Mini Player", label: "Tự động duy trì âm thanh ở góc màn hình khi chuyển sang tab khác" },
        { keyCombo: "Hoàn thành tập", label: "Nhận ngay phần thưởng XP và Xu trí tuệ khi nghe trọn vẹn" },
        { keyCombo: "Esc", label: "Đóng bảng hướng dẫn" }
      ],
      proTip: "Hãy nghe Podcast trước khi đọc bài mới để nắm bức tranh tổng thể, hoặc nghe lại khi thư giãn để ôn bài nhẹ nhàng!",
      quickActions: [
        { label: "Mở Bài học liên quan", targetTab: "review" },
        { label: "Làm Trắc nghiệm củng cố", targetTab: "quiz" }
      ]
    },
    shop: {
      title: "Cửa hàng Đổi quà và Trang phục Linh thú",
      subtitle: "Sử dụng Xu trí tuệ tích lũy từ việc học để mua vật phẩm yêu thích",
      summary: "Đổi Xu thưởng lấy trang phục, phụ kiện độc đáo cho Linh thú đồng hành hoặc các vật phẩm hỗ trợ học tập.",
      steps: [
        { title: "Kiểm tra số dư Xu trí tuệ", detail: "Xem tổng số Xu hiện có ở góc trên bên phải thanh công cụ hoặc ngay đầu trang Cửa hàng." },
        { title: "Chọn trang phục hoặc vật phẩm", detail: "Duyệt các bộ sưu tập trang phục Linh thú và xem trước hiệu ứng hiển thị." },
        { title: "Mua và Trang bị ngay", detail: "Nhấn đổi vật phẩm và bấm 'Trang bị' để diện mạo mới xuất hiện trên Avatar khắp hệ thống." }
      ],
      shortcuts: [
        { keyCombo: "Nút Xu (thanh trên)", label: "Nhấn trực tiếp vào số Xu trên thanh công cụ để mở nhanh Cửa hàng" },
        { keyCombo: "Trang bị", label: "Áp dụng ngay trang phục đã sở hữu cho Linh thú trên thanh Header" },
        { keyCombo: "Kiếm thêm Xu", label: "Hoàn thành nhiệm vụ ngày, nghe Podcast hoặc đạt điểm cao Quiz" },
        { keyCombo: "Esc", label: "Đóng cửa sổ hướng dẫn" }
      ],
      proTip: "Hoàn thành đủ nhiệm vụ hằng ngày ở Trang chủ là cách nhanh nhất để tích lũy Xu mua các bộ trang phục hiếm!",
      quickActions: [
        { label: "Xem Hồ sơ và Linh thú", targetTab: "profile" },
        { label: "Làm nhiệm vụ kiếm Xu", targetTab: "dashboard" }
      ]
    },
    "knowledge-map": {
      title: "Bản đồ Tri thức Trực quan",
      subtitle: "Khám phá mối liên hệ giữa các chương, chuyên đề và bài học",
      summary: "Hiển thị toàn bộ chương trình học dưới dạng sơ đồ cây trực quan giúp em biết mình đã chinh phục được những nhánh kiến thức nào.",
      steps: [
        { title: "Quan sát tổng thể các nhánh chuyên đề", detail: "Các nút màu sáng thể hiện bài đã hoàn thành, các nút đang mở khóa là bài tiếp theo nên học." },
        { title: "Nhấn vào từng nút kiến thức", detail: "Xem tóm tắt nhanh nội dung chuyên đề, mức độ thành thạo và liên kết đến bài giảng gốc." },
        { title: "Học theo lộ trình kết nối", detail: "Đi từ kiến thức nền tảng đến nâng cao để không bị hổng gốc." }
      ],
      shortcuts: [
        { keyCombo: "Chọn nút sơ đồ", label: "Mở thông tin chi tiết và đi tới bài học tương ứng" },
        { keyCombo: "Lọc môn học", label: "Chuyển đổi sơ đồ tri thức giữa các môn học khác nhau" },
        { keyCombo: "Esc", label: "Đóng cửa sổ hướng dẫn" }
      ],
      proTip: "Trước mỗi kỳ thi học kỳ, hãy mở Bản đồ Tri thức để rà soát xem còn nhánh nào chưa chuyển sang trạng thái hoàn thành!",
      quickActions: [
        { label: "Quay lại Thư viện Bài học", targetTab: "review" },
        { label: "Kiểm tra Trắc nghiệm", targetTab: "quiz" }
      ]
    },
    learn: {
      title: "Tự học và Soạn Bài giảng Thông minh",
      subtitle: "Tạo bài học mới, tóm tắt trọng tâm và sinh bộ câu hỏi tự động",
      summary: "Công cụ giúp em tự nhập chủ đề hoặc nội dung cần tìm hiểu để hệ thống biên soạn thành bài giảng có cấu trúc rõ ràng.",
      steps: [
        { title: "Nhập tên bài học hoặc nội dung cần tóm tắt", detail: "Điền chủ đề, chọn môn học và khối lớp tương ứng trong biểu mẫu soạn bài." },
        { title: "Tạo bài giảng và câu hỏi ôn tập", detail: "Hệ thống tự động trình bày lý thuyết trọng tâm, công thức và ví dụ minh họa dễ hiểu." },
        { title: "Lưu vào Thư viện cá nhân", detail: "Bài học sau khi tạo sẽ được lưu vào Thư viện để em đọc lại bất cứ lúc nào cả khi ngoại tuyến." }
      ],
      shortcuts: [
        { keyCombo: "Soạn nhanh", label: "Tự động chuẩn hóa công thức Toán học và định dạng Markdown" },
        { keyCombo: "Lưu tự động", label: "Bài học mới được đồng bộ vào Thư viện cá nhân" },
        { keyCombo: "Esc", label: "Đóng bảng hướng dẫn" }
      ],
      proTip: "Em có thể dán đoạn ghi chép trên lớp vào đây để hệ thống hệ thống hóa lại thành dàn ý ôn thi mạch lạc!",
      quickActions: [
        { label: "Xem Thư viện Bài học", targetTab: "review" },
        { label: "Luyện Tự luận AI", targetTab: "essay" }
      ]
    },
    reading: {
      title: "Luyện Đọc hiểu Ngữ liệu",
      subtitle: "Rèn kỹ năng phân tích văn bản và trả lời câu hỏi đọc hiểu chuẩn cấu trúc đề thi",
      summary: "Cung cấp các đoạn trích văn học, nghị luận, thông tin kèm hệ thống câu hỏi nhận biết, thông hiểu và vận dụng.",
      steps: [
        { title: "Đọc kỹ văn bản ngữ liệu", detail: "Chú ý các từ khóa, biện pháp tu từ, luận điểm chính và xuất xứ của đoạn trích." },
        { title: "Trả lời lần lượt các câu hỏi đọc hiểu", detail: "Bám sát nội dung văn bản để trả lời ngắn gọn, đúng trọng tâm từng vế câu hỏi." },
        { title: "Đối chiếu gợi ý đáp án chuẩn", detail: "So sánh bài làm của em với hướng dẫn chấm để rút kinh nghiệm cách trình bày đạt điểm tối đa." }
      ],
      shortcuts: [
        { keyCombo: "Đánh dấu ý chính", label: "Quan sát kỹ câu chủ đề ở đầu hoặc cuối đoạn văn" },
        { keyCombo: "Xem gợi ý", label: "Mở hướng dẫn giải chi tiết cho từng mức độ câu hỏi" },
        { keyCombo: "Esc", label: "Đóng cửa sổ hướng dẫn" }
      ],
      proTip: "Với câu hỏi nêu tác dụng biện pháp tu từ, hãy luôn trả lời đủ 2 ý: tác dụng gợi hình/gợi cảm và thái độ của tác giả!",
      quickActions: [
        { label: "Chuyển sang Luyện Tự luận", targetTab: "essay" },
        { label: "Về Thư viện Bài học", targetTab: "review" }
      ]
    },
    essay: {
      title: "Luyện Viết Tự luận và Chấm chữa Chi tiết",
      subtitle: "Thực hành viết đoạn văn, bài văn và lời giải tự luận có nhận xét từng tiêu chí",
      summary: "Giúp em rèn kỹ năng lập dàn ý, diễn đạt mạch lạc và nhận phản hồi chi tiết về bố cục, lập luận cũng như cách dùng từ.",
      steps: [
        { title: "Chọn đề bài tự luận muốn rèn luyện", detail: "Đọc kỹ yêu cầu đề bài, xác định kiểu bài (nghị luận xã hội, nghị luận văn học, tự luận môn học)." },
        { title: "Lập dàn ý và viết bài vào khung soạn thảo", detail: "Triển khai đầy đủ Mở đoạn/Mở bài, Thân bài và Kết bài theo gợi ý cấu trúc." },
        { title: "Nộp bài để nhận nhận xét và điểm số", detail: "Xem đánh giá ưu điểm, hạn chế cần khắc phục và bài viết mẫu tham khảo." }
      ],
      shortcuts: [
        { keyCombo: "Gợi ý dàn ý", label: "Xem sườn ý chính trước khi bắt đầu viết bài" },
        { keyCombo: "Chấm chữa AI", label: "Phân tích chi tiết theo thang điểm tiêu chí chuẩn" },
        { keyCombo: "Esc", label: "Đóng cửa sổ hướng dẫn" }
      ],
      proTip: "Dành 3 phút đầu lập dàn ý 3–4 gạch đầu dòng sẽ giúp bài viết của em không bao giờ bị lạc đề hay thiếu ý!",
      quickActions: [
        { label: "Luyện Đọc hiểu Ngữ liệu", targetTab: "reading" },
        { label: "Về Thư viện Bài học", targetTab: "review" }
      ]
    },
    leaderboard: {
      title: "Bảng vàng Danh dự",
      subtitle: "Vinh danh những học sinh chăm chỉ có điểm XP và thành tích xuất sắc nhất",
      summary: "Theo dõi thứ hạng của em so với bạn bè đồng trang lứa để có thêm động lực chinh phục các cột mốc học tập mới.",
      steps: [
        { title: "Xem Top 3 dẫn đầu và vị trí của em", detail: "Quan sát bảng xếp hạng tổng điểm XP, cấp độ Linh thú và chuỗi ngày học." },
        { title: "Tích lũy thêm XP từ hoạt động học tập", detail: "Đọc bài, giải đề trắc nghiệm, nghe Podcast và chiến thắng Đấu trường PK để tăng hạng." },
        { title: "Cập nhật tên hiển thị và Linh thú đại diện", detail: "Vào mục Hồ sơ cá nhân để chỉnh sửa biệt danh và trang phục xuất hiện trên Bảng vàng." }
      ],
      shortcuts: [
        { keyCombo: "Nút XP (thanh trên)", label: "Mở nhanh Bảng vàng từ bất kỳ màn hình nào" },
        { keyCombo: "Đấu trường PK", label: "Cách bứt phá điểm XP nhanh nhất để leo Top" },
        { keyCombo: "Esc", label: "Đóng cửa sổ hướng dẫn" }
      ],
      proTip: "Mỗi bài kiểm tra đạt điểm tuyệt đối 100% đều mang lại lượng XP thưởng lớn giúp em thăng hạng nhanh chóng!",
      quickActions: [
        { label: "Vào Đấu trường PK kiếm XP", targetTab: "pk" },
        { label: "Cập nhật Hồ sơ cá nhân", targetTab: "profile" }
      ]
    },
    "parent-teacher": {
      title: "Góc Phụ huynh và Thầy cô",
      subtitle: "Báo cáo thống kê chi tiết tiến độ, điểm số và phân tích năng lực học sinh",
      summary: "Cung cấp biểu đồ trực quan về thời lượng học, điểm trung bình các môn, danh sách chuyên đề mạnh/yếu và công cụ giao nhiệm vụ.",
      steps: [
        { title: "Xem báo cáo tổng quan năng lực", detail: "Theo dõi số bài đã học, tỷ lệ chính xác khi làm đề và mức độ chuyên cần trong tuần." },
        { title: "Phân tích chuyên đề cần hỗ trợ", detail: "Xác định rõ các chủ đề học sinh hay sai để thầy cô hoặc phụ huynh kịp thời kèm cặp." },
        { title: "Giao bài tập hoặc mục tiêu mới", detail: "Thiết lập nhiệm vụ ôn tập trọng tâm giúp học sinh tiến bộ đều ở mọi môn." }
      ],
      shortcuts: [
        { keyCombo: "Thống kê Quiz", label: "Dữ liệu tự động tổng hợp từ toàn bộ lịch sử làm bài" },
        { keyCombo: "Chia sẻ bài học", label: "Dùng nút Share trên Header để gửi link bài học trực tiếp cho học sinh" },
        { keyCombo: "Esc", label: "Đóng cửa sổ hướng dẫn" }
      ],
      proTip: "Phụ huynh và thầy cô có thể dùng nút 'Share' trên thanh công cụ để gửi trực tiếp liên kết một bài học cụ thể cho học sinh ôn tập!",
      quickActions: [
        { label: "Xem Trang chủ Học sinh", targetTab: "dashboard" },
        { label: "Mở Thư viện Bài học", targetTab: "review" }
      ]
    },
    profile: {
      title: "Hồ sơ Cá nhân và Linh thú Đồng hành",
      subtitle: "Quản lý thông tin tài khoản, khối lớp, cấp độ tiến hóa Linh thú và đồng bộ đám mây",
      summary: "Nơi cá nhân hóa trải nghiệm học tập của em: đổi tên hiển thị, chọn khối lớp, chăm sóc Linh thú và sao lưu dữ liệu.",
      steps: [
        { title: "Cập nhật Tên hiển thị và Khối lớp", detail: "Chọn đúng khối lớp để hệ thống gợi ý bài giảng và đề thi phù hợp nhất với em." },
        { title: "Theo dõi tiến hóa Linh thú", detail: "Khi tích lũy đủ XP và lên cấp (Level), Linh thú đồng hành sẽ tiến hóa sang hình thái mới rực rỡ hơn." },
        { title: "Đồng bộ tài khoản Google", detail: "Đăng nhập để lưu trữ toàn bộ điểm số, bài học và vật phẩm an toàn trên mọi thiết bị." }
      ],
      shortcuts: [
        { keyCombo: "Avatar Header", label: "Nhấn vào góc phải thanh công cụ để mở nhanh Hồ sơ cá nhân" },
        { keyCombo: "Đổi trang phục", label: "Mở Cửa hàng Đổi quà để mua và trang bị phụ kiện mới" },
        { keyCombo: "Esc", label: "Đóng cửa sổ hướng dẫn" }
      ],
      proTip: "Hãy đăng nhập tài khoản để không bao giờ bị mất chuỗi ngày học (Streak) và bộ sưu tập Linh thú khi đổi máy!",
      quickActions: [
        { label: "Vào Cửa hàng Đổi quà", targetTab: "shop" },
        { label: "Xem Bảng vàng Danh dự", targetTab: "leaderboard" }
      ]
    },
    games: {
      title: "Khu vực Trò chơi và Thư mục Sandbox",
      subtitle: "Hệ thống thư mục game học tập và môi trường kiểm thử trò chơi mới",
      summary: "Nơi duyệt các thư mục trò chơi theo chủ đề, tạo thư mục game mới và bật Chế độ Test để kiểm tra điểm số, kỷ lục và phần thưởng.",
      steps: [
        { title: "Chọn thư mục trò chơi", detail: "Duyệt theo thư mục Toán học, Thuật ngữ, Trí nhớ hoặc Thư mục Sandbox đang thử nghiệm." },
        { title: "Chơi ngay hoặc bật Chế độ Test", detail: "Nhấn 'Chơi ngay' để trải nghiệm chuẩn hoặc 'Chế độ Test' để mở thanh công cụ Debug và nhật ký sự kiện." },
        { title: "Tạo thư mục và bản nháp game mới", detail: "Sử dụng nút Tạo thư mục mới hoặc Thêm Game Test mới để mở rộng dần kho trò chơi của dự án." }
      ],
      shortcuts: [
        { keyCombo: "Chế độ Test", label: "Bật bảng điều khiển kiểm thử và xem log sự kiện trực tiếp" },
        { keyCombo: "Cấu trúc code", label: "Xem hướng dẫn thêm thư mục mới trong /src/games/" },
        { keyCombo: "Esc", label: "Đóng bảng hướng dẫn" }
      ],
      proTip: "Khi phát triển game mới, hãy nhân bản thư mục /src/games/sandbox-template/ và khai báo trong registry.ts để có sẵn kết nối XP và Xu!",
      quickActions: [
        { label: "Vào Đấu trường PK", targetTab: "pk" },
        { label: "Cửa hàng Đổi quà", targetTab: "shop" }
      ]
    }
  };

  const recordRecentAccess = (entry: Omit<RecentAccessedItem, "accessedAt">) => {
    const nowStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setRecentAccessedItems((prev) => {
      const filtered = prev.filter((item) => item.id !== entry.id);
      const updated = [{ ...entry, accessedAt: nowStr }, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("eduquest_recent_history_v1", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSelectLesson = (lesson: Lesson) => {
    recordRecentAccess({
      id: `lesson:${lesson.id}`,
      type: "lesson",
      title: lesson.title,
      subtitle: `${lesson.bookName} • ${lesson.grade}`,
      tabId: "review",
      lessonId: lesson.id
    });
    setIsLessonFocusDimmed(true);
    if ('startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        setSelectedLesson(lesson);
        setActiveTab("review");
      });
    } else {
      setSelectedLesson(lesson);
      setActiveTab("review");
    }
  };

  // Tự động mở bài học nếu URL có tham số chia sẻ ?lessonId=... hoặc ?lesson=... (R10)
  const handledDeepLinkRef = React.useRef<string | null>(null);
  const deepLinkWaitedRef = React.useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUrlLessonDeepLink = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const rawLessonParam =
          params.get("lessonId") ||
          params.get("lesson") ||
          params.get("share") ||
          (window.location.hash.startsWith("#lesson-") ? window.location.hash.slice(1) : "");
        if (!rawLessonParam) return;

        // Cho phép khách truy cập trực tiếp link bài học mà không bị chặn bởi cổng đăng nhập
        setIsGuestSession(true);
        try {
          sessionStorage.setItem("smartstudy_guest_mode", "true");
        } catch {}

        const pool = lessons.length > 0 ? [...lessons, ...SAMPLE_LESSONS] : SAMPLE_LESSONS;
        const cleanId = rawLessonParam.replace(/^lesson-/, "").split("-")[0];
        const markerLabel = rawLessonParam.startsWith("lesson-")
          ? rawLessonParam.split("-").slice(0, 2).join("-")
          : `lesson-${cleanId}`;

        const target = pool.find(
          (l) =>
            String(l.id) === String(rawLessonParam) ||
            String(l.id) === String(cleanId) ||
            `lesson-${l.id}` === String(rawLessonParam)
        );

        if (handledDeepLinkRef.current === rawLessonParam) return;

        if (target) {
          handledDeepLinkRef.current = rawLessonParam;
          markLessonAsSharedLink(target.id, markerLabel);
          setSelectedLesson(target);
          setActiveTab("review");
        } else if (lessons.length > 0 || deepLinkWaitedRef.current) {
          handledDeepLinkRef.current = rawLessonParam;
          setSelectedLesson(null);
          setActiveTab("review");
          triggerSuccessMessage("Không tìm thấy bài học trong liên kết. Bạn đang ở Thư viện bài học.");
        }
      } catch {}
    };

    handleUrlLessonDeepLink();
    // Lessons may still be loading on first run: decide "not found" after a short wait
    const notFoundTimer = window.setTimeout(() => {
      deepLinkWaitedRef.current = true;
      handleUrlLessonDeepLink();
    }, 2500);
    window.addEventListener("popstate", handleUrlLessonDeepLink);
    return () => {
      window.clearTimeout(notFoundTimer);
      window.removeEventListener("popstate", handleUrlLessonDeepLink);
    };
  }, [lessons.length]);

  const currentActiveLessonForShare =
    (sharedTargetLessonId ? lessons.find((l) => l.id === sharedTargetLessonId) || SAMPLE_LESSONS.find((l) => l.id === sharedTargetLessonId) : null) ||
    selectedLesson ||
    lessons.find((l) => l.id === quizSession?.lessonId) ||
    lessons[0] ||
    SAMPLE_LESSONS[0];

  const handleSelectLessonInSharePopover = (lesson: Lesson) => {
    const { shareUrl, normalizedId, markerTag } = buildStudyShareLink(lesson);
    setSharedTargetLessonId(lesson.id);
    setGeneratedShareLink(shareUrl);
    setSharedLessonTitle(lesson.title);
    setSharedLessonMarker(normalizedId);
    setShareCopiedState(false);
    markLessonAsSharedLink(lesson.id, normalizedId);
    try {
      window.history.replaceState(null, "", `${window.location.pathname}?lesson=${encodeURIComponent(normalizedId)}#${markerTag}`);
    } catch {}
  };

  const handleTriggerHeaderShare = () => {
    const activeLesson = currentActiveLessonForShare;
    let link = PUBLIC_SHARE_BASE_URL;
    let title = "Bài học SmartStudy";
    let marker = "lesson-smart-study";
    if (activeLesson) {
      const built = buildStudyShareLink(activeLesson);
      link = built.shareUrl;
      title = activeLesson.title;
      marker = built.normalizedId;
      setSharedTargetLessonId(activeLesson.id);
      markLessonAsSharedLink(activeLesson.id, built.normalizedId);
      try {
        window.history.replaceState(null, "", `${window.location.pathname}?lesson=${encodeURIComponent(built.normalizedId)}#${built.markerTag}`);
      } catch {}
    }
    setGeneratedShareLink(link);
    setSharedLessonTitle(title);
    setSharedLessonMarker(marker);
    setIsSharePopoverOpen((prev) => !prev);
    setIsHistoryDropdownOpen(false);
    setIsHelpModalOpen(false);
    setIsQuickNoteOpen(false);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(link).then(() => {
          setShareCopiedState(true);
          setTimeout(() => setShareCopiedState(false), 2500);
        }).catch(() => {});
      }
    } catch {}
    triggerSuccessMessage(`Đã tạo liên kết chia sẻ (#${marker}) cho bài học "${title}"!`);
  };

  // Trạng thái & Lưu trữ 'Quick Notes' (Ghi chú nhanh ngay trên thanh công cụ vào localStorage riêng biệt)
  interface QuickNoteEntry {
    id: string;
    content: string;
    contextLabel: string;
    createdAt: string;
  }

  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState<boolean>(false);
  const [quickNoteDraft, setQuickNoteDraft] = useState<string>(() => {
    try {
      return localStorage.getItem("smart_study_quick_note_draft_v1") || "";
    } catch {
      return "";
    }
  });
  const [currentAsciiThemeId, setCurrentAsciiThemeId] = useState<string>(() => {
    try {
      return localStorage.getItem("active_ascii_theme") || "lagoon";
    } catch {
      return "lagoon";
    }
  });
  const [asciiMenuSortBy, setAsciiMenuSortBy] = useState<
    "mood-priority" | "mood" | "alphabetical" | "newest" | "popularity"
  >(() => {
    try {
      const savedSort = localStorage.getItem("smart_study_ascii_menu_sort_v1");
      if (
        savedSort === "mood-priority" ||
        savedSort === "alphabetical" ||
        savedSort === "newest" ||
        savedSort === "popularity" ||
        savedSort === "mood"
      ) {
        return savedSort;
      }
    } catch {}
    return "mood-priority";
  });
  const [asciiMenuMoodInput, setAsciiMenuMoodInput] = useState<string>(() => {
    try {
      return localStorage.getItem("smart_study_ascii_menu_mood_v1") || "";
    } catch {
      return "";
    }
  });

  const SPOTLIGHT_MENU_WEAPONS = React.useMemo(
    () => [
      {
        id: "kunai",
        themeId: "lagoon",
        name: "Phi Bút · Kunai",
        tier: "Cơ bản",
        damage: 160,
        crit: "15%",
        critValue: 15,
        range: 250,
        evoName: "Bút Thần Tốc",
        desc: "Tự ngắm mục tiêu gần nhất, tốc độ phóng liên hoàn ổn định."
      },
      {
        id: "katana",
        themeId: "claude",
        name: "Kiếm Giấy · Katana",
        tier: "Cận chiến",
        damage: 280,
        crit: "18%",
        critValue: 18,
        range: 120,
        evoName: "Kiếm Gấp Hạc Đỏ",
        desc: "Chém vòng cung cận chiến sát thương cao, tiến hóa hút máu."
      },
      {
        id: "revolver",
        themeId: "clouds",
        name: "Súng Phấn · Revolver",
        tier: "Xạ thủ",
        damage: 330,
        crit: "25%",
        critValue: 25,
        range: 330,
        evoName: "Pháo Phấn Sao",
        desc: "Đạn phấn tầm xa tốc độ cao, tỉ lệ chí mạng vượt trội."
      },
      {
        id: "shotgun",
        themeId: "aurora",
        name: "Súng Bắn Ghim · Shotgun",
        tier: "Tầm trung",
        damage: 240,
        crit: "12%",
        critValue: 12,
        range: 230,
        evoName: "Đại Bác Ghim",
        desc: "Bắn chùm ghim đẩy lùi đám đông, tiến hóa súng máy liên thanh."
      },
      {
        id: "bat",
        themeId: "sakura",
        name: "Thước Gỗ · Heavy Bat",
        tier: "Đấu sĩ",
        damage: 350,
        crit: "10%",
        critValue: 10,
        range: 170,
        evoName: "Thước Kim Loại",
        desc: "Đập quét diện rộng đẩy lùi quái, tiến hóa xoay 360 độ."
      },
      {
        id: "lightchaser",
        themeId: "cyber-matrix",
        name: "Lưỡi Quang Phổ [S]",
        tier: "Hạng S",
        damage: 300,
        crit: "22%",
        critValue: 22,
        range: 260,
        evoName: "Kiếm Ánh Sáng Vĩnh Cửu",
        desc: "Phóng sóng kiếm 7 màu xuyên thấu, để lại kiếm trận sáng."
      },
      {
        id: "void",
        themeId: "synthwave",
        name: "Giọt Mực Hư Không [S]",
        tier: "Hạng S",
        damage: 260,
        crit: "16%",
        critValue: 16,
        range: 210,
        evoName: "Hố Đen Mực Đặc",
        desc: "Tạo hố đen hút quái vào tâm rồi phát nổ kèm khiên chắn."
      },
      {
        id: "disorder",
        themeId: "solar-flare",
        name: "Kiếm Từ Đỏ [S]",
        tier: "Hạng S",
        damage: 310,
        crit: "20%",
        critValue: 20,
        range: 280,
        evoName: "Ngôi Sao Hỗn Loạn",
        desc: "Kiếm bay tự tìm địch, đánh dấu nổ dây chuyền cực mạnh."
      },
      {
        id: "twinlance",
        themeId: "deep-cosmos",
        name: "Song Thương Compa [SS]",
        tier: "Hạng SS",
        damage: 400,
        crit: "28%",
        critValue: 28,
        range: 300,
        evoName: "Thương Sao Đôi Vũ Trụ",
        desc: "Vũ khí tối thượng kết hợp tia sáng kim và xoáy mực đen."
      }
    ],
    []
  );

  const [selectedMenuWeaponId, setSelectedMenuWeaponId] = useState<string>(() => {
    try {
      return localStorage.getItem("smart_study_spotlight_weapon_v1") || "twinlance";
    } catch {
      return "twinlance";
    }
  });

  const selectedMenuWeapon = React.useMemo(
    () =>
      SPOTLIGHT_MENU_WEAPONS.find((w) => w.id === selectedMenuWeaponId) ||
      SPOTLIGHT_MENU_WEAPONS.find((w) => w.themeId === currentAsciiThemeId) ||
      SPOTLIGHT_MENU_WEAPONS[0],
    [SPOTLIGHT_MENU_WEAPONS, selectedMenuWeaponId, currentAsciiThemeId]
  );

  const handleSelectMenuWeapon = (weaponId: string) => {
    setSelectedMenuWeaponId(weaponId);
    try {
      localStorage.setItem("smart_study_spotlight_weapon_v1", weaponId);
    } catch {}
  };

  const [asciiMenuMoodTags, setAsciiMenuMoodTags] = useState<AsciiMoodTag[]>(() => {
    try {
      const savedRaw = localStorage.getItem("smart_study_ascii_menu_mood_tags_v1");
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed)) {
          return parsed.filter((t): t is AsciiMoodTag =>
            ALL_ASCII_MOOD_TAGS.includes(t as AsciiMoodTag)
          );
        }
      }
    } catch {}
    return [];
  });

  // Lưu trạng thái Mood, Multi-select Mood Tags & Sort xuống localStorage mỗi khi người dùng thay đổi
  useEffect(() => {
    try {
      localStorage.setItem("smart_study_ascii_menu_mood_v1", asciiMenuMoodInput);
    } catch {}
  }, [asciiMenuMoodInput]);

  useEffect(() => {
    try {
      localStorage.setItem("smart_study_ascii_menu_mood_tags_v1", JSON.stringify(asciiMenuMoodTags));
    } catch {}
  }, [asciiMenuMoodTags]);

  useEffect(() => {
    try {
      localStorage.setItem("smart_study_ascii_menu_sort_v1", asciiMenuSortBy);
    } catch {}
  }, [asciiMenuSortBy]);

  // Tự động khôi phục Mood, Multi-select Tags & Sort đã lưu trong localStorage khi mở lại menu .spotlight-vertical-menu
  useEffect(() => {
    if (!isCompactToolsOpen) return;
    try {
      const savedMood = localStorage.getItem("smart_study_ascii_menu_mood_v1");
      if (savedMood !== null && savedMood !== asciiMenuMoodInput) {
        setAsciiMenuMoodInput(savedMood);
      }
      const savedTagsRaw = localStorage.getItem("smart_study_ascii_menu_mood_tags_v1");
      if (savedTagsRaw) {
        const parsed = JSON.parse(savedTagsRaw);
        if (Array.isArray(parsed)) {
          setAsciiMenuMoodTags(
            parsed.filter((t): t is AsciiMoodTag =>
              ALL_ASCII_MOOD_TAGS.includes(t as AsciiMoodTag)
            )
          );
        }
      }
      const savedSort = localStorage.getItem("smart_study_ascii_menu_sort_v1");
      if (
        (savedSort === "mood-priority" ||
          savedSort === "alphabetical" ||
          savedSort === "newest" ||
          savedSort === "popularity" ||
          savedSort === "mood") &&
        savedSort !== asciiMenuSortBy
      ) {
        setAsciiMenuSortBy(savedSort);
      }
    } catch {}
  }, [isCompactToolsOpen]);

  const handleToggleAsciiMenuMoodTag = (tag: AsciiMoodTag) => {
    setAsciiMenuMoodTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const getThemeMoodPriorityScore = React.useCallback(
    (theme: (typeof STUDIO_ASCII_THEMES)[number]) => {
      const query = asciiMenuMoodInput.trim().toLowerCase();
      const tokens = query
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter((s) => s && s !== "all");

      const currentActiveObj =
        STUDIO_ASCII_THEMES.find((t) => t.id === currentAsciiThemeId) || STUDIO_ASCII_THEMES[0];

      let score = 0;

      // 1. Khớp với các nhãn Mood đã lưu trong asciiMenuMoodTags
      asciiMenuMoodTags.forEach((savedTag) => {
        if (theme.emotion === savedTag) score += 20;
        if (theme.moodTags.includes(savedTag)) score += 12;
      });

      // 2. Khớp với từ khóa cảm xúc đã lưu trong asciiMenuMoodInput
      tokens.forEach((tok) => {
        if (theme.emotion.toLowerCase() === tok) score += 18;
        else if (theme.emotion.toLowerCase().includes(tok)) score += 10;
        if (theme.moodTags.some((mt) => mt.toLowerCase() === tok)) score += 12;
        else if (theme.moodTags.some((mt) => mt.toLowerCase().includes(tok))) score += 6;
      });

      // 3. Nếu chưa chọn tag nào, ưu tiên theo cảm xúc của theme đang kích hoạt đã lưu
      if (asciiMenuMoodTags.length === 0 && tokens.length === 0 && currentActiveObj) {
        if (theme.emotion === currentActiveObj.emotion) score += 8;
        const sharedTags = theme.moodTags.filter((t) =>
          currentActiveObj.moodTags.includes(t)
        ).length;
        score += sharedTags * 3;
      }

      return score;
    },
    [asciiMenuMoodInput, asciiMenuMoodTags, currentAsciiThemeId]
  );

  const filteredAndSortedMenuAsciiThemes = React.useMemo(() => {
    const query = asciiMenuMoodInput.trim().toLowerCase();
    const tokens = query
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => s && s !== "all");

    const filtered = STUDIO_ASCII_THEMES.filter((theme) => {
      // Khi ở chế độ 'mood-priority', giữ toàn bộ danh sách để đẩy các theme khớp Mood lên đầu (trừ khi đang gõ tìm kiếm cụ thể)
      if (asciiMenuSortBy !== "mood-priority") {
        const matchesSelectedTags =
          asciiMenuMoodTags.length === 0 ||
          asciiMenuMoodTags.some((tag) => theme.moodTags.includes(tag) || theme.emotion === tag);
        if (!matchesSelectedTags) return false;
      }

      if (tokens.length === 0) return true;
      return tokens.some(
        (tok) =>
          theme.emotion.toLowerCase().includes(tok) ||
          theme.moodTags.some((mt) => mt.toLowerCase().includes(tok)) ||
          theme.moodLabel.toLowerCase().includes(tok) ||
          theme.name.toLowerCase().includes(tok)
      );
    });
    const moodPriority: Record<string, number> = {
      Learning: 1,
      Energy: 2,
      Mystery: 3,
      Calm: 4,
      Cyber: 5,
      Nature: 6,
      Cosmic: 7,
      Warm: 8
    };
    return [...filtered].sort((a, b) => {
      if (asciiMenuSortBy === "mood-priority") {
        const scoreDiff = getThemeMoodPriorityScore(b) - getThemeMoodPriorityScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const fallbackMoodDiff = (moodPriority[a.emotion] || 99) - (moodPriority[b.emotion] || 99);
        if (fallbackMoodDiff !== 0) return fallbackMoodDiff;
        return a.name.localeCompare(b.name);
      }
      if (asciiMenuSortBy === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      if (asciiMenuSortBy === "newest") {
        return STUDIO_ASCII_THEMES.indexOf(b) - STUDIO_ASCII_THEMES.indexOf(a);
      }
      if (asciiMenuSortBy === "popularity") {
        return STUDIO_ASCII_THEMES.indexOf(a) - STUDIO_ASCII_THEMES.indexOf(b);
      }
      // 'mood' sorting category
      const moodDiff = (moodPriority[a.emotion] || 99) - (moodPriority[b.emotion] || 99);
      if (moodDiff !== 0) return moodDiff;
      return a.name.localeCompare(b.name);
    });
  }, [asciiMenuMoodInput, asciiMenuMoodTags, asciiMenuSortBy, getThemeMoodPriorityScore]);

  // Đồng bộ theme ASCII với localStorage để khôi phục chính xác khi tải lại trang
  useEffect(() => {
    try {
      localStorage.setItem("active_ascii_theme", currentAsciiThemeId);
      localStorage.setItem("smartstudy_chat_theme_v1", currentAsciiThemeId);
    } catch {}
  }, [currentAsciiThemeId]);

  useEffect(() => {
    const handleAsciiThemeEvent = (e: any) => {
      if (e?.detail?.themeId) {
        setCurrentAsciiThemeId(e.detail.themeId);
      }
    };
    window.addEventListener("ascii-theme-changed", handleAsciiThemeEvent);
    return () => window.removeEventListener("ascii-theme-changed", handleAsciiThemeEvent);
  }, []);

  const [quickNotes, setQuickNotes] = useState<QuickNoteEntry[]>(() => {
    try {
      const saved = localStorage.getItem("smart_study_quick_notes_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const handleQuickNoteDraftChange = (val: string) => {
    setQuickNoteDraft(val);
    try {
      localStorage.setItem("smart_study_quick_note_draft_v1", val);
    } catch {}
  };

  const {
    isListening: isQuickNoteListening,
    interimTranscript: quickNoteInterim,
    error: quickNoteVoiceError,
    toggleListening: toggleQuickNoteListening,
    stopListening: stopQuickNoteListening,
    clearError: clearQuickNoteVoiceError
  } = useVoiceToText({
    lang: "vi-VN",
    onTranscript: (spokenText) => {
      setQuickNoteDraft((prev) => {
        const trimmed = prev.trim();
        const nextVal = trimmed ? `${trimmed} ${spokenText}` : spokenText;
        try {
          localStorage.setItem("smart_study_quick_note_draft_v1", nextVal);
        } catch {}
        return nextVal;
      });
    }
  });

  useEffect(() => {
    if (!isQuickNoteOpen && isQuickNoteListening) {
      stopQuickNoteListening();
    }
  }, [isQuickNoteOpen, isQuickNoteListening, stopQuickNoteListening]);

  const handleSaveQuickNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isQuickNoteListening) {
      stopQuickNoteListening();
    }
    const combinedDraft = quickNoteInterim
      ? `${quickNoteDraft} ${quickNoteInterim}`.trim()
      : quickNoteDraft.trim();
    if (!combinedDraft) return;

    const nowStr = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit"
    });
    const currentContext = selectedLesson
      ? selectedLesson.title
      : TAB_METADATA_MAP[activeTab]?.title || "Ghi chú học tập";

    const newNote: QuickNoteEntry = {
      id: `qnote-${Date.now()}`,
      content: combinedDraft,
      contextLabel: currentContext,
      createdAt: nowStr
    };

    setQuickNotes((prev) => {
      const next = [newNote, ...prev].slice(0, 30);
      try {
        localStorage.setItem("smart_study_quick_notes_v1", JSON.stringify(next));
      } catch {}
      return next;
    });

    setQuickNoteDraft("");
    try {
      localStorage.removeItem("smart_study_quick_note_draft_v1");
    } catch {}
    triggerSuccessMessage("Đã lưu vào Ghi chú nhanh.");
  };

  const handleDeleteQuickNote = (noteId: string) => {
    setQuickNotes((prev) => {
      const next = prev.filter((n) => n.id !== noteId);
      try {
        localStorage.setItem("smart_study_quick_notes_v1", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleVoiceSaveNote = (customNoteText?: string) => {
    const draftToSave = (customNoteText || quickNoteDraft || "").trim();
    const nowStr = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit"
    });
    const currentContext = selectedLesson
      ? selectedLesson.title
      : TAB_METADATA_MAP[activeTab]?.title || "Ghi chú giọng nói";

    const finalContent =
      draftToSave ||
      (selectedLesson
        ? `Ghi chú nhanh bài học: ${selectedLesson.title} (${nowStr})`
        : `Đánh dấu ghi chú học tập tại ${currentContext} (${nowStr})`);

    const newNote: QuickNoteEntry = {
      id: `qnote-${Date.now()}`,
      content: finalContent,
      contextLabel: currentContext,
      createdAt: nowStr
    };

    setQuickNotes((prev) => {
      const next = [newNote, ...prev].slice(0, 30);
      try {
        localStorage.setItem("smart_study_quick_notes_v1", JSON.stringify(next));
      } catch {}
      return next;
    });

    if (draftToSave && !customNoteText) {
      setQuickNoteDraft("");
      try {
        localStorage.removeItem("smart_study_quick_note_draft_v1");
      } catch {}
    }

    setIsQuickNoteOpen(true);
    triggerSuccessMessage("Đã lưu ghi chú bằng giọng nói.");
  };

  const handleClearAllQuickNotes = () => {
    setQuickNotes([]);
    try {
      localStorage.removeItem("smart_study_quick_notes_v1");
    } catch {}
  };

  // Trạng thái lướt chuột trên thanh công cụ máy tính (150ms delay), nhấn giữ 300ms trên điện thoại/tablet & hiệu ứng nhấn (press glow)
  const [hoveredToolbarItem, setHoveredToolbarItem] = useState<string | null>(null);
  const [longPressTooltipItem, setLongPressTooltipItem] = useState<string | null>(null);
  const [pressedHeaderItem, setPressedHeaderItem] = useState<string | null>(null);
  const [hapticPulseNavId, setHapticPulseNavId] = useState<string | null>(null);
  const [keyboardFocusedNavId, setKeyboardFocusedNavId] = useState<string | null>(null);
  const [isHeaderNavLoading, setIsHeaderNavLoading] = useState<boolean>(false);
  const [headerNavProgress, setHeaderNavProgress] = useState<number>(0);
  const hoverToolbarTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressAutoHideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardFocusTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticPulseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHapticTimestampRef = React.useRef<number>(0);
  const navLoadingStepTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const navLoadingDoneTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const navLoadingResetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = React.useRef<boolean>(false);
  const hasToolbarEntrancePlayedRef = React.useRef<boolean>(false);

  /**
   * Phản hồi xúc giác rung nhẹ (Haptic Feedback) cho các nút điều hướng chính trên điện thoại.
   * Có chống lặp (debounce 65ms) giữa sự kiện chạm (touchstart) và nhấn chọn (click).
   */
  const triggerMobileNavHaptic = (pattern: number | number[] = 12, navId?: string) => {
    const now = Date.now();
    if (now - lastHapticTimestampRef.current >= 65) {
      lastHapticTimestampRef.current = now;
      try {
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate(pattern);
        }
      } catch {
        // Ignore vibration errors in restricted browsers or desktop environments
      }
    }

    if (navId) {
      setHapticPulseNavId(navId);
      if (hapticPulseTimerRef.current) {
        clearTimeout(hapticPulseTimerRef.current);
      }
      hapticPulseTimerRef.current = setTimeout(() => {
        setHapticPulseNavId(null);
      }, 150);
    }
  };

  const triggerHeaderNavLoading = () => {};

  // Không gọi setState khi di chuột hoặc nhấn nút trên thanh công cụ (0ms JS, 100% CSS GPU hardware acceleration).
  const handleHeaderItemMouseEnter = (_itemId: string) => {};

  const handleHeaderItemMouseLeave = () => {};

  const handleHeaderButtonPressStart = (_itemId: string) => {};

  const handleHeaderButtonPressEnd = () => {};

  const handleHeaderButtonClick = (_e: React.MouseEvent, action: () => void, navId?: string) => {
    if (isMobileOrTablet) {
      triggerMobileNavHaptic(12, navId);
    }
    action();
  };

  useEffect(() => {
    const dismissLongPressTooltip = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        !target.closest("#app_root header") &&
        !target.closest("[data-mobile-bottom-nav]") &&
        !target.closest("[data-help-modal]") &&
        !target.closest("[data-settings-modal]")
      ) {
        setLongPressTooltipItem(null);
        setPressedHeaderItem(null);
        setIsHistoryDropdownOpen(false);
        setIsSharePopoverOpen(false);
        setIsQuickNoteOpen(false);
      }
    };
    const handleEscapeDropdowns = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsHistoryDropdownOpen(false);
        setIsSharePopoverOpen(false);
        setIsHelpModalOpen(false);
        setIsQuickNoteOpen(false);
        setIsSettingsModalOpen(false);
        setKeyboardFocusedNavId(null);
      }
    };
    document.addEventListener("touchstart", dismissLongPressTooltip, { passive: true });
    document.addEventListener("mousedown", dismissLongPressTooltip);
    document.addEventListener("keydown", handleEscapeDropdowns);
    return () => {
      document.removeEventListener("touchstart", dismissLongPressTooltip);
      document.removeEventListener("mousedown", dismissLongPressTooltip);
      document.removeEventListener("keydown", handleEscapeDropdowns);
      if (hoverToolbarTimerRef.current) clearTimeout(hoverToolbarTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (longPressAutoHideTimerRef.current) clearTimeout(longPressAutoHideTimerRef.current);
      if (keyboardFocusTimerRef.current) clearTimeout(keyboardFocusTimerRef.current);
      if (hapticPulseTimerRef.current) clearTimeout(hapticPulseTimerRef.current);
      if (navLoadingStepTimerRef.current) clearTimeout(navLoadingStepTimerRef.current);
      if (navLoadingDoneTimerRef.current) clearTimeout(navLoadingDoneTimerRef.current);
      if (navLoadingResetTimerRef.current) clearTimeout(navLoadingResetTimerRef.current);
    };
  }, []);

  /**
   * Phân loại thiết bị chuẩn xác:
   * 1. Máy tính (Windows PC/Laptop kể cả màn hình cảm ứng, MacBook/iMac, Linux Desktop, ChromeOS) -> LUÔN dùng giao diện Máy tính (false).
   * 2. Điện thoại & Máy tính bảng (iPhone, iPad, Tablet Android, thiết bị di động) -> Dùng giao diện Điện thoại có thanh điều hướng cố định dưới đáy (true).
   */
  const checkIsMobileOrTabletDevice = (): boolean => {
    if (typeof window === "undefined") return false;
    // Mọi khung nhìn hẹp <= 768px luôn dùng bố cục điện thoại (ẩn sidebar trái, hiện thanh tab đáy)
    if (window.innerWidth <= 768) {
      return true;
    }
    const ua = navigator.userAgent || "";
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || "";
    const touchPoints = navigator.maxTouchPoints || 0;

    const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && touchPoints > 1);
    if (isIPad) {
      return true;
    }

    const isMobileOrTabletOS = /Android|iPhone|iPod|PlayBook|Silk|Kindle|webOS|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(ua);
    if (isMobileOrTabletOS) {
      return true;
    }

    const isDesktopComputer =
      /Windows NT|Macintosh|Mac OS X|CrOS|Linux x86_64|Linux i686|X11/i.test(ua) ||
      /Win|Mac|Linux/i.test(platform);
    if (isDesktopComputer) {
      return false;
    }

    return false;
  };

  const [isMobileOrTablet, setIsMobileOrTablet] = useState<boolean>(() => checkIsMobileOrTabletDevice());

  useEffect(() => {
    const updateViewportMode = () => {
      setIsMobileOrTablet(checkIsMobileOrTabletDevice());
    };
    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", updateViewportMode);
    return () => {
      window.removeEventListener("resize", updateViewportMode);
      vv?.removeEventListener("resize", updateViewportMode);
    };
  }, []);

  // Khóa cuộn nền & hỗ trợ nút Back Android khi mở popup/sheet trên màn hình hẹp (R4)
  const isAnyAppOverlayOpen =
    isCompactToolsOpen ||
    isHistoryDropdownOpen ||
    isQuickNoteOpen ||
    isHelpModalOpen ||
    isSettingsModalOpen;
  // Depends only on "any overlay open" so switching between overlays keeps one history entry
  useEffect(() => {
    if (!isAnyAppOverlayOpen) return;

    const prevOverflow = document.body.style.overflow;
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      document.body.style.overflow = "hidden";
    }

    let pushedState = false;
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      window.history.pushState({ mobileSheet: "app-overlay" }, "");
      pushedState = true;
    }

    const handlePopState = () => {
      setIsCompactToolsOpen(false);
      setIsHistoryDropdownOpen(false);
      setIsQuickNoteOpen(false);
      setIsHelpModalOpen(false);
      setIsSettingsModalOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("popstate", handlePopState);
      if (pushedState && window.history.state?.mobileSheet === "app-overlay") {
        window.history.back();
      }
    };
  }, [isAnyAppOverlayOpen]);


  const handleNavigateTab = (tab: string) => {
    triggerMobileNavHaptic(12, `bottom-${tab}`);
    triggerHeaderNavLoading();
    setActiveTab(tab);
    setIsSystemMenuOpen(false);
    setIsHistoryDropdownOpen(false);
    setIsSharePopoverOpen(false);
    setIsHelpModalOpen(false);
    setIsQuickNoteOpen(false);
    setIsSettingsModalOpen(false);
    setLongPressTooltipItem(null);
    setPressedHeaderItem(null);
    handleHeaderItemMouseLeave();

    const meta = TAB_METADATA_MAP[tab] || { title: tab, subtitle: "Tính năng hệ thống" };
    recordRecentAccess({
      id: `tab:${tab}`,
      type: "tab",
      title: meta.title,
      subtitle: meta.subtitle,
      tabId: tab
    });

    try {
      localStorage.setItem("eduquest_active_tab", tab);
    } catch {}
    if (tab !== "review") {
      setSelectedLesson(null);
      setIsFocusReaderMode(false);
    }
  };

  // Phím tắt toàn cục trên Máy tính (Global Keyboard Shortcuts: Alt+1 Dashboard, Alt+2 Review, Alt+3 Quiz, Alt+4..8 & công cụ nhanh)
  // Tự động cập nhật trạng thái Focus Ring trên nút điều hướng tương ứng ở #app_root header
  useEffect(() => {
    const focusHeaderButtonWithHighlight = (buttonId: string) => {
      setKeyboardFocusedNavId(buttonId);
      if (keyboardFocusTimerRef.current) {
        clearTimeout(keyboardFocusTimerRef.current);
      }
      keyboardFocusTimerRef.current = setTimeout(() => {
        setKeyboardFocusedNavId(null);
      }, 1500);

      requestAnimationFrame(() => {
        const btn =
          document.querySelector<HTMLButtonElement>(`#app_root header [data-nav-button="${buttonId}"]`) ||
          document.querySelector<HTMLButtonElement>(`#app_root header [data-nav-button="menu"]`);
        if (btn) {
          btn.focus({ preventScroll: true });
        }
      });
    };

    const handleGlobalDesktopShortcuts = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      const shortcutTabMap: Record<string, { tab: string; buttonId: string }> = {
        Digit1: { tab: "dashboard", buttonId: "dashboard" },
        "1": { tab: "dashboard", buttonId: "dashboard" },
        Digit2: { tab: "review", buttonId: "review" },
        "2": { tab: "review", buttonId: "review" },
        Digit3: { tab: "quiz", buttonId: "quiz" },
        "3": { tab: "quiz", buttonId: "quiz" },
        Digit4: { tab: "flashcards", buttonId: "active-secondary-tab" },
        "4": { tab: "flashcards", buttonId: "active-secondary-tab" },
        Digit5: { tab: "pk", buttonId: "active-secondary-tab" },
        "5": { tab: "pk", buttonId: "active-secondary-tab" },
        Digit6: { tab: "podcast", buttonId: "active-secondary-tab" },
        "6": { tab: "podcast", buttonId: "active-secondary-tab" },
        Digit7: { tab: "shop", buttonId: "coins" },
        "7": { tab: "shop", buttonId: "coins" },
        Digit8: { tab: "profile", buttonId: "account" },
        "8": { tab: "profile", buttonId: "account" }
      };

      const matchedTab = shortcutTabMap[e.code] || shortcutTabMap[e.key];
      if (matchedTab) {
        e.preventDefault();
        handleNavigateTab(matchedTab.tab);
        focusHeaderButtonWithHighlight(matchedTab.buttonId);
        return;
      }

      const keyLower = e.key.toLowerCase();
      // Alt+D: Tra từ & Dịch
      if (e.code === "KeyD" || keyLower === "d") {
        e.preventDefault();
        handleNavigateTab("dictionary");
        return;
      }
      if (e.code === "KeyM" || keyLower === "m") {
        e.preventDefault();
        setIsHistoryDropdownOpen(false);
        setIsSharePopoverOpen(false);
        setIsHelpModalOpen(false);
        setIsQuickNoteOpen(false);
        setIsSettingsModalOpen(false);
        setIsSystemMenuOpen((prev) => !prev);
        focusHeaderButtonWithHighlight("menu");
      } else if (e.code === "KeyH" || keyLower === "h") {
        e.preventDefault();
        setIsSharePopoverOpen(false);
        setIsHelpModalOpen(false);
        setIsQuickNoteOpen(false);
        setIsSettingsModalOpen(false);
        setIsHistoryDropdownOpen((prev) => !prev);
        focusHeaderButtonWithHighlight("history");
      } else if (e.code === "KeyN" || keyLower === "n") {
        e.preventDefault();
        setIsHistoryDropdownOpen(false);
        setIsSharePopoverOpen(false);
        setIsHelpModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsQuickNoteOpen((prev) => !prev);
        focusHeaderButtonWithHighlight("quick-note");
      } else if (e.code === "KeyC" || keyLower === "c") {
        e.preventDefault();
        setIsHistoryDropdownOpen(false);
        setIsSharePopoverOpen(false);
        setIsHelpModalOpen(false);
        setIsQuickNoteOpen(false);
        setIsSettingsModalOpen(false);
        setIsAIChatOpen((prev) => !prev);
        focusHeaderButtonWithHighlight("mascot-chat");
      } else if (e.code === "KeyS" || keyLower === "s") {
        e.preventDefault();
        setIsHistoryDropdownOpen(false);
        setIsSharePopoverOpen(false);
        setIsHelpModalOpen(false);
        setIsQuickNoteOpen(false);
        setIsSettingsModalOpen((prev) => !prev);
        focusHeaderButtonWithHighlight("settings");
      } else if (e.code === "Slash" || keyLower === "/" || keyLower === "?") {
        e.preventDefault();
        setIsHistoryDropdownOpen(false);
        setIsSharePopoverOpen(false);
        setIsQuickNoteOpen(false);
        setIsSettingsModalOpen(false);
        setHelpPreviewTab(activeTab);
        setIsHelpModalOpen((prev) => !prev);
        focusHeaderButtonWithHighlight("help");
      }
    };

    window.addEventListener("keydown", handleGlobalDesktopShortcuts);
    return () => {
      window.removeEventListener("keydown", handleGlobalDesktopShortcuts);
    };
  }, [activeTab]);

  // Các nút điều hướng chính trên thanh công cụ (#app_root header):
  // Chỉ giữ 4 mục theo yêu cầu: Trang chủ, Bài học, Flashcard, Podcast.
  // Phần Trò chơi / Game và các công cụ khác được gom gọn vào nút "Tiện ích" xổ dọc.
  const desktopMainToolbarItems = [
    {
      id: "dashboard",
      label: "Trang chủ",
      shortcut: "Alt+1",
      shortTitle: "Dashboard · Trang chủ (Alt+1)",
      purpose: "Tổng quan tiến độ và nhiệm vụ hôm nay",
      icon: LayoutDashboard,
      coreMobileVisible: true
    },
    {
      id: "review",
      label: "Bài học",
      shortcut: "Alt+2",
      shortTitle: "Review · Bài học (Alt+2)",
      purpose: "Thư viện bài giảng, đọc hiểu và bản đồ tri thức",
      icon: FolderOpen,
      coreMobileVisible: true
    },
    {
      id: "flashcards",
      label: "Flashcard",
      shortcut: "Alt+4",
      shortTitle: "Flashcard · Thẻ ghi nhớ (Alt+4)",
      purpose: "Ôn tập từ vựng và khái niệm cốt lõi bằng thẻ lật",
      icon: Layers,
      coreMobileVisible: true
    },
    {
      id: "podcast",
      label: "Podcast",
      shortcut: "Alt+6",
      shortTitle: "Podcast · Radio Học tập (Alt+6)",
      purpose: "Nghe đối thoại học tập Minh và Lan mọi lúc",
      icon: Headphones,
      coreMobileVisible: true
    }
  ];

  // Danh sách các mục phụ trong Menu mở rộng
  const secondaryToolbarMap: Record<string, { label: string; shortcut: string; icon: any }> = {
    quiz: { label: "Luyện đề", shortcut: "Alt+3", icon: Trophy },
    pk: { label: "Đấu trường", shortcut: "Alt+5", icon: Zap },
    shop: { label: "Đổi quà", shortcut: "Alt+7", icon: ShoppingBag },
    games: { label: "Khu vực Game", shortcut: "Game", icon: Gamepad2 },
    leaderboard: { label: "Bảng vàng", shortcut: "XP", icon: Trophy },
    "parent-teacher": { label: "Phụ huynh", shortcut: "Menu", icon: GraduationCap }
  };
  const activeSecondaryTabInfo = secondaryToolbarMap[activeTab] || null;

  // Screen readers announce the page title, so it names the current section (WCAG 2.4.2)
  useEffect(() => {
    const names: Record<string, string> = {
      dashboard: "Trang chủ", review: "Bài học", "knowledge-map": "Sơ đồ tri thức", quiz: "Luyện đề", flashcards: "Flashcard",
      pk: "Đấu trường", leaderboard: "Bảng vàng", podcast: "Podcast", shop: "Đổi quà", games: "Trò chơi", dictionary: "Tra từ và Dịch",
      geomath: "Vẽ hình", tools: "Hộp công cụ", profile: "Hồ sơ", "parent-teacher": "Phụ huynh", "study-lock": "Khóa học tập", settings: "Cài đặt",
    };
    document.title = names[activeTab] ? `${names[activeTab]} · SmartStudy` : "SmartStudy";
  }, [activeTab]);

  // Các nút tính năng chính trên thanh điều hướng cố định cạnh dưới ở <= 768px (R1: Trang chủ, Bài học, Luyện tập, Trò chơi, Thêm)
  const mobileBottomNavItems = [
    { id: "dashboard", label: "Trang chủ", purpose: "Tổng quan tiến độ và nhiệm vụ hôm nay", icon: LayoutDashboard },
    { id: "review", label: "Bài học", purpose: "Thư viện bài giảng và sơ đồ tri thức", icon: FolderOpen },
    { id: "quiz", label: "Luyện tập", purpose: "Luyện đề trắc nghiệm và củng cố kiến thức", icon: Trophy },
    supportMode
      ? { id: "flashcards", label: "Flashcard", purpose: "Ôn bài bằng thẻ ghi nhớ", icon: Layers }
      : { id: "games", label: "Trò chơi", purpose: "Kho trò chơi học tập và phản xạ", icon: Gamepad2 }
  ];

  const activeToolbarTooltipItem = hoveredToolbarItem ?? longPressTooltipItem;
  const isAnyToolbarHovered = activeToolbarTooltipItem !== null && !isSystemMenuOpen && !isHistoryDropdownOpen && !isSharePopoverOpen && !isHelpModalOpen && !isQuickNoteOpen && !isSettingsModalOpen;
  const showHeaderBottomProgress = isHeaderNavLoading || generatingLesson || generatingQuiz;
  const activeContextHelpGuide = CONTEXT_HELP_GUIDE_MAP[helpPreviewTab] || CONTEXT_HELP_GUIDE_MAP[activeTab] || CONTEXT_HELP_GUIDE_MAP.dashboard;
  const isLessonFocusAnimationActive =
    activeTab === "review" && Boolean(selectedLesson) && (isLessonFocusDimmed || isFocusReaderMode);

  if (isParentMode && user) {
    return (
      <>
        <React.Suspense fallback={<div className="min-h-[100dvh] bg-[#eff7f5]" />}>
          <ParentHome user={user} onLogout={handleCustomLogOut} />
        </React.Suspense>
        {/* a child's device keeps its locks even if someone signs in as a parent there */}
        {(Capacitor.isNativePlatform() || /\bElectron\//.test(navigator.userAgent)) && (
          <React.Suspense fallback={null}>
            <StudyLockHost lessons={lessons} grade={progress.grade || "Lớp 6"} />
          </React.Suspense>
        )}
        <React.Suspense fallback={null}>
          <AccountCenter user={user} studentName={progress.displayName || user?.displayName || ""} />
        </React.Suspense>
      </>
    );
  }

  return (
    <PodcastProvider onRewardXP={(xp, coins, epTitle) => {
      updateProgress({
        points: progress.points + xp,
        coins: (progress.coins || 0) + coins
      });
      triggerSuccessMessage(`Chúc mừng em đã hoàn thành podcast "${epTitle}" (+${xp} XP, +${coins} Xu)!`);
    }}>
      <div
        id="app_root"
        className={`h-[100dvh] w-full bg-[#eff7f5] bg-edupia-canvas blue-white-theme flex flex-row text-slate-800 font-sans antialiased overflow-hidden select-none transition-colors duration-300 ${
          isFullscreenDarkMode ? "fullscreen-dark-mode" : ""
        } ${isLessonFocusAnimationActive ? "lesson-focus-mode" : ""} ${
          isSpotlightHoverEnabled ? "spotlight-hover-enabled" : "spotlight-hover-disabled"
        }`}
      >
        <a href="#main_content_scroll" className="ss-skip-link" onClick={(e) => { e.preventDefault(); document.getElementById("main_content_scroll")?.focus(); }}>Bỏ qua, tới nội dung chính</a>
        
        {/* Full-Screen System Auth Portal (Gateway when opened) */}
        {shouldShowAuthPortal && (
          <FullScreenAuthPortal
            onLoginWithGoogle={async (opts) => {
              await logInWithGoogle(opts);
            }}
            selectedGrade={progress.grade || "Lớp 6"}
            onSelectGrade={(g) => {
              setProgress((prev) => {
                const updated = { ...prev, grade: g };
                try {
                  localStorage.setItem("smart_study_progress_v2", JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }}
            authLoading={authLoading}
            selectedAvatarIdx={selectedAvatarIdx}
          />
        )}

        {/* Dynamic Success notifications banner */}
        {successMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-in max-w-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Cột Menu Trái cố định kiểu Questora (Desktop) + Drawer (Mobile) */}
        {!isFocusReaderMode && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleNavigateTab}
            progress={progress}
            user={user}
            syncStatus={syncStatus}
            onOpenAuthPortal={handleOpenAuthPortal}
            selectedAvatarIdx={selectedAvatarIdx}
            onOpenAIChat={() => setIsAIChatOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onLogOut={handleCustomLogOut}
            isOpen={isSystemMenuOpen}
            onClose={() => setIsSystemMenuOpen(false)}
            isDesktopDocked={!isMobileOrTablet}
            isDesktopVisible={isDesktopSidebarVisible}
            onToggleDesktopVisible={() => {
              const next = !isDesktopSidebarVisible;
              setIsDesktopSidebarVisible(next);
              try {
                localStorage.setItem("smart_study_desktop_sidebar_visible_v1", String(next));
              } catch {}
            }}
            lessonsCount={lessons.length || 328}
            gamesCount={8}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
          
          {/* Nút nổi khôi phục nhanh khi người dùng đang ẩn Thanh công cụ trên cùng */}
          {!isFocusReaderMode && isTopHeaderHidden && (
            <div className="header-restore-pill fixed top-3 right-4 z-50 flex items-center gap-1.5 bg-[#243c6e]/95 hover:bg-[#1f3461] text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-sky-300/30 transition-all duration-200">
              {!isMobileOrTablet && (
                <button
                  type="button"
                  onClick={() => {
                    const next = !isDesktopSidebarVisible;
                    setIsDesktopSidebarVisible(next);
                    try {
                      localStorage.setItem("smart_study_desktop_sidebar_visible_v1", String(next));
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-100 hover:text-white pr-2 border-r border-white/20 cursor-pointer"
                  title={isDesktopSidebarVisible ? "Ẩn cột menu trái" : "Hiện cột menu trái"}
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                  <span>{isDesktopSidebarVisible ? "Ẩn cột trái" : "Hiện cột trái"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsTopHeaderHidden(false);
                  try {
                    localStorage.setItem("smart_study_top_header_hidden_v1", "false");
                  } catch {}
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-sky-200 hover:text-white cursor-pointer"
                title="Hiện lại thanh công cụ phía trên"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Hiện thanh công cụ</span>
              </button>
            </div>
          )}

          {/* THANH CÔNG CỤ TRÊN CÙNG (#app_root header):
              - Chỉ giữ: Trang chủ, Bài học, Flashcard, Podcast + Nút "Tiện ích" (chứa Trò chơi/Game và công cụ) + Cài đặt + Tài khoản
              - Hiệu ứng Ẩn hiện và Spotlight mượt 60fps bằng CSS GPU (có thể bật/tắt trong Cài đặt) */}
          {!isFocusReaderMode && !isTopHeaderHidden && (
            <>
            <header
              data-background-clarity={isVibrantBlurMode ? "vibrant-blur" : "solid-opaque"}
              data-is-loaded={hasToolbarEntrancePlayedRef.current ? "true" : "false"}
              style={{ "--is-loaded": hasToolbarEntrancePlayedRef.current ? 1 : 0 } as React.CSSProperties}
              onAnimationEnd={(e) => {
                if (e.currentTarget === e.target) {
                  hasToolbarEntrancePlayedRef.current = true;
                  e.currentTarget.style.setProperty("--is-loaded", "1");
                  e.currentTarget.setAttribute("data-is-loaded", "true");
                  e.currentTarget.classList.remove("toolbar-entrance-init");
                  e.currentTarget.classList.add("is-loaded");
                }
              }}
              onMouseEnter={(e) => {
                if (!isSpotlightHoverEnabled || isMobileOrTablet) return;
                const el = e.currentTarget;
                // Cache centers of all .spotlight-nav-btn once on enter so mousemove never triggers reflow
                const navBtns = el.querySelectorAll<HTMLElement>(".spotlight-nav-btn");
                navBtns.forEach((btn) => {
                  const bRect = btn.getBoundingClientRect();
                  btn.dataset.cx = String(bRect.left + bRect.width / 2);
                  btn.dataset.cy = String(bRect.top + bRect.height / 2);
                  btn.dataset.hw = String(Math.max(bRect.width / 2, 20));
                  btn.dataset.hh = String(Math.max(bRect.height / 2, 18));
                });
              }}
              onMouseMove={(e) => {
                if (!isSpotlightHoverEnabled || isMobileOrTablet) return;
                const el = e.currentTarget;
                // Hiệu ứng hút từ tính nhẹ (Subtle Magnetic Snap) cho nút .spotlight-nav-btn đang trỏ chuột
                const hoveredBtn = (e.target as HTMLElement | null)?.closest<HTMLElement>(".spotlight-nav-btn");
                if (hoveredBtn && el.contains(hoveredBtn)) {
                  const cx = Number(hoveredBtn.dataset.cx);
                  const cy = Number(hoveredBtn.dataset.cy);
                  const hw = Number(hoveredBtn.dataset.hw) || 40;
                  const hh = Number(hoveredBtn.dataset.hh) || 20;
                  if (!Number.isNaN(cx) && !Number.isNaN(cy)) {
                    const pullX = Math.max(-1, Math.min(1, (e.clientX - cx) / hw)) * 4.5;
                    const pullY = Math.max(-1, Math.min(1, (e.clientY - cy) / hh)) * 2.8;
                    hoveredBtn.style.setProperty("--mag-x", `${pullX.toFixed(2)}px`);
                    hoveredBtn.style.setProperty("--mag-y", `${pullY.toFixed(2)}px`);
                  }
                }
              }}
              onMouseOut={(e) => {
                const fromBtn = (e.target as HTMLElement | null)?.closest<HTMLElement>(".spotlight-nav-btn");
                const toBtn = (e.relatedTarget as HTMLElement | null)?.closest<HTMLElement>(".spotlight-nav-btn");
                if (fromBtn && fromBtn !== toBtn) {
                  fromBtn.style.setProperty("--mag-x", "0px");
                  fromBtn.style.setProperty("--mag-y", "0px");
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                const navBtns = el.querySelectorAll<HTMLElement>(".spotlight-nav-btn");
                navBtns.forEach((btn) => {
                  btn.style.setProperty("--mag-x", "0px");
                  btn.style.setProperty("--mag-y", "0px");
                });
              }}
              className={`spotlight-toolbar @container ${!hasToolbarEntrancePlayedRef.current ? "toolbar-entrance-init" : "is-loaded"} relative flex flex-nowrap pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))] items-center justify-between gap-2 w-full shrink-0 z-30 ${
                isVibrantBlurMode
                  ? "spotlight-toolbar--vibrant-blur bg-gradient-to-r from-[#2b5a96]/95 via-[#25688c]/95 to-[#1f7a72]/95 border-b border-emerald-200/30 text-white"
                  : "spotlight-toolbar--solid-opaque bg-white border-b border-[#b9d2f2] text-slate-700"
              }`}
            >
              {/* Cụm bên trái: ở chế độ Điện thoại / <= 768px chỉ hiện Logo/Tên trang; ở Desktop hiện đầy đủ nút điều hướng */}
              <nav aria-label="Thanh công cụ điều hướng" className="flex flex-nowrap items-center gap-1.5 sm:gap-2 min-w-0 shrink self-center">
                {/* Logo & Tên trang trên Điện thoại / màn hình hẹp <= 768px (R2) */}
                <button
                  type="button"
                  onClick={() => handleNavigateTab("dashboard")}
                  aria-label="Về Trang chủ SmartStudy"
                  className={`${isMobileOrTablet ? "flex" : "flex md:hidden"} items-center gap-2 min-h-[44px] min-w-0 pr-1 text-left cursor-pointer shrink`}
                >
                  <img src="/logo-mark.png" alt="" width={32} height={32} draggable={false} className="w-8 h-8 rounded-xl shrink-0" />
                  <div className="min-w-0">
                    <span className="font-display font-black text-base tracking-tight block leading-none">
                      Smart<span className="text-sky-400">Study</span>
                    </span>
                    <span className="text-xs font-semibold opacity-85 block truncate max-w-full sm:max-w-[200px] mt-0.5">
                      {TAB_METADATA_MAP[activeTab]?.title || "Trang chủ"}
                    </span>
                  </div>
                </button>

                {/* Nút Ẩn/Hiện Cột Trái trên Desktop */}
                {!isMobileOrTablet && (
                  <button
                    type="button"
                    data-primary={!isDesktopSidebarVisible ? "true" : undefined}
                    onClick={() => {
                      const next = !isDesktopSidebarVisible;
                      setIsDesktopSidebarVisible(next);
                      try {
                        localStorage.setItem("smart_study_desktop_sidebar_visible_v1", String(next));
                      } catch {}
                    }}
                    aria-label={isDesktopSidebarVisible ? "Thu gọn cột bên trái" : "Mở cột bên trái"}
                    className={`hidden md:inline-flex spotlight-nav-btn group relative h-9 sm:h-10 px-2.5 rounded-xl text-xs font-bold items-center justify-center gap-1.5 border shrink-0 cursor-pointer ${
                      isVibrantBlurMode
                        ? isDesktopSidebarVisible
                          ? "bg-white/12 text-[var(--text-secondary,#e0f2fe)] border-white/20"
                          : "bg-[var(--accent-primary,#3563b8)] text-[var(--accent-contrast-text,#ffffff)] border-sky-300/40"
                        : isDesktopSidebarVisible
                        ? "bg-[#f4f8fd] text-[var(--text-secondary,#243c6e)] border-[#d8e5f7]"
                        : "bg-[var(--accent-primary,#2e5cb8)] text-[var(--accent-contrast-text,#ffffff)] border-[var(--accent-primary,#2e5cb8)]"
                    }`}
                  >
                    <PanelLeft className="w-4 h-4 shrink-0" />
                    <span className="hidden @min-[1150px]:inline">{isDesktopSidebarVisible ? "Ẩn cột" : "Hiện cột"}</span>
                    <span
                      role="tooltip"
                      className="spotlight-tab-tooltip pointer-events-none absolute left-0 top-full mt-2.5 w-max max-w-[220px] px-3 py-2 rounded-xl bg-[#16274c] text-white text-[11px] font-semibold tracking-normal leading-snug shadow-xl border border-sky-300/40 z-50 text-left"
                    >
                      <span className="block text-[10px] font-extrabold text-sky-300 uppercase tracking-wider mb-0.5">
                        {isDesktopSidebarVisible ? "Thu gọn cột bên trái" : "Mở cột bên trái"}
                      </span>
                      <span className="block text-slate-100">
                        Đóng/mở nhanh thanh điều hướng dọc bên trái màn hình
                      </span>
                    </span>
                  </button>
                )}

                {/* Nút Menu trên Desktop khi đang ẩn cột trái (ẩn trên Điện thoại vì đã có nút Thêm ở thanh đáy) */}
                {!isMobileOrTablet && (
                <button
                  type="button"
                  data-nav-button="menu"
                  data-primary={isSystemMenuOpen ? "true" : undefined}
                  onClick={() => {
                    setIsCompactToolsOpen(false);
                    setIsHistoryDropdownOpen(false);
                    setIsSharePopoverOpen(false);
                    setIsHelpModalOpen(false);
                    setIsQuickNoteOpen(false);
                    setIsSystemMenuOpen(true);
                  }}
                  aria-label="Mở danh mục tính năng"
                  aria-describedby="tooltip-header-menu"
                  className={`${isDesktopSidebarVisible ? "hidden" : "hidden md:inline-flex"} spotlight-nav-btn group relative h-9 sm:h-10 min-w-[38px] sm:min-w-[40px] px-2.5 sm:px-3 rounded-xl text-xs font-bold items-center justify-center gap-1.5 cursor-pointer border shrink-0 touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    isSystemMenuOpen
                      ? "bg-[var(--accent-primary,#2e5cb8)] text-[var(--accent-contrast-text,#ffffff)] border-sky-200 shadow-xs"
                      : isVibrantBlurMode
                      ? "bg-white/10 text-[var(--text-secondary,#e0f2fe)] border-white/20"
                      : "bg-[#f4f8fd] text-[var(--text-secondary,#243c6e)] border-[#d8e5f7]"
                  }`}
                >
                  <Menu className="w-4 h-4 shrink-0" />
                  <span className="hidden @min-[1150px]:inline font-extrabold tracking-tight">Menu</span>
                  <span
                    id="tooltip-header-menu"
                    role="tooltip"
                    className="spotlight-tab-tooltip pointer-events-none absolute left-0 top-full mt-2.5 w-max max-w-[240px] px-3 py-2 rounded-xl bg-[#16274c] text-white text-[11px] font-semibold tracking-normal leading-snug shadow-xl border border-sky-300/40 z-50 text-left"
                  >
                    <span className="block text-[10px] font-extrabold text-sky-300 uppercase tracking-wider mb-0.5">
                      Menu · Không gian học tập (Alt+M)
                    </span>
                    <span className="block text-slate-100">
                      Mở nhanh Trò chơi, Flashcard, Đấu trường, Podcast, Đổi quà và AI
                    </span>
                  </span>
                </button>
                )}

                {/* 4 Nút điều hướng trên thanh Desktop: Trang chủ, Bài học, Flashcard, Podcast.
                    Trùng với cột trái → chỉ hiện khi cột trái đang ẩn (giống nút "Menu"). [Claude Code 2] */}
                {!isMobileOrTablet && desktopMainToolbarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.id === "review"
                      ? ["review", "learn", "reading", "essay", "knowledge-map"].includes(activeTab)
                      : activeTab === item.id;
                  const tooltipId = `tooltip-header-${item.id}`;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-nav-button={item.id}
                      data-primary={isActive ? "true" : undefined}
                      onClick={() => {
                        setIsCompactToolsOpen(false);
                        handleNavigateTab(item.id);
                      }}
                      aria-label={item.label}
                      aria-describedby={tooltipId}
                      aria-current={isActive ? "page" : undefined}
                      className={`${isDesktopSidebarVisible ? "hidden" : "hidden md:inline-flex"} spotlight-nav-btn group relative h-9 sm:h-10 min-w-[38px] sm:min-w-[40px] px-2.5 sm:px-3.5 rounded-xl text-xs font-bold items-center justify-center gap-1.5 cursor-pointer border shrink-0 touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                        isActive
                          ? isVibrantBlurMode
                            ? "bg-[var(--accent-primary,#3563b8)] text-[var(--accent-contrast-text,#ffffff)] border-sky-300/50 shadow-xs z-40"
                            : "bg-[var(--accent-primary,#2e5cb8)] text-[var(--accent-contrast-text,#ffffff)] border-[var(--accent-primary,#2e5cb8)] shadow-xs z-40"
                          : isVibrantBlurMode
                          ? "bg-white/12 text-[var(--text-secondary,#e0f2fe)] border-white/20"
                          : "bg-white text-[var(--text-secondary,#243c6e)] border-[#d8e5f7]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="hidden @min-[1050px]:inline">{item.label}</span>
                      <span
                        id={tooltipId}
                        role="tooltip"
                        className="spotlight-tab-tooltip pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2.5 w-max max-w-[240px] px-3 py-2 rounded-xl bg-[#16274c] text-white text-[11px] font-semibold tracking-normal leading-snug shadow-xl border border-sky-300/40 z-50 text-left"
                      >
                        <span className="block text-[10px] font-extrabold text-sky-300 uppercase tracking-wider mb-0.5">
                          {item.shortTitle}
                        </span>
                        <span className="block text-slate-100">{item.purpose}</span>
                      </span>
                    </button>
                  );
                })}

                {/* ================= NÚT "TIỆN ÍCH" (GIỮ LẠI Ở <= 768PX CÙNG VỚI TÀI KHOẢN THEO R2) ================= */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-expanded={isCompactToolsOpen}
                    aria-haspopup="menu"
                    aria-label="Tiện ích học tập và trò chơi"
                    data-primary={
                      isCompactToolsOpen ||
                      ["games", "quiz", "pk"].includes(activeTab) ||
                      isHistoryDropdownOpen ||
                      isQuickNoteOpen ||
                      isPomodoroOpen ||
                      isVoiceCommandOpen ||
                      isSharePopoverOpen
                        ? "true"
                        : undefined
                    }
                    onClick={() => {
                      setIsHistoryDropdownOpen(false);
                      setIsQuickNoteOpen(false);
                      setIsSharePopoverOpen(false);
                      setIsPomodoroOpen(false);
                      setIsVoiceCommandOpen(false);
                      setIsCompactToolsOpen((prev) => !prev);
                    }}
                    className={`spotlight-nav-btn group relative min-h-[44px] md:min-h-0 h-11 md:h-10 px-3 sm:px-3.5 rounded-xl text-sm md:text-xs font-extrabold inline-flex items-center justify-center gap-1.5 border shrink-0 cursor-pointer ${
                      isCompactToolsOpen
                        ? "z-50 bg-[var(--accent-primary,#2e5cb8)] text-[var(--accent-contrast-text,#ffffff)] border-sky-200 ring-1 ring-white/80 shadow-md"
                        : ["games", "quiz", "pk"].includes(activeTab) || isHistoryDropdownOpen || isQuickNoteOpen || isPomodoroOpen || isVoiceCommandOpen || isSharePopoverOpen
                        ? "bg-[var(--accent-primary,#2e5cb8)] text-[var(--accent-contrast-text,#ffffff)] border-[var(--accent-primary,#2e5cb8)] shadow-xs"
                        : isVibrantBlurMode
                        ? "bg-white/12 text-[var(--text-secondary,#e0f2fe)] border-white/20"
                        : "bg-[#f4f8fd] text-[var(--text-secondary,#243c6e)] border-[#d8e5f7]"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 md:w-3.5 md:h-3.5 shrink-0" />
                    <span className="md:hidden md:@min-[900px]:inline">Tiện ích</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCompactToolsOpen ? "rotate-180" : ""}`} />
                    {!isCompactToolsOpen && (
                      <span
                        role="tooltip"
                        className="spotlight-tab-tooltip pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2.5 w-max max-w-[250px] px-3 py-2 rounded-xl bg-[#16274c] text-white text-[11px] font-semibold tracking-normal leading-snug shadow-xl border border-sky-300/40 z-50 text-left"
                      >
                        <span className="block text-[10px] font-extrabold text-sky-300 uppercase tracking-wider mb-0.5">
                          Tiện ích · Trò chơi và Công cụ
                        </span>
                        <span className="block text-slate-100 font-normal">
                          Mở dọc Kho Game, Luyện đề, Đấu trường PK, Ghi chú và Cài đặt
                        </span>
                      </span>
                    )}
                  </button>

                  {/* DANH SÁCH TIỆN ÍCH: Bottom Sheet 1 vùng cuộn ở <= 768px (R4), Dropdown ở Desktop */}
                  {isCompactToolsOpen && (
                    <>
                    {/* Phone backdrop: covers the page so a tap outside closes the sheet (R4) */}
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Đóng danh sách tiện ích"
                      onClick={() => setIsCompactToolsOpen(false)}
                      className="fixed inset-0 z-[105] bg-slate-950/60 cursor-default min-[769px]:hidden"
                    />
                    <div
                      role="menu"
                      aria-label="Danh sách tính năng cơ bản trong Tiện ích"
                      className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2.5 w-full sm:w-80 max-h-[85dvh] sm:max-h-[80dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#16274c] border-t sm:border border-sky-300/35 shadow-2xl p-3.5 sm:p-2.5 z-[110] flex flex-col gap-2 sm:gap-1.5 animate-fade-in spotlight-vertical-menu"
                    >
                      <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between">
                        <span className="text-sm sm:text-[11px] font-black uppercase tracking-wider text-sky-300">
                          Tiện ích · Trò chơi và Công cụ
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCompactToolsOpen(false)}
                          className="w-11 h-11 sm:w-8 sm:h-8 rounded-xl text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer shrink-0"
                          aria-label="Đóng danh sách tiện ích"
                        >
                          <X className="w-5 h-5 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      {/* Đi nhanh: 3 khu vực hay dùng (đủ các mục khác ở menu trái / nút "Thêm") – Claude Code 2 */}
                      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Đi nhanh">
                        {(supportMode
                          ? [
                              { id: "review", label: "Bài học", Icon: BookOpen },
                              { id: "quiz", label: "Luyện đề", Icon: Trophy },
                              { id: "flashcards", label: "Flashcard", Icon: Layers },
                            ]
                          : [
                              { id: "games", label: "Trò chơi", Icon: Gamepad2 },
                              { id: "quiz", label: "Luyện đề", Icon: Trophy },
                              { id: "pk", label: "Đấu trường", Icon: Zap },
                            ]
                        ).map(({ id, label, Icon }) => (
                          <button
                            key={id}
                            type="button"
                            role="menuitem"
                            aria-current={activeTab === id ? "page" : undefined}
                            onClick={() => {
                              setIsCompactToolsOpen(false);
                              handleHeaderItemMouseLeave();
                              handleNavigateTab(id);
                            }}
                            className={`min-h-[56px] px-2 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-extrabold cursor-pointer transition-colors ${
                              activeTab === id
                                ? "bg-[#2e5cb8] text-white border-sky-300/50"
                                : "bg-white/8 hover:bg-white/15 text-slate-100 border-white/10"
                            }`}
                          >
                            <Icon className="w-5 h-5 text-sky-200" aria-hidden="true" />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>

                      {/* 1. Lịch sử truy cập */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCompactToolsOpen(false);
                          setIsQuickNoteOpen(false);
                          setIsSharePopoverOpen(false);
                          setIsPomodoroOpen(false);
                          setIsVoiceCommandOpen(false);
                          setIsHistoryDropdownOpen(true);
                        }}
                        className="spotlight-menu-row w-full px-3.5 py-2.5 rounded-xl bg-white/8 text-white border border-white/10 flex items-center justify-between gap-3 text-left cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#2e5cb8]/60 border border-sky-300/30 flex items-center justify-center shrink-0 text-sky-200">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-extrabold text-white truncate">
                              Lịch sử truy cập
                            </span>
                            <span className="block text-[10px] text-sky-200/80 truncate">
                              Xem nhanh 5 bài học vừa mở
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/15 text-sky-200 text-[10px] font-mono font-bold shrink-0">
                          {recentAccessedItems.length}/5
                        </span>
                      </button>

                      {/* 2. Ghi chú nhanh (Quick Notes) */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCompactToolsOpen(false);
                          setIsHistoryDropdownOpen(false);
                          setIsSharePopoverOpen(false);
                          setIsPomodoroOpen(false);
                          setIsVoiceCommandOpen(false);
                          setIsQuickNoteOpen(true);
                        }}
                        className="spotlight-menu-row w-full px-3.5 py-2.5 rounded-xl bg-white/8 text-white border border-white/10 flex items-center justify-between gap-3 text-left cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#2e5cb8]/60 border border-sky-300/30 flex items-center justify-center shrink-0 text-sky-200">
                            <StickyNote className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-extrabold text-white truncate">
                              Sổ tay Ghi chú nhanh
                            </span>
                            <span className="block text-[10px] text-sky-200/80 truncate">
                              Ghi công thức, từ vựng và đọc giọng nói
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/15 text-sky-200 text-[10px] font-mono font-bold shrink-0">
                          {quickNotes.length} lưu
                        </span>
                      </button>

                      {/* 4. Đồng hồ Pomodoro 25 phút */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCompactToolsOpen(false);
                          setIsHistoryDropdownOpen(false);
                          setIsQuickNoteOpen(false);
                          setIsSharePopoverOpen(false);
                          setIsVoiceCommandOpen(false);
                          setIsPomodoroOpen(true);
                        }}
                        className="spotlight-menu-row w-full px-3.5 py-2.5 rounded-xl bg-white/8 text-white border border-white/10 flex items-center justify-between gap-3 text-left cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#2e5cb8]/60 border border-sky-300/30 flex items-center justify-center shrink-0 text-sky-200">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-extrabold text-white truncate">
                              Đồng hồ Pomodoro 25 phút
                            </span>
                            <span className="block text-[10px] text-sky-200/80 truncate">
                              Học tập trung nhận thưởng +25 XP
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/15 text-sky-200 text-[10px] font-bold shrink-0">
                          25:00
                        </span>
                      </button>

                      {/* 5. Điều khiển bằng Giọng nói (Voice Command) */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCompactToolsOpen(false);
                          setIsHistoryDropdownOpen(false);
                          setIsQuickNoteOpen(false);
                          setIsSharePopoverOpen(false);
                          setIsPomodoroOpen(false);
                          setIsVoiceCommandOpen(true);
                        }}
                        className="spotlight-menu-row w-full px-3.5 py-2.5 rounded-xl bg-white/8 text-white border border-white/10 flex items-center justify-between gap-3 text-left cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#2e5cb8]/60 border border-sky-300/30 flex items-center justify-center shrink-0 text-sky-200">
                            <Mic className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-extrabold text-white truncate">
                              Điều khiển Giọng nói (Voice)
                            </span>
                            <span className="block text-[10px] text-sky-200/80 truncate">
                              Mở bài thi, lưu ghi chú bằng giọng nói
                            </span>
                          </div>
                        </div>
                        <span data-shortcut-badge="true" className="px-2 py-0.5 rounded-full bg-white/15 text-sky-200 text-[10px] font-bold shrink-0">
                          Alt+V
                        </span>
                      </button>

                      {/* 8. Chia sẻ bài học & Mã QR */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCompactToolsOpen(false);
                          handleTriggerHeaderShare();
                        }}
                        className="spotlight-menu-row w-full px-3.5 py-2.5 rounded-xl bg-white/8 text-white border border-white/10 flex items-center justify-between gap-3 text-left cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#2e5cb8]/60 border border-sky-300/30 flex items-center justify-center shrink-0 text-sky-200">
                            <Share2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-extrabold text-white truncate">
                              Chia sẻ bài học và Mã QR
                            </span>
                            <span className="block text-[10px] text-sky-200/80 truncate">
                              Sao chép link bài học hoặc tải QR
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/15 text-sky-200 text-[10px] font-bold shrink-0">
                          QR
                        </span>
                      </button>

                      {/* 11. Ẩn thanh công cụ phía trên */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCompactToolsOpen(false);
                          setIsTopHeaderHidden(true);
                          handleHeaderItemMouseLeave();
                          try {
                            localStorage.setItem("smart_study_top_header_hidden_v1", "true");
                          } catch {}
                        }}
                        className="spotlight-menu-row w-full px-3.5 py-2.5 rounded-xl bg-white/8 text-white border border-white/10 flex items-center justify-between gap-3 text-left cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#2e5cb8]/60 border border-sky-300/30 flex items-center justify-center shrink-0 text-sky-200">
                            <EyeOff className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-extrabold text-white truncate">
                              Ẩn thanh công cụ trên cùng
                            </span>
                            <span className="block text-[10px] text-sky-200/80 truncate">
                              Mở rộng tối đa màn hình học và chơi game
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* 12. Trợ giúp & Phím tắt */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCompactToolsOpen(false);
                          handleHeaderItemMouseLeave();
                          setHelpPreviewTab(activeTab);
                          setIsHelpModalOpen(true);
                        }}
                        className="spotlight-menu-row w-full px-3.5 py-2.5 rounded-xl bg-white/8 text-white border border-white/10 flex items-center justify-between gap-3 text-left cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#2e5cb8]/60 border border-sky-300/30 flex items-center justify-center shrink-0 text-sky-200">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-extrabold text-white truncate">
                              Hướng dẫn và Bảng phím tắt
                            </span>
                            <span className="block text-[10px] text-sky-200/80 truncate">
                              Xem cách dùng nhanh toàn bộ tính năng
                            </span>
                          </div>
                        </div>
                        <span data-shortcut-badge="true" className="px-2 py-0.5 rounded-full bg-white/15 text-sky-200 text-[10px] font-bold shrink-0">
                          Alt+/
                        </span>
                      </button>
                    </div>
                    </>
                  )}

                  {/* Các hộp thoại con mở ra khi chọn từ menu Tiện ích (History, Quick Note, Share, Pomodoro, Voice) */}
                  {isHistoryDropdownOpen && (
                    <div
                      role="menu"
                      aria-label="5 mục truy cập gần nhất"
                      className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2.5 w-auto sm:w-80 rounded-2xl bg-white/98 backdrop-blur-2xl border border-[#d8e5f7] shadow-[0_20px_50px_rgba(15,23,42,0.35)] p-3 z-50 animate-fade-in"
                    >
                      <div className="px-2 py-1.5 border-b border-[#d8e5f7] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#2e5cb8]" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                            Lịch sử truy cập ({recentAccessedItems.length}/5)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsHistoryDropdownOpen(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 max-h-56 overflow-y-auto overscroll-contain space-y-1.5 pr-0.5">
                        {recentAccessedItems.slice(0, 5).map((entry, idx) => (
                          <button
                            key={entry.id}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setIsHistoryDropdownOpen(false);
                              triggerHeaderNavLoading();
                              if (entry.type === "lesson" && entry.lessonId) {
                                const foundLesson =
                                  lessons.find((l) => l.id === entry.lessonId) ||
                                  SAMPLE_LESSONS.find((l) => l.id === entry.lessonId);
                                if (foundLesson) {
                                  handleSelectLesson(foundLesson);
                                  return;
                                }
                              }
                              handleNavigateTab(entry.tabId);
                            }}
                            className="w-full p-2 rounded-xl bg-[#f4f8fd] hover:bg-[#2e5cb8] text-slate-800 hover:text-white border border-[#d8e5f7] flex items-center gap-2.5 text-left transition-all duration-200 cursor-pointer group/hist"
                          >
                            <div className="w-7 h-7 rounded-lg bg-white group-hover/hist:bg-white/20 text-[#2e5cb8] group-hover/hist:text-white flex items-center justify-center shrink-0 text-[10px] font-black">
                              {entry.type === "lesson" ? <BookOpen className="w-3.5 h-3.5" /> : <span>#{idx + 1}</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-extrabold truncate leading-tight">
                                {entry.title}
                              </p>
                              <p className="text-[10px] text-slate-500 group-hover/hist:text-sky-100 truncate mt-0.5">
                                {entry.subtitle}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 group-hover/hist:text-white shrink-0">
                              {entry.accessedAt}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isQuickNoteOpen && (
                    <div
                      role="dialog"
                      aria-label="Khung ghi chú nhanh"
                      className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2.5 w-auto sm:w-80 md:w-96 rounded-2xl bg-white/98 backdrop-blur-2xl border border-[#d8e5f7] shadow-[0_20px_48px_rgba(15,23,42,0.35)] p-3.5 z-50 space-y-3 animate-fade-in"
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#d8e5f7]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-[#eef4fc] border border-[#d8e5f7] text-[#2e5cb8] flex items-center justify-center shrink-0">
                            <StickyNote className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                              Ghi chú nhanh
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 truncate block">
                              Đang mở: {selectedLesson ? selectedLesson.title : TAB_METADATA_MAP[activeTab]?.title || "Trang chính"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsQuickNoteOpen(false)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
                          aria-label="Đóng ghi chú nhanh"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveQuickNote} className="space-y-2">
                        <textarea
                          id="quick-note-input"
                          rows={2}
                          value={
                            isQuickNoteListening && quickNoteInterim
                              ? `${quickNoteDraft}${quickNoteDraft ? " " : ""}${quickNoteInterim}`
                              : quickNoteDraft
                          }
                          onChange={(e) => handleQuickNoteDraftChange(e.target.value)}
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                              e.preventDefault();
                              handleSaveQuickNote();
                            }
                          }}
                          placeholder="Ghi nhanh công thức, từ vựng hoặc bấm Micro để đọc..."
                          className="w-full px-3 py-2 rounded-xl border border-[#d8e5f7] bg-[#f4f8fd] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2e5cb8] resize-none leading-relaxed"
                        />

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={toggleQuickNoteListening}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                              isQuickNoteListening
                                ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                                : "bg-[#eef4fc] hover:bg-[#e0ecfa] text-[#243c6e] border-[#d8e5f7]"
                            }`}
                          >
                            {isQuickNoteListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            <span>{isQuickNoteListening ? "Đang nghe..." : "Đọc giọng nói"}</span>
                          </button>

                          <button
                            type="submit"
                            disabled={!quickNoteDraft.trim() && !quickNoteInterim.trim()}
                            className="px-3 py-1.5 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white text-[11px] font-extrabold inline-flex items-center gap-1 disabled:opacity-45 cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Lưu ghi chú</span>
                          </button>
                        </div>
                      </form>

                      {quickNotes.length > 0 && (
                        <div className="pt-1 border-t border-[#d8e5f7] max-h-44 overflow-y-auto space-y-1.5">
                          {quickNotes.map((note) => (
                            <div
                              key={note.id}
                              className="p-2 rounded-xl bg-[#f4f8fd] border border-[#d8e5f7] flex items-start justify-between gap-2"
                            >
                              <p className="text-xs font-semibold text-slate-800 break-words flex-1 min-w-0">
                                {note.content}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuickNote(note.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {isSharePopoverOpen && (
                    <div
                      role="dialog"
                      aria-label="Chia sẻ liên kết bài học đang hoạt động"
                      className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2.5 w-auto sm:w-[380px] rounded-2xl bg-white/98 backdrop-blur-2xl border border-[#d8e5f7] shadow-[0_20px_50px_rgba(15,23,42,0.35)] p-3.5 z-50 space-y-2.5 animate-fade-in"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#243c6e]">
                          Chia sẻ bài học và Mã QR
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSharePopoverOpen(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <React.Suspense fallback={<div className="h-40" aria-busy="true" />}>
                      <LessonQRCode
                        compact
                        lessonId={String(currentActiveLessonForShare?.id || "1")}
                        lessonTitle={
                          sharedLessonTitle ||
                          currentActiveLessonForShare?.title ||
                          "Bài học SmartStudy"
                        }
                        bookName={currentActiveLessonForShare?.bookName}
                        grade={currentActiveLessonForShare?.grade}
                        shareUrl={generatedShareLink}
                        markerTag={
                          sharedLessonMarker ||
                          (currentActiveLessonForShare
                            ? `lesson-${String(currentActiveLessonForShare.id).replace(/^lesson-/, "")}`
                            : "lesson-1")
                        }
                        onCopySuccess={() => {
                          setShareCopiedState(true);
                          setTimeout(() => setShareCopiedState(false), 2000);
                          triggerSuccessMessage("Đã sao chép liên kết chia sẻ học tập!");
                        }}
                        onDownloadSuccess={() => {
                          triggerSuccessMessage("Đã tải thẻ mã QR (.png) của bài học!");
                        }}
                      />
                      </React.Suspense>
                    </div>
                  )}

                  {/* Đồng hồ Pomodoro & Điều khiển giọng nói (Chỉ hiển thị bảng khi được mở từ Tiện ích) */}
                  <div className={isPomodoroOpen ? "block" : "hidden"}>
                    <PomodoroTimer
                      isOpen={isPomodoroOpen}
                      onToggleOpen={() => setIsPomodoroOpen((prev) => !prev)}
                      onClose={() => setIsPomodoroOpen(false)}
                      isDarkMode={isFullscreenDarkMode}
                      onCompleteSession={(phase, count) => {
                        if (phase === "focus") {
                          setProgress((prev) => ({
                            ...prev,
                            points: prev.points + 25,
                            coins: prev.coins + 10
                          }));
                          triggerSuccessMessage(`Hoàn thành phiên Pomodoro 25 phút (#${count})! Thưởng +25 XP và +10 Xu!`);
                        } else {
                          triggerSuccessMessage("Đã hết giờ nghỉ giải lao!");
                        }
                      }}
                    />
                  </div>

                  <div className={isVoiceCommandOpen ? "block" : "hidden"}>
                    <VoiceCommandOverlay
                      isOpen={isVoiceCommandOpen}
                      onToggleOpen={() => setIsVoiceCommandOpen((prev) => !prev)}
                      onClose={() => setIsVoiceCommandOpen(false)}
                      isDarkMode={isFullscreenDarkMode}
                      quickNoteDraft={quickNoteDraft}
                      onOpenQuiz={() => {
                        handleNavigateTab("quiz");
                        triggerSuccessMessage("Đã mở Đấu trường Trắc nghiệm qua lệnh giọng nói!");
                      }}
                      onSaveNote={(spokenNote) => {
                        handleVoiceSaveNote(spokenNote);
                      }}
                      onSwitchDarkMode={(enableDark) => {
                        handleToggleFullscreenDarkMode(enableDark);
                      }}
                      onNavigateTab={(tabId) => {
                        handleNavigateTab(tabId);
                      }}
                    />
                  </div>
                </div>
              </nav>

              {/* Cụm bên phải thanh công cụ: ở chế độ Điện thoại / <= 768px chỉ giữ nút Tài khoản (cùng với Tiện ích ở bên cạnh theo R2); ở Desktop hiện đầy đủ SmartStudy AI, Hiệu ứng, Cài đặt, Tài khoản */}
              <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2 ml-auto shrink-0 self-center">
                {/* Nút mở nhanh Khung Trợ lý SmartStudy (Desktop; trên điện thoại nằm trong 'Thêm' và 'Tiện ích') */}
                {!isMobileOrTablet && (
                <button
                  type="button"
                  data-primary={isAIChatOpen ? "true" : undefined}
                  aria-pressed={isAIChatOpen}
                  onClick={() => {
                    setIsCompactToolsOpen(false);
                    setIsAIChatOpen((prev) => !prev);
                  }}
                  aria-label="Mở Trợ lý SmartStudy (Giao diện Thông minh + Theme ASCII cá nhân hóa)"
                  className={`hidden md:inline-flex spotlight-nav-btn group relative h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border text-xs font-extrabold items-center justify-center gap-1.5 active:scale-95 cursor-pointer shrink-0 self-center touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    isAIChatOpen
                      ? "bg-[var(--accent-primary,#2e5cb8)] text-[var(--accent-contrast-text,#ffffff)] border-sky-200 shadow-xs"
                      : isVibrantBlurMode
                      ? "bg-white/12 hover:bg-white/20 border-white/20 text-[var(--text-secondary,#e0f2fe)]"
                      : "bg-[#f4f8fd] hover:bg-[#e8f0fb] border-[#d8e5f7] text-[var(--text-secondary,#243c6e)]"
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isVibrantBlurMode || isAIChatOpen ? "text-sky-300" : "text-[#2e5cb8]"}`} />
                  <span className="hidden @min-[1380px]:inline">SmartStudy</span>
                  <span
                    role="tooltip"
                    className="spotlight-tab-tooltip pointer-events-none absolute right-0 top-full mt-2.5 w-max max-w-[260px] px-3 py-2 rounded-xl bg-[#16274c] text-white text-[11px] font-semibold tracking-normal leading-snug shadow-xl border border-sky-300/40 z-50 text-left"
                  >
                    <span className="block text-[10px] font-extrabold text-sky-300 uppercase tracking-wider mb-0.5">
                      Trợ lý SmartStudy (Alt+C)
                    </span>
                    <span className="block text-slate-100">
                      Mở khung Trợ lý SmartStudy giải đáp học tập và đổi theme cá nhân hóa
                    </span>
                  </span>
                </button>
                )}

                {!isMobileOrTablet && (
                <button
                  type="button"
                  onClick={() => handleToggleSpotlightHover()}
                  aria-pressed={isSpotlightHoverEnabled}
                  data-toggle-badge
                  aria-label="Bật hoặc tắt nhanh hiệu ứng nổi bật và ẩn hiện khi di chuột"
                  className={`hidden md:inline-flex spotlight-nav-btn group relative h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border text-xs font-bold items-center justify-center gap-1.5 active:scale-95 cursor-pointer shrink-0 self-center touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    isVibrantBlurMode
                      ? `bg-white/12 hover:bg-white/20 text-[var(--text-secondary,#e0f2fe)] ${isSpotlightHoverEnabled ? "border-emerald-300/50" : "border-white/20"}`
                      : `bg-[#f4f8fd] hover:bg-[#e8f0fb] text-[var(--text-secondary,#243c6e)] ${isSpotlightHoverEnabled ? "border-emerald-500/50" : "border-[#d8e5f7]"}`
                  }`}
                >
                  <MousePointer2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden @min-[1300px]:inline">Hiệu ứng:</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none ${
                    isSpotlightHoverEnabled
                      ? "bg-emerald-400 text-slate-950"
                      : "bg-slate-300 text-slate-700"
                  }`}>
                    {isSpotlightHoverEnabled ? "BẬT" : "TẮT"}
                  </span>
                  <span
                    role="tooltip"
                    className="spotlight-tab-tooltip pointer-events-none absolute right-0 top-full mt-2.5 w-max max-w-[240px] px-3 py-2 rounded-xl bg-[#16274c] text-white text-[11px] font-semibold tracking-normal leading-snug shadow-xl border border-sky-300/40 z-50 text-left"
                  >
                    <span className="block text-[10px] font-extrabold text-sky-300 uppercase tracking-wider mb-0.5">
                      Hiệu ứng Nổi hiện khi di chuột
                    </span>
                    <span className="block text-slate-100">
                      {isSpotlightHoverEnabled
                        ? "Đang BẬT: Làm sáng tab đang trỏ và làm mờ xung quanh. Bấm để tắt nếu máy yếu."
                        : "Đang TẮT: Đã tắt hiệu ứng nổi hiện để tối ưu máy yếu. Bấm để bật lại."}
                    </span>
                  </span>
                </button>
                )}

                {!isMobileOrTablet && (
                <button
                  type="button"
                  data-nav-button="settings"
                  data-primary={isSettingsModalOpen ? "true" : undefined}
                  onClick={() => {
                    setIsCompactToolsOpen(false);
                    setIsSettingsModalOpen(true);
                  }}
                  aria-label="Mở Cài đặt hệ thống và Bật/Tắt hiệu ứng ẩn hiện"
                  className={`hidden md:inline-flex spotlight-nav-btn group relative h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border text-xs font-bold items-center justify-center gap-1.5 active:scale-95 cursor-pointer shrink-0 self-center touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    isSettingsModalOpen
                      ? "bg-[var(--accent-primary,#2e5cb8)] text-[var(--accent-contrast-text,#ffffff)] border-sky-200 shadow-xs z-40"
                      : isVibrantBlurMode
                      ? "bg-white/12 hover:bg-white/20 border-white/20 text-[var(--text-secondary,#e0f2fe)]"
                      : "bg-[#f4f8fd] hover:bg-[#e8f0fb] border-[#d8e5f7] text-[var(--text-secondary,#243c6e)]"
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span className="hidden @min-[1220px]:inline">Cài đặt</span>
                  <span
                    role="tooltip"
                    className="spotlight-tab-tooltip pointer-events-none absolute right-0 top-full mt-2.5 w-max max-w-[240px] px-3 py-2 rounded-xl bg-[#16274c] text-white text-[11px] font-semibold tracking-normal leading-snug shadow-xl border border-sky-300/40 z-50 text-left"
                  >
                    <span className="block text-[10px] font-extrabold text-sky-300 uppercase tracking-wider mb-0.5">
                      Cài đặt · Hiệu ứng và Giao diện (Alt+S)
                    </span>
                    <span className="block text-slate-100">
                      Mở bảng Cài đặt để tùy chỉnh hiệu ứng ẩn hiện ({isSpotlightHoverEnabled ? "Đang Bật" : "Đang Tắt"}), giao diện và âm thanh
                    </span>
                  </span>
                </button>
                )}

                <button
                  type="button"
                  data-nav-button="account"
                  data-primary={activeTab === "profile" ? "true" : undefined}
                  onClick={() => {
                    setIsCompactToolsOpen(false);
                    handleNavigateTab("profile");
                  }}
                  aria-label="Hồ sơ học sinh và Tài khoản"
                  aria-describedby="tooltip-header-account"
                  className={`spotlight-nav-btn group relative min-h-[44px] min-w-[44px] md:min-h-0 h-11 md:h-10 px-1.5 sm:pl-1.5 sm:pr-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 self-center touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    activeTab === "profile"
                      ? "bg-[var(--accent-primary,#2e5cb8)] text-[var(--accent-contrast-text,#ffffff)] border-[var(--accent-primary,#2e5cb8)] shadow-xs z-40"
                      : isVibrantBlurMode
                      ? "bg-white/12 border-white/20 text-[var(--text-secondary,#e0f2fe)]"
                      : "bg-white border-[#d8e5f7] text-[var(--text-secondary,#243c6e)]"
                  }`}
                >
                  <UserAvatar
                    avatarUrl={progress.avatarUrl}
                    displayName={progress.displayName}
                    selectedAvatarIdx={selectedAvatarIdx}
                    level={progress.level}
                    equippedOutfit={progress.equippedOutfit}
                    size={28}
                    showBorder={false}
                  />
                  <div className="hidden sm:flex md:hidden md:@min-[1160px]:flex flex-col justify-center text-left leading-tight">
                    <span className="block text-xs sm:text-[11px] font-bold truncate max-w-[78px] sm:max-w-[120px]">
                      {progress.displayName || "Tài khoản"}
                    </span>
                    <span
                      className={`hidden sm:block text-[9px] font-semibold group-hover:text-sky-100 ${
                        activeTab === "profile" || isVibrantBlurMode
                          ? "text-sky-100"
                          : "text-slate-500"
                      }`}
                    >
                      Lv.{progress.level || 1} · {progress.grade || "Lớp 6"}
                    </span>
                  </div>
                  <span
                    id="tooltip-header-account"
                    role="tooltip"
                    className="spotlight-tab-tooltip pointer-events-none absolute right-0 top-full mt-2.5 w-max max-w-[230px] px-3 py-2 rounded-xl bg-[#16274c] text-white text-[11px] font-semibold tracking-normal leading-snug shadow-xl border border-sky-300/40 z-50 text-left"
                  >
                    <span className="block text-[10px] font-extrabold text-sky-300 uppercase tracking-wider mb-0.5">
                      Hồ sơ học sinh và Huy hiệu (Alt+8)
                    </span>
                    <span className="block text-slate-100">
                      Xem Linh thú, Huy hiệu thành tích, cấp độ và đồng bộ tài khoản
                    </span>
                  </span>
                </button>
              </div>

              {/* Thanh tiến trình thuần CSS GPU ở đáy #app_root .spotlight-toolbar (không dùng inline style width) */}
              <div
                role="progressbar"
                aria-label="Trạng thái tải điều hướng"
                aria-hidden={!showHeaderBottomProgress}
                className={`pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden transition-opacity duration-200 ${
                  showHeaderBottomProgress ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="h-full w-full origin-left ss-grad-brand transform-gpu scale-x-100" />
              </div>
            </header>

            {/* Lớp làm tối xung quanh thuần CSS GPU (0ms JS) khi di chuột lên các nút trên thanh công cụ hoặc mở Tiện ích */}
            <div
              id="spotlight_page_dimmer"
              aria-hidden="true"
              className={`pointer-events-none fixed inset-0 z-20 bg-slate-950/32 transition-opacity duration-200 ease-out ${
                isCompactToolsOpen ? "opacity-100" : "opacity-0"
              }`}
            />

              {/* Modal Hướng dẫn sử dụng & Phím tắt theo ngữ cảnh (Context-Aware Help Modal) */}
              {isHelpModalOpen && typeof document !== "undefined" && createPortal(
                <div
                  data-help-modal="true"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="context-help-modal-title"
                  className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
                >
                  {/* Lớp nền mờ đóng modal khi click ra ngoài */}
                  <div
                    className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs transition-opacity animate-fade-in"
                    onClick={() => setIsHelpModalOpen(false)}
                  />

                  {/* Khung nội dung Help Modal phong cách Tactile Glassmorphism đồng bộ với Header */}
                  <div className="relative z-10 my-auto w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[88dvh] flex flex-col rounded-3xl bg-white/95 backdrop-blur-2xl border border-sky-200/90 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.32),inset_0_1px_2px_rgba(255,255,255,0.95)] overflow-hidden animate-fade-in text-slate-800">
                    {/* Phần đầu Modal */}
                    <div data-ss-fixed-size className="px-5 py-4 bg-gradient-to-r from-sky-50/95 via-blue-50/80 to-indigo-50/90 border-b border-sky-200/80 flex items-start justify-between gap-3 shrink-0">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_6px_16px_-3px_rgba(37,99,235,0.45)]">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold text-blue-700">
                            <span>Hướng dẫn và phím tắt</span>
                            <span aria-hidden="true">·</span>
                            <span>{TAB_METADATA_MAP[helpPreviewTab]?.title || "Màn hình hiện tại"}</span>
                          </div>
                          <h2 id="context-help-modal-title" className="text-base sm:text-lg font-black text-slate-900 leading-snug mt-0.5">
                            {activeContextHelpGuide.title}
                          </h2>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {activeContextHelpGuide.subtitle}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsHelpModalOpen(false)}
                        aria-label="Đóng bảng hướng dẫn"
                        className="w-9 h-9 rounded-full bg-white/85 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Thanh chuyển đổi xem hướng dẫn các mục khác ngay trong Modal */}
                    <div className="px-5 py-2.5 bg-sky-50/60 border-b border-sky-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                      <span className="text-[11px] font-extrabold text-slate-500 mr-1 shrink-0">
                        Xem mục:
                      </span>
                      {Object.entries(TAB_METADATA_MAP).map(([tabKey, meta]) => {
                        const isSelected = helpPreviewTab === tabKey;
                        const isCurrentScreen = activeTab === tabKey;
                        return (
                          <button
                            key={tabKey}
                            type="button"
                            onClick={() => setHelpPreviewTab(tabKey)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border ${
                              isSelected
                                ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white border-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(37,99,235,0.3)]"
                                : "bg-white/80 text-slate-600 border-sky-200/70 hover:bg-white hover:text-blue-700"
                            }`}
                          >
                            {meta.title}
                            {isCurrentScreen ? " (Đang mở)" : ""}
                          </button>
                        );
                      })}
                    </div>

                    {/* Nội dung chi tiết: Bảng Phím tắt Toàn cục (Alt+1..8) + Tóm tắt + Hướng dẫn từng bước + Phím tắt ngữ cảnh */}
                    <div className="p-5 overflow-y-auto overscroll-contain space-y-5 text-left">
                      {/* Bảng phím tắt điều hướng nhanh trên Máy tính (Global Keyboard Shortcuts) */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/80 to-indigo-50/80 border border-blue-200/80 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-blue-600" />
                            <span>Phím tắt chuyển nhanh trên Máy tính (Global Shortcuts)</span>
                          </span>
                          <span className="text-[10px] font-bold text-blue-600">Tự động Focus</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { key: "Alt + 1", label: "Trang chủ", tab: "dashboard" },
                            { key: "Alt + 2", label: "Bài học", tab: "review" },
                            { key: "Alt + 3", label: "Luyện đề", tab: "quiz" },
                            { key: "Alt + 4", label: "Flashcard", tab: "flashcards" },
                            { key: "Alt + 5", label: "Đấu trường", tab: "pk" },
                            { key: "Alt + 6", label: "Podcast", tab: "podcast" },
                            { key: "Alt + 7", label: "Đổi quà", tab: "shop" },
                            { key: "Alt + 8", label: "Hồ sơ", tab: "profile" }
                          ].map((scItem) => (
                            <button
                              key={scItem.key}
                              type="button"
                              onClick={() => {
                                setIsHelpModalOpen(false);
                                handleNavigateTab(scItem.tab);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl border text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                                activeTab === scItem.tab
                                  ? "bg-blue-600 text-white border-blue-500 shadow-xs"
                                  : "bg-white/90 hover:bg-white text-slate-700 border-blue-200/70 hover:border-blue-400"
                              }`}
                            >
                              <span className="text-[11px] font-bold truncate">{scItem.label}</span>
                              <kbd
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black shrink-0 ${
                                  activeTab === scItem.tab
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-100 text-blue-700"
                                }`}
                              >
                                {scItem.key}
                              </kbd>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mô tả ngữ cảnh */}
                      <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/70 text-xs text-slate-700 leading-relaxed font-medium">
                        {activeContextHelpGuide.summary}
                      </div>

                      {/* Hướng dẫn từng bước (Step-by-step guidance) */}
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span>Hướng dẫn sử dụng từng bước</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-2.5">
                          {activeContextHelpGuide.steps.map((step, index) => (
                            <div
                              key={index}
                              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_6px_-2px_rgba(15,23,42,0.05)] flex items-start gap-3"
                            >
                              <div className="w-6 h-6 rounded-xl bg-blue-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-extrabold text-slate-900">
                                  {step.title}
                                </p>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {step.detail}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Phím tắt & Thao tác nhanh (Quick Shortcuts) */}
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span>Phím tắt và Thao tác nhanh</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeContextHelpGuide.shortcuts.map((sc, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-2.5"
                            >
                              <span className="text-[11px] font-semibold text-slate-700 leading-snug">
                                {sc.label}
                              </span>
                              <kbd className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-[10px] font-mono font-extrabold text-blue-700 shadow-2xs shrink-0">
                                {sc.keyCombo}
                              </kbd>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mẹo học tập hiệu quả (Pro Tip) */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/85 border border-amber-200/80 flex items-start gap-3">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-950 leading-relaxed">
                          <span className="font-extrabold">Mẹo nhỏ cho em: </span>
                          {activeContextHelpGuide.proTip}
                        </p>
                      </div>
                    </div>

                    {/* Chân Modal: Nút đi tới nhanh tính năng & nút Đóng */}
                    <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {helpPreviewTab !== activeTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsHelpModalOpen(false);
                              triggerHeaderNavLoading();
                              handleNavigateTab(helpPreviewTab);
                            }}
                            className="px-3.5 py-2 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs hover:shadow-[0_0_16px_rgba(59,130,246,0.45)] cursor-pointer"
                          >
                            <span>Mở mục {TAB_METADATA_MAP[helpPreviewTab]?.title}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {activeContextHelpGuide.quickActions.map((qa, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setIsHelpModalOpen(false);
                              triggerHeaderNavLoading();
                              handleNavigateTab(qa.targetTab);
                            }}
                            className="px-3 py-2 rounded-2xl bg-white hover:bg-sky-50 text-blue-700 border border-sky-200 text-xs font-extrabold inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                          >
                            <span>{qa.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsHelpModalOpen(false)}
                        className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all duration-200 cursor-pointer ml-auto"
                      >
                        Đã hiểu
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

              {/* Modal Cài đặt Giao diện & Tùy chọn Thông báo (Settings Modal: Fullscreen Dark Mode & Notification Preferences) */}
              {isSettingsModalOpen && typeof document !== "undefined" && createPortal(
                <div
                  ref={settingsModalRef}
                  data-settings-modal="true"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="settings-modal-title"
                  className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
                >
                  {/* Lớp nền mờ đóng modal khi click ra ngoài */}
                  <div
                    className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs transition-opacity animate-fade-in"
                    onClick={() => setIsSettingsModalOpen(false)}
                  />

                  <div className="relative z-10 my-auto w-full max-w-xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[88dvh] flex flex-col rounded-3xl bg-white/95 backdrop-blur-2xl border border-sky-200/90 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.32),inset_0_1px_2px_rgba(255,255,255,0.95)] overflow-hidden animate-fade-in text-slate-800">
                    {/* Phần đầu Modal Settings */}
                    <div data-ss-fixed-size className="px-5 py-4 bg-gradient-to-r from-sky-50/95 via-blue-50/80 to-indigo-50/90 border-b border-sky-200/80 flex items-start justify-between gap-3 shrink-0">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_6px_16px_-3px_rgba(37,99,235,0.45)]">
                          <Settings className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold text-blue-700">
                            <span>Cài đặt hệ thống</span>
                            <span aria-hidden="true">·</span>
                            <span>Alt + S</span>
                          </div>
                          <h2 id="settings-modal-title" className="text-base sm:text-lg font-black text-slate-900 leading-snug mt-0.5">
                            Giao diện và thông báo
                          </h2>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {supportMode ? "Bật, tắt hỗ trợ khi học" : "Hỗ trợ học tập, tra từ nhanh, giao diện và thông báo nhắc học"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsSettingsModalOpen(false)}
                        aria-label="Đóng cửa sổ cài đặt"
                        className="w-9 h-9 rounded-full bg-white/85 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Nội dung Modal Settings */}
                    <div className="p-5 overflow-y-auto overscroll-contain space-y-5 text-left">
                      {/* Thẻ "Thư mục lưu trữ" và "Khoá AI (tự xoay vòng)" đã bỏ khỏi Cài đặt: app vẫn tự lưu
                          dữ liệu ngầm (LocalLibrarySync) và khoá AI chỉ do người quản lý đặt trong api-keys/. */}
                      <SupportSettingsCard />
                      {/* support mode: only the few help switches, none of the look / notification options */}
                      {!supportMode && (<>
                      <QuickLookupSetting />

                      {/* 0. Bật / Tắt Hiệu ứng Ẩn hiện & Làm nổi bật khi di chuột qua các Thanh Tab (Spotlight Hover) */}
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                          <MousePointer2 className="w-4 h-4 text-[#2e5cb8]" />
                          <span>Hiệu ứng Chuyển tiếp và Ẩn hiện trên Thanh Tab (Tối ưu mượt)</span>
                        </h3>

                        <div
                          className={`p-4 rounded-2xl border transition-all duration-200 ${
                            isSpotlightHoverEnabled
                              ? "bg-gradient-to-br from-[#eef4fc] via-white to-sky-50/90 border-[#93b8e8] text-slate-800 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-slate-900">
                                  Hiệu ứng Ẩn hiện và Làm sáng khi di chuột (Spotlight Hover)
                                </span>
                                <span
                                  className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                                    isSpotlightHoverEnabled
                                      ? "bg-[#2e5cb8] text-white"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {isSpotlightHoverEnabled ? "ĐANG BẬT" : "ĐANG TẮT"}
                                  <span className="hidden sm:inline">{isSpotlightHoverEnabled ? " · có hiệu ứng ẩn hiện" : " · giảm giật lag"}</span>
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Khi <strong>Bật</strong>, di chuột tới bất kỳ tab nào (thanh trên cùng, cột menu trái, menu Tiện ích) sẽ làm sáng nổi bật vùng đó, hiện khung mô tả ẩn hiện và làm tối dịu xung quanh. Hãy <strong>Tắt</strong> nếu máy của bạn cấu hình yếu để triệt tiêu hoàn toàn độ trễ.
                              </p>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={isSpotlightHoverEnabled}
                              aria-label="Bật hoặc tắt hiệu ứng ẩn hiện khi di chuột"
                              onClick={() => handleToggleSpotlightHover()}
                              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                isSpotlightHoverEnabled ? "bg-[#2e5cb8]" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-flex h-7 w-7 shrink-0 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out items-center justify-center ${
                                  isSpotlightHoverEnabled ? "translate-x-6" : "translate-x-0"
                                }`}
                              >
                                <MousePointer2
                                  className={`w-3.5 h-3.5 ${
                                    isSpotlightHoverEnabled ? "text-[#2e5cb8]" : "text-slate-400"
                                  }`}
                                />
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 0B. Background Clarity Toggle cho #app_root .spotlight-toolbar (Vibrant Blur vs Solid Opaque) */}
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-[#2e5cb8]" />
                          <span>Nền thanh công cụ</span>
                        </h3>

                        <div
                          className={`p-4 rounded-2xl border transition-all duration-200 space-y-3.5 ${
                            isVibrantBlurMode
                              ? "bg-gradient-to-br from-[#eef4fc] via-white to-sky-50/90 border-[#93b8e8] text-slate-800 shadow-xs"
                              : "bg-white border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-slate-900">
                                  Chất liệu nền thanh công cụ
                                </span>
                                <span
                                  className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                                    isVibrantBlurMode
                                      ? "bg-[#2e5cb8] text-white"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  }`}
                                >
                                  {isVibrantBlurMode ? "VIBRANT BLUR" : "SOLID OPAQUE"}
                                  <span className="hidden sm:inline">{isVibrantBlurMode ? " · KÍNH MỜ" : " · nền đặc, mượt"}</span>
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Chọn <strong>kính mờ</strong> hoặc <strong>nền đặc</strong> (không làm mờ, nhẹ hơn cho máy yếu).
                              </p>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={isVibrantBlurMode}
                              aria-label="Chuyển nền thanh công cụ giữa kính mờ và nền đặc"
                              onClick={() => handleToggleBackgroundClarity()}
                              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                isVibrantBlurMode ? "bg-[#2e5cb8]" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-flex h-7 w-7 shrink-0 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out items-center justify-center ${
                                  isVibrantBlurMode ? "translate-x-6" : "translate-x-0"
                                }`}
                              >
                                <Palette
                                  className={`w-3.5 h-3.5 ${
                                    isVibrantBlurMode ? "text-[#2e5cb8]" : "text-slate-500"
                                  }`}
                                />
                              </span>
                            </button>
                          </div>

                          {/* 2 Nút chọn trực tiếp: Vibrant Blur vs Solid Opaque */}
                          <div className="grid grid-cols-2 gap-2.5 pt-1" role="radiogroup" aria-label="Chất liệu nền thanh công cụ">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={isVibrantBlurMode}
                              onClick={() => handleToggleBackgroundClarity(true)}
                              className={`px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isVibrantBlurMode
                                  ? "bg-[#243c6e] text-white border-[#2e5cb8] shadow-xs"
                                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="block text-xs font-extrabold truncate">
                                  Kính mờ
                                </span>
                                <span className={`block text-[10px] truncate ${isVibrantBlurMode ? "text-sky-200" : "text-slate-500"}`}>
                                  Hiệu ứng kính mờ nổi bật
                                </span>
                              </div>
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isVibrantBlurMode ? "bg-sky-300" : "bg-slate-300"}`} />
                            </button>

                            <button
                              type="button"
                              role="radio"
                              aria-checked={!isVibrantBlurMode}
                              onClick={() => handleToggleBackgroundClarity(false)}
                              className={`px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                !isVibrantBlurMode
                                  ? "bg-[#2e5cb8] text-white border-[#2e5cb8] shadow-xs"
                                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="block text-xs font-extrabold truncate">
                                  Nền đặc
                                </span>
                                <span className={`block text-[10px] truncate ${!isVibrantBlurMode ? "text-sky-100" : "text-slate-500"}`}>
                                  Nền đặc tối ưu hiệu năng
                                </span>
                              </div>
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${!isVibrantBlurMode ? "bg-emerald-300" : "bg-slate-300"}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 1. Chế độ Tối Toàn màn hình (Fullscreen Dark Mode) */}
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                          {isFullscreenDarkMode ? (
                            <Moon className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Sun className="w-4 h-4 text-amber-500" />
                          )}
                          <span>Chế độ Hiển thị · Fullscreen Dark Mode</span>
                        </h3>

                        <div
                          className={`p-4 rounded-2xl border transition-all duration-200 ${
                            isFullscreenDarkMode
                              ? "bg-slate-900 text-white border-indigo-500/60 shadow-md"
                              : "bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/60 border-sky-200/90 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black">
                                  Fullscreen Dark Mode (Chế độ Tối Toàn màn hình)
                                </span>
                                <span
                                  className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                                    isFullscreenDarkMode
                                      ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/40"
                                      : "bg-sky-100 text-blue-700"
                                  }`}
                                >
                                  {isFullscreenDarkMode ? "ĐANG BẬT" : "ĐANG TẮT"}
                                  <span className="hidden sm:inline">{isFullscreenDarkMode ? " · OBSIDIAN DARK" : " · sáng tiêu chuẩn"}</span>
                                </span>
                              </div>
                              <p
                                className={`text-xs leading-relaxed ${
                                  isFullscreenDarkMode ? "text-slate-300" : "text-slate-600"
                                }`}
                              >
                                Chuyển đổi trực tiếp lớp nền <code className="font-mono text-[11px]">fullscreen-dark-mode</code> trên toàn bộ không gian <code className="font-mono text-[11px]">#app_root</code> giúp dịu mắt khi học ban đêm.
                              </p>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={isFullscreenDarkMode}
                              aria-label="Bật hoặc tắt Fullscreen Dark Mode"
                              onClick={() => handleToggleFullscreenDarkMode()}
                              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                isFullscreenDarkMode ? "bg-indigo-600" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-flex h-7 w-7 shrink-0 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out items-center justify-center ${
                                  isFullscreenDarkMode ? "translate-x-6" : "translate-x-0"
                                }`}
                              >
                                {isFullscreenDarkMode ? (
                                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                                ) : (
                                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                                )}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2. Quản lý Tùy chọn Thông báo (Notification Preferences) */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-600" />
                            <span>Tuỳ chọn thông báo</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              triggerSimulatedPush(
                                "Thông báo kiểm tra thành công!",
                                "Cấu hình thông báo và âm thanh học tập của em đang hoạt động hoàn hảo.",
                                activeTab,
                                "Tiếp tục học"
                              );
                            }}
                            className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 text-[11px] font-extrabold transition-colors cursor-pointer"
                          >
                            Gửi thử thông báo
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {/* 2.1 Nhắc lịch học hằng ngày (Daily Study Reminder) */}
                          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-900">
                                  Nhắc nhở giờ học hằng ngày (Daily Study Reminder)
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                  Tự động gửi lời nhắc đúng khung giờ tự học mỗi ngày của em
                                </p>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={studyReminder.enabled}
                                aria-label="Bật hoặc tắt nhắc nhở giờ học hằng ngày"
                                onClick={() => {
                                  studyReminder.toggleReminder(!studyReminder.enabled);
                                }}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                  studyReminder.enabled ? "bg-blue-600" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                    studyReminder.enabled ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>

                            {studyReminder.enabled && (
                              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                                <label htmlFor="settings-reminder-time" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Khung giờ nhắc học mỗi ngày:</span>
                                </label>
                                <input
                                  id="settings-reminder-time"
                                  type="time"
                                  value={studyReminder.time}
                                  onChange={(e) => studyReminder.updateTime(e.target.value)}
                                  className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-mono font-extrabold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}
                          </div>

                          {/* 2.2 Cảnh báo bảo vệ chuỗi Streak (Streak Protection Alerts) */}
                          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Cảnh báo giữ chuỗi chuyên cần (Streak Alerts)</span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                Thông báo khi chuỗi {progress.streak || 0} ngày học liên tiếp có nguy cơ bị gián đoạn
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={notificationPrefs.streakAlerts}
                              aria-label="Bật hoặc tắt cảnh báo chuỗi Streak"
                              onClick={() => handleUpdateNotificationPref("streakAlerts", !notificationPrefs.streakAlerts)}
                              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                notificationPrefs.streakAlerts ? "bg-blue-600" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                  notificationPrefs.streakAlerts ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* 2.3 Thông báo Nhiệm vụ & Phần thưởng XP (Quest & Reward Notifications) */}
                          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Thông báo hoàn thành Nhiệm vụ và Thưởng XP</span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                Hiển thị thông báo khi hoàn thành nhiệm vụ ngày, thăng cấp Level hoặc nhận Xu
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={notificationPrefs.questAlerts}
                              aria-label="Bật hoặc tắt thông báo nhiệm vụ và phần thưởng"
                              onClick={() => handleUpdateNotificationPref("questAlerts", !notificationPrefs.questAlerts)}
                              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                notificationPrefs.questAlerts ? "bg-blue-600" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                  notificationPrefs.questAlerts ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* 2.4 Âm thanh chuông thông báo (Notification Sound Effects) */}
                          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                {notificationPrefs.soundEffects ? (
                                  <Volume2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                ) : (
                                  <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                                <span>Âm thanh chuông thông báo (Sound Effects)</span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                Phát âm báo nhẹ nhàng khi có thông báo mới hoặc hoàn thành phiên Pomodoro
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={notificationPrefs.soundEffects}
                              aria-label="Bật hoặc tắt âm thanh thông báo"
                              onClick={() => handleUpdateNotificationPref("soundEffects", !notificationPrefs.soundEffects)}
                              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                notificationPrefs.soundEffects ? "bg-blue-600" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                  notificationPrefs.soundEffects ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                      </>)}
                    </div>

                    {/* Chân Modal Settings */}
                    <div data-ss-fixed-size className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Mọi thay đổi được tự động lưu
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSettingsModalOpen(false)}
                        className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all duration-200 cursor-pointer"
                      >
                        Hoàn tất
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </>
          )}

        {/* Outer content padding - Fluid full-width scrollable region across all zoom levels (100%, 75%, 50%, 125%, 150%) */}
        <main 
          id="main_content_scroll" tabIndex={-1}
          className={`flex-1 overflow-y-auto overscroll-contain scrollbar-none ${
            isFocusReaderMode
              ? "p-2 sm:p-4 max-w-5xl mx-auto"
              : isMobileOrTablet
                ? "px-3 sm:px-5 pt-3.5 pb-28 scroll-pb-28 w-full max-w-none" /* scroll-pb: a focused item is never left under the bottom nav (WCAG 2.4.11) */
                : "px-4 sm:px-6 lg:px-7 xl:px-8 pt-4 sm:pt-6 pb-12 w-full max-w-none"
          } w-full transition-all duration-300 ${
            isLessonFocusAnimationActive ? "lesson-focus-mode" : ""
          }`}
        >
          <React.Suspense fallback={null}><QuickLookup /></React.Suspense>
          <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-12"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>}>

          {/* Global Offline Mode Notice Banner */}
          {!effectiveOnline && (
            <div className="lesson-focus-dimmable mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/60 rounded-2xl flex items-center justify-between gap-4 shadow-sm animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-650 shrink-0 mt-0.5">
                  <WifiOff className="w-5 h-5 text-red-600" />
                </div>
                <div className="space-y-1">
                  <span className="font-black text-xs text-red-950 block">Đang ở chế độ ngoại tuyến</span>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    Hệ thống đã tự động lưu trữ các bài học của em. Em vẫn có thể tự do đọc sách, học bài, viết ghi chú và giải bài tập bình thường mà không cần mạng!
                  </p>
                </div>
              </div>
              
              {isManualOffline && (
                <button
                  onClick={() => setIsManualOffline(false)}
                  className="px-3 py-1.5 bg-red-100 border border-red-200 hover:bg-red-200 text-red-800 font-extrabold text-[10px] rounded-lg transition-all cursor-pointer shadow-xs shrink-0 uppercase"
                >
                  Kết nối lại
                </button>
              )}
            </div>
          )}

          
          {activeTab === "parent-teacher" && (
            <ParentTeacherPortal
              progress={progress}
              lessons={lessons}
              quizHistory={quizHistory}
              onUpdateProgress={updateProgress}
              onNavigateToTab={setActiveTab}
              onStartQuizWithTopic={(topic) => {
                handleStartTrialQuiz(progress.grade || "Lớp 6", "toan");
              }}
              user={user}
              onLogin={() => { void logInWithGoogle(); }}
            />
          )}

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
              selectedAvatarIdx={selectedAvatarIdx}
              quizHistory={quizHistory}
            />
          )}

          {activeTab === "learn" && (
            <LessonForm onGenerateLesson={handleGenerateLesson} loading={generatingLesson} />
          )}

          {activeTab === "reading" && (
            <ReadingComprehension
              onEarnCoins={(amount) => updateProgress({ coins: progress.coins + amount })}
              onEarnXp={(amount) => updateProgress({ points: progress.points + amount })}
              onBackToHome={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "essay" && (
            <EssayArena
              onEarnCoins={(amount) => updateProgress({ coins: progress.coins + amount })}
              onEarnXp={(amount) => updateProgress({ points: progress.points + amount })}
              onBackToHome={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "download-app" && <AppDownloadPage />}
          {activeTab === "geomath" && <GeoMathBoard />}
          {activeTab === "tools" && <ToolsHub onNavigateTab={handleNavigateTab} />}
          {activeTab === "dictionary" && <DictionaryPage key={dictRequest.n} initialQuery={dictRequest.word} />}
          {activeTab === "study-lock" && <StudyLockSettings onNavigateTab={handleNavigateTab} studentName={progress.displayName || user?.displayName || ""} />}

          {activeTab === "podcast" && (
            <PodcastPage
              lessons={lessons}
              progress={progress}
              onUpdateProgress={updateProgress}
              triggerSuccessMessage={triggerSuccessMessage}
            />
          )}
          
          {activeTab === "review" && (
            selectedLesson ? (
              <LessonReader 
                lesson={selectedLesson} 
                onBack={() => {
                  setIsFocusReaderMode(false);
                  if ('startViewTransition' in document) {
                    (document as any).startViewTransition(() => {
                      setSelectedLesson(null);
                    });
                  } else {
                    setSelectedLesson(null);
                  }
                }} 
                onUpdateNotes={handleUpdateNotes}
                onToggleComplete={handleToggleComplete}
                onStartQuizFromLesson={handleStartQuizFromLesson}
                isFocusMode={isFocusReaderMode}
                onToggleFocusMode={setIsFocusReaderMode}
                isAmbientDimmed={isLessonFocusDimmed}
                onToggleAmbientDim={setIsLessonFocusDimmed}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2.5">
                    <div>
                      <h2 className="font-display font-black text-2xl text-slate-900">Thư viện bài ôn tập</h2>
                      <p className="text-xs text-slate-500">Danh sách các bài học bạn đã lưu để ôn luyện và ghi chú</p>
                    </div>
                    {/* Top-level All vs Bookmarks Tab Switcher */}
                    <div className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex items-center gap-1 sm:gap-1.5 bg-sky-200/70 p-1 rounded-2xl border border-sky-300/70 shadow-inner" role="tablist" aria-label="Chế độ xem thư viện bài học">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={statusFilter !== "pinned"}
                        onClick={() => setStatusFilter("all")}
                        className={`px-2 sm:px-3.5 py-1.5 min-h-[44px] sm:min-h-0 justify-center whitespace-nowrap rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                          statusFilter !== "pinned"
                            ? "bg-sky-600 text-white shadow-sm"
                            : "text-sky-900 hover:bg-white/60"
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Tất cả bài học</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black tabular-nums ${
                          statusFilter !== "pinned" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800"
                        }`}>
                          {lessons.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={statusFilter === "pinned"}
                        onClick={() => setStatusFilter(statusFilter === "pinned" ? "all" : "pinned")}
                        className={`px-2 sm:px-3.5 py-1.5 min-h-[44px] sm:min-h-0 justify-center whitespace-nowrap rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                          statusFilter === "pinned"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "text-amber-900 hover:bg-amber-100/70"
                        }`}
                        title="Xem các bài học đã đánh dấu Bookmark"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${statusFilter === "pinned" ? "fill-white text-white" : "fill-amber-400 text-amber-600"}`} />
                        <span className="sm:hidden">Đã lưu</span>
                        <span className="hidden sm:inline">Bookmarks · Đã lưu</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black tabular-nums ${
                          statusFilter === "pinned" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"
                        }`}>
                          {lessons.filter((l) => Boolean(l.pinned)).length}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="flex items-center justify-center bg-sky-200/70 p-1 rounded-xl border border-sky-300/60 shadow-inner shrink-0">
                      <button 
                        type="button"
                        onClick={() => setLibraryViewMode("grid")}
                        aria-label="Chế độ lưới"
                        aria-pressed={libraryViewMode === "grid"}
                        className={`p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center rounded-lg transition-all cursor-pointer ${libraryViewMode === "grid" ? "bg-sky-600 text-white shadow-sm" : "text-sky-900 hover:text-sky-950"}`}
                        title="Chế độ lưới"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setLibraryViewMode("list")}
                        aria-label="Chế độ danh sách"
                        aria-pressed={libraryViewMode === "list"}
                        className={`p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center rounded-lg transition-all cursor-pointer ${libraryViewMode === "list" ? "bg-sky-600 text-white shadow-sm" : "text-sky-900 hover:text-sky-950"}`}
                        title="Chế độ danh sách"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative flex-1 min-w-0 sm:flex-initial sm:w-80">
                      <button 
                        onClick={() => { if (searchQuery.trim()) addToSearchHistory(searchQuery); }}
                        className="absolute left-2.5 top-2 hover:scale-110 active:scale-95 transition-transform text-slate-400 hover:text-sky-600 cursor-pointer p-1 rounded z-10"
                        title="Tìm kiếm"
                        aria-label="Tìm kiếm"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <input 
                        type="text" 
                        aria-label="Tìm bài học" placeholder="Tìm bài học theo tên, môn, lớp..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowHistoryDesktop(true)}
                        onBlur={() => setTimeout(() => setShowHistoryDesktop(false), 200)}
                        onKeyDown={handleSearchKeyDown}
                        className="w-full pl-10 pr-9 py-2 bg-sky-100/90 border border-sky-200/80 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-sky-200/60 transition-all text-sky-950 placeholder-slate-400"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 hover:bg-sky-200 rounded-full transition-all"
                          title="Xóa tìm kiếm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Recent searches dropdown */}
                      {showHistoryDesktop && searchHistory.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-sky-100 border border-sky-300 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                          <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-sky-200 flex justify-between items-center">
                            <span>Tìm kiếm gần đây</span>
                            <button 
                              onMouseDown={(e) => { e.preventDefault(); setSearchHistory([]); }}
                              className="text-[9px] font-bold text-rose-500 hover:text-rose-700 hover:underline"
                            >
                              Xóa hết
                            </button>
                          </div>
                          {searchHistory.map((term, idx) => (
                            <div 
                              key={idx}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSearchQuery(term);
                                setShowHistoryDesktop(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-sky-950 hover:bg-sky-200/70 cursor-pointer transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                              <span className="truncate w-full text-left">{term}</span>
                              <button 
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setSearchHistory(prev => prev.filter(s => s !== term)); }}
                                className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                                title="Xóa"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bộ lọc Thư viện bài ôn tập (Môn học, Loại nội dung, Độ khó, Khối lớp, Trạng thái) */}
                <LessonLibraryFilterBar
                  lessons={lessons}
                  selectedSubject={selectedSubject}
                  onSelectSubject={setSelectedSubject}
                  selectedGrade={selectedGrade}
                  onSelectGrade={setSelectedGrade}
                  statusFilter={statusFilter}
                  onSelectStatus={setStatusFilter}
                  difficultyFilter={difficultyFilter}
                  onSelectDifficulty={setDifficultyFilter}
                  contentTypeFilter={contentTypeFilter}
                  onSelectContentType={setContentTypeFilter}
                  userGrade={progress.grade}
                  onResetFilters={() => {
                    setSelectedSubject("all");
                    setSelectedGrade("all");
                    setStatusFilter("all");
                    setDifficultyFilter("all");
                    setContentTypeFilter("all");
                    setSearchQuery("");
                  }}
                  filteredCount={filteredLessons.length}
                  totalCount={lessons.length}
                />
                
                {/* AI Web Search Fallback */}
                {searchQuery && filteredLessons.length === 0 && (
                  <div className="mt-6 border-t border-sky-200/60 pt-6">
                    <div className="bg-sky-100/90 rounded-[2rem] p-6 border border-sky-200/80 relative overflow-hidden">
                      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-12 h-12 rounded-full bg-sky-200 flex flex-shrink-0 items-center justify-center text-2xl shadow-sm border border-sky-300">
                          🤖
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h4 className="font-display font-bold text-sky-950 text-base flex items-center gap-2">
                              Tìm kiếm kiến thức bằng AI Google Search
                              <span className="px-2 py-0.5 rounded text-[10px] bg-sky-200 text-sky-800 uppercase tracking-widest font-black">BETA</span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Bài học "{searchQuery}" không có trong thư viện của em. Hãy để Trợ lý AI tổng hợp kiến thức trực tuyến từ Google nhé!
                            </p>
                          </div>
                          
                          {aiSearchState === 'idle' && (
                            <button 
                              onClick={handleAISearch}
                              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Search className="w-4 h-4" />
                              Khởi động tìm kiếm AI
                            </button>
                          )}
                          
                          {aiSearchState === 'searching' && (
                            <div className="flex items-center gap-3 text-sky-700 font-bold text-sm bg-sky-100 p-4 rounded-xl border border-sky-300">
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              Đang lướt web tìm dữ liệu về "{searchQuery}"...
                            </div>
                          )}
                          
                          {aiSearchState === 'done' && (
                            <div className="bg-sky-100 rounded-2xl p-5 border border-sky-300 shadow-sm">
                              <div data-quick-lookup className="prose-custom text-sm">
                                <React.Suspense fallback={<p className="whitespace-pre-wrap">{aiSearchResult}</p>}>
                                  <MathMarkdown text={aiSearchResult} />
                                </React.Suspense>
                              </div>
                              <button 
                                onClick={() => setAiSearchState('idle')}
                                className="mt-4 px-4 py-2 bg-sky-200 hover:bg-sky-300 text-sky-900 font-bold text-xs rounded-xl transition-all cursor-pointer"
                              >
                                Đóng kết quả
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {filteredLessons.length === 0 ? (
                  <div className="text-center py-12 px-6 bg-sky-100/60 rounded-[2.5rem] border border-sky-200/60 border-dashed space-y-4">
                    <div className="w-16 h-16 bg-sky-200/70 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                      🔍
                    </div>
                    <div className="max-w-md mx-auto space-y-1.5">
                      <p className="text-slate-900 font-bold text-base">Không tìm thấy bài học nào phù hợp</p>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        {selectedSubject !== "all" || selectedGrade !== "all" || statusFilter !== "all" || difficultyFilter !== "all" || contentTypeFilter !== "all" || searchQuery ? (
                          <>
                            Không có bài học nào khớp với bộ lọc đang chọn
                            {selectedSubject !== "all" && <span> • Môn: <strong className="text-blue-800">{SUBJECT_DEFINITIONS.find(s => s.id === selectedSubject)?.name}</strong></span>}
                            {contentTypeFilter !== "all" && <span> • Loại nội dung: <strong className="text-blue-800">{contentTypeFilter}</strong></span>}
                            {difficultyFilter !== "all" && <span> • Độ khó: <strong className="text-blue-800">{difficultyFilter === "Dễ" ? "Cơ bản (Dễ)" : difficultyFilter === "Khó" ? "Nâng cao (Khó)" : "Trung bình"}</strong></span>}
                            {selectedGrade !== "all" && <span> • Khối: <strong className="text-blue-800">{selectedGrade}</strong></span>}
                            {statusFilter !== "all" && <span> • Trạng thái: <strong className="text-blue-800">{statusFilter === "completed" ? "Đã học" : statusFilter === "incomplete" ? "Chưa học" : "Đã ghim"}</strong></span>}
                            {searchQuery && <span> • Từ khóa: "<strong className="text-blue-800">{searchQuery}</strong>"</span>}
                            .
                          </>
                        ) : (
                          "Thư viện bài học của bạn hiện đang trống. Hãy bắt đầu tạo bài học đầu tiên nhé!"
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {(selectedSubject !== "all" || selectedGrade !== "all" || statusFilter !== "all" || difficultyFilter !== "all" || contentTypeFilter !== "all" || searchQuery) && (
                        <button
                          onClick={() => {
                            setSelectedSubject("all");
                            setSelectedGrade("all");
                            setStatusFilter("all");
                            setDifficultyFilter("all");
                            setContentTypeFilter("all");
                            setSearchQuery("");
                          }}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          Xóa tất cả bộ lọc ↺
                        </button>
                      )}

                      <button
                        onClick={() => setActiveTab("learn")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Học bài mới cùng AI ngay</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={libraryViewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5 gap-4 sm:gap-5" : "space-y-4"}>
                    {filteredLessons.map((lesson) => {
                      const isExpandedPreview = expandedPreviewLessonId === lesson.id;
                      const previewDetails = getLessonPreviewDetails(lesson);

                      if (libraryViewMode === "list") {
                        return (
                          <div 
                            key={lesson.id} 
                            aria-expanded={isExpandedPreview}
                            className={`group rounded-[2rem] p-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer border ${
                              isExpandedPreview
                                ? "bg-white border-sky-400 shadow-xl ring-2 ring-sky-400/50 scale-[1.005]"
                                : "bg-sky-100/90 border-sky-200/80 shadow-sm hover:shadow-lg hover:border-sky-300 hover:bg-sky-50"
                            }`}
                            onClick={() => handleToggleExpandLessonCard(lesson.id)}
                          >
                            <div className="flex flex-row items-center gap-5">
                            {/* Header/Icon Area */}
                            <div className="w-24 shrink-0">
                              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-inner text-xl ${lesson.completed ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-sky-200/80 text-sky-700 border border-sky-300/80'}`}>
                                {lesson.completed ? (
                                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                ) : (
                                  <span>{SUBJECT_DEFINITIONS.find(s => s.id === detectLessonSubject(lesson))?.icon || "📖"}</span>
                                )}
                              </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                              <div className="space-y-1.5 mb-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {(() => {
                                    const subId = detectLessonSubject(lesson);
                                    const subDef = SUBJECT_DEFINITIONS.find((s) => s.id === subId);
                                    return (
                                      <span className={`text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 rounded-lg border flex items-center gap-1 ${subDef ? subDef.bgLight : "bg-sky-200/80 text-sky-800 border-sky-300"}`}>
                                        <span>{subDef?.icon || "📖"}</span>
                                        <span>{subDef?.name || lesson.bookName}</span>
                                      </span>
                                    );
                                  })()}

                                  <span className="text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 bg-indigo-50 border border-indigo-200/80 text-indigo-700 rounded-lg uppercase tracking-wider">
                                    {lesson.grade?.startsWith("Lớp") ? lesson.grade : `Lớp ${lesson.grade || "6"}`}
                                  </span>

                                  <span className={`text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 rounded-lg border inline-flex items-center gap-1 ${previewDetails.contentType.className}`}>
                                    <span>{previewDetails.contentType.icon}</span>
                                    <span>{previewDetails.contentType.type}</span>
                                  </span>

                                  <span className={`text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 rounded-lg border ${previewDetails.difficulty.className}`}>
                                    {previewDetails.difficulty.label}
                                  </span>

                                  {sharedLessonBadges[lesson.id] && (
                                    <span
                                      title="Bài học được đánh dấu từ liên kết chia sẻ học tập"
                                      className="inline-flex items-center gap-1 text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 bg-sky-600 text-white rounded-lg shadow-2xs"
                                    >
                                      <span>🔗</span>
                                      <span>#{sharedLessonBadges[lesson.id]}</span>
                                    </span>
                                  )}

                                  {lesson.pinned && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-lg flex items-center gap-0.5">
                                      📌 Ghim
                                    </span>
                                  )}
                                </div>
                                
                                <h4 className="font-display font-bold text-sky-950 text-xs sm:text-sm leading-snug line-clamp-1">
                                  {lesson.title}
                                </h4>
                                
                                <p className="text-slate-600 font-medium text-[11px] leading-relaxed line-clamp-1">
                                  {lesson.topic || (lesson.content ? lesson.content.replace(/[#*`~_>-]/g, '').substring(0, 100) : "Chưa có nội dung")}
                                </p>
                              </div>
                            </div>

                            {/* List view specific actions */}
                            <div className="flex flex-col gap-2 shrink-0 border-l border-sky-200 pl-4 ml-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  aria-pressed={Boolean(lesson.pinned)}
                                  aria-label={lesson.pinned ? "Bỏ đánh dấu Bookmark bài học" : "Đánh dấu Bookmark bài học"}
                                  title={lesson.pinned ? "Bỏ đánh dấu Bookmark" : "Đánh dấu Bookmark bài học này"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePinLesson(lesson.id);
                                  }}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 z-20 relative flex items-center justify-center ${
                                    lesson.pinned
                                      ? "bg-amber-100 text-amber-700 border-amber-300 shadow-2xs hover:bg-amber-200"
                                      : "bg-white/80 text-slate-500 border-sky-200 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50"
                                  }`}
                                >
                                  <Bookmark className={`w-4 h-4 ${lesson.pinned ? "fill-amber-500 text-amber-600" : ""}`} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleExpandLessonCard(lesson.id);
                                  }}
                                  className={`px-3 py-1.5 font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1 active:scale-95 z-20 relative ${
                                    isExpandedPreview
                                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                      : "bg-sky-600 hover:bg-sky-700 text-white"
                                  }`}
                                >
                                  <span>{isExpandedPreview ? "Thu gọn ▲" : "Xem trước"}</span>
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectLesson(lesson);
                                }}
                                className="font-extrabold text-sky-700 hover:text-indigo-700 hover:underline text-xs text-left cursor-pointer"
                              >
                                Mở bài đọc →
                              </button>
                            </div>
                            </div>

                            {/* Smooth Accordion Expansion Content Preview (List View) */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                isExpandedPreview
                                  ? "grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-sky-200/90"
                                  : "grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t border-transparent pointer-events-none"
                              }`}
                            >
                              <div className="overflow-hidden min-h-0">
                                <div className="rounded-2xl bg-gradient-to-br from-sky-50 via-white to-indigo-50/60 border border-sky-200/90 p-4 space-y-3 shadow-inner">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" />
                                        Xem trước nội dung bài học
                                      </span>
                                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                                        ~{previewDetails.readingMinutes} phút đọc
                                      </span>
                                      <span className={`text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 rounded-lg border ${previewDetails.difficulty.className}`}>
                                        Mức độ: {previewDetails.difficulty.label}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedPreviewLessonId(null)}
                                      className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      Đóng xem trước ✕
                                    </button>
                                  </div>

                                  {previewDetails.headings.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] font-extrabold uppercase text-sky-900 mr-1">
                                        Các phần chính:
                                      </span>
                                      {previewDetails.headings.map((h, idx) => (
                                        <span
                                          key={idx}
                                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-sky-100/90 text-sky-900 border border-sky-200/80"
                                        >
                                          {idx + 1}. {h}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed bg-white/90 p-3 rounded-xl border border-sky-100">
                                    {previewDetails.cleanParagraphs.length > 0 ? (
                                      previewDetails.cleanParagraphs.map((para, idx) => (
                                        <p key={idx} className="line-clamp-2 font-medium">
                                          {para}
                                        </p>
                                      ))
                                    ) : (
                                      <p className="font-medium text-slate-600">
                                        {lesson.topic || "Bài giảng tổng hợp lý thuyết trọng tâm, ví dụ minh họa và ghi nhớ nhanh."}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                    <span className="text-[11px] font-semibold text-slate-500">
                                      Nhấn nút bên phải để mở trình đọc toàn màn hình, nghe đọc AI và ghi chú.
                                    </span>
                                    <div className="flex items-center gap-2 ml-auto">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectLesson(lesson)}
                                        className="px-4 py-2 rounded-xl ss-btn-grad text-white font-black text-xs shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                      >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>Đọc toàn bộ bài học</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Chế độ Lưới: Hiệu ứng Hover Nghiêng 3D nhẹ (3D Tilt Effect) + Ánh sáng Glare + Lật thẻ 3D & Xem trước nội dung
                      return (
                        <div
                          key={lesson.id}
                          aria-expanded={isExpandedPreview}
                          className={`w-full h-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            isExpandedPreview
                              ? "sm:col-span-2 lg:col-span-3 2xl:col-span-4 min-[1900px]:col-span-5 bg-white/95 rounded-[2.25rem] p-3 border-2 border-sky-400 shadow-2xl ring-4 ring-sky-400/20"
                              : ""
                          }`}
                        >
                          <div
                            className="flip-card-perspective lesson-tilt-stage min-h-[276px] h-full w-full"
                            onMouseEnter={(e) => {
                              if (!isSpotlightHoverEnabled || isMobileOrTablet) return;
                              const el = e.currentTarget;
                              const rect = el.getBoundingClientRect();
                              el.dataset.rectLeft = String(rect.left);
                              el.dataset.rectTop = String(rect.top);
                              el.dataset.rectWidth = String(rect.width || 300);
                              el.dataset.rectHeight = String(rect.height || 310);
                            }}
                            onMouseMove={(e) => {
                              if (!isSpotlightHoverEnabled || isMobileOrTablet) return;
                              const el = e.currentTarget;
                              const left = Number(el.dataset.rectLeft);
                              const top = Number(el.dataset.rectTop);
                              const width = Number(el.dataset.rectWidth) || 300;
                              const height = Number(el.dataset.rectHeight) || 310;
                              if (Number.isNaN(left) || Number.isNaN(top)) return;
                              const x = e.clientX - left;
                              const y = e.clientY - top;
                              const centerX = width / 2;
                              const centerY = height / 2;
                              // Góc nghiêng 3D nhẹ nhàng (±6.5 độ) tạo chiều sâu sinh động mà không gây chóng mặt
                              const rotateX = ((centerY - y) / centerY) * 6.5;
                              const rotateY = ((x - centerX) / centerX) * 6.5;
                              const glareX = (x / width) * 100;
                              const glareY = (y / height) * 100;
                              el.style.setProperty("--tilt-rx", `${rotateX.toFixed(2)}deg`);
                              el.style.setProperty("--tilt-ry", `${rotateY.toFixed(2)}deg`);
                              el.style.setProperty("--glare-x", `${glareX.toFixed(1)}%`);
                              el.style.setProperty("--glare-y", `${glareY.toFixed(1)}%`);
                              el.style.setProperty("--tilt-active", "1");
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget;
                              el.style.setProperty("--tilt-rx", "0deg");
                              el.style.setProperty("--tilt-ry", "0deg");
                              el.style.setProperty("--glare-x", "50%");
                              el.style.setProperty("--glare-y", "50%");
                              el.style.setProperty("--tilt-active", "0");
                            }}
                          >
                            <div className="lesson-tilt-wrapper w-full h-full">
                              <div 
                                className={`flip-card flip-card-inner group w-full h-full relative cursor-pointer ${flippedLessons[lesson.id] ? "is-flipped" : ""}`}
                                onClick={() => handleToggleExpandLessonCard(lesson.id)}
                              >
                              {/* MẶT TRƯỚC (FRONT FACE) */}
                              <div className="flip-card-front bg-sky-100/90 border border-sky-200/80 rounded-[2rem] p-5 shadow-sm group-hover:border-sky-300/95 group-hover:bg-sky-50/95 transition-colors flex flex-col justify-between overflow-hidden">
                                {/* Lớp phản chiếu ánh sáng 3D (Dynamic 3D Glare Sheen) di chuyển theo con trỏ chuột */}
                                <div className="lesson-tilt-glare pointer-events-none" aria-hidden="true" />

                                <div className="space-y-3 lesson-tilt-depth-layer relative z-10">
                                  {/* Header / Icon & Actions */}
                                  <div className="lesson-card-head flex items-start justify-between gap-2">
                                    <div className="lesson-card-lead flex items-center gap-2.5 min-w-0 flex-1">
                                      <div className={`lesson-tilt-badge shrink-0 w-11 h-11 rounded-[1.2rem] flex items-center justify-center shadow-inner text-xl ${lesson.completed ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-sky-200/80 text-sky-700 border border-sky-300/80'}`}>
                                        {lesson.completed ? (
                                          <CheckCircle2 className="w-5.5 h-5.5 text-emerald-600" />
                                        ) : (
                                          <span>{SUBJECT_DEFINITIONS.find(s => s.id === detectLessonSubject(lesson))?.icon || "📖"}</span>
                                        )}
                                      </div>
                                      <div className="lesson-card-chips flex flex-wrap items-center gap-1.5">
                                        {(() => {
                                          const subId = detectLessonSubject(lesson);
                                          const subDef = SUBJECT_DEFINITIONS.find((s) => s.id === subId);
                                          return (
                                            <span className={`text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 rounded-lg border flex items-center gap-1 ${subDef ? subDef.bgLight : "bg-sky-200/80 text-sky-800 border-sky-300"}`}>
                                              <span>{subDef?.icon || "📖"}</span>
                                              <span>{subDef?.shortName || lesson.bookName}</span>
                                            </span>
                                          );
                                        })()}

                                        <span className="text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 bg-indigo-50 border border-indigo-200/80 text-indigo-700 rounded-lg uppercase tracking-wider">
                                          {lesson.grade?.startsWith("Lớp") ? lesson.grade : `Lớp ${lesson.grade || "6"}`}
                                        </span>
                                        <span className={`text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 rounded-lg border inline-flex items-center gap-1 ${previewDetails.contentType.className}`}>
                                          <span>{previewDetails.contentType.icon}</span>
                                          <span>{previewDetails.contentType.type}</span>
                                        </span>
                                        <span className={`text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 rounded-lg border ${previewDetails.difficulty.className}`}>
                                          {previewDetails.difficulty.label}
                                        </span>
                                        {sharedLessonBadges[lesson.id] && (
                                          <span
                                            title="Bài học được đánh dấu từ liên kết chia sẻ học tập"
                                            className="inline-flex items-center gap-1 text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 bg-sky-600 text-white rounded-lg shadow-2xs"
                                          >
                                            <span>🔗</span>
                                            <span>#{sharedLessonBadges[lesson.id]}</span>
                                          </span>
                                        )}
                                        {lesson.pinned && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg">
                                            <Bookmark className="w-3 h-3 fill-amber-500 text-amber-600" />
                                            <span>Đã lưu</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="lesson-card-actions flex items-center gap-1 shrink-0">
                                      {/* Nút đánh dấu Bookmark bài học */}
                                      <button
                                        type="button"
                                        aria-pressed={Boolean(lesson.pinned)}
                                        aria-label={lesson.pinned ? "Bỏ đánh dấu Bookmark bài học" : "Đánh dấu Bookmark bài học"}
                                        title={lesson.pinned ? "Bỏ đánh dấu Bookmark" : "Đánh dấu Bookmark bài học này"}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTogglePinLesson(lesson.id);
                                        }}
                                        className={`p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center rounded-lg transition-all cursor-pointer active:scale-95 ${
                                          lesson.pinned
                                            ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-2xs hover:bg-amber-200"
                                            : "text-sky-500 hover:text-amber-600 hover:bg-amber-50/90"
                                        }`}
                                      >
                                        <Bookmark className={`w-4 h-4 ${lesson.pinned ? "fill-amber-500 text-amber-600" : ""}`} />
                                      </button>

                                      {/* Nút lật thẻ nhanh */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFlippedLessons(prev => ({ ...prev, [lesson.id]: !prev[lesson.id] }));
                                        }}
                                        title="Lật thẻ 3D xem tóm tắt"
                                        aria-label="Lật thẻ xem tóm tắt"
                                        className="p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center text-sky-500 hover:text-sky-800 hover:bg-sky-200/70 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </button>

                                      {/* Options Menu */}
                                      <div className="relative">
                                        <button 
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuLessonId(activeMenuLessonId === lesson.id ? null : lesson.id);
                                          }}
                                          aria-label="Tùy chọn bài học"
                                          aria-haspopup="menu"
                                          aria-expanded={activeMenuLessonId === lesson.id}
                                          className="p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center text-sky-500 hover:text-sky-800 hover:bg-sky-200/70 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </button>
                                        
                                        {/* Dropdown Menu */}
                                        {activeMenuLessonId === lesson.id && (
                                          <div 
                                            className="absolute right-0 top-full mt-1 w-36 bg-white border border-sky-300 rounded-xl shadow-xl overflow-hidden z-30 animate-fade-in origin-top-right text-slate-800"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div className="py-1">
                                              <button 
                                                type="button"
                                                onClick={() => {
                                                  handleSelectLesson(lesson);
                                                  setActiveMenuLessonId(null);
                                                }}
                                                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-sky-950 hover:bg-sky-100 flex items-center gap-2 cursor-pointer"
                                              >
                                                <Search className="w-3.5 h-3.5 text-sky-600" />
                                                Xem chi tiết
                                              </button>
                                              <button 
                                                type="button"
                                                onClick={() => {
                                                  handleTogglePinLesson(lesson.id);
                                                  setActiveMenuLessonId(null);
                                                }}
                                                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-amber-800 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                                              >
                                                <Bookmark className={`w-3.5 h-3.5 ${lesson.pinned ? "fill-amber-500 text-amber-600" : "text-amber-600"}`} />
                                                {lesson.pinned ? "Bỏ lưu Bookmark" : "Lưu vào Bookmarks"}
                                              </button>
                                              <button 
                                                type="button"
                                                onClick={() => {
                                                  handleToggleComplete(lesson.id);
                                                  setActiveMenuLessonId(null);
                                                }}
                                                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-sky-950 hover:bg-sky-100 flex items-center gap-2 cursor-pointer"
                                              >
                                                <Check className={`w-3.5 h-3.5 ${lesson.completed ? 'text-emerald-600' : 'text-slate-400'}`} />
                                                {lesson.completed ? 'Bỏ đánh dấu' : 'Đánh dấu hoàn thành'}
                                              </button>
                                              <button 
                                                  type="button"
                                                  onClick={() => {
                                                    handleShareLesson(lesson);
                                                    setActiveMenuLessonId(null);
                                                  }}
                                                  className="w-full text-left px-3 py-2 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 flex items-center gap-2 cursor-pointer"
                                                >
                                                  <Share2 className="w-3.5 h-3.5 text-sky-600" />
                                                  Tạo link chia sẻ (#lesson)
                                                </button>
                                                <div className="h-px bg-sky-200 my-1"></div>
                                              <button 
                                                type="button"
                                                onClick={() => {
                                                  handleDeleteLesson(lesson.id);
                                                  setActiveMenuLessonId(null);
                                                }}
                                                className="w-full text-left px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-100 flex items-center gap-2 cursor-pointer"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Xóa bài học
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Title */}
                                  <h4 className="font-display font-bold text-sky-950 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-[#1e3a8a] transition-colors">
                                    {lesson.title}
                                  </h4>

                                  {/* Topic or Excerpt */}
                                  {lesson.topic && (
                                    <div className="bg-sky-200/50 px-2.5 py-1.5 rounded-xl border border-sky-300/60">
                                      <span className="font-extrabold text-sky-850 text-[9px] block uppercase">Chủ đề chính</span>
                                      <p className="text-sky-950 font-semibold text-[11px] leading-tight line-clamp-1">{lesson.topic}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Front Bottom Bar with Interactive 3D Flip Action */}
                                <div className="pt-2 border-t border-sky-200/80 flex items-center justify-between text-[11px] relative z-10 lesson-tilt-depth-layer">
                                  <span className="text-slate-500 font-medium text-[10px]">
                                    {lesson.grade || "THCS"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFlippedLessons(prev => ({ ...prev, [lesson.id]: !prev[lesson.id] }));
                                    }}
                                    className="inline-flex min-h-6 items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-200/70 hover:bg-[#2e5cb8] hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer active:scale-95"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Lật thẻ tóm tắt</span>
                                  </button>
                                </div>
                              </div>

                              {/* MẶT SAU (BACK FACE) - HIỂN THỊ TÓM TẮT NỘI DUNG SINH ĐỘNG */}
                              <div className="flip-card-back bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950 border-2 border-sky-400/50 rounded-[2rem] p-5 shadow-2xl text-white flex flex-col justify-between overflow-hidden relative">
                                {/* Background ambient blurs */}
                                <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                                {/* Top Bar */}
                                <div className="relative z-10 space-y-2">
                                  <div className="flex items-center justify-between border-b border-sky-700/50 pb-2">
                                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider">
                                      <FileText className="w-3.5 h-3.5 text-amber-400 fill-amber-300" />
                                      <span>Tóm tắt bài học</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFlippedLessons(prev => ({ ...prev, [lesson.id]: false }));
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] font-extrabold whitespace-nowrap px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 text-sky-200 cursor-pointer transition-colors"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Mặt trước</span>
                                    </button>
                                  </div>

                                  <h5 className="font-display font-black text-sky-100 text-xs leading-snug line-clamp-1">
                                    {lesson.title}
                                  </h5>

                                  {/* Summary Box */}
                                  <div className="bg-sky-900/60 backdrop-blur-xs rounded-xl p-2.5 border border-sky-500/30 space-y-1.5">
                                    {lesson.notes ? (
                                      <div>
                                        <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1 mb-0.5">
                                          Ghi chú cốt lõi:
                                        </span>
                                        <p className="text-[11px] text-sky-100 font-medium leading-relaxed line-clamp-3">
                                          {lesson.notes}
                                        </p>
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="text-[9px] font-black text-sky-300 uppercase tracking-wider block flex items-center gap-1 mb-0.5">
                                          Khái niệm then chốt:
                                        </span>
                                        <p className="text-[11px] text-slate-200 font-medium leading-relaxed line-clamp-3">
                                          {lesson.content ? lesson.content.replace(/[#*`~_>-]/g, '').replace(/\s+/g, ' ').substring(0, 160) + "..." : "Kiến thức bài giảng trọng tâm."}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Back Footer Action */}
                                <div className="relative z-10 pt-2 border-t border-sky-800/60 flex items-center justify-between gap-2">
                                  <span className="text-[10px] text-sky-300 font-bold flex items-center gap-1 truncate">
                                    <span>📖</span> {lesson.bookName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectLesson(lesson);
                                    }}
                                    className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-sky-500/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                                  >
                                    <span>Vào ôn tập</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            </div>
                          </div>

                          {/* Smooth Expansion Content Preview Drawer (Grid View) */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              isExpandedPreview
                                ? "grid-rows-[1fr] opacity-100 mt-3"
                                : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                            }`}
                          >
                            <div className="overflow-hidden min-h-0">
                              <div className="rounded-[1.75rem] bg-gradient-to-br from-sky-50 via-white to-indigo-50/70 border border-sky-200/90 p-5 space-y-3.5 shadow-inner">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/70 pb-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
                                      <Eye className="w-3.5 h-3.5" />
                                      Xem trước nội dung bài học
                                    </span>
                                    <span className="text-xs font-extrabold text-sky-900 bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200 inline-flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                                      ~{previewDetails.readingMinutes} phút đọc
                                    </span>
                                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border ${previewDetails.difficulty.className}`}>
                                      Độ khó: {previewDetails.difficulty.label}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setExpandedPreviewLessonId(null)}
                                    className="px-3 py-1 rounded-xl text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
                                  >
                                    Thu gọn ✕
                                  </button>
                                </div>

                                {previewDetails.headings.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-900 block">
                                      Cấu trúc và Mục tiêu bài học:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {previewDetails.headings.map((h, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs font-bold px-3 py-1 rounded-xl bg-white text-sky-950 border border-sky-200/90 shadow-2xs"
                                        >
                                          {idx + 1}. {h}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* columns follow the card's own width (rem scales with big text), not the screen width */}
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">
                                  <div className="md:col-span-2 bg-white/95 rounded-2xl p-3.5 border border-sky-200/80 space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                                      Trích đoạn kiến thức trọng tâm:
                                    </span>
                                    {previewDetails.cleanParagraphs.length > 0 ? (
                                      previewDetails.cleanParagraphs.map((para, idx) => (
                                        <p key={idx} className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-3">
                                          {para}
                                        </p>
                                      ))
                                    ) : (
                                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                        {lesson.topic || "Nội dung bài học được biên soạn chi tiết gồm lý thuyết, công thức đóng khung và bài tập vận dụng."}
                                      </p>
                                    )}
                                  </div>

                                  <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200/80 flex flex-col justify-between gap-2">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                                        Ghi chú Ghi chú và Tóm tắt nhanh: tóm tắt nhanh:
                                      </span>
                                      <p className="text-xs text-amber-950 font-medium leading-relaxed line-clamp-4">
                                        {lesson.notes || lesson.topic || "Sẵn sàng mở trình đọc toàn màn hình với Từ điển AI, Giọng đọc theo dõi từng từ và Sổ tay ghi chép."}
                                      </p>
                                    </div>
                                    <div className="text-[11px] font-bold text-amber-800/90">
                                      📚 {lesson.bookName} • {lesson.grade?.startsWith("Lớp") ? lesson.grade : `Lớp ${lesson.grade || "6"}`}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-sky-200/70">
                                  <span className="text-xs font-semibold text-slate-600">
                                    Nhấn <strong className="text-sky-950">Mở toàn bộ bài đọc</strong> để vào chế độ đọc tập trung, nghe giọng đọc AI và tra cứu thuật ngữ.
                                  </span>
                                  <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePinLesson(lesson.id)}
                                      className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                                        lesson.pinned
                                          ? "bg-amber-100 border-amber-300 text-amber-800"
                                          : "bg-white border-sky-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200"
                                      }`}
                                    >
                                      <Bookmark className={`w-3.5 h-3.5 ${lesson.pinned ? "fill-amber-500 text-amber-600" : ""}`} />
                                      <span>{lesson.pinned ? "Đã lưu Bookmark" : "Lưu Bookmark"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectLesson(lesson)}
                                      className="whitespace-nowrap px-4 py-2 rounded-xl ss-btn-grad text-white font-black text-xs shadow-md shadow-sky-600/25 inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                    >
                                      <BookOpen className="w-4 h-4" />
                                      <span>Mở toàn bộ bài đọc</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === "knowledge-map" && (
            <KnowledgeMap 
              lessons={lessons}
              progress={progress}
              onSelectLesson={handleSelectLesson}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onToggleLessonComplete={(lessonId) => {
                const updated = lessons.map(l => l.id === lessonId ? { ...l, completed: !l.completed } : l);
                setLessons(updated);
                localStorage.setItem("smart_study_lessons", JSON.stringify(updated));
              }}
            />
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
              onTriggerFireworks={triggerFireworksCelebration}
              recommendations={weakTopicRecommendations}
              onStartRecommendedQuiz={handleStartRecommendedQuiz}
              onSelectLesson={(lessonId) => {
                const found = lessons.find(l => l.id === lessonId);
                if (found) handleSelectLesson(found);
              }}
              lessons={lessons}
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
              equippedOutfitId={progress.equippedOutfit}
              onEquipOutfit={(outfitId) => updateProgress({ equippedOutfit: outfitId })}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === "leaderboard" && (
            <Leaderboard 
              progress={progress}
              selectedAvatarIdx={selectedAvatarIdx}
              onNavigateToQuiz={() => setActiveTab("quiz")}
              onUpdateProgress={updateProgress}
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

          {activeTab === "games" && (
            <GameHub
              progress={progress}
              onUpdateProgress={updateProgress}
              onTriggerSuccess={triggerSuccessMessage}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === "profile" && (
            <Profile 
              progress={progress} 
              lessons={lessons}
              onResetProgress={handleResetProgress}
              selectedAvatarIdx={selectedAvatarIdx}
              onSelectAvatar={handleSelectAvatar}
              studyReminder={studyReminder}
              onNavigateTab={(tab) => setActiveTab(tab)}
              user={user}
              authLoading={authLoading}
              syncStatus={syncStatus}
              lastSyncedTime={lastSyncedTime}
              onLogIn={logInWithGoogle}
              onLogOut={handleCustomLogOut}
              onForceSync={forceSync}
              onUpdateProgress={handleUpdateProgress}
            />
          )}
        
          </React.Suspense>
        </main>
      </div>

      {/* Level Up Celebration Modal */}
      {levelUpAward !== null && (
        <>
          {/* Confetti element */}
          <ConfettiCelebration duration={7000} />
          
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[90] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-sky-100 border border-sky-300 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-6 animate-scale-up">
              {/* Glowing back decoration */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-64 h-64 bg-sky-300/30 rounded-full blur-2xl pointer-events-none" />
              
              {/* Badge visual */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-sky-600 rounded-full animate-spin-slow opacity-85" />
                <div className="absolute inset-1.5 bg-sky-200 rounded-full flex flex-col items-center justify-center shadow-inner border border-sky-300">
                  <span className="animate-bounce">{getMascotComponent(selectedAvatarIdx, 64, currentAvatarStage.stageNum, progress.equippedOutfit || "default")}</span>
                  <span className="text-xs font-black text-sky-900 tracking-wider">LEVEL {levelUpAward}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="font-display font-black text-2xl text-sky-950 tracking-tight leading-tight">
                  Tiến hoá và thăng cấp!
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed px-2">
                  Tuyệt vời! Em đã chính thức đạt <strong className="text-sky-700">Cấp độ {levelUpAward}</strong>. Đồng hành cùng em, linh thú <strong>{currentAvatarStage.title}</strong> đã vươn mình tiến hóa sang trạng thái cực mạnh!
                </p>
              </div>

              {/* Reward list */}
              <div className="bg-sky-200/60 border border-sky-300/80 rounded-2xl p-4 text-left space-y-3">
                <p className="text-xs font-extrabold text-sky-900 uppercase tracking-widest text-center mb-1">Quà tặng vinh danh</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 shrink-0">🎁</span>
                  <span className="text-sky-950 font-bold">Huy hiệu "Chiến Thần Tri Thức {levelUpAward}" được mở khóa!</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 shrink-0">⚡</span>
                  <span className="text-sky-950 font-bold">Tốc độ tích lũy XP tăng thêm +10%</span>
                </div>
              </div>

              {/* Claim reward button */}
              <button
                onClick={() => setLevelUpAward(null)}
                className="w-full py-4 bg-sky-600 text-white font-extrabold text-sm rounded-2xl hover:bg-sky-700 shadow-xl shadow-sky-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Nhận thưởng và học tiếp
              </button>
            </div>
          </div>
        </>
      )}

      {/* Rename Lesson Modal */}
      {editingLessonId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-black text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Đổi tên bài học</span>
              </h3>
              <button
                onClick={() => setEditingLessonId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Tên bài học mới</label>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Nhập tên bài học mới..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-900"
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleRenameLesson(editingLessonId, editingTitle)}
                disabled={!editingTitle.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md text-center"
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
          <div className="bg-white border border-blue-200 rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-black text-rose-700 text-base flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <span>Xác nhận xóa bài học</span>
              </h3>
              <button
                onClick={() => setDeletingLessonId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa bài học <strong className="text-slate-900 font-bold">"{lessons.find(l => l.id === deletingLessonId)?.title}"</strong>?
              </p>
              <p className="text-[10px] text-rose-700 font-semibold bg-rose-50 p-3 rounded-2xl border border-rose-200 leading-relaxed">
                Hành động này không thể hoàn tác. Mọi tiến trình học tập liên quan đến bài học này sẽ bị gỡ bỏ khỏi thư viện của bạn.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingLessonId(null)}
                className="flex-1 py-2.5 bg-sky-200 hover:bg-sky-300 text-sky-900 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
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
      {/* THANH ĐIỀU HƯỚNG CỐ ĐỊNH Ở CẠNH DƯỚI MÀN HÌNH Ở <= 768PX (R1: Trang chủ, Bài học, Luyện tập, Trò chơi, Thêm) */}
      {!isFocusReaderMode && isMobileOrTablet && (
        <nav
          data-mobile-bottom-nav="true"
          aria-label="Thanh điều hướng chính cạnh dưới màn hình"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))] pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_-4px_rgba(15,23,42,0.08)] select-none"
        >
          <div className="w-full max-w-3xl mx-auto grid grid-cols-5 gap-1 sm:gap-2 items-center">
            {mobileBottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.id === "review"
                  ? ["review", "learn", "reading", "essay", "knowledge-map"].includes(activeTab)
                  : activeTab === item.id;
              const navKey = `bottom-${item.id}`;
              const isHapticPulsing = hapticPulseNavId === navKey || pressedHeaderItem === navKey;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-haptic-nav={item.id}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(e) => handleHeaderButtonClick(e, () => handleNavigateTab(item.id), navKey)}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] min-w-0 py-1.5 px-0.5 rounded-xl text-sm max-[359px]:text-[12px] font-semibold tracking-tight transition-colors cursor-pointer touch-manipulation select-none ${
                    isHapticPulsing
                      ? "bg-[#243c6e] text-white"
                      : isActive
                        ? "bg-[#2e5cb8] text-white shadow-2xs"
                        : "text-slate-700 active:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="whitespace-nowrap max-w-full leading-tight">{item.label}</span>
                </button>
              );
            })}

            {/* Nút thứ 5: 'Thêm' mở bảng Bottom Sheet chứa các mục còn lại (R1) */}
            <button
              type="button"
              data-haptic-nav="menu"
              aria-label="Mở bảng Thêm tính năng"
              aria-expanded={isSystemMenuOpen}
              onClick={(e) => handleHeaderButtonClick(e, () => setIsSystemMenuOpen(true), "bottom-menu")}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] min-w-0 py-1.5 px-0.5 rounded-xl text-sm max-[359px]:text-[12px] font-semibold tracking-tight transition-colors cursor-pointer touch-manipulation select-none ${
                isSystemMenuOpen
                  ? "bg-[#2e5cb8] text-white shadow-2xs"
                  : "bg-slate-100 text-[#243c6e] border border-slate-200/80 active:bg-slate-200"
              }`}
            >
              <Menu className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap max-w-full leading-tight">Thêm</span>
            </button>
          </div>
        </nav>
      )}

      {(areIdleWidgetsReady || isAIChatOpen) && (
      <React.Suspense fallback={null}>
        <AIChatBot
          progress={progress} 
          currentLesson={selectedLesson || undefined} 
          isOpenExternal={isAIChatOpen}
          onToggleExternal={setIsAIChatOpen}
          externalThemeId={currentAsciiThemeId}
          onThemeChange={setCurrentAsciiThemeId}
        />
        <MiniPodcastPlayer 
          activeTab={activeTab} 
          onNavigateToPodcast={() => setActiveTab("podcast")}
        />
      </React.Suspense>
      )}

      {(Capacitor.isNativePlatform() || /\bElectron\//.test(navigator.userAgent)) && (
        <React.Suspense fallback={null}>
          <StudyLockHost lessons={lessons} grade={progress.grade || "Lớp 6"} />
        </React.Suspense>
      )}
      <React.Suspense fallback={null}>
        <AppUsageReminder />
        <LocalLibrarySync />
        <FeedbackFlash />
        <ReadingRuler />
        <BreakReminder />
        <VoiceControl />
        <HandSignControl />
        <ParentSync />
        <ParentCommands lessons={lessons} grade={progress.grade || "Lớp 6"} />
        <ParentSetupGate onParentLogin={() => { void logInWithGoogle(); }} />
        {!shouldShowAuthPortal && <SupportFirstRun />}
        <AccountCenter user={user} studentName={progress.displayName || user?.displayName || ""} />
      </React.Suspense>
      </div>
    </PodcastProvider>
  );
}
