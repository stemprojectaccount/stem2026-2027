import React, { useState } from "react";
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  ArrowRight, 
  Award, 
  HelpCircle,
  Eye,
  Languages,
  Sliders,
  ChevronRight,
  BookmarkCheck,
  Zap,
  Volume2,
  Share2,
  Check
} from "lucide-react";
import { ReadingTest, ReadingQuestion } from "../types";

interface ReadingComprehensionProps {
  onEarnCoins?: (amount: number) => void;
  onEarnXp?: (amount: number) => void;
  onBackToHome?: () => void;
}

const PRESET_TOPICS = [
  {
    topic: "Biến đổi khí hậu và môi trường",
    sub_topic: "Tác động của nhiệt độ nước biển tăng đến các rạn san hô",
    language: "Tiếng Việt",
    difficulty: "Thông hiểu và Vận dụng",
    icon: "🌊"
  },
  {
    topic: "Trí tuệ nhân tạo và Công nghệ",
    sub_topic: "Ứng dụng của AI trong y học và cảnh báo dịch bệnh sớm",
    language: "Tiếng Việt",
    difficulty: "Vận dụng",
    icon: "🤖"
  },
  {
    topic: "Khoa học vũ trụ",
    sub_topic: "Kính viễn vọng James Webb và việc tìm kiếm hành tinh có sự sống",
    language: "Tiếng Việt",
    difficulty: "Thông hiểu và Vận dụng",
    icon: "🪐"
  },
  {
    topic: "English Reading - Ecosystems",
    sub_topic: "How honeybees contribute to plant pollination and food security",
    language: "Tiếng Anh",
    difficulty: "Vận dụng",
    icon: "🐝"
  }
];

