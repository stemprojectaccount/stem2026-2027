import React, { useState, useEffect, useRef } from "react";
import { Zap, Trophy, Shield, Crown, Clock, Sword, ChevronRight, RotateCcw, Award, Check, Flame, Volume2, VolumeX, Brain, BookOpen, Snowflake, EyeOff, Wind, Lightbulb, Layers } from "lucide-react";
import { UserProgress, Question, Lesson } from "../types";
import { MAGIC_CARDS } from "../data";
import { getAvatarAtLevel } from "../lib/avatarEvolution";
import ConfettiCelebration from "./ConfettiCelebration";
import { motion } from "motion/react";
import { WisdomCoinIcon } from "./CustomMascots";

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
    subject: "IQ và Logic",
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
    subject: "Bác Học Vô Song (Toán và IQ)",
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

const BOT_POOL: Array<{
  name: string;
  avatarEmoji: string;
  level: number;
  title: string;
  winRate: number;
  role: "BOSS" | "BOT";
}> = [
  { name: "Boss Sư Tử Bách Khoa Ω", avatarEmoji: "🦁", level: 8, title: "Boss Thủ Lĩnh Tri Thức", winRate: 78, role: "BOSS" },
  { name: "Boss Đại Bàng Tinh Anh", avatarEmoji: "🦅", level: 7, title: "Boss Hộ Pháp Tốc Độ", winRate: 72, role: "BOSS" },
  { name: "Boss Cáo Học Thuật", avatarEmoji: "🦊", level: 6, title: "Boss Chiến Thuật", winRate: 68, role: "BOSS" },
  { name: "Bot Rồng Cơ Học", avatarEmoji: "🐉", level: 5, title: "Bot Huấn Luyện Nâng Cao", winRate: 58, role: "BOT" },
  { name: "Bot Gấu Trúc Cần Mẫn", avatarEmoji: "🐼", level: 4, title: "Bot Huấn Luyện Trung Cấp", winRate: 52, role: "BOT" },
  { name: "Bot Thỏ Tia Chớp", avatarEmoji: "🐰", level: 3, title: "Bot Huấn Luyện Khởi Đầu", winRate: 48, role: "BOT" }
];

