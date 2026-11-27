import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  X,
  Send,
  User,
  Loader2,
  Sparkles,
  Brain,
  Trash2,
  Edit3,
  Check,
  BookOpen,
  Target,
  Flame,
  CheckCircle2,
  AlertCircle,
  Mic,
  MicOff,
  Plus,
  Copy,
  RotateCcw,
  PanelLeft,
  PanelRight,
  Maximize2,
  Minimize2,
  Palette,
  Sliders,
  Terminal,
  Cpu,
  Menu,
  SquarePen,
  ArrowUp,
  WifiOff,
  Download
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { localAnswer, searchKnowledge } from '../lib/localMind';
import { askOnDevice, downloadModel, isModelDownloaded, LLM_PROGRESS_EVENT, loadModel, MODELS, nativeModelsChecked, selectedModel, selectModel, type ModelId } from '../lib/onDeviceLLM';
import { ASK_AI_EVENT, PENDING_ASK_KEY } from './support/VoiceControl';
import { mathRemarkPlugins, mathRehypePlugins, normalizeMathInText } from '../lib/mathFormatter';
import { UserProgress, Lesson, AIMemoryStore, UserProfileMemory, ConversationTurn } from '../types';
import { useVoiceToText } from '../hooks/useVoiceToText';
import {
  loadAIMemory,
  addConversationTurn,
  mergeExtractedInsights,
  clearAIMemory,
  updateUserProfileMemory
} from '../lib/aiMemorySystem';

interface AIChatBotProps {
  progress?: UserProgress;
  currentLesson?: Lesson;
  isOpenExternal?: boolean;
  onToggleExternal?: (open: boolean) => void;
  externalThemeId?: string;
  onThemeChange?: (themeId: string) => void;
}

export { ALL_ASCII_MOOD_TAGS, ASCII_MOOD_TAG_ICONS, STUDIO_ASCII_THEMES } from "../data/asciiThemes";
export type { AsciiMoodTag, StudioAsciiThemeSpec } from "../data/asciiThemes";
import { ALL_ASCII_MOOD_TAGS, ASCII_MOOD_TAG_ICONS, STUDIO_ASCII_THEMES } from "../data/asciiThemes";
import type { AsciiMoodTag, StudioAsciiThemeSpec } from "../data/asciiThemes";

interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  personaId: string;
  turns: ConversationTurn[];
}

const THREADS_STORAGE_KEY = 'smart_study_ai_studio_threads_v1';

const PERSONA_PRESETS = [
  {
    id: 'standard',
    label: 'Gia sư Chuẩn',
    badge: 'Balanced',
    desc: 'Giải thích trực quan, dễ hiểu, bám sát sách giáo khoa.',
    promptPrefix: ''
  },
  {
    id: 'step-by-step',
    label: 'Giải từng bước',
    badge: 'Step-by-Step',
    desc: 'Chia nhỏ bài toán/câu hỏi thành từng bước suy luận rõ ràng.',
    promptPrefix: '[Chế độ Giải chi tiết từng bước] Hãy hướng dẫn học sinh từng bước rõ ràng: '
  },
  {
    id: 'socratic',
    label: 'Gợi mở Socratic',
    badge: 'Socratic',
    desc: 'Đặt câu hỏi gợi ý để em tự khám phá ra đáp án và nhớ lâu.',
    promptPrefix: '[Chế độ Socratic Gợi mở tư duy] Hãy giải thích ngắn gọn và đặt câu hỏi gợi mở: '
  },
  {
    id: 'exam-coach',
    label: 'Luyện thi tốc độ',
    badge: 'Exam Coach',
    desc: 'Tóm tắt trọng tâm, mẹo tránh bẫy và tạo câu hỏi trắc nghiệm.',
    promptPrefix: '[Chế độ Luyện thi và Mẹo giải nhanh] Hãy tóm tắt công thức trọng tâm và cho bài tập áp dụng: '
  },
  {
    // "Hỗ trợ học tập": for students who get lost in long or figurative answers (autism, deaf, dyslexia)
    id: 'plain',
    label: 'Ngắn, rõ',
    badge: 'Plain',
    desc: 'Tối đa 3 câu ngắn, từ dễ hiểu, nói thẳng nghĩa đen, không thành ngữ.',
    promptPrefix:
      '[Chế độ Ngắn, rõ, nghĩa đen – ưu tiên hơn mọi quy tắc trình bày khác] Trả lời tối đa 3 câu, mỗi câu dưới 15 từ, dùng từ thông dụng. ' +
      'Không dùng thành ngữ, ẩn dụ, so sánh bóng bẩy, không mở đầu, không hỏi lại. Nếu cần công thức thì viết đúng một dòng. Câu hỏi: '
  }
];

function loadSavedThreads(initialTurns: ConversationTurn[]): ChatThread[] {
  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [
    {
      id: 'thread-default',
      title: 'Phiên học tập chính',
      updatedAt: Date.now(),
      personaId: 'standard',
      turns: initialTurns || []
    }
  ];
}

function saveThreadsToStorage(threads: ChatThread[]) {
  try {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads.slice(0, 20)));
  } catch {}
}

