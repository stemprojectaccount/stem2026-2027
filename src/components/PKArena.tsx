import React, { useState, useEffect, useRef } from "react";
import { 
  Zap, 
  Trophy, 
  Shield, 
  Crown, 
  User, 
  Clock, 
  Sword, 
  X, 
  Play, 
  ChevronRight, 
  Sparkles, 
  RotateCcw, 
  Award, 
  Users, 
  Check, 
  Flame, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  ChevronUp,
  Brain,
  BookOpen,
  Snowflake,
  EyeOff,
  Wind,
  AlertTriangle,
  Eye,
  HelpCircle
} from "lucide-react";
import { UserProgress, Question, Lesson } from "../types";
import { getAvatarAtLevel } from "../lib/avatarEvolution";
import ConfettiCelebration from "./ConfettiCelebration";
import { motion, AnimatePresence } from "motion/react";

interface PKArenaProps {
  progress: UserProgress;
  selectedAvatarIdx: number;
  updateProgress: (updates: Partial<UserProgress>) => void;
  triggerSuccessMessage: (msg: string) => void;
  lessons?: Lesson[];
}

interface PKCompetitor {
  id: string;
  name: string;
  avatarEmoji: string;
  level: number;
  pkWins: number;
  winRate: number;
  title: string;
  isCurrentUser?: boolean;
}

// System dynamic question pool for PK
const PK_QUESTION_POOL: (Question & { subject: string; difficulty: "easy" | "medium" | "hard" | "legendary" })[] = [
  {
    subject: "Toán Học",
    difficulty: "easy",
    question: "Số tự nhiên nhỏ nhất có hai chữ số là số nào?",
    options: ["10", "11", "99", "1"],
    correctIndex: 0,
    explanation: "Đúng rồi! Số 10 là số tự nhiên bé nhất có 2 chữ số."
  },
  {
    subject: "Lịch Sử",
    difficulty: "easy",
    question: "Ai là người anh hùng thiếu niên đã bóp nát quả cam vì không được dự hội nghị Diên Hồng?",
    options: ["Trần Quốc Toản", "Kim Đồng", "Võ Thị Sáu", "Nguyễn Bá Ngọc"],
    correctIndex: 0,
    explanation: "Chính xác! Trần Quốc Toản vì còn quá nhỏ không được dự họp bàn đánh giặc, đã bóp nát quả cam trong tay từ lúc nào không hay."
  },
  {
    subject: "Địa Lý",
    difficulty: "easy",
    question: "Tỉnh thành nào có diện tích lớn nhất Việt Nam?",
    options: ["Nghệ An", "Thanh Hóa", "Gia Lai", "Sơn La"],
    correctIndex: 0,
    explanation: "Tuyệt vời! Nghệ An là tỉnh có diện tích lớn nhất Việt Nam (khoảng 16.490 km²)."
  },
  {
    subject: "Khoa Học",
    difficulty: "easy",
    question: "Thành phần khí nào chiếm thể tích lớn nhất trong không khí Trái Đất?",
    options: ["Khí Oxy", "Khí Cacbonic", "Khí Nitơ", "Khí Argon"],
    correctIndex: 2,
    explanation: "Rất chuẩn! Khí Nitơ chiếm khoảng 78% thể tích không khí, trong khi Oxy chỉ chiếm khoảng 21%."
  },
  {
    subject: "IQ & Logic",
    difficulty: "medium",
    question: "Nếu 1 = 5, 2 = 10, 3 = 15, 4 = 20 thì 5 bằng bao nhiêu?",
    options: ["25", "1", "30", "50"],
    correctIndex: 1,
    explanation: "A ha! Đọc kỹ câu đầu tiên đi: 'Nếu 1 = 5' thì đương nhiên ngược lại '5 = 1' rồi! Bạn thật tinh mắt!"
  },
  {
    subject: "Tiếng Anh",
    difficulty: "medium",
    question: "Từ nào đồng nghĩa với từ 'Happy'?",
    options: ["Sad", "Joyful", "Angry", "Tired"],
    correctIndex: 1,
    explanation: "Đúng thế! 'Joyful' mang nghĩa vui vẻ, hạnh phúc, đồng nghĩa với 'Happy'."
  },
  {
    subject: "Địa Lý",
    difficulty: "medium",
    question: "Dòng sông nào dài nhất thế giới?",
    options: ["Sông Amazon", "Sông Nile", "Sông Mê Kông", "Sông Hằng"],
    correctIndex: 1,
    explanation: "Chuẩn xác! Sông Nile tại Châu Phi là dòng sông dài nhất thế giới (~6.650 km)."
  },
  {
    subject: "Toán Học",
    difficulty: "medium",
    question: "Tổng của tất cả các số tự nhiên từ 1 đến 10 là bao nhiêu?",
    options: ["45", "50", "55", "60"],
    correctIndex: 2,
    explanation: "Công thức tính nhanh: (1 + 10) * 10 / 2 = 55. Bạn trả lời rất nhanh!"
  },
  {
    subject: "Vũ Trụ",
    difficulty: "hard",
    question: "Hành tinh nào trong Hệ Mặt Trời có thời gian quay quanh trục của nó (một ngày) lâu hơn thời gian quay quanh Mặt Trời (một năm)?",
    options: ["Sao Kim (Venus)", "Sao Thủy (Mercury)", "Sao Hỏa (Mars)", "Sao Mộc (Jupiter)"],
    correctIndex: 0,
    explanation: "Kinh ngạc chưa! Sao Kim tự quay quanh mình rất chậm, mất 243 ngày Trái Đất để quay hết một vòng trục, trong khi chỉ mất 225 ngày Trái Đất để đi hết một vòng quanh Mặt Trời!"
  },
  {
    subject: "Sinh Học",
    difficulty: "hard",
    question: "Bộ phận nào trên cơ thể người không bao giờ ngừng phát triển trong suốt cuộc đời?",
    options: ["Mắt và Miệng", "Móng tay và Tóc", "Tai và Mũi", "Xương sọ"],
    correctIndex: 2,
    explanation: "Đúng vậy! Tai và mũi cấu tạo chủ yếu bằng sụn và chịu tác động của trọng lực nên liên tục lớn dần trong suốt cuộc đời."
  },
  {
    subject: "Công Nghệ",
    difficulty: "hard",
    question: "Đơn vị tính toán nhỏ nhất của dữ liệu máy tính là gì?",
    options: ["Byte", "Bit", "Kilobyte", "Pixel"],
    correctIndex: 1,
    explanation: "Chính xác! Bit (Binary Digit) là đơn vị nhỏ nhất, chỉ nhận giá trị 0 hoặc 1."
  },
  {
    subject: "Sử Địa",
    difficulty: "hard",
    question: "Vịnh biển nào của Việt Nam được UNESCO công nhận là Kỳ quan thiên nhiên mới của thế giới năm 2011?",
    options: ["Vịnh Nha Trang", "Vịnh Hạ Long", "Vịnh Lăng Cô", "Vịnh Xuân Đài"],
    correctIndex: 1,
    explanation: "Quá xuất sắc! Vịnh Hạ Long đã xuất sắc lọt vào danh sách 7 Kỳ quan thiên nhiên mới của thế giới."
  }
];

// Special pool of extremely hard questions for Thách Thức Vô Song card
const SUPER_HARD_QUESTION_POOL: (Question & { subject: string; difficulty: "legendary" })[] = [
  {
    subject: "Bác Học Vô Song (Toán & IQ)",
    difficulty: "legendary",
    question: "Số tự nhiên nhỏ nhất chia hết cho tất cả các số nguyên từ 1 đến 10 là số nào?",
    options: ["2520", "5040", "1260", "10080"],
    correctIndex: 0,
    explanation: "Chính xác! Bội chung nhỏ nhất (BCNN) của các số tự nhiên liên tiếp từ 1 đến 10 chính là 2520."
  },
  {
    subject: "Bác Học Vô Song (Khoa Học)",
    difficulty: "legendary",
    question: "Tốc độ ánh sáng trong chân không đo được chính xác bằng bao nhiêu mét trên giây?",
    options: ["299.792.458 m/s", "300.000.000 m/s", "299.792.000 m/s", "299.800.000 m/s"],
    correctIndex: 0,
    explanation: "Tuyệt vời! Tốc độ ánh sáng trong chân không là hằng số vật lý bất biến bằng chính xác 299.792.458 m/s."
  },
  {
    subject: "Bác Học Vô Song (Lịch Sử)",
    difficulty: "legendary",
    question: "Triều đại phong kiến nào trong lịch sử Việt Nam có thời gian trị vì ngắn nhất?",
    options: ["Nhà Hồ (7 năm)", "Nhà Tiền Lê (29 năm)", "Nhà Tây Sơn (24 năm)", "Nhà Thục (50 năm)"],
    correctIndex: 0,
    explanation: "Quá xuất sắc! Nhà Hồ do Hồ Quý Ly sáng lập năm 1400 và kết thúc năm 1407, chỉ tồn tại vỏn vẹn 7 năm trước giặc Minh xâm lược."
  }
];

const BOT_POOL = [
  { name: "Phan Anh Đức", avatarEmoji: "🦊", level: 6, title: "Cáo Học Thuật", winRate: 68 },
  { name: "Lê Mỹ Linh", avatarEmoji: "🐼", level: 4, title: "Gấu Cần Mẫn", winRate: 52 },
  { name: "Trương Quốc Bảo", avatarEmoji: "🦁", level: 8, title: "Sư Tử Bách Khoa", winRate: 75 },
  { name: "Nguyễn Hà My", avatarEmoji: "🐰", level: 3, title: "Thỏ Thông Thái", winRate: 48 },
  { name: "Đặng Tiến Dũng", avatarEmoji: "🦅", level: 7, title: "Đại Bàng Độc Lập", winRate: 71 },
  { name: "Hoàng Minh Tuấn", avatarEmoji: "🐸", level: 5, title: "Ếch Khoa Học", winRate: 58 }
];

export interface MagicCardDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effect: string;
  colorClass: string;
  bgClass: string;
  tier: "dong" | "sat" | "bac" | "vang" | "kimcuong" | "baymau";
  tierLabel: string;
  power: number; // 0-100 rating based on potency
  cooldownRounds: number; // rounds of cooldown needed after use
}

