import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, CheckCircle2, GraduationCap, StickyNote, Moon, Sun, BookOpen, Layers, LayoutDashboard, Volume2, Play, AlertCircle } from "lucide-react";

export interface VoiceCommandOverlayProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  isDarkMode: boolean;
  onOpenQuiz: () => void;
  onSaveNote: (customNoteText?: string) => void;
  onSwitchDarkMode: (enableDark?: boolean) => void;
  onNavigateTab: (tabId: string) => void;
  quickNoteDraft?: string;
}

interface VoiceCommandDefinition {
  id: string;
  titleEn: string;
  titleVi: string;
  description: string;
  samplePhrases: string[];
  keywords: string[];
  badgeColor: string;
  icon: React.ReactNode;
  execute: (spokenTranscript?: string) => string;
}

export default function VoiceCommandOverlay({
  isOpen,
  onToggleOpen,
  onClose,
  isDarkMode,
  onOpenQuiz,
  onSaveNote,
  onSwitchDarkMode,
  onNavigateTab,
  quickNoteDraft = "",
}: VoiceCommandOverlayProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognitionLang, setRecognitionLang] = useState<"en-US" | "vi-VN">("en-US");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [matchedCommandId, setMatchedCommandId] = useState<string | null>(null);
  const [executionFeedback, setExecutionFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayContainerRef = useRef<HTMLDivElement>(null);

  const isSpeechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const normalizeCommandText = (raw: string): string =>
    raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const commands: VoiceCommandDefinition[] = [
    {
      id: "open-quiz",
      titleEn: "Open Quiz",
      titleVi: "Mở Trắc nghiệm",
      description: "Chuyển ngay sang Đấu trường Luyện đề Trắc nghiệm",
      samplePhrases: ['"Open Quiz"', '"Mở trắc nghiệm"', '"Làm kiểm tra"'],
      keywords: [
        "open quiz",
        "start quiz",
        "quiz",
        "mo trac nghiem",
        "lam kiem tra",
        "lam trac nghiem",
        "kiem tra",
      ],
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: <GraduationCap className="w-4 h-4 text-indigo-600" />,
      execute: () => {
        onOpenQuiz();
        return "Đã thực thi lệnh: Open Quiz (Mở Luyện đề Trắc nghiệm)";
      },
    },
    {
      id: "save-note",
      titleEn: "Save Note",
      titleVi: "Lưu Ghi chú",
      description: quickNoteDraft.trim()
        ? "Lưu ngay bản nháp ghi chú nhanh hiện tại vào sổ tay"
        : "Lưu ghi chú nhanh hoặc mở bảng Ghi chú học tập",
      samplePhrases: ['"Save Note"', '"Lưu ghi chú"', '"Save note: công thức..."'],
      keywords: [
        "save note",
        "save notes",
        "take note",
        "luu ghi chu",
        "ghi chu nhanh",
        "luu so tay",
      ],
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <StickyNote className="w-4 h-4 text-amber-600" />,
      execute: (spoken?: string) => {
        let extractedBody = "";
        if (spoken) {
          const cleaned = spoken
            .replace(/^(save\s+notes?|take\s+a?\s*note|lưu\s+ghi\s+chú|ghi\s+chú\s+nhanh)[:\s,-]*/i, "")
            .trim();
          if (cleaned && cleaned.toLowerCase() !== spoken.toLowerCase().trim()) {
            extractedBody = cleaned;
          }
        }
        onSaveNote(extractedBody || undefined);
        return "Đã thực thi lệnh: Save Note (Lưu Ghi chú học tập)";
      },
    },
    {
      id: "switch-dark-mode",
      titleEn: "Switch to Dark Mode",
      titleVi: isDarkMode ? "Chuyển Chế độ Sáng / Tối" : "Bật Chế độ Tối",
      description: "Chuyển đổi giao diện Đọc và Học tập Ban đêm bảo vệ mắt",
      samplePhrases: ['"Switch to Dark Mode"', '"Dark Mode"', '"Chế độ tối"'],
      keywords: [
        "switch to dark mode",
        "dark mode",
        "enable dark mode",
        "night mode",
        "che do toi",
        "giao dien toi",
        "bat che do toi",
      ],
      badgeColor: "bg-slate-800 text-amber-300 border-slate-700",
      icon: isDarkMode ? (
        <Sun className="w-4 h-4 text-amber-500" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      ),
      execute: (spoken?: string) => {
        const norm = normalizeCommandText(spoken || "");
        if (norm.includes("light mode") || norm.includes("che do sang")) {
          onSwitchDarkMode(false);
          return "Đã thực thi lệnh: Switch to Light Mode (Chế độ Sáng)";
        }
        if (norm.includes("dark mode") || norm.includes("che do toi")) {
          onSwitchDarkMode(true);
          return "Đã thực thi lệnh: Switch to Dark Mode (Bật Chế độ Tối)";
        }
        onSwitchDarkMode(!isDarkMode);
        return !isDarkMode
          ? "Đã thực thi lệnh: Switch to Dark Mode (Bật Chế độ Tối)"
          : "Đã chuyển về Chế độ Sáng tiêu chuẩn";
      },
    },
    {
      id: "open-library",
      titleEn: "Open Lesson Library",
      titleVi: "Mở Thư viện Bài học",
      description: "Mở kho bài giảng SGK và trình đọc bài học thông minh",
      samplePhrases: ['"Open Library"', '"Open Lesson"', '"Mở bài học"'],
      keywords: [
        "open library",
        "open lesson",
        "open lessons",
        "mo thu vien",
        "mo bai hoc",
        "thu vien bai hoc",
      ],
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
      icon: <BookOpen className="w-4 h-4 text-sky-600" />,
      execute: () => {
        onNavigateTab("review");
        return "Đã thực thi lệnh: Open Lesson Library (Mở Thư viện Bài học)";
      },
    },
    {
      id: "open-flashcards",
      titleEn: "Open Flashcards",
      titleVi: "Mở Thẻ nhớ Flashcard",
      description: "Ôn tập từ vựng và công thức theo phương pháp lặp lại ngắt quãng",
      samplePhrases: ['"Open Flashcards"', '"Flashcards"', '"Mở thẻ nhớ"'],
      keywords: [
        "open flashcards",
        "open flashcard",
        "flashcards",
        "flashcard",
        "mo the nho",
      ],
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <Layers className="w-4 h-4 text-emerald-600" />,
      execute: () => {
        onNavigateTab("flashcards");
        return "Đã thực thi lệnh: Open Flashcards (Mở Thẻ nhớ)";
      },
    },
    {
      id: "open-dashboard",
      titleEn: "Go to Dashboard",
      titleVi: "Về Trang chủ",
      description: "Quay về bảng tổng quan tiến độ học tập và nhiệm vụ ngày",
      samplePhrases: ['"Go to Dashboard"', '"Open Home"', '"Về trang chủ"'],
      keywords: [
        "go to dashboard",
        "open dashboard",
        "open home",
        "ve trang chu",
        "trang chu",
      ],
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      icon: <LayoutDashboard className="w-4 h-4 text-purple-600" />,
      execute: () => {
        onNavigateTab("dashboard");
        return "Đã thực thi lệnh: Go to Dashboard (Về Trang chủ)";
      },
    },
  ];

  const triggerCommandExecution = useCallback(
    (cmd: VoiceCommandDefinition, rawSpokenText?: string) => {
      const feedbackMsg = cmd.execute(rawSpokenText);
      setMatchedCommandId(cmd.id);
      setExecutionFeedback(feedbackMsg);

      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = setTimeout(() => {
        setMatchedCommandId(null);
        setExecutionFeedback(null);
      }, 3500);
    },
    [isDarkMode, onOpenQuiz, onSaveNote, onSwitchDarkMode, onNavigateTab, quickNoteDraft]
  );

  const evaluateSpokenTranscript = useCallback(
    (spokenText: string) => {
      const norm = normalizeCommandText(spokenText);
      if (!norm) return false;

      if (norm.includes("light mode") || norm.includes("che do sang")) {
        const darkCmd = commands.find((c) => c.id === "switch-dark-mode");
        if (darkCmd) {
          triggerCommandExecution(darkCmd, spokenText);
          return true;
        }
      }

      for (const cmd of commands) {
        const matched = cmd.keywords.some((kw) => norm.includes(kw));
        if (matched) {
          triggerCommandExecution(cmd, spokenText);
          return true;
        }
      }
      return false;
    },
    [commands, triggerCommandExecution]
  );

  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startVoiceRecognition = useCallback(
    (langOverride?: "en-US" | "vi-VN") => {
      setVoiceError(null);
      if (!isSpeechSupported) {
        setVoiceError(
          "Trình duyệt hiện tại chưa hỗ trợ Web Speech API. Em có thể nhấn trực tiếp vào các lệnh bên dưới để thực thi ngay!"
        );
        return;
      }

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
          } catch {}
        }

        const SpeechRecognitionCtor =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognitionCtor();
        recognitionRef.current = recognition;

        recognition.lang = langOverride || recognitionLang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
          setInterimTranscript("");
          setVoiceError(null);
        };

        recognition.onresult = (event: any) => {
          let finalTranscriptChunk = "";
          let interimChunk = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const text = res[0]?.transcript || "";
            if (res.isFinal) {
              finalTranscriptChunk += text;
            } else {
              interimChunk += text;
            }
          }

          if (interimChunk) {
            setInterimTranscript(interimChunk);
          }

          if (finalTranscriptChunk.trim()) {
            const cleanFinal = finalTranscriptChunk.trim();
            setLastTranscript(cleanFinal);
            setInterimTranscript("");
            const didMatch = evaluateSpokenTranscript(cleanFinal);
            if (!didMatch) {
              setExecutionFeedback(
                `Đã nghe: "${cleanFinal}" — Hãy thử đọc "Open Quiz", "Save Note" hoặc "Switch to Dark Mode".`
              );
            }
          }
        };

        recognition.onerror = (event: any) => {
          const code = event?.error;
          if (code === "not-allowed" || code === "service-not-allowed") {
            setVoiceError(
              "Chưa cấp quyền Micro trên trình duyệt. Hãy cấp quyền Micro hoặc nhấn chọn lệnh trực tiếp bên dưới."
            );
          } else if (code === "no-speech") {
            setVoiceError("Chưa nhận được giọng nói. Hãy nhấn Bật Micro và đọc to câu lệnh nhé!");
          } else if (code !== "aborted") {
            setVoiceError("Tạm dừng lắng nghe giọng nói. Nhấn Bật Micro để thử lại.");
          }
          setIsListening(false);
          setInterimTranscript("");
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript("");
        };

        recognition.start();
      } catch {
        setVoiceError("Không thể khởi động Micro. Vui lòng kiểm tra thiết bị thu âm.");
        setIsListening(false);
      }
    },
    [isSpeechSupported, recognitionLang, evaluateSpokenTranscript]
  );

  const handleToggleListening = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  // Stop recognition when overlay closes or unmounts
  useEffect(() => {
    if (!isOpen && isListening) {
      stopVoiceRecognition();
    }
  }, [isOpen, isListening, stopVoiceRecognition]);

  useEffect(() => {
    return () => {
      stopVoiceRecognition();
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [stopVoiceRecognition]);

  // Close overlay when clicking outside or pressing Escape, and toggle with Alt+V
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        onToggleOpen();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggleOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        overlayContainerRef.current &&
        !overlayContainerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={overlayContainerRef} className="relative shrink-0 self-center">
      {/* Main Header Trigger Button */}
      <button
        type="button"
        data-nav-button="voice-commands"
        aria-label="Điều khiển bằng giọng nói - Voice Commands (Alt+V)"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={onToggleOpen}
        title="Bật bảng Điều khiển giọng nói (Open Quiz, Save Note, Switch to Dark Mode)"
        className={`group relative h-9 sm:h-10 min-w-[36px] sm:min-w-[40px] px-2.5 sm:px-3 rounded-2xl backdrop-blur-md text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer border shrink-0 touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          isListening
            ? "bg-gradient-to-b from-rose-500 to-rose-600 text-white border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.55)] ring-2 ring-rose-300 z-50"
            : isOpen
            ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white border-blue-300 scale-105 -translate-y-[1.5px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_0_24px_rgba(59,130,246,0.6)] ring-2 ring-blue-300/80 z-50"
            : "bg-white/80 text-slate-700 border-white/90 ring-1 ring-slate-900/[0.05] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_6px_-1px_rgba(15,23,42,0.05)] hover:bg-white hover:text-blue-700 hover:border-blue-300/80 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_0_18px_rgba(59,130,246,0.34)]"
        }`}
      >
        {isListening ? (
          <Mic className="w-4 h-4 shrink-0 animate-pulse text-white" />
        ) : (
          <Mic className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 text-blue-600 group-hover:text-blue-700" />
        )}
        <span className="hidden xl:inline whitespace-nowrap">Voice Cmd</span>
        {isListening && (
          <span
            className="w-2 h-2 rounded-full bg-white animate-ping shrink-0"
            title="Đang lắng nghe lệnh giọng nói..."
          />
        )}
      </button>

      {/* Voice Command Overlay Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Bảng điều khiển lệnh giọng nói (Voice Command Overlay)"
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-[420px] rounded-3xl bg-white/98 backdrop-blur-2xl border border-sky-200/95 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.32),inset_0_1px_1px_rgba(255,255,255,0.95)] p-4 z-50 space-y-3.5 animate-fade-in text-slate-800"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-sky-100">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
                  isListening
                    ? "bg-gradient-to-br from-rose-500 to-amber-500 text-white"
                    : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                }`}
              >
                <Mic className={`w-4 h-4 ${isListening ? "animate-bounce" : ""}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Voice Command Overlay
                  </h3>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                    Alt+V
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  Ra lệnh bằng giọng nói (EN/VI) hoặc chạm để thực thi nhanh
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng lệnh giọng nói"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Microphone Listener Control Bar */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              isListening
                ? "bg-gradient-to-r from-rose-50 via-amber-50/70 to-sky-50 border-rose-300 shadow-xs"
                : "bg-sky-50/80 border-sky-200/90"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  aria-pressed={isListening}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isListening
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Dừng nghe</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Bật Micro nghe lệnh</span>
                    </>
                  )}
                </button>

                {/* Language Switcher for Speech Recognition */}
                <div
                  className="inline-flex items-center bg-white/90 p-0.5 rounded-xl border border-sky-200 text-[11px] font-extrabold"
                  role="group"
                  aria-label="Ngôn ngữ nhận diện giọng nói"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setRecognitionLang("en-US");
                      if (isListening) startVoiceRecognition("en-US");
                    }}
                    className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                      recognitionLang === "en-US"
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Nhận diện khẩu lệnh Tiếng Anh (Open Quiz, Save Note...)"
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecognitionLang("vi-VN");
                      if (isListening) startVoiceRecognition("vi-VN");
                    }}
                    className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                      recognitionLang === "vi-VN"
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Nhận diện khẩu lệnh Tiếng Việt (Mở trắc nghiệm, Lưu ghi chú...)"
                  >
                    VI
                  </button>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold flex items-center gap-1 ${
                  isListening ? "text-rose-600" : "text-slate-500"
                }`}
              >
                <Volume2 className={`w-3.5 h-3.5 ${isListening ? "animate-pulse" : ""}`} />
                <span>{isListening ? "Đang lắng nghe..." : "Sẵn sàng"}</span>
              </span>
            </div>

            {/* Live Transcript / Status Preview */}
            {(isListening || interimTranscript || lastTranscript) && (
              <div
                aria-live="polite"
                className="mt-2.5 px-3 py-2 rounded-xl bg-white/95 border border-sky-200/80 text-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0 truncate">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1.5">
                    Khẩu lệnh:
                  </span>
                  <span className="font-bold text-slate-800">
                    {interimTranscript || lastTranscript || "Hãy đọc một khẩu lệnh bên dưới..."}
                  </span>
                </div>
              </div>
            )}

            {/* Execution Confirmation Banner */}
            {executionFeedback && (
              <div
                role="status"
                aria-live="polite"
                className="mt-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-extrabold flex items-center gap-2 animate-fade-in"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="leading-snug">{executionFeedback}</span>
              </div>
            )}

            {/* Error Banner */}
            {voiceError && (
              <div
                role="alert"
                className="mt-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="leading-snug">{voiceError}</span>
              </div>
            )}
          </div>

          {/* Common Voice Commands List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Mic className="w-3 h-3 text-blue-600" />
                <span>Các câu lệnh giọng nói hay dùng</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Nói hoặc nhấn chọn
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[290px] overflow-y-auto pr-0.5">
              {commands.map((cmd) => {
                const isMatched = matchedCommandId === cmd.id;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => triggerCommandExecution(cmd, cmd.titleEn)}
                    className={`w-full text-left p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                      isMatched
                        ? "bg-emerald-50/95 border-emerald-400 ring-2 ring-emerald-300/70 shadow-xs"
                        : "bg-slate-50/80 hover:bg-sky-50/90 border-slate-200/90 hover:border-sky-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {cmd.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-900">
                            "{cmd.titleEn}"
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${cmd.badgeColor}`}
                          >
                            {cmd.titleVi}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {cmd.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {cmd.samplePhrases.map((phrase) => (
                            <span
                              key={phrase}
                              className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200/80 text-slate-600"
                            >
                              {phrase}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1.5 rounded-xl bg-white group-hover:bg-blue-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-blue-600 text-[11px] font-extrabold inline-flex items-center gap-1 shrink-0 transition-colors shadow-2xs">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Chạy</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
