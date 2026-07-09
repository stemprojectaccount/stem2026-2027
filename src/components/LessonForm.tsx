import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  GraduationCap, 
  BookOpen, 
  Search,
  Check
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
  { bookName: "Lịch sử & Địa lý 7", grade: "Lớp 7", curriculum: "Chân trời sáng tạo", topic: "Vương quốc Phù Nam cổ đại", emoji: "🏰" },
  { bookName: "Tiếng Anh 8", grade: "Lớp 8", curriculum: "Global Success", topic: "Life in the countryside (Cuộc sống làng quê)", emoji: "🌾" }
];

const CURRICULUMS = [
  "Kết nối tri thức với cuộc sống",
  "Cánh diều",
  "Chân trời sáng tạo",
  "Chương trình phổ thông chuẩn"
];

const GRADES = [
  "Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5",
  "Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9",
  "Lớp 10", "Lớp 11", "Lớp 12"
];

const LOADING_MESSAGES = [
  "🤖 Gemini AI đang mở tủ sách khổng lồ tìm tài liệu...",
  "✨ Đang rắc gia vị hài hước và hình minh họa siêu ngầu vào bài học...",
  "🦖 Đang mượn cỗ máy thời gian quay về thời khủng long lấy kiến thức thực tế...",
  "🧠 Đang kích hoạt 100% công suất não bộ để biên soạn bài siêu ngắn gọn...",
  "🌟 Đang chuyển hóa kiến thức khô khan thành phong cách TikTok triệu view...",
  "🌈 Chuẩn bị sẵn sàng nhé, bài học đỉnh cao sắp xuất hiện rồi!"
];

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
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Header with custom animated glow */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-100">
          <Sparkles className="w-9 h-9 text-white animate-spin-slow" />
        </div>
        <h2 className="font-display font-black text-2xl md:text-3xl text-slate-800 tracking-tight">
          Soạn Giáo Án Cực Ngầu Bằng AI
        </h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Nhập tên sách, lớp và nội dung em muốn học. AI Gemini sẽ lập tức thiết kế một bài học siêu sinh động, trực quan để tiếp thu cực nhanh!
        </p>
      </div>

      {loading ? (
        /* Loading animation screen */
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl shadow-indigo-50/50 space-y-8 animate-pulse-slow">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <div className="absolute inset-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-display font-bold text-slate-800 text-lg">AI đang làm việc cật lực...</h3>
            <p className="text-indigo-600 font-bold text-sm min-h-[40px] px-4 max-w-md mx-auto">
              "{LOADING_MESSAGES[loadingTextIndex]}"
            </p>
          </div>

          <div className="w-full max-w-xs bg-slate-100 h-2.5 rounded-full mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full animate-pulse" style={{ width: "85%" }} />
          </div>

          <p className="text-slate-400 text-xs font-bold">Thông thường quá trình này mất khoảng 5-15 giây thôi nhé!</p>
        </div>
      ) : (
        /* Input Form */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Form Fields */}
          <form onSubmit={handleSubmit} className="md:col-span-8 bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                1. Tên Cuốn Sách / Môn Học <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Toán học 6, Lịch sử 7, Vật lý 10..."
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  className="w-full px-4 py-3.5 pl-11 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-inner"
                />
                <BookOpen className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  2. Khối Lớp
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  3. Chương Trình Học
                </label>
                <select
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                >
                  {CURRICULUMS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                4. Chủ Đề Muốn Soạn (Tùy chọn)
              </label>
              <textarea
                placeholder="Ví dụ: Chương 1 bài 2 về phép nhân số nguyên tố, hay bài quang hợp ở thực vật, hoặc để trống để AI tự động soạn bài hay nhất chương trình!"
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!bookName.trim()}
              className={`w-full py-4 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                bookName.trim()
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 text-white shadow-indigo-500/20"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <Sparkles className="w-5 h-5 text-yellow-200 animate-spin-slow" />
              <span>BẮT ĐẦU SOẠN BÀI MỚI NGAY 🚀</span>
            </button>
          </form>

          {/* Preset Topics Sidebar (4 Cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-[2rem] border border-slate-200/60 p-5">
              <h3 className="font-display font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
                <GraduationCap className="text-indigo-600 w-4 h-4" />
                Dùng thử bài mẫu của AI
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Nếu chưa biết nhập gì, hãy bấm một trong các gợi ý siêu hấp dẫn bên dưới để trải nghiệm ngay:
              </p>
              
              <div className="space-y-2.5">
                {PRESET_TOPICS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => selectPreset(preset)}
                    className="w-full text-left p-3.5 rounded-xl border border-white bg-white hover:border-indigo-200 hover:bg-indigo-50/30 shadow-sm transition-all flex items-start gap-3 group"
                  >
                    <span className="text-2xl mt-0.5 shrink-0">{preset.emoji}</span>
                    <div className="overflow-hidden">
                      <span className="font-bold text-xs text-slate-700 block group-hover:text-indigo-600 transition-colors">
                        {preset.topic}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {preset.bookName} • {preset.grade}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                * Toàn bộ giáo án được soạn bằng trí tuệ nhân tạo Gemini AI tiên tiến nhất, tinh gọn thông minh giúp học sinh ghi nhớ cực nhanh!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