export default function AIChatBot({
  progress,
  currentLesson,
  isOpenExternal,
  onToggleExternal,
  externalThemeId,
  onThemeChange
}: AIChatBotProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : internalOpen;
  const setIsOpen = (val: boolean) => {
    setInternalOpen(val);
    onToggleExternal?.(val);
  };

  // Studio layout controls (Google AI Studio / Gemini / Claude style)
  const [isFullStudioMode, setIsFullStudioMode] = useState(true);
  // Phone: the history list is a drawer over the chat, closed at first (desktop: open beside it)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1024);
  // Phone + tablet (< 1024px): full-screen chat like the ChatGPT / Gemini / Claude apps.
  // Computer (>= 1024px): the large floating chat window.
  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsPhone(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Phone: Back button closes the chat; the page behind does not scroll
  const phoneHistoryPushed = useRef(false);
  const phoneChatActive = isOpen && isPhone;
  useEffect(() => {
    if (!phoneChatActive) {
      // closed with the X button: drop the history entry we added
      if (phoneHistoryPushed.current) {
        phoneHistoryPushed.current = false;
        if (window.history.state?.aiChat) window.history.back();
      }
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Wait a moment: the menu that opened the chat may still be stepping back its own history entry
    const pushTimer = window.setTimeout(() => {
      if (!phoneHistoryPushed.current) {
        window.history.pushState({ aiChat: true }, '');
        phoneHistoryPushed.current = true;
      }
    }, 400);
    const onPop = () => {
      if (!phoneHistoryPushed.current) return;
      phoneHistoryPushed.current = false;
      setIsOpen(false);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.clearTimeout(pushTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('popstate', onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneChatActive]);
  const closeSidebarOnPhone = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsLeftSidebarOpen(false);
  };
  const [activeStudioView, setActiveStudioView] = useState<'chat' | 'ascii-themes'>('chat');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('standard');
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [themeSortBy, setThemeSortBy] = useState<
    'mood-priority' | 'mood' | 'alphabetical' | 'newest' | 'popularity'
  >(() => {
    try {
      const saved = localStorage.getItem('smart_study_ascii_menu_sort_v1');
      if (
        saved === 'mood-priority' ||
        saved === 'alphabetical' ||
        saved === 'newest' ||
        saved === 'popularity' ||
        saved === 'mood'
      ) {
        return saved;
      }
    } catch {}
    return 'mood-priority';
  });
  const [themeEmotionInput, setThemeEmotionInput] = useState<string>(() => {
    try {
      return localStorage.getItem('smart_study_ascii_menu_mood_v1') || '';
    } catch {
      return '';
    }
  });

  const [selectedMoodTags, setSelectedMoodTags] = useState<AsciiMoodTag[]>(() => {
    try {
      const raw = localStorage.getItem('smart_study_ascii_menu_mood_tags_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((tag): tag is AsciiMoodTag =>
            ALL_ASCII_MOOD_TAGS.includes(tag as AsciiMoodTag)
          );
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('smart_study_ascii_menu_mood_v1', themeEmotionInput);
    } catch {}
  }, [themeEmotionInput]);

  useEffect(() => {
    try {
      localStorage.setItem('smart_study_ascii_menu_mood_tags_v1', JSON.stringify(selectedMoodTags));
    } catch {}
  }, [selectedMoodTags]);

  useEffect(() => {
    try {
      localStorage.setItem('smart_study_ascii_menu_sort_v1', themeSortBy);
    } catch {}
  }, [themeSortBy]);

  useEffect(() => {
    if (activeStudioView !== 'ascii-themes') return;
    try {
      const savedMood = localStorage.getItem('smart_study_ascii_menu_mood_v1');
      if (savedMood !== null && savedMood !== themeEmotionInput) {
        setThemeEmotionInput(savedMood);
      }
      const savedTagsRaw = localStorage.getItem('smart_study_ascii_menu_mood_tags_v1');
      if (savedTagsRaw) {
        const parsed = JSON.parse(savedTagsRaw);
        if (Array.isArray(parsed)) {
          setSelectedMoodTags(
            parsed.filter((tag): tag is AsciiMoodTag =>
              ALL_ASCII_MOOD_TAGS.includes(tag as AsciiMoodTag)
            )
          );
        }
      }
      const savedSort = localStorage.getItem('smart_study_ascii_menu_sort_v1');
      if (
        (savedSort === 'mood-priority' ||
          savedSort === 'alphabetical' ||
          savedSort === 'newest' ||
          savedSort === 'popularity' ||
          savedSort === 'mood') &&
        savedSort !== themeSortBy
      ) {
        setThemeSortBy(savedSort);
      }
    } catch {}
  }, [activeStudioView]);

  const handleToggleMoodTag = (tag: AsciiMoodTag) => {
    setSelectedMoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getStudioThemeMoodScore = (theme: StudioAsciiThemeSpec) => {
    const q = themeEmotionInput.trim().toLowerCase();
    const inputTokens = q
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => s && s !== 'all');
    let score = 0;
    selectedMoodTags.forEach((tag) => {
      if (theme.emotion === tag) score += 20;
      if (theme.moodTags.includes(tag)) score += 12;
    });
    inputTokens.forEach((tok) => {
      if (theme.emotion.toLowerCase() === tok) score += 18;
      else if (theme.emotion.toLowerCase().includes(tok)) score += 10;
      if (theme.moodTags.some((mt) => mt.toLowerCase() === tok)) score += 12;
      else if (theme.moodTags.some((mt) => mt.toLowerCase().includes(tok))) score += 6;
    });
    return score;
  };

  const filteredAndSortedStudioThemes = useMemo(() => {
    const q = themeEmotionInput.trim().toLowerCase();
    const inputTokens = q
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => s && s !== 'all');

    const filtered = STUDIO_ASCII_THEMES.filter((t) => {
      if (themeSortBy !== 'mood-priority') {
        const matchesMultiTags =
          selectedMoodTags.length === 0 ||
          selectedMoodTags.some((sel) => t.moodTags.includes(sel) || t.emotion === sel);
        if (!matchesMultiTags) return false;
      }

      if (inputTokens.length === 0) return true;
      return inputTokens.some(
        (token) =>
          t.emotion.toLowerCase().includes(token) ||
          t.moodTags.some((mt) => mt.toLowerCase().includes(token)) ||
          t.moodLabel.toLowerCase().includes(token) ||
          t.name.toLowerCase().includes(token) ||
          t.description.toLowerCase().includes(token)
      );
    });
    const moodOrder: Record<string, number> = {
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
      if (themeSortBy === 'mood-priority') {
        const diff = getStudioThemeMoodScore(b) - getStudioThemeMoodScore(a);
        if (diff !== 0) return diff;
        const orderDiff = (moodOrder[a.emotion] || 99) - (moodOrder[b.emotion] || 99);
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name);
      }
      if (themeSortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      if (themeSortBy === 'newest') {
        return STUDIO_ASCII_THEMES.indexOf(b) - STUDIO_ASCII_THEMES.indexOf(a);
      }
      if (themeSortBy === 'popularity') {
        return STUDIO_ASCII_THEMES.indexOf(a) - STUDIO_ASCII_THEMES.indexOf(b);
      }
      // 'mood' sorting
      const orderDiff = (moodOrder[a.emotion] || 99) - (moodOrder[b.emotion] || 99);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });
  }, [themeEmotionInput, selectedMoodTags, themeSortBy]);

  // Active ASCII theme scoped to SmartStudy Chatbox
  const [activeAsciiThemeId, setActiveAsciiThemeId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('smartstudy_chat_theme_v1');
      if (saved && STUDIO_ASCII_THEMES.some((t) => t.id === saved)) return saved;
      const raw = localStorage.getItem('ascii_points_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.activeTheme === 'string') {
          return parsed.activeTheme;
        }
      }
    } catch {}
    return 'lagoon';
  });

  // Sync with external theme if provided
  useEffect(() => {
    if (externalThemeId && STUDIO_ASCII_THEMES.some((t) => t.id === externalThemeId)) {
      setActiveAsciiThemeId(externalThemeId);
    }
  }, [externalThemeId]);

  const [isThemeFading, setIsThemeFading] = useState(false);
  const themeFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger smooth opacity fade animation on AIChatBot content area whenever theme changes
  useEffect(() => {
    setIsThemeFading(true);
    if (themeFadeTimerRef.current) {
      clearTimeout(themeFadeTimerRef.current);
    }
    themeFadeTimerRef.current = setTimeout(() => {
      setIsThemeFading(false);
    }, 240);
    return () => {
      if (themeFadeTimerRef.current) {
        clearTimeout(themeFadeTimerRef.current);
      }
    };
  }, [activeAsciiThemeId]);

  const [asciiPointsBalance, setAsciiPointsBalance] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('ascii_points_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.balance === 'number') return parsed.balance;
      }
    } catch {}
    return 50000;
  });

  // Memory & Conversation states
  const [memory, setMemory] = useState<AIMemoryStore>(() => loadAIMemory(progress));
  const [threads, setThreads] = useState<ChatThread[]>(() =>
    loadSavedThreads(loadAIMemory(progress).recentConversations)
  );
  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    const loaded = loadSavedThreads(loadAIMemory(progress).recentConversations);
    return loaded[0]?.id || 'thread-default';
  });

  const [message, setMessage] = useState('');
  // Phone: the auto-growing input shrinks back after sending
  useEffect(() => {
    if (isPhone && !message && composerRef.current) composerRef.current.style.height = '';
  }, [message, isPhone]);
  const [isLoading, setIsLoading] = useState(false);
  // "Ngoại tuyến": answer from what is on the device (src/lib/localMind.ts); also used automatically when offline
  const [offlineMode, setOfflineMode] = useState(() => localStorage.getItem('smartstudy_ai_offline') === '1');
  useEffect(() => {
    localStorage.setItem('smartstudy_ai_offline', offlineMode ? '1' : '0');
  }, [offlineMode]);
  // on-device LLM: null = not downloaded, 0-99 = downloading, 100 = ready
  const [llmProgress, setLlmProgress] = useState<number | null>(() => (isModelDownloaded() ? 100 : null));
  const [llmModel, setLlmModel] = useState<ModelId>(selectedModel);
  const llmInfo = MODELS.find((m) => m.id === llmModel)!;
  // desktop: the installer's built-in model counts as downloaded once the app has answered
  useEffect(() => {
    nativeModelsChecked.then(() => setLlmProgress((p) => (p !== null && p < 100 ? p : isModelDownloaded(selectedModel()) ? 100 : null)));
  }, []);
  const pickLlm = (id: ModelId) => {
    setLlmModel(id);
    setLlmProgress(isModelDownloaded(id) ? 100 : null);
    selectModel(id);
  };
  const downloadLlm = () => {
    if (llmProgress !== null && llmProgress < 100) return;
    setLlmProgress(0);
    downloadModel().catch(() => alert('Tải AI trong máy chưa được. Em kiểm tra mạng và dung lượng trống rồi thử lại nhé.'));
  };
  // the same download may also have been started automatically when the app opened
  useEffect(() => {
    const onProgress = (e: Event) => {
      const pct = (e as CustomEvent<number>).detail;
      setLlmProgress(pct < 0 ? (isModelDownloaded() ? 100 : null) : isModelDownloaded() ? 100 : pct);
    };
    window.addEventListener(LLM_PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(LLM_PROGRESS_EVENT, onProgress);
  }, []);
  // warm the on-device model while offline so the first question does not wait for it to load
  useEffect(() => {
    if (llmProgress !== 100 || !(offlineMode || navigator.onLine === false)) return;
    const t = setTimeout(() => loadModel().catch(() => {}), 1500);
    return () => clearTimeout(t);
  }, [llmProgress, offlineMode, llmModel]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editForm, setEditForm] = useState<UserProfileMemory>({});

  const chatWallpaperCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatStageContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeAsciiTheme = useMemo(() => {
    return (
      STUDIO_ASCII_THEMES.find((t) => t.id === activeAsciiThemeId) || STUDIO_ASCII_THEMES[0]
    );
  }, [activeAsciiThemeId]);

  const activePersona = useMemo(() => {
    return PERSONA_PRESETS.find((p) => p.id === selectedPersonaId) || PERSONA_PRESETS[0];
  }, [selectedPersonaId]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  // Listen to ASCII theme events (e.g. from shop or toolbar)
  useEffect(() => {
    const handleThemeEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ themeId?: string }>;
      const nextId = customEvt.detail?.themeId;
      if (nextId) {
        const cleanId = nextId === 'none' ? 'lagoon' : nextId;
        setActiveAsciiThemeId(cleanId);
        onThemeChange?.(cleanId);
      }
      try {
        const raw = localStorage.getItem('ascii_points_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.balance === 'number') setAsciiPointsBalance(parsed.balance);
        }
      } catch {}
    };
    window.addEventListener('ascii-theme-changed', handleThemeEvent);
    return () => window.removeEventListener('ascii-theme-changed', handleThemeEvent);
  }, [onThemeChange]);

  // Apply an ASCII theme locally inside SmartStudy Chatbox (never mutates global app UI)
  const handleSelectAsciiTheme = (themeId: string) => {
    const cleanId = themeId === 'none' ? 'lagoon' : themeId;
    setActiveAsciiThemeId(cleanId);
    onThemeChange?.(cleanId);
    try {
      localStorage.setItem('smartstudy_chat_theme_v1', cleanId);
      localStorage.setItem('active_ascii_theme', cleanId);
      const raw = localStorage.getItem('ascii_points_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.activeTheme = cleanId;
        localStorage.setItem('ascii_points_v1', JSON.stringify(parsed));
      }
    } catch {}
  };

  // Full Living Wallpaper Canvas inside AI Studio Chatbox (Claudie Autumn Forest & 10 ASCII themes)
  useEffect(() => {
    if (!isOpen || activeStudioView !== 'chat') return;
    const canvas = chatWallpaperCanvasRef.current;
    const container = chatStageContainerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let startTime = performance.now();

    const handleResize = () => {
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width) || 800;
      const h = Math.floor(rect.height) || 600;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
    };
    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    interface WallpaperParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      char: string;
      color: string;
      alpha: number;
      phase: number;
    }

    const themeId = activeAsciiTheme.id;
    const themeChars = (activeAsciiTheme.chars || '·:;|/\\(){}[]<>claude').split('');
    const particleCount = themeId === 'cyber-matrix' ? 85 : themeId === 'claude' ? 70 : 60;

    const getThemeColors = () => {
      switch (themeId) {
        case 'claude':
          return ['#ea580c', '#f59e0b', '#fbbf24', '#c2410c', '#d97706', '#fed7aa'];
        case 'lagoon':
          return ['#38bdf8', '#0284c7', '#3487c8', '#7dd3fc', '#bae6fd'];
        case 'clouds':
          return ['#60a5fa', '#4675c7', '#93c5fd', '#bfdbfe', '#e0f2fe'];
        case 'aurora':
          return ['#34d399', '#179574', '#14b8a6', '#2dd4bf', '#a7f3d0'];
        case 'sakura':
          return ['#f472b6', '#ec4899', '#db2777', '#fbcfe8', '#fda4af'];
        case 'cyber-matrix':
          return ['#179574', '#4ade80', '#0e7f62', '#86efac', '#bbf7d0'];
        case 'synthwave':
          return ['#c084fc', '#a855f7', '#e879f9', '#f43f5e', '#38bdf8'];
        case 'solar-flare':
          return ['#fbbf24', '#f59e0b', '#f97316', '#ef4444', '#fde68a'];
        case 'deep-cosmos':
          return ['#818cf8', '#6366f1', '#a5b4fc', '#c7d2fe', '#ffffff'];
        case 'singularity-omega':
          return ['#a855f7', '#7c3aed', '#38bdf8', '#c084fc', '#e9d5ff'];
        default:
          return ['#38bdf8', '#0284c7', '#7dd3fc', '#ffffff'];
      }
    };
    const colors = getThemeColors();

    const particles: WallpaperParticle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.08,
      vy: 0.08 + Math.random() * 0.22,
      size: 11 + Math.random() * 7,
      char: themeChars[Math.floor(Math.random() * themeChars.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.15 + Math.random() * 0.3, // soft on the light background
      phase: Math.random() * Math.PI * 2
    }));

    // Mosaic background blocks for Claude Autumn Forest (matches image_3648ee85.png)
    const mosaicBlocks = Array.from({ length: 42 }, () => ({
      cx: Math.random(),
      cy: Math.random(),
      w: 14 + Math.random() * 28,
      h: 10 + Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      baseAlpha: 0.06 + Math.random() * 0.14,
      freq: 0.8 + Math.random() * 2.5
    }));

    const renderLoop = (now: number) => {
      const elapsed = (now - startTime) * 0.001;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width;
      const height = canvas.height;
      if (width <= 0 || height <= 0) {
        rafId = requestAnimationFrame(renderLoop);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const logicalW = width / dpr;
      const logicalH = height / dpr;

      // 1. Base fill: light, tinted by the theme (dark backgrounds were hard to read)
      const bgGrad = ctx.createLinearGradient(0, 0, logicalW, logicalH);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(1, activeAsciiTheme.surfaceBg || '#f4f8ff');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, logicalW, logicalH);

      // 2. Soft living mosaic city lights / canopy grid in the background (as in Claudie screenshot!)
      if (themeId === 'claude' || themeId === 'synthwave') {
        mosaicBlocks.forEach((b) => {
          const bx = b.cx * logicalW;
          const by = b.cy * logicalH;
          const pulse = Math.sin(elapsed * b.freq + bx) * 0.5 + 0.5;
          const alpha = b.baseAlpha + pulse * 0.12;
          ctx.fillStyle = b.color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(bx, by, b.w, b.h);
        });
      }

      // 3. Theme specific animated features
      if (themeId === 'synthwave') {
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.22)';
        ctx.lineWidth = 1;
        const horizonY = logicalH * 0.65;
        for (let x = -logicalW; x < logicalW * 2; x += 45) {
          ctx.beginPath();
          ctx.moveTo(logicalW / 2, horizonY);
          ctx.lineTo(x, logicalH);
          ctx.stroke();
        }
        for (let y = horizonY; y < logicalH; y += 18) {
          const normY = (y - horizonY) / (logicalH - horizonY);
          const py = horizonY + Math.pow(normY, 1.8) * (logicalH - horizonY);
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(logicalW, py);
          ctx.stroke();
        }
      }

      // 4. Draw Living Dynamic ASCII / Particle Simulation
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      particles.forEach((p) => {
        p.y += p.vy * 0.12;
        p.x += Math.sin(elapsed * 1.2 + p.phase) * (p.vx * 0.08);

        if (p.y > 1.05) {
          p.y = -0.05;
          p.x = Math.random();
          p.char = themeChars[Math.floor(Math.random() * themeChars.length)];
        }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        const px = p.x * logicalW;
        const py = p.y * logicalH;
        const pulse = Math.sin(elapsed * 2 + p.phase) * 0.25 + 0.75;
        const currentAlpha = Math.min(1, Math.max(0.15, p.alpha * pulse));

        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = p.color;

        if (themeId === 'cyber-matrix') {
          ctx.fillText(p.char, px, py);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = currentAlpha * 0.7;
          ctx.fillText(p.char, px, py - 14);
        } else if (themeId === 'claude') {
          ctx.fillText(p.char, px, py);
          if (p.size > 14) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = currentAlpha * 0.35;
            ctx.fillRect(px - 5, py - 5, 10, 10);
          }
        } else {
          ctx.fillText(p.char, px, py);
        }
      });

      ctx.restore();
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [isOpen, activeStudioView, activeAsciiTheme]);

  const {
    isListening,
    interimTranscript,
    error: voiceError,
    toggleListening,
    stopListening,
    clearError: clearVoiceError
  } = useVoiceToText({
    lang: 'vi-VN',
    onTranscript: (spokenText) => {
      setMessage((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${spokenText}` : spokenText;
      });
    }
  });

  useEffect(() => {
    if (!isOpen && isListening) {
      stopListening();
    }
  }, [isOpen, isListening, stopListening]);

  useEffect(() => {
    const loaded = loadAIMemory(progress);
    setMemory(loaded);
  }, [progress]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeStudioView === 'chat') {
      scrollToBottom();
    }
  }, [activeThread?.turns, isOpen, activeStudioView]);

  // Create a new Studio chat thread (like Gemini / Claude "+ New Chat")
  const handleCreateNewThread = () => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: currentLesson ? `Hỏi bài: ${currentLesson.title.slice(0, 26)}` : 'Phiên trò chuyện mới',
      updatedAt: Date.now(),
      personaId: selectedPersonaId,
      turns: []
    };
    const nextThreads = [newThread, ...threads];
    setThreads(nextThreads);
    setActiveThreadId(newThread.id);
    setActiveStudioView('chat');
    saveThreadsToStorage(nextThreads);
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) {
      const resetThread: ChatThread = {
        id: 'thread-default',
        title: 'Phiên học tập mới',
        updatedAt: Date.now(),
        personaId: selectedPersonaId,
        turns: []
      };
      setThreads([resetThread]);
      setActiveThreadId(resetThread.id);
      saveThreadsToStorage([resetThread]);
      return;
    }
    const filtered = threads.filter((t) => t.id !== threadId);
    setThreads(filtered);
    if (activeThreadId === threadId) {
      setActiveThreadId(filtered[0].id);
    }
    saveThreadsToStorage(filtered);
  };

  const updateActiveThreadTurns = (newTurns: ConversationTurn[], firstUserMsg?: string) => {
    setThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== activeThread.id) return t;
        const autoTitle =
          t.turns.length === 0 && firstUserMsg
            ? firstUserMsg.slice(0, 34) + (firstUserMsg.length > 34 ? '…' : '')
            : t.title;
        return {
          ...t,
          title: autoTitle,
          updatedAt: Date.now(),
          turns: newTurns
        };
      });
      saveThreadsToStorage(updated);
      return updated;
    });
  };

  // Send message to /api/chat
  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    if (isListening) stopListening();
    const textToSend =
      customText || (interimTranscript ? `${message} ${interimTranscript}`.trim() : message);
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend.trim();
    if (!customText) setMessage('');
    setIsLoading(true);
    setActiveStudioView('chat');

    // Award +10 ASCII Shop points on send
    try {
      const w = window as any;
      if (w.AsciiShop && typeof w.AsciiShop.earnPoints === 'function') {
        const res = w.AsciiShop.earnPoints('message_sent');
        if (res && typeof res.newBalance === 'number') {
          setAsciiPointsBalance(res.newBalance);
        }
      }
    } catch {}

    const userTurn: ConversationTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    };

    const currentTurns = [...(activeThread?.turns || []), userTurn];
    updateActiveThreadTurns(currentTurns, userMsg);

    const updatedWithUser = addConversationTurn(memory, 'user', userMsg);
    setMemory(updatedWithUser);

    const replyLocally = async (note = '') => {
      const local = await localAnswer(userMsg);
      const id = `m-${Date.now()}`;
      const show = (content: string) =>
        updateActiveThreadTurns([...currentTurns, { id, role: 'model', content, timestamp: new Date().toISOString() }]);
      // single line breaks become markdown hard breaks so steps and lists keep their lines
      let content = `${note}${local.answer.replace(/\n(?!\n)/g, '  \n')}\n\n*📴 Trả lời ngoại tuyến · ${local.source}*`;
      if (!local.found && isModelDownloaded()) {
        // nearest textbook entry, even a weak match, keeps the small model grounded
        const hit = searchKnowledge(userMsg);
        const tag = `\n\n*📴 AI trong máy (${llmInfo.name}) · có thể sai, em đối chiếu SGK nhé*`;
        try {
          // previous exchange, minus the offline/source footer, so follow-up questions have context
          const history = currentTurns.slice(-3, -1).map((t) => ({
            role: t.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: t.content.replace(/\n\n\*📴[\s\S]*$/, ''),
          }));
          const text = await askOnDevice(userMsg, hit && hit.score > 2 && hit.coverage >= 0.5 ? hit.doc.answer : '', (t) => show(`${note}${t || '…'}${tag}`), history);
          if (text) content = `${note}${text}${tag}`;
        } catch {}
      }
      show(content);
      setMemory(addConversationTurn(updatedWithUser, 'model', content));
    };

    if (offlineMode || navigator.onLine === false) {
      try {
        await replyLocally();
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const promptWithPersona = activePersona.promptPrefix
        ? `${activePersona.promptPrefix}${userMsg}`
        : userMsg;

      const payload = {
        message: promptWithPersona,
        history: currentTurns.slice(-20),
        userProfile: updatedWithUser.userProfile,
        longTermMemory: updatedWithUser.longTermMemory,
        memorySummary: updatedWithUser.lastMemorySummary,
        currentLesson: currentLesson
          ? {
              title: currentLesson.title,
              bookName: currentLesson.bookName,
              grade: currentLesson.grade
            }
          : undefined
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!(data.success && data.reply)) {
        await replyLocally('*AI trên mạng đang bận, mình trả lời bằng kiến thức trong máy:*\n\n');
        return;
      }
      const aiReply: string = data.reply;

      const aiTurn: ConversationTurn = {
        id: `m-${Date.now()}`,
        role: 'model',
        content: aiReply,
        timestamp: new Date().toISOString()
      };

      const turnsWithAI = [...currentTurns, aiTurn];
      updateActiveThreadTurns(turnsWithAI);

      const updatedWithAI = addConversationTurn(updatedWithUser, 'model', aiReply);
      setMemory(updatedWithAI);

      fetch('/api/extract-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMsg,
          assistantReply: aiReply,
          currentMemory: updatedWithAI
        })
      })
        .then((r) => r.json())
        .then((resData) => {
          if (resData.success && resData.insights) {
            setMemory((prev) => mergeExtractedInsights(prev, resData.insights));
          }
        })
        .catch(() => {});
    } catch {
      await replyLocally('*Không kết nối được AI, mình trả lời bằng kiến thức trong máy:*\n\n');
    } finally {
      setIsLoading(false);
    }
  };

  // Questions asked by voice ("Này SmartStudy, …") that the voice assistant could not answer itself.
  // The chat may mount after the event fired, so the question also waits in sessionStorage.
  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;
  useEffect(() => {
    const take = () => {
      const q = sessionStorage.getItem(PENDING_ASK_KEY);
      if (!q) return;
      sessionStorage.removeItem(PENDING_ASK_KEY);
      setIsOpen(true);
      setTimeout(() => void handleSendRef.current(undefined, q), 300);
    };
    take();
    window.addEventListener(ASK_AI_EVENT, take);
    return () => window.removeEventListener(ASK_AI_EVENT, take);
  }, []);

  const handleCopyMessage = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedTurnId(id);
      setTimeout(() => setCopiedTurnId(null), 1800);
    } catch {}
  };

  const handleRegenerateLast = () => {
    if (isLoading || !activeThread) return;
    const turns = activeThread.turns;
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].role === 'user') {
        handleSend(undefined, turns[i].content);
        break;
      }
    }
  };

  const handleOpenEdit = () => {
    setEditForm({ ...memory.userProfile });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateUserProfileMemory(memory, editForm);
    setMemory(updated);
    setIsEditingProfile(false);
  };

  const handleClearMemory = () => {
    const cleared = clearAIMemory(progress);
    setMemory(cleared);
    const freshThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'Phiên học tập mới',
      updatedAt: Date.now(),
      personaId: selectedPersonaId,
      turns: cleared.recentConversations || []
    };
    setThreads([freshThread]);
    setActiveThreadId(freshThread.id);
    saveThreadsToStorage([freshThread]);
    setShowClearConfirm(false);
  };

  const sortedScores = Object.entries(memory.longTermMemory?.memory_scores || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const displayedTurns = activeThread?.turns || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            id="ai-mascot-chatbot-panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={
              {
                '--studio-accent': activeAsciiTheme.accent,
                '--studio-accent-rgb': activeAsciiTheme.accentRgb,
                '--studio-contrast': activeAsciiTheme.contrastText,
                '--accent-primary': activeAsciiTheme.accent
              } as React.CSSProperties
            }
            className="fixed max-lg:inset-0! max-lg:z-[70]! max-lg:rounded-none! max-lg:border-0! max-lg:h-[100dvh]! top-[58px] sm:top-[64px] bottom-16 sm:bottom-3 left-2 right-2 sm:left-4 sm:right-4 max-w-6xl mx-auto bg-white/98 backdrop-blur-2xl border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_-10px_rgba(15,23,42,0.32)] flex flex-col overflow-hidden text-slate-900 z-20"
          >
            {/* =====================================================================
                TOP HEADER BAR (SmartStudy Assistant Workspace)
                ===================================================================== */}
            <header
              style={{ background: activeAsciiTheme.headerBg }}
              className="px-3.5 sm:px-4 py-2.5 max-lg:px-2! max-lg:pb-2! max-lg:pt-[max(0.5rem,env(safe-area-inset-top))]! text-white flex items-center justify-between gap-2 border-b border-white/15 max-lg:border-white/10! shrink-0 select-none shadow-xs"
            >
              {/* Left: Sidebar Toggle + Studio Title + Active Theme Badge */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsLeftSidebarOpen((prev) => !prev)}
                  className="p-2 max-lg:w-11! max-lg:h-11! max-lg:flex! max-lg:items-center! max-lg:justify-center! rounded-xl bg-white/12 hover:bg-white/22 max-lg:bg-transparent! max-lg:border-transparent! text-white border border-white/20 cursor-pointer transition-colors"
                  title={isLeftSidebarOpen ? 'Thu gọn lịch sử chat' : 'Mở lịch sử chat'}
                  aria-label={isPhone ? 'Mở menu: lịch sử chat, gia sư, giao diện' : 'Toggle drawer lịch sử chat'}
                >
                  {isPhone ? <Menu className="w-5 h-5" /> : <PanelLeft className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="max-lg:hidden! w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-mono text-xs font-black text-white shrink-0 shadow-inner">
                    ◈
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                        SmartStudy
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/85 font-medium truncate">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="max-lg:hidden!">Sẵn sàng hỗ trợ học tập</span>
                      </span>
                      <span className="max-lg:hidden!">·</span>
                      <span>Gia sư: {activePersona.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Controls (New Chat + Theme Gallery Tab + Close) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCreateNewThread}
                  className="px-2.5 py-1.5 max-lg:w-11! max-lg:h-11! max-lg:p-0! max-lg:justify-center! max-lg:bg-transparent! max-lg:border-transparent! rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Tạo cuộc hội thoại mới"
                  aria-label="Đoạn chat mới"
                >
                  {isPhone ? <SquarePen className="w-5 h-5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span className="hidden lg:inline">Đoạn chat mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 max-lg:w-11! max-lg:h-11! max-lg:flex! max-lg:items-center! max-lg:justify-center! max-lg:bg-transparent! max-lg:border-transparent! rounded-xl bg-white/12 hover:bg-rose-500/80 text-white border border-white/20 cursor-pointer transition-colors"
                  title="Đóng SmartStudy (Esc)"
                  aria-label="Đóng SmartStudy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* =====================================================================
                STUDIO 3-COLUMN WORKSPACE BODY
                ===================================================================== */}
            <div className="relative flex-1 flex min-h-0 overflow-hidden bg-slate-50/70">
              {/* -----------------------------------------------------------------
                  1. LEFT STUDIO SIDEBAR (Threads + Workspace Mode + Persona)
                  ----------------------------------------------------------------- */}
              {isFullStudioMode && isLeftSidebarOpen && (
                <button
                  type="button"
                  aria-label="Đóng lịch sử chat"
                  onClick={() => setIsLeftSidebarOpen(false)}
                  className="lg:hidden absolute inset-0 z-20 bg-slate-900/30 cursor-default"
                />
              )}
              {isFullStudioMode && isLeftSidebarOpen && (
                <aside className="w-64 lg:w-72 max-lg:absolute! max-lg:inset-y-0! max-lg:left-0! max-lg:z-30! max-lg:w-[min(18rem,85%)]! max-lg:shadow-xl! max-lg:bg-slate-100! bg-slate-100/90 border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none overflow-hidden">
                  <div className="p-3 space-y-3 flex-1 flex flex-col min-h-0">
                    {/* + New Chat Button (Claude / Gemini style) */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCreateNewThread();
                        closeSidebarOnPhone();
                      }}
                      style={{ backgroundColor: activeAsciiTheme.accent }}
                      className="w-full py-2.5 px-3.5 rounded-xl text-white font-extrabold text-xs flex items-center justify-between gap-2 shadow-sm hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Cuộc trò chuyện mới</span>
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20">
                        New
                      </span>
                    </button>

                    {/* Studio View Switcher */}
                    <div className="space-y-1">
                      <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Không gian SmartStudy
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveStudioView('chat')}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          activeStudioView === 'chat'
                            ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/90'
                            : 'text-slate-700 hover:bg-white/60'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare
                            className="w-4 h-4"
                            style={{ color: activeAsciiTheme.accent }}
                          />
                          <span>Trò chuyện SmartStudy</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {displayedTurns.length}
                        </span>
                      </button>
                    </div>

                    {/* Recent Chat Threads List */}
                    <div className="flex-1 flex flex-col min-h-0 pt-1 border-t border-slate-200/80">
                      <div className="px-2 py-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          Lịch sử Phiên Chat ({threads.length})
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                        {threads.map((t) => {
                          const isSelected = t.id === activeThread.id;
                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setActiveThreadId(t.id);
                                setActiveStudioView('chat');
                                closeSidebarOnPhone();
                              }}
                              className={`group px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-all border ${
                                isSelected
                                  ? 'bg-white text-slate-900 font-bold border-slate-200/90 shadow-2xs'
                                  : 'bg-transparent text-slate-600 border-transparent hover:bg-white/60 hover:text-slate-900'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate leading-snug">{t.title}</p>
                                <p className="text-[10px] font-mono text-slate-400">
                                  {t.turns.length} tin nhắn
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteThread(t.id, e)}
                                className="opacity-0 group-hover:opacity-100 max-lg:opacity-100! p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Xóa phiên trò chuyện này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {/* Phone: tutor style + theme live in the menu (the composer stays a simple pill) */}
                  <div className="lg:hidden p-3 pt-2 border-t border-slate-200 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
                      Phong cách gia sư
                      <select
                        value={selectedPersonaId}
                        onChange={(e) => setSelectedPersonaId(e.target.value)}
                        className="mt-1 w-full min-h-[44px] px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold normal-case tracking-normal text-slate-800"
                      >
                        {PERSONA_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStudioView('ascii-themes');
                        setIsLeftSidebarOpen(false);
                      }}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeAsciiTheme.accent }} />
                      <span className="flex-1 text-left">Giao diện: {activeAsciiTheme.name}</span>
                      <Palette className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </aside>
              )}

              {/* -----------------------------------------------------------------
                  2. CENTER MAIN STAGE (Chat Stream / Full 10 ASCII Themes / Memory)
                  ----------------------------------------------------------------- */}
              <div
                className={`flex-1 flex flex-col min-w-0 min-h-0 bg-white transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isThemeFading ? 'opacity-30' : 'opacity-100'
                }`}
              >
                {/* Compact Mode Tab Switcher when not in Full Studio Mode */}
                {!isFullStudioMode && (
                  <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-1 text-xs font-bold shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveStudioView('chat')}
                        className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                          activeStudioView === 'chat'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        💬 Chat
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateNewThread}
                      className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-extrabold cursor-pointer"
                    >
                      + Mới
                    </button>
                  </div>
                )}

                {/* ==================== VIEW A: STUDIO CHAT WORKSPACE ==================== */}
                {activeStudioView === 'chat' && (
                  <>
                    {/* CONTAINER CHAT STAGE VỚI LIVING WALLPAPER CANVAS TOÀN PHẦN (Claudie / Autumn Forest / 10 Theme Style) */}
                    <div
                      ref={chatStageContainerRef}
                      className={`relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isThemeFading ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      {/* Living Animated Wallpaper Canvas */}
                      <canvas
                        ref={chatWallpaperCanvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none z-0"
                      />

                      {/* Stream tin nhắn & Welcome Card nổi trên nền kính mờ */}
                      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-6 max-lg:py-4! space-y-6">
                        <div className="max-w-3xl mx-auto space-y-6 max-lg:space-y-5!">
                          {/* Welcome Hero State (Claudie Autumn Forest reference / Google AI Studio / Gemini style) */}
                          {displayedTurns.length === 0 && (
                            <div className="backdrop-blur-xl bg-white/90 sm:bg-white/85 border border-[#d8e5f7] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center text-slate-900 animate-fade-in max-lg:bg-transparent! max-lg:border-0! max-lg:shadow-none! max-lg:backdrop-blur-none! max-lg:p-1! max-lg:pt-6! max-lg:text-left! max-lg:space-y-5!">
                              {/* Linh thú Pixel Art 8-bit mascot (như trong ảnh Claudie) */}
                              <div className="flex justify-center max-lg:justify-start! select-none pt-1">
                                <svg
                                  viewBox="0 0 40 28"
                                  className="w-16 h-12 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-transform hover:scale-110 duration-200"
                                  style={{ imageRendering: 'pixelated' }}
                                >
                                  {/* Body */}
                                  <rect x="6" y="8" width="28" height="14" rx="2" fill={activeAsciiTheme.accent} />
                                  {/* Ears / Antennae */}
                                  <rect x="10" y="4" width="4" height="4" fill={activeAsciiTheme.accent} />
                                  <rect x="26" y="4" width="4" height="4" fill={activeAsciiTheme.accent} />
                                  {/* Eyes */}
                                  <rect x="11" y="12" width="4" height="4" fill="#0f172a" />
                                  <rect x="25" y="12" width="4" height="4" fill="#0f172a" />
                                  {/* Eye sparkles */}
                                  <rect x="13" y="12" width="2" height="2" fill="#ffffff" />
                                  <rect x="27" y="12" width="2" height="2" fill="#ffffff" />
                                  {/* Feet */}
                                  <rect x="10" y="22" width="4" height="4" fill={activeAsciiTheme.accent} />
                                  <rect x="26" y="22" width="4" height="4" fill={activeAsciiTheme.accent} />
                                  {/* Side Hands */}
                                  <rect x="2" y="12" width="4" height="6" fill={activeAsciiTheme.accent} opacity="0.85" />
                                  <rect x="34" y="12" width="4" height="6" fill={activeAsciiTheme.accent} opacity="0.85" />
                                </svg>
                              </div>

                              <div className="space-y-2 max-w-lg mx-auto max-lg:mx-0!">
                                <h2 className="font-display font-black text-2xl sm:text-3xl max-lg:text-[26px]! text-slate-900 tracking-tight leading-tight">
                                  Chào buổi tối! Chúng ta cùng học bài nào?
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                                  Hỏi AI bất kỳ bài tập, công thức hay phương pháp giải nhanh cho bài học của em.
                                </p>
                                <div className="pt-1">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4fc] border border-[#d8e5f7] text-xs text-[#243c6e] font-semibold shadow-xs">
                                    <BookOpen className="w-3.5 h-3.5" style={{ color: activeAsciiTheme.accent }} />
                                    <span>
                                      {currentLesson
                                        ? currentLesson.title
                                        : `${memory.userProfile.grade || 'Lớp 6'} · ${memory.userProfile.favorite_subject || 'Toán học'}`}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {/* 4 Frosted Glass Action Cards in 2x2 grid (Khung kính mờ Claudie style) */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                                {[
                                  {
                                    icon: <BookOpen className="w-4 h-4" />,
                                    title: currentLesson
                                      ? `Tóm tắt: ${currentLesson.title}`
                                      : 'Tóm tắt bài học trọng tâm',
                                    sub: 'Hệ thống hóa lý thuyết và các công thức cốt lõi',
                                    prompt: currentLesson
                                      ? `Hãy tóm tắt ngắn gọn các ý chính và công thức quan trọng nhất của bài học "${currentLesson.title}".`
                                      : `Hãy lập bảng tóm tắt các kiến thức trọng tâm môn ${memory.userProfile.favorite_subject || 'Toán học'} ${memory.userProfile.grade || 'Lớp 6'}.`
                                  },
                                  {
                                    icon: <Target className="w-4 h-4" />,
                                    title: 'Tìm lỗi sai và bẫy đề thi',
                                    sub: 'Phân tích các bẫy trắc nghiệm hay gặp',
                                    prompt:
                                      'Hãy phân tích các lỗi sai kinh điển và bẫy đề thi hay gặp nhất ở chủ đề này kèm cách phòng tránh.'
                                  },
                                  {
                                    icon: <Edit3 className="w-4 h-4" />,
                                    title: 'Làm bài tập và kiểm tra nhanh',
                                    sub: 'Thử sức 3 câu trắc nghiệm kèm giải chi tiết',
                                    prompt: currentLesson
                                      ? `Hãy tạo 3 câu hỏi trắc nghiệm kiểm tra nhanh về bài "${currentLesson.title}" kèm đáp án giải thích.`
                                      : 'Hãy ra cho em 3 câu hỏi trắc nghiệm ôn tập kiến thức kèm lời giải chi tiết.'
                                  },
                                  {
                                    icon: <Brain className="w-4 h-4" />,
                                    title: 'Mẹo ghi nhớ và giải nhanh',
                                    sub: 'Phương pháp nhẩm nhanh và sơ đồ tư duy',
                                    prompt: currentLesson
                                      ? `Hãy chỉ cho em các mẹo ghi nhớ nhanh và phương pháp giải nhanh cho bài "${currentLesson.title}".`
                                      : 'Hãy gợi ý các mẹo ghi nhớ công thức lâu và phương pháp giải nhanh trắc nghiệm.'
                                  }
                                ].map((card, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      if (card.prompt) {
                                        handleSend(undefined, card.prompt);
                                      }
                                    }}
                                    className="p-4 rounded-2xl bg-white/90 hover:bg-white backdrop-blur-md border border-[#d8e5f7] hover:border-[#93b8e8] text-left transition-all cursor-pointer group shadow-lg flex items-start gap-3"
                                  >
                                    <div
                                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/15 text-white"
                                      style={{ backgroundColor: `${activeAsciiTheme.accent}35` }}
                                    >
                                      {card.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="text-xs sm:text-[13px] font-extrabold text-slate-900 group-hover:text-[#2e5cb8] truncate">
                                          {card.title}
                                        </span>
                                        <span
                                          style={{ color: activeAsciiTheme.accent }}
                                          className="font-mono text-xs font-bold shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                                        >
                                          →
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 line-clamp-1 font-normal">
                                        {card.sub}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Conversation Messages Stream với Bong bóng Kính mờ */}
                          {displayedTurns.map((msg, index) => {
                            const isUser = msg.role === 'user';
                            const turnKey = msg.id || `turn-${index}`;
                            return (
                              <div
                                key={turnKey}
                                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                              >
                                {!isUser && (
                                  <div
                                    style={{ backgroundColor: activeAsciiTheme.accent }}
                                    className="max-lg:hidden! w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 font-mono text-xs font-black shadow-md mt-0.5 border border-white/20"
                                  >
                                    AI
                                  </div>
                                )}

                                <div
                                  data-quick-lookup={isUser ? undefined : ""}
                                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed ${
                                    isUser
                                      ? 'backdrop-blur-md bg-[#2e5cb8] text-white border border-[#2e5cb8] rounded-tr-xs shadow-lg max-lg:max-w-[85%]! max-lg:rounded-3xl! max-lg:rounded-br-md! max-lg:px-4! max-lg:py-2.5! max-lg:text-[15px]! max-lg:shadow-none!'
                                      : 'backdrop-blur-xl bg-white/95 text-slate-800 border border-[#d8e5f7] rounded-tl-xs shadow-xl max-lg:max-w-full! max-lg:w-full! max-lg:bg-transparent! max-lg:border-0! max-lg:shadow-none! max-lg:backdrop-blur-none! max-lg:p-0! max-lg:text-[15px]!'
                                  }`}
                                >
                                  {isUser ? (
                                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                  ) : (
                                    <>
                                      {isPhone && (
                                        <div className="flex items-center gap-2 mb-1.5 text-[13px] font-bold text-slate-700">
                                          <span
                                            style={{ backgroundColor: activeAsciiTheme.accent }}
                                            className="w-6 h-6 rounded-full text-white flex items-center justify-center font-mono text-[10px] font-black"
                                          >
                                            AI
                                          </span>
                                          SmartStudy
                                        </div>
                                      )}
                                      <div className="prose-custom text-xs sm:text-[13px] max-lg:text-[15px]! max-lg:leading-[1.65]! text-slate-800">
                                        <ReactMarkdown
                                          remarkPlugins={mathRemarkPlugins}
                                          rehypePlugins={mathRehypePlugins}
                                        >
                                          {normalizeMathInText(msg.content)}
                                        </ReactMarkdown>
                                      </div>
                                      <div className="flex items-center justify-end max-lg:justify-start! gap-1.5 pt-2 mt-2 border-t border-slate-200 max-lg:border-0! max-lg:pt-1! text-[11px] max-lg:text-xs! [&>button]:max-lg:min-h-[36px]! [&>button]:max-lg:px-2.5! [&>button]:max-lg:rounded-full!">
                                        <button
                                          type="button"
                                          onClick={() => handleCopyMessage(turnKey, msg.content)}
                                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                          title="Sao chép câu trả lời"
                                        >
                                          {copiedTurnId === turnKey ? (
                                            <>
                                              <Check className="w-3 h-3 text-emerald-400" />
                                              <span className="text-emerald-300">Đã chép</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3 h-3" />
                                              <span>Sao chép</span>
                                            </>
                                          )}
                                        </button>
                                        {index === displayedTurns.length - 1 && (
                                          <button
                                            type="button"
                                            onClick={handleRegenerateLast}
                                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                            title="Tạo lại câu trả lời"
                                          >
                                            <RotateCcw className="w-3 h-3" />
                                            <span>Thử lại</span>
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {isUser && (
                                  <div className="max-lg:hidden! w-8 h-8 rounded-xl bg-[#e3edfa] border border-[#c9dcf4] text-[#243c6e] flex items-center justify-center shrink-0 shadow-xs text-xs mt-0.5">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {isLoading && (
                            <div className="flex items-start gap-3">
                              <div
                                style={{ backgroundColor: activeAsciiTheme.accent }}
                                className="w-8 h-8 max-lg:w-6! max-lg:h-6! max-lg:rounded-full! max-lg:text-[10px]! max-lg:mt-0.5! rounded-xl text-white flex items-center justify-center shrink-0 font-mono text-xs font-black shadow-md border border-white/20"
                              >
                                AI
                              </div>
                              <div className="backdrop-blur-xl bg-white/95 border border-[#d8e5f7] p-4 rounded-2xl rounded-tl-xs shadow-xl flex items-center gap-3 text-slate-700 max-lg:bg-transparent! max-lg:border-0! max-lg:shadow-none! max-lg:backdrop-blur-none! max-lg:p-0! max-lg:pt-1!">
                                <Loader2
                                  className="w-4 h-4 animate-spin shrink-0"
                                  style={{ color: activeAsciiTheme.accent }}
                                />
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold block text-slate-900">
                                    AI Studio đang suy luận và tra cứu bộ nhớ dài hạn...
                                  </span>
                                  <span className="block font-mono text-[10px] text-slate-400">
                                    {activeAsciiTheme.asciiSample}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </div>

                      {/* ==================== FLOATING FROSTED STUDIO COMPOSER (Claudie Style) ==================== */}
                      <div className="relative z-20 p-3 sm:p-4 max-lg:px-3! max-lg:pt-1.5! max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]! shrink-0">
                        <div className="max-w-3xl mx-auto space-y-2.5 max-lg:space-y-2!">
                          {/* Context & Quick Chips Bar (phone: only before the first message, like Gemini) */}
                          <div className={`flex items-center justify-between gap-2 overflow-x-auto no-scrollbar ${isPhone && displayedTurns.some((t) => t.role === 'user') ? 'hidden' : ''}`}>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {currentLesson && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md border border-[#d8e5f7] text-[#2e5cb8] text-[11px] font-bold">
                                  <BookOpen className="w-3 h-3 text-sky-400" />
                                  <span className="truncate max-w-[160px]">{currentLesson.title}</span>
                                </span>
                              )}
                              {[
                                'Giải thích dễ hiểu',
                                'Cho ví dụ thực tế',
                                'Tạo 3 câu trắc nghiệm',
                                'Tóm tắt công thức'
                              ].map((chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSend(undefined, chip)}
                                  disabled={isLoading}
                                  className="text-[11px] font-semibold whitespace-nowrap bg-white/90 hover:bg-white backdrop-blur-md border border-[#d8e5f7] text-[#243c6e] hover:text-[#2e5cb8] px-2.5 py-1 rounded-xl transition-colors cursor-pointer shrink-0"
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Voice-to-Text Live Banner */}
                          {(isListening || voiceError) && (
                            <div
                              className={`px-3 py-2 rounded-2xl border text-xs flex items-center justify-between gap-2 backdrop-blur-md ${
                                voiceError
                                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
                                  : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                              }`}
                            >
                              {voiceError ? (
                                <>
                                  <span>{voiceError}</span>
                                  <button
                                    type="button"
                                    onClick={clearVoiceError}
                                    className="px-2 py-0.5 rounded-lg bg-amber-500/30 text-[11px] font-bold cursor-pointer"
                                  >
                                    Đóng
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                                    <span className="font-bold text-rose-300">Đang nghe:</span>
                                    <span className="italic truncate text-slate-700">
                                      {interimTranscript || 'Em hãy nói câu hỏi vào Micro...'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={stopListening}
                                    className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer shrink-0"
                                  >
                                    Dừng
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Multi-line Frosted Studio Prompt Box (Claudie Style) */}
                          <form
                            onSubmit={handleSend}
                            className="backdrop-blur-2xl bg-white/95 sm:bg-white/95 border border-[#c9dcf4] focus-within:border-[#2e5cb8] rounded-3xl p-3 sm:p-3.5 transition-all shadow-2xl max-lg:flex! max-lg:items-end! max-lg:gap-1! max-lg:rounded-[28px]! max-lg:p-1.5! max-lg:pl-4! max-lg:bg-white/95!"
                          >
                            <textarea
                              rows={isPhone ? 1 : 2}
                              onInput={(e) => {
                                if (!isPhone) return;
                                const el = e.currentTarget;
                                el.style.height = 'auto';
                                el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
                              }}
                              value={
                                isListening && interimTranscript
                                  ? `${message}${message ? ' ' : ''}${interimTranscript}`
                                  : message
                              }
                              onChange={(e) => setMessage(e.target.value)}
                              ref={composerRef}
                              onKeyDown={(e) => {
                                // phone keyboards: Enter = new line, the ↑ button sends (like ChatGPT)
                                if (e.key === 'Enter' && !e.shiftKey && !isPhone) {
                                  e.preventDefault();
                                  handleSend();
                                }
                              }}
                              placeholder={
                                isListening
                                  ? 'Đang nghe giọng nói của em...'
                                  : isPhone
                                  ? 'Hỏi SmartStudy'
                                  : `Hỏi trợ lý SmartStudy (${activePersona.label}) — Nhấn Enter để gửi, Shift+Enter xuống dòng...`
                              }
                              disabled={isLoading}
                              enterKeyHint={isPhone ? 'enter' : 'send'}
                              className="w-full bg-transparent outline-none resize-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 px-2 py-1 leading-relaxed max-lg:flex-1! max-lg:min-w-0! max-lg:px-0! max-lg:py-2.5! max-lg:text-base! max-lg:leading-6! max-lg:max-h-[140px]!"
                            />

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 mt-1 max-lg:contents!">
                              {/* Left composer tools: Persona selector + Quick ASCII theme pill (phone: in the ☰ menu) */}
                              <div className="flex items-center gap-1.5 flex-wrap max-lg:hidden!">
                                <select
                                  value={selectedPersonaId}
                                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                                  aria-label="Chọn phong cách gia sư AI"
                                  className="px-2.5 py-1 rounded-xl bg-[#eef4fc] hover:bg-[#e3edfa] border border-[#d8e5f7] text-[11px] font-bold text-[#243c6e] cursor-pointer outline-none"
                                >
                                  {PERSONA_PRESETS.map((p) => (
                                    <option key={p.id} value={p.id} className="bg-white text-slate-900">
                                      ✦ {p.label}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => setActiveStudioView('ascii-themes')}
                                  className="px-2.5 py-1 rounded-xl bg-[#eef4fc] hover:bg-[#e3edfa] border border-[#d8e5f7] font-mono text-[10px] font-bold text-[#243c6e] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                  title="Đổi chủ đề ASCII cho khung chat"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: activeAsciiTheme.accent }}
                                  />
                                  <span>Theme: {activeAsciiTheme.name}</span>
                                </button>
                              </div>

                              {/* Right composer actions: Mic + Send Run Button */}
                              <div className="flex items-center gap-1.5 max-lg:gap-1! max-lg:shrink-0!">
                                <button
                                  type="button"
                                  onClick={() => setOfflineMode((v) => !v)}
                                  aria-pressed={offlineMode}
                                  data-toggle-badge
                                  aria-label="Trả lời ngoại tuyến, không cần mạng"
                                  title="Ngoại tuyến: trả lời bằng kiến thức trong máy, không cần mạng"
                                  className={`px-2.5 py-1.5 max-lg:w-10! max-lg:h-10! max-lg:px-0! max-lg:justify-center! whitespace-nowrap rounded-full border text-[11px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                                    offlineMode ? 'bg-[#8ee8b4] text-[#0e3b2e] border-[#8ee8b4]' : 'bg-[#eef4fc] hover:bg-[#e3edfa] text-[#243c6e] border-[#d8e5f7]'
                                  }`}
                                >
                                  <WifiOff className="w-4 h-4" aria-hidden />
                                  <span className="max-lg:hidden">Ngoại tuyến</span>
                                </button>
                                <span className="relative inline-flex">
                                  <select
                                    value={llmModel}
                                    onChange={(e) => pickLlm(e.target.value as ModelId)}
                                    disabled={llmProgress !== null && llmProgress < 100}
                                    aria-label="Chọn AI chạy trong máy"
                                    title="AI chạy trong máy: mô hình càng lớn càng thông minh nhưng tải lâu và chạy chậm hơn"
                                    className="max-w-[150px] max-lg:w-10! max-lg:h-10! max-lg:px-0! max-lg:text-transparent! [&>option]:text-[#243c6e] px-2 py-1.5 rounded-full border text-[11px] font-bold bg-[#eef4fc] text-[#243c6e] border-[#d8e5f7] cursor-pointer"
                                  >
                                    {MODELS.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name} ({m.size}){isModelDownloaded(m.id) ? ' ✓' : ''}
                                      </option>
                                    ))}
                                  </select>
                                  <Cpu className="lg:hidden absolute inset-0 m-auto w-4 h-4 text-[#243c6e] pointer-events-none" aria-hidden />
                                </span>
                                {llmProgress !== 100 && (
                                  <button
                                    type="button"
                                    onClick={downloadLlm}
                                    disabled={llmProgress !== null}
                                    aria-label={llmProgress === null ? `Tải AI trong máy (${llmInfo.size}) để trả lời không cần mạng` : `Đang tải AI trong máy ${llmProgress}%`}
                                    title={`Tải AI trong máy một lần (${llmInfo.size}), sau đó trả lời được cả khi không có mạng`}
                                    className="px-2.5 py-1.5 max-lg:w-10! max-lg:h-10! max-lg:px-0! max-lg:justify-center! rounded-full border text-[11px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer bg-[#eef4fc] hover:bg-[#e3edfa] text-[#243c6e] border-[#d8e5f7] disabled:cursor-wait whitespace-nowrap"
                                  >
                                    <Download className="w-4 h-4" aria-hidden />
                                    <span className="max-lg:hidden">{llmProgress === null ? 'Tải AI trong máy' : `${llmProgress}%`}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={toggleListening}
                                  disabled={isLoading}
                                  aria-label={isListening ? 'Dừng thu âm' : 'Nói câu hỏi bằng giọng nói'}
                                  className={`p-2 max-lg:w-10! max-lg:h-10! max-lg:flex! max-lg:items-center! max-lg:justify-center! max-lg:border-transparent! rounded-full border transition-all cursor-pointer ${
                                    isListening
                                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                                      : 'bg-[#eef4fc] hover:bg-[#e3edfa] text-[#243c6e] border-[#d8e5f7]'
                                  }`}
                                  title={isListening ? 'Dừng thu âm' : 'Nói câu hỏi bằng Micro'}
                                >
                                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>

                                <button
                                  type="submit"
                                  disabled={isLoading || (!message.trim() && !interimTranscript)}
                                  style={{
                                    backgroundColor: activeAsciiTheme.accent,
                                    color: activeAsciiTheme.contrastText
                                  }}
                                  className="p-2 sm:px-3 sm:py-2 max-lg:w-10! max-lg:h-10! max-lg:justify-center! rounded-full font-bold text-xs inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                                  title="Gửi câu hỏi (Enter)"
                                  aria-label="Gửi"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : isPhone ? (
                                    <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                  <span className="hidden lg:inline">Gửi</span>
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ==================== VIEW B: FULL 10 ASCII THEMES GALLERY INSIDE CHATBOX ==================== */}
                {activeStudioView === 'ascii-themes' && (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-5">
                    <div className="max-w-4xl mx-auto space-y-4">
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                              Bộ sưu tập giao diện · 10/10 miễn phí
                            </span>
                            <span className="font-mono text-xs font-bold text-sky-700">
                              ✦ {asciiPointsBalance.toLocaleString()} pts
                            </span>
                          </div>
                          <h3 className="font-display font-black text-base sm:text-lg text-slate-900 mt-1">
                            Kho giao diện ASCII trong SmartStudy
                          </h3>
                          <p className="text-xs text-slate-600">
                            Chọn bất kỳ chủ đề nào bên dưới để đổi ngay dải màu và hình nền ASCII động trong khung Chatbox trợ lý học tập.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectAsciiTheme('none')}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                          >
                            ☀ Mặc định Xanh-Trắng
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveStudioView('chat')}
                            style={{ backgroundColor: activeAsciiTheme.accent }}
                            className="px-3.5 py-2 rounded-xl text-white font-extrabold text-xs cursor-pointer"
                          >
                            ← Quay lại Chat
                          </button>
                        </div>
                      </div>

                      {/* Sort By (including Mood) + Multi-Select Granular Mood Tag Filter Bar */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-3 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              list="chatbox-mood-emotions-list"
                              value={themeEmotionInput}
                              onChange={(e) => setThemeEmotionInput(e.target.value)}
                              placeholder="Tìm hoặc nhập các nhãn Mood (Energy, Mystery, Learning, Calm, Cyber, Nature)..."
                              aria-label="Chọn cảm xúc (Mood) để lọc giao diện ASCII"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-500"
                            />
                            <datalist id="chatbox-mood-emotions-list">
                              {ALL_ASCII_MOOD_TAGS.map((tag) => (
                                <option key={tag} value={tag}>
                                  {ASCII_MOOD_TAG_ICONS[tag]} {tag}
                                </option>
                              ))}
                            </datalist>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <label htmlFor="chatbox-theme-sort" className="text-[11px] font-extrabold text-slate-600">
                              Sort By:
                            </label>
                            <select
                              id="chatbox-theme-sort"
                              value={themeSortBy}
                              onChange={(e) =>
                                setThemeSortBy(
                                  e.target.value as
                                    | 'mood-priority'
                                    | 'mood'
                                    | 'alphabetical'
                                    | 'newest'
                                    | 'popularity'
                                )
                              }
                              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer outline-none focus:border-sky-500"
                            >
                              <option value="mood-priority">Mood-Priority (Ưu tiên cảm xúc đã lưu)</option>
                              <option value="mood">Mood (📚 Learning, ⚡ Energy, 🔍 Mystery...)</option>
                              <option value="alphabetical">Alphabetical (A → Z)</option>
                              <option value="newest">Newest</option>
                              <option value="popularity">Popularity</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-extrabold text-slate-500 mr-1">
                            Multi-select Mood Tags:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMoodTags([]);
                              setThemeEmotionInput('');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                              selectedMoodTags.length === 0 && themeEmotionInput.trim() === ''
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                          >
                            ✦ All ({STUDIO_ASCII_THEMES.length})
                          </button>
                          {ALL_ASCII_MOOD_TAGS.map((tag) => {
                            const active = selectedMoodTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                aria-pressed={active}
                                onClick={() => handleToggleMoodTag(tag)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors inline-flex items-center gap-1 ${
                                  active
                                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span aria-hidden="true">{ASCII_MOOD_TAG_ICONS[tag]}</span>
                                <span>{active ? `✓ ${tag}` : tag}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {filteredAndSortedStudioThemes.map((theme) => {
                          const isCurrent = theme.id === activeAsciiTheme.id;
                          return (
                            <div
                              key={theme.id}
                              onClick={() => handleSelectAsciiTheme(theme.id)}
                              style={{
                                borderColor: isCurrent ? theme.accent : undefined
                              }}
                              className={`rounded-2xl border bg-white overflow-hidden flex flex-col justify-between transition-all cursor-pointer hover:-translate-y-0.5 shadow-2xs ${
                                isCurrent ? 'ring-2 ring-offset-1' : 'border-slate-200/90'
                              }`}
                            >
                              {/* ASCII Specimen Header */}
                              <div
                                style={{ background: theme.headerBg }}
                                className="p-3.5 text-white space-y-2 relative overflow-hidden"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-display font-extrabold text-sm">
                                    {theme.name}
                                  </span>
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 border border-white/20">
                                    {isCurrent ? '● ĐANG DÙNG' : '✓ Đã mở khoá'}
                                  </span>
                                </div>
                                <div className="font-mono text-xs font-bold tracking-widest bg-black/25 px-2.5 py-1.5 rounded-lg border border-white/15 truncate">
                                  {theme.asciiSample}
                                </div>
                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                  {theme.moodTags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-1.5 py-0.5 rounded bg-black/30 border border-white/20 font-mono text-[9px] font-bold text-white inline-flex items-center gap-1"
                                    >
                                      <span aria-hidden="true">{ASCII_MOOD_TAG_ICONS[tag]}</span>
                                      <span>{tag}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Theme Description & Action */}
                              <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {theme.description}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectAsciiTheme(theme.id);
                                  }}
                                  style={{
                                    backgroundColor: isCurrent ? theme.accent : undefined,
                                    color: isCurrent ? theme.contrastText : theme.accent,
                                    borderColor: theme.accent
                                  }}
                                  className="w-full py-2 px-3 rounded-xl border font-mono text-xs font-extrabold transition-all cursor-pointer"
                                >
                                  {isCurrent
                                    ? '✓ Đang áp dụng cho Studio và App'
                                    : 'Áp dụng Theme ASCII này'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal: Edit Profile Memory Form */}
            {isEditingProfile && (
              <div className="fixed inset-0 z-[85] bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm space-y-3 border border-slate-200"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-sky-600" />
                      Chỉnh sửa hồ sơ AI Memory
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Khối lớp
                        </label>
                        <input
                          type="text"
                          value={editForm.grade || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, grade: e.target.value }))
                          }
                          placeholder="Lớp 6"
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tuổi
                        </label>
                        <input
                          type="number"
                          value={editForm.age || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              age: parseInt(e.target.value) || undefined
                            }))
                          }
                          placeholder="12"
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Môn thế mạnh
                        </label>
                        <input
                          type="text"
                          value={editForm.favorite_subject || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              favorite_subject: e.target.value
                            }))
                          }
                          placeholder="Toán học"
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Môn cần bổ trợ
                        </label>
                        <input
                          type="text"
                          value={editForm.weak_subject || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, weak_subject: e.target.value }))
                          }
                          placeholder="Tiếng Anh"
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mục tiêu học tập
                      </label>
                      <input
                        type="text"
                        value={editForm.goal || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, goal: e.target.value }))
                        }
                        placeholder="Đạt học sinh Giỏi, nắm chắc Toán và KHTN..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        style={{ backgroundColor: activeAsciiTheme.accent }}
                        className="flex-1 py-2 rounded-xl font-bold text-white cursor-pointer"
                      >
                        Lưu hồ sơ
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {/* Modal: Confirmation to Clear Memory */}
            {showClearConfirm && (
              <div className="fixed inset-0 z-[85] bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-xs space-y-3 border border-rose-200 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Xác nhận xóa bộ nhớ AI Studio?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Toàn bộ lịch sử trò chuyện và thông tin học tập đã lưu sẽ được đặt lại về trạng thái ban đầu.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleClearMemory}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white cursor-pointer"
                    >
                      Xác nhận xóa
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