export const MAGIC_CARDS_LIST: MagicCardDef[] = [
  {
    id: "hint",
    name: "Gợi Ý Tri Thức",
    emoji: "💡",
    description: "Khai sáng tư duy, soi lối đáp án.",
    effect: "Tự động loại bỏ 2 phương án sai của câu hỏi hiện tại cho em.",
    colorClass: "text-amber-600 bg-amber-50",
    bgClass: "bg-amber-50 border-amber-300",
    tier: "dong",
    tierLabel: "Đồng (Common)",
    power: 35,
    cooldownRounds: 1
  },
  {
    id: "timeslow",
    name: "Ngưng Đọng Thời Gian",
    emoji: "⏳",
    description: "Ngưng đọng thời gian học tập.",
    effect: "Cộng thêm 10 giây suy nghĩ cho câu hỏi hiện tại.",
    colorClass: "text-orange-500 bg-orange-50",
    bgClass: "bg-orange-50 border-orange-300",
    tier: "dong",
    tierLabel: "Đồng (Common)",
    power: 40,
    cooldownRounds: 1
  },
  {
    id: "blind",
    name: "Lá Che Màn Hình",
    emoji: "🌫️",
    description: "Sử dụng sương mù ma thuật làm mù mắt đối thủ.",
    effect: "Gây mù màn hình bot 5s (giảm mạnh tỷ lệ đúng của bot còn 10% và delay bot trả lời).",
    colorClass: "text-slate-600 bg-slate-50",
    bgClass: "bg-slate-50 border-slate-350",
    tier: "sat",
    tierLabel: "Sắt (Uncommon)",
    power: 50,
    cooldownRounds: 1
  },
  {
    id: "shield",
    name: "Khiên Học Thuật",
    emoji: "🛡️",
    description: "Tạo lá chắn bảo vệ.",
    effect: "Nếu đối thủ trả lời đúng ở lượt này, họ sẽ không được cộng điểm.",
    colorClass: "text-blue-600 bg-blue-50",
    bgClass: "bg-blue-50 border-blue-300",
    tier: "sat",
    tierLabel: "Sắt (Uncommon)",
    power: 45,
    cooldownRounds: 1
  },
  {
    id: "freeze",
    name: "Lá Đóng Băng",
    emoji: "❄️",
    description: "Đóng băng tuyệt đối hành động của đối thủ.",
    effect: "Ngăn chặn đối thủ trả lời và ghi điểm ở vòng này. (Chỉ dùng tối đa 1 lần/trận).",
    colorClass: "text-sky-500 bg-sky-50",
    bgClass: "bg-sky-50 border-sky-300",
    tier: "bac",
    tierLabel: "Bạc (Rare)",
    power: 85,
    cooldownRounds: 2
  },
  {
    id: "sabotage",
    name: "Lá Gây Khó Đối Thủ",
    emoji: "🌪️",
    description: "Cuồng phong câu hỏi nhiễu loạn đối thủ.",
    effect: "Biến câu hỏi của bot thành siêu khó (giảm tỷ lệ đúng còn 15%), nếu bot đúng chỉ nhận điểm gốc.",
    colorClass: "text-teal-600 bg-teal-50",
    bgClass: "bg-teal-50 border-teal-300",
    tier: "bac",
    tierLabel: "Bạc (Rare)",
    power: 70,
    cooldownRounds: 2
  },
  {
    id: "steal",
    name: "Tinh Linh Trộm Điểm",
    emoji: "🦊",
    description: "Trộm điểm số từ đối thủ.",
    effect: "Nếu đối thủ đúng, nhận ngay 50% số điểm của họ làm của mình.",
    colorClass: "text-emerald-600 bg-emerald-50",
    bgClass: "bg-emerald-50 border-emerald-300",
    tier: "bac",
    tierLabel: "Bạc (Rare)",
    power: 75,
    cooldownRounds: 2
  },
  {
    id: "mult15",
    name: "Lá Nhân Hệ Số 1.5",
    emoji: "⚡",
    description: "Dòng điện cường hóa điểm số.",
    effect: "Tăng 1.5 lần số điểm nhận được ở lượt hiện tại nếu em trả lời chính xác.",
    colorClass: "text-yellow-600 bg-yellow-50",
    bgClass: "bg-yellow-50 border-yellow-300",
    tier: "vang",
    tierLabel: "Vàng (Epic)",
    power: 60,
    cooldownRounds: 1
  },
  {
    id: "luck",
    name: "Xúc Xắc Trí Tuệ",
    emoji: "🎲",
    description: "Xúc xắc may rủi nhận điểm số.",
    effect: "Nếu đúng, nhận ngẫu nhiên x1.5, x2 hoặc x3 điểm số lượt này!",
    colorClass: "text-purple-600 bg-purple-50",
    bgClass: "bg-purple-50 border-purple-300",
    tier: "vang",
    tierLabel: "Vàng (Epic)",
    power: 68,
    cooldownRounds: 2
  },
  {
    id: "mult2",
    name: "Lá Nhân Hệ Số 2.0",
    emoji: "🔥",
    description: "Ngọn lửa bứt phá điểm số tối thượng.",
    effect: "Nhân đôi (x2) điểm số nhận được ở lượt hiện tại nếu em trả lời chính xác.",
    colorClass: "text-rose-600 bg-rose-50",
    bgClass: "bg-rose-50 border-rose-350",
    tier: "kimcuong",
    tierLabel: "Kim Cương (Legendary)",
    power: 80,
    cooldownRounds: 2
  },
  {
    id: "divine",
    name: "Thần Nhãn Học Đường",
    emoji: "👁️",
    description: "Mắt thần chỉ đường dẫn lối đáp án.",
    effect: "Tiết lộ trực tiếp và tự chọn ngay đáp án chính xác của câu hỏi này!",
    colorClass: "text-indigo-600 bg-indigo-50",
    bgClass: "bg-indigo-50 border-indigo-300",
    tier: "kimcuong",
    tierLabel: "Kim Cương (Legendary)",
    power: 88,
    cooldownRounds: 3
  },
  {
    id: "challenge",
    name: "Thách Thức Vô Song",
    emoji: "🌌",
    description: "Vực sâu tri thức vũ trụ huyền thoại.",
    effect: "Nâng độ khó lên mức siêu phàm 'Vô Song'. Trả lời đúng nhận ngẫu nhiên x2 hoặc x3 điểm!",
    colorClass: "text-fuchsia-600 bg-fuchsia-50",
    bgClass: "bg-gradient-to-br from-fuchsia-50 via-indigo-50 to-pink-50 border-fuchsia-400",
    tier: "baymau",
    tierLabel: "Bảy Màu (Mythic)",
    power: 95,
    cooldownRounds: 3
  },
  {
    id: "omega",
    name: "Ma Pháp Omega",
    emoji: "🪐",
    description: "Quyền năng tối thượng dung hợp.",
    effect: "Tự động trả lời đúng, nhân đôi điểm số, đồng thời đóng băng đối thủ ở lượt này!",
    colorClass: "text-violet-600 bg-violet-50",
    bgClass: "bg-gradient-to-br from-violet-50 via-purple-100 to-indigo-100 border-violet-400",
    tier: "baymau",
    tierLabel: "Bảy Màu (Mythic)",
    power: 99,
    cooldownRounds: 3
  },
  {
    id: "time_warp",
    name: "Vòng Lặp Thời Gian",
    emoji: "🌀",
    description: "Bùa chú uốn cong thời gian, sửa chữa sai lầm.",
    effect: "Độc quyền Fusion! Nếu trả lời sai lượt này, hồi phục lượt chơi và cho phép chọn lại mà không bị phạt điểm.",
    colorClass: "text-cyan-500 bg-cyan-50",
    bgClass: "bg-gradient-to-br from-cyan-50 via-sky-100 to-indigo-100 border-cyan-400",
    tier: "baymau",
    tierLabel: "Bảy Màu (Độc Quyền)",
    power: 92,
    cooldownRounds: 3
  },
  {
    id: "double_strike",
    name: "Song Kích Trí Tuệ",
    emoji: "⚔️",
    description: "Đòn tấn công kép hủy diệt điểm số đối thủ.",
    effect: "Độc quyền Fusion! Trả lời đúng lượt này sẽ trừ ngay 100 điểm của đối thủ và cộng vào điểm của em!",
    colorClass: "text-rose-500 bg-rose-50",
    bgClass: "bg-gradient-to-br from-rose-50 via-pink-100 to-red-100 border-rose-400",
    tier: "baymau",
    tierLabel: "Bảy Màu (Độc Quyền)",
    power: 96,
    cooldownRounds: 3
  },
  {
    id: "double_time",
    name: "Tốc Độ Kép",
    emoji: "🏃⚡",
    description: "Kích hoạt dòng chảy thời gian thần tốc.",
    effect: "Nhận thêm +100% điểm cơ bản nếu trả lời đúng trong vòng 3 giây đầu tiên của câu hỏi!",
    colorClass: "text-sky-600 bg-sky-50",
    bgClass: "bg-gradient-to-br from-sky-50 via-sky-100 to-indigo-100 border-sky-300",
    tier: "dong",
    tierLabel: "Đồng (Common)",
    power: 42,
    cooldownRounds: 1
  },
  {
    id: "intel_link",
    name: "Thấu Thị Thần Truyền",
    emoji: "🧠",
    description: "Sợi dây liên kết tâm trí, khai thông huệ nhãn.",
    effect: "Trả lời đúng vòng này sẽ biết trước nội dung và đáp án đúng của câu hỏi tiếp theo!",
    colorClass: "text-emerald-500 bg-emerald-50",
    bgClass: "bg-gradient-to-br from-emerald-50 via-teal-100 to-emerald-100 border-emerald-300",
    tier: "bac",
    tierLabel: "Bạc (Rare)",
    power: 72,
    cooldownRounds: 2
  },
  {
    id: "shield_drain",
    name: "Giáp Hấp Thụ",
    emoji: "🛡️⚡",
    description: "Hấp thụ năng lượng dư thừa từ đối thủ.",
    effect: "Nếu đối thủ đúng vòng này, Khiên hấp thụ điểm của họ: họ nhận 0đ, em nhận 100% điểm đó!",
    colorClass: "text-amber-600 bg-amber-50",
    bgClass: "bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-100 border-amber-400 shadow-amber-100",
    tier: "vang",
    tierLabel: "Vàng (Epic)",
    power: 79,
    cooldownRounds: 2
  },
  {
    id: "mind_swap",
    name: "Thoán Đoạt Tư Duy",
    emoji: "🎭",
    description: "Đồng hóa tâm trí đối thủ, hoán đổi may rủi.",
    effect: "Nếu em trả lời sai và đối thủ trả lời đúng vòng này, hoán đổi may rủi và nhận trọn điểm đối thủ!",
    colorClass: "text-violet-650 bg-violet-50",
    bgClass: "bg-gradient-to-br from-violet-50 via-indigo-100 to-purple-100 border-violet-400",
    tier: "kimcuong",
    tierLabel: "Kim Cương (Legendary)",
    power: 89,
    cooldownRounds: 3
  },
  {
    id: "mirror_force",
    name: "Gương Phản Chiếu",
    emoji: "🪞",
    description: "Gương phản chiếu ma pháp, hóa giải mọi đòn hại.",
    effect: "Độc quyền Fusion! Phản lại hiệu ứng 'Lá Che Màn' từ đối thủ, trừ 50 điểm của đối thủ và làm mù họ 5s!",
    colorClass: "text-cyan-500 bg-cyan-50",
    bgClass: "bg-gradient-to-br from-cyan-50 via-teal-50 to-indigo-50 border-cyan-300 shadow-cyan-100",
    tier: "baymau",
    tierLabel: "Bảy Màu (Độc Quyền)",
    power: 94,
    cooldownRounds: 3
  },
  {
    id: "super_nova",
    name: "Vũ Trụ Siêu Tân Tinh",
    emoji: "💥",
    description: "Cơn bão tri thức kích nổ điểm số vũ trụ.",
    effect: "Độc quyền Fusion! Tự động trả lời đúng, đồng thời nhân gấp 3 lần (x3.0) số điểm của vòng này!",
    colorClass: "text-rose-500 bg-rose-50",
    bgClass: "bg-gradient-to-br from-rose-50 via-pink-100 to-red-100 border-rose-400 shadow-rose-200 animate-pulse",
    tier: "baymau",
    tierLabel: "Bảy Màu (Độc Quyền)",
    power: 98,
    cooldownRounds: 3
  }
];

