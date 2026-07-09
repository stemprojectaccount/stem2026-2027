import React, { useState } from "react";
import { 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Trophy, 
  RotateCcw,
  BookOpen,
  ArrowLeft,
  Flame,
  Award,
  Zap
} from "lucide-react";
import { Question, QuizSession } from "../types";

interface QuizArenaProps {
  session: QuizSession | null;
  loading: boolean;
  onSelectAnswer: (index: number) => void;
  onNextQuestion: () => void;
  onFinishQuiz: () => void;
  onRestartQuiz: () => void;
  onBackToDashboard: () => void;
}

export default function QuizArena({
  session,
  loading,
  onSelectAnswer,
  onNextQuestion,
  onFinishQuiz,
  onRestartQuiz,
  onBackToDashboard
}: QuizArenaProps) {

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl shadow-indigo-50/50 space-y-8 animate-pulse-slow">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white animate-bounce" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="font-display font-bold text-slate-800 text-lg">Đang kết nối Đấu Trường...</h3>
          <p className="text-indigo-600 font-bold text-sm">
            🤖 AI Gemini đang thiết kế bộ 5 câu hỏi trắc nghiệm siêu trí tuệ dựa trên bài học của em...
          </p>
        </div>

        <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full mx-auto overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full animate-pulse" style={{ width: "75%" }} />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-indigo-50/40 space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100/50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-black text-2xl text-slate-850">Đấu Trường Đố Vui</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Hệ thống chưa ghi nhận lượt thi trắc nghiệm nào đang diễn ra. Hãy khởi chạy bài kiểm tra kiến thức tổng hợp để thử tài trí tuệ!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button 
            onClick={onRestartQuiz}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-sm rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            🔥 Thách Đấu Ngẫu Nhiên (5 câu)
          </button>
          <button 
            onClick={onBackToDashboard}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-xl transition-all"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { questions, currentQuestionIndex, selectedAnswer, answers, completed, score } = session;

  // 1. Results View
  if (completed) {
    const totalXP = score * 20; // 20 XP per correct answer
    
    let commentTitle = "Cố lên em nhé! 💪";
    let commentText = "Luyện tập nhiều hơn sẽ giúp em nhớ bài cực dai. Đừng nản lòng nha!";
    let bgGradient = "from-slate-100 to-slate-200";
    let emoji = "💡";
 
    if (score === 5) {
      commentTitle = "Đẳng cấp Thần Đồng! 👑";
      commentText = "Em trả lời đúng tuyệt đối! Xứng danh là chiến thần tri thức thế hệ mới!";
      bgGradient = "from-amber-400 via-orange-400 to-yellow-300 text-white";
      emoji = "🏆";
    } else if (score >= 3) {
      commentTitle = "Cực kỳ xuất sắc! 🌟";
      commentText = "Kiến thức của em rất vững vàng. Tiếp tục giữ vững phong độ siêu phàm này nhé!";
      bgGradient = "from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-100";
      emoji = "🔥";
    }

    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-indigo-50/40 space-y-8 animate-scale-up">
        {/* Colorful result card */}
        <div className={`rounded-3xl bg-gradient-to-r ${bgGradient} p-6 text-center space-y-4 shadow-lg relative overflow-hidden`}>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <span className="text-5xl block animate-bounce">{emoji}</span>
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-2xl">{commentTitle}</h3>
            <p className="text-xs opacity-90 max-w-sm mx-auto">{commentText}</p>
          </div>
        </div>

        {/* Dynamic Bento Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center space-y-1">
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Kết quả chung cuộc</span>
            <span className="font-display font-black text-3xl text-slate-800">{score} / {questions.length}</span>
            <span className="text-[10px] text-slate-500 font-bold">Câu trả lời đúng</span>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center space-y-1">
            <span className="text-xs text-indigo-400 font-bold block uppercase tracking-wider">Phần thưởng XP</span>
            <span className="font-display font-black text-3xl text-indigo-600">+{totalXP} XP</span>
            <span className="text-[10px] text-indigo-500 font-bold">Điểm danh dự được cộng</span>
          </div>
        </div>

        {/* Recap review section */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-slate-800 text-sm">Xem lại tóm lược bài làm:</h4>
          <div className="space-y-2">
            {questions.map((q, idx) => {
              const studentAnswer = answers[idx];
              const isCorrect = studentAnswer === q.correctIndex;
              return (
                <div key={idx} className="flex items-center justify-between p-3.5 border border-slate-100 bg-slate-50 rounded-xl text-xs font-semibold">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                    )}
                    <span className="text-slate-700 truncate">{q.question}</span>
                  </div>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                    isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {isCorrect ? "Đúng" : "Sai"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
          <button 
            onClick={onRestartQuiz}
            className="flex-1 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>THỬ SỨC ĐỀ KHÁC</span>
          </button>
          <button 
            onClick={onBackToDashboard}
            className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all text-center"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 2. Main Active Quiz View
  const currentQuestion: Question = questions[currentQuestionIndex];
  const answered = selectedAnswer !== null;

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-indigo-50/40 space-y-6 animate-fade-in">
      
      {/* Quiz Progress Header */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
            Đấu trường Đố vui
          </span>
          <span className="font-display font-bold text-slate-500">
            Câu {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Timeline dots (Chess.com Style) */}
        <div className="flex items-center gap-1.5 h-2">
          {questions.map((_, idx) => {
            let colorClass = "bg-slate-100";
            if (idx === currentQuestionIndex) {
              colorClass = "bg-indigo-600 scale-y-125 shadow-sm";
            } else if (idx < currentQuestionIndex) {
              const studentAns = answers[idx];
              const correctIdx = questions[idx].correctIndex;
              colorClass = studentAns === correctIdx ? "bg-emerald-500" : "bg-rose-500";
            }
            return (
              <div 
                key={idx} 
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${colorClass}`} 
              />
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
        <h3 className="font-display font-bold text-slate-800 text-base md:text-lg leading-relaxed text-center">
          "{currentQuestion.question}"
        </h3>
      </div>

      {/* Option Buttons */}
      <div className="space-y-2.5">
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrectAnswer = idx === currentQuestion.correctIndex;
          
          let btnClass = "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300";
          let icon = null;

          if (answered) {
            if (isCorrectAnswer) {
              btnClass = "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500";
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
            } else if (isSelected) {
              btnClass = "bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500";
              icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
            } else {
              btnClass = "bg-white border-slate-100 text-slate-400 cursor-not-allowed opacity-60";
            }
          } else if (isSelected) {
            btnClass = "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-400";
          }

          return (
            <button
              key={idx}
              disabled={answered}
              onClick={() => onSelectAnswer(idx)}
              className={`w-full text-left p-4 rounded-xl border-2 font-semibold text-xs md:text-sm transition-all flex items-center justify-between gap-4 cursor-pointer ${btnClass}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg font-bold font-mono text-xs flex items-center justify-center shrink-0 ${
                  answered && isCorrectAnswer 
                    ? "bg-emerald-500 text-white" 
                    : answered && isSelected 
                    ? "bg-rose-500 text-white" 
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </div>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Sliding Explanation Panel */}
      {answered && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-fade-in space-y-2">
          <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Mẹo Giải Mã Kiến Thức</span>
          </div>
          <p className="text-xs text-indigo-950 font-medium leading-relaxed">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Advance Control */}
      {answered && (
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={onNextQuestion}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm shadow-md transition-all flex items-center gap-1"
            >
              <span>Câu hỏi tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onFinishQuiz}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 text-white font-bold text-xs md:text-sm shadow-lg transition-all flex items-center gap-1"
            >
              <span>HOÀN THÀNH BÀI LÀM 🏆</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