export default function PKArena({ progress, selectedAvatarIdx, updateProgress, triggerSuccessMessage, lessons = [] }: PKArenaProps) {
  const [pkTab, setPkTab] = useState<"lobby" | "leaderboard" | "matchmaking" | "battle" | "results">("lobby");
  
  // Get categories from past lessons (Preserves exact data structure & logic)
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
    const defaultCards: Record<string, number> = {};
    MAGIC_CARDS.forEach(card => {
      defaultCards[card.id] = 0;
    });
    
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
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.1);
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
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36);
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

  // Generate / Load PK Leaderboard (Boss & Bot AI only when no other real players have joined)
  useEffect(() => {
    try {
      localStorage.removeItem("smart_study_pk_leaderboard_v2");
      const savedLeaderboard = localStorage.getItem("smart_study_pk_leaderboard_v3_bots");
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

      const effectiveMascotIdx = progress.avatarUrl && progress.avatarUrl.startsWith("mascot:")
        ? (parseInt(progress.avatarUrl.replace("mascot:", ""), 10) || 0)
        : selectedAvatarIdx;
      const userAvatar = getAvatarAtLevel(effectiveMascotIdx, progress.level);
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
      localStorage.setItem("smart_study_pk_leaderboard_v3_bots", JSON.stringify(sorted));
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
    const opponentName = selectedOpponent ? selectedOpponent.name : "Boss / Bot AI";
    setSearchingStatus(`Đang khởi tạo đấu trường với ${opponentName}...`);
    playPkSound("match");

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
        setSearchingStatus("Đang kích hoạt hệ thống Boss và Bot AI...");
      } else if (elapsed === 2) {
        setSearchingStatus(`Đang triệu hồi ${opponentName} vào đấu trường...`);
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
        setSearchingStatus(`${chosenOpp.name} đã xuất hiện: chuẩn bị vào trận!`);
      } else if (elapsed === 4) {
        setSearchingStatus(`Đang tải bộ câu hỏi chủ đề "${selectedCategory?.name || "Tổng Hợp"}"...`);
      } else if (elapsed === 5) {
        clearInterval(matchmakingRef.current!);
        setSearchingStatus("Đang mở cổng khiêu chiến Boss AI...");
        
        fetch("/api/generate-pk", { method: "POST" })
          .then(res => res.json())
          .then(data => {
            let pool = PK_QUESTION_POOL;
            if (data.success && data.questions && data.questions.length > 0) {
               pool = data.questions;
            }
            if (selectedCategory) {
              const categorySubject = selectedCategory.subject;
              const filteredBySubject = pool.filter(
                q => q.subject.toLowerCase().includes(categorySubject.toLowerCase()) || 
                      categorySubject.toLowerCase().includes(q.subject.toLowerCase())
              );
              if (filteredBySubject.length > 0) {
                pool = filteredBySubject;
              }
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
          })
          .catch(err => {
            console.error(err);
            let pool = PK_QUESTION_POOL;
            const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
            setRoundQuestions(shuffled);
            setCurrentRound(1);
            setUserScore(0);
            setUserChoice(null);
            setRoundRevealed(false);
            setRoundTimeLeft(10);
            setPkTab("battle");
            startRoundTimer(shuffled, 1);
          });
      }
    }, 1000);
  };

  const startRoundTimer = (questionsList = roundQuestions, roundNum = currentRound) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRoundTimeLeft(10);

    const botAnswerDelay = Math.floor(Math.random() * 4) + (difficulty === "easy" ? 4 : difficulty === "medium" ? 3 : 2);
    
    const isBotCounterAttack = (roundNum === 2 || roundNum === 3) && Math.random() < 0.3;
    if (isBotCounterAttack) {
      setPlayerBlindedTime(5);
      triggerSuccessMessage(`Đối thủ ${opponent?.name || "đối thủ"} đã sử dụng "Lá Che Màn Hình" lên em! Màn hình bị tối 5 giây!`);
      
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

      if (isBotFrozen) {
        return {
          ...prev,
          answered: true,
          choice: -1
        };
      }

      const activeQuestion = questionsList[roundNum - 1];
      if (!activeQuestion) return prev;

      const isCorrectChance = Math.random() * 100;
      let targetAccuracy = 40;
      if (difficulty === "medium") targetAccuracy = 65;
      if (difficulty === "hard") targetAccuracy = 90;

      if (isOpponentSabotaged) {
        targetAccuracy = 15;
      }

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
      setRoundTimeLeft(12);
      triggerSuccessMessage("Vòng Lặp Thời Gian kích hoạt! Thời gian quay ngược, em được chọn lại!");
      setActiveCardNotification("Vòng Lặp Thời Gian: Hãy chọn phương án chính xác!");
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
    let baseRoundPoints = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 40;

    if (isMindSwapActive) {
      if (!userCorrect && botCorrect) {
        setUserScore(prev => prev + baseRoundPoints);
        triggerSuccessMessage("Thoán Đoạt Tư Duy: Em nhận +100% điểm đối thủ, đối thủ 0đ vòng này!");
      } else if (userCorrect) {
        let addedScore = Math.round(baseRoundPoints * scoreMultiplier);
        if (isDoubleTimeActive && userAnsweringTime !== null && userAnsweringTime >= 12) {
          addedScore += baseRoundPoints;
          triggerSuccessMessage("Tốc Độ Kép: Em đã trả lời đúng dưới 3 giây! Cộng thêm +100% điểm gốc!");
        }
        setUserScore(prev => prev + addedScore);
        triggerSuccessMessage("Thoán Đoạt Tư Duy: Em trả lời chính xác và giữ nguyên điểm số!");
      }
      playPkSound(userCorrect ? "correct" : "wrong");
    } else {
      if (userCorrect) {
        let addedScore = Math.round(baseRoundPoints * scoreMultiplier);
        if (isDoubleTimeActive && userAnsweringTime !== null && userAnsweringTime >= 12) {
          addedScore += baseRoundPoints;
          triggerSuccessMessage("Tốc Độ Kép: Em đã trả lời đúng dưới 3 giây! Cộng thêm +100% điểm gốc!");
        }
        if (isDoubleStrikeActive) {
          addedScore += 100;
          setOpponent(prev => prev ? { ...prev, score: Math.max(0, prev.score - 100) } : null);
          triggerSuccessMessage("Song Kích Trí Tuệ: Đối thủ bị trừ 100đ, em được cộng thêm +100đ!");
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
        // Opponent gets nothing
      } else if (isShieldDrainActive) {
        setUserScore(prev => prev + baseRoundPoints);
        triggerSuccessMessage("Giáp Hấp Thụ: Hấp thụ trọn vẹn điểm số đối thủ! Đối thủ 0đ, em được +100% điểm!");
      } else if (isShieldActive) {
        triggerSuccessMessage("Khiên Học Thuật đã ngăn chặn đối thủ cộng điểm lượt này!");
      } else {
        setOpponent(prev => prev ? { ...prev, score: prev.score + baseRoundPoints } : null);
      }

      if (isStealActive && (!isMindSwapActive || userCorrect)) {
        const stolenPoints = Math.round(baseRoundPoints * 0.5);
        setUserScore(prev => prev + stolenPoints);
        triggerSuccessMessage(`Tinh Linh Trộm Điểm mang về cho em +${stolenPoints} điểm từ đối thủ!`);
      }
    }

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
      
      setCardCooldowns(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] > 0) {
            next[key] -= 1;
          }
        });
        return next;
      });

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
      triggerSuccessMessage(`Chiến thắng! Em nhận được +${xpAward} XP và +${coinAward} Xu thưởng!`);

    } else if (isDraw) {
      triggerSuccessMessage("Hòa nhau rồi! Hai bên ngang sức ngang tài!");
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
      triggerSuccessMessage("Cố gắng luyện tập thêm để chiến thắng lần sau nhé. Nhận +5 XP khuyến khích.");
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
      triggerSuccessMessage("Thẻ bài này đang trong thời gian hồi chiêu!");
      return;
    }

    const nextInventory = { ...magicCards, [cardId]: magicCards[cardId] - 1 };
    setMagicCards(nextInventory);
    localStorage.setItem("smart_study_magic_cards_v2", JSON.stringify(nextInventory));
    setCardUsedThisRound(true);

    const cardDef = MAGIC_CARDS.find(c => c.id === cardId);
    if (cardDef) {
      setCardCooldowns(prev => ({ ...prev, [cardId]: cardDef.cooldownRounds }));
    }

    if (cardId === "hint") {
      const activeQuestion = roundQuestions[currentRound - 1];
      if (activeQuestion) {
        const correctIdx = activeQuestion.correctIndex;
        const wrongIndices = [0, 1, 2, 3].filter(idx => idx !== correctIdx);
        const shuffledWrongs = [...wrongIndices].sort(() => 0.5 - Math.random());
        setDisabledOptionIndices(shuffledWrongs.slice(0, 2));
        setActiveCardNotification("Gợi Ý Tri Thức: Đã loại bỏ 2 phương án sai!");
        triggerSuccessMessage("Đã loại bỏ 2 đáp án sai!");
      }
    } 
    else if (cardId === "freeze") {
      setIsBotFrozen(true);
      setIsFreezeUsedThisMatch(true);
      setOpponent(prev => prev ? { ...prev, answered: true, choice: -1 } : null);
      setActiveCardNotification("Đóng Băng Đối Thủ: Đối thủ không trả lời được lượt này.");
      triggerSuccessMessage("Đã đóng băng đối thủ thành công!");
    } 
    else if (cardId === "blind") {
      setIsOpponentBlinded(true);
      setActiveCardNotification("Sương Mù Che Màn: Giảm tỷ lệ đúng của đối thủ xuống 10% ở lượt này!");
      triggerSuccessMessage("Đối thủ bị sương mù che mắt thành công!");
    } 
    else if (cardId === "timeslow") {
      setRoundTimeLeft(prev => prev + 10);
      setActiveCardNotification("Ngưng Đọng Thời Gian: Cộng thêm 10 giây suy nghĩ cho câu hỏi hiện tại!");
      triggerSuccessMessage("Cộng thêm 10 giây suy nghĩ thành công!");
    }
    else if (cardId === "shield") {
      setIsShieldActive(true);
      setActiveCardNotification("Khiên Học Thuật: Chặn đối thủ cộng điểm ở lượt này nếu họ trả lời đúng.");
      triggerSuccessMessage("Đã dựng Khiên Học Thuật bảo vệ!");
    }
    else if (cardId === "steal") {
      setIsStealActive(true);
      setActiveCardNotification("Tinh Linh Trộm Điểm: Nhận ngay 50% số điểm của đối thủ nếu họ trả lời đúng.");
      triggerSuccessMessage("Đã kích hoạt Tinh Linh Trộm Điểm!");
    }
    else if (cardId === "sabotage") {
      setIsOpponentSabotaged(true);
      setActiveCardNotification("Cuồng Phong Gây Khó: Giảm tỷ lệ đúng của đối thủ xuống 15%!");
      triggerSuccessMessage("Đã làm nhiễu loạn câu hỏi đối thủ!");
    } 
    else if (cardId === "mult15") {
      setScoreMultiplier(1.5);
      setActiveCardNotification("Sấm Sét Tri Thức: Nhận x1.5 điểm số nếu em trả lời đúng!");
      triggerSuccessMessage("Kích hoạt x1.5 điểm thành công!");
    } 
    else if (cardId === "luck") {
      const multipliers = [1.5, 2, 3];
      const selectedMult = multipliers[Math.floor(Math.random() * multipliers.length)];
      setScoreMultiplier(selectedMult);
      setActiveCardNotification(`Xúc Xắc Trí Tuệ: Nhận ngẫu nhiên x${selectedMult} lần điểm số nếu em trả lời chính xác!`);
      triggerSuccessMessage(`Thả xúc xắc nhận hệ số x${selectedMult} điểm!`);
    }
    else if (cardId === "mult2") {
      setScoreMultiplier(2);
      setActiveCardNotification("Lửa Trí Tuệ: Nhận x2 điểm số nếu em trả lời đúng!");
      triggerSuccessMessage("Kích hoạt x2 điểm thành công!");
    } 
    else if (cardId === "divine") {
      const activeQuestion = roundQuestions[currentRound - 1];
      if (activeQuestion) {
        handleUserAnswer(activeQuestion.correctIndex);
        setActiveCardNotification("Thần Nhãn Học Đường: Đã tự động chọn chính xác câu trả lời.");
        triggerSuccessMessage("Thần Nhãn đã chọn đáp án đúng cho em!");
      }
    }
    else if (cardId === "challenge") {
      const randomLegendary = SUPER_HARD_QUESTION_POOL[Math.floor(Math.random() * SUPER_HARD_QUESTION_POOL.length)];
      const nextQuestions = [...roundQuestions];
      nextQuestions[currentRound - 1] = randomLegendary;
      setRoundQuestions(nextQuestions);

      const randMult = Math.random() < 0.5 ? 2 : 3;
      setScoreMultiplier(randMult);
      
      setActiveCardNotification(`Thách Thức Vô Song: Đổi câu siêu khó, nhận ngay x${randMult} điểm khi trả lời đúng!`);
      triggerSuccessMessage(`Đã nâng cấp lên câu hỏi Vô Song x${randMult} điểm!`);
    }
    else if (cardId === "omega") {
      setIsBotFrozen(true);
      setOpponent(prev => prev ? { ...prev, answered: true, choice: -1 } : null);
      setScoreMultiplier(2);
      const activeQuestion = roundQuestions[currentRound - 1];
      if (activeQuestion) {
        handleUserAnswer(activeQuestion.correctIndex);
      }
      setActiveCardNotification("Ma Pháp Omega: Tự chọn đúng, x2 điểm, đóng băng đối thủ!");
      triggerSuccessMessage("Kích hoạt thẻ tối thượng OMEGA thành công!");
    }
    else if (cardId === "time_warp") {
      setIsTimeWarpActive(true);
      setActiveCardNotification("Vòng Lặp Thời Gian: Nếu trả lời sai vòng này, thời gian quay ngược giúp em chọn lại!");
      triggerSuccessMessage("Đã kích hoạt Vòng Lặp Thời Gian!");
    }
    else if (cardId === "double_strike") {
      setIsDoubleStrikeActive(true);
      setActiveCardNotification("Song Kích Trí Tuệ: Trả lời đúng vòng này sẽ trừ 100 điểm của đối thủ và cộng vào điểm của em!");
      triggerSuccessMessage("Đòn đánh Song Kích đã nạp năng lượng!");
    }
    else if (cardId === "double_time") {
      setIsDoubleTimeActive(true);
      setActiveCardNotification("Tốc Độ Kép: Nhận thêm +100% điểm gốc nếu trả lời đúng trong vòng 3 giây đầu tiên!");
      triggerSuccessMessage("Đã kích hoạt Tốc Độ Kép!");
    }
    else if (cardId === "intel_link") {
      const nextQ = roundQuestions[currentRound];
      if (nextQ) {
        setNextRoundHint(`Câu ${currentRound + 1}: "${nextQ.question.substring(0, 45)}..." - Đáp án đúng: [${nextQ.options[nextQ.correctIndex]}]`);
        setHintRound(currentRound + 1);
        setActiveCardNotification("Thấu Thị Thần Truyền: Đã mở gợi ý đáp án câu hỏi tiếp theo!");
        triggerSuccessMessage("Đã mở gợi ý câu hỏi tiếp theo!");
      } else {
        setNextRoundHint("Không còn câu hỏi tiếp theo (Đang ở vòng cuối cùng)!");
        setHintRound(currentRound);
        setActiveCardNotification("Thấu Thị Thần Truyền: Đây là vòng cuối cùng của trận đấu!");
      }
    }
    else if (cardId === "shield_drain") {
      setIsShieldDrainActive(true);
      setActiveCardNotification("Giáp Hấp Thụ: Nếu đối thủ đúng vòng này, họ nhận 0đ và em hấp thụ trọn vẹn số điểm đó!");
      triggerSuccessMessage("Đã dựng Giáp Hấp Thụ thành công!");
    }
    else if (cardId === "mind_swap") {
      setIsMindSwapActive(true);
      setActiveCardNotification("Thoán Đoạt Tư Duy: Nếu em sai và đối thủ đúng vòng này, hoán đổi điểm với đối thủ!");
      triggerSuccessMessage("Đã kích hoạt Thoán Đoạt Tư Duy!");
    }
    else if (cardId === "mirror_force") {
      setIsMirrorForceActive(true);
      if (playerBlindedTime > 0) {
        setPlayerBlindedTime(0);
        setIsOpponentBlinded(true);
        setOpponent(prev => prev ? { ...prev, score: Math.max(0, prev.score - 50) } : null);
        triggerSuccessMessage("Gương Phản Chiếu: Giải mù màn hình, làm mù đối thủ và trừ 50 điểm của họ!");
      } else {
        triggerSuccessMessage("Gương Phản Chiếu: Đã kích hoạt! Sẵn sàng phản lại hiệu ứng bất lợi.");
      }
      setActiveCardNotification("Gương Phản Chiếu: Sẵn sàng phản lại hiệu ứng từ đối thủ và trừ 50đ!");
    }
    else if (cardId === "super_nova") {
      setScoreMultiplier(3);
      const activeQuestion = roundQuestions[currentRound - 1];
      if (activeQuestion) {
        handleUserAnswer(activeQuestion.correctIndex);
      }
      setActiveCardNotification("Vũ Trụ Siêu Tân Tinh: Tự động chọn đúng, nhân gấp 3 lần (x3.0) điểm số vòng này!");
      triggerSuccessMessage("Đã kích hoạt Siêu Tân Tinh!");
    }

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
  const effectiveMascotIdx = React.useMemo(() => {
    if (progress.avatarUrl && progress.avatarUrl.startsWith("mascot:")) {
      const idx = parseInt(progress.avatarUrl.replace("mascot:", ""), 10);
      if (!isNaN(idx) && idx >= 0 && idx < 6) return idx;
    }
    return selectedAvatarIdx >= 0 && selectedAvatarIdx < 6 ? selectedAvatarIdx : 0;
  }, [progress.avatarUrl, selectedAvatarIdx]);

  const userAvatarObj = getAvatarAtLevel(effectiveMascotIdx, progress.level);

  // Clean display helper for category icon (avoids broken "GB" flag glyph on Windows while keeping data intact)
  const renderCategoryBadge = (cat: { icon: string; subject: string }) => {
    if (cat.icon === "🇬🇧") return "EN";
    return cat.icon;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12 relative">
      {triggerConfetti && <ConfettiCelebration />}

      {/* 1. Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-7 text-white shadow-sm relative overflow-hidden border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500 rounded-full blur-3xl opacity-15 animate-pulse-slow pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <span className="text-xs font-semibold bg-blue-500/20 text-blue-200 px-3 py-1 rounded-md border border-blue-400/30 inline-flex items-center gap-1.5 animate-pulse">
              <Sword className="w-3.5 h-3.5" />
              <span>Đấu trường Boss và Bot AI THCS</span>
            </span>
            <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight leading-tight flex items-center gap-2">
              <span>Khiêu chiến Boss và Bot Trí Tuệ</span>
              <Zap className="w-6 h-6 text-amber-400 fill-amber-300 animate-bounce shrink-0" />
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              So tài trả lời nhanh 3 vòng câu hỏi với hệ thống Boss và Bot AI đa cấp độ. Sử dụng thẻ bổ trợ hợp lý để hạ gục Boss và tích lũy XP.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
            <button
              type="button"
              onClick={() => setIsSoundOn(!isSoundOn)}
              className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
              title={isSoundOn ? "Tắt âm thanh" : "Bật âm thanh"}
              aria-label={isSoundOn ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {isSoundOn ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[150px]">
              <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-400">Chuỗi thắng Boss</p>
                <p className="text-lg font-mono font-bold text-white tabular-nums">{pkStreak} trận</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Mode Switcher (Lobby / PK Leaderboard) */}
      {pkTab !== "matchmaking" && pkTab !== "battle" && pkTab !== "results" && (
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setPkTab("lobby")}
            className={`flex-1 py-2.5 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              pkTab === "lobby" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sword className="w-4 h-4" />
            <span className="sm:hidden">Sảnh khiêu chiến</span>
            <span className="hidden sm:inline">Sảnh khiêu chiến Boss và Chọn môn</span>
          </button>
          <button
            type="button"
            onClick={() => setPkTab("leaderboard")}
            className={`flex-1 py-2.5 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              pkTab === "leaderboard" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="sm:hidden">Bảng xếp hạng</span>
            <span className="hidden sm:inline">Bảng xếp hạng Đấu Boss và Bot</span>
          </button>
        </div>
      )}

      {/* 3. LOBBY INTERFACE */}
      {pkTab === "lobby" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Student Combatant Profile (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5 text-center">
            <span className="text-xs font-semibold text-slate-500 block">Hồ sơ thi đấu của em</span>
            
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-100 rounded-2xl animate-pulse scale-105" />
              <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-5xl relative z-10 select-none">
                {userAvatarObj.emoji}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-slate-900 text-lg">
                {localStorage.getItem("smart_study_nickname_v2") || "Học Viên Ưu Tú"}
              </h3>
              <p className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-md inline-block">
                {userAvatarObj.title} · Cấp {progress.level}
              </p>
            </div>

            {/* Match Stats */}
            <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-3.5">
              <div>
                <p className="text-xs text-slate-500">Tổng trận</p>
                <p className="text-base font-mono font-bold text-slate-900 tabular-nums mt-0.5">{totalMatches}</p>
              </div>
              <div className="border-l border-r border-slate-100">
                <p className="text-xs text-slate-500">Thắng</p>
                <p className="text-base font-mono font-bold text-emerald-700 tabular-nums mt-0.5">{userPkWins}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tỷ lệ thắng</p>
                <p className="text-base font-mono font-bold text-blue-700 tabular-nums mt-0.5">{userWinRate}%</p>
              </div>
            </div>

            {/* Magic Cards Inventory Summary */}
            <div className="space-y-2.5 text-left bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-blue-600" />
                <span>Thẻ bổ trợ đang có ({Object.values(magicCards).reduce((a,b)=>a+b, 0)} thẻ)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MAGIC_CARDS.map(c => {
                  const qty = magicCards[c.id] || 0;
                  if (qty <= 0) return null;
                  return (
                    <span
                      key={c.id}
                      title={`${c.name}: ${c.effect}`}
                      className="text-xs font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 flex items-center gap-1"
                    >
                      <span>{c.emoji}</span>
                      <strong className="font-mono text-blue-700">x{qty}</strong>
                    </span>
                  );
                })}
                {Object.values(magicCards).reduce((a,b)=>a+b, 0) === 0 && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Chưa có thẻ bổ trợ nào. Em có thể đổi Xu tại Cửa hàng để nhận thẻ trợ giúp trong trận đấu.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Match Setup Panel (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-3.5">
              <h2 className="font-display font-bold text-slate-900 text-lg">Thiết lập trận đấu Boss và Bot AI</h2>
              <p className="text-xs text-slate-500 mt-0.5">Chọn chủ đề môn học, mức độ thử thách và Boss hoặc Bot AI bạn muốn khiêu chiến</p>
            </div>

            <div className="space-y-5">
              {/* 1. Category Picker (Fixes truncated label bug: up to 2 lines + full title tooltip) */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  1. Chọn chủ đề / môn học thi đấu:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategory?.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        title={`${cat.name} (${cat.subject})`}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 min-h-[56px] ${
                          isSelected 
                            ? "border-blue-600 bg-blue-50/80 text-blue-950 ring-1 ring-blue-600/20 shadow-2xs" 
                            : "border-slate-200 hover:border-blue-300 bg-slate-50/60 hover:bg-white text-slate-800"
                        }`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-xs font-mono font-bold text-blue-700 shrink-0 mt-0.5">
                          {renderCategoryBadge(cat)}
                        </span>
                        <span className="text-xs font-semibold leading-snug line-clamp-2 flex-1">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Difficulty Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  2. Chọn mức độ câu hỏi:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["easy", "medium", "hard"] as const).map((level) => {
                    const isSelected = difficulty === level;
                    let label = "Cơ bản";
                    let reward = "+25 XP · +10 Xu";
                    
                    if (level === "medium") {
                      label = "Trung bình";
                      reward = "+40 XP · +20 Xu";
                    } else if (level === "hard") {
                      label = "Nâng cao";
                      reward = "+70 XP · +45 Xu";
                    }

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected 
                            ? "border-blue-600 bg-blue-50/80 font-bold text-blue-950 ring-1 ring-blue-600/20 shadow-2xs" 
                            : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 text-slate-700"
                        }`}
                      >
                        <h4 className="text-xs md:text-sm font-bold">{label}</h4>
                        <p className="text-xs mt-1 font-mono font-medium text-blue-700">{reward}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Boss / Bot Opponent Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  3. Chọn Boss / Bot AI thách đấu:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BOT_POOL.map((bot) => {
                    const isSelected = selectedOpponent?.name === bot.name;
                    return (
                      <div
                        key={bot.name}
                        onClick={() => setSelectedOpponent(bot)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? "border-blue-600 bg-blue-50/80 ring-1 ring-blue-600/20 shadow-2xs" 
                            : "border-slate-200 hover:border-blue-300 bg-slate-50/60 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl bg-white w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                            {bot.avatarEmoji}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate">{bot.name}</h4>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                                  bot.role === "BOSS"
                                    ? "bg-rose-600 text-white"
                                    : "bg-slate-800 text-sky-200"
                                }`}
                              >
                                {bot.role}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{bot.title} · Cấp {bot.level}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-[11px] text-slate-500">Độ chính xác</p>
                          <p className="text-xs font-mono font-bold text-blue-700 tabular-nums">{bot.winRate}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Start Match CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={startMatchmaking}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sword className="w-4 h-4" />
                  <span>Bắt đầu khiêu chiến Boss / Bot AI</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 4. PK LEADERBOARD TAB */}
      {pkTab === "leaderboard" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Bảng xếp hạng Đấu trường Boss và Bot AI</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Khi chưa có người chơi thật khác vào phòng, bảng xếp hạng so sánh số trận thắng của em với các Boss và Bot AI hệ thống
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-900">
              Vị trí của em: <strong className="text-blue-700 text-sm font-mono font-bold">#{pkLeaderboard.findIndex(b => b.isCurrentUser) + 1}</strong>
            </div>
          </div>

          <div className="space-y-2.5">
            {pkLeaderboard.map((competitor, idx) => {
              const isUser = competitor.isCurrentUser;
              const isBossEntry = !isUser && competitor.name.toLowerCase().includes("boss");

              return (
                <div
                  key={competitor.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    isUser 
                      ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/20 shadow-2xs" 
                      : "border-slate-200/80 bg-white hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      idx === 0
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : idx === 1
                        ? "bg-slate-200 text-slate-800"
                        : idx === 2
                        ? "bg-amber-50 text-amber-900 border border-amber-200"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-2xl bg-slate-50 w-11 h-11 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                      {competitor.avatarEmoji}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 truncate">
                        <span className="truncate">{competitor.name}</span>
                        {isUser ? (
                          <span className="text-[11px] bg-blue-600 text-white font-semibold px-2 py-0.5 rounded-md">
                            Người chơi thật (Em)
                          </span>
                        ) : isBossEntry ? (
                          <span className="text-[10px] bg-rose-600 text-white font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            [BOSS AI]
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-sky-200 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            [BOT AI]
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500">{competitor.title} · Cấp {competitor.level}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">Tỷ lệ thắng</p>
                      <p className="text-xs font-mono font-bold text-slate-800 tabular-nums">{competitor.winRate}%</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-center min-w-[84px]">
                      <p className="text-[11px] text-slate-500 font-medium">Trận thắng</p>
                      <p className="text-sm font-mono font-bold text-blue-700 tabular-nums">{competitor.pkWins}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MATCHMAKING VIEW */}
      {pkTab === "matchmaking" && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center shadow-sm space-y-7 py-14 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-96 h-96 border-4 border-dashed border-blue-500 rounded-full animate-spin [animation-duration:40s]" />
            <div className="w-72 h-72 border border-dashed border-blue-500 rounded-full animate-reverse-spin absolute" />
          </div>

          <div className="space-y-4 max-w-md mx-auto relative z-10">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-blue-600 blur opacity-30 animate-pulse" />
                <div className="w-18 h-18 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md relative">
                  <Sword className="w-9 h-9 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-slate-900 text-lg">Đang kết nối phòng thi đấu</h3>
              <p className="text-xs text-slate-600">
                Chủ đề: <strong className="text-slate-900">{selectedCategory?.name}</strong> · Mức độ:{" "}
                <strong className="text-blue-700">
                  {difficulty === "easy" ? "Cơ bản" : difficulty === "medium" ? "Trung bình" : "Nâng cao"}
                </strong>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <p className="text-xs md:text-sm font-semibold text-blue-700 animate-pulse">{searchingStatus}</p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(searchingTimer / 5) * 100}%` }}
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={quitBattle}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Hủy tìm trận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. BATTLE SCREEN VIEW */}
      {pkTab === "battle" && opponent && roundQuestions[currentRound - 1] && (
        <div className="space-y-5">
          
          {/* Head-to-Head Scoreboard */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/90 shadow-2xs grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            
            {/* Left: Student */}
            <div className="md:col-span-4 flex items-center gap-3 bg-blue-50/60 p-3 rounded-xl border border-blue-200/80 relative">
              <div className="w-11 h-11 bg-white border border-blue-200 rounded-xl flex items-center justify-center text-2xl shrink-0">
                {userAvatarObj.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-blue-700">Học sinh (Em)</p>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {localStorage.getItem("smart_study_nickname_v2") || "Học Viên Ưu Tú"}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-500">Điểm:</span>
                  <span className="text-sm font-mono font-bold text-blue-700 tabular-nums">{userScore}đ</span>
                </div>
              </div>
              {userChoice !== null && (
                <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0" title="Đã chọn đáp án">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Center: Round & Timer */}
            <div className="md:col-span-3 text-center space-y-1.5 py-1 md:py-0">
              <span className="text-xs font-semibold bg-slate-100 text-slate-800 px-3 py-1 rounded-md border border-slate-200 inline-block">
                Vòng {currentRound} / 3
              </span>
              
              <div className="flex justify-center items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                <span className={`text-xl font-mono font-bold tabular-nums ${roundTimeLeft < 4 ? "text-rose-600 scale-110 animate-ping" : "text-slate-900"}`}>
                  0:{roundTimeLeft < 10 ? `0${roundTimeLeft}` : roundTimeLeft}s
                </span>
              </div>
            </div>

            {/* Right: Opponent */}
            <div className="md:col-span-4 flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-right md:flex-row-reverse relative overflow-hidden">
              {isBotFrozen && (
                <div className="absolute inset-0 bg-blue-50/90 backdrop-blur-xs flex items-center justify-center z-10 text-xs font-bold text-blue-900 animate-pulse">
                  <Snowflake className="w-4 h-4 animate-bounce text-blue-600 mr-1.5" />
                  <span>Đã bị đóng băng lượt này</span>
                </div>
              )}
              {isOpponentBlinded && (
                <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-xs flex items-center justify-center z-10 text-xs font-bold text-white">
                  <EyeOff className="w-4 h-4 mr-1.5" />
                  <span>Đang bị che tầm nhìn</span>
                </div>
              )}
              {isOpponentSabotaged && (
                <div className="absolute inset-0 bg-teal-50/90 backdrop-blur-xs flex items-center justify-center z-10 text-xs font-bold text-teal-900">
                  <Wind className="w-4 h-4 mr-1.5 animate-spin" />
                  <span>Đang bị nhiễu câu hỏi</span>
                </div>
              )}

              <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-2xl shrink-0">
                {opponent.avatarEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-rose-600">Boss / Bot AI</p>
                <h4 className="text-sm font-bold text-slate-900 truncate">{opponent.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5 md:flex-row-reverse">
                  <span className="text-xs text-slate-500">Điểm:</span>
                  <span className="text-sm font-mono font-bold text-slate-800 tabular-nums">{opponent.score}đ</span>
                </div>
              </div>
              {opponent.answered && (
                <div className="bg-slate-200 text-slate-800 p-1.5 rounded-lg shrink-0" title="Boss / Bot AI đã chọn">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Active Card Notification Banner */}
          {activeCardNotification && (
            <div className="bg-blue-600 text-white rounded-xl px-4 py-3 text-xs md:text-sm font-semibold shadow-xs flex items-center gap-2 animate-bounce">
              <Zap className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{activeCardNotification}</span>
              {scoreMultiplier > 1 && (
                <span className="ml-auto bg-blue-700 px-2.5 py-0.5 rounded-md border border-blue-400/40 font-mono">
                  x{scoreMultiplier} điểm
                </span>
              )}
            </div>
          )}

          {/* Clairvoyance Next Round Hint Banner */}
          {nextRoundHint && currentRound === hintRound && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold flex items-center gap-2 animate-pulse">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Gợi ý biết trước: {nextRoundHint}</span>
            </div>
          )}

          {/* Question & Options Stage */}
          <div className="bg-white rounded-2xl p-5 md:p-7 border border-slate-200/90 shadow-2xs space-y-5 relative overflow-hidden">
            
            {/* Screen Blind Overlay */}
            {playerBlindedTime > 0 && !roundRevealed && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 text-white pointer-events-none">
                <EyeOff className="w-10 h-10 text-rose-400 animate-pulse mb-2.5" />
                <h4 className="font-display font-bold text-base text-rose-300">Màn hình đang bị sương mù che phủ</h4>
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed mt-1">
                  Đối thủ vừa dùng thẻ che tầm nhìn của em. Bình tĩnh chờ sương tan để chọn đáp án!
                </p>
                <div className="bg-white/10 border border-white/20 px-3.5 py-1 rounded-lg text-xs font-mono font-bold mt-3 animate-bounce">
                  Sương tan sau: {playerBlindedTime} giây
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-200">
                Môn: {roundQuestions[currentRound - 1].subject}
              </span>
              <span className="text-xs font-medium text-slate-600">
                Mức độ:{" "}
                <strong className="text-slate-900">
                  {roundQuestions[currentRound - 1].difficulty === "easy"
                    ? "Cơ bản"
                    : roundQuestions[currentRound - 1].difficulty === "medium"
                    ? "Trung bình"
                    : roundQuestions[currentRound - 1].difficulty === "hard"
                    ? "Nâng cao"
                    : "Thử thách đặc biệt"}
                </strong>
              </span>
            </div>

            <div>
              <h3 className="font-display font-bold text-slate-900 text-base md:text-lg leading-snug">
                {roundQuestions[currentRound - 1].question}
              </h3>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {roundQuestions[currentRound - 1].options.map((option, idx) => {
                const isSelected = userChoice === idx;
                const isCorrectAnswer = idx === roundQuestions[currentRound - 1].correctIndex;
                const isOptionDisabled = disabledOptionIndices.includes(idx);
                
                let optionStyle = "bg-slate-50/70 border-slate-200 hover:border-blue-400 hover:bg-white text-slate-800";
                
                if (isOptionDisabled) {
                  optionStyle = "bg-slate-50 border-slate-200 text-slate-400 line-through opacity-40 cursor-not-allowed pointer-events-none";
                } else if (roundRevealed) {
                  if (isCorrectAnswer) {
                    optionStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-500/20 font-bold";
                  } else if (isSelected) {
                    optionStyle = "bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-500/20";
                  } else {
                    optionStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-65";
                  }
                } else if (isSelected) {
                  optionStyle = "bg-blue-50 border-blue-600 ring-1 ring-blue-600/20 text-blue-950 font-bold";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={userChoice !== null || roundRevealed || isOptionDisabled}
                    onClick={() => handleUserAnswer(idx)}
                    className={`p-4 rounded-xl border text-left text-xs md:text-sm font-semibold transition-all relative flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold flex items-center justify-center shrink-0 text-slate-700">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug">{option}</span>
                    </div>
                    
                    {roundRevealed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {userChoice === idx && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-md font-semibold">
                            Em
                          </span>
                        )}
                        {opponent.choice === idx && (
                          <span className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold border border-slate-300">
                            {opponent.avatarEmoji}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation */}
            {roundRevealed && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1 animate-slide-down">
                <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Giải thích đáp án</span>
                </h4>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                  {roundQuestions[currentRound - 1].explanation}
                </p>
              </div>
            )}

            {/* Magic Cards Deck */}
            {!roundRevealed && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3 mt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thẻ bổ trợ của em (mỗi vòng dùng tối đa 1 thẻ)</span>
                  </span>
                  {cardUsedThisRound && (
                    <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-md font-semibold animate-pulse">
                      Đã dùng thẻ ở vòng này
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {MAGIC_CARDS.map((card) => {
                    const qty = magicCards[card.id] || 0;
                    const isFreeze = card.id === "freeze";
                    const isFreezeDisabled = isFreeze && isFreezeUsedThisMatch;
                    const cooldownLeft = cardCooldowns[card.id] || 0;
                    const isOnCooldown = cooldownLeft > 0;
                    const isButtonDisabled = qty <= 0 || cardUsedThisRound || isFreezeDisabled || isOnCooldown;

                    return (
                      <button
                        key={card.id}
                        type="button"
                        disabled={isButtonDisabled}
                        onClick={() => handleUseCardInBattle(card.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center text-center justify-between transition-all select-none relative cursor-pointer group ${
                          isOnCooldown
                            ? "border-amber-300 bg-amber-50/40 opacity-90"
                            : isButtonDisabled 
                            ? "opacity-40 border-slate-200 bg-white" 
                            : "border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/40 shadow-2xs"
                        }`}
                        title={`${card.name}\nPhân cấp: ${card.tierLabel}\nSức mạnh: ${card.power}/100\nHồi chiêu: ${card.cooldownRounds} vòng\nHiệu ứng: ${card.effect}`}
                      >
                        {/* Cooldown Radial Overlay */}
                        {isOnCooldown && (
                          <div className="absolute inset-0 bg-slate-950/75 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-[1px] border border-amber-500/40 transition-all duration-300">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                              <svg className="w-10 h-10 transform -rotate-90">
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="15"
                                  stroke="rgba(255, 255, 255, 0.15)"
                                  strokeWidth="3"
                                  fill="transparent"
                                />
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="15"
                                  stroke="#38bdf8"
                                  strokeWidth="3"
                                  fill="transparent"
                                  strokeDasharray={94.2}
                                  strokeDashoffset={94.2 - (cooldownLeft / card.cooldownRounds) * 94.2}
                                  strokeLinecap="round"
                                  className="transition-all duration-500 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                <span className="text-xs font-mono font-bold text-white">{cooldownLeft}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-sky-200 mt-0.5 animate-pulse">
                              Đang hồi
                            </span>
                          </div>
                        )}

                        {/* Quantity Badge */}
                        <span className={`absolute -top-1.5 -right-1 text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-md shadow-2xs z-20 ${
                          qty > 0 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          x{qty}
                        </span>

                        <span className="text-xl mb-1 group-hover:animate-bounce">{card.emoji}</span>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">{card.name}</p>
                        
                        {isOnCooldown ? (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-1 animate-pulse">
                            Chờ {cooldownLeft}v
                          </span>
                        ) : isFreezeDisabled ? (
                          <span className="text-[11px] font-semibold text-rose-600 mt-1">Đã dùng</span>
                        ) : (
                          <span className="text-[11px] text-slate-500 mt-1 font-mono">
                            Hồi: {card.cooldownRounds}v
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Round Footer Controls */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={quitBattle}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Rời trận đấu
              </button>

              {!roundRevealed ? (
                <button
                  type="button"
                  disabled={userChoice === null}
                  onClick={() => revealRoundResults()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs md:text-sm rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  Chốt đáp án
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>{currentRound < 3 ? "Sang vòng tiếp theo" : "Xem kết quả chung cuộc"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. RESULTS DISPLAY VIEW */}
      {pkTab === "results" && opponent && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.35 }}
          className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 text-center shadow-lg space-y-7 max-w-lg mx-auto py-10 relative overflow-hidden"
        >
          <div className="space-y-4 relative z-10">
            <div className="flex justify-center">
              <div className="relative">
                {userScore > opponent.score ? (
                  <>
                    <motion.div 
                      className="absolute -inset-4 rounded-full bg-gradient-to-tr from-sky-400 via-blue-500 to-sky-600 blur opacity-35"
                      animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                    />
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.2, stiffness: 120, damping: 10 }}
                      className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md relative"
                    >
                      <Trophy className="w-12 h-12 text-amber-300" />
                      <motion.span 
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute -top-3 -right-2 bg-amber-400 text-amber-950 p-1.5 rounded-full shadow-xs"
                      >
                        <Crown className="w-4 h-4 fill-current" />
                      </motion.span>
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -inset-1 rounded-full border-2 border-blue-300 pointer-events-none"
                      />
                    </motion.div>
                  </>
                ) : userScore === opponent.score ? (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md relative"
                  >
                    <Shield className="w-10 h-10" />
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-xs relative"
                  >
                    <BookOpen className="w-10 h-10" />
                  </motion.div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-blue-700 flex items-center justify-center gap-1.5">
                <span>Tổng kết trận đấu</span>
              </span>
              <h3 className="font-display font-bold text-slate-900 text-xl leading-tight">
                {userScore > opponent.score ? (
                  <motion.span 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-900 flex flex-col items-center gap-1"
                  >
                    <span className="font-bold text-2xl">Chiến thắng thuyết phục!</span>
                    {pkStreak > 1 && (
                      <span className="text-xs bg-amber-500 text-white font-semibold px-3 py-1 rounded-full mt-1.5 animate-bounce flex items-center gap-1.5 shadow-xs">
                        <Flame className="w-3.5 h-3.5 fill-white" />
                        <span>Chuỗi {pkStreak} trận thắng liên tiếp</span>
                      </span>
                    )}
                  </motion.span>
                ) : userScore === opponent.score ? (
                  <span className="text-blue-700 font-bold">Hai bên hòa điểm!</span>
                ) : (
                  <span className="text-slate-700 font-bold">Chưa giành chiến thắng lượt này</span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Mức độ câu hỏi: <strong className="text-slate-800">{difficulty === "easy" ? "Cơ bản" : difficulty === "medium" ? "Trung bình" : "Nâng cao"}</strong>
              </p>
            </div>
          </div>

          {/* Score Comparison */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between max-w-sm mx-auto relative"
          >
            <div className="text-center space-y-1 flex-1">
              <p className="text-xs font-medium text-slate-500">Điểm của em</p>
              <motion.p 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                className="text-2xl font-mono font-bold text-blue-700 tabular-nums"
              >
                {userScore}đ
              </motion.p>
            </div>
            <div className="h-10 w-px bg-slate-200 shrink-0 mx-2" />
            <div className="text-center space-y-1 flex-1">
              <p className="text-xs font-medium text-slate-500">Điểm boss / bot AI</p>
              <p className="text-2xl font-mono font-bold text-slate-700 tabular-nums">{opponent.score}đ</p>
            </div>
          </motion.div>

          {/* Rewards Received */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-left"
          >
            <h4 className="text-xs font-semibold text-slate-700">Phần thưởng nhận được:</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Kinh nghiệm</p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {userScore > opponent.score 
                      ? `+${difficulty === "easy" ? 25 : difficulty === "medium" ? 40 : 70} XP` 
                      : userScore === opponent.score 
                      ? "+15 XP" 
                      : "+5 XP"
                    }
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <WisdomCoinIcon size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Xu thưởng</p>
                  <p className="text-sm font-mono font-bold text-slate-900">
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
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setTriggerConfetti(false);
                setPkTab("lobby");
              }}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm rounded-xl transition-all cursor-pointer text-center"
            >
              Về sảnh thi đấu
            </button>
            <button
              type="button"
              onClick={startMatchmaking}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm rounded-xl shadow-2xs transition-all cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi đấu tiếp</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