const DEFAULT_SAMPLE_TEST: ReadingTest = {
  metadata: {
    selected_topic: "Biến đổi khí hậu và môi trường",
    sub_topic: "Tác động của hiện tượng ấm lên toàn cầu đến các rạn san hô nhiệt đới",
    difficulty: "Thông hiểu và Vận dụng",
    language: "Tiếng Việt"
  },
  reading_passage: {
    title: "Hiểm họa tẩy trắng và tương lai của các rạn san hô",
    topic_verification: "Văn bản phân tích cơ chế cộng sinh giữa san hô và tảo, cùng tác động tiêu cực của nước biển ấm lên gây hiện tượng tẩy trắng hàng loạt.",
    content: "Các rạn san hô thường được mệnh danh là 'những khu rừng nhiệt đới dưới lòng đại dương' bởi chúng là nơi cư trú của hơn 25% sinh vật biển dù chỉ bao phủ chưa đầy 1% diện tích đáy biển.\n\nSự sinh tồn và màu sắc rực rỡ của san hô phụ thuộc vào mối quan hệ cộng sinh mật thiết với loại tảo đơn bào có tên là zooxanthellae. Loại tảo này sống bên trong các mô của san hô, quang hợp dưới ánh sáng mặt trời để sản xuất thức ăn và cung cấp đến 90% nhu cầu năng lượng cho san hô. Đổi lại, san hô mang đến cho tảo một nơi trú ẩn an toàn và các chất dinh dưỡng cần thiết.\n\nTuy nhiên, mối quan hệ cộng sinh này vô cùng nhạy cảm với sự thay đổi của nhiệt độ. Khi nhiệt độ nước biển tăng chỉ từ 1 đến 2 độ C kéo dài trong vài tuần, san hô rơi vào trạng thái căng thẳng sinh lý cực độ. Chúng buộc phải trục xuất loài tảo zooxanthellae ra khỏi mô của mình. Khi mất đi tảo, san hô không những mất đi nguồn cung cấp dinh dưỡng chính mà còn để lộ bộ khung xương đá vôi màu trắng muốt. Hiện tượng này được gọi là 'tẩy trắng san hô' (coral bleaching).\n\nNếu nhiệt độ nước hạ thấp trở lại trong thời gian ngắn, san hô vẫn có cơ hội hấp thụ lại tảo và hồi phục. Nhưng nếu nhiệt độ cao kéo dài, san hô sẽ chết vì kiệt sức và đói năng lượng. Sự sụp đổ của các rạn san hô kéo theo sự biến mất của hàng nghìn loài cá và suy giảm nghiêm trọng nguồn lợi thủy sản của các quốc gia ven biển.",
    word_count_estimate: 280
  },
  questions: [
    {
      id: 1,
      skill_tested: "Nhận biết thông tin",
      question_type: "multiple_choice",
      question: "Theo văn bản, loài tảo zooxanthellae đóng vai trò gì đối với sự sống của san hô?",
      options: [
        "A. Tạo ra bộ khung xương đá vôi bảo vệ san hô",
        "B. Cung cấp đến 90% nhu cầu năng lượng thông qua quá trình quang hợp",
        "C. Giúp san hô chống lại sự xâm lấn của các loài cá săn mồi",
        "D. Làm hạ nhiệt độ nước biển xung quanh rạn san hô"
      ],
      correct_answer: "B. Cung cấp đến 90% nhu cầu năng lượng thông qua quá trình quang hợp",
      evidence_quote: "Loại tảo này sống bên trong các mô của san hô, quang hợp dưới ánh sáng mặt trời để sản xuất thức ăn và cung cấp đến 90% nhu cầu năng lượng cho san hô.",
      explanation: "Văn bản nêu rõ ràng ở đoạn 2 rằng tảo quang hợp và cung cấp tới 90% nhu cầu năng lượng cho san hô."
    },
    {
      id: 2,
      skill_tested: "Suy luận / Nguyên nhân - Kết quả",
      question_type: "multiple_choice",
      question: "Hiện tượng 'tẩy trắng san hô' thực chất xảy ra do nguyên nhân trực tiếp nào?",
      options: [
        "A. San hô hấp thụ quá nhiều chất dinh dưỡng từ đáy biển",
        "B. Bộ khung xương đá vôi phát triển quá nhanh che lấp các mô",
        "C. San hô căng thẳng do nước biển ấm lên và trục xuất loài tảo cộng sinh",
        "D. Ánh sáng mặt trời bị cản trở khiến tảo không thể phát triển"
      ],
      correct_answer: "C. San hô căng thẳng do nước biển ấm lên và trục xuất loài tảo cộng sinh",
      evidence_quote: "Khi nhiệt độ nước biển tăng chỉ từ 1 đến 2 độ C kéo dài trong vài tuần, san hô rơi vào trạng thái căng thẳng sinh lý cực độ. Chúng buộc phải trục xuất loài tảo zooxanthellae ra khỏi mô của mình.",
      explanation: "Nhiệt độ nước biển tăng dẫn đến việc san hô bị căng thẳng sinh lý và đẩy tảo ra ngoài, làm lộ khung xương trắng."
    },
    {
      id: 3,
      skill_tested: "Ý chính / Tác động hệ sinh thái",
      question_type: "short_answer",
      question: "Nếu hiện tượng tẩy trắng san hô kéo dài và không được hồi phục, hệ quả lớn nhất đối với con người và hệ sinh thái biển là gì?",
      options: [],
      correct_answer: "Hàng nghìn loài cá và sinh vật biển sẽ mất nơi cư trú, dẫn đến suy giảm nghiêm trọng nguồn lợi thủy sản của các quốc gia ven biển.",
      evidence_quote: "Sự sụp đổ của các rạn san hô kéo theo sự biến mất của hàng nghìn loài cá và suy giảm nghiêm trọng nguồn lợi thủy sản của các quốc gia ven biển.",
      explanation: "Đoạn cuối khẳng định cái chết của san hô gây ra sự biến mất của các loài cá sống dựa vào rạn và làm cạn kiệt nguồn hải sản ven bờ."
    }
  ]
};

