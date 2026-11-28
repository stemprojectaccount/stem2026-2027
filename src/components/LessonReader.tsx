import React, { useState, useEffect, useMemo, useRef } from "react";
import { isQuickLookupSelection } from "../features/dictionary/quickLookupPrefs";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import LessonQRCode from "./LessonQRCode";
import { mathRemarkPlugins, mathRehypePlugins, normalizeMathInText } from "../lib/mathFormatter";
import { ArrowLeft, BookOpen, CheckCircle, Sparkles, Save, PenTool, Printer, Maximize2, Minimize2, Type, AlignJustify, Clock, X, ChevronLeft, ChevronRight, Eye, Sliders, Award, FileDown, Download, CheckCircle2, Loader2, FileText, Check, Copy, Play, Pause, Volume1, Volume2, VolumeX, RotateCcw, Moon, Sun, Share2, QrCode, ClipboardCheck } from "lucide-react";
import { Lesson } from "../types";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useReactToPrint } from "react-to-print";
import { buildPublicLessonUrl } from "../lib/shareLink";
import EasyReadPanel from "./support/EasyReadPanel";
import { apiUrl } from "../lib/apiBase";
import { loudAudio } from "../lib/loudAudio";
import { speakVi } from "../features/tools/conversation/speakVi";
import { speak as speakEnglish } from "../features/dictionary/pronunciation";

// Natural AI voices read by the server (/api/podcast-tts); the device voices stay in the list for offline use
const AI_VOICES = [
  { id: "ai:Lan", label: "Giọng AI tự nhiên – nữ (HoaiMy)" },
  { id: "ai:Minh", label: "Giọng AI tự nhiên – nam (NamMinh)" },
];
const isAiVoice = (id: string) => id.startsWith("ai:");

interface LessonReaderProps {
  lesson: Lesson;
  onBack: () => void;
  onUpdateNotes: (lessonId: string, notes: string) => void;
  onToggleComplete: (lessonId: string) => void;
  onStartQuizFromLesson: (lesson: Lesson) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: (active: boolean) => void;
  isAmbientDimmed?: boolean;
  onToggleAmbientDim?: (active: boolean) => void;
}

type FontSize = "small" | "normal" | "large" | "xlarge" | "huge";
type LineSpacing = "normal" | "relaxed" | "spacious";
type ReadingSpeed = 0.5 | 1 | 1.5 | 2;

const READING_SPEED_OPTIONS: ReadingSpeed[] = [0.5, 1, 1.5, 2];

const FONT_SIZE_STEPS: { id: FontSize; label: string; scaleLabel: string }[] = [
  { id: "small", label: "Nhỏ", scaleLabel: "90%" },
  { id: "normal", label: "Chuẩn", scaleLabel: "100%" },
  { id: "large", label: "Lớn", scaleLabel: "115%" },
  { id: "xlarge", label: "Rất lớn", scaleLabel: "130%" },
  { id: "huge", label: "Cực đại", scaleLabel: "150%" },
];

const READER_FONT_SIZE_STORAGE_KEY = "smart_study_reader_font_size_v1";
const READER_DARK_MODE_STORAGE_KEY = "smart_study_reader_dark_mode_v1";

interface SavedLessonScrollPosition {
  lessonId: string;
  scrollTop: number;
  scrollRatio: number;
  updatedAt: number;
}

const LAST_LESSON_SCROLL_STORAGE_KEY = "smart_study_last_lesson_scroll_v1";
const LESSON_SCROLL_MAP_STORAGE_KEY = "smart_study_lesson_scroll_map_v1";

let inMemoryLastLessonScroll: SavedLessonScrollPosition | null = null;
const inMemoryLessonScrollMap: Record<string, SavedLessonScrollPosition> = {};

function readSavedScrollPosition(lessonId: string): SavedLessonScrollPosition | null {
  try {
    const rawLast = localStorage.getItem(LAST_LESSON_SCROLL_STORAGE_KEY);
    if (rawLast) {
      const parsedLast = JSON.parse(rawLast) as SavedLessonScrollPosition;
      if (parsedLast && parsedLast.lessonId === lessonId && typeof parsedLast.scrollTop === "number") {
        return parsedLast;
      }
    }
    const rawMap = localStorage.getItem(LESSON_SCROLL_MAP_STORAGE_KEY);
    if (rawMap) {
      const parsedMap = JSON.parse(rawMap) as Record<string, SavedLessonScrollPosition>;
      if (parsedMap && parsedMap[lessonId] && typeof parsedMap[lessonId].scrollTop === "number") {
        return parsedMap[lessonId];
      }
    }
  } catch {
    // Fallback to in-memory storage when localStorage is unavailable
  }

  if (inMemoryLastLessonScroll && inMemoryLastLessonScroll.lessonId === lessonId) {
    return inMemoryLastLessonScroll;
  }
  return inMemoryLessonScrollMap[lessonId] || null;
}

function writeSavedScrollPosition(entry: SavedLessonScrollPosition): void {
  inMemoryLastLessonScroll = entry;
  inMemoryLessonScrollMap[entry.lessonId] = entry;
  try {
    localStorage.setItem(LAST_LESSON_SCROLL_STORAGE_KEY, JSON.stringify(entry));
    const rawMap = localStorage.getItem(LESSON_SCROLL_MAP_STORAGE_KEY);
    const parsedMap: Record<string, SavedLessonScrollPosition> = rawMap ? JSON.parse(rawMap) : {};
    parsedMap[entry.lessonId] = entry;
    localStorage.setItem(LESSON_SCROLL_MAP_STORAGE_KEY, JSON.stringify(parsedMap));
  } catch {
    // Fallback to in-memory storage when localStorage is unavailable
  }
}

