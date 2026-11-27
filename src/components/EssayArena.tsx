import React, { useState } from "react";
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Award, 
  Send, 
  BookOpen, 
  ChevronRight, 
  Check, 
  X, 
  Sliders, 
  Zap, 
  HelpCircle,
  Lightbulb,
  Maximize2
} from "lucide-react";
import { EssayTest, EssayQuestion, EssayGradeResult } from "../types";
import MathText from "./MathText";

interface EssayArenaProps {
  onEarnCoins?: (amount: number) => void;
  onEarnXp?: (amount: number) => void;
  onBackToHome?: () => void;
}

const PRESET_ESSAY_TOPICS = [
  {
    topic: "Toán học - Phương trình bậc hai và Hệ thức Viète",
    sub_topic: "Ứng dụng hệ thức Viète để tìm điều kiện tham số m cho hai nghiệm trái dấu",
    difficulty: "Vận dụng",
    count: 2,
    icon: "📐"
  },
  {
    topic: "Ngữ văn - Nghị luận xã hội",
    sub_topic: "Bàn về tinh thần tự học và vượt khó của thế hệ học sinh trong kỷ nguyên số",
    difficulty: "Thông hiểu và Vận dụng",
    count: 2,
    icon: "✍️"
  },
  {
    topic: "Khoa học Tự nhiên - Cơ học và Chuyển động",
    sub_topic: "Phân tích định luật bảo toàn năng lượng trong chuyển động rơi tự do",
    difficulty: "Vận dụng cao",
    count: 2,
    icon: "🔬"
  },
  {
    topic: "Lịch sử và Địa lý - Văn minh Đại Việt",
    sub_topic: "Phân tích nguyên nhân thắng lợi của cuộc kháng chiến chống quân Nguyên Mông",
    difficulty: "Vận dụng",
    count: 2,
    icon: "📜"
  }
];