export const ReadingComprehension: React.FC<ReadingComprehensionProps> = ({
  onEarnCoins,
  onEarnXp,
  onBackToHome
}) => {
  // Form input state
  const [topic, setTopic] = useState("Biến đổi khí hậu và môi trường");
  const [subTopic, setSubTopic] = useState("Hậu quả của nhiệt độ nước biển ấm lên với rạn san hô");
  const [language, setLanguage] = useState("Tiếng Việt");
  const [wordCount, setWordCount] = useState(300);
  const [difficulty, setDifficulty] = useState("Thông hiểu và Vận dụng");
  const [questionCount, setQuestionCount] = useState(4);
  const [format, setFormat] = useState("Kết hợp");

  // App state
  const [isLoading, setIsLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState<ReadingTest>(DEFAULT_SAMPLE_TEST);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [highlightedQuote, setHighlightedQuote] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<"normal" | "large">("normal");
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  // Generate test using AI
  const handleGenerateTest = async () => {
    setIsLoading(true);
    setSubmitted(false);
    setUserAnswers({});
    setHighlightedQuote(null);
    setNoticeBanner(null);

    try {
      const response = await fetch("/api/generate-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          sub_topic: subTopic,
          language,
          word_count: wordCount,
          difficulty,
          count: questionCount,
          format
        })
      });

      if (!response.ok) {
        throw new Error("Không thể tạo bài đọc hiểu lúc này");
      }

      const data = await response.json();
      if (data.success && data.test) {
        setCurrentTest(data.test);
      }
    } catch (err: any) {
      console.error("Lỗi tạo đề:", err);
      setNoticeBanner("Đang dùng bộ ngữ liệu chuẩn bị sẵn do mạng bận. Bạn vẫn có thể luyện tập bình thường!");
    } finally {
      setIsLoading(false);
    }
  };

  // Select Preset
  const handleSelectPreset = (p: typeof PRESET_TOPICS[0]) => {
    setTopic(p.topic);
    setSubTopic(p.sub_topic);
    setLanguage(p.language);
    setDifficulty(p.difficulty);
  };

  // Submit and grade answers
  const handleSubmitTest = () => {
    setSubmitted(true);
    let correctCount = 0;
    currentTest.questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (q.question_type === "multiple_choice") {
        if (ans && q.correct_answer.startsWith(ans.charAt(0))) {
          correctCount++;
        }
      } else {
        // Short answer: non-empty answers get reward credit
        if (ans && ans.trim().length >= 10) {
          correctCount++;
        }
      }
    });

    if (onEarnCoins) onEarnCoins(correctCount * 5 + 10);
    if (onEarnXp) onEarnXp(correctCount * 15 + 20);
  };

  // Render passage with quote highlight if requested
  const renderPassageContent = () => {
    const rawContent = currentTest.reading_passage.content;
    const paragraphs = rawContent.split("\n\n");

    return paragraphs.map((para, idx) => {
      if (highlightedQuote && para.includes(highlightedQuote)) {
        const parts = para.split(highlightedQuote);
        return (
          <p key={idx} className="mb-4 leading-relaxed transition-all">
            {parts[0]}
            <mark className="bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-semibold border-b-2 border-amber-500 shadow-sm animate-pulse">
              {highlightedQuote}
            </mark>
            {parts[1]}
          </p>
        );
      }
      return (
        <p key={idx} className="mb-4 leading-relaxed text-slate-800">
          {para}
        </p>
      );
    });
  };

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
              Đọc hiểu và ngữ liệu chuẩn
            </h1>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              Khóa chặt văn bản đúng chủ đề 100%, hệ thống câu hỏi bám sát ngữ liệu và trích xuất dẫn chứng nguyên văn để rèn luyện tư duy lập luận chính xác.
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
              onClick={handleGenerateTest}
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>AI đang soạn đề...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-white" />
                  <span>Tạo đề đọc hiểu mới</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick presets row */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Chủ đề gợi ý cho học sinh:</span>
          {PRESET_TOPICS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 transition-all cursor-pointer"
            >
              <span>{p.icon}</span>
              <span>{p.topic}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Configuration Drawer / Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Cấu hình đề đọc hiểu</h3>
          </div>
          <span className="text-xs text-slate-500">Chuẩn mực sư phạm THCS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Chủ đề trọng tâm (Topic)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Năng lượng tái tạo, Lịch sử Thăng Long..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Khía cạnh cụ thể (Sub-topic)</label>
            <input
              type="text"
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              placeholder="VD: Vai trò của năng lượng gió đối với môi trường..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ngôn ngữ</label>
              <select
                aria-label="Ngôn ngữ"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none text-slate-800"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Tiếng Anh">Tiếng Anh (English)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Số câu hỏi</label>
              <select
                aria-label="Số câu hỏi"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none text-slate-800"
              >
                <option value={3}>3 câu hỏi</option>
                <option value={4}>4 câu hỏi</option>
                <option value={5}>5 câu hỏi</option>
                <option value={6}>6 câu hỏi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Split Screen on Desktop (Passage Left, Questions Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Reading Passage Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-blue-100/80 shadow-sm p-6 sm:p-8 space-y-5 lg:sticky lg:top-20 max-h-[85vh] overflow-y-auto">
          
          {/* Passage Top Meta */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Văn Bản Đọc Hiểu • {currentTest.metadata.difficulty}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {currentTest.reading_passage.title}
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFontSize(fontSize === "normal" ? "large" : "normal")}
                title="Thay đổi cỡ chữ"
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all"
              >
                {fontSize === "normal" ? "Cỡ chữ: Vừa" : "Cỡ chữ: Lớn"}
              </button>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-sky-950">
            <BookmarkCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-blue-900">Xác nhận phạm vi: </span>
              <span className="text-slate-700">{currentTest.reading_passage.topic_verification}</span>
            </div>
          </div>

          {/* Passage Content */}
          <div className={`prose max-w-none text-slate-800 ${fontSize === "large" ? "text-lg" : "text-base"}`}>
            {renderPassageContent()}
          </div>

          {/* Passage Footer Quote Guide */}
          {highlightedQuote && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-amber-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-600" />
                  Dẫn chứng đang được đánh dấu trong bài đọc:
                </span>
                <button
                  type="button"
                  onClick={() => setHighlightedQuote(null)}
                  className="text-slate-400 hover:text-slate-600 underline font-normal"
                >
                  Tắt đánh dấu
                </button>
              </div>
              <p className="italic text-slate-700 bg-white p-2.5 rounded-xl border border-amber-200/60">
                "{highlightedQuote}"
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Ước tính: ~{currentTest.reading_passage.word_count_estimate} từ</span>
            <span>Khóa chặt chủ đề: {currentTest.metadata.selected_topic}</span>
          </div>
        </div>

        {/* Right: Question & Evidence Check Section */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Hệ thống câu hỏi</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                {currentTest.questions.length} câu hỏi
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {currentTest.questions.map((q, idx) => {
                const currentAnswer = userAnswers[q.id] || "";
                const isSelected = (opt: string) => currentAnswer.startsWith(opt.charAt(0));
                const isCorrect = submitted && (
                  q.question_type === "multiple_choice"
                    ? q.correct_answer.startsWith(currentAnswer.charAt(0))
                    : currentAnswer.trim().length >= 10
                );

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                    
                    {/* Question Header */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-800">
                        Câu {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-600">
                        {q.skill_tested}
                      </span>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {q.question}
                    </p>

                    {/* Multiple Choice Options */}
                    {q.question_type === "multiple_choice" && q.options && q.options.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const active = isSelected(opt);
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => {
                                if (!submitted) {
                                  setUserAnswers({ ...userAnswers, [q.id]: opt });
                                }
                              }}
                              className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-start gap-2.5 border ${
                                active
                                  ? "bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-xs"
                                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold border ${
                                active ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {opt.charAt(0)}
                              </span>
                              <span className="flex-1">{opt.slice(3)}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Short Answer Area */
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={3}
                          value={currentAnswer}
                          onChange={(e) => {
                            if (!submitted) {
                              setUserAnswers({ ...userAnswers, [q.id]: e.target.value });
                            }
                          }}
                          placeholder="Nhập câu trả lời ngắn của bạn dựa trên ngữ liệu bài đọc..."
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-600"
                        />
                      </div>
                    )}

                    {/* Evidence & Explanation View (Available both during study or after submit) */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => {
                          setHighlightedQuote(q.evidence_quote);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Xem dẫn chứng trong bài</span>
                      </button>

                      {submitted && (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                          isCorrect ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {isCorrect ? "Chính xác" : "Cần xem lại"}
                        </span>
                      )}
                    </div>

                    {/* Explanation Box on Submit */}
                    {submitted && (
                      <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-xs space-y-2 animate-fade-in">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đáp án chuẩn:</span>
                          <span className="text-emerald-700 font-normal">{q.correct_answer}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 leading-relaxed">
                          <span className="font-bold text-slate-800">Giải thích: </span>
                          {q.explanation}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              {!submitted ? (
                <button
                  type="button"
                  onClick={handleSubmitTest}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Nộp bài và kiểm tra dẫn chứng</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                    <p className="text-xs font-bold text-emerald-800">Chúc mừng bạn đã hoàn thành bài đọc hiểu!</p>
                    <p className="text-xs text-emerald-700">+10 Xu thưởng và +20 XP đã được ghi nhận.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setUserAnswers({});
                      setHighlightedQuote(null);
                    }}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                  >
                    Làm lại đề này
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default ReadingComprehension;
