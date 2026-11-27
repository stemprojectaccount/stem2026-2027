import React, { useState, useRef, useEffect } from "react";
import { 
  Headphones, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  Heart, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Plus, 
  X, 
  Volume2, 
  Award, 
  Search, 
  Lightbulb,
  TrendingUp,
  Target,
  MessageSquare,
  GraduationCap
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";
import { Lesson, PodcastEpisode, UserProgress } from "../types";
import { usePodcast } from "../context/PodcastContext";
import { WisdomCoinIcon } from "./CustomMascots";

interface PodcastPageProps {
  lessons: Lesson[];
  progress: UserProgress;
  onUpdateProgress: (updated: Partial<UserProgress>) => void;
  triggerSuccessMessage?: (msg: string) => void;
}

export { renderTextWithMath } from "../lib/renderTextWithMath";
import { renderTextWithMath } from "../lib/renderTextWithMath";

export default function PodcastPage({
  lessons,
  progress,
  onUpdateProgress,
  triggerSuccessMessage
}: PodcastPageProps) {
  const {
    episodes,
    currentEpisode,
    isPlaying,
    currentLineIndex,
    playbackSpeed,
    hasSpeechSupport,
    hasVietnameseVoice,
    listeningHistory30Days,
    totalCumulativeMinutes30Days,
    monthlyListeningGoalMinutes,
    playEpisode,
    pauseEpisode,
    resumeEpisode,
    togglePlayPause,
    seekToLine,
    skipNextLine,
    skipPreviousLine,
    setSpeed,
    addEpisode,
    deleteEpisode,
    toggleFavorite,
    markEpisodeCompleted,
    setMonthlyListeningGoalMinutes
  } = usePodcast();

  const [listeningChartMode, setListeningChartMode] = useState<"cumulative" | "daily">("cumulative");
  const cumulativeProgressPct = Math.min(
    100,
    Math.round((totalCumulativeMinutes30Days / Math.max(1, monthlyListeningGoalMinutes)) * 100)
  );
  const activeListeningDaysCount = listeningHistory30Days.filter((d) => d.dailyMinutes > 0).length;
  const cumulativeProgressBarData = [
    {
      name: "Tiến độ 30 ngày",
      listened: Math.min(totalCumulativeMinutes30Days, monthlyListeningGoalMinutes),
      remaining: Math.max(0, Math.round((monthlyListeningGoalMinutes - totalCumulativeMinutes30Days) * 10) / 10)
    }
  ];

  // Dialog & creation states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("Toán Học");
  const [selectedGrade, setSelectedGrade] = useState<string>(progress.grade || "Lớp 6");
  const [durationMode, setDurationMode] = useState<"standard" | "deep">("standard");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Library filtering
  const [libraryFilter, setLibraryFilter] = useState<"all" | "favorite" | "unread" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quiz state for current episode
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizClaimed, setQuizClaimed] = useState<boolean>(false);

  // Active dialogue line ref for auto-scroll
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const dialogueContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active line into view smoothly
  useEffect(() => {
    if (activeLineRef.current && dialogueContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [currentLineIndex]);

  // Reset quiz when switching episode
  useEffect(() => {
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    setQuizClaimed(false);
  }, [currentEpisode?.id]);

  // Handle Generate New Podcast
  const handleGeneratePodcast = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      let title = customTopic.trim();
      let content = "";
      let topic = customTopic.trim();
      let subject = selectedSubject;
      let grade = selectedGrade;

      if (selectedLessonId) {
        const found = lessons.find(l => l.id === selectedLessonId);
        if (found) {
          title = found.title;
          content = found.content;
          topic = found.topic || found.title;
          subject = found.bookName || selectedSubject;
          grade = found.grade || selectedGrade;
        }
      }

      if (!title) {
        setGenerateError("Vui lòng nhập chủ đề hoặc chọn một bài học có sẵn.");
        setIsGenerating(false);
        return;
      }

      const res = await fetch("/api/generate-podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          grade,
          content,
          topic
        })
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối đến máy chủ AI tạo podcast.");
      }

      const data = await res.json();
      if (!data.success || !data.podcast) {
        throw new Error(data.error || "Lỗi tạo kịch bản từ AI.");
      }

      const p = data.podcast;
      const newEp: PodcastEpisode = {
        id: `pod-${Date.now()}`,
        title: p.title || title,
        subject,
        grade,
        topic,
        summary: p.summary || "Tóm tắt bài học hấp dẫn cùng Minh và Lan.",
        durationMinutes: p.estimatedMinutes || (durationMode === "standard" ? 4 : 8),
        createdAt: new Date().toISOString(),
        listened: false,
        isFavorite: false,
        lessonId: selectedLessonId || undefined,
        xpReward: 15,
        dialogue: p.dialogue && p.dialogue.length > 0 ? p.dialogue : [
          { speaker: "Minh", role: "questioner", text: `Chào Lan! Cậu có thể giải thích giúp tớ về "${title}" được không?` },
          { speaker: "Lan", role: "explainer", text: `Chào Minh! Đây là chủ đề trọng tâm trong chương trình ${grade}. Cốt lõi của nó là hiểu bản chất và vận dụng vào bài tập thực tế!` }
        ],
        quickReviewQuestions: p.quickReviewQuestions || []
      };

      addEpisode(newEp);
      setIsCreateModalOpen(false);
      setCustomTopic("");
      setSelectedLessonId("");
      playEpisode(newEp, 0);

      if (triggerSuccessMessage) {
        triggerSuccessMessage(`Đã tạo thành công podcast: "${newEp.title}"!`);
      }
    } catch (err: any) {
      console.error("Create podcast error:", err);
      // Fallback: create offline template episode so user experience is never blocked
      const fallbackEp: PodcastEpisode = {
        id: `pod-fallback-${Date.now()}`,
        title: customTopic || "Chủ đề tự chọn",
        subject: selectedSubject,
        grade: selectedGrade,
        topic: customTopic,
        summary: "Kịch bản ôn tập nhanh do trợ lý học tập SmartStudy tạo.",
        durationMinutes: 3,
        createdAt: new Date().toISOString(),
        listened: false,
        isFavorite: false,
        xpReward: 15,
        dialogue: [
          { speaker: "Minh", role: "questioner", text: `Chào Lan, hôm nay chúng mình cùng thảo luận về ${customTopic || "kiến thức mới"} nhé!` },
          { speaker: "Lan", role: "explainer", text: `Tuyệt vời Minh ơi! Khi học phần này, em chỉ cần nhớ các từ khóa then chốt và các bước giải chuẩn xác là sẽ làm chủ bài học ngay!` },
          { speaker: "Minh", role: "questioner", text: `Cảm ơn Lan, tớ đã nắm được phương pháp rồi!` }
        ],
        quickReviewQuestions: [
          {
            question: `Ý nghĩa quan trọng nhất của bài học này là gì?`,
            options: ["Nắm chắc bản chất kiến thức", "Học thuộc lòng", "Bỏ qua các bước", "Không cần thực hành"],
            correctIndex: 0,
            explanation: "Hiểu bản chất giúp em tự tin giải mọi dạng bài tập nâng cao."
          }
        ]
      };
      addEpisode(fallbackEp);
      setIsCreateModalOpen(false);
      playEpisode(fallbackEp, 0);
      if (triggerSuccessMessage) {
        triggerSuccessMessage(`Đã tạo podcast ôn tập cho em!`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter episodes
  const filteredEpisodes = episodes.filter(ep => {
    if (libraryFilter === "favorite" && !ep.isFavorite) return false;
    if (libraryFilter === "unread" && ep.listened) return false;
    if (libraryFilter === "completed" && !ep.listened) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ep.title.toLowerCase().includes(q) ||
        ep.subject.toLowerCase().includes(q) ||
        ep.topic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate Quiz Score
  const handleCheckQuiz = () => {
    setQuizSubmitted(true);
  };

  const handleClaimQuizReward = () => {
    if (quizClaimed || !currentEpisode) return;
    setQuizClaimed(true);

    const bonusXP = 15;
    const bonusCoins = 5;
    onUpdateProgress({
      points: progress.points + bonusXP,
      coins: (progress.coins || 0) + bonusCoins
    });

    markEpisodeCompleted(currentEpisode.id);

    if (triggerSuccessMessage) {
      triggerSuccessMessage(`Chúc mừng em đã nhận +${bonusXP} XP và +${bonusCoins} Xu từ Podcast!`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-24 md:pb-12">
      {/* 1. Header Section: Clean Academic Studio Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display font-bold text-xl md:text-2xl text-slate-900 tracking-tight">
                Podcast học tập cùng Minh và Lan
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Giọng đọc Tiếng Việt rõ chữ (0.5x – 1x)</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Nghe đối thoại bài học tự nhiên giữa Minh (đặt câu hỏi) và Lan (giải thích bản chất), theo dõi lời thoại trực tiếp và làm câu hỏi ôn tập để nhận XP.
            </p>
          </div>

          {/* Primary Action: Create Podcast Button */}
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo podcast bài học mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Active Podcast Studio: Player & Karaoke Dialogue + Quick Quiz (First Viewport Priority when playing) */}
      {currentEpisode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Main Stage: Player & Karaoke Dialogue (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-5">
              {/* Episode Header & Metadata */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {currentEpisode.subject}
                    </span>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {currentEpisode.grade}
                    </span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {currentEpisode.durationMinutes} phút
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-lg md:text-xl text-slate-900 leading-snug">
                    {renderTextWithMath(currentEpisode.title)}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(currentEpisode.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      currentEpisode.isFavorite
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                    }`}
                    title={currentEpisode.isFavorite ? "Đã lưu yêu thích" : "Lưu vào yêu thích"}
                  >
                    <Heart className={`w-4 h-4 ${currentEpisode.isFavorite ? "fill-rose-500" : ""}`} />
                  </button>

                  <span className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs flex items-center gap-1.5 font-mono tabular-nums">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>+{currentEpisode.xpReward} XP</span>
                  </span>
                </div>
              </div>

              {/* Core Summary Callout (Renders LaTeX Math cleanly) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-700 leading-relaxed flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <strong className="text-slate-900 font-semibold mr-1.5">Tóm tắt trọng tâm:</strong>
                  <span>{renderTextWithMath(currentEpisode.summary)}</span>
                </div>
              </div>

              {/* Karaoke Dialogue Transcript */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lời thoại đối thoại (chạm vào câu bất kỳ để nghe từ đoạn đó)</span>
                  </span>
                  <span className="font-mono text-blue-700 tabular-nums">
                    Câu {currentLineIndex + 1} / {currentEpisode.dialogue.length}
                  </span>
                </div>

                {/* Scrollable Transcript Container with visible subtle 6px scrollbar */}
                <div 
                  ref={dialogueContainerRef}
                  className="max-h-[380px] overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 overscroll-contain"
                >
                  {currentEpisode.dialogue.map((line, idx) => {
                    const isCurrent = idx === currentLineIndex;
                    const isMinh = line.speaker === "Minh";

                    return (
                      <div
                        key={idx}
                        ref={isCurrent ? activeLineRef : null}
                        onClick={() => seekToLine(idx)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                          isCurrent
                            ? isMinh
                              ? "bg-amber-50/90 border-amber-300 shadow-2xs"
                              : "bg-blue-50/90 border-blue-300 shadow-2xs"
                            : "bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        {/* Clean Speaker Monogram Avatar */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-xs shrink-0 border ${
                            isMinh
                              ? "bg-amber-100/80 text-amber-900 border-amber-300"
                              : "bg-blue-100/80 text-blue-900 border-blue-300"
                          }`}
                          aria-hidden="true"
                        >
                          {isMinh ? "M" : "L"}
                        </div>

                        {/* Dialogue Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold ${isMinh ? "text-amber-900" : "text-blue-900"}`}>
                                {line.speaker}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                · {isMinh ? "Đặt câu hỏi" : "Giải thích"}
                              </span>
                            </div>
                            {isCurrent && isPlaying && (
                              <div className="flex items-center gap-1" aria-label="Đang phát">
                                <span className="w-1.5 h-3 bg-blue-600 rounded-full animate-bounce" />
                                <span className="w-1.5 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                                <span className="w-1.5 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                              </div>
                            )}
                          </div>
                          <p className={`text-sm leading-relaxed ${
                            isCurrent ? "font-semibold text-slate-900" : "font-normal text-slate-700"
                          }`}>
                            {renderTextWithMath(line.text)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transport & Playback Speed Controls */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(((currentLineIndex + 1) / currentEpisode.dialogue.length) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 tabular-nums">
                    <span>Tiến độ bài nghe: {Math.round(((currentLineIndex + 1) / currentEpisode.dialogue.length) * 100)}%</span>
                    <span>{currentLineIndex + 1} / {currentEpisode.dialogue.length} lượt thoại</span>
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Speed Selector */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-0.5">
                    {[
                      { value: 0.5, label: "0.5x Chậm kỹ" },
                      { value: 0.75, label: "0.75x Chậm vừa" },
                      { value: 1, label: "1x Chuẩn" },
                    ].map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSpeed(s.value)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          Math.abs(playbackSpeed - s.value) < 0.03
                            ? s.value <= 0.75
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-white text-blue-700 shadow-2xs border border-slate-200/80"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Primary Transport Buttons */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={skipPreviousLine}
                      disabled={currentLineIndex === 0}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                      title="Lượt thoại trước"
                      aria-label="Lượt thoại trước"
                    >
                      <Rewind className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer"
                      title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
                      aria-label={isPlaying ? "Tạm dừng" : "Phát tiếp"}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={skipNextLine}
                      disabled={currentLineIndex >= currentEpisode.dialogue.length - 1}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                      title="Lượt thoại tiếp theo"
                      aria-label="Lượt thoại tiếp theo"
                    >
                      <FastForward className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Replay from start */}
                  <button
                    type="button"
                    onClick={() => seekToLine(0)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Nghe lại từ đầu"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nghe lại từ đầu</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Side Stage: Quick Review Quiz & XP Reward (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Câu hỏi củng cố bài nghe
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hoàn thành câu hỏi để nhận +{currentEpisode.xpReward} XP và +5 Xu
                  </p>
                </div>
              </div>

              {currentEpisode.quickReviewQuestions && currentEpisode.quickReviewQuestions.length > 0 ? (
                <div className="space-y-4">
                  {currentEpisode.quickReviewQuestions.map((q, qIdx) => {
                    const selected = selectedQuizAnswers[qIdx];
                    const isCorrect = selected === q.correctIndex;

                    return (
                      <div key={qIdx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                        <p className="text-xs md:text-sm font-semibold text-slate-900 leading-snug">
                          <span className="text-blue-600 font-bold mr-1">Câu {qIdx + 1}:</span>
                          {renderTextWithMath(q.question)}
                        </p>

                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = selected === optIdx;
                            let style = "bg-white border-slate-200 text-slate-700 hover:border-blue-300";

                            if (quizSubmitted) {
                              if (optIdx === q.correctIndex) {
                                style = "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold";
                              } else if (isChosen && !isCorrect) {
                                style = "bg-rose-50 border-rose-300 text-rose-800 line-through";
                              }
                            } else if (isChosen) {
                              style = "bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-2xs";
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={quizSubmitted}
                                onClick={() => {
                                  setSelectedQuizAnswers(prev => ({
                                    ...prev,
                                    [qIdx]: optIdx
                                  }));
                                }}
                                className={`w-full p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer flex items-center gap-2.5 ${style}`}
                              >
                                <span className="w-5 h-5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1 leading-snug">{renderTextWithMath(opt)}</span>
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className={`p-2.5 rounded-xl text-xs leading-relaxed border ${
                            isCorrect 
                              ? "bg-emerald-50/90 border-emerald-200 text-emerald-900" 
                              : "bg-amber-50/90 border-amber-200 text-amber-900"
                          }`}>
                            <strong className="block font-semibold mb-0.5">
                              {isCorrect ? "Chính xác:" : "Giải thích:"}
                            </strong>
                            {renderTextWithMath(q.explanation)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Submit / Claim Reward Action */}
                  {!quizSubmitted ? (
                    <button
                      type="button"
                      onClick={handleCheckQuiz}
                      disabled={Object.keys(selectedQuizAnswers).length < currentEpisode.quickReviewQuestions.length}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs md:text-sm shadow-2xs transition-all cursor-pointer"
                    >
                      Kiểm tra đáp án
                    </button>
                  ) : !quizClaimed ? (
                    <button
                      type="button"
                      onClick={handleClaimQuizReward}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs md:text-sm shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 animate-bounce"
                    >
                      <span>Nhận +15 XP và +5 Xu</span>
                      <WisdomCoinIcon size={16} />
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Đã nhận thưởng bài nghe</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Tập podcast này chưa có câu hỏi ôn tập đính kèm.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. Library of Podcasts */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg md:text-xl text-slate-900">
              Thư viện tập nghe ({episodes.length})
            </h2>
            <p className="text-xs text-slate-500">
              Chọn một tập để bắt đầu nghe đối thoại hoặc tạo mới từ bài học trên lớp
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            {/* Filter Tabs */}
            <div className="mobile-tab-scroll flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setLibraryFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  libraryFilter === "all" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả ({episodes.length})
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter("favorite")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  libraryFilter === "favorite" ? "bg-white text-rose-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Heart className="w-3 h-3 fill-current" />
                <span>Yêu thích ({episodes.filter(e => e.isFavorite).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter("unread")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  libraryFilter === "unread" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chưa nghe ({episodes.filter(e => !e.listened).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Tìm podcast" placeholder="Tìm chủ đề, môn học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-xl text-xs bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-full sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* Podcast Episode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEpisodes.map((ep) => {
            const isCurrentPlaying = currentEpisode?.id === ep.id && isPlaying;
            const isCurrentLoaded = currentEpisode?.id === ep.id;

            return (
              <div
                key={ep.id}
                onClick={() => playEpisode(ep, 0)}
                className={`rounded-2xl p-5 bg-white border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group relative ${
                  isCurrentLoaded
                    ? "border-blue-500 ring-1 ring-blue-500/20 shadow-xs"
                    : "border-slate-200/90 hover:border-blue-300 hover:shadow-2xs"
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top metadata row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                        {ep.subject}
                      </span>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ep.grade}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {ep.listened && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Đã nghe</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(ep.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          ep.isFavorite ? "text-rose-500" : "text-slate-300 hover:text-rose-400"
                        }`}
                        title={ep.isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                      >
                        <Heart className={`w-4 h-4 ${ep.isFavorite ? "fill-rose-500" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Episode Title & Math-Clean Summary */}
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                      {renderTextWithMath(ep.title)}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                      {renderTextWithMath(ep.summary)}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {ep.durationMinutes} phút
                    </span>
                    <span>·</span>
                    <span>{ep.dialogue.length} câu thoại</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEpisode(ep.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa tập này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentLoaded && isPlaying) {
                          pauseEpisode();
                        } else {
                          playEpisode(ep, 0);
                        }
                      }}
                      className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 whitespace-nowrap rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCurrentPlaying
                          ? "bg-amber-500 text-white"
                          : isCurrentLoaded
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Đang phát</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isCurrentLoaded ? "Nghe tiếp" : "Nghe ngay"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredEpisodes.length === 0 && (
          <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
              <Headphones className="w-5 h-5" />
            </div>
            <p className="text-slate-900 font-semibold text-sm">Chưa có tập podcast nào khớp bộ lọc</p>
            <p className="text-slate-500 text-xs">Hãy bấm nút "Tạo podcast bài học mới" ở phía trên để soạn kịch bản đối thoại mới.</p>
          </div>
        )}
      </div>

      {/* 4. 30-Day Cumulative Podcast Listening Analytics (Preserves both Recharts BarChart & AreaChart) */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-bold text-base md:text-lg text-slate-900">
                  Thống kê thời lượng nghe 30 ngày qua
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold font-mono tabular-nums">
                  {totalCumulativeMinutes30Days} / {monthlyListeningGoalMinutes} phút ({cumulativeProgressPct}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Duy trì thói quen nghe ôn bài mỗi ngày ({activeListeningDaysCount}/30 ngày gần nhất có nghe podcast)
              </p>
            </div>
          </div>

          {/* Goal & Chart View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="px-2 text-xs font-medium text-slate-500">Mục tiêu:</span>
              {[60, 120, 180].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setMonthlyListeningGoalMinutes(goal)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                    monthlyListeningGoalMinutes === goal
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {goal}p
                </button>
              ))}
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setListeningChartMode("cumulative")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  listeningChartMode === "cumulative"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Lũy kế 30 ngày
              </button>
              <button
                type="button"
                onClick={() => setListeningChartMode("daily")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  listeningChartMode === "daily"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Theo từng ngày
              </button>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar (Recharts Horizontal Bar + Milestone Indicator) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Tiến trình tích lũy 30 ngày</span>
            </span>
            <span className="font-mono font-semibold text-blue-700 tabular-nums">
              Đã nghe {totalCumulativeMinutes30Days} phút · Còn {Math.max(0, Math.round((monthlyListeningGoalMinutes - totalCumulativeMinutes30Days) * 10) / 10)} phút đạt mục tiêu
            </span>
          </div>

          <div className="h-6 w-full rounded-lg overflow-hidden bg-slate-200/70 p-0.5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cumulativeProgressBarData}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis type="number" domain={[0, monthlyListeningGoalMinutes]} hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value} phút`,
                    name === "listened" ? "Đã nghe lũy kế (30 ngày)" : "Còn lại đến mục tiêu"
                  ]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "10px",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "11px"
                  }}
                />
                <Bar
                  dataKey="listened"
                  stackId="progress"
                  fill="#2563eb"
                  radius={[6, 0, 0, 6]}
                  isAnimationActive={true}
                />
                <Bar
                  dataKey="remaining"
                  stackId="progress"
                  fill="#e2e8f0"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 tabular-nums">
            <span>0 phút</span>
            <span>25% ({Math.round(monthlyListeningGoalMinutes * 0.25)}p)</span>
            <span>50% ({Math.round(monthlyListeningGoalMinutes * 0.5)}p)</span>
            <span>75% ({Math.round(monthlyListeningGoalMinutes * 0.75)}p)</span>
            <span className="font-semibold text-emerald-700">Đích: {monthlyListeningGoalMinutes} phút</span>
          </div>
        </div>

        {/* 30-Day Cumulative Duration Recharts Chart */}
        <div className="h-52 sm:h-60 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            {listeningChartMode === "cumulative" ? (
              <AreaChart
                data={listeningHistory30Days}
                margin={{ top: 10, right: 14, left: -18, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="podcastCumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="p"
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value} phút`,
                    name === "cumulativeMinutes" ? "Tổng lũy kế 30 ngày" : "Nghe trong ngày"
                  ]}
                  labelFormatter={(label) => `Ngày ${label}`}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "10px",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "12px"
                  }}
                />
                <ReferenceLine
                  y={monthlyListeningGoalMinutes}
                  stroke="#179574"
                  strokeDasharray="4 4"
                  label={{
                    value: `Mục tiêu ${monthlyListeningGoalMinutes}p`,
                    position: "insideTopRight",
                    fill: "#0e7f62",
                    fontSize: 11,
                    fontWeight: 600
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeMinutes"
                  name="cumulativeMinutes"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#podcastCumGradient)"
                  activeDot={{ r: 5, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={listeningHistory30Days}
                margin={{ top: 10, right: 14, left: -18, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="p"
                />
                <Tooltip
                  formatter={(value: any) => [`${value} phút`, "Thời lượng nghe trong ngày"]}
                  labelFormatter={(label) => `Ngày ${label}`}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "10px",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "12px"
                  }}
                />
                <Bar
                  dataKey="dailyMinutes"
                  name="Thời lượng nghe (phút)"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                  barSize={14}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Modal: Create New Podcast */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 max-w-lg w-full shadow-xl relative space-y-5 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base md:text-lg text-slate-900">
                    Tạo podcast bài học mới
                  </h3>
                  <p className="text-xs text-slate-500">Soạn kịch bản đối thoại giữa Minh và Lan từ bài học của em</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Đóng hộp thoại"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {generateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                {generateError}
              </div>
            )}

            <div className="space-y-4">
              {/* Option A: Select from existing lessons */}
              <div className="space-y-1.5">
                <label htmlFor="podcast-lesson-select" className="text-xs font-semibold text-slate-700 block">
                  Chọn từ bài học đã lưu trong thư viện:
                </label>
                <select
                  id="podcast-lesson-select"
                  value={selectedLessonId}
                  onChange={(e) => {
                    setSelectedLessonId(e.target.value);
                    if (e.target.value) {
                      setCustomTopic("");
                    }
                  }}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600 text-slate-800"
                >
                  <option value="">-- Chọn bài học có sẵn --</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      [{l.bookName}] {l.title} ({l.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>hoặc nhập chủ đề mới</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Option B: Custom Topic */}
              <div className="space-y-1.5">
                <label htmlFor="podcast-custom-topic" className="text-xs font-semibold text-slate-700 block">
                  Chủ đề hoặc nội dung muốn nghe:
                </label>
                <input
                  id="podcast-custom-topic"
                  type="text"
                  placeholder="Ví dụ: Lũy thừa với số mũ tự nhiên, Chu trình nước, Ẩn dụ và Hoán dụ..."
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    if (e.target.value) {
                      setSelectedLessonId("");
                    }
                  }}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              {/* Subject & Grade selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="podcast-subject" className="text-xs font-semibold text-slate-700 block">Môn học</label>
                  <select
                    id="podcast-subject"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-800"
                  >
                    <option value="Toán Học">Toán Học</option>
                    <option value="Ngữ Văn">Ngữ Văn</option>
                    <option value="Khoa học tự nhiên">Khoa học tự nhiên</option>
                    <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="podcast-grade" className="text-xs font-semibold text-slate-700 block">Khối lớp</label>
                  <select
                    id="podcast-grade"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-800"
                  >
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={isGenerating || (!selectedLessonId && !customTopic.trim())}
                onClick={handleGeneratePodcast}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Đang soạn kịch bản...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo podcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