const DEFAULT_SAMPLE_ESSAY_TEST: EssayTest = {
  metadata: {
    selected_topic: "Toán học - Phương trình bậc hai và Hệ thức Viète",
    sub_topic: "Ứng dụng hệ thức Viète để tìm điều kiện tham số m",
    difficulty: "Vận dụng",
    total_score: 10
  },
  questions: [
    {
      id: 1,
      cognitive_level: "Thông hiểu và Vận dụng",
      question: "Cho phương trình bậc hai: $x^2 - 2(m - 1)x + m^2 - 3 = 0$ (với $m$ là tham số).\na) Tìm điều kiện của $m$ để phương trình luôn có hai nghiệm phân biệt $x_1, x_2$.\nb) Áp dụng định lý Viète, hãy tìm $m$ để hai nghiệm thỏa mãn biểu thức: $x_1^2 + x_2^2 = 10$.",
      max_score: 5.0,
      sample_answer: "a) Xét biệt thức $\\Delta' = [-(m - 1)]^2 - (m^2 - 3) = m^2 - 2m + 1 - m^2 + 3 = 4 - 2m$.\nĐể phương trình có 2 nghiệm phân biệt thì $\\Delta' > 0 \\Leftrightarrow 4 - 2m > 0 \\Leftrightarrow m < 2$.\nb) Theo hệ thức Viète, ta có:\n$x_1 + x_2 = 2(m - 1)$\n$x_1 \\cdot x_2 = m^2 - 3$\nTa có biến đổi: $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2$.\nThay vào: $[2(m - 1)]^2 - 2(m^2 - 3) = 10$\n$\\Leftrightarrow 4(m^2 - 2m + 1) - 2m^2 + 6 = 10$\n$\\Leftrightarrow 2m^2 - 8m + 10 = 10$\n$\\Leftrightarrow 2m(m - 4) = 0 \\Leftrightarrow m = 0$ hoặc $m = 4$.\nĐối chiếu điều kiện $m < 2$, ta loại $m = 4$ và nhận $m = 0$.\nVậy $m = 0$ là giá trị thỏa mãn đề bài.",
      rubric: [
        {
          criteria: "Tính đúng biệt thức Delta (hoặc Delta') và suy ra điều kiện m < 2",
          points: 2.0,
          keywords: ["Delta", "4 - 2m", "m < 2", "nghiệm phân biệt"]
        },
        {
          criteria: "Viết đúng hệ thức Viète cho tổng và tích hai nghiệm",
          points: 1.0,
          keywords: ["Viète", "x1 + x2", "x1 * x2", "2(m-1)", "m^2 - 3"]
        },
        {
          criteria: "Biến đổi x1^2 + x2^2 thành (x1 + x2)^2 - 2x1x2 và giải phương trình tìm m",
          points: 1.5,
          keywords: ["(x1 + x2)^2 - 2x1x2", "2m^2 - 8m = 0", "m = 0", "m = 4"]
        },
        {
          criteria: "Đối chiếu điều kiện m < 2, kết luận chính xác m = 0",
          points: 0.5,
          keywords: ["đối chiếu", "loại m = 4", "kết luận m = 0"]
        }
      ]
    },
    {
      id: 2,
      cognitive_level: "Vận dụng cao",
      question: "Chứng minh rằng với mọi số thực $a, b, c > 0$, ta luôn có bất đẳng thức: $\\frac{a}{b + c} + \\frac{b}{c + a} + \\frac{c}{a + b} \\ge \\frac{3}{2}$ (Bất đẳng thức Nesbitt). Nêu rõ dấu đẳng thức xảy ra khi nào.",
      max_score: 5.0,
      sample_answer: "Cộng 3 vào cả hai vế của bất đẳng thức, ta được:\n$(\\frac{a}{b + c} + 1) + (\\frac{b}{c + a} + 1) + (\\frac{c}{a + b} + 1) \\ge \\frac{3}{2} + 3 = \\frac{9}{2}$\n$\\Leftrightarrow \\frac{a + b + c}{b + c} + \\frac{a + b + c}{c + a} + \\frac{a + b + c}{a + b} \\ge \\frac{9}{2}$\n$\\Leftrightarrow (a + b + c) \\left( \\frac{1}{b + c} + \\frac{1}{c + a} + \\frac{1}{a + b} \\right) \\ge \\frac{9}{2}$\n$\\Leftrightarrow [(b + c) + (c + a) + (a + b)] \\left( \\frac{1}{b + c} + \\frac{1}{c + a} + \\frac{1}{a + b} \\right) \\ge 9$.\nÁp dụng bất đẳng thức Cauchy-Schwarz dạng Engel (hoặc BĐT AM-GM cho 3 số dương): $(x + y + z)(\\frac{1}{x} + \\frac{1}{y} + \\frac{1}{z}) \\ge 9$ với $x = b + c, y = c + a, z = a + b > 0$, bất đẳng thức luôn đúng.\nDấu đẳng thức xảy ra khi và chỉ khi $x = y = z \\Leftrightarrow a = b = c$.",
      rubric: [
        {
          criteria: "Cộng thêm 3 hoặc đặt ẩn phụ x = b+c, y = c+a, z = a+b chính xác",
          points: 2.0,
          keywords: ["cộng 3", "a + b + c", "đặt ẩn phụ", "9/2"]
        },
        {
          criteria: "Áp dụng đúng bất đẳng thức Cauchy-Schwarz hoặc AM-GM cho 3 số",
          points: 2.0,
          keywords: ["Cauchy-Schwarz", "AM-GM", ">= 9", "bất đẳng thức"]
        },
        {
          criteria: "Chỉ ra chính xác điều kiện dấu bằng xảy ra khi a = b = c",
          points: 1.0,
          keywords: ["dấu đẳng thức", "a = b = c", "x = y = z"]
        }
      ]
    }
  ]
};

