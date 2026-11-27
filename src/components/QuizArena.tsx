import React, { useState, useMemo, useEffect, useRef } from "react";
import { MathText } from "./MathText";
import { prefetchVi, speakVi, stopSpeaking } from "../features/tools/conversation/speakVi";
import { speak as speakEnglish, stopAll as stopEnglish } from "../features/dictionary/pronunciation";
import { GraduationCap, Volume2, CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw, BookOpen, ArrowLeft, Flame, Award, Zap, Target, AlertTriangle, Lightbulb, Compass, ArrowUpRight, Clock, Key } from "lucide-react";
import { Question, QuizSession, Lesson, WeakTopicRecommendation } from "../types";
import { loadQuizHistory, identifyWeakTopics } from "../lib/quizAnalytics";
import { signalFeedback } from "../lib/support/feedback";
import { getTrialCode, logTrial, rateLastTrial } from "../lib/support/trialLog";
import { supportSeconds, useSupportProfile } from "../lib/support/profile";
import { SUBJECT_DEFINITIONS, renderSubjectBadgeIcon } from "./LessonLibraryFilterBar";

/** What "Nghe câu hỏi" reads: the question, then each choice; math symbols dropped so they are not spelled out. */
const listenText = (q: Question) =>
  [q.question, ...q.options.map((o, i) => `${"ABCD"[i] ?? i + 1}. ${o}`)].join(". ").replace(/[$\\{}^_]/g, " ");

// English questions (plain ASCII, no Vietnamese letters) get the English voice, the rest the Vietnamese one.
const isEnglish = (t: string) => /[a-z]{2}/i.test(t) && /^[ -~’‘“”]+$/.test(t);
const speakQuestion = (t: string) =>
  isEnglish(t) ? void speakEnglish(t.replace(/[’‘]/g, "'").replace(/[“”]/g, '"')) : void speakVi(t);
const stopQuestion = () => {
  stopSpeaking();
  stopEnglish();
};

// Loads the AI voice for the question ahead of time; with "Đọc to tự động" on, reads it at once.
function VoicePrefetch({ text }: { text: string }) {
  const auto = useSupportProfile().readAloud;
  useEffect(() => {
    if (!auto) return;
    speakQuestion(text);
    return stopQuestion;
  }, [text, auto]);
  useEffect(() => (isEnglish(text) ? undefined : prefetchVi(text)), [text]);
  return null;
}