export default function PKArena({ progress, selectedAvatarIdx, updateProgress, triggerSuccessMessage, lessons = [] }: PKArenaProps) {
  const [pkTab, setPkTab] = useState<"lobby" | "leaderboard" | "matchmaking" | "battle" | "results">("lobby");
  
  // Get categories from past lessons
  const availableCategories = React.useMemo(() => {
    const defaultCategories = [
      { id: "toan", name: "Toán Học", subject: "Toán Học", icon: "📐" },
      { id: "lichsu", name: "Lịch Sử", subject: "Lịch Sử", icon: "📜" },
      { id: "dialy", name: "Địa Lý", subject: "Địa Lý", icon: "🌍" },
      { id: "khoahoc", name: "Khoa Học", subject: "Khoa Học", icon: "🧪" },
      { id: "tienganh", name: "Tiếng Anh", subject: "Tiếng Anh", icon: "🇬🇧" },
    ];

    if (!lessons || lessons.length === 0) {
      return defaultCategories;
    }

    const categoriesMap = new Map<string, { id: string; name: string; subject: string; icon: string }>();
    
    lessons.forEach((lesson) => {
      const name = lesson.topic || lesson.bookName || "Học Tập";
      const id = lesson.id;
      let icon = "📚";
      let subject = "Khoa Học";
      
      const lowerBook = lesson.bookName.toLowerCase();
      const lowerTitle = lesson.title.toLowerCase();
      const lowerTopic = (lesson.topic || "").toLowerCase();

      if (lowerBook.includes("toán") || lowerTitle.includes("toán") || lowerTopic.includes("toán")) {
        icon = "📐";
        subject = "Toán Học";
      } else if (lowerBook.includes("sử") || lowerTitle.includes("sử") || lowerTopic.includes("sử")) {
        icon = "📜";
        subject = "Lịch Sử";
      } else if (lowerBook.includes("địa") || lowerTitle.includes("địa") || lowerTopic.includes("địa")) {
        icon = "🌍";
        subject = "Địa Lý";
      } else if (lowerBook.includes("văn") || lowerTitle.includes("văn") || lowerTopic.includes("văn") || lowerTitle.includes("chữ")) {
        icon = "✍️";
        subject = "Tiếng Anh";
      } else if (lowerBook.includes("anh") || lowerTitle.includes("anh") || lowerTopic.includes("anh")) {
        icon = "🇬🇧";
        subject = "Tiếng Anh";
      } else if (lowerBook.includes("khoa") || lowerTitle.includes("khoa") || lowerTopic.includes("khoa") || lowerTitle.includes("nước") || lowerTopic.includes("nước") || lowerTitle.includes("sinh")) {
        icon = "🧪";
        subject = "Khoa Học";
      }

      categoriesMap.set(name, {
        id,
        name,
        subject,
        icon
      });
    });

    const userCategories = Array.from(categoriesMap.values());
    return userCategories.length > 0 ? userCategories : defaultCategories;
  }, [lessons]);

  const [selectedOpponent, setSelectedOpponent] = useState<typeof BOT_POOL[0]>(BOT_POOL[0]);
  const [selectedCategory, setSelectedCategory] = useState<typeof availableCategories[0]>(availableCategories[0]);

  // Sync selectedCategory when availableCategories changes
  useEffect(() => {
    if (availableCategories.length > 0) {
      setSelectedCategory((prev) => {
        if (prev && prev.id === availableCategories[0].id) {
          return prev;
        }
        return availableCategories[0];
      });
    }
  }, [availableCategories]);

  // PK Stats for the current user
  const [userPkWins, setUserPkWins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("smart_study_pk_wins_v2");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [userPkLosses, setUserPkLosses] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("smart_study_pk_losses_v2");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [pkStreak, setPkStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("smart_study_pk_streak_v2");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Sound feedback toggle
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);

  // Difficulty selection
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");

  // Opponent during match
  const [opponent, setOpponent] = useState<{
    name: string;
    avatarEmoji: string;
    level: number;
    title: string;
    score: number;
    answered: boolean;
    choice: number | null;
  } | null>(null);

  // Live match state
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundQuestions, setRoundQuestions] = useState<typeof PK_QUESTION_POOL>([]);
  const [userScore, setUserScore] = useState<number>(0);
  const [userChoice, setUserChoice] = useState<number | null>(null);
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(10);
  const [roundRevealed, setRoundRevealed] = useState<boolean>(false);
  const [triggerConfetti, setTriggerConfetti] = useState<boolean>(false);

  // Matchmaking animations
  const [searchingTimer, setSearchingTimer] = useState<number>(0);
  const [searchingStatus, setSearchingStatus] = useState<string>("Đang kết nối đấu trường...");

  // PK Leaderboard state
  const [pkLeaderboard, setPkLeaderboard] = useState<PKCompetitor[]>([]);

  // Magic Cards persistent battle states
  const [magicCards, setMagicCards] = useState<Record<string, number>>(() => {
    const defaultCards = { 
      hint: 0, 
      timeslow: 0, 
      blind: 0, 
      shield: 0, 
      freeze: 0, 
      sabotage: 0, 
      steal: 0, 
      mult15: 0, 
      luck: 0, 
      mult2: 0, 
      divine: 0, 
      challenge: 0, 
      omega: 0,
      time_warp: 0,
      double_strike: 0,
      double_time: 0,
      intel_link: 0,
      shield_drain: 0,
      mind_swap: 0,
      mirror_force: 0,
      super_nova: 0
    };
    try {
      const saved = localStorage.getItem("smart_study_magic_cards_v2");
      return saved ? { ...defaultCards, ...JSON.parse(saved) } : defaultCards;
    } catch {
      return defaultCards;
    }
  });

  // Active round-by-round card modifiers
  const [disabledOptionIndices, setDisabledOptionIndices] = useState<number[]>([]);
  const [isBotFrozen, setIsBotFrozen] = useState<boolean>(false);
  const [isFreezeUsedThisMatch, setIsFreezeUsedThisMatch] = useState<boolean>(false);
  const [playerBlindedTime, setPlayerBlindedTime] = useState<number>(0);
  const [isOpponentBlinded, setIsOpponentBlinded] = useState<boolean>(false);
  const [isOpponentSabotaged, setIsOpponentSabotaged] = useState<boolean>(false);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1);
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const [isStealActive, setIsStealActive] = useState<boolean>(false);
  const [isTimeWarpActive, setIsTimeWarpActive] = useState<boolean>(false);
  const [isDoubleStrikeActive, setIsDoubleStrikeActive] = useState<boolean>(false);
  const [isDoubleTimeActive, setIsDoubleTimeActive] = useState<boolean>(false);
  const [userAnsweringTime, setUserAnsweringTime] = useState<number | null>(null);
  const [isShieldDrainActive, setIsShieldDrainActive] = useState<boolean>(false);
  const [isMindSwapActive, setIsMindSwapActive] = useState<boolean>(false);
  const [isMirrorForceActive, setIsMirrorForceActive] = useState<boolean>(false);
  const [nextRoundHint, setNextRoundHint] = useState<string | null>(null);
  const [hintRound, setHintRound] = useState<number | null>(null);
  const [cardUsedThisRound, setCardUsedThisRound] = useState<boolean>(false);
  const [activeCardNotification, setActiveCardNotification] = useState<string | null>(null);
  const [cardCooldowns, setCardCooldowns] = useState<Record<string, number>>({});

  // Refs for audio context and interval timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const matchmakingRef = useRef<NodeJS.Timeout | null>(null);

  // Sound playing helper
  const playPkSound = (type: "match" | "correct" | "wrong" | "victory" | "defeat") => {
    if (!isSoundOn) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "match") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      } else if (type === "correct") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.1); // B5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      } else if (type === "wrong") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.setValueAtTime(120, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      } else if (type === "victory") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      } else if (type === "defeat") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch (e) {
      console.warn("Audio blocked:", e);
    }
  };

  // Generate / Load PK Leaderboard
  useEffect(() => {
    try {
      const savedLeaderboard = localStorage.getItem("smart_study_pk_leaderboard_v2");
      let board: PKCompetitor[] = [];

      if (savedLeaderboard) {
        board = JSON.parse(savedLeaderboard);
      } else {
        board = BOT_POOL.map((b, i) => ({
          id: `pk-bot-${i}`,
          name: b.name,
          avatarEmoji: b.avatarEmoji,
          level: b.level,
          pkWins: Math.floor(b.winRate * 0.4) + Math.floor(Math.random() * 5),
          winRate: b.winRate,
          title: b.title
        }));
      }

      const userAvatar = getAvatarAtLevel(selectedAvatarIdx, progress.level);
      const userInBoard: PKCompetitor = {
        id: "pk-user",
        name: localStorage.getItem("smart_study_nickname_v2") || "Học Viên Ưu Tú",
        avatarEmoji: userAvatar.emoji,
        level: progress.level,
        pkWins: userPkWins,
        winRate: userPkWins + userPkLosses > 0 ? Math.round((userPkWins / (userPkWins + userPkLosses)) * 100) : 0,
        title: userAvatar.title,
        isCurrentUser: true
      };

      const filtered = board.filter(b => b.id !== "pk-user");
      filtered.push(userInBoard);

      const sorted = filtered.sort((a, b) => b.pkWins - a.pkWins);
      setPkLeaderboard(sorted);
      localStorage.setItem("smart_study_pk_leaderboard_v2", JSON.stringify(sorted));
    } catch (e) {
      console.error("Leaderboard init error:", e);
    }
  }, [userPkWins, userPkLosses, progress.level, selectedAvatarIdx]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (matchmakingRef.current) clearInterval(matchmakingRef.current);
    };
  }, []);

  // Matchmaking sequence
  const startMatchmaking = () => {
    setPkTab("matchmaking");
    setSearchingTimer(0);
    const opponentName = selectedOpponent ? selectedOpponent.name : "đối thủ";
    setSearchingStatus(`Đang thiết lập phòng đấu với ${opponentName}...`);
    playPkSound("match");

    // Load fresh magic card inventory
    try {
      const saved = localStorage.getItem("smart_study_magic_cards_v2");
      if (saved) {
        setMagicCards(JSON.parse(saved));
      }
    } catch (e) {
      console.warn(e);
    }

    // Reset card modifiers for new match
    setIsFreezeUsedThisMatch(false);
    setIsBotFrozen(false);
    setPlayerBlindedTime(0);
    setIsOpponentBlinded(false);
    setIsOpponentSabotaged(false);
    setScoreMultiplier(1);
    setIsShieldActive(false);
    setIsStealActive(false);
    setIsTimeWarpActive(false);
    setIsDoubleStrikeActive(false);
    setCardUsedThisRound(false);
    setDisabledOptionIndices([]);
    setActiveCardNotification(null);
    setCardCooldowns({});

    let elapsed = 0;
    matchmakingRef.current = setInterval(() => {
      elapsed += 1;
      setSearchingTimer(elapsed);

      if (elapsed === 1) {
        setSearchingStatus("Đang kiểm tra tín hiệu đấu trường...");
      } else if (elapsed === 2) {
        setSearchingStatus(`Đang mời ${opponentName} vào phòng thi...`);
      } else if (elapsed === 3) {
        const chosenOpp = selectedOpponent || BOT_POOL[Math.floor(Math.random() * BOT_POOL.length)];
        setOpponent({
          name: chosenOpp.name,
          avatarEmoji: chosenOpp.avatarEmoji,
          level: chosenOpp.level,
          title: chosenOpp.title,
          score: 0,
          answered: false,
          choice: null
        });
        setSearchingStatus(`🔥 ĐỐI THỦ ĐÃ CHẤP NHẬN: Lên đài nghênh chiến!`);
      } else if (elapsed === 4) {
        setSearchingStatus(`📚 Đang tải kho đề: chủ đề "${selectedCategory?.name || "Tổng Hợp"}"...`);
      } else if (elapsed === 5) {
        clearInterval(matchmakingRef.current!);
        
        let pool = PK_QUESTION_POOL;
        
        if (selectedCategory) {
          const categorySubject = selectedCategory.subject;
          const filteredBySubject = PK_QUESTION_POOL.filter(
            q => q.subject.toLowerCase().includes(categorySubject.toLowerCase()) || 
                 categorySubject.toLowerCase().includes(q.subject.toLowerCase())
          );
          if (filteredBySubject.length > 0) {
            pool = filteredBySubject;
          }
        }

        if (difficulty === "easy") {
          pool = pool.filter(q => q.difficulty === "easy" || q.difficulty === "medium");
        } else if (difficulty === "hard") {
          pool = pool.filter(q => q.difficulty === "hard" || q.difficulty === "medium");
        }

        if (pool.length < 3) {
          let fallbackPool = PK_QUESTION_POOL;
          if (difficulty === "easy") {
            fallbackPool = PK_QUESTION_POOL.filter(q => q.difficulty === "easy" || q.difficulty === "medium");
          } else if (difficulty === "hard") {
            fallbackPool = PK_QUESTION_POOL.filter(q => q.difficulty === "hard" || q.difficulty === "medium");
          }
          pool = [...pool, ...fallbackPool.filter(fq => !pool.some(pq => pq.question === fq.question))];
        }
        
        const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
        
        setRoundQuestions(shuffled);
        setCurrentRound(1);
        setUserScore(0);
        setUserChoice(null);
        setRoundRevealed(false);
        setRoundTimeLeft(10);
        setPkTab("battle");
        
        startRoundTimer(shuffled, 1);
      }
    }, 1000);
  };

  const startRoundTimer = (questionsList = roundQuestions, roundNum = currentRound) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRoundTimeLeft(10);

    // Dynamic opponent answer delay
    const botAnswerDelay = Math.floor(Math.random() * 4) + (difficulty === "easy" ? 4 : difficulty === "medium" ? 3 : 2);
    
    // Opponent counter-attack logic!
    // At round 2 or 3, there's a 30% chance the bot plays "Lá Che Màn Hình" against us at the very start!
    const isBotCounterAttack = (roundNum === 2 || roundNum === 3) && Math.random() < 0.3;
    if (isBotCounterAttack) {
      setPlayerBlindedTime(5);
      triggerSuccessMessage(`⚠️ Đối thủ ${opponent?.name || "đối thủ"} đã sử dụng "Lá Che Màn Hình" lên em! Màn hình bị tối đen 5 giây!`);
      
      let sec = 5;
      const bInt = setInterval(() => {
        sec -= 1;
        setPlayerBlindedTime(sec);
        if (sec <= 0) {
          clearInterval(bInt);
        }
      }, 1000);
    }

    timerRef.current = setInterval(() => {
      setRoundTimeLeft((prev) => {
        const nextTime = prev - 1;

        if (10 - nextTime === botAnswerDelay && opponent) {
          simulateBotAnswer(questionsList, roundNum);
        }

        if (nextTime <= 0) {
          clearInterval(timerRef.current!);
          revealRoundResults(questionsList, roundNum);
          return 0;
        }
        return nextTime;
      });
    }, 1000);
  };

  const simulateBotAnswer = (questionsList = roundQuestions, roundNum = currentRound) => {
    setOpponent((prev) => {
      if (!prev) return null;
      if (prev.answered) return prev;

      // Bot frozen effect
      if (isBotFrozen) {
        return {
          ...prev,
          answered: true,
          choice: -1 // failed/no score choice
        };
      }

      const activeQuestion = questionsList[roundNum - 1];
      if (!activeQuestion) return prev;

      const isCorrectChance = Math.random() * 100;
      let targetAccuracy = 40;
      if (difficulty === "medium") targetAccuracy = 65;
      if (difficulty === "hard") targetAccuracy = 90;

      // Sabotage card penalty
      if (isOpponentSabotaged) {
        targetAccuracy = 15;
      }

      // Blind card penalty
      if (isOpponentBlinded) {
        targetAccuracy = 10;
      }

      let chosenIndex = Math.floor(Math.random() * 4);
      if (isCorrectChance < targetAccuracy) {
        chosenIndex = activeQuestion.correctIndex;
      } else {
        const wrongs = [0, 1, 2, 3].filter(idx => idx !== activeQuestion.correctIndex);
        chosenIndex = wrongs[Math.floor(Math.random() * wrongs.length)];
      }

      return {
        ...prev,
        answered: true,
        choice: chosenIndex
      };
    });
  };

  const handleUserAnswer = (choiceIndex: number) => {
    if (userChoice !== null || roundRevealed) return;
    setUserChoice(choiceIndex);
    setUserAnsweringTime(roundTimeLeft);

    if (opponent && !opponent.answered) {
      setTimeout(() => {
        simulateBotAnswer();
      }, Math.random() * 800 + 300);
    }
  };

  const revealRoundResults = (questionsList = roundQuestions, roundNum = currentRound) => {
    setRoundRevealed(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const activeQuestion = questionsList[roundNum - 1];
    if (!activeQuestion) return;

    let userCorrect = userChoice === activeQuestion.correctIndex;
    
    if (!userCorrect && isTimeWarpActive) {
      setIsTimeWarpActive(false);
      setUserChoice(null);
      setRoundRevealed(false);
      setRoundTimeLeft(12); // Give them 12 seconds to choose again
      triggerSuccessMessage("🌀 Vòng Lặp Thời Gian kích hoạt! Thời gian quay ngược, em được cứu sống, hãy chọn lại!");
      setActiveCardNotification("🌀 Vòng Lặp Thời Gian: Hãy chọn phương án chính xác!");
      startRoundTimer(questionsList, roundNum);
      return;
    }

    let updatedOpponent = opponent;
    if (opponent && !opponent.answered) {
      let botChoice = -1;
      
      if (!isBotFrozen) {
        const isCorrectChance = Math.random() * 100;
        let targetAccuracy = difficulty === "easy" ? 40 : difficulty === "medium" ? 65 : 90;
        if (isOpponentSabotaged) targetAccuracy = 15;
        if (isOpponentBlinded) targetAccuracy = 10;

        botChoice = activeQuestion.correctIndex;
        if (isCorrectChance >= targetAccuracy) {
          botChoice = (activeQuestion.correctIndex + 1) % 4;
        }
      }

      updatedOpponent = {
        ...opponent,
        answered: true,
        choice: botChoice
      };
      setOpponent(updatedOpponent);
    }

    let botCorrect = updatedOpponent ? updatedOpponent.choice === activeQuestion.correctIndex : false;

    // Base point calculations
    let baseRoundPoints = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 40;

    if (isMindSwapActive) {
      if (!userCorrect && botCorrect) {
        setUserScore(prev => prev + baseRoundPoints);
        triggerSuccessMessage("🎭 Thoán Đoạt Tư Duy: Đã hoán đổi tư duy! Em nhận +100% điểm đối thủ, đối thủ 0đ vòng này!");
      } else if (userCorrect) {
        let addedScore = Math.round(baseRoundPoints * scoreMultiplier);
        if (isDoubleTimeActive && userAnsweringTime !== null && userAnsweringTime >= 12) {
          addedScore += baseRoundPoints;
          triggerSuccessMessage("🏃⚡ Tốc Độ Kép: Em đã trả lời đúng thần tốc dưới 3 giây! Cộng thêm +100% điểm gốc!");
        }
        setUserScore(prev => prev + addedScore);
        triggerSuccessMessage("🎭 Thoán Đoạt Tư Duy: Em trả lời chính xác và giữ nguyên điểm số!");
      }
      playPkSound(userCorrect ? "correct" : "wrong");
    } else {
      if (userCorrect) {
        let addedScore = Math.round(baseRoundPoints * scoreMultiplier);
        if (isDoubleTimeActive && userAnsweringTime !== null && userAnsweringTime >= 12) {
          addedScore += baseRoundPoints;
          triggerSuccessMessage("🏃⚡ Tốc Độ Kép: Em đã trả lời đúng thần tốc dưới 3 giây! Cộng thêm +100% điểm gốc!");
        }
        if (isDoubleStrikeActive) {
          addedScore += 100;
          setOpponent(prev => prev ? { ...prev, score: Math.max(0, prev.score - 100) } : null);
          triggerSuccessMessage("⚔️ Song Kích Trí Tuệ: Đối thủ bị trừ 100đ, em được cộng thêm +100đ!");
          setIsDoubleStrikeActive(false);
        }
        setUserScore(prev => prev + addedScore);
        playPkSound("correct");
      } else {
        if (isDoubleStrikeActive) {
          setIsDoubleStrikeActive(false);
        }
        playPkSound("wrong");
      }
    }

    if (botCorrect && updatedOpponent && !isBotFrozen) {
      if (isMindSwapActive && !userCorrect) {
        // Opponent gets nothing because we swapped and took their points
      } else if (isShieldDrainActive) {
        setUserScore(prev => prev + baseRoundPoints);
        triggerSuccessMessage("🛡️⚡ Giáp Hấp Thụ: Hấp thụ trọn vẹn điểm số đối thủ! Đối thủ 0đ, em được +100% điểm hấp thụ!");
      } else if (isShieldActive) {
        // Chặn điểm đối thủ
        triggerSuccessMessage("🛡️ Khiên Học Thuật đã ngăn chặn đối thủ cộng điểm lượt này!");
      } else {
        setOpponent(prev => prev ? { ...prev, score: prev.score + baseRoundPoints } : null);
      }

      if (isStealActive && (!isMindSwapActive || userCorrect)) {
        const stolenPoints = Math.round(baseRoundPoints * 0.5);
        setUserScore(prev => prev + stolenPoints);
        triggerSuccessMessage(`🦊 Tinh Linh Trộm Điểm mang về cho em +${stolenPoints} điểm từ đối thủ!`);
      }
    }

    // Always clear mind swap trigger status after evaluation
    if (isMindSwapActive) {
      setIsMindSwapActive(false);
    }
  };

  const handleNextRound = () => {
    if (currentRound < 3) {
      const nextRnd = currentRound + 1;
      setCurrentRound(nextRnd);
      setUserChoice(null);
      setRoundRevealed(false);
      
      // Update cooldowns
      setCardCooldowns(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] > 0) {
            next[key] -= 1;
          }
        });
        return next;
      });

      // Reset card triggers for new round
      setCardUsedThisRound(false);
      setDisabledOptionIndices([]);
      setIsBotFrozen(false);
      setIsOpponentBlinded(false);
      setIsOpponentSabotaged(false);
      setScoreMultiplier(1);
      setIsShieldActive(false);
      setIsStealActive(false);
      setIsTimeWarpActive(false);
      setIsDoubleStrikeActive(false);
      setIsDoubleTimeActive(false);
      setUserAnsweringTime(null);
      setIsShieldDrainActive(false);
      setIsMirrorForceActive(false);
      
      // Clear nextRoundHint if we are moving past the hinted round
      if (hintRound && nextRnd > hintRound) {
        setNextRoundHint(null);
        setHintRound(null);
      }

      setActiveCardNotification(null);

      setOpponent(prev => prev ? { ...prev, answered: false, choice: null } : null);
      startRoundTimer(roundQuestions, nextRnd);
    } else {
      processMatchResults();
    }
  };

  const processMatchResults = () => {
    setPkTab("results");
    
    let isWin = userScore > (opponent?.score || 0);
    let isDraw = userScore === (opponent?.score || 0);

    if (isWin) {
      const nextWins = userPkWins + 1;
      setUserPkWins(nextWins);
      const nextStreak = pkStreak + 1;
      setPkStreak(nextStreak);
      localStorage.setItem("smart_study_pk_wins_v2", nextWins.toString());
      localStorage.setItem("smart_study_pk_streak_v2", nextStreak.toString());

      let xpAward = difficulty === "easy" ? 25 : difficulty === "medium" ? 40 : 70;
      let coinAward = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 45;

      updateProgress({
        points: progress.points + xpAward,
        coins: (progress.coins || 0) + coinAward
      });

      setTriggerConfetti(true);
      playPkSound("victory");
      triggerSuccessMessage(`👑 CHIẾN THẮNG! Em nhận được +${xpAward} XP và +${coinAward} Xu thưởng!`);

    } else if (isDraw) {
      triggerSuccessMessage("🤝 Hòa nhau rồi! Hai bên ngang sức ngang tài!");
      playPkSound("correct");
    } else {
      const nextLosses = userPkLosses + 1;
      setUserPkLosses(nextLosses);
      setPkStreak(0);
      localStorage.setItem("smart_study_pk_losses_v2", nextLosses.toString());
      localStorage.setItem("smart_study_pk_streak_v2", "0");

      updateProgress({
        points: progress.points + 5,
        coins: (progress.coins || 0) + 2
      });

      playPkSound("defeat");
      triggerSuccessMessage("😢 Tiếc quá! Cố gắng luyện tập thêm để chiến thắng lần sau nhé. Nhận +5 XP an ủi.");
    }
  };

  const quitBattle = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (matchmakingRef.current) clearInterval(matchmakingRef.current);
    setPkTab("lobby");
    setOpponent(null);
  };

  // Activates Magic Card in the current Battle round
  const handleUseCardInBattle = (cardId: string) => {
    if (cardUsedThisRound || roundRevealed) return;
    if ((magicCards[cardId] || 0) <= 0) return;
    if ((cardCooldowns[cardId] || 0) > 0) {
      triggerSuccessMessage("⏳ Thẻ bài này đang trong thời gian hồi chiêu!");
      return;
    }

    // Deduct and save
    const nextInventory = { ...magicCards, [cardId]: magicCards[cardId] - 1 };
    setMagicCards(nextInventory);
    localStorage.setItem("smart_study_magic_cards_v2", JSON.stringify(nextInventory));
    setCardUsedThisRound(true);

    const cardDef = MAGIC_CARDS_LIST.find(c => c.id === cardId);
    if (cardDef) {
      setCardCooldowns(prev => ({ ...prev, [cardId]: cardDef.cooldownRounds }));
    }

    // Apply card specific logic
    if (cardId === "hint") {
      const activeQuestion = roundQuestions[currentRound - 1];
      if (activeQuestion) {
        const correctIdx = activeQuestion.correctIndex;
        const wrongIndices = [0, 1, 2, 3].filter(idx => idx !== correctIdx);
        const shuffledWrongs = [...wrongIndices].sort(() => 0.5 - Math.random());
        // Disable 2 wrong answers
        setDisabledOptionIndices(shuffledWrongs.slice(0, 2));
        setActiveCardNotification("💡 Gợi Ý Tri Thức: Loại bỏ 2 phương án sai lệch thành công!");
        triggerSuccessMessage("💡 Đã loại bỏ 2 đáp án sai!");
      }
    } 
    else if (cardId === "freeze") {
      setIsBotFrozen(true);
      setIsFreezeUsedThisMatch(true);
      setOpponent(prev => prev ? { ...prev, answered: true, choice: -1 } : null);
      setActiveCardNotification("❄️ Đóng Băng Đối Thủ: Băng phong ý chí đối thủ! Đối thủ không trả lời được lượt này.");
      triggerSuccessMessage("❄️ Đã đóng băng đối thủ thành công!");
    } 
    else if (cardId === "blind") {
      setIsOpponentBlinded(true);
      setActiveCardNotification("🌫️ Sương Mù Che Màn: Giảm tỷ lệ đúng của bot xuống 10% ở lượt này!");
      triggerSuccessMessage("🌫️ Đối thủ bị sương mù che mắt thành công!");
    } 
    else if (cardId === "timeslow") {
      setRoundTimeLeft(prev => prev + 10);
      setActiveCardNotification("⏳ Ngưng Đọng Thời Gian: Cộng 10 giây suy nghĩ cho câu hỏi hiện tại!");
      triggerSuccessMessage("⏳ Cộng thêm 10 giây suy nghĩ thành công!");
    }
    else if (cardId === "shield") {
      setIsShieldActive(true);
      setActiveCardNotification("🛡️ Khiên Học Thuật: Lá chắn bảo vệ! Chặn đối thủ cộng điểm ở lượt này nếu họ trả lời đúng.");
      triggerSuccessMessage("🛡️ Đã dựng Khiên Học Thuật bảo vệ!");
    }
    else if (cardId === "steal") {
      setIsStealActive(true);
      setActiveCardNotification("🦊 Tinh Linh Trộm Điểm: Kích hoạt bùa trộm! Nhận ngay 50% số điểm của đối thủ nếu họ trả lời đúng.");
      triggerSuccessMessage("🦊 Đã thả Tinh Linh Trộm Điểm rình rập đối thủ!");
    }
    else if (cardId === "sabotage") {
      setIsOpponentSabotaged(true);
      setActiveCardNotification("🌪️ Cuồng Phong Gây Khó: Thay đổi độ khó câu hỏi đối thủ xuống 15% đúng!");
      triggerSuccessMessage("🌪️ Đã làm nhiễu loạn câu hỏi đối thủ!");
    } 
    else if (cardId === "mult15") {
      setScoreMultiplier(1.5);
      setActiveCardNotification("⚡ Sấm Sét Tri Thức: Nhận x1.5 điểm số nếu em trả lời đúng!");
      triggerSuccessMessage("⚡ Kích hoạt x1.5 điểm thành công!");
    } 
    else if (cardId === "luck") {
      const multipliers = [1.5, 2, 3];
      const selectedMult = multipliers[Math.floor(Math.random() * multipliers.length)];
      setScoreMultiplier(selectedMult);
      setActiveCardNotification(`🎲 Xúc Xắc Trí Tuệ: Nhận ngẫu nhiên x${selectedMult} lần điểm số nếu em trả lời chính xác lượt này!`);
      triggerSuccessMessage(`🎲 Thả xúc xắc nhận hệ số x${selectedMult} điểm!`);
    }
    else if (cardId === "mult2") {
      setScoreMultiplier(2);
      setActiveCardNotification("🔥 Lửa Trí Tuệ: Nhận x2 điểm số nếu em trả lời đúng!");
      triggerSuccessMessage("🔥 Kích hoạt x2 điểm thành công!");
    } 
    else if (cardId === "divine") {
      const activeQuestion = roundQuestions[currentRound - 1];
      if (activeQuestion) {
        handleUserAnswer(activeQuestion.correctIndex);
        setActiveCardNotification("👁️ Thần Nhãn Học Đường: Thần thông dẫn lối! Đã tự động chọn chính xác câu trả lời.");
        triggerSuccessMessage("👁️ Thần Nhãn đã chọn đáp án đúng cho em!");
      }
    }
    else if (cardId === "challenge") {
      // Swap current round question with an extremely difficult one
      const randomLegendary = SUPER_HARD_QUESTION_POOL[Math.floor(Math.random() * SUPER_HARD_QUESTION_POOL.length)];
      const nextQuestions = [...roundQuestions];
      nextQuestions[currentRound - 1] = randomLegendary;
      setRoundQuestions(nextQuestions);

      // Random multiplier x2 or x3
      const randMult = Math.random() < 0.5 ? 2 : 3;
      setScoreMultiplier(randMult);
      
      setActiveCardNotification(`🌌 Thách Thức Vô Song: Đổi câu siêu khó, nhận ngay x${randMult} điểm khi trả lời đúng!`);
      triggerSuccessMessage(`🌌 Đã nâng cấp lên câu hỏi Vô Song x${randMult} điểm!`);
    }
    else if (cardId === "omega") {
      setIsBotFrozen(true);
      setOpponent(prev => prev ? { ...prev, answered: true, choice: -1 } : null);
      setScoreMultiplier(2);
      const activeQuestion = roundQuestions[currentRound - 1];
      if (activeQuestion) {
        handleUserAnswer(activeQuestion.correctIndex);
      }
      setActiveCardNotification("🪐 Ma Pháp Omega: Sức mạnh tối thượng tụ hội! Tự chọn đúng, x2 điểm, đóng băng đối thủ!");
      triggerSuccessMessage("🪐 Kích hoạt bùa chú tối thượng OMEGA thành công!");
    }
    else if (cardId === "time_warp") {
      setIsTimeWarpActive(true);
      setActiveCardNotification("🌀 Vòng Lặp Thời Gian: Nếu trả lời sai vòng này, thời gian quay ngược giúp em hồi sinh và chọn lại!");
      triggerSuccessMessage("🌀 Bùa chú uốn cong thời gian bảo hộ thành công!");
    }
    else if (cardId === "double_strike") {
      setIsDoubleStrikeActive(true);
      setActiveCardNotification("⚔️ Song Kích Trí Tuệ: Trả lời đúng vòng này sẽ trừ 100 điểm của đối thủ và cộng thẳng vào điểm của em!");
      triggerSuccessMessage("⚔️ Đòn đánh song kích đã nạp năng lượng!");
    }
    else if (cardId === "double_time") {
      setIsDoubleTimeActive(true);
      setActiveCardNotification("🏃⚡ Tốc Độ Kép: Nhận thêm +100% điểm gốc nếu trả lời đúng trong vòng 3 giây đầu tiên!");
      triggerSuccessMessage("🏃⚡ Đã kích hoạt Tốc Độ Kép thần tốc!");
    }
    else if (cardId === "intel_link") {
      const nextQ = roundQuestions[currentRound]; // currentRound is 1-indexed, so index currentRound is the next round
      if (nextQ) {
        setNextRoundHint(`Câu ${currentRound + 1}: "${nextQ.question.substring(0, 45)}..." - Đáp án đúng: [${nextQ.options[nextQ.correctIndex]}]`);
        setHintRound(currentRound + 1);
        setActiveCardNotification(`🧠 Thấu Thị Thần Truyền: Đã kết nối tâm trí và biết trước đáp án câu hỏi tiếp theo!`);
        triggerSuccessMessage("🧠 Đã liên kết tâm trí và phát hiện tương lai!");
      } else {
        setNextRoundHint("Không còn câu hỏi tiếp theo (Đang ở vòng cuối cùng)!");
        setHintRound(currentRound);
        setActiveCardNotification(`🧠 Thấu Thị Thần Truyền: Không có câu tiếp theo vì đây là vòng cuối!`);
        triggerSuccessMessage("🧠 Đây đã là vòng cuối cùng, không thể thấu thị!");
      }
    }
    else if (cardId === "shield_drain") {
      setIsShieldDrainActive(true);
      setActiveCardNotification("🛡️⚡ Giáp Hấp Thụ: Nếu đối thủ đúng vòng này, họ nhận 0đ và em hấp thụ trọn vẹn số điểm đó!");
      triggerSuccessMessage("🛡️⚡ Đã dựng Giáp Hấp Thụ thành công!");
    }
    else if (cardId === "mind_swap") {
      setIsMindSwapActive(true);
      setActiveCardNotification("🎭 Thoán Đoạt Tư Duy: Nếu em sai và đối thủ đúng vòng này, hoán đổi may rủi và nhận trọn điểm đối thủ!");
      triggerSuccessMessage("🎭 Đã kích hoạt hoán đổi tư duy kỳ bí!");
    }
    else if (cardId === "mirror_force") {
      setIsMirrorForceActive(true);
      if (playerBlindedTime > 0) {
        setPlayerBlindedTime(0);
        setIsOpponentBlinded(true);
        setOpponent(prev => prev ? { ...prev, score: Math.max(0, prev.score - 50) } : null);
        triggerSuccessMessage("🪞 Gương Phản Chiếu: Phản pháo thành công! Giải mù màn hình, làm mù đối thủ và trừ 50 điểm của họ!");
      } else {
        triggerSuccessMessage("🪞 Gương Phản Chiếu: Đã kích hoạt! Sẵn sàng phản lại mọi luồng năng lượng xấu.");
      }
      setActiveCardNotification("🪞 Gương Phản Chiếu: Sẵn sàng phản lại bùa chú từ đối thủ và trừ của họ 50đ!");
    }
    else if (cardId === "super_nova") {
      setScoreMultiplier(3);
      const activeQuestion = roundQuestions[currentRound - 1];
      if (activeQuestion) {
        handleUserAnswer(activeQuestion.correctIndex);
      }
      setActiveCardNotification("💥 Vũ Trụ Siêu Tân Tinh: Tự động chọn đúng, nhân gấp 3 lần (x3.0) điểm số vòng này!");
      triggerSuccessMessage("💥 Đã kích hoạt vụ nổ tri thức Siêu Tân Tinh!");
    }

    // Play visual cue audio
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  const totalMatches = userPkWins + userPkLosses;
  const userWinRate = totalMatches > 0 ? Math.round((userPkWins / totalMatches) * 100) : 0;
  const userAvatarObj = getAvatarAtLevel(selectedAvatarIdx, progress.level);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12 relative">
      {triggerConfetti && <ConfettiCelebration />}

      {/* header hero banner */}
      <div className="bg-gradient-to-tr from-rose-950 via-red-900 to-amber-900 rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-red-950/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-amber-600 rounded-full blur-3xl opacity-30 animate-pulse-slow" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest bg-red-500/30 text-red-200 px-3.5 py-1 rounded-full border border-red-500/20 inline-block animate-pulse">
              Đấu Trường Khốc Liệt ⚔️
            </span>
            <h2 className="font-display font-black text-3xl md:text-4xl tracking-tight leading-tight flex items-center justify-center md:justify-start gap-2">
              <span>ĐẤU PK TRÍ TUỆ</span>
              <Zap className="w-8 h-8 text-amber-400 fill-amber-300 animate-bounce" />
            </h2>
            <p className="text-xs text-red-100/90 max-w-md leading-relaxed">
              Cọ sát đối kháng với các học viên tài năng. Hãy bóc các gói thẻ phép thuật ma thuật tại Cửa Hàng để kích hoạt lật ngược thế cờ cực kỳ gay cấn!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSoundOn(!isSoundOn)}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all cursor-pointer"
              title={isSoundOn ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {isSoundOn ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-red-300" />}
            </button>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-4 flex items-center gap-3 min-w-[160px]">
              <Flame className="w-8 h-8 text-amber-400 fill-amber-300 animate-pulse" />
              <div>
                <p className="text-[9px] font-bold text-red-200 uppercase">Chuỗi thắng</p>
                <p className="text-xl font-black text-white">{pkStreak} Trận</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar selection (Lobby / Leaderboard) */}
      {pkTab !== "matchmaking" && pkTab !== "battle" && pkTab !== "results" && (
        <div className="flex gap-2.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
          <button
            onClick={() => setPkTab("lobby")}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              pkTab === "lobby" ? "bg-white text-slate-850 shadow-md" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sword className="w-4 h-4" />
            <span>Đấu trường & Thách đấu</span>
          </button>
          <button
            onClick={() => setPkTab("leaderboard")}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              pkTab === "leaderboard" ? "bg-white text-slate-850 shadow-md" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Bảng Xếp Hạng PK 🏆</span>
          </button>
        </div>
      )}

      {/* LOBBY INTERFACE */}
      {pkTab === "lobby" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left profile overview */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-6 text-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Thống kê Đấu Sĩ</span>
            
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-red-50 rounded-3xl animate-pulse scale-105" />
              <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center text-6xl shadow-inner relative z-10 select-none">
                {userAvatarObj.emoji}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-slate-800 text-lg">{localStorage.getItem("smart_study_nickname_v2") || "Học Viên Ưu Tú"}</h3>
              <p className="text-xs text-indigo-650 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block">{userAvatarObj.title} • Cấp {progress.level}</p>
            </div>

            {/* Quick stats columns */}
            <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-50 py-4.5">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Trận đấu</p>
                <p className="text-sm font-black text-slate-700">{totalMatches}</p>
              </div>
              <div className="border-l border-r border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase">Thắng</p>
                <p className="text-sm font-black text-emerald-600">{userPkWins} ⚔️</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Tỷ lệ thắng</p>
                <p className="text-sm font-black text-indigo-600">{userWinRate}%</p>
              </div>
            </div>

            {/* Magic Cards brief display */}
            <div className="space-y-2.5 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-fuchsia-500" />
                <span>Kho bài phép thuật ma thuật ({Object.values(magicCards).reduce((a,b)=>a+b, 0)} lá)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MAGIC_CARDS_LIST.map(c => {
                  const qty = magicCards[c.id] || 0;
                  if (qty <= 0) return null;
                  return (
                    <span key={c.id} className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-700 flex items-center gap-1">
                      <span>{c.emoji}</span>
                      <strong className="text-fuchsia-600">x{qty}</strong>
                    </span>
                  );
                })}
                {Object.values(magicCards).reduce((a,b)=>a+b, 0) === 0 && (
                  <p className="text-[10px] text-slate-400 font-medium">Chưa có lá bài phép thuật nào. Ghé Shop bóc thẻ nhé!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Setup Match Panel */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-6">
            <h3 className="font-display font-black text-slate-850 text-base">THIẾT LẬP CHIẾN TRƯỜNG ĐỐI KHÁNG</h3>

            <div className="space-y-5">
              
              {/* Category picker */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-450 uppercase tracking-wider block">1. LỰA CHỌN PHÂN MÔN TRI THỨC</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategory?.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          isSelected 
                            ? "border-red-600 bg-red-50/5 text-red-950 font-black" 
                            : "border-slate-100 hover:border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <span className="text-xl mr-2">{cat.icon}</span>
                        <span className="text-xs font-extrabold">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty slider */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-450 uppercase tracking-wider block">2. ĐỘ KHÓ CHIẾN TRƯỜNG</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["easy", "medium", "hard"] as const).map((level) => {
                    const isSelected = difficulty === level;
                    let label = "Dễ";
                    let reward = "Nhận +25 XP / +10 Xu";
                    let color = "hover:border-emerald-300 text-emerald-800 border-emerald-100";
                    let activeColor = "border-emerald-500 bg-emerald-50/20";
                    
                    if (level === "medium") {
                      label = "Trung Bình";
                      reward = "Nhận +40 XP / +20 Xu";
                      color = "hover:border-amber-300 text-amber-800 border-amber-100";
                      activeColor = "border-amber-500 bg-amber-50/20";
                    } else if (level === "hard") {
                      label = "Khó Nhất ⚡";
                      reward = "Nhận +70 XP / +45 Xu";
                      color = "hover:border-rose-300 text-rose-800 border-rose-100";
                      activeColor = "border-rose-500 bg-rose-50/20";
                    }

                    return (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          isSelected ? activeColor + " border-2 font-black text-sm" : color + " bg-white"
                        }`}
                      >
                        <h4 className="text-xs font-black uppercase tracking-wider">{label}</h4>
                        <p className="text-[9px] mt-1 font-bold text-slate-400">{reward}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opponent Bot picker */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-450 uppercase tracking-wider block">3. LỰA CHỌN ĐỐI THỦ THÁCH ĐẤU</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BOT_POOL.map((bot) => {
                    const isSelected = selectedOpponent?.name === bot.name;
                    return (
                      <div
                        key={bot.name}
                        onClick={() => setSelectedOpponent(bot)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? "border-red-600 bg-red-50/10 shadow-sm" 
                            : "border-slate-100 hover:border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100">{bot.avatarEmoji}</span>
                          <div>
                            <h4 className="text-xs font-black text-slate-800">{bot.name}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">{bot.title} • Lvl {bot.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Tỷ lệ thắng</p>
                          <p className="text-xs font-black text-red-600">{bot.winRate}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Play button */}
              <div className="pt-4">
                <button
                  onClick={startMatchmaking}
                  className="w-full py-4.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-sm uppercase tracking-wider rounded-3xl shadow-xl shadow-red-200 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sword className="w-5 h-5 fill-white" />
                  <span>KÍCH HOẠT ĐẤU ĐÀI NGAY ⚔️</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* LEADERBOARD TAB INTERFACE */}
      {pkTab === "leaderboard" && (
        <div className="bg-white border border-slate-150 rounded-[3rem] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-50 pb-4">
            <div>
              <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Bảng Phong Thần Đấu Sĩ PK</span>
              </h3>
              <p className="text-xs text-slate-400 leading-normal">Bảng xếp hạng cập nhật dựa trên số lượng trận thắng đối kháng của em!</p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl text-xs font-bold text-slate-600">
              Hạng của Em: <strong className="text-red-600 text-sm font-black">#{pkLeaderboard.findIndex(b => b.isCurrentUser) + 1}</strong>
            </div>
          </div>

          <div className="space-y-2.5">
            {pkLeaderboard.map((competitor, idx) => {
              const isUser = competitor.isCurrentUser;
              let medal = "";
              if (idx === 0) medal = "🥇";
              else if (idx === 1) medal = "🥈";
              else if (idx === 2) medal = "🥉";

              return (
                <div
                  key={competitor.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    isUser 
                      ? "border-red-400 bg-red-50/10 shadow-sm font-black ring-2 ring-red-500/10" 
                      : "border-slate-50 bg-white hover:border-slate-150"
                  }`}
                >
                  {/* Left rank and details */}
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-center text-xs font-black text-slate-400">
                      {medal || `#${idx + 1}`}
                    </span>
                    <span className="text-3xl bg-slate-50 w-11 h-11 rounded-xl flex items-center justify-center border border-slate-100">{competitor.avatarEmoji}</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-850 flex items-center gap-2">
                        <span>{competitor.name}</span>
                        {isUser && (
                          <span className="text-[8px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                            Bạn
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{competitor.title} • Lvl {competitor.level}</p>
                    </div>
                  </div>

                  {/* Right PK Win stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Tỷ lệ thắng</p>
                      <p className="text-xs font-extrabold text-slate-600">{competitor.winRate}%</p>
                    </div>
                    <div className="bg-red-50 border border-red-100/50 rounded-2xl px-4 py-2 text-center min-w-[80px]">
                      <p className="text-[8px] font-black text-red-500 uppercase tracking-wider">Số Trận Thắng</p>
                      <p className="text-sm font-black text-red-700">{competitor.pkWins} ⚔️</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MATCHMAKING VIEW */}
      {pkTab === "matchmaking" && (
        <div className="bg-white border border-slate-150 rounded-[3rem] p-8 text-center shadow-xl space-y-8 py-16 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-96 h-96 border-4 border-dashed border-red-500 rounded-full animate-spin [animation-duration:40s]" />
            <div className="w-72 h-72 border border-dashed border-red-500 rounded-full animate-reverse-spin absolute" />
          </div>

          <div className="space-y-4 max-w-md mx-auto relative z-10">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 blur opacity-40 animate-pulse" />
                <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-amber-500 rounded-full flex items-center justify-center text-white text-3xl shadow-lg relative">
                  <Sword className="w-10 h-10 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-black text-slate-850 text-lg">ĐANG GHÉP CẶP ĐẤU TRƯỜNG</h3>
              <p className="text-xs text-slate-455 leading-relaxed font-semibold">Độ khó đã chọn: <strong className="text-red-600 uppercase">{difficulty === "easy" ? "Dễ" : difficulty === "medium" ? "Trung Bình" : "Khó Nhất ⚡"}</strong></p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
              <p className="text-xs font-bold text-indigo-650 animate-pulse">{searchingStatus}</p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
              <div 
                className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(searchingTimer / 5) * 100}%` }}
              />
            </div>

            <div className="pt-4">
              <button
                onClick={quitBattle}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Hủy Tìm Trận 🛑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATTLE SCREEN VIEW */}
      {pkTab === "battle" && opponent && roundQuestions[currentRound - 1] && (
        <div className="space-y-6">
          
          {/* Opponent head-to-head score bar */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-5 shadow-lg grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            
            {/* Left User profile */}
            <div className="md:col-span-4 flex items-center gap-3.5 bg-indigo-50/30 p-3 rounded-2xl border border-indigo-150/30 relative">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-3xl shrink-0">
                {userAvatarObj.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Học sinh (Em)</p>
                <h4 className="text-xs font-black text-slate-850 truncate">{localStorage.getItem("smart_study_nickname_v2") || "Học Viên Ưu Tú"}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-slate-400 font-bold">Điểm PK:</span>
                  <span className="text-xs font-black text-indigo-600">{userScore}đ</span>
                </div>
              </div>
              {userChoice !== null && (
                <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Mid: Round count & Timer */}
            <div className="md:col-span-3 text-center space-y-2 py-2 md:py-0">
              <span className="text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
                Vòng {currentRound} / 3
              </span>
              
              <div className="flex justify-center items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500 animate-spin" />
                <span className={`text-xl font-display font-black ${roundTimeLeft < 4 ? "text-rose-600 scale-110 animate-ping" : "text-slate-800"}`}>
                  0:0{roundTimeLeft}s
                </span>
              </div>
            </div>

            {/* Right Opponent profile */}
            <div className="md:col-span-4 flex items-center gap-3.5 bg-red-50/30 p-3 rounded-2xl border border-red-150/30 text-right md:flex-row-reverse relative overflow-hidden">
              {isBotFrozen && (
                <div className="absolute inset-0 bg-sky-200/50 backdrop-blur-xs flex items-center justify-center z-10 text-xs font-black text-sky-850 animate-pulse">
                  <Snowflake className="w-4 h-4 animate-bounce text-sky-600 mr-1" />
                  <span>ĐÃ BỊ ĐÓNG BẰNG ❄️</span>
                </div>
              )}
              {isOpponentBlinded && (
                <div className="absolute inset-0 bg-slate-750/30 backdrop-blur-xs flex items-center justify-center z-10 text-[9.5px] font-black text-slate-800">
                  <EyeOff className="w-3.5 h-3.5 mr-1" />
                  <span>BỊ GÂY MÙ TẦM NHÌN 🌫️</span>
                </div>
              )}
              {isOpponentSabotaged && (
                <div className="absolute inset-0 bg-teal-100/40 backdrop-blur-xs flex items-center justify-center z-10 text-[9.5px] font-black text-teal-800">
                  <Wind className="w-3.5 h-3.5 mr-1 animate-spin" />
                  <span>CÂU HỎI NHIỄU LOẠN 🌪️</span>
                </div>
              )}

              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-3xl shrink-0">
                {opponent.avatarEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">Đối thủ</p>
                <h4 className="text-xs font-black text-slate-850 truncate">{opponent.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5 md:flex-row-reverse">
                  <span className="text-[9px] text-slate-400 font-bold">Điểm PK:</span>
                  <span className="text-xs font-black text-red-600">{opponent.score}đ</span>
                </div>
              </div>
              {opponent.answered && (
                <div className="bg-red-100 text-red-700 p-1.5 rounded-lg shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>
          </div>

          {/* Active Card Notification banner */}
          {activeCardNotification && (
            <div className="bg-gradient-to-r from-fuchsia-600 to-indigo-650 text-white rounded-2xl px-5 py-3 text-xs font-extrabold shadow-md flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>{activeCardNotification}</span>
              {scoreMultiplier > 1 && (
                <span className="ml-auto bg-white/25 px-2.5 py-0.5 rounded-lg border border-white/20">
                  x{scoreMultiplier} Điểm!
                </span>
              )}
            </div>
          )}

          {/* Clairvoyance nextRoundHint banner */}
          {nextRoundHint && currentRound === hintRound && (
            <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-300 text-amber-900 rounded-2xl px-5 py-3 text-xs font-black shadow-md flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>🔮 Thấu Thị Tương Lai: {nextRoundHint}</span>
            </div>
          )}

          {/* Active Question Panel */}
          <div className="bg-white border border-slate-100 rounded-[3rem] p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
            
            {/* SCREEN BLIND SMOKY OVERLAY (If bot blinded player screen) */}
            {playerBlindedTime > 0 && !roundRevealed && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 text-white pointer-events-none">
                <EyeOff className="w-12 h-12 text-rose-500 animate-pulse mb-3" />
                <h4 className="font-display font-black text-sm tracking-widest text-rose-400 uppercase">MÀN HÌNH BỊ CHE MÙ!</h4>
                <p className="text-[11px] text-slate-350 max-w-xs leading-normal mt-1.5 font-medium">
                  Đối thủ đã sử dụng Sương Mù che khuất tầm nhìn của em. Hãy tập trung bình tĩnh nhìn qua sương mù!
                </p>
                <div className="bg-white/10 border border-white/10 px-3 py-1 rounded-full text-xs font-extrabold mt-3 animate-bounce">
                  Sương tan sau: {playerBlindedTime} giây
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 px-3.5 py-1 rounded-full border border-indigo-150/40">
                Chủ Đề: {roundQuestions[currentRound - 1].subject}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Độ khó: {roundQuestions[currentRound - 1].difficulty === "easy" ? "Dễ" : roundQuestions[currentRound - 1].difficulty === "medium" ? "Trung Bình" : roundQuestions[currentRound - 1].difficulty === "hard" ? "Khó" : "Vô Song 👑"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-display font-black text-slate-850 text-base md:text-lg leading-snug">
                {roundQuestions[currentRound - 1].question}
              </h3>
            </div>

            {/* Answer option buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {roundQuestions[currentRound - 1].options.map((option, idx) => {
                const isSelected = userChoice === idx;
                const isCorrectAnswer = idx === roundQuestions[currentRound - 1].correctIndex;
                const isOptionDisabled = disabledOptionIndices.includes(idx);
                
                let optionStyle = "bg-white border-slate-150 hover:border-indigo-300 hover:bg-indigo-50/10 text-slate-800";
                
                if (isOptionDisabled) {
                  optionStyle = "bg-slate-50 border-slate-100 text-slate-300 line-through opacity-30 cursor-not-allowed pointer-events-none";
                } else if (roundRevealed) {
                  if (isCorrectAnswer) {
                    optionStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/15";
                  } else if (isSelected) {
                    optionStyle = "bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/15";
                  } else {
                    optionStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                  }
                } else if (isSelected) {
                  optionStyle = "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/15 text-indigo-800";
                }

                return (
                  <button
                    key={idx}
                    disabled={userChoice !== null || roundRevealed || isOptionDisabled}
                    onClick={() => handleUserAnswer(idx)}
                    className={`p-4.5 rounded-2xl border text-left text-xs font-bold transition-all relative flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span className="pr-4">{option}</span>
                    
                    {roundRevealed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {userChoice === idx && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-black border border-indigo-200">
                            Em
                          </span>
                        )}
                        {opponent.choice === idx && (
                          <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-black border border-red-200">
                            {opponent.avatarEmoji}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer explanation showing after reveal */}
            {roundRevealed && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1.5 animate-slide-down">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <span>💡 Giải thích đáp án</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  {roundQuestions[currentRound - 1].explanation}
                </p>
              </div>
            )}

            {/* MAGIC CARDS ACTION BAR */}
            {!roundRevealed && (
              <div className="bg-gradient-to-r from-fuchsia-50/40 via-purple-50/20 to-indigo-50/40 border border-fuchsia-100 rounded-[2.2rem] p-4.5 space-y-3 mt-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9.5px] font-black uppercase tracking-widest text-fuchsia-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-500 animate-spin-slow" />
                    <span>LÁ BÀI MA THUẬT CỦA EM (mỗi vòng dùng tối đa 1 lá)</span>
                  </span>
                  {cardUsedThisRound && (
                    <span className="text-[9px] bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full font-black animate-pulse">
                      Đã kích hoạt ở vòng này 🌟
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {MAGIC_CARDS_LIST.map((card) => {
                    const qty = magicCards[card.id] || 0;
                    const isFreeze = card.id === "freeze";
                    const isFreezeDisabled = isFreeze && isFreezeUsedThisMatch;
                    const cooldownLeft = cardCooldowns[card.id] || 0;
                    const isOnCooldown = cooldownLeft > 0;
                    const isButtonDisabled = qty <= 0 || cardUsedThisRound || isFreezeDisabled || isOnCooldown;

                    let tierColor = "text-amber-600";
                    if (card.tier === "sat") tierColor = "text-slate-500";
                    else if (card.tier === "bac") tierColor = "text-sky-500";
                    else if (card.tier === "vang") tierColor = "text-yellow-600";
                    else if (card.tier === "kimcuong") tierColor = "text-rose-500";
                    else if (card.tier === "baymau") tierColor = "text-fuchsia-600 font-extrabold";

                    return (
                      <button
                        key={card.id}
                        disabled={isButtonDisabled}
                        onClick={() => handleUseCardInBattle(card.id)}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center text-center justify-between transition-all select-none relative cursor-pointer group ${
                          isOnCooldown
                            ? "border-amber-300 bg-amber-50/40 opacity-90"
                            : isButtonDisabled 
                            ? "opacity-35 border-slate-100 bg-slate-50/50" 
                            : "border-fuchsia-250 bg-white hover:border-fuchsia-400 hover:shadow-lg hover:scale-[1.03] shadow-sm"
                        }`}
                        title={`${card.name}\nPhân cấp: ${card.tierLabel}\nSức mạnh: ${card.power}/100\nHồi chiêu gốc: ${card.cooldownRounds} vòng\nHiệu ứng: ${card.effect}`}
                      >
                        {/* Cooldown Radial Overlay */}
                        {isOnCooldown && (
                          <div className="absolute inset-0 bg-slate-950/75 rounded-2xl flex flex-col items-center justify-center z-10 backdrop-blur-[1px] border border-amber-500/40 transition-all duration-300">
                            <div className="relative w-11 h-11 flex items-center justify-center">
                              <svg className="w-11 h-11 transform -rotate-90">
                                {/* Track circle */}
                                <circle
                                  cx="22"
                                  cy="22"
                                  r="16"
                                  stroke="rgba(255, 255, 255, 0.15)"
                                  strokeWidth="3"
                                  fill="transparent"
                                />
                                {/* Active progress circle */}
                                <circle
                                  cx="22"
                                  cy="22"
                                  r="16"
                                  stroke="#fbbf24" // amber-400
                                  strokeWidth="3"
                                  fill="transparent"
                                  strokeDasharray={100.5}
                                  strokeDashoffset={100.5 - (cooldownLeft / card.cooldownRounds) * 100.5}
                                  strokeLinecap="round"
                                  className="transition-all duration-500 ease-out"
                                />
                              </svg>
                              {/* Center text */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                <span className="text-xs font-black text-white drop-shadow">{cooldownLeft}</span>
                                <span className="text-[7px] font-black text-amber-400 uppercase tracking-wider">vòng</span>
                              </div>
                            </div>
                            <span className="text-[7.5px] font-black uppercase text-amber-300 tracking-wider mt-1 animate-pulse">
                              Đang Hồi
                            </span>
                          </div>
                        )}

                        {/* Quantity tag */}
                        <span className={`absolute -top-1.5 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-sm z-20 ${
                          qty > 0 ? "bg-fuchsia-600 text-white" : "bg-slate-200 text-slate-500"
                        }`}>
                          x{qty}
                        </span>

                        <span className="text-xl mb-0.5 group-hover:animate-bounce">{card.emoji}</span>
                        <p className="text-[9.5px] font-black text-slate-850 line-clamp-1 leading-none">{card.name}</p>
                        
                        {/* Tier & Power details */}
                        <div className="flex items-center gap-1 mt-1 text-[8px] font-bold">
                          <span className={`${tierColor}`}>{card.tierLabel.split(" ")[0]}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 flex items-center">💪 {card.power}</span>
                        </div>

                        {/* Cooldown indicators */}
                        {isOnCooldown ? (
                          <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md mt-1 animate-pulse flex items-center gap-0.5">
                            ⏳ Chờ: {cooldownLeft}v
                          </span>
                        ) : isFreezeDisabled ? (
                          <span className="text-[8px] font-extrabold text-red-500 mt-1 bg-red-50 px-1.5 py-0.5 rounded-md">Hết lượt</span>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400 mt-1">
                            🕒 Hồi: {card.cooldownRounds}v
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action controls */}
            <div className="border-t border-slate-50 pt-5 flex justify-between items-center">
              <button
                onClick={quitBattle}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Rút Lui 🏳️
              </button>

              {!roundRevealed ? (
                <button
                  disabled={userChoice === null}
                  onClick={() => revealRoundResults()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Xác nhận câu trả lời 🔒
                </button>
              ) : (
                <button
                  onClick={handleNextRound}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span>{currentRound < 3 ? "Vòng Tiếp Theo" : "Xem Kết Quả Đấu Trận"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY VIEW */}
      {pkTab === "results" && opponent && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.35 }}
          className={`border rounded-[3rem] p-6 md:p-8 text-center shadow-2xl space-y-8 max-w-lg mx-auto py-12 relative overflow-hidden ${
            userScore > opponent.score 
              ? "bg-gradient-to-b from-amber-50 via-white to-white border-amber-250 ring-4 ring-amber-500/10"
              : userScore === opponent.score 
              ? "bg-white border-slate-150"
              : "bg-gradient-to-b from-slate-50 via-white to-white border-slate-200"
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-200 rounded-full blur-3xl opacity-30" />

          {/* Winner declaration */}
          <div className="space-y-4 relative z-10">
            <div className="flex justify-center">
              <div className="relative">
                {userScore > opponent.score ? (
                  <>
                    <motion.div 
                      className="absolute -inset-4 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-500 to-rose-500 blur opacity-50"
                      animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                    />
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.2, stiffness: 120, damping: 10 }}
                      className="w-28 h-28 bg-gradient-to-tr from-yellow-400 via-amber-500 to-rose-500 rounded-full flex items-center justify-center text-white text-6xl shadow-xl relative"
                    >
                      🏆
                      <motion.span 
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute -top-3 -right-2 text-3xl"
                      >
                        👑
                      </motion.span>
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -inset-1 rounded-full border-2 border-yellow-300 pointer-events-none"
                      />
                    </motion.div>
                  </>
                ) : userScore === opponent.score ? (
                  <>
                    <div className="absolute -inset-1 rounded-full bg-amber-500/20 blur" />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-5xl shadow-lg relative"
                    >
                      🤝
                    </motion.div>
                  </>
                ) : (
                  <>
                    <div className="absolute -inset-1 rounded-full bg-slate-400/20 blur" />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 bg-gradient-to-tr from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-5xl shadow-lg relative"
                    >
                      💔
                    </motion.div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>KẾT QUẢ TRẬN ĐẤU</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              </span>
              <h3 className="font-display font-black text-slate-850 text-xl leading-tight">
                {userScore > opponent.score ? (
                  <motion.span 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-amber-600 via-yellow-500 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm flex flex-col items-center gap-1"
                  >
                    <span className="font-black text-2xl">XUẤT SẮC CHIẾN THẮNG! 🎉</span>
                    {pkStreak > 1 && (
                      <span className="text-[10px] bg-red-505 text-white font-black uppercase tracking-widest px-3 py-1 rounded-full mt-2 animate-bounce flex items-center gap-1.5 shadow-md">
                        <Flame className="w-3.5 h-3.5 fill-white" />
                        Chuỗi {pkStreak} Trận Thắng!
                      </span>
                    )}
                  </motion.span>
                ) : userScore === opponent.score ? (
                  <span className="text-amber-600 font-extrabold">TRẬN ĐẤU HÒA NHAU! 🤝</span>
                ) : (
                  <span className="text-rose-600 font-extrabold">ĐÃ THẤT BẠI MẤT RỒI! 😢</span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Độ khó thử thách: <strong className="text-slate-850 uppercase">{difficulty === "easy" ? "Dễ" : difficulty === "medium" ? "Trung Bình" : "Khó Nhất"}</strong>
              </p>
            </div>
          </div>

          {/* Scores comparison card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`border rounded-3xl p-5 flex items-center justify-between max-w-sm mx-auto shadow-inner relative ${
              userScore > opponent.score 
                ? "bg-amber-50/50 border-amber-200" 
                : "bg-slate-50 border-slate-100"
            }`}
          >
            <div className="text-center space-y-1 flex-1">
              <p className="text-[9px] font-black text-slate-400 uppercase">Điểm của Em</p>
              <motion.p 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                className="text-2xl font-display font-black text-indigo-650"
              >
                {userScore}đ
              </motion.p>
            </div>
            <div className="h-10 w-px bg-slate-200 shrink-0 mx-2" />
            <div className="text-center space-y-1 flex-1">
              <p className="text-[9px] font-black text-slate-400 uppercase">Điểm đối thủ</p>
              <p className="text-2xl font-display font-black text-red-500">{opponent.score}đ</p>
            </div>
          </motion.div>

          {/* Reward highlights */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-50 border border-slate-100/80 rounded-[2rem] p-5 space-y-3 text-left"
          >
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">🏆 Quà tặng nhận được:</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                <span className="text-lg">⚡</span>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Điểm kinh nghiệm</p>
                  <p className="text-xs font-black text-slate-800">
                    {userScore > opponent.score 
                      ? `+${difficulty === "easy" ? 25 : difficulty === "medium" ? 40 : 70} XP` 
                      : userScore === opponent.score 
                      ? "+15 XP" 
                      : "+5 XP"
                    }
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                <span className="text-lg">🪙</span>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Xu trí tuệ</p>
                  <p className="text-xs font-black text-slate-800">
                    {userScore > opponent.score 
                      ? `+${difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 45} Xu` 
                      : userScore === opponent.score 
                      ? "+5 Xu" 
                      : "+2 Xu"
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => {
                setTriggerConfetti(false);
                setPkTab("lobby");
              }}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer text-center"
            >
              Quay Lại Sảnh
            </button>
            <button
              onClick={startMatchmaking}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Phục Thù / Tiếp Tục</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
