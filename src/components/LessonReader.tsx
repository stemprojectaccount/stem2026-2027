import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Sparkles, 
  Save,
  PenTool,
  Trophy,
  Activity,
  Award
} from "lucide-react";
import { Lesson } from "../types";

interface LessonReaderProps {
  lesson: Lesson;
  onBack: () => void;
  onUpdateNotes: (lessonId: string, notes: string) => void;
  onToggleComplete: (lessonId: string) => void;
  onStartQuizFromLesson: (lesson: Lesson) => void;
}

export default function LessonReader({ 
  lesson, 
  onBack, 
  onUpdateNotes, 
  onToggleComplete,
  onStartQuizFromLesson
}: LessonReaderProps) {
  const [notes, setNotes] = useState(lesson.notes || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Debounce saving notes to local storage
  useEffect(() => {
    setNotes(lesson.notes || "");
  }, [lesson]);

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

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Back button & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Complete toggle */}
          <button
            onClick={() => onToggleComplete(lesson.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              lesson.completed
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10"
            }`}
          >
            <CheckCircle className={`w-4 h-4 ${lesson.completed ? "text-emerald-600 fill-emerald-100" : "text-white"}`} />
            <span>{lesson.completed ? "Đã học xong! 🎉" : "Đánh dấu đã hoàn thành"}</span>
          </button>

          {/* Test button */}
          <button
            onClick={() => onStartQuizFromLesson(lesson)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-100 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4 text-yellow-200 animate-spin-slow" />
            <span>Làm Bài Kiểm Tra</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Lesson contents on the left, Notepad on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: The Lesson Board (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 items-center text-xs mb-6">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg border border-indigo-100">
              {lesson.bookName}
            </span>
            <span className="px-2.5 py-1 bg-violet-50 text-violet-700 font-extrabold rounded-lg border border-violet-100">
              {lesson.grade}
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-extrabold rounded-lg border border-amber-100">
              {lesson.curriculum}
            </span>
            <span className="ml-auto px-2.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold rounded-lg border border-emerald-100 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đã Lưu Ngoại Tuyến 💾</span>
            </span>
          </div>

          {/* Dynamic Content Display */}
          <div className="prose-custom">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="font-display font-extrabold text-2xl md:text-3xl text-slate-800 border-b border-slate-100 pb-3 mt-6 mb-4 leading-tight" {...props} />,
                h2: ({node, ...props}) => <h2 className="font-display font-bold text-xl md:text-2xl text-slate-800 mt-6 mb-3 flex items-center gap-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="font-display font-semibold text-lg text-slate-800 mt-5 mb-2" {...props} />,
                p: ({node, ...props}) => <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-4 font-normal" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="my-6 p-4 md:p-5 bg-gradient-to-r from-indigo-50 to-violet-50/50 border-l-4 border-indigo-500 rounded-r-2xl shadow-sm text-indigo-950 font-medium italic text-sm md:text-base" {...props} />
                ),
                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-600 text-sm md:text-base" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-slate-600 text-sm md:text-base" {...props} />,
                li: ({node, ...props}) => <li className="marker:text-indigo-500 pl-1" {...props} />,
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-6 border border-slate-100 rounded-xl shadow-sm">
                    <table className="w-full text-left border-collapse text-sm text-slate-600" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100" {...props} />,
                th: ({node, ...props}) => <th className="p-3 font-semibold" {...props} />,
                td: ({node, ...props}) => <td className="p-3 border-b border-slate-50" {...props} />,
                hr: ({node, ...props}) => <hr className="border-t border-slate-100 my-6" {...props} />,
                code: ({node, ...props}) => (
                  <code className="bg-slate-50 text-indigo-600 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200" {...props} />
                )
              }}
            >
              {lesson.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Right: Personal Notepad Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-slate-900 text-white rounded-[2rem] p-5 border border-slate-800 shadow-md flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">Sổ tay ghi nhớ</h3>
                    <p className="text-[10px] text-slate-400">Ghi chú nhanh kiến thức tự học</p>
                  </div>
                </div>
                
                {/* Visual save indicators */}
                <div className="text-[11px] font-semibold">
                  {saveStatus === "saving" && (
                    <span className="text-indigo-400 animate-pulse flex items-center gap-1">
                      🌀 Đang lưu...
                    </span>
                  )}
                  {saveStatus === "saved" && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      ✅ Đã tự lưu!
                    </span>
                  )}
                  {saveStatus === "idle" && (
                    <span className="text-slate-500 flex items-center gap-1">
                      <Save className="w-3.5 h-3.5" /> Chờ nhập
                    </span>
                  )}
                </div>
              </div>

              <textarea
                placeholder="Hãy viết lại các công thức, mẹo ghi nhớ hoặc từ khóa của riêng em vào đây. Ghi chú sẽ tự động được lưu trữ trực tuyến..."
                value={notes}
                onChange={handleNotesChange}
                rows={12}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-slate-200 text-xs leading-relaxed resize-none shadow-inner placeholder:text-slate-600"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ghi chép giúp tăng khả năng ghi nhớ kiến thức thêm 70%! Cố lên em nhé!</span>
            </div>
          </div>

          {/* AI Extra motivators card */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100/60 p-4 text-center">
            <span className="text-2xl block mb-1">🎓</span>
            <span className="font-bold text-xs text-indigo-950 block mb-1">Ôn tập thông minh</span>
            <p className="text-[10px] text-indigo-700 leading-relaxed">
              Nhớ ghi chép đầy đủ sau đó bấm nút <strong>Làm Bài Kiểm Tra</strong> để hệ thống tự thiết kế các câu đố thách thức dựa trên bài học này nhé!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