// Trial only: one tap "dễ / vừa / khó" after a quiz, the student's own view next to time and score.
function TrialFeel() {
  const [done, setDone] = useState(false);
  if (!getTrialCode()) return null;
  if (done) return <p role="status" className="text-center text-sm font-bold text-[#0e7f62]">Cảm ơn em đã cho biết!</p>;
  const options: [1 | 2 | 3, string, string][] = [[1, "🙂", "Dễ"], [2, "😐", "Vừa"], [3, "😣", "Khó"]];
  return (
    <div role="group" aria-labelledby="trial-feel-q" className="rounded-2xl border-2 border-[#c9dcf4] bg-[#eef4fc] p-4 text-center">
      <p id="trial-feel-q" className="text-sm font-black text-[#243c6e]">Em thấy bài vừa rồi thế nào?</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map(([v, icon, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              rateLastTrial(v);
              setDone(true);
            }}
            className="flex min-h-[64px] flex-col items-center justify-center rounded-2xl border-2 border-[#c9dcf4] bg-white text-sm font-bold text-slate-800 hover:border-[#2e5cb8]"
          >
            <span aria-hidden className="text-2xl">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface QuizArenaProps {
  session: QuizSession | null;
  loading: boolean;
  onSelectAnswer: (index: number) => void;
  onNextQuestion: () => void;
  onFinishQuiz: () => void;
  onRestartQuiz: () => void;
  onBackToDashboard: () => void;
  onTriggerFireworks?: () => void;
  recommendations?: WeakTopicRecommendation[];
  onStartRecommendedQuiz?: (rec: WeakTopicRecommendation) => void;
  onSelectLesson?: (lessonId: string) => void;
  lessons?: Lesson[];
}

export default function QuizArena({
  session,
  loading,
  onSelectAnswer,
  onNextQuestion,
  onFinishQuiz,
  onRestartQuiz,
  onBackToDashboard,
  onTriggerFireworks,
  recommendations,
  onStartRecommendedQuiz,
  onSelectLesson,
  lessons = []
}: QuizArenaProps) {

  // Tự động phân tích các lỗ hổng kiến thức và đề xuất chủ đề yếu nhất từ lịch sử kiểm tra
  const effectiveRecommendations = useMemo(() => {
    if (recommendations && recommendations.length > 0) {
      return recommendations;
    }
    const history = loadQuizHistory();
    return identifyWeakTopics(history, lessons);
  }, [recommendations, lessons]);

  const topWeakTopic = effectiveRecommendations[0];
  const secondaryWeakTopics = effectiveRecommendations.slice(1, 4);

  // Metacognitive Error Reflection state (Top 20 Improvement #2)
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(null);
  const [reflectedReasons, setReflectedReasons] = useState<Record<number, string>>({});

  // Chế độ làm lại các câu trả lời sai (Review Missed Questions)
  const [retrySession, setRetrySession] = useState<QuizSession | null>(null);
  const [retryRound, setRetryRound] = useState<number>(0);

  // Khi đề gốc từ bên ngoài thay đổi, đặt lại phiên làm lại câu sai
  const startedAtRef = useRef(Date.now());
  useEffect(() => {
    setRetrySession(null);
    setRetryRound(0);
    startedAtRef.current = Date.now();
  }, [session?.lessonId, session?.topic, session?.questions]);

  const activeSession = retrySession ?? session;
  const isReviewingMissed = retrySession !== null;

  const handleEffectiveSelectAnswer = (index: number) => {
    // "Hỗ trợ học tập": right / wrong also as a frame + ✓ ✗ and vibration (only when turned on)
    const shownQ = activeSession?.questions?.[activeSession.currentQuestionIndex];
    stopSpeaking();
    if (shownQ && activeSession.selectedAnswer === null) {
      const right = index === shownQ.correctIndex;
      signalFeedback(right ? "correct" : "wrong", right ? undefined : `Chưa đúng. Đáp án đúng là ${"ABCD"[shownQ.correctIndex] ?? ""}.`);
    }
    if (retrySession) {
      setRetrySession((prev) => {
        if (!prev || prev.selectedAnswer !== null) return prev;
        const currentQ = prev.questions[prev.currentQuestionIndex];
        const isCorrect = index === currentQ.correctIndex;
        const updatedAnswers = [...prev.answers];
        updatedAnswers[prev.currentQuestionIndex] = index;
        return {
          ...prev,
          selectedAnswer: index,
          answers: updatedAnswers,
          score: isCorrect ? prev.score + 1 : prev.score,
        };
      });
    } else {
      onSelectAnswer(index);
    }
  };

  const handleEffectiveNextQuestion = () => {
    if (retrySession) {
      setRetrySession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          selectedAnswer: null,
        };
      });
    } else {
      onNextQuestion();
    }
  };

  const handleEffectiveFinishQuiz = () => {
    if (retrySession) {
      setRetrySession((prev) => {
        if (!prev) return prev;
        if (prev.score === prev.questions.length && prev.questions.length > 0 && onTriggerFireworks) {
          onTriggerFireworks();
        }
        return {
          ...prev,
          completed: true,
        };
      });
    } else {
      if (session) {
        logTrial({
          kind: "quiz",
          topic: session.topic || session.lessonTitle || "",
          total: session.questions.length,
          correct: session.score,
          seconds: (Date.now() - startedAtRef.current) / 1000,
        });
      }
      onFinishQuiz();
    }
  };

  const handleStartMissedQuestionsReview = () => {
    if (!activeSession) return;
    const missedQuestions = activeSession.questions.filter(
      (q, idx) => activeSession.answers[idx] !== q.correctIndex
    );
    if (missedQuestions.length === 0) return;

    const baseTopic = (session?.topic || activeSession.topic || "Bài luyện tập").replace(/\s*•\s*Ôn lại.*$/, "");
    const nextRound = retryRound + 1;
    setRetryRound(nextRound);
    setRetrySession({
      lessonId: activeSession.lessonId,
      topic: `${baseTopic} • Ôn lại ${missedQuestions.length} câu sai`,
      questions: missedQuestions,
      currentQuestionIndex: 0,
      selectedAnswer: null,
      answers: new Array(missedQuestions.length).fill(null),
      completed: false,
      score: 0,
    });
    setExpandedQuestionIdx(null);
    setReflectedReasons({});
    const reviewBase = Math.max(180, missedQuestions.length * 120);
    setSecondsLeft(supportSeconds(reviewBase) ?? reviewBase);
    setTimerActive(true);
    setConfirmingEarlySubmit(false);
  };

  // Đồng hồ đếm ngược phòng thi (Countdown Timer: 10 phút = 600 giây)
  // "Hỗ trợ học tập": gấp đôi thời gian hoặc bỏ đồng hồ
  const noClock = useSupportProfile().timeMode === "off";
  // không đồng hồ thì vẫn giữ 600 giây dự phòng, để bật lại đồng hồ giữa bài không bị nộp ngay
  const [secondsLeft, setSecondsLeft] = useState<number>(() => supportSeconds(600) ?? 600);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [confirmingEarlySubmit, setConfirmingEarlySubmit] = useState<boolean>(false);

  // Hiệu ứng chuyển tiếp mượt mà cho thanh tiến độ khi chuyển câu hỏi hoặc hoàn thành câu trả lời
  const [isProgressTransitioning, setIsProgressTransitioning] = useState<boolean>(false);

  useEffect(() => {
    if (!activeSession || activeSession.completed) return;
    setIsProgressTransitioning(true);
    const timer = window.setTimeout(() => {
      setIsProgressTransitioning(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [activeSession?.currentQuestionIndex, activeSession?.selectedAnswer, activeSession?.completed]);

  useEffect(() => {
    if (!activeSession || activeSession.completed) return;
    if (!isReviewingMissed) {
      setSecondsLeft(supportSeconds(600) ?? 600);
    }
    setTimerActive(true);
    setConfirmingEarlySubmit(false);
  }, [activeSession?.lessonId, activeSession?.topic, activeSession?.completed, isReviewingMissed]);

  useEffect(() => {
    if (!activeSession || activeSession.completed || !timerActive || noClock) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEffectiveFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession, timerActive, noClock]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Hỗ trợ phím tắt A/B/C/D hoặc 1/2/3/4 và Enter để chọn nhanh
  useEffect(() => {
    if (!activeSession || activeSession.completed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const q = activeSession.questions[activeSession.currentQuestionIndex];
        if (q) speakQuestion(listenText(q));
        return;
      }
      if (activeSession.selectedAnswer === null) {
        if (key === "1" || key === "a") handleEffectiveSelectAnswer(0);
        else if (key === "2" || key === "b") handleEffectiveSelectAnswer(1);
        else if (key === "3" || key === "c") handleEffectiveSelectAnswer(2);
        else if (key === "4" || key === "d") handleEffectiveSelectAnswer(3);
      } else {
        if (e.key === "Enter") {
          if (activeSession.currentQuestionIndex < activeSession.questions.length - 1) {
            handleEffectiveNextQuestion();
          } else {
            handleEffectiveFinishQuiz();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSession]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-8 md:p-12 text-center space-y-8 shadow-2xs animate-pulse-slow">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
          <div className="absolute inset-2 bg-blue-600 rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white animate-bounce" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-display font-bold text-slate-900 text-lg">Đang tạo bộ câu hỏi luyện đề...</h3>
          <p className="text-slate-600 font-semibold text-sm">
            Hệ thống SmartStudy đang thiết kế bộ 5 câu hỏi trắc nghiệm chuẩn mực theo chuyên đề em cần củng cố...
          </p>
        </div>

        <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full mx-auto overflow-hidden">
          <div className="bg-blue-600 h-full animate-pulse" style={{ width: "75%" }} />
        </div>
      </div>
    );
  }

  // 1. MÀN HÌNH CHỜ / TRANG CHỦ LUYỆN ĐỀ KÈM TÍNH NĂNG GỢI Ý ÔN LUYỆN TRỌNG TÂM
  if (!session) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        
        {/* Banner Header */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-2xs text-center space-y-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto shadow-xs">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-slate-900">
              Luyện đề khắc phục điểm yếu
            </h2>
            <p className="text-slate-600 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
              Hệ thống tự động phát hiện các câu hỏi học sinh hay nhầm lẫn và đề xuất bài tập trọng điểm để em bứt phá điểm 9, 10!
            </p>
          </div>
        </div>

        {/* KHỐI GỢI Ý ĐẶC BIỆT: AI RECOMMENDED NEXT QUIZ DỰA TRÊN CHỦ ĐỀ YẾU NHẤT */}
        {topWeakTopic && (
          <div className="edu-card rounded-[2.5rem] p-6 md:p-8 border-2 border-sky-300/80 bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-indigo-50/60 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-200/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2e5cb8] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap bg-sky-200/90 text-sky-900 px-2.5 py-0.5 rounded-full border border-sky-300">
                      Gợi ý ôn luyện trọng tâm
                    </span>
                    <span className="text-[10px] font-extrabold text-indigo-800 flex items-center gap-1 whitespace-nowrap">
                      <AlertTriangle className="w-3 h-3 text-indigo-600" />
                      Phát hiện điểm cần bổ trợ
                    </span>
                  </div>
                  <h3 className="font-display font-black text-lg md:text-xl text-sky-950 mt-0.5">
                    Đề Xuất Đề Thi Kế Tiếp: {topWeakTopic.topic}
                  </h3>
                </div>
              </div>

              <span className="self-start sm:self-auto px-3 py-1 rounded-xl bg-sky-100 text-sky-900 font-extrabold text-xs border border-sky-300/80">
                {topWeakTopic.subjectName}
              </span>
            </div>

            {/* Topic Diagnosis Card */}
            <div className="bg-white/90 rounded-2xl p-4.5 border border-sky-200/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Chẩn đoán năng lực của AI:</span>
                </span>
                <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 self-start sm:self-auto">
                  Độ chính xác trước đây: {topWeakTopic.accuracy}% ({topWeakTopic.correctCount}/{topWeakTopic.totalTested} câu)
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {topWeakTopic.reason}
              </p>

              {/* Accuracy progress bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Mức độ làm chủ chuyên đề:</span>
                  <span className={topWeakTopic.accuracy < 50 ? "text-rose-600 font-black" : "text-blue-700 font-black"}>
                    {topWeakTopic.accuracy}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      topWeakTopic.accuracy < 50 ? "bg-rose-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${Math.max(10, topWeakTopic.accuracy)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action buttons for recommended weak topic */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                onClick={() => {
                  if (onStartRecommendedQuiz) {
                    onStartRecommendedQuiz(topWeakTopic);
                  } else {
                    onRestartQuiz();
                  }
                }}
                className="flex-1 py-3.5 px-5 ss-btn-grad text-white font-black text-xs md:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Zap className="w-4 h-4 text-sky-200" />
                <span>Làm 5 câu củng cố</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {topWeakTopic.lessonId && onSelectLesson && (
                <button
                  onClick={() => onSelectLesson(topWeakTopic.lessonId!)}
                  className="py-3.5 px-4 bg-sky-100/90 hover:bg-sky-200/90 text-sky-900 font-extrabold text-xs rounded-xl border border-sky-300/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-sky-700" />
                  <span>Đọc lại giáo án</span>
                </button>
              )}
            </div>

            {/* Secondary weak topics chips */}
            {secondaryWeakTopics.length > 0 && (
              <div className="pt-3 border-t border-sky-200/60 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Các chuyên đề khác cần củng cố:
                </span>
                <div className="flex flex-wrap gap-2">
                  {secondaryWeakTopics.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (onStartRecommendedQuiz) {
                          onStartRecommendedQuiz(item);
                        } else {
                          onRestartQuiz();
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 flex items-center gap-2 transition-all cursor-pointer shadow-2xs group"
                    >
                      <span className="text-xs font-extrabold">{(() => {
                        const sub = SUBJECT_DEFINITIONS.find(s => s.id === item.subjectId);
                        return sub ? renderSubjectBadgeIcon(sub) : "📚";
                      })()}</span>
                      <span className="group-hover:text-blue-600">{item.topic}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold">
                        {item.accuracy}% đúng
                      </span>
                      <ArrowUpRight className="w-3 h-3 text-blue-500 opacity-60 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* General options buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button 
            onClick={onRestartQuiz}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Luyện đề ngẫu nhiên (tổng hợp các môn)</span>
          </button>
          <button 
            onClick={onBackToDashboard}
            className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs md:text-sm rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            Quay lại Tổng Quan
          </button>
        </div>
      </div>
    );
  }

  if (!activeSession) return null;
  const { questions, currentQuestionIndex, selectedAnswer, answers, completed, score } = activeSession;

  // 2. MÀN HÌNH KẾT QUẢ KHI HOÀN THÀNH BÀI THI (RESULTS VIEW)
  if (completed) {
    const totalXP = score * 20;
    
    let commentTitle = "Cố lên em nhé!";
    let commentText = "Luyện tập nhiều hơn sẽ giúp em nhớ bài cực dai. Đừng nản lòng nha!";
    let bgGradient = "from-sky-100/80 to-blue-100/80 text-sky-950 border border-sky-200/80";
    let emoji = "💡";
 
    const isPerfect = score === questions.length && questions.length > 0;

    if (isPerfect) {
      commentTitle = isReviewingMissed ? "Đã sửa hết lỗi sai!" : "Đẳng cấp Thần Đồng!";
      commentText = isReviewingMissed
        ? `Tuyệt vời! Em đã trả lời đúng toàn bộ ${score}/${questions.length} câu từng làm sai trước đó!`
        : `Em trả lời đúng tuyệt đối ${score}/${questions.length} câu! Xứng danh là chiến thần tri thức thế hệ mới!`;
      bgGradient = "from-amber-400 via-orange-400 to-yellow-300 text-white shadow-lg shadow-amber-400/20";
      emoji = "🏆";
    } else if (score >= Math.ceil(questions.length * 0.6)) {
      commentTitle = "Cực kỳ xuất sắc!";
      commentText = "Kiến thức của em rất vững vàng. Tiếp tục giữ vững phong độ siêu phàm này nhé!";
      bgGradient = "from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20";
      emoji = "🔥";
    }

    // Identify incorrect questions from this session
    const missedQuestions = questions.filter((q, idx) => answers[idx] !== q.correctIndex);
    const wrongCount = missedQuestions.length;

    return (
      <div className="max-w-2xl mx-auto edu-card rounded-[2.5rem] p-6 md:p-8 space-y-6 animate-scale-up">
        {isReviewingMissed && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs">
            <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Kết quả Lượt Ôn Lại Câu Sai #{retryRound}</span>
            </span>
            <button
              type="button"
              onClick={() => setRetrySession(null)}
              className="font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer text-[11px]"
            >
              Xem kết quả toàn bộ đề gốc
            </button>
          </div>
        )}

        {/* Colorful result card */}
        <div className={`rounded-3xl bg-gradient-to-r ${bgGradient} p-6 text-center space-y-4 shadow-sm relative overflow-hidden`}>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-sky-300/20 rounded-full blur-xl" />
          <span className="text-5xl block animate-bounce">{emoji}</span>
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-2xl">{commentTitle}</h3>
            <p className="text-xs opacity-90 max-w-sm mx-auto">{commentText}</p>
          </div>
        </div>

        {!isReviewingMissed && <TrialFeel />}

        {/* Perfect Score Celebration Banner */}
        {isPerfect && (
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-pulse">🎆</span>
              <div>
                <p className="font-black text-amber-950 text-sm">Điểm tuyệt đối 100%!</p>
                <p className="text-xs text-amber-800">Thưởng lớn: Bắn pháo hoa vinh danh rực rỡ và +30 Xu Trí Tuệ</p>
              </div>
            </div>
            {onTriggerFireworks && (
              <button
                onClick={onTriggerFireworks}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <span>Bắn lại pháo hoa</span>
              </button>
            )}
          </div>
        )}

        {/* Dynamic Bento Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-sky-50/70 border border-sky-150/70 p-4 rounded-xl text-center space-y-1">
            <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Kết quả chung cuộc</span>
            <span className="font-display font-black text-3xl text-sky-950 tabular-nums">{score} / {questions.length}</span>
            <span className="text-[10px] text-slate-500 font-bold">Câu trả lời đúng</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-150/70 p-4 rounded-xl text-center space-y-1">
            <span className="text-xs text-blue-600 font-bold block uppercase tracking-wider">Phần thưởng XP</span>
            <span className="font-display font-black text-3xl text-blue-700 tabular-nums">+{totalXP} XP</span>
            <span className="text-[10px] text-blue-600 font-bold">Điểm danh dự được cộng</span>
          </div>
        </div>

        {/* Dedicated Review Missed Questions Banner */}
        {wrongCount > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/80 to-orange-50 border-2 border-rose-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-display font-black text-xs sm:text-sm text-rose-950">
                  Còn {wrongCount} câu trả lời chưa chính xác
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                Làm lại riêng {wrongCount} câu sai ngay bây giờ để ghi nhớ sâu kiến thức vừa hổng.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartMissedQuestionsReview}
              aria-label="Review Missed Questions"
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Review Missed Questions ({wrongCount} câu sai)</span>
            </button>
          </div>
        )}

        {/* Recap review section with Metacognitive Error Reflection Loop */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-sky-950 text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Xem lại bài làm và Phân tích lỗi sai (Phản tư)</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              Chạm vào câu sai để tìm nguyên nhân
            </span>
          </div>

          <div className="space-y-2.5">
            {questions.map((q, idx) => {
              const studentAnswer = answers[idx];
              const isCorrect = studentAnswer === q.correctIndex;
              const isExpanded = expandedQuestionIdx === idx;
              const recordedReason = reflectedReasons[idx];

              return (
                <div 
                  key={idx} 
                  className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isCorrect 
                      ? "border-emerald-200/80 bg-emerald-50/40" 
                      : isExpanded 
                      ? "border-sky-400 bg-white shadow-xs" 
                      : "border-rose-200/80 bg-rose-50/30 hover:border-rose-300"
                  }`}
                >
                  <div 
                    onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                    className="flex items-center justify-between p-3.5 cursor-pointer text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden mr-2 min-w-0">
                      {isCorrect ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                      )}
                      <span className="text-slate-800 truncate font-medium">
                        Câu {idx + 1}: {q.question}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {recordedReason && (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                          ✓ Đã phản tư (+10 XP)
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                        isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {isCorrect ? "Đúng" : "Xem lỗi sai ▼"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Metacognitive Calibration Drawer */}
                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/70 space-y-3 text-xs animate-fade-in">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Nội dung câu hỏi:
                        </span>
                        <div className="text-slate-900 font-semibold">
                          <MathText content={q.question} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white border border-rose-200 space-y-1">
                          <span className="text-[10px] font-bold text-rose-600 uppercase block">
                            Lựa chọn của em:
                          </span>
                          <span className="font-medium text-slate-800">
                            {studentAnswer !== null && studentAnswer !== undefined && q.options[studentAnswer] ? (
                              <MathText content={q.options[studentAnswer]} />
                            ) : "Chưa chọn"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-emerald-200 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                            Đáp án chuẩn xác:
                          </span>
                          <span className="font-medium text-slate-800">
                            <MathText content={q.options[q.correctIndex]} />
                          </span>
                        </div>
                      </div>

                      {q.explanation && (
                        <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200/70 space-y-1">
                          <span className="text-[10px] font-bold text-sky-800 uppercase block">
                            Lời giải thích:
                          </span>
                          <div className="text-slate-700 leading-relaxed text-[11px]">
                            <MathText content={q.explanation} />
                          </div>
                        </div>
                      )}

                      {!isCorrect && (
                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                          <span className="text-[11px] font-bold text-amber-900 block flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-amber-600" />
                            <span>Phân tích nguyên nhân: Vì sao em chưa làm đúng câu này?</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                            {[
                              { id: "formula", label: "Nhầm công thức", desc: "Cần ôn lại lý thuyết" },
                              { id: "trap", label: "Bị bẫy câu hỏi", desc: "Đọc lướt sót điều kiện" },
                              { id: "rush", label: "Tính toán vội", desc: "Sơ suất khi bấm máy/nhẩm" },
                            ].map((reason) => (
                              <button
                                key={reason.id}
                                type="button"
                                onClick={() => {
                                  setReflectedReasons(prev => ({ ...prev, [idx]: reason.label }));
                                }}
                                className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                                  recordedReason === reason.label
                                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                                    : "bg-white hover:bg-amber-100/70 border-amber-200 text-slate-800"
                                }`}
                              >
                                <span className="font-bold text-[11px] block">{reason.label}</span>
                                <span className={`text-[9px] block ${recordedReason === reason.label ? "text-amber-100" : "text-slate-400"}`}>
                                  {reason.desc}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Growth Mindset Reflection Bonus Celebration */}
          {Object.keys(reflectedReasons).length > 0 && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200 flex items-center justify-between text-xs animate-fade-in">
              <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Xuất sắc! Em đã chủ động phản tư {Object.keys(reflectedReasons).length} lỗi sai</span>
              </span>
              <span className="font-mono font-black text-emerald-700 tabular-nums">
                +{Object.keys(reflectedReasons).length * 10} XP Phản Tư
              </span>
            </div>
          )}
        </div>

        {/* TÍNH NĂNG GỢI Ý ĐỀ TIẾP THEO SAU KHI THI XONG */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4.5 h-4.5 text-sky-600" />
              <h5 className="font-black text-xs text-sky-950 uppercase tracking-wider">
                Gợi ý đề tiếp theo
              </h5>
            </div>
            <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md">
              AI Smart Recommendation
            </span>
          </div>

          {wrongCount > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Em có {wrongCount} câu trả lời chưa chuẩn xác trong bài thi này. Hãy thử sức làm lại riêng các câu sai hoặc tạo 1 đề củng cố mới để biến lỗi sai thành kinh nghiệm vững chắc!
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleStartMissedQuestionsReview}
                  className="flex-1 py-2.5 px-3 ss-btn-grad text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Review Missed Questions • Làm Lại {wrongCount} Câu Sai</span>
                </button>
                <button
                  type="button"
                  onClick={onRestartQuiz}
                  className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-200" />
                  <span>Tạo đề củng cố mới</span>
                </button>
              </div>
            </div>
          ) : topWeakTopic ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Xuất sắc! Em đã hoàn toàn làm chủ đề thi này. Bước tiếp theo, hãy chinh phục chuyên đề yếu nhất trước đây: <strong className="text-sky-950">{topWeakTopic.topic} ({topWeakTopic.subjectName})</strong>!
              </p>
              <button
                onClick={() => {
                  if (onStartRecommendedQuiz) {
                    onStartRecommendedQuiz(topWeakTopic);
                  } else {
                    onRestartQuiz();
                  }
                }}
                className="w-full py-2.5 ss-btn-grad text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-white" />
                <span>Luyện tiếp chuyên đề cần củng cố: {topWeakTopic.topic}</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-sky-200/80">
          {wrongCount > 0 && (
            <button
              type="button"
              onClick={handleStartMissedQuestionsReview}
              className="flex-1 py-3.5 px-4 rounded-xl ss-btn-grad text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Review Missed Questions ({wrongCount})</span>
            </button>
          )}
          <button 
            onClick={onRestartQuiz}
            className="flex-1 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử sức đề khác</span>
          </button>
          <button 
            onClick={onBackToDashboard}
            className="flex-1 py-3.5 rounded-xl bg-sky-200/80 hover:bg-sky-300 text-sky-900 font-bold text-sm border border-sky-300/60 transition-all text-center cursor-pointer"
          >
            Quay lại Tổng Quan
          </button>
        </div>
      </div>
    );
  }

  // 3. MÀN HÌNH ĐANG LÀM BÀI TRẮC NGHIỆM (ACTIVE QUIZ VIEW)
  const currentQuestion: Question = questions[currentQuestionIndex];
  if (!currentQuestion) return <div className="p-8 text-center text-red-500 font-bold">Lỗi tải câu hỏi. Vui lòng thử lại.</div>;
  const answered = selectedAnswer !== null;

  const totalQuestionsCount = Math.max(1, questions.length);
  const completedSteps = currentQuestionIndex + (answered ? 1 : 0);
  const activeStepProgress = Math.min(
    100,
    Math.round(((currentQuestionIndex + (answered ? 1 : 0.5)) / totalQuestionsCount) * 100)
  );
  const completionPercentLabel = Math.min(
    100,
    Math.round(((currentQuestionIndex + (answered ? 1 : 0)) / totalQuestionsCount) * 100)
  );

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-2xs space-y-6 animate-fade-in">
      {isReviewingMissed && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs">
          <span className="font-extrabold flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Chế độ Review Missed Questions • Làm lại {questions.length} câu trả lời sai (Lượt #{retryRound})</span>
          </span>
          <button
            type="button"
            onClick={() => setRetrySession(null)}
            className="text-[11px] font-bold text-amber-900 hover:text-rose-700 underline cursor-pointer"
          >
            Thoát về kết quả
          </button>
        </div>
      )}
      
      {/* Quiz Progress & Exam Room Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5 text-sky-600" />
              <span>{isReviewingMissed ? "Phòng ôn câu sai" : "Phòng thi đấu"}</span>
            </span>
            {activeSession.topic && (
              <span className="text-[11px] font-bold text-slate-500 truncate max-w-[150px] sm:max-w-[240px]">
                • {activeSession.topic}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Real-time countdown timer */}
            {noClock ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs border bg-sky-100/90 text-sky-950 border-sky-300/80">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Không giới hạn giờ</span>
              </div>
            ) : (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-black text-xs border ${
              secondsLeft <= 60 
                ? "bg-rose-100 text-rose-700 border-rose-300 animate-pulse" 
                : "bg-sky-100/90 text-sky-950 border-sky-300/80"
            }`}>
              <Clock className={`w-3.5 h-3.5 ${secondsLeft <= 60 ? "text-rose-600" : "text-sky-600"}`} />
              <span>{formatTimer(secondsLeft)}</span>
              {secondsLeft <= 60 && <span className="text-[10px] uppercase font-bold text-rose-600">Sắp hết giờ</span>}
            </div>
            )}

            {/* Early submit button (inline confirmation - works in sandboxed iframes without window.confirm) */}
            {confirmingEarlySubmit ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingEarlySubmit(false);
                    handleEffectiveFinishQuiz();
                  }}
                  className="py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] transition-all cursor-pointer"
                >
                  Xác nhận nộp
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingEarlySubmit(false)}
                  className="py-1 px-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] transition-all cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingEarlySubmit(true)}
                className="py-1 px-2.5 rounded-lg bg-sky-200/80 hover:bg-sky-300 text-sky-900 font-extrabold text-[11px] border border-sky-300/60 transition-all cursor-pointer"
              >
                Nộp bài sớm
              </button>
            )}
          </div>
        </div>

        {/* Question Counter, Completion Badge & Shortcuts Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium pt-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sky-950">
              Câu số <span className="font-mono text-sm font-black text-sky-700">{currentQuestionIndex + 1}</span> / {questions.length}
            </span>
            <span
              className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-extrabold border transition-all duration-500 ${
                isProgressTransitioning
                  ? "bg-sky-600 text-white border-sky-500 scale-105 shadow-2xs"
                  : completionPercentLabel === 100
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-sky-100/90 text-sky-800 border-sky-200/90"
              }`}
            >
              Tiến độ hoàn thành: {completionPercentLabel}% ({completedSteps}/{questions.length} câu)
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            <Key className="w-3 h-3" />
            <span>Phím tắt: 1–4 hoặc A–D để chọn, N để nghe câu hỏi, Enter để sang câu tiếp</span>
          </span>
        </div>

        {/* Smooth Animated Continuous Progress Bar */}
        <div className="space-y-2">
          <div
            role="progressbar"
            aria-label="Tiến độ hoàn thành bài luyện tập"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={activeStepProgress}
            className="relative w-full h-3 bg-sky-100/90 rounded-full overflow-hidden border border-sky-200/90 shadow-inner"
          >
            <div
              className={`h-full rounded-full transition-[width,background-color,box-shadow,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden ${
                completionPercentLabel === 100
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 shadow-[0_0_14px_rgba(16,185,129,0.5)]"
                  : "ss-grad-brand shadow-[0_0_12px_rgba(37,99,235,0.35)]"
              } ${isProgressTransitioning ? "brightness-110" : ""}`}
              style={{ width: `${Math.max(8, activeStepProgress)}%` }}
            >
              <div
                className={`absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent via-white/55 to-white/80 transition-opacity duration-500 ${
                  isProgressTransitioning ? "opacity-100" : "opacity-30"
                }`}
              />
            </div>
          </div>

          {/* Segmented Timeline Step Indicators with Smooth Transitions */}
          <div className="flex items-center gap-1.5 h-2">
            {questions.map((_, idx) => {
              let colorClass = "bg-sky-100/80";
              if (idx === currentQuestionIndex) {
                colorClass = answered
                  ? answers[idx] === questions[idx].correctIndex
                    ? "bg-emerald-500 scale-y-125 shadow-2xs"
                    : "bg-rose-500 scale-y-125 shadow-2xs"
                  : "bg-sky-600 scale-y-125 shadow-xs";
              } else if (idx < currentQuestionIndex) {
                const studentAns = answers[idx];
                const correctIdx = questions[idx].correctIndex;
                colorClass = studentAns === correctIdx ? "bg-emerald-500" : "bg-rose-500";
              }
              return (
                <div
                  key={idx}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${colorClass}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90">
        <h3 className="font-display font-bold text-slate-900 text-base md:text-lg leading-relaxed text-center">
          <MathText content={currentQuestion.question} />
        </h3>
        {/* read-aloud for low vision / dyslexia: question then each choice */}
        <VoicePrefetch text={listenText(currentQuestion)} />
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => speakQuestion(listenText(currentQuestion))}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-200 bg-white px-4 text-sm font-bold text-sky-800 hover:bg-sky-50"
          >
            <Volume2 className="h-4 w-4" aria-hidden /> Nghe câu hỏi
          </button>
        </div>
      </div>

      {/* Option Buttons */}
      <div className="space-y-2.5">
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrectAnswer = idx === currentQuestion.correctIndex;
          
          let btnClass = "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 hover:border-blue-300";
          let icon = null;

          if (answered) {
            if (isCorrectAnswer) {
              btnClass = "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500";
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
            } else if (isSelected) {
              btnClass = "bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500";
              icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
            } else {
              btnClass = "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60";
            }
          } else if (isSelected) {
            btnClass = "bg-blue-50 border-blue-600 text-blue-950 ring-2 ring-blue-500/20";
          }

          return (
            <button
              key={idx}
              disabled={answered}
              onClick={() => handleEffectiveSelectAnswer(idx)}
              className={`w-full text-left p-4 rounded-xl border font-semibold text-xs md:text-sm transition-all flex items-center justify-between gap-4 cursor-pointer ${btnClass}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg font-bold font-mono text-xs flex items-center justify-center shrink-0 ${
                  answered && isCorrectAnswer 
                    ? "bg-emerald-500 text-white" 
                    : answered && isSelected 
                    ? "bg-rose-500 text-white" 
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>
                  <MathText content={option} />
                </span>
              </div>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Sliding Explanation Panel */}
      {answered && (
        <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl animate-fade-in space-y-2">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Mẹo và lời giải chi tiết</span>
          </div>
          <div className="text-xs text-slate-700 font-medium leading-relaxed">
            <MathText content={currentQuestion.explanation} />
          </div>
        </div>
      )}

      {/* Advance Control */}
      {answered && (
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={handleEffectiveNextQuestion}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Câu hỏi tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleEffectiveFinishQuiz}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Hoàn thành bài làm</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