export default function LessonReader({ 
  lesson, 
  onBack, 
  onUpdateNotes, 
  onToggleComplete,
  onStartQuizFromLesson,
  isFocusMode: externalFocusMode,
  onToggleFocusMode,
  isAmbientDimmed: externalAmbientDimmed,
  onToggleAmbientDim
}: LessonReaderProps) {
  const [internalFocusMode, setInternalFocusMode] = useState<boolean>(false);
  const [internalAmbientDimmed, setInternalAmbientDimmed] = useState<boolean>(true);
  const isFocusMode = externalFocusMode !== undefined ? externalFocusMode : internalFocusMode;
  const isAmbientDimmed = externalAmbientDimmed !== undefined ? externalAmbientDimmed : internalAmbientDimmed;

  const handleSetFocusMode = (active: boolean) => {
    if (onToggleFocusMode) {
      onToggleFocusMode(active);
    }
    setInternalFocusMode(active);
  };

  const handleSetAmbientDim = (active: boolean) => {
    if (onToggleAmbientDim) {
      onToggleAmbientDim(active);
    }
    setInternalAmbientDimmed(active);
  };

  const [notes, setNotes] = useState(lesson.notes || "");
  const [isPrinting, setIsPrinting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [restoredScrollInfo, setRestoredScrollInfo] = useState<{ scrollTop: number; percent: number } | null>(null);

  const readerShellRef = useRef<HTMLDivElement>(null);
  const isRestoringScrollRef = useRef<boolean>(false);
  const latestScrollMetricsRef = useRef<{ scrollTop: number; ratio: number }>({ scrollTop: 0, ratio: 0 });

  // PDF Export & Printing states
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportPdfProgress, setExportPdfProgress] = useState("");
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [includeNotesInExport, setIncludeNotesInExport] = useState(true);
  const [includeCoverHeader, setIncludeCoverHeader] = useState(true);
  const [includeSummaryCard, setIncludeSummaryCard] = useState(true);

  const printableContentRef = useRef<HTMLDivElement>(null);

  // Reader Typography & Font Size customizations (persisted in localStorage)
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try {
      const saved = localStorage.getItem(READER_FONT_SIZE_STORAGE_KEY) as FontSize | null;
      if (saved && FONT_SIZE_STEPS.some((s) => s.id === saved)) {
        return saved;
      }
    } catch {
      // Ignore storage access errors in sandbox
    }
    return "normal";
  });
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("relaxed");
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  const [isDarkReader, setIsDarkReader] = useState<boolean>(() => {
    try {
      return localStorage.getItem(READER_DARK_MODE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleToggleDarkReader = () => {
    setIsDarkReader((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(READER_DARK_MODE_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors in sandbox
      }
      return next;
    });
  };

  const currentFontSizeIdx = Math.max(
    0,
    FONT_SIZE_STEPS.findIndex((s) => s.id === fontSize)
  );
  const currentFontSizeMeta = FONT_SIZE_STEPS[currentFontSizeIdx] || FONT_SIZE_STEPS[1];

  const handleSelectFontSize = (nextSize: FontSize) => {
    setFontSize(nextSize);
    try {
      localStorage.setItem(READER_FONT_SIZE_STORAGE_KEY, nextSize);
    } catch {
      // Ignore storage access errors in sandbox
    }
  };

  const handleStepFontSize = (delta: -1 | 1) => {
    const nextIdx = Math.max(0, Math.min(FONT_SIZE_STEPS.length - 1, currentFontSizeIdx + delta));
    handleSelectFontSize(FONT_SIZE_STEPS[nextIdx].id);
  };

  // Web Speech API (Text-to-Speech) states & refs
  const [speechStatus, setSpeechStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [speechRate, setSpeechRate] = useState<ReadingSpeed>(1);
  const [speechVolume, setSpeechVolume] = useState<number>(1);
  // Phones show only the play controls; voice, speed and volume open on demand
  const [isSpeechSettingsOpen, setIsSpeechSettingsOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("ai:Lan");
  const [currentChunkIdx, setCurrentChunkIdx] = useState<number>(0);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(0);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const speechStatusRef = useRef<"idle" | "playing" | "paused">("idle");
  const speechRateRef = useRef<ReadingSpeed>(1);
  const speechVolumeRef = useRef<number>(1);
  const previousVolumeRef = useRef<number>(1);
  const selectedVoiceURIRef = useRef<string>("ai:Lan");
  const aiAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentChunkIdxRef = useRef<number>(0);
  const activeWordIdxRef = useRef<number>(0);
  const boundarySupportedRef = useRef<boolean>(false);
  const wordTimerRef = useRef<number | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const markdownContainerRef = useRef<HTMLDivElement>(null);

  const clearWordTimer = () => {
    if (wordTimerRef.current !== null) {
      window.clearInterval(wordTimerRef.current);
      wordTimerRef.current = null;
    }
  };

  // Parse Markdown lesson content into clean, natural-sounding speech chunks
  const speechChunks = useMemo(() => {
    const rawTitle = (lesson.title || "").trim();
    const rawContent = (lesson.content || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
      .replace(/\$([^$\n]+)\$/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/[*_~>-]+/g, " ")
      .replace(/\|/g, ", ");

    const combined = rawTitle ? `${rawTitle}. ${rawContent}` : rawContent;
    const paragraphs = combined
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length > 0);

    const chunks: string[] = [];
    for (const para of paragraphs) {
      if (para.length <= 200) {
        chunks.push(para);
      } else {
        const sentences = para.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [para];
        let buffer = "";
        for (const sentence of sentences) {
          const trimmed = sentence.trim();
          if (!trimmed) continue;
          if ((buffer + " " + trimmed).trim().length <= 200) {
            buffer = (buffer + " " + trimmed).trim();
          } else {
            if (buffer) chunks.push(buffer);
            buffer = trimmed;
          }
        }
        if (buffer) chunks.push(buffer);
      }
    }
    return chunks.length > 0 ? chunks : [rawTitle || "Nội dung bài học trống."];
  }, [lesson.title, lesson.content]);

  // Tokenize current speech chunk into words with character offsets for real-time highlighting
  const activeChunkWordTokens = useMemo(() => {
    const text = speechChunks[currentChunkIdx] || "";
    const tokens: { word: string; start: number; end: number }[] = [];
    const regex = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      tokens.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return tokens;
  }, [speechChunks, currentChunkIdx]);

  // Detect Web Speech API support & load available system voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    const loadSystemVoices = () => {
      try {
        const rawVoices = window.speechSynthesis.getVoices();
        if (!rawVoices || rawVoices.length === 0) return;

        // Deduplicate by voiceURI and sort Vietnamese voices first, then default/local voices
        const seen = new Set<string>();
        const uniqueVoices = rawVoices.filter((v) => {
          const key = v.voiceURI || `${v.name}-${v.lang}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const sortedVoices = [...uniqueVoices].sort((a, b) => {
          const aIsVi = a.lang.toLowerCase().startsWith("vi") ? 1 : 0;
          const bIsVi = b.lang.toLowerCase().startsWith("vi") ? 1 : 0;
          if (aIsVi !== bIsVi) return bIsVi - aIsVi;
          if (a.default !== b.default) return a.default ? -1 : 1;
          if (a.localService !== b.localService) return a.localService ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        setAvailableVoices(sortedVoices);

        const currentURI = selectedVoiceURIRef.current;
        const matchedExisting = currentURI
          ? sortedVoices.find((v) => v.voiceURI === currentURI)
          : null;

        if (matchedExisting) {
          preferredVoiceRef.current = matchedExisting;
        } else {
          const defaultVoice =
            sortedVoices.find((v) => v.lang.toLowerCase() === "vi-vn" && v.localService) ||
            sortedVoices.find((v) => v.lang.toLowerCase().startsWith("vi")) ||
            sortedVoices.find((v) => v.default) ||
            sortedVoices[0] ||
            null;
          preferredVoiceRef.current = defaultVoice;
          if (!isAiVoice(currentURI)) {
            const nextURI = defaultVoice?.voiceURI || "";
            selectedVoiceURIRef.current = nextURI;
            setSelectedVoiceURI(nextURI);
          }
        }
      } catch {
        // Ignore sandbox voice enumeration errors
      }
    };

    loadSystemVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadSystemVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadSystemVoices);
    };
  }, []);

  const stopAiAudio = () => {
    const a = aiAudioRef.current;
    aiAudioRef.current = null;
    if (a) {
      a.onended = a.onerror = a.onloadedmetadata = null;
      a.pause();
    }
  };

  const stopSpeechPlayback = () => {
    clearWordTimer();
    stopAiAudio();
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore synthesis cancel errors
    }
    activeUtteranceRef.current = null;
    speechStatusRef.current = "idle";
    currentChunkIdxRef.current = 0;
    activeWordIdxRef.current = 0;
    setSpeechStatus("idle");
    setCurrentChunkIdx(0);
    setActiveWordIdx(0);
  };

  const ttsUrl = (text: string) =>
    apiUrl(`/api/podcast-tts?speaker=${selectedVoiceURIRef.current === "ai:Minh" ? "Minh" : "Lan"}&slow=0&text=${encodeURIComponent(text)}`);

  // Plays one chunk with the server's AI voice; if it cannot load, this chunk falls back to the device voice
  const speakChunkWithAi = (index: number, chunkText: string, rate: number, volume: number) => {
    const words = chunkText.match(/\S+/g)?.length || 0;
    const a = loudAudio(ttsUrl(chunkText));
    aiAudioRef.current = a;
    a.playbackRate = rate;
    a.volume = volume;
    activeWordIdxRef.current = 0;
    setActiveWordIdx(0);
    a.onloadedmetadata = () => {
      // no word timings from the server: move the highlight evenly over the audio length
      if (words > 1 && Number.isFinite(a.duration)) {
        clearWordTimer();
        wordTimerRef.current = window.setInterval(() => {
          if (speechStatusRef.current !== "playing") return;
          const next = Math.min(words - 1, Math.floor((a.currentTime / a.duration) * words));
          if (next !== activeWordIdxRef.current) {
            activeWordIdxRef.current = next;
            setActiveWordIdx(next);
          }
        }, 120);
      }
    };
    a.onended = () => {
      clearWordTimer();
      if (aiAudioRef.current !== a || speechStatusRef.current !== "playing") return;
      const nextIdx = index + 1;
      if (nextIdx < speechChunks.length) {
        currentChunkIdxRef.current = nextIdx;
        setCurrentChunkIdx(nextIdx);
        speakChunkAt(nextIdx);
      } else {
        stopSpeechPlayback();
      }
    };
    const fallback = () => {
      if (aiAudioRef.current !== a) return;
      stopAiAudio();
      speakChunkAt(index, rate as ReadingSpeed, volume, preferredVoiceRef.current);
    };
    a.onerror = fallback;
    // the AI voice is sometimes slow to arrive: after 8 s this chunk is read by the device voice instead
    const startGuard = window.setTimeout(() => {
      if (speechStatusRef.current === "playing" && a.currentTime === 0 && a.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) fallback();
    }, 8000);
    a.addEventListener("playing", () => window.clearTimeout(startGuard), { once: true });
    currentChunkIdxRef.current = index;
    speechStatusRef.current = "playing";
    setCurrentChunkIdx(index);
    setSpeechStatus("playing");
    setSpeechError(null);
    a.play().catch(fallback);
    // warm the next chunk so there is no gap between chunks
    if (index + 1 < speechChunks.length) void fetch(ttsUrl(speechChunks[index + 1])).catch(() => undefined);
  };

  const speakChunkAt = (
    index: number,
    rateOverride?: ReadingSpeed,
    volumeOverride?: number,
    voiceOverride?: SpeechSynthesisVoice | null
  ) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setSpeechSupported(false);
      return;
    }

    if (index >= speechChunks.length) {
      stopSpeechPlayback();
      return;
    }

    clearWordTimer();
    stopAiAudio();

    try {
      window.speechSynthesis.cancel();
      const chunkText = speechChunks[index];
      const effectiveRate = rateOverride ?? speechRateRef.current;
      const effectiveVolume = Math.max(0, Math.min(1, volumeOverride ?? speechVolumeRef.current));
      const effectiveVoice = voiceOverride !== undefined ? voiceOverride : preferredVoiceRef.current;

      if (voiceOverride === undefined && isAiVoice(selectedVoiceURIRef.current)) {
        speakChunkWithAi(index, chunkText, effectiveRate, effectiveVolume);
        return;
      }

      // Tokenize chunk for word boundary tracking
      const tokens: { word: string; start: number; end: number }[] = [];
      const regex = /\S+/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(chunkText)) !== null) {
        tokens.push({
          word: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
      }

      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = effectiveVoice?.lang || "vi-VN";
      utterance.rate = effectiveRate;
      utterance.volume = effectiveVolume;
      utterance.pitch = 1;
      if (effectiveVoice) {
        utterance.voice = effectiveVoice;
      }

      boundarySupportedRef.current = false;
      activeWordIdxRef.current = 0;
      setActiveWordIdx(0);

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (typeof event.charIndex === "number" && tokens.length > 0) {
          boundarySupportedRef.current = true;
          let matchedIdx = 0;
          for (let i = 0; i < tokens.length; i++) {
            if (event.charIndex >= tokens[i].start && event.charIndex < tokens[i].end) {
              matchedIdx = i;
              break;
            }
            if (tokens[i].start <= event.charIndex) {
              matchedIdx = i;
            }
          }
          activeWordIdxRef.current = matchedIdx;
          setActiveWordIdx(matchedIdx);
        }
      };

      // Synchronized fallback word progression when the system TTS voice does not emit onboundary events
      if (tokens.length > 1) {
        const msPerWord = Math.max(115, Math.round(310 / effectiveRate));
        wordTimerRef.current = window.setInterval(() => {
          if (speechStatusRef.current !== "playing" || boundarySupportedRef.current) return;
          const nextWord = activeWordIdxRef.current + 1;
          if (nextWord < tokens.length) {
            activeWordIdxRef.current = nextWord;
            setActiveWordIdx(nextWord);
          }
        }, msPerWord);
      }

      utterance.onend = () => {
        clearWordTimer();
        if (speechStatusRef.current !== "playing") return;
        const nextIdx = index + 1;
        if (nextIdx < speechChunks.length) {
          currentChunkIdxRef.current = nextIdx;
          setCurrentChunkIdx(nextIdx);
          speakChunkAt(nextIdx);
        } else {
          stopSpeechPlayback();
        }
      };

      utterance.onerror = (event) => {
        clearWordTimer();
        if (event.error === "canceled" || event.error === "interrupted") {
          return;
        }
        setSpeechError("Không thể phát âm thanh bài học trên trình duyệt này.");
        stopSpeechPlayback();
      };

      activeUtteranceRef.current = utterance;
      currentChunkIdxRef.current = index;
      speechStatusRef.current = "playing";
      setCurrentChunkIdx(index);
      setSpeechStatus("playing");
      setSpeechError(null);
      window.speechSynthesis.speak(utterance);
    } catch {
      clearWordTimer();
      setSpeechError("Trình duyệt không hỗ trợ đọc văn bản lúc này.");
      stopSpeechPlayback();
    }
  };

  const handleToggleSpeech = () => {
    if (!speechSupported) return;

    if (speechStatus === "playing") {
      if (aiAudioRef.current) {
        aiAudioRef.current.pause();
        speechStatusRef.current = "paused";
        setSpeechStatus("paused");
        return;
      }
      try {
        window.speechSynthesis.pause();
        speechStatusRef.current = "paused";
        setSpeechStatus("paused");
      } catch {
        stopSpeechPlayback();
      }
      return;
    }

    if (speechStatus === "paused") {
      if (aiAudioRef.current) {
        speechStatusRef.current = "playing";
        setSpeechStatus("playing");
        void aiAudioRef.current.play().catch(() => speakChunkAt(currentChunkIdxRef.current));
        return;
      }
      try {
        if (window.speechSynthesis.paused && window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
          speechStatusRef.current = "playing";
          setSpeechStatus("playing");
        } else {
          speakChunkAt(currentChunkIdxRef.current);
        }
      } catch {
        speakChunkAt(currentChunkIdxRef.current);
      }
      return;
    }

    // Start from current chunk or beginning
    speakChunkAt(currentChunkIdxRef.current < speechChunks.length ? currentChunkIdxRef.current : 0);
  };

  const handleStepSpeechChunk = (delta: -1 | 1) => {
    if (!speechSupported || speechChunks.length === 0) return;
    const nextIdx = Math.max(0, Math.min(speechChunks.length - 1, currentChunkIdxRef.current + delta));
    speakChunkAt(nextIdx);
  };

  const handleSpeakFromSegmentText = (segmentText: string) => {
    if (!speechSupported || speechChunks.length === 0) return;
    const normalizedTarget = segmentText
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (!normalizedTarget) {
      handleToggleSpeech();
      return;
    }
    const targetPrefix = normalizedTarget.slice(0, 48);
    const matchedIdx = speechChunks.findIndex((chunk) => {
      const normChunk = chunk.replace(/\s+/g, " ").trim().toLowerCase();
      return (
        normChunk.includes(targetPrefix) ||
        targetPrefix.includes(normChunk.slice(0, 36))
      );
    });
    if (matchedIdx >= 0) {
      if (speechStatus === "playing" && currentChunkIdx === matchedIdx) {
        handleToggleSpeech();
      } else {
        speakChunkAt(matchedIdx);
      }
    } else {
      handleToggleSpeech();
    }
  };

  const handleSelectSpeechRate = (nextRate: ReadingSpeed) => {
    speechRateRef.current = nextRate;
    setSpeechRate(nextRate);
    if (speechStatusRef.current === "playing") {
      speakChunkAt(currentChunkIdxRef.current, nextRate);
    }
  };

  const handleCycleSpeechRate = () => {
    const currentIdx = READING_SPEED_OPTIONS.indexOf(speechRate);
    const nextRate = READING_SPEED_OPTIONS[(currentIdx + 1) % READING_SPEED_OPTIONS.length];
    handleSelectSpeechRate(nextRate);
  };

  const handleSelectVoice = (voiceURI: string) => {
    selectedVoiceURIRef.current = voiceURI;
    setSelectedVoiceURI(voiceURI);
    if (isAiVoice(voiceURI)) {
      if (speechStatusRef.current === "playing") speakChunkAt(currentChunkIdxRef.current);
      return;
    }
    const chosenVoice = availableVoices.find((v) => v.voiceURI === voiceURI) || null;
    preferredVoiceRef.current = chosenVoice;
    if (speechStatusRef.current === "playing") {
      speakChunkAt(currentChunkIdxRef.current, undefined, undefined, chosenVoice);
    }
  };

  const handleChangeSpeechVolume = (nextVolume: number) => {
    const clamped = Math.max(0, Math.min(1, Number(nextVolume.toFixed(2))));
    if (clamped > 0) {
      previousVolumeRef.current = clamped;
    }
    speechVolumeRef.current = clamped;
    setSpeechVolume(clamped);
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.volume = clamped;
    }
    if (aiAudioRef.current) {
      aiAudioRef.current.volume = clamped; // audio changes volume live, no need to restart the chunk
      return;
    }
    if (speechStatusRef.current === "playing") {
      speakChunkAt(currentChunkIdxRef.current, undefined, clamped);
    }
  };

  const handleToggleSpeechMute = () => {
    if (speechVolumeRef.current > 0) {
      previousVolumeRef.current = speechVolumeRef.current;
      handleChangeSpeechVolume(0);
    } else {
      handleChangeSpeechVolume(previousVolumeRef.current > 0 ? previousVolumeRef.current : 1);
    }
  };

  // Auto-scroll the active highlighted sentence inside the lesson reader view
  useEffect(() => {
    if (speechStatus === "idle" || !markdownContainerRef.current) return;
    const activeEl = markdownContainerRef.current.querySelector('[data-active-speech-block="true"]');
    if (activeEl instanceof HTMLElement) {
      const rect = activeEl.getBoundingClientRect();
      const inView = rect.top >= 110 && rect.bottom <= window.innerHeight - 90;
      if (!inView) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentChunkIdx, speechStatus]);

  // Helpers to match and underline the active sentence & current spoken word directly inside ReactMarkdown blocks
  const extractPlainText = (node: React.ReactNode): string => {
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractPlainText).join("");
    if (React.isValidElement(node)) {
      const props = node.props as { children?: React.ReactNode };
      return extractPlainText(props.children);
    }
    return "";
  };

  // Copy to Clipboard states & helpers for the main lesson content area
  const [copiedSegmentKey, setCopiedSegmentKey] = useState<string | null>(null);
  const [copyFeedbackMessage, setCopyFeedbackMessage] = useState<string | null>(null);
  const [selectedTextSegment, setSelectedTextSegment] = useState<string>("");
  const copyFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const copyTextToClipboard = async (
    rawText: string,
    segmentKey: string,
    appendToNotes: boolean = false
  ) => {
    const cleanText = rawText.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!cleanText) return;

    let copiedOk = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(cleanText);
        copiedOk = true;
      }
    } catch {
      copiedOk = false;
    }

    if (!copiedOk) {
      try {
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = cleanText;
        tempTextArea.setAttribute("readonly", "");
        tempTextArea.style.position = "fixed";
        tempTextArea.style.top = "-9999px";
        tempTextArea.style.left = "-9999px";
        document.body.appendChild(tempTextArea);
        tempTextArea.focus();
        tempTextArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextArea);
        copiedOk = true;
      } catch {
        // Ignore fallback error in strict sandbox
      }
    }

    if (appendToNotes) {
      const formattedSnippet = `• ${cleanText}`;
      const nextNotes = notes.trim() ? `${notes.trim()}\n\n${formattedSnippet}` : formattedSnippet;
      setNotes(nextNotes);
      onUpdateNotes(lesson.id, nextNotes);
      setSaveStatus("saved");
    }

    setCopiedSegmentKey(segmentKey);
    const preview = cleanText.length > 48 ? `${cleanText.slice(0, 48).trim()}…` : cleanText;
    setCopyFeedbackMessage(
      appendToNotes
        ? `Đã sao chép và lưu vào Sổ tay: "${preview}"`
        : `Đã sao chép vào bộ nhớ tạm: "${preview}"`
    );

    if (copyFeedbackTimerRef.current !== null) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopiedSegmentKey(null);
      setCopyFeedbackMessage(null);
      copyFeedbackTimerRef.current = null;
    }, 2400);
  };

  // LessonReader Share & Dynamic QR Code Popover state & handlers
  const [sharePopoverState, setSharePopoverState] = useState<{
    open: boolean;
    shareUrl: string;
    markerTag: string;
  }>({
    open: false,
    shareUrl: "",
    markerTag: "",
  });

  const sharePopoverRef = useRef<HTMLDivElement>(null);

  const buildLessonDeepLink = (): {
    isValid: boolean;
    shareUrl: string;
    markerTag: string;
  } => {
    const rawId = String(lesson?.id || "").trim();
    if (!rawId) {
      return {
        isValid: false,
        shareUrl: "",
        markerTag: "",
      };
    }

    const cleanId = rawId.replace(/^lesson-/, "");
    const normalizedId = `lesson-${cleanId}`;
    const slug = String(lesson?.title || "bai-hoc")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 28);
    const markerTag = slug ? `${normalizedId}-${slug}` : normalizedId;

    const shareUrl = buildPublicLessonUrl(cleanId, markerTag);
    return { isValid: true, shareUrl, markerTag };
  };

  const handleToggleSharePopover = () => {
    if (sharePopoverState.open) {
      setSharePopoverState((prev) => ({ ...prev, open: false }));
      return;
    }
    const { isValid, shareUrl, markerTag } = buildLessonDeepLink();
    setSharePopoverState({
      open: true,
      shareUrl: isValid ? shareUrl : "",
      markerTag,
    });
    if (isValid && shareUrl) {
      try {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?lessonId=${encodeURIComponent(
            String(lesson.id).replace(/^lesson-/, "")
          )}#${markerTag}`
        );
      } catch {
        // Ignore history state update issues in sandboxed iframes
      }
    }
  };

  // Close Share Popover on outside click or Escape key
  useEffect(() => {
    if (!sharePopoverState.open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        sharePopoverRef.current &&
        sharePopoverRef.current.contains(e.target as Node)
      ) {
        return;
      }
      setSharePopoverState((prev) => ({ ...prev, open: false }));
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSharePopoverState((prev) => ({ ...prev, open: false }));
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sharePopoverState.open]);

  // Reset Share Popover when lesson changes
  useEffect(() => {
    setSharePopoverState((prev) => ({
      ...prev,
      open: false,
    }));
  }, [lesson.id]);

  // AI Lesson Summary (Bullet-Point Key Concepts) state & handler
  const [aiSummaryState, setAiSummaryState] = useState<{
    open: boolean;
    loading: boolean;
    error: string | null;
    copied: boolean;
    savedToNotes: boolean;
    data: {
      overview: string;
      keyBullets: Array<{ title: string; detail: string }>;
      quickTipOrFormula: string;
    } | null;
  }>({
    open: false,
    loading: false,
    error: null,
    copied: false,
    savedToNotes: false,
    data: null,
  });

  const aiSummaryCacheRef = useRef<
    Record<
      string,
      {
        overview: string;
        keyBullets: Array<{ title: string; detail: string }>;
        quickTipOrFormula: string;
      }
    >
  >({});

  // Reset AI Summary open state when switching lessons
  useEffect(() => {
    setAiSummaryState((prev) => ({
      ...prev,
      open: false,
      loading: false,
      error: null,
      copied: false,
      savedToNotes: false,
      data: aiSummaryCacheRef.current[lesson.id] || null,
    }));
  }, [lesson.id]);

  const handleToggleAISummary = async (forceRefresh: boolean = false) => {
    if (!forceRefresh && aiSummaryState.open && aiSummaryState.data) {
      setAiSummaryState((prev) => ({ ...prev, open: false }));
      return;
    }

    const cached = aiSummaryCacheRef.current[lesson.id];
    if (!forceRefresh && cached) {
      setAiSummaryState({
        open: true,
        loading: false,
        error: null,
        copied: false,
        savedToNotes: false,
        data: cached,
      });
      return;
    }

    setAiSummaryState((prev) => ({
      ...prev,
      open: true,
      loading: true,
      error: null,
      copied: false,
      savedToNotes: false,
    }));

    try {
      const response = await fetch("/api/ai-lesson-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          lessonTitle: lesson.title || "",
          subject: (lesson as any)?.subject || (lesson as any)?.category || lesson.bookName || "",
          topic: lesson.topic || "",
          content: lesson.content || "",
        }),
      });
      if (!response.ok) {
        throw new Error("Không thể tạo bản tóm tắt AI lúc này.");
      }
      const result = await response.json();
      const summaryData = result?.summary;
      if (!summaryData || !Array.isArray(summaryData.keyBullets)) {
        throw new Error("Dữ liệu tóm tắt chưa đầy đủ.");
      }
      aiSummaryCacheRef.current[lesson.id] = summaryData;
      setAiSummaryState({
        open: true,
        loading: false,
        error: null,
        copied: false,
        savedToNotes: false,
        data: summaryData,
      });
    } catch (err: any) {
      setAiSummaryState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Không thể kết nối AI Summary. Em hãy thử lại nhé.",
      }));
    }
  };

  // AI Dictionary Tooltip state & cache
  const [aiDictState, setAiDictState] = useState<{
    open: boolean;
    word: string;
    contextText: string;
    x: number;
    y: number;
    placement: "top" | "bottom";
    loading: boolean;
    error: string | null;
    savedToNote: boolean;
    copiedDef: boolean;
    data: {
      term: string;
      partOfSpeechOrType: string;
      shortDefinition: string;
      contextExplanation: string;
      exampleOrFormula: string;
    } | null;
  }>({
    open: false,
    word: "",
    contextText: "",
    x: 0,
    y: 0,
    placement: "top",
    loading: false,
    error: null,
    savedToNote: false,
    copiedDef: false,
    data: null,
  });

  const aiDictCacheRef = useRef<
    Record<
      string,
      {
        term: string;
        partOfSpeechOrType: string;
        shortDefinition: string;
        contextExplanation: string;
        exampleOrFormula: string;
      }
    >
  >({});
  const aiDictRequestIdRef = useRef<number>(0);
  const aiDictTooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aiDictState.open) return;
    const handlePointerDownOutside = (e: MouseEvent) => {
      if (
        aiDictTooltipRef.current &&
        aiDictTooltipRef.current.contains(e.target as Node)
      ) {
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setAiDictState((prev) => ({ ...prev, open: false }));
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAiDictState((prev) => ({ ...prev, open: false }));
      }
    };
    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [aiDictState.open]);

  const lookupAIDictionary = async (
    rawTerm: string,
    rawContext: string,
    rect?: { left: number; top: number; bottom: number; width: number }
  ) => {
    const cleanTerm = rawTerm
      .trim()
      .replace(/^[.,;:!?"'()\[\]{}«»„“”‘’]+|[.,;:!?"'()\[\]{}«»„“”‘’]+$/g, "")
      .trim();
    if (!cleanTerm) return;

    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;

    let centerX = vw / 2;
    let anchorY = 140;
    let placement: "top" | "bottom" = "bottom";

    if (rect && (rect.width > 0 || rect.top > 0)) {
      centerX = Math.min(Math.max(rect.left + rect.width / 2, 185), vw - 185);
      const spaceAbove = rect.top;
      if (spaceAbove > 250) {
        placement = "top";
        anchorY = Math.max(rect.top - 10, 16);
      } else {
        placement = "bottom";
        anchorY = Math.min(rect.bottom + 10, vh - 24);
      }
    }

    const cacheKey = `${lesson?.id || "lesson"}::${cleanTerm.toLowerCase()}`;
    const cached = aiDictCacheRef.current[cacheKey];
    if (cached) {
      setAiDictState({
        open: true,
        word: cleanTerm,
        contextText: rawContext,
        x: centerX,
        y: anchorY,
        placement,
        loading: false,
        error: null,
        savedToNote: false,
        copiedDef: false,
        data: cached,
      });
      return;
    }

    const reqId = ++aiDictRequestIdRef.current;
    setAiDictState({
      open: true,
      word: cleanTerm,
      contextText: rawContext,
      x: centerX,
      y: anchorY,
      placement,
      loading: true,
      error: null,
      savedToNote: false,
      copiedDef: false,
      data: null,
    });

    try {
      const response = await fetch("/api/ai-dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: cleanTerm,
          context: rawContext,
          lessonTitle: lesson?.title || "",
          subject: (lesson as any)?.subject || (lesson as any)?.category || "",
        }),
      });
      if (!response.ok) {
        throw new Error("Không thể tra cứu thuật ngữ lúc này.");
      }
      const result = await response.json();
      if (reqId !== aiDictRequestIdRef.current) return;
      const entry = {
        term: result.term || cleanTerm,
        partOfSpeechOrType: result.partOfSpeechOrType || "Thuật ngữ bài học",
        shortDefinition:
          result.shortDefinition ||
          `Khái niệm "${cleanTerm}" trong bài "${lesson?.title || "Bản đọc"}".`,
        contextExplanation:
          result.contextExplanation ||
          `Trong ngữ cảnh đoạn văn đang chọn, "${cleanTerm}" giúp làm rõ nội dung trọng tâm của bài học.`,
        exampleOrFormula: result.exampleOrFormula || "",
      };
      aiDictCacheRef.current[cacheKey] = entry;
      setAiDictState((prev) => ({
        ...prev,
        loading: false,
        error: null,
        data: entry,
      }));
    } catch (err: any) {
      if (reqId !== aiDictRequestIdRef.current) return;
      setAiDictState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Không thể kết nối Từ điển AI. Em hãy thử lại nhé.",
      }));
    }
  };

  const handleCaptureSelectionInLesson = () => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectedTextSegment("");
        return;
      }
      const text = selection.toString().trim();
      if (!text) {
        setSelectedTextSegment("");
        return;
      }
      const container = markdownContainerRef.current;
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      if (
        container &&
        ((anchorNode && container.contains(anchorNode)) ||
          (focusNode && container.contains(focusNode)))
      ) {
        setSelectedTextSegment(text);

        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          let contextText = "";
          const anchorEl =
            anchorNode?.nodeType === Node.ELEMENT_NODE
              ? (anchorNode as HTMLElement)
              : anchorNode?.parentElement;
          const blockEl = anchorEl?.closest("p, li, blockquote, td, h1, h2, h3, h4");
          if (blockEl && blockEl.textContent) {
            contextText = blockEl.textContent.trim().slice(0, 420);
          } else if (anchorNode?.textContent) {
            contextText = anchorNode.textContent.trim().slice(0, 420);
          }

          const words = text.split(/\s+/).filter(Boolean);
          // Short English words are handled by "Tra nhanh" (dictionary); the AI explainer keeps Vietnamese terms
          if (isQuickLookupSelection(text)) return;
          if (words.length >= 1 && words.length <= 8 && text.length <= 65 && !text.includes("\n")) {
            lookupAIDictionary(text, contextText, {
              left: rect.left,
              top: rect.top,
              bottom: rect.bottom,
              width: rect.width,
            });
          }
        } catch {
          // Ignore range measurement issues
        }
      }
    } catch {
      // Ignore selection API errors
    }
  };

  const getFullPlainLessonText = (): string => {
    const cleanBody = speechChunks.join("\n\n");
    return lesson.title ? `${lesson.title}\n\n${cleanBody}` : cleanBody;
  };

  const normalizeSpeechCompare = (text: string): string =>
    text
      .replace(/[*_~`#>|-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const isNodeMatchingActiveSpeech = (children: React.ReactNode): boolean => {
    if (speechStatus === "idle") return false;
    const activeChunk = speechChunks[currentChunkIdx];
    if (!activeChunk) return false;
    const blockNorm = normalizeSpeechCompare(extractPlainText(children));
    const chunkNorm = normalizeSpeechCompare(activeChunk);
    if (!blockNorm || !chunkNorm || blockNorm.length < 3) return false;
    return blockNorm.includes(chunkNorm) || chunkNorm.includes(blockNorm);
  };

  const stripWordPunctuation = (w: string): string =>
    w.replace(/[.,!?;:()[\]"'“”‘’«»—–-]/g, "").trim();

  const highlightSpokenWordInChildren = (children: React.ReactNode): React.ReactNode => {
    const activeWordObj = activeChunkWordTokens[activeWordIdx];
    const cleanWord = activeWordObj ? stripWordPunctuation(activeWordObj.word) : "";
    if (!cleanWord) return children;

    const cleanWordLower = cleanWord.toLowerCase();
    let targetOccurrence = 0;
    for (let i = 0; i <= activeWordIdx && i < activeChunkWordTokens.length; i++) {
      if (stripWordPunctuation(activeChunkWordTokens[i].word).toLowerCase() === cleanWordLower) {
        targetOccurrence++;
      }
    }
    if (targetOccurrence < 1) targetOccurrence = 1;

    let seenOccurrences = 0;
    let highlightedOnce = false;

    const renderTextSegmentWithWordOpacity = (text: string): React.ReactNode => {
      const parts = text.split(/(\s+)/);
      return parts.map((part, idx) => {
        if (!part) return null;
        if (/^\s+$/.test(part)) return part;

        const strippedPart = stripWordPunctuation(part).toLowerCase();
        if (
          !highlightedOnce &&
          strippedPart &&
          (strippedPart === cleanWordLower || strippedPart.includes(cleanWordLower))
        ) {
          seenOccurrences++;
          if (seenOccurrences === targetOccurrence) {
            highlightedOnce = true;
            return (
              <mark
                key={idx}
                data-active-spoken-word="true"
                className="opacity-100 inline-block bg-amber-300 text-sky-950 font-black underline decoration-sky-700 decoration-[3px] underline-offset-4 rounded-md px-1.5 py-0.5 shadow-xs scale-[1.04] transition-all duration-150"
              >
                {part}
              </mark>
            );
          }
        }

        return (
          <span
            key={idx}
            className="opacity-35 transition-opacity duration-150"
          >
            {part}
          </span>
        );
      });
    };

    const processNode = (node: React.ReactNode): React.ReactNode => {
      if (typeof node === "string" || typeof node === "number") {
        return renderTextSegmentWithWordOpacity(String(node));
      }
      if (Array.isArray(node)) {
        return node.map((child, idx) => <React.Fragment key={idx}>{processNode(child)}</React.Fragment>);
      }
      if (React.isValidElement(node)) {
        const elProps = node.props as { className?: string; children?: React.ReactNode };
        const classNameStr = typeof elProps.className === "string" ? elProps.className : "";
        if (classNameStr.includes("katex")) {
          return (
            <span className="opacity-40 transition-opacity duration-150 inline-block">
              {node}
            </span>
          );
        }
        if (elProps.children !== undefined) {
          return React.cloneElement(node, {
            ...elProps,
            children: processNode(elProps.children)
          } as any);
        }
      }
      return node;
    };

    const processed = processNode(children);

    if (!highlightedOnce) {
      seenOccurrences = 0;
      targetOccurrence = 1;
      return processNode(children);
    }

    return processed;
  };

  const getScrollableContainer = (): HTMLElement | null => {
    if (typeof document === "undefined") return null;
    const mainScroll = document.getElementById("main_content_scroll");
    if (mainScroll) return mainScroll;
    let el: HTMLElement | null = readerShellRef.current?.parentElement || null;
    while (el && el !== document.body && el !== document.documentElement) {
      const style = window.getComputedStyle(el);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  const getScrollMetrics = () => {
    const container = getScrollableContainer();
    const containerScrollTop = container ? container.scrollTop : 0;
    const containerMaxScroll = container ? Math.max(0, container.scrollHeight - container.clientHeight) : 0;
    const winScrollTop = typeof window !== "undefined" ? window.scrollY || document.documentElement.scrollTop : 0;
    const winMaxScroll =
      typeof document !== "undefined"
        ? Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight)
        : 0;

    if (container && (containerScrollTop > 0 || containerMaxScroll >= winMaxScroll)) {
      const ratio = containerMaxScroll > 0 ? Math.min(1, Math.max(0, containerScrollTop / containerMaxScroll)) : 0;
      return { scrollTop: containerScrollTop, maxScroll: containerMaxScroll, ratio };
    }

    const ratio = winMaxScroll > 0 ? Math.min(1, Math.max(0, winScrollTop / winMaxScroll)) : 0;
    return { scrollTop: winScrollTop, maxScroll: winMaxScroll, ratio };
  };

  const scrollToOffset = (targetTop: number, behavior: ScrollBehavior = "smooth") => {
    const safeTop = Math.max(0, Math.round(targetTop));
    const container = getScrollableContainer();
    if (container) {
      container.scrollTo({ top: safeTop, behavior });
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: safeTop, behavior });
    }
  };

  const persistCurrentScrollPosition = () => {
    const { scrollTop, ratio } = getScrollMetrics();
    const effectiveTop = scrollTop > 0 ? scrollTop : latestScrollMetricsRef.current.scrollTop;
    const effectiveRatio = scrollTop > 0 ? ratio : latestScrollMetricsRef.current.ratio;
    writeSavedScrollPosition({
      lessonId: lesson.id,
      scrollTop: Math.max(0, Math.round(effectiveTop)),
      scrollRatio: Math.min(1, Math.max(0, Number(effectiveRatio.toFixed(4)))),
      updatedAt: Date.now()
    });
  };

  const handleBackWithScrollSave = () => {
    if (!isRestoringScrollRef.current) {
      persistCurrentScrollPosition();
    }
    onBack();
  };

  const handleResetScrollToTop = () => {
    isRestoringScrollRef.current = true;
    setRestoredScrollInfo(null);
    setScrollProgress(0);
    latestScrollMetricsRef.current = { scrollTop: 0, ratio: 0 };
    writeSavedScrollPosition({
      lessonId: lesson.id,
      scrollTop: 0,
      scrollRatio: 0,
      updatedAt: Date.now()
    });
    scrollToOffset(0, "smooth");
    window.setTimeout(() => {
      isRestoringScrollRef.current = false;
    }, 350);
  };

  // Reset notes & speech when lesson changes, and restore saved scroll position if re-opening the same lesson
  useEffect(() => {
    setNotes(lesson.notes || "");
    stopSpeechPlayback();
    setSpeechError(null);

    const saved = readSavedScrollPosition(lesson.id);
    const shouldRestore = Boolean(saved && (saved.scrollTop > 32 || saved.scrollRatio > 0.02));

    if (!shouldRestore || !saved) {
      isRestoringScrollRef.current = true;
      setRestoredScrollInfo(null);
      setScrollProgress(0);
      latestScrollMetricsRef.current = { scrollTop: 0, ratio: 0 };
      scrollToOffset(0, "auto");
      writeSavedScrollPosition({
        lessonId: lesson.id,
        scrollTop: 0,
        scrollRatio: 0,
        updatedAt: Date.now()
      });
      const releaseTimer = window.setTimeout(() => {
        isRestoringScrollRef.current = false;
      }, 150);
      return () => window.clearTimeout(releaseTimer);
    }

    isRestoringScrollRef.current = true;
    const performRestore = (behavior: ScrollBehavior) => {
      const { maxScroll } = getScrollMetrics();
      let targetTop = saved.scrollTop;
      if (maxScroll > 0 && (targetTop > maxScroll || targetTop === 0)) {
        targetTop = Math.round(saved.scrollRatio * maxScroll);
      }
      const computedRatio =
        maxScroll > 0 ? Math.min(1, Math.max(0, targetTop / maxScroll)) : saved.scrollRatio;
      const pct = Math.min(100, Math.max(1, Math.round(computedRatio * 100)));

      latestScrollMetricsRef.current = { scrollTop: targetTop, ratio: computedRatio };
      setScrollProgress(pct);
      setRestoredScrollInfo({ scrollTop: targetTop, percent: pct });
      scrollToOffset(targetTop, behavior);
    };

    const rafId = window.requestAnimationFrame(() => {
      performRestore("auto");
    });
    const settleTimer1 = window.setTimeout(() => {
      performRestore("smooth");
    }, 90);
    const settleTimer2 = window.setTimeout(() => {
      performRestore("smooth");
      isRestoringScrollRef.current = false;
    }, 260);
    const dismissNoticeTimer = window.setTimeout(() => {
      setRestoredScrollInfo(null);
    }, 6500);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer1);
      window.clearTimeout(settleTimer2);
      window.clearTimeout(dismissNoticeTimer);
      isRestoringScrollRef.current = false;
    };
  }, [lesson.id]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      clearWordTimer();
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  // Track reading scroll progress and remember scroll position for the active lesson
  useEffect(() => {
    const scrollContainer = getScrollableContainer();

    const handleScroll = () => {
      const { scrollTop, maxScroll, ratio } = getScrollMetrics();
      if (maxScroll > 0) {
        const pct = Math.min(100, Math.max(0, Math.round(ratio * 100)));
        setScrollProgress(pct);
      } else {
        setScrollProgress(0);
      }

      if (isRestoringScrollRef.current) return;

      latestScrollMetricsRef.current = { scrollTop, ratio };
      writeSavedScrollPosition({
        lessonId: lesson.id,
        scrollTop: Math.max(0, Math.round(scrollTop)),
        scrollRatio: Math.min(1, Math.max(0, Number(ratio.toFixed(4)))),
        updatedAt: Date.now()
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    scrollContainer?.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      scrollContainer?.removeEventListener("scroll", handleScroll);
      if (!isRestoringScrollRef.current && latestScrollMetricsRef.current.scrollTop > 0) {
        writeSavedScrollPosition({
          lessonId: lesson.id,
          scrollTop: Math.max(0, Math.round(latestScrollMetricsRef.current.scrollTop)),
          scrollRatio: Math.min(1, Math.max(0, Number(latestScrollMetricsRef.current.ratio.toFixed(4)))),
          updatedAt: Date.now()
        });
      }
    };
  }, [lesson.id]);

  // Listen to 'Escape' key to exit Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        handleSetFocusMode(false);
        setShowNotesDrawer(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode]);

  // Estimated reading time
  const readingTimeMinutes = useMemo(() => {
    const wordCount = (lesson.content || "").trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 180));
  }, [lesson.content]);

  // Handle in ấn qua react-to-print
  const handlePrintViaLibrary = useReactToPrint({
    contentRef: printableContentRef,
    documentTitle: `GiaoAn_${lesson.title.replace(/[\s/\\?%*:|"<>]/g, "_")}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 12mm 14mm 16mm 14mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background: #ffffff !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        .no-print {
          display: none !important;
        }
        .printable-lesson-container {
          display: block !important;
          position: static !important;
          width: 100% !important;
        }
      }
    `,
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    onPrintError: (errorLocation, error) => {
      console.error("Lỗi khi in ấn:", errorLocation, error);
      setIsPrinting(false);
    }
  });

  const handleTriggerPrint = () => {
    setIsPrinting(true);
    handlePrintViaLibrary();
  };

  // Xuất file PDF tải về máy trực tiếp bằng jsPDF & html2canvas
  const handleDownloadDirectPdf = async () => {
    if (!printableContentRef.current) return;
    setIsExportingPdf(true);
    setExportPdfProgress("Đang khởi tạo định dạng trang A4...");

    try {
      const element = printableContentRef.current;
      setExportPdfProgress("Đang kết xuất nội dung sắc nét (2x DPI)...");

      const canvas = await html2canvas(element, {
        scale: 2, // 2x scale for sharp text and formulas
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 800,
      });

      setExportPdfProgress("Đang phân trang tài liệu PDF...");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Trang 1
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;

      // Các trang kế tiếp nếu bài học dài
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
      }

      const safeTitle = lesson.title.replace(/[\s/\\?%*:|"<>]/g, "_").substring(0, 35);
      pdf.save(`GiaoAn_${safeTitle}_SmartStudy.pdf`);
      
      setExportSuccessMessage(`Đã xuất và tải về "GiaoAn_${safeTitle}_SmartStudy.pdf" thành công!`);
      setTimeout(() => {
        setExportSuccessMessage(null);
      }, 4000);
    } catch (error) {
      console.error("Lỗi xuất PDF:", error);
      setExportSuccessMessage("Có lỗi khi tạo PDF trực tiếp. Em hãy dùng chức năng 'In / Lưu PDF hệ thống' thay thế nhé!");
      setTimeout(() => {
        setExportSuccessMessage(null);
      }, 4500);
    } finally {
      setIsExportingPdf(false);
      setExportPdfProgress("");
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    setSaveStatus("saving");
    
    // Auto save simulation
    const delayDebounce = setTimeout(() => {
      onUpdateNotes(lesson.id, value);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);

    return () => clearTimeout(delayDebounce);
  };

  // Typography CSS classes mapped to user fontSize & lineSpacing choice in both Standard and Focus modes
  const typographyClasses = useMemo(() => {
    let bodySize = "text-base md:text-[17px]";
    let h1Size = "text-2xl md:text-3xl";
    let h2Size = "text-xl md:text-2xl";
    let h3Size = "text-lg md:text-xl";
    let quoteSize = "text-base md:text-[17px]";
    let followAlongSize = "text-xs";

    if (fontSize === "small") {
      bodySize = "text-[14px] md:text-[15px]";
      h1Size = "text-xl md:text-2xl";
      h2Size = "text-lg md:text-xl";
      h3Size = "text-base md:text-lg";
      quoteSize = "text-[14px] md:text-[15px]";
      followAlongSize = "text-[11px]";
    } else if (fontSize === "large") {
      bodySize = "text-lg md:text-[19px]";
      h1Size = "text-3xl md:text-4xl";
      h2Size = "text-2xl md:text-3xl";
      h3Size = "text-xl md:text-2xl";
      quoteSize = "text-lg md:text-[19px]";
      followAlongSize = "text-sm";
    } else if (fontSize === "xlarge") {
      bodySize = "text-xl md:text-[22px]";
      h1Size = "text-3xl md:text-[40px]";
      h2Size = "text-2xl md:text-3xl";
      h3Size = "text-xl md:text-2xl";
      quoteSize = "text-xl md:text-[22px]";
      followAlongSize = "text-base";
    } else if (fontSize === "huge") {
      bodySize = "text-2xl md:text-[25px]";
      h1Size = "text-4xl md:text-5xl";
      h2Size = "text-3xl md:text-4xl";
      h3Size = "text-2xl md:text-3xl";
      quoteSize = "text-2xl md:text-[25px]";
      followAlongSize = "text-lg";
    }

    const bodyColor = isDarkReader ? "text-slate-100" : isFocusMode ? "text-slate-800" : "text-slate-700";
    const h1Color = isDarkReader ? "text-sky-200 border-slate-700" : "text-sky-950 border-sky-200";
    const h2Color = isDarkReader ? "text-sky-300" : "text-sky-900";
    const h3Color = isDarkReader ? "text-slate-100" : "text-slate-800";

    if (!isFocusMode) {
      return {
        body: `${bodySize} leading-relaxed ${bodyColor} transition-all duration-150`,
        h1: `${h1Size} font-display font-black leading-tight ${h1Color} mb-4 mt-6 transition-all duration-150`,
        h2: `${h2Size} font-display font-extrabold leading-snug ${h2Color} mb-3 mt-6 transition-all duration-150`,
        h3: `${h3Size} font-display font-bold leading-snug ${h3Color} mb-2 mt-5 transition-all duration-150`,
        li: `${bodySize} leading-relaxed ${bodyColor} transition-all duration-150`,
        pMargin: "mb-4",
        blockquote: `my-6 p-4 md:p-5 ${quoteSize} leading-relaxed transition-all duration-150`,
        followAlong: `${followAlongSize} leading-relaxed`
      };
    }

    let leadingClass = "leading-[2]";
    let pMargin = "mb-6";
    if (lineSpacing === "normal") {
      leadingClass = "leading-relaxed";
      pMargin = "mb-5";
    } else if (lineSpacing === "spacious") {
      leadingClass = "leading-[2.3]";
      pMargin = "mb-7";
    }

    return {
      body: `${bodySize} ${leadingClass} ${bodyColor} font-normal tracking-wide transition-all duration-150`,
      h1: `${h1Size} font-display font-black leading-tight ${h1Color} mb-6 mt-8 border-b-2 pb-4 transition-all duration-150`,
      h2: `${h2Size} font-display font-extrabold leading-snug ${h2Color} mb-4 mt-8 flex items-center gap-2 transition-all duration-150`,
      h3: `${h3Size} font-display font-bold leading-snug ${h3Color} mb-3 mt-6 transition-all duration-150`,
      li: `${bodySize} ${leadingClass} ${bodyColor} transition-all duration-150`,
      pMargin: pMargin,
      blockquote: `my-8 p-5 md:p-6 ${quoteSize} leading-relaxed transition-all duration-150`,
      followAlong: `${followAlongSize} leading-relaxed`
    };
  }, [isFocusMode, fontSize, lineSpacing, isDarkReader]);

  return (
    <div
      ref={readerShellRef}
      data-lesson-reader-shell="true"
      className={`relative transition-all duration-300 ${isFocusMode ? "max-w-4xl mx-auto py-2" : "space-y-6 max-w-5xl mx-auto"}`}
    >
      {/* Ambient Focus Mode Backdrop (dims background canvas while keeping #lesson_reader_main crisp above it) */}
      <div aria-hidden="true" className="lesson-focus-backdrop" />

      {/* 1. Reading Progress Bar (Pinned to top of browser viewport) */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-sky-200/50 z-50">
        <div 
          className="h-full bg-sky-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Top Header / Control Toolbar */}
      {isFocusMode ? (
        /* ZEN FOCUS HEADER: Ultra-clean, distraction-free */
        <div className="lesson-focus-peripheral lesson-focus-peripheral-toolbar relative z-30 sticky top-2 mb-6 bg-sky-100/95 backdrop-blur-md rounded-2xl border border-sky-300/80 p-3 px-4 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          {/* Left: Exit Focus Mode & Lesson Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSetFocusMode(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-200/80 hover:bg-sky-300 text-sky-900 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Thoát chế độ tập trung (phím Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát tập trung</span>
              <span className="text-[10px] font-mono text-sky-700 bg-sky-100 px-1 py-0.5 rounded ml-0.5">Esc</span>
            </button>

            <div className="hidden md:flex items-center gap-2 border-l border-sky-200 pl-3">
              <span className="text-xs font-black text-sky-950 truncate max-w-xs">{lesson.title}</span>
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-600" /> ~{readingTimeMinutes} phút đọc
              </span>
            </div>
          </div>

          {/* Right: Typography & Assistant Controls */}
          <div className="flex items-center gap-2">
            {/* Web Speech API Play/Pause Button & Speed in Zen Focus Header */}
            {speechSupported && (
              <div className="flex items-center gap-1 bg-sky-200/80 p-1 rounded-xl border border-sky-300/80">
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  aria-pressed={speechStatus === "playing"}
                  aria-label={speechStatus === "playing" ? "Tạm dừng đọc bài học" : "Nghe đọc bài học"}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    speechStatus === "playing"
                      ? "bg-sky-600 text-white shadow-2xs"
                      : speechStatus === "paused"
                      ? "bg-amber-500 text-white"
                      : "text-sky-950 hover:bg-sky-300/80"
                  }`}
                  title={speechStatus === "playing" ? "Tạm dừng đọc bài giảng" : "Nghe đọc nội dung bài giảng"}
                >
                  {speechStatus === "playing" ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span className="hidden sm:inline">
                    {speechStatus === "playing" ? "Tạm dừng" : speechStatus === "paused" ? "Tiếp tục" : "Nghe bài"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleCycleSpeechRate}
                  aria-label={`Tốc độ đọc ${speechRate}x. Nhấn để chuyển đổi`}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-black text-sky-900 hover:bg-sky-300/80 transition-colors cursor-pointer num"
                  title="Đổi tốc độ đọc (0.5x / 1x / 1.5x / 2x)"
                >
                  {speechRate}x
                </button>
                {speechStatus !== "idle" && (
                  <button
                    type="button"
                    onClick={stopSpeechPlayback}
                    aria-label="Dừng và đọc lại từ đầu"
                    className="p-1 text-sky-800 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer"
                    title="Dừng và đặt lại từ đầu"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Font Size Adjustment Control (A- / Slider / A+) in Zen Focus Header */}
            <div
              className="flex items-center gap-1.5 bg-sky-200/80 px-2 py-1 rounded-xl border border-sky-300/80"
              role="group"
              aria-label="Điều chỉnh cỡ chữ bài học"
            >
              <Type className="w-3.5 h-3.5 text-sky-800 shrink-0 hidden sm:inline" />
              <button
                type="button"
                onClick={() => handleStepFontSize(-1)}
                disabled={currentFontSizeIdx <= 0}
                aria-label="Giảm cỡ chữ (A-)"
                className="px-2 py-0.5 text-xs font-black text-sky-900 disabled:opacity-35 hover:bg-sky-300/80 rounded-lg transition-colors cursor-pointer"
                title="Giảm cỡ chữ (A-)"
              >
                A-
              </button>
              <input
                type="range"
                min={0}
                max={FONT_SIZE_STEPS.length - 1}
                step={1}
                value={currentFontSizeIdx}
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10);
                  if (FONT_SIZE_STEPS[idx]) {
                    handleSelectFontSize(FONT_SIZE_STEPS[idx].id);
                  }
                }}
                aria-label="Thanh trượt cỡ chữ bài học"
                aria-valuemin={90}
                aria-valuemax={150}
                aria-valuenow={parseInt(currentFontSizeMeta.scaleLabel, 10)}
                aria-valuetext={`${currentFontSizeMeta.label} (${currentFontSizeMeta.scaleLabel})`}
                className="w-16 sm:w-20 h-1.5 bg-sky-300 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <span className="px-1 text-[11px] font-black text-sky-950 min-w-[36px] text-center num">
                {currentFontSizeMeta.scaleLabel}
              </span>
              <button
                type="button"
                onClick={() => handleStepFontSize(1)}
                disabled={currentFontSizeIdx >= FONT_SIZE_STEPS.length - 1}
                aria-label="Tăng cỡ chữ (A+)"
                className="px-2 py-0.5 text-xs font-black text-sky-900 disabled:opacity-35 hover:bg-sky-300/80 rounded-lg transition-colors cursor-pointer"
                title="Tăng cỡ chữ (A+)"
              >
                A+
              </button>
            </div>

            {/* Line Spacing Selector */}
            <button
              onClick={() => {
                setLineSpacing(prev => prev === "normal" ? "relaxed" : prev === "relaxed" ? "spacious" : "normal");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-sky-200/70 hover:bg-sky-200 text-sky-900 text-xs font-bold border border-sky-300/70 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Đổi giãn cách dòng (thoáng / rộng)"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {lineSpacing === "normal" ? "Giãn dòng: Vừa" : lineSpacing === "relaxed" ? "Giãn dòng: Thoáng" : "Giãn dòng: Rộng"}
              </span>
            </button>

            {/* Dark Reading Surface Toggle in Zen Focus Header */}
            <button
              type="button"
              onClick={handleToggleDarkReader}
              aria-pressed={isDarkReader}
              aria-label={isDarkReader ? "Chuyển sang giao diện đọc sáng" : "Bật giao diện đọc tối giảm mỏi mắt"}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isDarkReader
                  ? "bg-slate-900 text-amber-300 border-amber-400/60 shadow-2xs"
                  : "bg-sky-200/80 hover:bg-sky-300 text-sky-950 border-sky-300/80"
              }`}
              title="Đảo ngược màu nền và văn bản trong thẻ đọc để giảm mỏi mắt vào ban đêm"
            >
              {isDarkReader ? (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-sky-800" />
              )}
              <span className="hidden sm:inline">
                {isDarkReader ? "Giao diện đọc tối: Bật" : "Giao diện đọc tối"}
              </span>
            </button>

            {/* Toggle Notepad drawer in Focus mode */}
            <button
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showNotesDrawer 
                  ? "bg-sky-600 text-white border-sky-600 shadow-2xs" 
                  : "bg-sky-200/70 hover:bg-sky-200 text-sky-900 border-sky-300/70"
              }`}
              title="Mở sổ tay ghi chép nhanh"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ghi chú</span>
              {notes && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </button>

            {/* Share & QR Code Button in Focus Mode */}
            <button
              type="button"
              onClick={handleToggleSharePopover}
              aria-expanded={sharePopoverState.open}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                sharePopoverState.open
                  ? "bg-indigo-600 text-white border-indigo-700"
                  : "bg-sky-200/80 hover:bg-sky-300 text-sky-950 border-sky-300"
              }`}
              title="Chia sẻ bài học và quét mã QR trên điện thoại"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chia sẻ QR</span>
            </button>

            {/* Export PDF Button in Focus Mode */}
            <button
              onClick={() => setShowExportModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-sky-200/80 hover:bg-sky-300 text-sky-950 text-xs font-bold border border-sky-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Xuất bài học sang file PDF để học offline"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-700" />
              <span className="hidden sm:inline">Xuất PDF</span>
            </button>

            {/* Complete Check button */}
            <button
              onClick={() => onToggleComplete(lesson.id)}
              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                lesson.completed
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-sky-200/80 hover:bg-sky-300 text-sky-900 border-sky-300/80"
              }`}
              title={lesson.completed ? "Đã đánh dấu hoàn thành" : "Đánh dấu hoàn thành bài này"}
            >
              <CheckCircle className={`w-4 h-4 ${lesson.completed ? "text-emerald-600 fill-emerald-100" : "text-sky-700"}`} />
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD HEADER */
        <div className="lesson-focus-peripheral lesson-focus-peripheral-toolbar relative z-30 flex flex-wrap items-center justify-between gap-4 border-b border-sky-200/80 pb-4">
          <button 
            onClick={handleBackWithScrollSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-bold rounded-xl border border-sky-300/70 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Thư Viện</span>
          </button>

          <div className="reader-toolbar-actions flex flex-wrap items-center gap-2">
            {/* Web Speech API Play/Pause Button & Speed Selector in Standard Header */}
            {speechSupported && (
              <div className="inline-flex items-center gap-1 bg-sky-100/95 p-1 rounded-xl border border-sky-300/80 shadow-2xs">
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  aria-pressed={speechStatus === "playing"}
                  aria-label={speechStatus === "playing" ? "Tạm dừng đọc bài học" : "Nghe đọc bài học"}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    speechStatus === "playing"
                      ? "bg-sky-600 text-white shadow-2xs"
                      : speechStatus === "paused"
                      ? "bg-amber-500 text-white"
                      : "bg-sky-200/80 hover:bg-sky-300 text-sky-950"
                  }`}
                  title={speechStatus === "playing" ? "Tạm dừng nghe bài học" : "Nghe giọng đọc nội dung bài học"}
                >
                  {speechStatus === "playing" ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>
                    {speechStatus === "playing"
                      ? "Tạm dừng"
                      : speechStatus === "paused"
                      ? "Tiếp tục nghe"
                      : "Nghe bài học"}
                  </span>
                </button>
                <div className="hidden sm:flex items-center gap-0.5 bg-sky-200/60 p-0.5 rounded-lg" role="group" aria-label="Chọn tốc độ đọc">
                  {READING_SPEED_OPTIONS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSelectSpeechRate(rate)}
                      aria-pressed={speechRate === rate}
                      className={`px-1.5 py-0.5 rounded-md text-[11px] font-black transition-all cursor-pointer num ${
                        speechRate === rate
                          ? "bg-sky-600 text-white shadow-2xs"
                          : "text-sky-900 hover:bg-sky-200"
                      }`}
                      title={`Tốc độ đọc ${rate}x`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
                {speechStatus !== "idle" && (
                  <button
                    type="button"
                    onClick={stopSpeechPlayback}
                    aria-label="Dừng đọc và quay về đầu bài"
                    className="p-1.5 rounded-lg text-sky-800 hover:bg-sky-200 transition-colors cursor-pointer"
                    title="Dừng và đọc lại từ đầu"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Font Size Adjustment Control (A- / Slider / A+) in Standard Settings Bar */}
            <div
              className="inline-flex items-center gap-1.5 bg-sky-100/95 px-2.5 py-1.5 rounded-xl border border-sky-300/80 shadow-2xs"
              role="group"
              aria-label="Điều chỉnh cỡ chữ bài học"
            >
              <Type className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span className="text-[11px] font-extrabold text-sky-900 hidden md:inline">Cỡ chữ:</span>
              <button
                type="button"
                onClick={() => handleStepFontSize(-1)}
                disabled={currentFontSizeIdx <= 0}
                aria-label="Giảm cỡ chữ (A-)"
                className="px-2 py-0.5 rounded-lg bg-sky-200/80 hover:bg-sky-300 text-sky-950 text-xs font-black disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Thu nhỏ cỡ chữ (A-)"
              >
                A-
              </button>
              <input
                type="range"
                min={0}
                max={FONT_SIZE_STEPS.length - 1}
                step={1}
                value={currentFontSizeIdx}
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10);
                  if (FONT_SIZE_STEPS[idx]) {
                    handleSelectFontSize(FONT_SIZE_STEPS[idx].id);
                  }
                }}
                aria-label="Thanh trượt cỡ chữ bài học"
                aria-valuemin={90}
                aria-valuemax={150}
                aria-valuenow={parseInt(currentFontSizeMeta.scaleLabel, 10)}
                aria-valuetext={`${currentFontSizeMeta.label} (${currentFontSizeMeta.scaleLabel})`}
                className="w-16 sm:w-20 h-1.5 bg-sky-300 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <span
                className="text-[11px] font-black text-sky-950 min-w-[36px] text-center num"
                title={`Cỡ chữ: ${currentFontSizeMeta.label} (${currentFontSizeMeta.scaleLabel})`}
              >
                {currentFontSizeMeta.scaleLabel}
              </span>
              <button
                type="button"
                onClick={() => handleStepFontSize(1)}
                disabled={currentFontSizeIdx >= FONT_SIZE_STEPS.length - 1}
                aria-label="Tăng cỡ chữ (A+)"
                className="px-2 py-0.5 rounded-lg bg-sky-200/80 hover:bg-sky-300 text-sky-950 text-xs font-black disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Phóng to cỡ chữ (A+)"
              >
                A+
              </button>
            </div>

            {/* Dark Reading Mode Toggle Button (Inverts reading card background & text for night study) */}
            <button
              type="button"
              onClick={handleToggleDarkReader}
              aria-pressed={isDarkReader}
              aria-label={isDarkReader ? "Tắt giao diện đọc tối, chuyển về nền sáng" : "Bật giao diện đọc tối giảm mỏi mắt"}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isDarkReader
                  ? "bg-slate-950 text-amber-300 border-amber-400/70 shadow-xs"
                  : "bg-sky-100/95 hover:bg-sky-200 text-sky-950 border-sky-300/80 shadow-2xs"
              }`}
              title="Đảo ngược màu nền và văn bản trong thẻ đọc để giảm mỏi mắt khi học bài vào ban đêm"
            >
              {isDarkReader ? (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-sky-800" />
              )}
              <span>{isDarkReader ? "Giao diện đọc tối: Bật" : "Giao diện đọc tối"}</span>
            </button>

            {/* Ambient Focus Mode Dimming Toggle Button */}
            <button
              type="button"
              onClick={() => handleSetAmbientDim(!isAmbientDimmed)}
              aria-pressed={isAmbientDimmed}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isAmbientDimmed
                  ? "bg-slate-900 text-sky-200 border-sky-400/60 shadow-xs"
                  : "bg-sky-100/90 hover:bg-sky-200 text-sky-900 border-sky-300/80"
              }`}
              title="Tự động làm mờ các thành phần nền xung quanh để tập trung tối đa vào nội dung bài giảng"
            >
              <Eye className={`w-3.5 h-3.5 ${isAmbientDimmed ? "text-sky-300" : "text-sky-700"}`} />
              <span>{isAmbientDimmed ? "Focus Mode: Đang làm dịu nền" : "Làm dịu nền"}</span>
            </button>

            {/* Focus Reader Toggle Button */}
            <button
              onClick={() => handleSetFocusMode(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-sm flex items-center gap-2 transition-all text-xs font-extrabold cursor-pointer group"
              title="Ẩn thanh điều hướng và tiện ích thừa để tập trung đọc bài với chữ to và giãn dòng rộng"
            >
              <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Chế độ Focus Reader</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Zen</span>
            </button>

            {/* Share & QR Code Button in Standard Header */}
            <button
              type="button"
              onClick={handleToggleSharePopover}
              aria-expanded={sharePopoverState.open}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
                sharePopoverState.open
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                  : "bg-sky-100/95 hover:bg-sky-200 text-sky-950 border-sky-300/80 shadow-2xs"
              }`}
              title="Chia sẻ liên kết bài học và tạo mã QR quét nhanh trên điện thoại"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chia sẻ và Mã QR</span>
            </button>

            {/* Export to PDF Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 rounded-xl ss-btn-grad text-white shadow-sm flex items-center gap-2 transition-all text-xs font-extrabold cursor-pointer active:scale-95"
              title="Tải tài liệu học tập dạng PDF về máy để học offline hoặc in ấn"
            >
              <FileDown className="w-4 h-4" />
              <span>Xuất sang PDF</span>
              <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">Offline</span>
            </button>

            {/* Mark complete button */}
            <button
              onClick={() => onToggleComplete(lesson.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                lesson.completed
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-sky-200 hover:bg-sky-300 text-sky-950 border border-sky-300 shadow-2xs"
              }`}
            >
              <CheckCircle className={`w-4 h-4 ${lesson.completed ? "text-emerald-600 fill-emerald-100" : "text-sky-700"}`} />
              <span>{lesson.completed ? "Đã hoàn thành ✓" : "Hoàn thành"}</span>
            </button>

            {/* Quiz button */}
            <button
              onClick={() => onStartQuizFromLesson(lesson)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-sky-200" />
              <span>Làm bài kiểm tra</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Reading Area */}
      <div className={`relative z-20 grid grid-cols-1 ${isFocusMode ? "gap-0" : "lg:grid-cols-12 gap-6"} items-start`}>
        {/* The Main Lesson Reader Board (Exempt from Focus Mode opacity dimming) */}
        <div
          id="lesson_reader_main"
          data-lesson-reader-main="true"
          data-dark-reader={isDarkReader ? "true" : "false"}
          className={`${isFocusMode ? "w-full" : "lg:col-span-8"} lesson-reader-main-surface rounded-2xl p-4 sm:p-6 md:p-10 space-y-6 border relative overflow-hidden transition-colors duration-300 ${
            isDarkReader
              ? "bg-slate-950 text-slate-100 border-slate-700/90 shadow-[0_20px_50px_-12px_rgba(2,6,23,0.85)]"
              : "bg-white text-slate-800 border-slate-200/90 shadow-2xs"
          }`}
        >
          {/* Scoped styles for inverted dark reading surface */}
          {isDarkReader && (
            <style>{`
              #lesson_reader_main[data-dark-reader="true"] .prose-custom strong,
              #lesson_reader_main[data-dark-reader="true"] .prose-custom b {
                color: #f8fafc;
              }
              #lesson_reader_main[data-dark-reader="true"] .prose-custom em {
                color: #bae6fd;
              }
              #lesson_reader_main[data-dark-reader="true"] .prose-custom a {
                color: #38bdf8;
              }
              #lesson_reader_main[data-dark-reader="true"] .prose-custom .katex {
                color: #f1f5f9;
              }
            `}</style>
          )}

          {/* Metadata badges & Copy to Clipboard Toolbar */}
          <div className={`flex flex-wrap gap-2 items-center text-xs pb-2.5 border-b transition-colors duration-200 ${isDarkReader ? "border-slate-800" : "border-sky-200/80"}`}>
            <span className={`px-2.5 py-1 font-extrabold rounded-lg border ${isDarkReader ? "bg-slate-900 text-sky-300 border-slate-700" : "bg-sky-200/80 text-sky-900 border-sky-300/70"}`}>
              {lesson.bookName}
            </span>
            <span className={`px-2.5 py-1 font-extrabold rounded-lg border ${isDarkReader ? "bg-slate-900 text-indigo-300 border-slate-700" : "bg-sky-200/60 text-sky-800 border-sky-300/50"}`}>
              {lesson.grade}
            </span>
            <span className={`px-2.5 py-1 font-bold flex items-center gap-1 text-[11px] ${isDarkReader ? "text-slate-400" : "text-slate-500"}`}>
              <Clock className={`w-3.5 h-3.5 ${isDarkReader ? "text-sky-400" : "text-sky-600"}`} />
              <span>~{readingTimeMinutes} phút đọc</span>
            </span>

            {/* Main Content Share QR, AI Summary, TTS Play, Copy to Clipboard & Quick Dark Reader Button Group */}
            <div className="reader-toolbar-actions ml-auto flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleSharePopover}
                aria-expanded={sharePopoverState.open}
                aria-label="Mở bảng chia sẻ liên kết và mã QR bài học"
                title="Chia sẻ bài học qua liên kết hoặc quét mã QR để mở ngay trên điện thoại"
                className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                  sharePopoverState.open
                    ? "bg-sky-600 hover:bg-sky-700 text-white border-sky-700 shadow-xs"
                    : isDarkReader
                    ? "bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border-sky-400/50"
                    : "bg-sky-100/95 hover:bg-sky-200 text-sky-950 border-sky-300/90 shadow-2xs"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Chia sẻ QR</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleAISummary(false)}
                aria-expanded={aiSummaryState.open}
                aria-label="Tóm tắt ý chính bài học bằng AI"
                title="Xem bản tóm tắt gạch đầu dòng các khái niệm trọng tâm bằng AI để ôn tập nhanh"
                className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                  aiSummaryState.open
                    ? "bg-[#2e5cb8] hover:bg-[#254da0] text-white border-[#244a96] shadow-xs"
                    : isDarkReader
                    ? "bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border-violet-400/50"
                    : "ss-btn-grad text-white border-[#244a96] shadow-2xs"
                }`}
              >
                {aiSummaryState.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{aiSummaryState.open ? "Ẩn Tóm tắt AI" : "Tóm tắt AI"}</span>
              </button>
              <button
                type="button"
                onClick={handleToggleSpeech}
                disabled={!speechSupported}
                aria-pressed={speechStatus === "playing"}
                aria-label={
                  !speechSupported
                    ? "Trình duyệt không hỗ trợ đọc thành tiếng"
                    : speechStatus === "playing"
                    ? "Tạm dừng đọc bài học"
                    : speechStatus === "paused"
                    ? "Tiếp tục đọc bài học"
                    : "Đọc thành tiếng nội dung bài học"
                }
                title={
                  !speechSupported
                    ? "Trình duyệt không hỗ trợ đọc thành tiếng"
                    : speechStatus === "playing"
                    ? "Tạm dừng đọc bài học"
                    : "Nghe đọc thành tiếng nội dung bài học và theo dõi từng chữ"
                }
                className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                  !speechSupported
                    ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                    : speechStatus === "playing"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-xs"
                    : speechStatus === "paused"
                    ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs"
                    : isDarkReader
                    ? "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border-indigo-400/50"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-2xs"
                }`}
              >
                {speechStatus === "playing" ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Tạm dừng đọc ({currentChunkIdx + 1}/{speechChunks.length})</span>
                  </>
                ) : speechStatus === "paused" ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Tiếp tục đọc ({currentChunkIdx + 1}/{speechChunks.length})</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Đọc bài học</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleToggleDarkReader}
                aria-pressed={isDarkReader}
                aria-label={isDarkReader ? "Chuyển thẻ đọc sang nền sáng" : "Chuyển thẻ đọc sang giao diện đọc tối"}
                title="Đảo ngược màu nền và chữ trong thẻ đọc bài học"
                className={`min-h-[34px] px-2.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isDarkReader
                    ? "bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border-amber-400/50"
                    : "bg-sky-100/90 hover:bg-sky-200 text-sky-950 border-sky-300/80"
                }`}
              >
                {isDarkReader ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    <span>Đọc sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-sky-800" />
                    <span>Giao diện đọc tối</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const textToCopy =
                    selectedTextSegment ||
                    (speechStatus !== "idle" && speechChunks[currentChunkIdx]
                      ? speechChunks[currentChunkIdx]
                      : getFullPlainLessonText());
                  const key = selectedTextSegment
                    ? "main-copy-selected"
                    : speechStatus !== "idle"
                    ? "main-copy-active-speech"
                    : "main-copy-all";
                  copyTextToClipboard(textToCopy, key, false);
                }}
                aria-label="Sao chép văn bản bài học vào bộ nhớ tạm"
                title={
                  selectedTextSegment
                    ? "Sao chép đoạn văn bản đang bôi đen vào bộ nhớ tạm"
                    : speechStatus !== "idle"
                    ? "Sao chép câu đang đọc hiện tại"
                    : "Sao chép toàn bộ nội dung bài học vào bộ nhớ tạm"
                }
                className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                  copiedSegmentKey?.startsWith("main-copy")
                    ? "bg-teal-600 text-white border-teal-700 shadow-2xs"
                    : "bg-sky-200/85 hover:bg-sky-300/90 text-sky-950 border-sky-300/90 shadow-2xs"
                }`}
              >
                {copiedSegmentKey?.startsWith("main-copy") ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-sky-800" />
                    <span>
                      {selectedTextSegment
                        ? "Sao chép đoạn đã chọn"
                        : speechStatus !== "idle"
                        ? "Sao chép câu đang đọc"
                        : "Sao chép nội dung"}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const textToCopy =
                    selectedTextSegment ||
                    (speechStatus !== "idle" && speechChunks[currentChunkIdx]
                      ? speechChunks[currentChunkIdx]
                      : getFullPlainLessonText());
                  copyTextToClipboard(textToCopy, "main-copy-to-notes", true);
                }}
                aria-label="Sao chép và chèn thẳng vào Sổ tay ghi chú"
                title="Sao chép vào bộ nhớ tạm đồng thời chèn thẳng vào Sổ tay bài học"
                className={`min-h-[34px] px-2.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                  copiedSegmentKey === "main-copy-to-notes"
                    ? "bg-teal-600 text-white border-teal-700 shadow-2xs"
                    : "bg-sky-100/90 hover:bg-sky-200/90 text-sky-900 border-sky-300/80"
                }`}
              >
                {copiedSegmentKey === "main-copy-to-notes" ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Đã chép vào Sổ tay</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-3.5 h-3.5 text-sky-700" />
                    <span className="hidden sm:inline">+ Chép vào Sổ tay</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Inline Copy Confirmation & Selected Text Segment Quick-Copy Bar */}
          {(copyFeedbackMessage || selectedTextSegment) && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-sky-100/95 border border-sky-300/90 text-sky-950 text-xs font-bold shadow-2xs"
            >
              {copyFeedbackMessage ? (
                <div className="flex items-center gap-2 min-w-0 text-teal-900">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="truncate font-extrabold">{copyFeedbackMessage}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <Copy className="w-4 h-4 text-sky-700 shrink-0" />
                  <span className="truncate">
                    Đoạn đang chọn:{" "}
                    <em className="font-semibold text-sky-900">
                      "{selectedTextSegment.length > 65 ? `${selectedTextSegment.slice(0, 65)}…` : selectedTextSegment}"
                    </em>
                  </span>
                </div>
              )}

              {selectedTextSegment && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleSpeakFromSegmentText(selectedTextSegment)}
                    className="px-2.5 py-1 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="Đọc thành tiếng từ đoạn văn bản đang bôi đen"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Nghe đoạn chọn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      lookupAIDictionary(
                        selectedTextSegment.slice(0, 65),
                        selectedTextSegment
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="Tra nghĩa và giải thích theo ngữ cảnh bài học với Từ điển AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Từ điển AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyTextToClipboard(selectedTextSegment, "selection-bar-copy", false)}
                    className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Sao chép đoạn này</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyTextToClipboard(selectedTextSegment, "selection-bar-notes", true)}
                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <PenTool className="w-3 h-3" />
                    <span>Lưu vào ghi chú</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTextSegment("");
                      try {
                        window.getSelection()?.removeAllRanges();
                      } catch {
                        // Ignore selection clear error
                      }
                    }}
                    aria-label="Bỏ chọn đoạn văn bản"
                    className="p-1 rounded-lg text-sky-800 hover:bg-sky-200/80 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Restored Scroll Position Banner when re-opening the same lesson */}
          {restoredScrollInfo && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-teal-50/95 border border-teal-300/80 text-teal-950 text-xs font-bold shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="truncate">
                  Đã tự động cuộn tới vị trí đọc gần nhất ({restoredScrollInfo.percent}% bài học)
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={handleResetScrollToTop}
                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đọc lại từ đầu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRestoredScrollInfo(null)}
                  aria-label="Đóng thông báo vị trí đọc"
                  className="p-1 rounded-lg text-teal-800 hover:bg-teal-200/70 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* AI Summary Panel (Bullet-Point Key Concepts for Quick Review) */}
          {aiSummaryState.open && (
            <div
              role="region"
              aria-label="Bản tóm tắt ý chính bài học bằng AI"
              className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 shadow-md transition-all duration-300 ${
                isDarkReader
                  ? "bg-slate-900/95 border-violet-500/40 text-slate-100"
                  : "bg-gradient-to-br from-violet-50/95 via-indigo-50/80 to-white border-violet-200 text-slate-900"
              }`}
            >
              {/* Panel Header */}
              <div
                className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b ${
                  isDarkReader ? "border-slate-800" : "border-violet-200/80"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl ss-grad-brand-br text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">
                        Tóm tắt AI · ôn tập nhanh
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          isDarkReader
                            ? "bg-slate-800 text-violet-300 border border-slate-700"
                            : "bg-violet-100 text-violet-800"
                        }`}
                      >
                        {aiSummaryState.data?.keyBullets?.length || 0} ý trọng tâm
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-black truncate ${
                        isDarkReader ? "text-white" : "text-slate-950"
                      }`}
                    >
                      Tóm tắt kiến thức cốt lõi: {lesson.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  {aiSummaryState.data && !aiSummaryState.loading && (
                    <button
                      type="button"
                      onClick={() => handleToggleAISummary(true)}
                      title="Tạo lại bản tóm tắt AI mới"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 transition-colors cursor-pointer ${
                        isDarkReader
                          ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                          : "bg-white border-violet-200 text-violet-800 hover:bg-violet-100/70"
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Tạo lại</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setAiSummaryState((prev) => ({ ...prev, open: false }))
                    }
                    aria-label="Đóng bảng tóm tắt AI"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDarkReader
                        ? "text-slate-400 hover:text-white hover:bg-slate-800"
                        : "text-slate-500 hover:text-slate-800 hover:bg-violet-100/80"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              {aiSummaryState.loading ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2.5 text-center">
                  <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                  <p
                    className={`text-xs font-bold ${
                      isDarkReader ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    AI đang chắt lọc các khái niệm và ý chính quan trọng nhất của bài học...
                  </p>
                </div>
              ) : aiSummaryState.error ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
                  <span>{aiSummaryState.error}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAISummary(true)}
                    className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer shrink-0"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                aiSummaryState.data && (
                  <div className="space-y-3">
                    {/* Overview */}
                    <div
                      className={`px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed font-semibold ${
                        isDarkReader
                          ? "bg-indigo-950/40 border-indigo-800/50 text-indigo-100"
                          : "bg-white/95 border-violet-200/90 text-slate-800"
                      }`}
                    >
                      <span className="font-black text-violet-600 dark:text-violet-400 uppercase text-[10px] tracking-wider block mb-0.5">
                        Tổng quan trọng tâm:
                      </span>
                      {aiSummaryState.data.overview}
                    </div>

                    {/* Bullet-Point Key Concepts */}
                    <ul className="space-y-2" aria-label="Danh sách các khái niệm trọng tâm">
                      {aiSummaryState.data.keyBullets.map((item, idx) => (
                        <li
                          key={idx}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                            isDarkReader
                              ? "bg-slate-950/80 border-slate-800 text-slate-200"
                              : "bg-white/95 border-violet-100 text-slate-800 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-[#2e5cb8] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 num">
                              {idx + 1}
                            </span>
                            <div className="text-xs leading-relaxed min-w-0">
                              <strong
                                className={`font-black block mb-0.5 ${
                                  isDarkReader ? "text-violet-300" : "text-indigo-950"
                                }`}
                              >
                                {item.title}
                              </strong>
                              <span
                                className={
                                  isDarkReader ? "text-slate-300" : "text-slate-700"
                                }
                              >
                                {item.detail}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              stopSpeechPlayback();
                              void speakVi(`${item.title}. ${item.detail}`, speechRate);
                            }}
                            title="Nghe đọc ý chính này"
                            aria-label={`Nghe đọc ý chính: ${item.title}`}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border shrink-0 inline-flex items-center gap-1 transition-colors cursor-pointer ${
                              isDarkReader
                                ? "bg-slate-800 border-slate-700 text-violet-300 hover:bg-slate-700"
                                : "bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100"
                            }`}
                          >
                            <Volume2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Nghe</span>
                          </button>
                        </li>
                      ))}
                    </ul>

                    {/* Quick Tip / Formula */}
                    {aiSummaryState.data.quickTipOrFormula && (
                      <div
                        className={`px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed ${
                          isDarkReader
                            ? "bg-amber-950/35 border-amber-700/50 text-amber-200"
                            : "bg-amber-50/90 border-amber-200 text-amber-950"
                        }`}
                      >
                        <strong className="font-black uppercase text-[10px] tracking-wider block mb-0.5">
                          Mẹo ghi nhớ / Công thức cốt lõi:
                        </strong>
                        <span className="font-semibold">
                          {aiSummaryState.data.quickTipOrFormula}
                        </span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!aiSummaryState.data) return;
                          const fullSummarySpeech = [
                            `Tóm tắt bài học ${lesson.title}.`,
                            aiSummaryState.data.overview,
                            ...aiSummaryState.data.keyBullets.map(
                              (b, idx) => `Ý ${idx + 1}: ${b.title}. ${b.detail}`
                            ),
                            aiSummaryState.data.quickTipOrFormula,
                          ]
                            .filter(Boolean)
                            .join(" ");
                          stopSpeechPlayback();
                          void speakVi(fullSummarySpeech, speechRate);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isDarkReader
                            ? "bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700"
                            : "bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100"
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Đọc toàn bộ tóm tắt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!aiSummaryState.data) return;
                          const formattedSummary = [
                            `[TÓM TẮT AI - ${lesson.title}]`,
                            `• Tổng quan: ${aiSummaryState.data.overview}`,
                            ...aiSummaryState.data.keyBullets.map(
                              (b, idx) => `  ${idx + 1}. ${b.title}: ${b.detail}`
                            ),
                            aiSummaryState.data.quickTipOrFormula
                              ? `Ghi nhớ: ${aiSummaryState.data.quickTipOrFormula}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join("\n");
                          copyTextToClipboard(formattedSummary, "ai-summary-notes", true);
                          setAiSummaryState((prev) => ({
                            ...prev,
                            savedToNotes: true,
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                          aiSummaryState.savedToNotes
                            ? "bg-emerald-600 text-white"
                            : "bg-[#2e5cb8] hover:bg-[#254da0] text-white shadow-2xs"
                        }`}
                      >
                        {aiSummaryState.savedToNotes ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã chép vào Sổ tay</span>
                          </>
                        ) : (
                          <>
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Lưu vào Sổ tay</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!aiSummaryState.data) return;
                          const formattedSummary = [
                            `TÓM TẮT AI: ${lesson.title}`,
                            aiSummaryState.data.overview,
                            ...aiSummaryState.data.keyBullets.map(
                              (b, idx) => `- ${b.title}: ${b.detail}`
                            ),
                            aiSummaryState.data.quickTipOrFormula
                              ? `Ghi nhớ: ${aiSummaryState.data.quickTipOrFormula}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join("\n");
                          copyTextToClipboard(formattedSummary, "ai-summary-copy", false);
                          setAiSummaryState((prev) => ({
                            ...prev,
                            copied: true,
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                          aiSummaryState.copied
                            ? "bg-teal-600 text-white border-teal-700"
                            : isDarkReader
                            ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                            : "bg-white border-violet-200 text-slate-800 hover:bg-violet-50"
                        }`}
                      >
                        {aiSummaryState.copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép tóm tắt</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Inline Lesson Audio Reader Bar (Web Speech API + Reading Speed + Real-Time Word/Sentence Highlighting) */}
          <div
            className={`flex flex-col gap-3 px-4 py-3.5 rounded-2xl border shadow-2xs transition-colors duration-200 ${
              isDarkReader
                ? "bg-slate-900/95 border-slate-700/90 text-slate-100"
                : "bg-sky-100/90 border-sky-300/80"
            }`}
            role="region"
            aria-label="Trình đọc âm thanh bài giảng và theo dõi từng từ"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  disabled={!speechSupported}
                  aria-pressed={speechStatus === "playing"}
                  aria-label={
                    !speechSupported
                      ? "Trình duyệt không hỗ trợ đọc giọng nói"
                      : speechStatus === "playing"
                      ? "Tạm dừng đọc bài giảng"
                      : speechStatus === "paused"
                      ? "Tiếp tục đọc bài giảng"
                      : "Phát âm thanh bài giảng"
                  }
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    !speechSupported
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : speechStatus === "playing"
                      ? "bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
                      : speechStatus === "paused"
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                      : "bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
                  }`}
                >
                  {!speechSupported ? (
                    <VolumeX className="w-4 h-4" />
                  ) : speechStatus === "playing" ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>
                    {!speechSupported
                      ? "Không hỗ trợ đọc"
                      : speechStatus === "playing"
                      ? "Tạm dừng"
                      : speechStatus === "paused"
                      ? "Tiếp tục nghe"
                      : "Nghe bài giảng"}
                  </span>
                </button>

                {speechSupported && speechChunks.length > 1 && (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepSpeechChunk(-1)}
                      disabled={speechStatus === "idle" && currentChunkIdx === 0}
                      aria-label="Lùi lại câu trước"
                      title="Đọc câu trước"
                      className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-0 justify-center px-2.5 py-1.5 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isDarkReader
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                          : "bg-white/90 hover:bg-sky-200/80 text-sky-950 border-sky-300/80"
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Câu trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepSpeechChunk(1)}
                      disabled={currentChunkIdx >= speechChunks.length - 1}
                      aria-label="Chuyển sang câu tiếp theo"
                      title="Đọc câu tiếp theo"
                      className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-0 justify-center px-2.5 py-1.5 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isDarkReader
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                          : "bg-white/90 hover:bg-sky-200/80 text-sky-950 border-sky-300/80"
                      }`}
                    >
                      <span className="hidden md:inline">Câu tiếp</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="min-w-0 hidden sm:block">
                  <div className="flex items-center gap-2">
                    <Volume2 className={`w-4 h-4 shrink-0 ${speechStatus === "playing" ? "text-sky-600 animate-pulse" : "text-sky-700"}`} />
                    <span className={`text-xs font-extrabold truncate ${isDarkReader ? "text-slate-100" : "text-sky-950"}`}>
                      {speechStatus === "playing"
                        ? `Đang đọc câu ${currentChunkIdx + 1}/${speechChunks.length}`
                        : speechStatus === "paused"
                        ? `Đang tạm dừng (câu ${currentChunkIdx + 1}/${speechChunks.length})`
                        : "Nghe đọc và gạch chân theo dõi trực tiếp"}
                    </span>
                  </div>
                  {speechError && (
                    <p className="text-[11px] font-semibold text-rose-600 truncate" role="alert">
                      {speechError}
                    </p>
                  )}
                </div>
              </div>

              {speechSupported && (
                <button
                  type="button"
                  onClick={() => setIsSpeechSettingsOpen((v) => !v)}
                  aria-expanded={isSpeechSettingsOpen}
                  aria-controls="lesson-reader-speech-settings"
                  className={`sm:hidden ml-auto min-h-[44px] px-3 rounded-xl text-sm font-bold border inline-flex items-center gap-1.5 cursor-pointer ${
                    isDarkReader ? "bg-slate-800 text-slate-100 border-slate-700" : "bg-white/90 text-sky-950 border-sky-300/80"
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpeechSettingsOpen ? "Ẩn tuỳ chỉnh" : "Tuỳ chỉnh"}</span>
                </button>
              )}

              {speechSupported && (
                <div id="lesson-reader-speech-settings" className={`${isSpeechSettingsOpen ? "flex" : "hidden"} sm:flex w-full sm:w-auto flex-wrap items-center gap-2 ml-auto`}>
                  {/* System Voice Dropdown Selector */}
                  <div className="flex sm:inline-flex w-full sm:w-auto items-center gap-1.5 bg-sky-200/80 px-2.5 py-1 rounded-xl border border-sky-300/80">
                    <label
                      htmlFor="lesson-reader-voice-select"
                      className="text-[11px] font-extrabold text-sky-900 whitespace-nowrap"
                    >
                      Giọng đọc:
                    </label>
                    <select
                      id="lesson-reader-voice-select"
                      value={selectedVoiceURI}
                      onChange={(e) => handleSelectVoice(e.target.value)}
                      aria-label="Chọn giọng đọc hệ thống"
                      className="min-h-[36px] sm:min-h-[30px] flex-1 min-w-0 sm:flex-none max-w-full sm:max-w-[220px] px-2 py-0.5 rounded-lg bg-sky-50/95 text-sky-950 text-xs font-bold border border-sky-300/90 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer truncate"
                    >
                      {AI_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>{v.label}</option>
                      ))}
                      {availableVoices.length === 0 ? (
                        <option value="">Giọng đọc mặc định hệ thống (vi-VN)</option>
                      ) : (
                        availableVoices.map((voice) => {
                          const isVi = voice.lang.toLowerCase().startsWith("vi");
                          return (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                              {isVi ? "[VI] " : ""}
                              {voice.name} ({voice.lang})
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>

                  {/* Reading Speed Selector (0.5x, 1x, 1.5x, 2x) */}
                  <div
                    className="flex sm:inline-flex w-full sm:w-auto items-center gap-1 bg-sky-200/80 p-1 rounded-xl border border-sky-300/80"
                    role="group"
                    aria-label="Tốc độ đọc (Reading Speed)"
                  >
                    <span className="text-[11px] font-extrabold text-sky-900 px-2 whitespace-nowrap">Tốc độ:</span>
                    {READING_SPEED_OPTIONS.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleSelectSpeechRate(rate)}
                        aria-pressed={speechRate === rate}
                        aria-label={`Tốc độ đọc ${rate}x`}
                        className={`min-h-[40px] sm:min-h-[30px] flex-1 sm:flex-none px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer num ${
                          speechRate === rate
                            ? "bg-sky-600 text-white shadow-2xs"
                            : "text-sky-950 hover:bg-sky-300/80"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  {/* Independent Volume Control Slider next to Reading Speed Selector */}
                  <div
                    className="flex sm:inline-flex w-full sm:w-auto items-center gap-2 bg-sky-200/80 px-2.5 py-1 rounded-xl border border-sky-300/80"
                    role="group"
                    aria-label="Điều chỉnh âm lượng giọng đọc"
                  >
                    <button
                      type="button"
                      onClick={handleToggleSpeechMute}
                      aria-label={speechVolume === 0 ? "Bật lại âm thanh giọng đọc" : "Tắt tiếng giọng đọc"}
                      title={speechVolume === 0 ? "Bật tiếng" : "Tắt tiếng"}
                      className="p-1 rounded-lg text-sky-900 hover:bg-sky-300/80 transition-colors cursor-pointer"
                    >
                      {speechVolume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                      ) : speechVolume < 0.5 ? (
                        <Volume1 className="w-3.5 h-3.5 text-sky-800" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-sky-800" />
                      )}
                    </button>
                    <label htmlFor="lesson-reader-volume-slider" className="sr-only">
                      Âm lượng giọng đọc
                    </label>
                    <input
                      id="lesson-reader-volume-slider"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={speechVolume}
                      onChange={(e) => handleChangeSpeechVolume( parseFloat(e.target.value) )}
                      aria-label="Thanh trượt âm lượng giọng đọc"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(speechVolume * 100)}
                      className="flex-1 sm:flex-none w-20 sm:w-24 h-1.5 bg-sky-300 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    />
                    <span className="text-[11px] font-black text-sky-950 min-w-[34px] text-right num">
                      {Math.round(speechVolume * 100)}%
                    </span>
                  </div>

                  {speechStatus !== "idle" && (
                    <button
                      type="button"
                      onClick={stopSpeechPlayback}
                      aria-label="Đọc lại từ đầu"
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-sky-200/70 hover:bg-sky-300 text-sky-900 text-xs font-bold border border-sky-300/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Dừng và đặt lại về đoạn đầu tiên"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Đặt lại</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Sentence Progress Scrubber */}
            {speechSupported && speechChunks.length > 1 && (
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] font-black num shrink-0 ${isDarkReader ? "text-sky-300" : "text-sky-900"}`}>
                  Câu {currentChunkIdx + 1}/{speechChunks.length}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, speechChunks.length - 1)}
                  step={1}
                  value={currentChunkIdx}
                  onChange={(e) => {
                    const nextIdx = Number(e.target.value);
                    speakChunkAt(nextIdx);
                  }}
                  aria-label="Thanh tiến trình câu đang đọc trong bài học"
                  className="flex-1 h-1.5 bg-sky-300/80 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className={`text-[11px] font-bold num shrink-0 ${isDarkReader ? "text-slate-400" : "text-slate-600"}`}>
                  {Math.round(((currentChunkIdx + 1) / Math.max(1, speechChunks.length)) * 100)}%
                </span>
              </div>
            )}

            {/* Real-Time Word & Sentence Underlining Follow-Along Box */}
            <div
              className={`px-3.5 py-2.5 rounded-xl border transition-all duration-150 ${
                speechStatus === "idle" ? "hidden sm:block" : ""
              } ${
                isDarkReader
                  ? "bg-slate-950/90 border-slate-800 text-slate-100"
                  : "bg-sky-50/95 border-sky-200/90"
              } ${typographyClasses.followAlong}`}
              aria-live="polite"
            >
              {speechStatus !== "idle" ? (
                <p>
                  {activeChunkWordTokens.map((token, idx) => {
                    const isCurrentWord = idx === activeWordIdx;
                    const isPastWord = idx < activeWordIdx;
                    return (
                      <React.Fragment key={`${idx}-${token.start}`}>
                        <span
                          className={`inline-block rounded px-1 py-0.5 transition-all duration-150 ${
                            isCurrentWord
                              ? "opacity-100 scale-105 bg-amber-300 text-slate-950 font-black underline decoration-sky-700 decoration-[2.5px] underline-offset-4 shadow-xs"
                              : isPastWord
                              ? isDarkReader
                                ? "opacity-45 text-sky-200 font-semibold"
                                : "opacity-35 text-sky-900 font-semibold"
                              : isDarkReader
                              ? "opacity-30 text-slate-300 font-medium"
                              : "opacity-25 text-slate-700 font-medium"
                          }`}
                        >
                          {token.word}
                        </span>{" "}
                      </React.Fragment>
                    );
                  })}
                </p>
              ) : (
                <p className={`hidden sm:block text-[11px] font-medium ${isDarkReader ? "text-slate-300" : "text-slate-600"}`}>
                  Nhấn <strong className={`font-extrabold ${isDarkReader ? "text-sky-300" : "text-sky-900"}`}>Nghe bài giảng</strong> để hệ thống đọc, làm mờ các từ xung quanh và tự động gạch chân nổi bật đúng từ đang đọc.
                </p>
              )}
            </div>
          </div>

          <EasyReadPanel key={lesson.id} lesson={lesson} dark={isDarkReader} />

          {/* Dynamic Content Display with Focus Typography, Real-Time Speech Highlighting & Per-Segment Copy to Clipboard */}
          <div
            ref={markdownContainerRef}
            data-quick-lookup
            onMouseUp={handleCaptureSelectionInLesson}
            onKeyUp={handleCaptureSelectionInLesson}
            onTouchEnd={handleCaptureSelectionInLesson}
            className={`prose-custom focus-reader-content ${isFocusMode ? "max-w-none" : ""}`}
          >
            <ReactMarkdown
              remarkPlugins={mathRemarkPlugins}
              rehypePlugins={mathRehypePlugins}
              components={{
                h1: ({node, children, ...props}) => {
                  const isActive = isNodeMatchingActiveSpeech(children);
                  return (
                    <h1
                      data-active-speech-block={isActive ? "true" : undefined}
                      className={`${typographyClasses.h1} ${
                        isActive
                          ? `opacity-100 ${isDarkReader ? "bg-sky-950/85 ring-2 ring-sky-400" : "bg-sky-200/60 ring-2 ring-sky-400/80"} rounded-xl px-3 py-1.5 -mx-3 transition-all duration-200`
                          : speechStatus !== "idle"
                          ? "opacity-35 hover:opacity-80 transition-opacity duration-200"
                          : ""
                      }`}
                      {...props}
                    >
                      {isActive ? highlightSpokenWordInChildren(children) : children}
                    </h1>
                  );
                },
                h2: ({node, children, ...props}) => {
                  const isActive = isNodeMatchingActiveSpeech(children);
                  const segmentText = extractPlainText(children).trim();
                  const segmentKey = `h2-${node?.position?.start?.line ?? segmentText.slice(0, 24)}`;
                  const isCopied = copiedSegmentKey === segmentKey;
                  return (
                    <h2
                      data-active-speech-block={isActive ? "true" : undefined}
                      className={`group/segment relative pr-20 ${typographyClasses.h2} ${
                        isActive
                          ? `opacity-100 ${isDarkReader ? "bg-sky-950/85 ring-2 ring-sky-400" : "bg-sky-200/60 ring-2 ring-sky-400/80"} rounded-xl px-3 py-1.5 -mx-3 transition-all duration-200`
                          : speechStatus !== "idle"
                          ? "opacity-35 hover:opacity-80 transition-opacity duration-200"
                          : ""
                      }`}
                      {...props}
                    >
                      <span>{isActive ? highlightSpokenWordInChildren(children) : children}</span>
                      {segmentText.length > 0 && (
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(segmentText, segmentKey, false)}
                          aria-label={`Sao chép tiêu đề: ${segmentText}`}
                          title="Sao chép tiêu đề này vào bộ nhớ tạm"
                          className={`absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                            isCopied
                              ? "opacity-100 bg-teal-600 text-white border-teal-700 shadow-2xs"
                              : "opacity-0 group-hover/segment:opacity-100 focus-visible:opacity-100 bg-sky-100/95 hover:bg-sky-200 text-sky-900 border-sky-300/90 shadow-2xs"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-sky-700" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      )}
                    </h2>
                  );
                },
                h3: ({node, children, ...props}) => {
                  const isActive = isNodeMatchingActiveSpeech(children);
                  const segmentText = extractPlainText(children).trim();
                  const segmentKey = `h3-${node?.position?.start?.line ?? segmentText.slice(0, 24)}`;
                  const isCopied = copiedSegmentKey === segmentKey;
                  return (
                    <h3
                      data-active-speech-block={isActive ? "true" : undefined}
                      className={`group/segment relative pr-20 ${typographyClasses.h3} ${
                        isActive
                          ? `opacity-100 ${isDarkReader ? "bg-sky-950/85 ring-2 ring-sky-400" : "bg-sky-200/60 ring-2 ring-sky-400/80"} rounded-xl px-3 py-1.5 -mx-3 transition-all duration-200`
                          : speechStatus !== "idle"
                          ? "opacity-35 hover:opacity-80 transition-opacity duration-200"
                          : ""
                      }`}
                      {...props}
                    >
                      <span>{isActive ? highlightSpokenWordInChildren(children) : children}</span>
                      {segmentText.length > 0 && (
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(segmentText, segmentKey, false)}
                          aria-label={`Sao chép mục: ${segmentText}`}
                          title="Sao chép mục này vào bộ nhớ tạm"
                          className={`absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                            isCopied
                              ? "opacity-100 bg-teal-600 text-white border-teal-700 shadow-2xs"
                              : "opacity-0 group-hover/segment:opacity-100 focus-visible:opacity-100 bg-sky-100/95 hover:bg-sky-200 text-sky-900 border-sky-300/90 shadow-2xs"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-sky-700" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      )}
                    </h3>
                  );
                },
                p: ({node, children, ...props}) => {
                  const isActive = isNodeMatchingActiveSpeech(children);
                  const segmentText = extractPlainText(children).trim();
                  const segmentKey = `p-${node?.position?.start?.line ?? segmentText.slice(0, 24)}`;
                  const isCopied = copiedSegmentKey === segmentKey;
                  return (
                    <p
                      data-active-speech-block={isActive ? "true" : undefined}
                      className={`group/segment relative pr-10 ${typographyClasses.body} ${typographyClasses.pMargin} ${
                        isActive
                          ? `opacity-100 ${isDarkReader ? "bg-sky-950/85 ring-2 ring-sky-400" : "bg-sky-200/55 ring-2 ring-sky-400/80"} rounded-xl px-3 py-1.5 -mx-3 transition-all duration-200`
                          : speechStatus !== "idle"
                          ? "opacity-35 hover:opacity-80 transition-opacity duration-200"
                          : ""
                      }`}
                      {...props}
                    >
                      {isActive ? highlightSpokenWordInChildren(children) : children}
                      {segmentText.length > 0 && (
                        <span className="inline-flex items-center gap-1 ml-2 align-middle">
                          {speechSupported && (
                            <button
                              type="button"
                              onClick={() => handleSpeakFromSegmentText(segmentText)}
                              aria-label="Đọc thành tiếng đoạn văn này"
                              title="Nghe đọc thành tiếng từ đoạn văn này"
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                                isActive && speechStatus === "playing"
                                  ? "opacity-100 bg-indigo-600 text-white border-indigo-700 shadow-2xs"
                                  : "opacity-0 group-hover/segment:opacity-100 focus-visible:opacity-100 bg-indigo-50/95 hover:bg-indigo-100 text-indigo-900 border-indigo-300/90 shadow-2xs"
                              }`}
                            >
                              {isActive && speechStatus === "playing" ? (
                                <>
                                  <Pause className="w-3 h-3 fill-current" />
                                  <span>Đang đọc</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3 text-indigo-700" />
                                  <span>Nghe</span>
                                </>
                              )}
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(segmentText, segmentKey, false)}
                          aria-label="Sao chép đoạn văn này vào bộ nhớ tạm"
                          title="Sao chép đoạn văn này vào bộ nhớ tạm"
                          className={`ml-2 align-middle px-2 py-0.5 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                            isCopied
                              ? "opacity-100 bg-teal-600 text-white border-teal-700 shadow-2xs"
                              : "opacity-0 group-hover/segment:opacity-100 focus-visible:opacity-100 bg-sky-100/95 hover:bg-sky-200 text-sky-900 border-sky-300/90 shadow-2xs"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-sky-700" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                        </span>
                      )}
                    </p>
                  );
                },
                blockquote: ({node, children, ...props}) => {
                  const isActive = isNodeMatchingActiveSpeech(children);
                  const segmentText = extractPlainText(children).trim();
                  const segmentKey = `quote-${node?.position?.start?.line ?? segmentText.slice(0, 24)}`;
                  const isCopied = copiedSegmentKey === segmentKey;
                  return (
                    <blockquote
                      data-active-speech-block={isActive ? "true" : undefined}
                      className={`group/segment relative ${typographyClasses.blockquote} border-l-4 rounded-r-2xl font-medium italic shadow-2xs ${
                        isDarkReader
                          ? "bg-slate-900/95 border-sky-400 text-slate-100"
                          : "bg-sky-100/90 border-sky-500 text-sky-950"
                      } ${
                        isActive
                          ? "opacity-100 ring-2 ring-sky-400 transition-all duration-200"
                          : speechStatus !== "idle"
                          ? "opacity-35 hover:opacity-80 transition-opacity duration-200"
                          : ""
                      }`}
                      {...props}
                    >
                      {isActive ? highlightSpokenWordInChildren(children) : children}
                      {segmentText.length > 0 && (
                        <div className="mt-2 flex items-center justify-end gap-1.5 not-italic">
                          <button
                            type="button"
                            onClick={() => copyTextToClipboard(segmentText, segmentKey, false)}
                            aria-label="Sao chép khung ghi nhớ này"
                            title="Sao chép nội dung ghi nhớ vào bộ nhớ tạm"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                              isCopied
                                ? "bg-teal-600 text-white border-teal-700 shadow-2xs"
                                : "bg-sky-200/80 hover:bg-sky-300/90 text-sky-950 border-sky-300/90"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>Đã sao chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-sky-800" />
                                <span>Sao chép đoạn này</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </blockquote>
                  );
                },
                ul: ({node, ...props}) => <ul className={`list-disc pl-6 space-y-3 mb-6 ${typographyClasses.body}`} {...props} />,
                ol: ({node, ...props}) => <ol className={`list-decimal pl-6 space-y-3 mb-6 ${typographyClasses.body}`} {...props} />,
                li: ({node, children, ...props}) => {
                  const isActive = isNodeMatchingActiveSpeech(children);
                  const segmentText = extractPlainText(children).trim();
                  const segmentKey = `li-${node?.position?.start?.line ?? segmentText.slice(0, 24)}`;
                  const isCopied = copiedSegmentKey === segmentKey;
                  return (
                    <li
                      data-active-speech-block={isActive ? "true" : undefined}
                      className={`group/segment marker:text-sky-500 pl-1 ${typographyClasses.li} ${
                        isActive
                          ? `opacity-100 ${isDarkReader ? "bg-sky-950/85 ring-1 ring-sky-400" : "bg-sky-200/55 ring-1 ring-sky-400/80"} rounded-xl px-2.5 py-1 -mx-2 transition-all duration-200`
                          : speechStatus !== "idle"
                          ? "opacity-35 hover:opacity-80 transition-opacity duration-200"
                          : ""
                      }`}
                      {...props}
                    >
                      <span>{isActive ? highlightSpokenWordInChildren(children) : children}</span>
                      {segmentText.length > 0 && (
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(segmentText, segmentKey, false)}
                          aria-label="Sao chép ý này vào bộ nhớ tạm"
                          title="Sao chép ý này vào bộ nhớ tạm"
                          className={`ml-2 align-middle px-2 py-0.5 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                            isCopied
                              ? "opacity-100 bg-teal-600 text-white border-teal-700 shadow-2xs"
                              : "opacity-0 group-hover/segment:opacity-100 focus-visible:opacity-100 bg-sky-100/95 hover:bg-sky-200 text-sky-900 border-sky-300/90 shadow-2xs"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-sky-700" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      )}
                    </li>
                  );
                },
                table: ({node, ...props}) => (
                  <div className={`overflow-x-auto my-6 border rounded-2xl shadow-2xs ${isDarkReader ? "border-slate-700" : "border-sky-200"}`}>
                    <table className={`w-full text-left border-collapse text-sm ${isDarkReader ? "text-slate-200" : "text-slate-700"}`} {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => (
                  <thead
                    className={`font-bold border-b ${
                      isDarkReader ? "bg-slate-900 text-sky-200 border-slate-700" : "bg-sky-200/80 text-sky-950 border-sky-200"
                    }`}
                    {...props}
                  />
                ),
                th: ({node, ...props}) => <th className="p-3.5 font-semibold" {...props} />,
                td: ({node, ...props}) => (
                  <td className={`p-3.5 border-b ${isDarkReader ? "border-slate-800" : "border-sky-100"}`} {...props} />
                ),
                hr: ({node, ...props}) => (
                  <hr className={`border-t my-8 ${isDarkReader ? "border-slate-800" : "border-sky-200"}`} {...props} />
                ),
                code: ({node, ...props}) => (
                  <code
                    className={`font-mono text-xs px-2 py-1 rounded border ${
                      isDarkReader
                        ? "bg-slate-800/90 text-amber-200 border-slate-700"
                        : "bg-sky-200/80 text-sky-900 border-sky-300/80"
                    }`}
                    {...props}
                  />
                )
              }}
            >
              {normalizeMathInText(lesson.content)}
            </ReactMarkdown>
          </div>

          {/* End of Lesson Focus Footer */}
          <div
            className={`mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl transition-colors duration-200 ${
              isDarkReader
                ? "border-slate-800 bg-slate-900/90 text-slate-100"
                : "border-sky-200/80 bg-sky-100/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h5 className={`font-bold text-xs ${isDarkReader ? "text-sky-200" : "text-sky-950"}`}>Em đã đọc hết bài giảng này!</h5>
                <p className={`text-[11px] ${isDarkReader ? "text-slate-300" : "text-slate-600"}`}>Đánh dấu hoàn thành hoặc giải thử thách trắc nghiệm để ghi điểm nhé.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onToggleComplete(lesson.id)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  lesson.completed
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-sky-600 hover:bg-sky-700 text-white shadow-2xs"
                }`}
              >
                {lesson.completed ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành"}
              </button>
              <button
                onClick={() => onStartQuizFromLesson(lesson)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-sky-200 hover:bg-sky-300 text-sky-950 font-bold text-xs border border-sky-300 transition-colors cursor-pointer"
              >
                Làm kiểm tra
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: In Standard Mode only (Dims smoothly in Focus Mode until hovered/focused) */}
        {!isFocusMode && (
          <div className="lesson-focus-peripheral lesson-focus-peripheral-sidebar lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl p-5 flex flex-col justify-between min-h-[350px] bg-white border border-slate-200/90 shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-200/70">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900">Sổ tay ghi chép</h3>
                      <p className="text-[11px] text-slate-500">Ghi chú nhanh kiến thức tự học</p>
                    </div>
                  </div>
                  
                  {/* Visual save indicators */}
                  <div className="text-[11px] font-semibold">
                    {saveStatus === "saving" && (
                      <span className="text-blue-600 animate-pulse flex items-center gap-1">
                        Đang lưu...
                      </span>
                    )}
                    {saveStatus === "saved" && (
                      <span className="text-emerald-600 flex items-center gap-1">
                        ✓ Đã tự lưu!
                      </span>
                    )}
                    {saveStatus === "idle" && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Save className="w-3.5 h-3.5" /> Chờ nhập
                      </span>
                    )}
                  </div>
                </div>

                <textarea
                  placeholder="Hãy viết lại các công thức, từ khóa hoặc mẹo ghi nhớ vào đây. Ghi chú sẽ tự động được đồng bộ và lưu trữ an toàn..."
                  value={notes}
                  onChange={handleNotesChange}
                  rows={12}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:outline-none rounded-xl p-3 text-slate-900 text-xs leading-relaxed resize-none placeholder:text-slate-400 transition-all"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <Award className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Ghi chép chủ động giúp tăng khả năng ghi nhớ thêm 70%! Cố lên em nhé!</span>
              </div>
            </div>

            {/* AI Extra motivators card */}
            <div className="rounded-2xl p-4 text-center bg-white border border-slate-200/90 shadow-2xs">
              <span className="font-bold text-xs text-slate-900 block mb-1">Củng cố phản xạ sau bài đọc</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sau khi đọc xong lý thuyết, hãy bấm <strong>Làm bài kiểm tra</strong> để hệ thống tạo đề trắc nghiệm củng cố ngay kiến thức bài này nhé!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Sliding Notepad Drawer in Focus Mode */}
      {isFocusMode && showNotesDrawer && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-sky-100/98 backdrop-blur-xl border-l border-sky-300 shadow-2xl z-50 p-6 flex flex-col justify-between animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sky-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-200 flex items-center justify-center text-sky-700">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-sky-950">Ghi chú nhanh</h4>
                  <p className="text-[10px] text-slate-500">Tự động đồng bộ với bài học</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotesDrawer(false)}
                className="p-1.5 rounded-xl hover:bg-sky-200 text-slate-500 hover:text-sky-950 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              placeholder="Ghi chú nhanh công thức hoặc ý chính vào đây..."
              value={notes}
              onChange={handleNotesChange}
              rows={14}
              className="w-full bg-sky-50 border border-sky-300 focus:bg-white focus:border-sky-500 focus:outline-none rounded-xl p-3 text-sky-950 text-xs leading-relaxed resize-none shadow-inner"
            />
          </div>

          <div className="pt-4 border-t border-sky-200 flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-sky-800">
              {saveStatus === "saving" ? "Đang lưu..." : saveStatus === "saved" ? "✓ Đã tự lưu" : "Tự động lưu"}
            </span>
            <button
              onClick={() => setShowNotesDrawer(false)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
            >
              Xong
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal Xuất giáo án sang PDF / In Ấn */}
      {showExportModal && (
        <div className="fixed inset-0 bg-sky-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-sky-300 shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-800 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-sky-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs border border-emerald-200">
                  <FileDown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-sky-950">Xuất giáo án sang PDF</h3>
                  <p className="text-xs text-slate-500 font-medium">Tải về máy để học offline hoặc in ấn chuyên nghiệp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isExportingPdf) setShowExportModal(false);
                }}
                disabled={isExportingPdf}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lesson summary card */}
            <div className="bg-sky-50/80 rounded-2xl p-4 border border-sky-200/80 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-sky-200 text-sky-850">
                  {lesson.bookName}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800">
                  {lesson.grade}
                </span>
                <span className="ml-auto text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-600" /> ~{readingTimeMinutes} phút đọc
                </span>
              </div>
              <h4 className="font-display font-black text-sm text-sky-950 line-clamp-2">
                {lesson.title}
              </h4>
              {lesson.topic && (
                <p className="text-xs text-slate-600 font-medium">
                  Chủ đề: <span className="text-sky-900 font-semibold">{lesson.topic}</span>
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-sky-950 block uppercase tracking-wider">
                Tùy chọn tài liệu xuất:
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 transition-colors cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeCoverHeader}
                  onChange={(e) => setIncludeCoverHeader(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">
                  Đính kèm Tiêu đề SmartStudy và Quốc hiệu chuẩn A4
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 transition-colors cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeSummaryCard}
                  onChange={(e) => setIncludeSummaryCard(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">
                  Kèm khung Tóm tắt kiến thức và Khái niệm then chốt
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 transition-colors cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeNotesInExport}
                  onChange={(e) => setIncludeNotesInExport(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">
                  Kèm Sổ tay ghi chép cá nhân của học sinh {notes ? "(Đang có ghi chú)" : "(Khung ghi chú trống)"}
                </span>
              </label>
            </div>

            {/* Progress / Success notifications */}
            {isExportingPdf && (
              <div className="p-3 bg-sky-50 border border-sky-300 rounded-xl flex items-center gap-3 text-sky-900 text-xs font-semibold animate-pulse">
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin shrink-0" />
                <span>{exportPdfProgress || "Đang xử lý tài liệu PDF..."}</span>
              </div>
            )}

            {exportSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{exportSuccessMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-sky-100 flex flex-col sm:flex-row gap-3">
              {/* Primary: Direct Download PDF */}
              <button
                type="button"
                onClick={handleDownloadDirectPdf}
                disabled={isExportingPdf}
                className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tải tệp PDF (.pdf)</span>
                  </>
                )}
              </button>

              {/* Secondary: In ấn qua thư viện react-to-print */}
              <button
                type="button"
                onClick={handleTriggerPrint}
                disabled={isExportingPdf}
                className="px-4 py-3 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-extrabold text-xs border border-sky-300 shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                title="Mở hộp thoại in ấn của trình duyệt hoặc máy in"
              >
                <Printer className="w-4 h-4 text-sky-700" />
                <span>In A4 / lưu PDF bằng trình duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Offscreen Printable Document Container (Formatted strictly for A4 print and high-res PDF) */}
      <div 
        style={{ 
          position: "fixed", 
          left: "-9999px", 
          top: "-9999px", 
          width: "800px", 
          zIndex: -100, 
          pointerEvents: "none" 
        }}
        aria-hidden="true"
      >
        <div 
          ref={printableContentRef} 
          className="printable-lesson-container bg-white text-slate-900 p-10 font-sans leading-relaxed"
          style={{ width: "800px", minHeight: "1130px", background: "#ffffff" }}
        >
          {/* Header */}
          {includeCoverHeader && (
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex justify-between items-start text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                <div>
                  <p className="font-extrabold text-sky-900">SMARTSTUDY THCS</p>
                  <p className="text-[9px] text-slate-500">Giáo án và ôn tập theo chuẩn kiến thức</p>
                </div>
                <div className="text-right">
                  <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="text-[9px] text-slate-500 lowercase">Độc lập - Tự do - Hạnh phúc</p>
                </div>
              </div>

              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-700 mt-3 pt-2 border-t border-slate-200">
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                  Môn: {lesson.bookName}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                  Khối: {lesson.grade}
                </span>
                <span className="ml-auto text-slate-500 font-medium text-[10px]">
                  Ngày xuất: {new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
              </div>
            </div>
          )}

          {/* Lesson Title */}
          <div className="mb-6 text-center">
            <h1 className="font-display font-black text-2xl md:text-3xl text-slate-950 uppercase tracking-tight mb-2">
              {lesson.title}
            </h1>
            {lesson.topic && (
              <p className="text-sm font-bold text-sky-800">
                Chủ đề: {lesson.topic}
              </p>
            )}
          </div>

          {/* Summary Card */}
          {includeSummaryCard && (
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 mb-6 text-xs space-y-1.5 avoid-break-inside">
              <p className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                Mục tiêu Mục Tiêu và Khái Niệm Cốt Lõi: khái niệm cốt lõi:
              </p>
              <p className="text-slate-700 leading-relaxed">
                {lesson.topic ? `Nắm vững lý thuyết, phương pháp giải và các bài tập vận dụng liên quan đến "${lesson.topic}".` : "Ôn luyện kiến thức bài giảng, ghi nhớ quy tắc và áp dụng giải bài tập."}
              </p>
            </div>
          )}

          {/* Main Markdown Content formatted for print */}
          <div className="prose max-w-none text-slate-800 text-[13px] leading-relaxed space-y-4">
            <ReactMarkdown
              remarkPlugins={mathRemarkPlugins}
              rehypePlugins={mathRehypePlugins}
              components={{
                h1: ({node, ...props}) => <h2 className="text-xl font-black text-slate-950 mt-6 mb-3 border-b pb-1 avoid-break-inside" {...props} />,
                h2: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-900 mt-5 mb-2 avoid-break-inside" {...props} />,
                h3: ({node, ...props}) => <h4 className="text-base font-bold text-slate-800 mt-4 mb-2 avoid-break-inside" {...props} />,
                p: ({node, ...props}) => <p className="mb-3 text-justify" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-1.5 mb-3" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-1.5 mb-3" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-slate-400 bg-slate-50 p-3 my-3 text-slate-800 italic rounded-r avoid-break-inside" {...props} />
                ),
                table: ({node, ...props}) => (
                  <div className="my-4 avoid-break-inside">
                    <table className="w-full border-collapse border border-slate-300 text-xs" {...props} />
                  </div>
                ),
                th: ({node, ...props}) => <th className="border border-slate-300 bg-slate-100 p-2 font-bold text-slate-900" {...props} />,
                td: ({node, ...props}) => <td className="border border-slate-300 p-2" {...props} />,
                code: ({node, ...props}) => (
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-200" {...props} />
                )
              }}
            >
              {normalizeMathInText(lesson.content)}
            </ReactMarkdown>
          </div>

          {/* Student Notes Section */}
          {includeNotesInExport && (
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-300 avoid-break-inside">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Sổ tay ghi chép của học sinh:
                </h4>
                <span className="text-[10px] text-slate-500 italic">SmartStudy THCS</span>
              </div>
              {notes ? (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {notes}
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-xs text-slate-400">
                  (Chưa có ghi chú cá nhân - Học sinh có thể dùng khoảng trống này để ghi chép tay khi in bài)
                  <div className="border-b border-slate-200 my-4"></div>
                  <div className="border-b border-slate-200 my-4"></div>
                </div>
              )}
            </div>
          )}

          {/* Document Footer */}
          <div className="mt-10 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 avoid-break-inside">
            <p>SmartStudy • Tài liệu học tập và ôn luyện Offline • Chúc bạn đạt kết quả xuất sắc!</p>
            <p>Mã bài học: #{lesson.id.substring(0, 8)}</p>
          </div>
        </div>
      </div>

      {/* Floating Follow-Along TTS Mini Player Dock when listening & scrolling */}
      {speechStatus !== "idle" &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="region"
            aria-label="Trình điều khiển đọc bài học đang phát"
            style={{ zIndex: 9990 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(94vw,680px)] pointer-events-auto"
          >
            <div
              className={`rounded-2xl border shadow-2xl px-4 py-3 backdrop-blur-md transition-all ${
                isDarkReader
                  ? "bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-black/70"
                  : "bg-white/95 border-indigo-200/90 text-slate-900 shadow-indigo-950/20"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={handleToggleSpeech}
                    aria-label={speechStatus === "playing" ? "Tạm dừng đọc" : "Tiếp tục đọc"}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      speechStatus === "playing"
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                    }`}
                  >
                    {speechStatus === "playing" ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Tạm dừng</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tiếp tục</span>
                      </>
                    )}
                  </button>

                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepSpeechChunk(-1)}
                      disabled={currentChunkIdx === 0}
                      aria-label="Đọc câu trước"
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 ${
                        isDarkReader
                          ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                          : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-black px-1.5 num">
                      Câu {currentChunkIdx + 1}/{speechChunks.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepSpeechChunk(1)}
                      disabled={currentChunkIdx >= speechChunks.length - 1}
                      aria-label="Đọc câu tiếp theo"
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 ${
                        isDarkReader
                          ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                          : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={handleCycleSpeechRate}
                    title="Đổi tốc độ đọc (0.5x / 1x / 1.5x / 2x)"
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer num ${
                      isDarkReader
                        ? "bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700"
                        : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    Tốc độ {speechRate}x
                  </button>
                  <button
                    type="button"
                    onClick={stopSpeechPlayback}
                    title="Dừng đọc bài học"
                    aria-label="Dừng đọc bài học"
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border inline-flex items-center gap-1 cursor-pointer ${
                      isDarkReader
                        ? "bg-rose-950/60 border-rose-800/70 text-rose-300 hover:bg-rose-900/60"
                        : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Dừng</span>
                  </button>
                </div>
              </div>

              {/* Live Follow-Along Sentence Preview */}
              <div
                className={`px-3 py-2 rounded-xl border text-xs leading-relaxed max-h-20 overflow-y-auto ${
                  isDarkReader
                    ? "bg-slate-950/90 border-slate-800 text-slate-200"
                    : "bg-sky-50/90 border-sky-200/80 text-slate-800"
                }`}
              >
                {activeChunkWordTokens.map((token, idx) => {
                  const isCurrentWord = idx === activeWordIdx;
                  return (
                    <React.Fragment key={`dock-${idx}-${token.start}`}>
                      <span
                        className={`inline-block rounded px-1 py-0.5 transition-all duration-150 ${
                          isCurrentWord
                            ? "bg-amber-300 text-slate-950 font-black underline decoration-indigo-700 decoration-2 underline-offset-2"
                            : ""
                        }`}
                      >
                        {token.word}
                      </span>{" "}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* LessonReader Share & QR Code Popover Portal */}
      {sharePopoverState.open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{ zIndex: 9998 }}
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-[2px] flex items-center justify-center p-4"
          >
            <div
              ref={sharePopoverRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Chia sẻ bài học và Mã QR: ${lesson.title}`}
              style={{
                animation: "aiDictEnterBottom 180ms cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
              className={`w-full max-w-[390px] rounded-3xl border shadow-2xl overflow-hidden ${
                isDarkReader
                  ? "bg-slate-900 border-indigo-500/40 text-slate-100 shadow-black/80"
                  : "bg-white border-sky-200/95 text-slate-900 shadow-indigo-950/25"
              }`}
            >
              {/* Popover Header */}
              <div
                className={`px-4 py-3.5 border-b flex items-center justify-between gap-2 ${
                  isDarkReader
                    ? "bg-slate-950/70 border-slate-800"
                    : "bg-gradient-to-r from-sky-50 via-indigo-50/70 to-white border-sky-100"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl ss-grad-brand-br text-white flex items-center justify-center shrink-0 shadow-xs">
                    <QrCode className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                      Chia sẻ học tập và Mã QR
                    </span>
                    <h3
                      className={`text-xs sm:text-sm font-black truncate ${
                        isDarkReader ? "text-white" : "text-slate-950"
                      }`}
                      title={lesson.title}
                    >
                      {lesson.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSharePopoverState((prev) => ({ ...prev, open: false }))
                  }
                  aria-label="Đóng cửa sổ chia sẻ QR"
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                    isDarkReader
                      ? "text-slate-400 hover:text-white hover:bg-slate-800"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Popover Content via Reusable LessonQRCode */}
              <div className="p-4">
                <LessonQRCode
                  lessonId={String(lesson.id)}
                  lessonTitle={lesson.title}
                  bookName={lesson.bookName}
                  grade={lesson.grade}
                  shareUrl={sharePopoverState.shareUrl}
                  markerTag={sharePopoverState.markerTag}
                  isDark={isDarkReader}
                  onCopySuccess={() => {
                    setCopyFeedbackMessage(
                      `Đã sao chép liên kết chia sẻ bài học "${lesson.title}"`
                    );
                    if (copyFeedbackTimerRef.current !== null) {
                      window.clearTimeout(copyFeedbackTimerRef.current);
                    }
                    copyFeedbackTimerRef.current = window.setTimeout(() => {
                      setCopyFeedbackMessage(null);
                      copyFeedbackTimerRef.current = null;
                    }, 2400);
                  }}
                  onDownloadSuccess={() => {
                    setCopyFeedbackMessage(
                      `Đã tải thẻ mã QR (.png) của bài "${lesson.title}"`
                    );
                    if (copyFeedbackTimerRef.current !== null) {
                      window.clearTimeout(copyFeedbackTimerRef.current);
                    }
                    copyFeedbackTimerRef.current = window.setTimeout(() => {
                      setCopyFeedbackMessage(null);
                      copyFeedbackTimerRef.current = null;
                    }, 2400);
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Keyframes for AI Dictionary & Popover Entrance Animation (180ms fade-in + subtle scale-up 0.95 -> 1.0) */}
      <style>{`
        @keyframes aiDictEnterTop {
          0% {
            opacity: 0;
            transform: translateY(4px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes aiDictEnterBottom {
          0% {
            opacity: 0;
            transform: translateY(-4px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes aiDictContentFade {
          0% {
            opacity: 0;
            transform: scale(0.98);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .ai-dict-popover-enter-top {
          transform-origin: bottom center;
          animation: aiDictEnterTop 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        .ai-dict-popover-enter-bottom {
          transform-origin: top center;
          animation: aiDictEnterBottom 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        .ai-dict-body-fade {
          animation: aiDictContentFade 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .ai-dict-popover-enter-top,
          .ai-dict-popover-enter-bottom,
          .ai-dict-body-fade {
            animation-duration: 120ms;
            transform: none !important;
          }
        }
      `}</style>

      {/* Floating AI Dictionary Tooltip Popover */}
      {aiDictState.open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={aiDictTooltipRef}
            role="dialog"
            aria-label={`Từ điển AI: ${aiDictState.word}`}
            style={{
              position: "fixed",
              left: `${aiDictState.x}px`,
              top: `${aiDictState.y}px`,
              transform:
                aiDictState.placement === "top"
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0)",
              zIndex: 9999,
            }}
            className="w-[340px] sm:w-[376px] max-w-[calc(100vw-24px)] pointer-events-auto"
          >
            <div
              key={`${aiDictState.word}-${aiDictState.placement}`}
              style={{
                transformOrigin:
                  aiDictState.placement === "top"
                    ? "bottom center"
                    : "top center",
                animation: `${
                  aiDictState.placement === "top"
                    ? "aiDictEnterTop"
                    : "aiDictEnterBottom"
                } 180ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                willChange: "transform, opacity",
              }}
              className={`${
                aiDictState.placement === "top"
                  ? "ai-dict-popover-enter-top"
                  : "ai-dict-popover-enter-bottom"
              } rounded-2xl border shadow-2xl ${
                isDarkReader
                  ? "bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-black/70"
                  : "bg-white/98 border-indigo-200/90 text-slate-800 shadow-indigo-950/20"
              } backdrop-blur-md overflow-hidden`}
            >
            {/* Header */}
            <div
              className={`px-3.5 py-2.5 border-b flex items-center justify-between gap-2 ${
                isDarkReader
                  ? "bg-indigo-950/60 border-slate-800"
                  : "bg-gradient-to-r from-indigo-50/90 via-violet-50/70 to-white border-indigo-100"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Từ điển AI
                    </span>
                    {aiDictState.data?.partOfSpeechOrType && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate ${
                          isDarkReader
                            ? "bg-slate-800 text-indigo-300 border border-slate-700"
                            : "bg-indigo-100/80 text-indigo-700"
                        }`}
                      >
                        {aiDictState.data.partOfSpeechOrType}
                      </span>
                    )}
                  </div>
                  <h4
                    className={`text-sm font-black truncate ${
                      isDarkReader ? "text-white" : "text-slate-900"
                    }`}
                    title={aiDictState.data?.term || aiDictState.word}
                  >
                    {aiDictState.data?.term || aiDictState.word}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const term = aiDictState.data?.term || aiDictState.word;
                    stopSpeechPlayback();
                    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(aiDictState.word)) void speakVi(term);
                    else void speakEnglish(term);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDarkReader
                      ? "text-slate-400 hover:text-indigo-300 hover:bg-slate-800"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                  title="Nghe phát âm thuật ngữ"
                  aria-label="Nghe phát âm thuật ngữ"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAiDictState((prev) => ({ ...prev, open: false }))
                  }
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDarkReader
                      ? "text-slate-400 hover:text-white hover:bg-slate-800"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Đóng Từ điển AI (Esc)"
                  aria-label="Đóng Từ điển AI"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-3.5 space-y-2.5 text-xs leading-relaxed">
              {aiDictState.loading ? (
                <div className="py-4 flex flex-col items-center justify-center gap-2 text-center ai-dict-body-fade">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <p
                    className={`text-xs font-semibold ${
                      isDarkReader ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    AI đang giải nghĩa{" "}
                    <span className="font-bold text-indigo-500">
                      “{aiDictState.word}”
                    </span>{" "}
                    theo ngữ cảnh bài học...
                  </p>
                </div>
              ) : aiDictState.error ? (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 flex items-center justify-between gap-2 ai-dict-body-fade">
                  <span>{aiDictState.error}</span>
                  <button
                    type="button"
                    onClick={() =>
                      lookupAIDictionary(aiDictState.word, aiDictState.contextText)
                    }
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] shrink-0 hover:bg-rose-700 cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                aiDictState.data && (
                  <div className="space-y-2.5 ai-dict-body-fade">
                    <div>
                      <span
                        className={`block text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
                          isDarkReader ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Định nghĩa nhanh
                      </span>
                      <p
                        className={`font-semibold ${
                          isDarkReader ? "text-slate-100" : "text-slate-800"
                        }`}
                      >
                        {aiDictState.data.shortDefinition}
                      </p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border ${
                        isDarkReader
                          ? "bg-indigo-950/40 border-indigo-800/50 text-indigo-100"
                          : "bg-indigo-50/70 border-indigo-100 text-slate-700"
                      }`}
                    >
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">
                        Giải thích theo ngữ cảnh bài học
                      </span>
                      <p className="text-[11.5px] leading-relaxed">
                        {aiDictState.data.contextExplanation}
                      </p>
                    </div>

                    {aiDictState.data.exampleOrFormula && (
                      <div
                        className={`px-2.5 py-2 rounded-lg border text-[11px] ${
                          isDarkReader
                            ? "bg-slate-800/70 border-slate-700 text-amber-300"
                            : "bg-amber-50/70 border-amber-200/80 text-amber-900"
                        }`}
                      >
                        <span className="font-extrabold">Ví dụ / Ghi nhớ: </span>
                        <span>{aiDictState.data.exampleOrFormula}</span>
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!aiDictState.data) return;
                          const formattedNote = `[Từ điển AI] ${aiDictState.data.term}: ${aiDictState.data.shortDefinition} — Ngữ cảnh: ${aiDictState.data.contextExplanation}`;
                          copyTextToClipboard(
                            formattedNote,
                            "ai-dict-note",
                            true
                          );
                          setAiDictState((prev) => ({
                            ...prev,
                            savedToNote: true,
                          }));
                        }}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          aiDictState.savedToNote
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {aiDictState.savedToNote ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Đã lưu vào Ghi chú
                          </>
                        ) : (
                          <>
                            <PenTool className="w-3.5 h-3.5" />
                            Lưu vào Ghi chú
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!aiDictState.data) return;
                          const copyStr = `${aiDictState.data.term}: ${aiDictState.data.shortDefinition} (${aiDictState.data.contextExplanation})`;
                          copyTextToClipboard(
                            copyStr,
                            "ai-dict-copy",
                            false
                          );
                          setAiDictState((prev) => ({
                            ...prev,
                            copiedDef: true,
                          }));
                        }}
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          aiDictState.copiedDef
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300"
                            : isDarkReader
                              ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {aiDictState.copiedDef ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Đã chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Sao chép
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
