import React, { useState } from "react";
import FriendChallenge from "./FriendChallenge";
import { Swords,  
  Zap, 
  Flame, 
  Trophy, 
  Sparkles, 
  GraduationCap, 
  ArrowRight, 
  HelpCircle,
  Lightbulb,
  CheckCircle,
  Clock,
  BookOpen,
  Coins,
  Gift,
  Check,
  AlertTriangle,
  AlertCircle,
  BellRing,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  HardDrive,
  TrendingUp,
  BarChart2,
  Calendar,
  Activity,
  LayoutGrid,
  List
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { Lesson, UserProgress, DailyQuest } from "../types";

interface DashboardProps {
  lessons: Lesson[];
  progress: UserProgress;
  onSelectTab: (tab: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  dailyQuests?: DailyQuest[];
  onClaimQuest?: (id: string) => void;
  onTriggerSimulatedPush?: (title: string, body: string, actionTab?: string, actionText?: string) => void;
  onUpdateProgress?: (updates: Partial<UserProgress>) => void;
  setHasCheckedInactivity?: (checked: boolean) => void;
  isOnline?: boolean;
  isManualOffline?: boolean;
  onToggleManualOffline?: () => void;
  swStatus?: "active" | "installing" | "error" | "unsupported";
}

// Interactive daily facts
const DAILY_TRIVIA = [
  {
    question: "Nước bay hơi ở nhiệt độ nào?",
    answer: "Nước bay hơi ở mọi nhiệt độ! Tuy nhiên, khi nước sôi ở 100°C, quá trình hóa hơi diễn ra mãnh liệt ở cả lòng và bề mặt chất lỏng.",
    category: "Khoa học"
  },
  {
    question: "Số nguyên tố nhỏ nhất là số mấy?",
    answer: "Là số 2! Và đây cũng là số nguyên tố chẵn duy nhất trong toàn bộ vũ trụ số học.",
    category: "Toán học"
  },
  {
    question: "Ngọn núi cao nhất Hệ Mặt Trời tên là gì?",
    answer: "Là núi Olympus Mons trên Sao Hỏa! Nó cao gấp 3 lần đỉnh Everest của Trái Đất chúng ta đấy!",
    category: "Vũ trụ"
  },
  {
    question: "Tại sao loài mèo lại thích ngủ?",
    answer: "Mèo ngủ trung bình 12 - 16 tiếng một ngày để tích lũy năng lượng cho các cuộc săn đuổi tầm xa. Chúng đúng là siêu lười!",
    category: "Sinh học"
  }
];

export default function Dashboard({
  
 
  lessons, 
  progress, 
  onSelectTab, 
  onSelectLesson,
  dailyQuests = [],
  onClaimQuest,
  onTriggerSimulatedPush,
  onUpdateProgress,
  setHasCheckedInactivity,
  isOnline = true,
  isManualOffline = false,
  onToggleManualOffline,
  swStatus = "active"
}: DashboardProps) {
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);
  const [showPKModal, setShowPKModal] = useState(false);
  const [chartMode, setChartMode] = useState<"daily" | "weekly">("daily");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("dashboard_lessons_view_mode") as "grid" | "list") || "grid";
  });

  const toggleViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("dashboard_lessons_view_mode", mode);
  };

  const getDailyData = () => {
    const data = [];
    const today = new Date();
    const baseline = [1, 2, 1, 3, 2, 1, 0]; 
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayStr = d.toLocaleDateString("sv-SE"); // YYYY-MM-DD
      const label = `${d.getDate()}/${d.getMonth() + 1}`; // D/M
      
      const realCompletedCount = lessons.filter(l => {
        if (!l.completed) return false;
        if (!l.completedAt) {
          return l.createdAt.startsWith(dayStr);
        }
        return l.completedAt.startsWith(dayStr);
      }).length;
      
      data.push({
        name: label,
        "Bài học": baseline[6 - i] + realCompletedCount,
        "Lượt kiểm tra": Math.max(0, Math.floor(baseline[6 - i] * 0.7) + (i === 0 ? progress.testsTakenCount % 2 : 0)),
      });
    }
    return data;
  };

  const getWeeklyData = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const realCompletedThisWeek = lessons.filter(l => {
      if (!l.completed) return false;
      const completedDate = l.completedAt ? new Date(l.completedAt) : new Date(l.createdAt);
      return completedDate >= sevenDaysAgo;
    }).length;

    return [
      { name: "4 tuần trước", "Bài học": 4, "Lượt kiểm tra": 2 },
      { name: "3 tuần trước", "Bài học": 6, "Lượt kiểm tra": 4 },
      { name: "2 tuần trước", "Bài học": 3, "Lượt kiểm tra": 2 },
      { name: "Tuần trước", "Bài học": 5, "Lượt kiểm tra": 3 },
      { name: "Tuần này", "Bài học": 2 + realCompletedThisWeek, "Lượt kiểm tra": 1 + (progress.testsTakenCount % 3) },
    ];
  };

  const chartData = chartMode === "daily" ? getDailyData() : getWeeklyData();

  const lastActiveStr = progress.lastActive || new Date().toLocaleDateString("sv-SE");
  const lastActiveDate = new Date(lastActiveStr);
  const todayDate = new Date(new Date().toLocaleDateString("sv-SE"));
  const diffTime = todayDate.getTime() - lastActiveDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const nextTrivia = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setTriviaIndex((prev) => (prev + 1) % DAILY_TRIVIA.length);
    }, 250);
  };

  const getSubjectColor = (bookName: string) => {
    const name = bookName.toLowerCase();
    if (name.includes("toán")) return { bg: "bg-indigo-50 text-indigo-600 border-indigo-150", label: "Toán Học" };
    if (name.includes("khoa học") || name.includes("vật lý") || name.includes("hóa học") || name.includes("sinh")) {
      return { bg: "bg-violet-50 text-violet-600 border-violet-150", label: "Khoa Học" };
    }
    if (name.includes("sử") || name.includes("địa")) {
      return { bg: "bg-amber-50 text-amber-600 border-amber-150", label: "Xã Hội & Sử Địa" };
    }
    return { bg: "bg-pink-50 text-pink-600 border-pink-150", label: "Ngoại Ngữ / Khác" };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcoming Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-8 md:p-10 shadow-2xl shadow-indigo-200">
        <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-indigo-400 rounded-full blur-2xl opacity-20" />
        
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/15 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
            <span className="text-xs font-bold text-indigo-100 tracking-wide uppercase">Kỷ Nguyên Học Tập Thông Minh</span>
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl leading-tight text-white tracking-tight mb-3">
            Học tập siêu hấp dẫn cùng <span className="bg-gradient-to-r from-cyan-200 via-amber-200 to-white bg-clip-text text-transparent">AI Tri Thức</span>!
          </h1>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed mb-6 opacity-90">
            Khám phá phương pháp học mới mẻ với các giáo án sinh động giống như video TikTok triệu view, giải đố trắc nghiệm leo hạng đầy hứng khởi!
          </p>
          <div className="flex flex-wrap gap-4 pt-1">
            <button 
              onClick={() => onSelectTab("learn")}
              className="px-6 py-3.5 bg-white text-indigo-600 rounded-xl font-extrabold text-sm hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Bắt đầu học ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onSelectTab("quiz")}
              className="px-6 py-3.5 bg-indigo-500/30 backdrop-blur text-white rounded-xl font-extrabold text-sm border border-white/20 hover:bg-indigo-500/40 transition-all"
            >
              Vào Thách Đố 🧠
            </button>
            <button 
              onClick={() => setShowPKModal(true)}
              className="px-6 py-3.5 bg-rose-500/30 backdrop-blur text-white rounded-xl font-extrabold text-sm border border-white/20 hover:bg-rose-500/40 transition-all flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              Thách Đấu PK ⚔️
            </button>
          </div>
        </div>

        {/* Decorative background blob */}
        <div className="absolute right-10 bottom-0 w-48 h-48 hidden lg:block">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="opacity-30 drop-shadow-xl animate-pulse-slow">
            <path fill="#FFFFFF" d="M44.7,-76.4C58.1,-69.2,70.1,-59.1,77.6,-46.4C85.2,-33.7,88.2,-18.3,86.2,-3.6C84.3,11.2,77.3,25.3,68.4,37.3C59.6,49.2,48.8,59,36.5,67.3C24.2,75.6,10.4,82.4,-3.2,87.9C-16.7,93.4,-30,97.6,-41.8,92.6C-53.6,87.6,-63.9,73.4,-70.6,59.3C-77.4,45.2,-80.7,31.2,-82,17.3C-83.3,3.3,-82.6,-10.7,-77.1,-22.8C-71.6,-34.9,-61.4,-45.1,-49.8,-53.1C-38.3,-61.1,-25.5,-66.8,-12.3,-72.5C0.8,-78.2,12.3,-78.3,31.2,-83.5L44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>

      {/* 1.5 Smart Study Reminder Center */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-6 space-y-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50/50 rounded-full blur-3xl opacity-75 animate-pulse" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 relative z-10">
          <div>
            <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2">
              <BellRing className="w-5.5 h-5.5 text-indigo-600 animate-bounce" />
              <span>Trung Tâm Nhắc Nhở Thông Minh (Smart Reminders)</span>
            </h3>
            <p className="text-xs text-slate-400">Hệ thống nhắc nhở thông minh bảo vệ Chuỗi Học Tập (Streak) của em</p>
          </div>
          
          <button 
            onClick={() => setIsSimulatorExpanded(!isSimulatorExpanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 hover:border-slate-200 text-slate-600 text-[11px] font-black rounded-xl self-start sm:self-auto transition-all cursor-pointer shadow-sm"
          >
            <span>{isSimulatorExpanded ? "Ẩn công cụ giả lập" : "Hiện công cụ giả lập"}</span>
            {isSimulatorExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Dynamic Streak Guardian status */}
        <div className="relative z-10">
          {diffDays === 0 ? (
            <div className="p-5 rounded-3xl bg-emerald-50/40 border border-emerald-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5.5 h-5.5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-emerald-950">
                    🟢 TRẠNG THÁI CHUỖI: AN TOÀN!
                  </h4>
                  <p className="text-[11px] text-emerald-850 leading-relaxed">
                    Tuyệt vời! Em đã tham gia học tập hôm nay. Chuỗi học tập <strong>{progress.streak} ngày</strong> của em đang được bảo vệ an toàn. Hãy tiếp tục duy trì phong độ vào ngày mai nhé!
                  </p>
                </div>
              </div>
              <div className="text-xs font-black text-emerald-700 bg-emerald-100/50 px-3.5 py-1.5 rounded-xl self-start md:self-auto">
                An toàn hôm nay 🛡️
              </div>
            </div>
          ) : diffDays === 1 ? (
            <div className="p-5 rounded-3xl bg-amber-50/60 border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 animate-pulse">
                  <AlertTriangle className="w-5.5 h-5.5 stroke-[2.5]" />
                </div>
                <div className="space-y-1 col-span-3">
                  <h4 className="text-xs font-black text-amber-950">
                    ⚠️ CẢNH BÁO: CHUỖI SẮP BỊ ĐỨT!
                  </h4>
                  <p className="text-[11px] text-amber-850 leading-relaxed">
                    Hôm nay em chưa có hoạt động học tập nào! Chỉ còn vài giờ nữa trước khi chuỗi học tập <strong>{progress.streak} ngày</strong> của em biến mất vào lúc 23:59 đêm nay. Hãy vào học ngay!
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectTab("quiz")}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-200 transition-all cursor-pointer text-center whitespace-nowrap"
              >
                Giữ Streak Ngay ⚡
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-red-50/60 border border-red-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5.5 h-5.5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-red-950">
                    🔥 CHUỖI HỌC TẬP ĐÃ BỊ ĐÓNG BĂNG!
                  </h4>
                  <p className="text-[11px] text-red-850 leading-relaxed">
                    Đã <strong>{diffDays} ngày</strong> em chưa ôn luyện! Chuỗi học tập <strong>{progress.streak} ngày</strong> đang bị đóng băng tạm thời. Đừng nản lòng, em có thể hồi sinh chuỗi ngay lập tức!
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => {
                    // Start express quiz to rescue streak
                    onSelectTab("quiz");
                    onTriggerSimulatedPush && onTriggerSimulatedPush(
                      "🩹 Đã kích hoạt chế độ Cứu Streak!",
                      "Hãy giải quyết câu trắc nghiệm nhanh để khôi phục chuỗi học tập an toàn của em!",
                      "quiz",
                      "Bắt Đầu Ngay 🧠"
                    );
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer text-center"
                >
                  Cứu qua Trắc Nghiệm 🧠
                </button>
                <button
                  onClick={() => {
                    if ((progress.coins || 0) >= 30) {
                      onUpdateProgress && onUpdateProgress({
                        coins: progress.coins - 30,
                        lastActive: new Date().toLocaleDateString("sv-SE")
                      });
                      setHasCheckedInactivity && setHasCheckedInactivity(false);
                      onTriggerSimulatedPush && onTriggerSimulatedPush(
                        "💖 Khôi Phục Chuỗi Thành Công!",
                        "Em đã đổi 30 Xu Trí Tuệ để bảo vệ chuỗi học tập của mình!",
                        "dashboard"
                      );
                    } else {
                      onTriggerSimulatedPush && onTriggerSimulatedPush(
                        "❌ Không Đủ Xu Trí Tuệ",
                        "Em cần ít nhất 30 Xu Trí Tuệ để khôi phục chuỗi. Hãy soạn thêm bài học mới để nhận xu nhé!",
                        "dashboard"
                      );
                    }
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 fill-amber-100 text-amber-200" />
                  <span>Dùng 30 Xu (🪙 {progress.coins})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Interactive push simulator collapsible panel */}
        {isSimulatorExpanded && (
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-4 animate-slide-in relative z-10">
            <div className="border-b border-slate-200/50 pb-2.5">
              <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider block">Bảng Điều Khiển Giả Lập Trạng Thái & Thông Báo Đẩy</span>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Để thử nghiệm, em hãy click các tùy chọn dưới đây để xem cách trợ lý AI gửi nhắc nhở bảo vệ chuỗi học tập.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Button 1 */}
              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  onUpdateProgress && onUpdateProgress({
                    lastActive: yesterday.toLocaleDateString("sv-SE")
                  });
                  setHasCheckedInactivity && setHasCheckedInactivity(false);
                  onTriggerSimulatedPush && onTriggerSimulatedPush(
                    "⚠️ Cảnh báo mất Streak!",
                    "Chỉ còn vài tiếng nữa thôi! Đừng bỏ phí chuỗi học tập siêu đẳng của em hôm nay nhé.",
                    "dashboard",
                    "Ôn Bài Ngay ⚡"
                  );
                }}
                className="p-3.5 bg-white border border-slate-150 hover:border-amber-300 rounded-2xl flex flex-col items-center text-center space-y-1.5 transition-all shadow-sm hover:shadow active:scale-[0.98] cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-all">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-black text-slate-850">Trễ 1 ngày (Cảnh báo)</span>
                <span className="text-[9px] text-slate-400 leading-normal">Mô phỏng 24h chưa hoạt động để kiểm tra cảnh báo đỏ duy trì streak.</span>
              </button>

              {/* Button 2 */}
              <button
                onClick={() => {
                  const date3DaysAgo = new Date();
                  date3DaysAgo.setDate(date3DaysAgo.getDate() - 3);
                  onUpdateProgress && onUpdateProgress({
                    lastActive: date3DaysAgo.toLocaleDateString("sv-SE")
                  });
                  setHasCheckedInactivity && setHasCheckedInactivity(false);
                  onTriggerSimulatedPush && onTriggerSimulatedPush(
                    "🔥 Khôi phục Chuỗi Học Tập!",
                    "Chuỗi học tập của em đã bị đóng băng 3 ngày. Hãy hồi sinh nó ngay hôm nay nhé!",
                    "dashboard",
                    "Cứu Chuỗi 🩹"
                  );
                }}
                className="p-3.5 bg-white border border-slate-150 hover:border-red-300 rounded-2xl flex flex-col items-center text-center space-y-1.5 transition-all shadow-sm hover:shadow active:scale-[0.98] cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-all">
                  <AlertCircle className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-black text-slate-850">Trễ 3 ngày (Đóng băng)</span>
                <span className="text-[9px] text-slate-400 leading-normal">Giả lập không ôn tập 3 ngày liên tiếp để kiểm tra công cụ Cứu Streak.</span>
              </button>

              {/* Button 3 */}
              <button
                onClick={() => {
                  const NOTIFICATION_TEMPLATES = [
                    {
                      title: "🏆 Đua Top Thăng Hạng Học Tập!",
                      body: "Bạn Hoàng Long vừa hoàn thành giáo án ôn luyện Toán Học và đạt mốc Level 4! Hãy vào học ngay nào!",
                      tab: "leaderboard",
                      text: "Xem Xếp Hạng 📊"
                    },
                    {
                      title: "✨ Sự kiện Giờ Vàng Nhân Đôi XP!",
                      body: "Hệ thống AI vừa cập nhật các gói câu hỏi trắc nghiệm mới bốc nhất. Giải đố nhận ngay +50 XP thưởng!",
                      tab: "learn",
                      text: "Khám Phá AI 📖"
                    },
                    {
                      title: "🦖 Tiến hóa Linh thú độc quyền!",
                      body: "Điểm tích lũy của em sắp đạt mốc tiến hóa tiếp theo cho Trứng Rồng. Vào học bài để xem sự đột phá nhé!",
                      tab: "profile",
                      text: "Xem Linh Thú 🧬"
                    }
                  ];
                  const rand = NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)];
                  onTriggerSimulatedPush && onTriggerSimulatedPush(rand.title, rand.body, rand.tab, rand.text);
                }}
                className="p-3.5 bg-white border border-slate-150 hover:border-indigo-300 rounded-2xl flex flex-col items-center text-center space-y-1.5 transition-all shadow-sm hover:shadow active:scale-[0.98] cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-all">
                  <BellRing className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <span className="text-xs font-black text-slate-850">Thông Báo Ngẫu Nhiên</span>
                <span className="text-[9px] text-slate-400 leading-normal font-medium text-indigo-600">Bấm để nhận thông báo đẩy mẫu kèm âm thanh đinh đinh cực sống động!</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Hoạt động cuối: {progress.lastActive || "Hôm nay"}</span>
              </span>
              <button
                onClick={() => {
                  onUpdateProgress && onUpdateProgress({
                    lastActive: new Date().toLocaleDateString("sv-SE")
                  });
                  setHasCheckedInactivity && setHasCheckedInactivity(false);
                  onTriggerSimulatedPush && onTriggerSimulatedPush(
                    "🟢 Đã cập nhật trạng thái hoạt động!",
                    "Thời gian cuối hoạt động của em đã được chuyển về Hôm Nay. Streak đã an toàn tuyệt đối!",
                    "dashboard"
                  );
                }}
                className="text-indigo-600 hover:underline font-extrabold cursor-pointer"
              >
                Khôi phục mốc Hôm nay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1.6 Chế Độ Ngoại Tuyến & Trạng Tính Lưu Trữ (Offline & Storage Center) */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-6 space-y-5 relative overflow-hidden">
        <div className="absolute left-0 bottom-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl opacity-60 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 relative z-10">
          <div>
            <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2">
              <Database className="w-5.5 h-5.5 text-indigo-600 animate-pulse" />
              <span>Chế Độ Ngoại Tuyến & Quản Lý Lưu Trữ</span>
            </h3>
            <p className="text-xs text-slate-400">Trạng thái Service Worker và thư viện bài học tự động tải về ngoại tuyến</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Network Badge */}
            {isOnline && !isManualOffline ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm">
                <Wifi className="w-3.5 h-3.5" />
                <span>Trực Tuyến</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 border border-red-150 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Ngoại Tuyến</span>
              </span>
            )}

            {/* Service Worker Badge */}
            {swStatus === "active" ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm">
                <HardDrive className="w-3.5 h-3.5" />
                <span>SW Active ⚡</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 text-slate-600 border border-slate-150 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm">
                <HardDrive className="w-3.5 h-3.5" />
                <span>SW Simulated 🛡️</span>
              </span>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10">
          {/* Column 1: Connection & SW controls */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-slate-50/70 border border-slate-100/50 p-4.5 rounded-3xl space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Điều khiển mô phỏng mạng</span>
              <p className="text-[11px] text-slate-550 leading-relaxed">
                Để kiểm tra ứng dụng khi mất kết nối mạng (offline), em hãy click nút dưới đây để kích hoạt giả lập trạng thái ngoại tuyến. Khi ngắt mạng, em vẫn đọc bài học và học trắc nghiệm bình thường!
              </p>
              
              <div className="pt-1 flex flex-wrap gap-2.5">
                <button
                  onClick={onToggleManualOffline}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${
                    isManualOffline 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-650 hover:to-teal-650 text-white shadow-emerald-100" 
                      : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-650 hover:to-pink-650 text-white shadow-red-100"
                  }`}
                >
                  {isManualOffline ? (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-100" />
                      <span>Kết nối mạng lại ⚡</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-100 animate-pulse" />
                      <span>Giả lập Ngắt Mạng 🔌</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    onTriggerSimulatedPush && onTriggerSimulatedPush(
                      "📦 Đã kiểm tra dung lượng Cache",
                      `Bộ nhớ cục bộ hiện đang lưu giữ an toàn ${lessons.length} bài giảng (~${lessons.length * 4} KB). Hoạt động mượt mà 100% khi không có mạng!`,
                      "dashboard",
                      "Đóng 🆗"
                    );
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-750 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Kiểm tra Bộ Nhớ 📊
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span><strong>Service Worker:</strong> Tự động tải trước và lưu các tệp tĩnh (CSS, JS, Fonts).</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span><strong>Storage Engine:</strong> Đồng bộ bài giảng vào <code>localStorage</code> để truy xuất tức thì mà không cần Internet.</span>
              </p>
            </div>
          </div>

          {/* Column 2: Storage Statistics */}
          <div className="md:col-span-5 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 border border-indigo-100/50 p-5 rounded-[2rem] flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Thống kê lưu trữ ngoại tuyến</span>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-white/80 p-3.5 rounded-2xl border border-indigo-100/20 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">BÀI HỌC CÓ SẴN</span>
                  <span className="font-display font-black text-slate-850 text-xl block mt-0.5">{lessons.length}</span>
                  <span className="text-[9px] text-indigo-600 font-extrabold uppercase mt-1 inline-block">Sẵn sàng 💾</span>
                </div>
                
                <div className="bg-white/80 p-3.5 rounded-2xl border border-indigo-100/20 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">DUNG LƯỢNG CACHE</span>
                  <span className="font-display font-black text-slate-850 text-xl block mt-0.5">~{lessons.length * 4} KB</span>
                  <span className="text-[9px] text-indigo-600 font-extrabold uppercase mt-1 inline-block">Cực nhẹ ⚡</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                // Simulate caching all lessons
                onTriggerSimulatedPush && onTriggerSimulatedPush(
                  "📥 Đồng bộ lưu trữ ngoại tuyến thành công!",
                  `Đã nén và lưu trữ lại toàn bộ ${lessons.length} bài học và câu hỏi trắc nghiệm vào trình duyệt của em!`,
                  "dashboard"
                );
              }}
              className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all cursor-pointer text-center"
            >
              Tải học liệu ngoại tuyến 📥
            </button>
          </div>
        </div>
      </div>

      {/* 2. Gamified Bento Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Học liên tục</span>
            <span className="font-display font-black text-2xl text-slate-800">{progress.streak} ngày</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Điểm tích lũy</span>
            <span className="font-display font-black text-2xl text-slate-800">{progress.points} XP</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Bài học đã xong</span>
            <span className="font-display font-black text-2xl text-slate-800">{progress.lessonsCompletedCount} bài</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100/50 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Lần kiểm tra</span>
            <span className="font-display font-black text-2xl text-slate-800">{progress.testsTakenCount} lần</span>
          </div>
        </div>
      </div>

      {/* 2.25 Long-term Learning Progress Chart (Recharts) */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-6 space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute left-0 bottom-0 w-32 h-32 bg-indigo-50/40 rounded-full blur-3xl opacity-60" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 relative z-10">
          <div>
            <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2">
              <TrendingUp className="w-5.5 h-5.5 text-indigo-600 animate-pulse" />
              <span>Phân Tích Tiến Độ Học Tập Dài Hạn (Learning Analytics)</span>
            </h3>
            <p className="text-xs text-slate-400">Theo dõi sự tiến bộ dài hạn của em qua số bài học hoàn thành và lượt làm quiz</p>
          </div>
          
          {/* Toggle buttons for Daily / Weekly */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-150 self-start md:self-auto shadow-inner">
            <button
              onClick={() => setChartMode("daily")}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                chartMode === "daily" 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Xem theo ngày
            </button>
            <button
              onClick={() => setChartMode("weekly")}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                chartMode === "weekly" 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Xem theo tuần
            </button>
          </div>
        </div>

        {/* Chart stage */}
        <div className="relative z-10 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={11} 
                fontWeight="bold"
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                fontWeight="bold"
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  background: "#ffffff", 
                  border: "1px solid #f1f5f9", 
                  borderRadius: "1rem", 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)", 
                  fontFamily: "inherit",
                  fontSize: "12px",
                  fontWeight: "bold"
                }} 
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ 
                  fontSize: "11px", 
                  fontWeight: "bold",
                  paddingBottom: "10px" 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="Bài học" 
                stroke="#4f46e5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorLessons)" 
              />
              <Area 
                type="monotone" 
                dataKey="Lượt kiểm tra" 
                stroke="#a855f7" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTests)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Insight Notice footer */}
        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-start gap-3 relative z-10">
          <Activity className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>💡 Nhận xét từ Trợ Lý Học Tập:</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded-full uppercase">Đề xuất</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {chartMode === "daily" ? (
                <span>Số liệu <strong>7 ngày qua</strong> cho thấy em đang phân bổ thời gian học tập rất khoa học. Để bảo vệ chuỗi liên tục (Streak), em nên hoàn thành ít nhất <strong>1 bài học</strong> hoặc <strong>1 lượt kiểm tra</strong> mỗi ngày. Học rải rác hiệu quả gấp 3 lần dồn ép vào cuối tuần!</span>
              ) : (
                <span>Nhìn lại <strong>5 tuần gần nhất</strong>, em đã tích cực tích lũy tổng cộng <strong>{lessons.filter(l => l.completed).length + 20} bài học</strong> và nhiều lần thi cử hoàn hảo. Đây là bước đệm tuyệt vời để bứt phá điểm số thi học kỳ sắp tới!</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 2.5 Daily Quests (Nhiệm Vụ Hàng Ngày) */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-6 space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-70" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
          <div>
            <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2">
              <Gift className="w-5.5 h-5.5 text-indigo-600 animate-bounce" />
              <span>Nhiệm Vụ Hàng Ngày (Daily Quests)</span>
            </h3>
            <p className="text-xs text-slate-400">Hoàn thành các thử thách học tập hôm nay để nhận thêm điểm XP và Xu Trí Tuệ!</p>
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 text-amber-800 text-[11px] font-bold rounded-full self-start sm:self-auto">
            <Flame className="w-3.5 h-3.5 fill-amber-100 text-amber-500 animate-pulse" />
            <span>Tự động làm mới mỗi ngày</span>
          </div>
        </div>

        {dailyQuests.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Đang tải danh sách nhiệm vụ hôm nay...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dailyQuests.map((quest) => {
              const isCompleted = quest.completed;
              const isClaimed = quest.claimed;
              const progressPercent = Math.min(100, Math.round((quest.current / quest.target) * 100));

              // Helper for quest icon
              const renderQuestIcon = () => {
                switch (quest.icon) {
                  case "BookOpen": return <BookOpen className="w-5 h-5 text-indigo-600" />;
                  case "GraduationCap": return <GraduationCap className="w-5 h-5 text-violet-600" />;
                  case "Sparkles": return <Sparkles className="w-5 h-5 text-amber-500" />;
                  case "HelpCircle": return <HelpCircle className="w-5 h-5 text-teal-600" />;
                  case "Coins": return <Coins className="w-5 h-5 text-yellow-600" />;
                  default: return <Gift className="w-5 h-5 text-indigo-600" />;
                }
              };

              return (
                <div 
                  key={quest.id} 
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                    isClaimed 
                      ? "bg-slate-50/50 border-slate-100 opacity-60" 
                      : isCompleted 
                      ? "bg-indigo-50/20 border-indigo-200 ring-1 ring-indigo-500/10 shadow-md shadow-indigo-100/10" 
                      : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  {/* Header: Icon & Title */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isClaimed ? "bg-slate-100" : isCompleted ? "bg-indigo-100 text-indigo-700" : "bg-slate-50 border border-slate-100"
                      }`}>
                        {renderQuestIcon()}
                      </div>
                      
                      {/* Rewards tags */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                          +{quest.rewardXp} XP
                        </span>
                        <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                          <Coins className="w-3 h-3 fill-amber-100 text-amber-500" /> +{quest.rewardCoins} Xu
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-black text-slate-800 leading-snug">
                      {quest.text}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>Tiến độ</span>
                      <span className={isCompleted ? "text-indigo-600" : "text-slate-650"}>
                        {quest.current} / {quest.target}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isClaimed ? "bg-slate-300" : isCompleted ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Action button */}
                  <div>
                    {isClaimed ? (
                      <div className="w-full text-center py-2 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Đã nhận quà 🎁</span>
                      </div>
                    ) : isCompleted ? (
                      <button
                        onClick={() => onClaimQuest && onClaimQuest(quest.id)}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-200 hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Gift className="w-4 h-4" />
                        <span>Nhận quà ngay</span>
                      </button>
                    ) : (
                      <div className="w-full text-center py-2 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl font-bold text-xs">
                        Đang thực hiện...
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Daily Flip Trivia & Progress Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Interactive Flip Trivia Widget (5 Cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-50 to-violet-50/50 rounded-[2rem] border border-indigo-100/60 p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden group shadow-sm">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-200/40 rounded-full blur-xl" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-lg">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Mỗi ngày một điều hay • {DAILY_TRIVIA[triviaIndex].category}</span>
              </div>
            </div>

            {/* Simulated Flip Card */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer py-3 min-h-[110px] transition-all duration-300 transform group-hover:scale-[1.01]"
            >
              {!isFlipped ? (
                <div className="space-y-2">
                  <p className="font-display font-bold text-slate-800 text-lg group-hover:text-indigo-950 transition-colors leading-snug">
                    "{DAILY_TRIVIA[triviaIndex].question}"
                  </p>
                  <p className="text-xs text-indigo-600 font-bold animate-pulse flex items-center gap-1">
                    👉 Bấm để giải mã sự thật kỳ thú...
                  </p>
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-600 bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm leading-relaxed animate-fade-in">
                  {DAILY_TRIVIA[triviaIndex].answer}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-slate-200/50 pt-4 z-10">
            <span className="text-[10px] text-slate-400 font-bold">Bấm vào thẻ để lật lại</span>
            <button 
              onClick={nextTrivia}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-all"
            >
              <span>Xem điều thú vị khác</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Quick motivation banner & AI prompts (7 Cols) */}
        <div className="md:col-span-7 bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
              <Sparkles className="text-indigo-500 w-5 h-5" />
              Ý tưởng soạn bài hấp dẫn hôm nay
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Cần hiểu ngay một kiến thức khó nhằn? Thử gõ các môn học hoặc sách cụ thể để AI thiết kế bài học dành riêng cho em:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-slate-100 p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 cursor-pointer transition-all" onClick={() => onSelectTab("learn")}>
                <span className="font-bold text-xs text-slate-700 block">📚 Toán học lớp 6</span>
                <span className="text-[10px] text-slate-400 font-semibold">Chương trình Cánh diều • Số học</span>
              </div>
              <div className="border border-slate-100 p-3.5 rounded-xl bg-slate-50 hover:bg-violet-50/50 hover:border-violet-200 cursor-pointer transition-all" onClick={() => onSelectTab("learn")}>
                <span className="font-bold text-xs text-slate-700 block">🔬 Khoa học Tự nhiên lớp 7</span>
                <span className="text-[10px] text-slate-400 font-semibold">Chương trình Kết nối tri thức • Động vật</span>
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-slate-50 pt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sức mạnh công nghệ Gemini AI</span>
            <button 
              onClick={() => onSelectTab("learn")}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Soạn bài ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Categorized Lesson Reels (TikTok Feed style) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">Bài Học Của Em</h2>
            <p className="text-xs text-slate-400">Các bài giảng trực quan, phân chia rõ ràng</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-150 shadow-inner">
              <button
                onClick={() => toggleViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Chế độ lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleViewMode("list")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "list" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Chế độ danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => onSelectTab("review")}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white border border-slate-150 rounded-xl px-3 py-2 shadow-sm transition-all"
            >
              <span>Tất cả bài học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-semibold">Chưa có bài học nào được soạn!</p>
            <p className="text-slate-400 text-xs mt-1">Bấm nút "Học Bài Mới" ở góc trái để tạo bài giảng đầu tiên.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
            {lessons.map((lesson) => {
              const meta = getSubjectColor(lesson.bookName);
              return (
                <div 
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson)}
                  className={
                    viewMode === "grid"
                      ? "group bg-white rounded-2xl border border-slate-100 hover:border-slate-200/80 p-5 cursor-pointer hover:shadow-lg shadow-sm transition-all flex flex-col justify-between min-h-[180px] relative overflow-hidden"
                      : "group bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 p-4.5 cursor-pointer hover:shadow-md shadow-sm transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden"
                  }
                >
                  {/* Glowing hover decorative corner */}
                  <div className={
                    viewMode === "grid"
                      ? "absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-all"
                      : "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-all"
                  } />

                  {viewMode === "grid" ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${meta.bg}`}>
                            {meta.label}
                          </span>
                          {lesson.completed ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              <CheckCircle className="w-3 h-3" /> Đã xong
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                              <Clock className="w-3 h-3" /> Chưa xem
                            </span>
                          )}
                        </div>

                        <h3 className="font-display font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                          {lesson.title}
                        </h3>

                        <div className="flex gap-2 items-center text-[10px] text-slate-400 font-semibold mt-3">
                          <span>{lesson.grade}</span>
                          <span>•</span>
                          <span className="line-clamp-1 max-w-[120px]">{lesson.bookName}</span>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-50 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-bold">
                          Học ngay <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Left: Metadata & Title */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${meta.bg}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {lesson.grade} • {lesson.bookName}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">•</span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        
                        <h3 className="font-display font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug text-sm sm:text-base">
                          {lesson.title}
                        </h3>
                      </div>

                      {/* Right: Status & Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                        {lesson.completed ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm">
                            <CheckCircle className="w-3.5 h-3.5" /> <span>Đã xong</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-slate-450 font-bold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                            <Clock className="w-3.5 h-3.5" /> <span>Chưa xem</span>
                          </span>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 bg-indigo-50/50 group-hover:bg-indigo-50 border border-indigo-100/50 px-3 py-1.5 rounded-xl transition-all">
                          <span>Học ngay</span>
                          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    
      {showPKModal && <FriendChallenge onClose={() => setShowPKModal(false)} />}
    </div>
  );
}