export const EssayArena: React.FC<EssayArenaProps> = ({
  onEarnCoins,
  onEarnXp,
  onBackToHome
}) => {
  // Configurator state
  const [topic, setTopic] = useState("Toán học - Phương trình bậc hai và Hệ thức Viète");
  const [subTopic, setSubTopic] = useState("Ứng dụng hệ thức Viète để tìm điều kiện tham số m");
  const [difficulty, setDifficulty] = useState("Vận dụng");
  const [count, setCount] = useState(2);

  // App & Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState<EssayTest>(DEFAULT_SAMPLE_ESSAY_TEST);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Student writing submissions per question
  const [submissions, setSubmissions] = useState<Record<number, string>>({});
  
  // Grading states
  const [isGrading, setIsGrading] = useState<Record<number, boolean>>({});
  const [gradeResults, setGradeResults] = useState<Record<number, EssayGradeResult>>({});
  const [showSampleAnswer, setShowSampleAnswer] = useState<Record<number, boolean>>({});
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeBanner(msg);
    setTimeout(() => setNoticeBanner(null), 4000);
  };

  // Generate new Essay test
  const handleGenerateEssayTest = async () => {
    setIsLoading(true);
    setSubmissions({});
    setGradeResults({});
    setShowSampleAnswer({});
    setActiveQuestionIndex(0);

    try {
      const response = await fetch("/api/generate-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          sub_topic: subTopic,
          difficulty,
          count
        })
      });

      if (!response.ok) {
        throw new Error("Không thể tạo đề tự luận lúc này");
      }

      const data = await response.json();
      if (data.success && data.test) {
        setCurrentTest(data.test);
      }
    } catch (err: any) {
      console.error("Lỗi tạo đề tự luận:", err);
      showNotice("Đang dùng bộ đề tự luận chuẩn mực sẵn có do kết nối mạng bận.");
    } finally {
      setIsLoading(false);
    }
  };

  // Grade student essay using AI
  const handleGradeSubmission = async (question: EssayQuestion) => {
    const studentText = submissions[question.id];
    if (!studentText || studentText.trim().length < 15) {
      showNotice("Vui lòng viết ít nhất 15 ký tự cho bài giải trước khi gửi chấm.");
      return;
    }

    setIsGrading((prev) => ({ ...prev, [question.id]: true }));

    try {
      const response = await fetch("/api/grade-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          sample_answer: question.sample_answer,
          rubric: question.rubric,
          student_submission: studentText,
          max_score: question.max_score
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi khi chấm bài");
      }

      const data = await response.json();
      if (data.success && data.result) {
        setGradeResults((prev) => ({
          ...prev,
          [question.id]: {
            ...data.result,
            question_id: question.id
          }
        }));

        // Award reward coins and XP based on earned score
        const score = data.result.earned_score || 0;
        if (onEarnCoins) onEarnCoins(Math.round(score * 3) + 10);
        if (onEarnXp) onEarnXp(Math.round(score * 10) + 25);
      }
    } catch (err: any) {
      console.error("Lỗi chấm bài:", err);
      showNotice("Không thể hoàn tất chấm điểm với AI lúc này. Vui lòng thử lại!");
    } finally {
      setIsGrading((prev) => ({ ...prev, [question.id]: false }));
    }
  };

  const currentQ = currentTest.questions[activeQuestionIndex] || currentTest.questions[0];
  const currentGrade = currentQ ? gradeResults[currentQ.id] : null;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {noticeBanner && (
        <div role="status" className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between gap-3">
          <span>{noticeBanner}</span>
          <button type="button" onClick={() => setNoticeBanner(null)} className="text-amber-700 hover:text-amber-950 font-extrabold cursor-pointer">Đóng</button>
        </div>
      )}
      
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Luyện đề tự luận và chấm điểm
            </h1>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              Tạo câu hỏi tự luận bám sát 100% chuyên đề, tích hợp thang điểm Rubric rõ ràng và công cụ chấm bài tự động bằng AI giúp học sinh nắm vững phương pháp giải chuẩn mực.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
              >
                Về trang chủ
              </button>
            )}
            <button
              type="button"
              onClick={handleGenerateEssayTest}
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>AI đang soạn đề tự luận...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-white" />
                  <span>Tạo đề tự luận mới</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Chuyên đề trọng tâm gợi ý:</span>
          {PRESET_ESSAY_TOPICS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setTopic(p.topic);
                setSubTopic(p.sub_topic);
                setDifficulty(p.difficulty);
                setCount(p.count);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 transition-all cursor-pointer"
            >
              <span>{p.icon}</span>
              <span>{p.topic.split("-")[0].trim()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Configuration Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Cấu hình đề tự luận</h3>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            Tổng điểm đề: {currentTest.metadata.total_score || 10} điểm
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Chủ đề trọng tâm (Topic)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Toán học - Định lý Viète, Ngữ văn - Cảm thụ thơ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Khía cạnh / Dạng bài</label>
            <input
              type="text"
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              placeholder="VD: Tìm tham số m, Chứng minh BĐT..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cấp độ tư duy</label>
              <select
                aria-label="Cấp độ tư duy"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none text-slate-800 text-xs"
              >
                <option value="Thông hiểu">Thông hiểu</option>
                <option value="Vận dụng">Vận dụng</option>
                <option value="Vận dụng cao">Vận dụng cao</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Số câu hỏi</label>
              <select
                aria-label="Số câu hỏi"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none text-slate-800 text-xs"
              >
                <option value={1}>1 câu</option>
                <option value={2}>2 câu</option>
                <option value={3}>3 câu</option>
                <option value={4}>4 câu</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Question Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {currentTest.questions.map((q, idx) => {
          const isActive = idx === activeQuestionIndex;
          const hasGraded = !!gradeResults[q.id];
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setActiveQuestionIndex(idx)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <span>Câu {idx + 1} ({q.max_score}đ)</span>
              {hasGraded && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                }`}>
                  Đã chấm: {gradeResults[q.id].earned_score}đ
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Active Question Workspace */}
      {currentQ && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Question Prompt & Official Rubric (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Question Details Card */}
            <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Câu hỏi {activeQuestionIndex + 1} • {currentQ.cognitive_level}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full">
                  Thang điểm: {currentQ.max_score} điểm
                </span>
              </div>

              {/* Question Text with Math rendering */}
              <div className="text-slate-900 font-semibold text-base leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                <MathText content={currentQ.question} />
              </div>

              {/* Rubric Criteria Checklist */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Award className="w-4 h-4 text-blue-600" />
                  Tiêu Chí Chấm Điểm Chuẩn Hóa (Rubric)
                </h4>

                <div className="space-y-2">
                  {currentQ.rubric.map((r, rIdx) => (
                    <div key={rIdx} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-blue-950">
                        <span>Ý {rIdx + 1}: {r.criteria}</span>
                        <span className="text-blue-700 shrink-0 ml-2">+{r.points} điểm</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] text-slate-500 font-medium">Từ khóa cần có:</span>
                        {r.keywords.map((kw, kwIdx) => (
                          <span key={kwIdx} className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px] font-semibold text-blue-800">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Sample Answer Accordion */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSampleAnswer((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>{showSampleAnswer[currentQ.id] ? "Ẩn đáp án mẫu chuẩn mực" : "Xem đáp án mẫu chuẩn mực"}</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showSampleAnswer[currentQ.id] ? "rotate-90" : ""}`} />
                </button>

                {showSampleAnswer[currentQ.id] && (
                  <div className="mt-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-slate-800 leading-relaxed space-y-2 animate-fade-in">
                    <span className="font-bold text-emerald-900 block">Lời giải mẫu chuẩn sư phạm:</span>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200/60 font-sans">
                      <MathText content={currentQ.sample_answer} />
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Right Column: Student Writing Area & AI Grading Result (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Writing Area Card */}
            <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6 space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">Bài làm của em</h3>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {submissions[currentQ.id]?.trim() ? `${submissions[currentQ.id].trim().split(/\s+/).length} từ` : "Chưa nhập"}
                </div>
              </div>

              {/* Textarea for essay writing */}
              <div className="space-y-2">
                <textarea
                  rows={10}
                  value={submissions[currentQ.id] || ""}
                  onChange={(e) => setSubmissions({ ...submissions, [currentQ.id]: e.target.value })}
                  placeholder="Học sinh trình bày lời giải chi tiết, các bước lập luận, tính toán hoặc bài văn phân tích tại đây..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 leading-relaxed outline-none focus:bg-white focus:border-blue-600 transition-all font-sans"
                />
                <p className="text-[11px] text-slate-400 italic">
                  {"Mẹo: Bạn có thể viết công thức Toán dạng $x^2$, $\\frac{a}{b}$, hoặc viết các bước lập luận rõ ràng để AI chấm chuẩn xác theo từng ý."}
                </p>
              </div>

              {/* Submit to AI Grader Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleGradeSubmission(currentQ)}
                  disabled={isGrading[currentQ.id]}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isGrading[currentQ.id] ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>AI đang chấm theo rubric...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>Chấm điểm bằng AI</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* AI Grading Report (When available) */}
            {currentGrade && (
              <div className="bg-white rounded-3xl border border-blue-200 shadow-md p-6 space-y-6 animate-slide-in">
                
                {/* Result Header & Score Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-5 rounded-2xl border border-blue-100">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                      Kết quả chấm
                    </span>
                    <h4 className="text-lg font-bold text-slate-900">
                      Điểm số và nhận xét
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-semibold block">Điểm đạt được</span>
                      <div className="text-2xl sm:text-3xl font-black text-blue-700 tabular-nums">
                        {currentGrade.earned_score} <span className="text-sm font-semibold text-slate-400">/ {currentGrade.max_score}đ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rubric Breakdown by Criteria */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    Điểm từng ý theo rubric
                  </h5>

                  <div className="space-y-3">
                    {currentGrade.rubric_evaluations?.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{item.criteria}</span>
                          <span className={`font-black px-2 py-0.5 rounded-full text-xs ${
                            item.earned_points === item.max_points
                              ? "bg-emerald-100 text-emerald-800"
                              : item.earned_points > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {item.earned_points} / {item.max_points} điểm
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.feedback}
                        </p>

                        {/* Keyword Matches & Misses */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {item.matched_keywords && item.matched_keywords.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Đã nêu:
                              </span>
                              {item.matched_keywords.map((kw, ki) => (
                                <span key={ki} className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[10px] font-medium">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.missing_keywords && item.missing_keywords.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                                <AlertCircle className="w-3 h-3" /> Cần bổ sung:
                              </span>
                              {item.missing_keywords.map((kw, ki) => (
                                <span key={ki} className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[10px] font-medium">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Điểm sáng trong bài làm
                    </span>
                    <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside">
                      {currentGrade.strengths?.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      Gợi ý để nâng điểm
                    </span>
                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                      {currentGrade.improvements?.map((im, i) => (
                        <li key={i}>{im}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* General Teacher Feedback */}
                {currentGrade.general_feedback && (
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1 text-xs">
                    <span className="font-bold text-blue-900 block">Lời nhận xét sư phạm từ AI:</span>
                    <p className="text-slate-700 leading-relaxed italic">
                      "{currentGrade.general_feedback}"
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default EssayArena;
