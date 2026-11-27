import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen
} from "lucide-react";

interface LessonFormProps {
  onGenerateLesson: (formData: {
    bookName: string;
    grade: string;
    curriculum: string;
    topicDescription: string;
  }) => Promise<void>;
  loading: boolean;
}

const PRESET_TOPICS = [
  { bookName: "Toán học 6", grade: "Lớp 6", curriculum: "Kết nối tri thức", topic: "Số nguyên tố và hợp số", emoji: "🔢" },
  { bookName: "Khoa học Tự nhiên 7", grade: "Lớp 7", curriculum: "Cánh diều", topic: "Quang hợp ở thực vật", emoji: "🌱" },
  { bookName: "Lịch sử và Địa lý 7", grade: "Lớp 7", curriculum: "Chân trời sáng tạo", topic: "Vương quốc Phù Nam cổ đại", emoji: "🏰" },
  { bookName: "Tiếng Anh 8", grade: "Lớp 8", curriculum: "Global Success", topic: "Life in the countryside (Cuộc sống làng quê)", emoji: "🌾" }
];

const CURRICULUMS = [
  "Kết nối tri thức với cuộc sống",
  "Cánh diều",
  "Chân trời sáng tạo",
  "Chương trình phổ thông chuẩn"
];

const GRADES = [
  "Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"
];

const LOADING_MESSAGES = [
  "Đang đối chiếu khung chương trình sách giáo khoa THCS...",
  "Đang tổng hợp định nghĩa cốt lõi, ví dụ minh họa và công thức trọng tâm...",
  "Đang thiết kế sơ đồ ý chính và các bước giải bài tập mẫu...",
  "Đang biên soạn hệ thống câu hỏi tự kiểm tra bám sát bài học...",
  "Đang kiểm tra độ chính xác của thuật ngữ và ký hiệu toán học...",
  "Bài học đang hoàn tất, sẵn sàng để em bắt đầu ôn luyện!"
];

function getSubjectMonogram(bookName: string): string {
  const lower = bookName.toLowerCase();
  if (lower.includes("toán")) return "TOÁN";
  if (lower.includes("khoa học")) return "KHTN";
  if (lower.includes("lịch sử") || lower.includes("địa lý")) return "SỬ-ĐỊA";
  if (lower.includes("tiếng anh") || lower.includes("english")) return "ANH";
  return "MÔN";
}

export default function LessonForm({ onGenerateLesson, loading }: LessonFormProps) {
  const [bookName, setBookName] = useState("");
  const [grade, setGrade] = useState("Lớp 6");
  const [curriculum, setCurriculum] = useState("Kết nối tri thức với cuộc sống");
  const [topicDescription, setTopicDescription] = useState("");
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  // Rotate loading text every 3.5 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim()) return;
    onGenerateLesson({
      bookName,
      grade,
      curriculum,
      topicDescription
    });
  };

  const selectPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setBookName(preset.bookName);
    setGrade(preset.grade);
    setCurriculum(preset.curriculum);
    setTopicDescription(preset.topic);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
            Tự học và Ghi chú thông minh AI
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
            Nhập tên môn học hoặc chuyên đề em muốn hiểu sâu. Hệ thống SmartStudy sẽ tóm tắt kiến thức cốt lõi, sơ đồ ý chính và phương pháp giải bài tập theo chuẩn chương trình THCS.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-blue-600 animate-spin-slow" />
        </div>
      </div>

      {loading ? (
        /* Loading animation screen */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 md:p-12 text-center space-y-6 shadow-xs animate-pulse-slow">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
            <div className="absolute inset-2 bg-blue-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-display font-bold text-slate-900 text-lg">
              SmartStudy đang tổng hợp kiến thức trọng tâm cho em...
            </h3>
            <p className="text-blue-700 font-semibold text-sm min-h-[40px] px-4 max-w-md mx-auto">
              "{LOADING_MESSAGES[loadingTextIndex]}"
            </p>
          </div>

          <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full mx-auto overflow-hidden border border-slate-200/80">
            <div className="bg-blue-600 h-full animate-pulse" style={{ width: "85%" }} />
          </div>

          <p className="text-slate-500 text-xs font-medium">
            Hệ thống đang tổng hợp kiến thức trọng tâm và mẹo giải bài cho em (khoảng 5–10 giây).
          </p>
        </div>
      ) : (
        /* Input Form */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Main Form Fields */}
          <form onSubmit={handleSubmit} className="md:col-span-8 bg-white border border-slate-200/90 p-6 md:p-7 rounded-2xl shadow-2xs space-y-5">
            <div className="space-y-2">
              <label htmlFor="lesson-book-name" className="text-xs font-bold text-slate-800 block">
                1. Tên sách giáo khoa hoặc môn học <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="lesson-book-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Toán học 6, Khoa học tự nhiên 6, Tiếng Anh 6..."
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-3 pl-11 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-base"
                />
                <BookOpen className="w-5 h-5 text-blue-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="lesson-grade" className="text-xs font-bold text-slate-800 block">
                  2. Khối lớp
                </label>
                <select
                  id="lesson-grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-base cursor-pointer"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g} className="bg-white text-slate-900">{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="lesson-curriculum" className="text-xs font-bold text-slate-800 block">
                  3. Bộ sách giáo khoa
                </label>
                <select
                  id="lesson-curriculum"
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-base cursor-pointer"
                >
                  {CURRICULUMS.map((c) => (
                    <option key={c} value={c} className="bg-white text-slate-900">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="lesson-topic-desc" className="text-xs font-bold text-slate-800 block">
                4. Chủ đề hoặc bài học cụ thể cần ôn tập (Tùy chọn)
              </label>
              <textarea
                id="lesson-topic-desc"
                placeholder="Ví dụ: Số nguyên tố và hợp số, Quy tắc dấu ngoặc, hoặc để trống để hệ thống gợi ý nội dung trọng tâm..."
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!bookName.trim()}
              className={`w-full min-h-[48px] py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                bookName.trim()
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Bắt đầu học và Tóm tắt kiến thức ngay</span>
            </button>
          </form>

          {/* Preset Topics Sidebar (4 Cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                <GraduationCap className="text-blue-600 w-4 h-4 shrink-0" />
                <span>Chuyên đề gợi ý ôn tập</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chọn nhanh một chuyên đề mẫu bên dưới để tự động điền thông tin:
              </p>
              
              <div className="space-y-2 pt-1">
                {PRESET_TOPICS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-start gap-3 group cursor-pointer"
                  >
                    <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-mono text-[10px] font-bold text-blue-700 shrink-0 mt-0.5">
                      {getSubjectMonogram(preset.bookName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-slate-900 block group-hover:text-blue-700 transition-colors line-clamp-2">
                        {preset.topic}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                        {preset.bookName} • {preset.grade}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Mỗi bài học tạo ra đều bao gồm lý thuyết trọng tâm, ví dụ minh họa từng bước và câu hỏi trắc nghiệm củng cố.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
