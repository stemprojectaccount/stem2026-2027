import React, { useState, useEffect, useMemo } from "react";
import { Trophy, Crown, Search, Flame, ArrowUp, ArrowDown, Minus, Award, Edit2, Check, Globe, GraduationCap, CheckCircle2, School, Star, FileCheck, TrendingUp, Target, ChevronDown, Filter } from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { UserProgress } from "../types";
import { getAvatarAtLevel } from "../lib/avatarEvolution";
import { UserAvatar } from "./UserAvatar";

interface LeaderboardProps {
  progress: UserProgress;
  selectedAvatarIdx: number;
  onNavigateToQuiz: () => void;
  onUpdateProgress?: (fields: Partial<UserProgress>) => void;
}

export interface Competitor {
  id: string;
  name: string;
  points: number;
  level: number;
  streak: number;
  grade: string;
  classroom: string;
  avatarEmoji: string;
  avatarLabel: string;
  motto: string;
  trend: "up" | "down" | "stable";
  testsTaken: number;
  achievementBadge: string;
  isCurrentUser?: boolean;
  botRole?: "BOT" | "BOSS";
}

const AVAILABLE_GRADES = [
  "Lớp 6",
  "Lớp 7",
  "Lớp 8",
  "Lớp 9"
];

const INITIAL_COMPETITORS: Competitor[] = [
  // Khối 6 - Hệ thống Boss & Bot AI huấn luyện (khi chưa có người chơi thật khác tham gia)
  {
    id: "comp-6-1",
    name: "Boss Sói Bạc Kiên Cường",
    points: 480,
    level: 5,
    streak: 12,
    grade: "Lớp 6",
    classroom: "BOSS-K6",
    avatarEmoji: "🐺",
    avatarLabel: "Boss Sói Bạc AI",
    motto: "Thuật toán kỷ luật tối ưu hóa điểm số Toán và KHTN Lớp 6!",
    trend: "stable",
    testsTaken: 14,
    achievementBadge: "Boss Thủ Lĩnh Khối 6",
    botRole: "BOSS"
  },
  {
    id: "comp-6-2",
    name: "Bot Mèo Bách Khoa",
    points: 390,
    level: 4,
    streak: 8,
    grade: "Lớp 6",
    classroom: "BOT-6A",
    avatarEmoji: "🐱",
    avatarLabel: "Bot Mèo Bách Khoa",
    motto: "Mô phỏng học sinh chăm chỉ ôn tập Flashcard mỗi ngày",
    trend: "up",
    testsTaken: 11,
    achievementBadge: "Bot Siêu Trí Nhớ",
    botRole: "BOT"
  },
  {
    id: "comp-6-3",
    name: "Bot Thỏ Trắng Tia Chớp",
    points: 320,
    level: 4,
    streak: 6,
    grade: "Lớp 6",
    classroom: "BOT-6B",
    avatarEmoji: "🐰",
    avatarLabel: "Bot Thỏ Tia Chớp",
    motto: "Bot luyện phản xạ giải nhanh đề trắc nghiệm cơ bản",
    trend: "up",
    testsTaken: 9,
    achievementBadge: "Bot Phản Xạ Nhanh",
    botRole: "BOT"
  },
  {
    id: "comp-6-4",
    name: "Bot Khủng Long Cơ Học",
    points: 260,
    level: 3,
    streak: 5,
    grade: "Lớp 6",
    classroom: "BOT-6C",
    avatarEmoji: "🦖",
    avatarLabel: "Bot Khủng Long AI",
    motto: "Bot canh giữ thử thách câu hỏi vận dụng Khối 6!",
    trend: "down",
    testsTaken: 7,
    achievementBadge: "Bot Vệ Binh Ôn Tập",
    botRole: "BOT"
  },
  {
    id: "comp-6-5",
    name: "Bot Gấu Trúc Cần Mẫn",
    points: 180,
    level: 2,
    streak: 7,
    grade: "Lớp 6",
    classroom: "BOT-6D",
    avatarEmoji: "🐼",
    avatarLabel: "Bot Gấu Trúc AI",
    motto: "Bot đồng hành cùng học sinh mới bắt đầu tích lũy XP",
    trend: "up",
    testsTaken: 5,
    achievementBadge: "Bot Khởi Đầu Vững",
    botRole: "BOT"
  },
  {
    id: "comp-6-6",
    name: "Bot Tân Binh Tập Sự",
    points: 80,
    level: 1,
    streak: 3,
    grade: "Lớp 6",
    classroom: "BOT-6E",
    avatarEmoji: "🤖",
    avatarLabel: "Bot Tập Sự AI",
    motto: "Mốc điểm khởi đầu dành cho học sinh mới làm quen hệ thống",
    trend: "stable",
    testsTaken: 2,
    achievementBadge: "Bot Cấp Độ 1",
    botRole: "BOT"
  },

  // Khối 7 - Hệ thống Boss & Bot AI huấn luyện
  {
    id: "comp-7-1",
    name: "Boss Mãnh Hổ Khoa Học",
    points: 520,
    level: 6,
    streak: 15,
    grade: "Lớp 7",
    classroom: "BOSS-K7",
    avatarEmoji: "🐯",
    avatarLabel: "Boss Mãnh Hổ AI",
    motto: "Boss trấn giữ đỉnh bảng Khối 7 với độ chính xác 95%!",
    trend: "up",
    testsTaken: 16,
    achievementBadge: "Boss Thủ Khoa Khối 7",
    botRole: "BOSS"
  },
  {
    id: "comp-7-2",
    name: "Bot Thiên Nga Học Thuật",
    points: 410,
    level: 4,
    streak: 9,
    grade: "Lớp 7",
    classroom: "BOT-7A",
    avatarEmoji: "🦢",
    avatarLabel: "Bot Thiên Nga AI",
    motto: "Bot chuyên sâu Ngữ văn và Lịch sử - Địa lý Khối 7",
    trend: "stable",
    testsTaken: 12,
    achievementBadge: "Bot Văn Sử Tinh Anh",
    botRole: "BOT"
  },
  {
    id: "comp-7-3",
    name: "Bot Đại Bàng Tầm Nhìn",
    points: 305,
    level: 3,
    streak: 6,
    grade: "Lớp 7",
    classroom: "BOT-7B",
    avatarEmoji: "🦅",
    avatarLabel: "Bot Đại Bàng AI",
    motto: "Bot phân tích các câu hỏi hình học và đại số Khối 7",
    trend: "up",
    testsTaken: 8,
    achievementBadge: "Bot Trắc Nghiệm 7",
    botRole: "BOT"
  },
  {
    id: "comp-7-4",
    name: "Bot Cáo Lửa Nhanh Nhẹn",
    points: 195,
    level: 2,
    streak: 4,
    grade: "Lớp 7",
    classroom: "BOT-7C",
    avatarEmoji: "🦊",
    avatarLabel: "Bot Cáo Lửa AI",
    motto: "Bot tốc độ cơ bản giúp em luyện phản xạ đầu giờ",
    trend: "down",
    testsTaken: 6,
    achievementBadge: "Bot Tốc Độ 7",
    botRole: "BOT"
  },

  // Khối 8 - Hệ thống Boss & Bot AI huấn luyện
  {
    id: "comp-8-1",
    name: "Boss Rồng Xanh Huyền Thoại",
    points: 560,
    level: 6,
    streak: 14,
    grade: "Lớp 8",
    classroom: "BOSS-K8",
    avatarEmoji: "🐉",
    avatarLabel: "Boss Rồng Xanh AI",
    motto: "Boss tối thượng Khối 8 — Thử thách mọi học sinh giỏi Toán và KHTN",
    trend: "stable",
    testsTaken: 18,
    achievementBadge: "Boss Bá Chủ Khối 8",
    botRole: "BOSS"
  },
  {
    id: "comp-8-2",
    name: "Bot Sóc Nâu Nguyên Tử",
    points: 450,
    level: 5,
    streak: 11,
    grade: "Lớp 8",
    classroom: "BOT-8A",
    avatarEmoji: "🐿️",
    avatarLabel: "Bot Sóc Nâu AI",
    motto: "Bot giải nhanh các phương trình Hóa học và Vật lý Khối 8",
    trend: "up",
    testsTaken: 13,
    achievementBadge: "Bot Cao Thủ KHTN",
    botRole: "BOT"
  },
  {
    id: "comp-8-3",
    name: "Bot Kỳ Lân Sáng Tạo",
    points: 340,
    level: 4,
    streak: 7,
    grade: "Lớp 8",
    classroom: "BOT-8B",
    avatarEmoji: "🦄",
    avatarLabel: "Bot Kỳ Lân AI",
    motto: "Bot huấn luyện kỹ năng đọc hiểu và từ vựng Tiếng Anh 8",
    trend: "down",
    testsTaken: 10,
    achievementBadge: "Bot Song Ngữ 8",
    botRole: "BOT"
  },
  {
    id: "comp-8-4",
    name: "Bot Bướm Vàng Tri Thức",
    points: 210,
    level: 3,
    streak: 5,
    grade: "Lớp 8",
    classroom: "BOT-8C",
    avatarEmoji: "🦋",
    avatarLabel: "Bot Bướm Vàng AI",
    motto: "Bot mốc điểm cơ bản dành cho học sinh Khối 8 vượt qua",
    trend: "up",
    testsTaken: 6,
    achievementBadge: "Bot Huấn Luyện 8",
    botRole: "BOT"
  },

  // Khối 9 - Hệ thống Boss & Bot AI huấn luyện
  {
    id: "comp-9-1",
    name: "Boss Sư Tử Thủ Khoa Ω",
    points: 620,
    level: 7,
    streak: 18,
    grade: "Lớp 9",
    classroom: "BOSS-K9",
    avatarEmoji: "🦁",
    avatarLabel: "Boss Sư Tử AI",
    motto: "Boss Tổng Ôn Tuyển Sinh Lớp 10 — Đỉnh cao thử thách toàn trường!",
    trend: "up",
    testsTaken: 22,
    achievementBadge: "Boss Đại Học Bá K9",
    botRole: "BOSS"
  },
  {
    id: "comp-9-2",
    name: "Boss Phượng Hoàng Lửa",
    points: 510,
    level: 5,
    streak: 13,
    grade: "Lớp 9",
    classroom: "BOSS-9A",
    avatarEmoji: "🦚",
    avatarLabel: "Boss Phượng Hoàng AI",
    motto: "Boss chuyên luyện đề Ngữ văn và Tiếng Anh vào lớp 10",
    trend: "stable",
    testsTaken: 15,
    achievementBadge: "Boss Tinh Hoa Khối 9",
    botRole: "BOSS"
  },
  {
    id: "comp-9-3",
    name: "Bot Báo Đen Bứt Phá",
    points: 380,
    level: 4,
    streak: 8,
    grade: "Lớp 9",
    classroom: "BOT-9B",
    avatarEmoji: "🐆",
    avatarLabel: "Bot Báo Đen AI",
    motto: "Bot luyện tốc độ bấm giờ giải đề trắc nghiệm Khối 9",
    trend: "up",
    testsTaken: 11,
    achievementBadge: "Bot Tốc Độ Khối 9",
    botRole: "BOT"
  }
];

export default function Leaderboard({ 
  progress, 
  selectedAvatarIdx, 
  onNavigateToQuiz,
  onUpdateProgress 
}: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "grade">("grade");
  const userGrade = progress.grade || "Lớp 6";
  const [selectedGradeView, setSelectedGradeView] = useState<string>(userGrade);
  const [scopeFilter, setScopeFilter] = useState<"nation" | "province" | "school">("nation");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [nickname, setNickname] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("smart_study_nickname_v2");
      return saved || "Học Viên Ưu Tú";
    } catch {
      return "Học Viên Ưu Tú";
    }
  });
  
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(nickname);

  const saveNickname = () => {
    if (!tempName.trim()) return;
    setNickname(tempName.trim());
    localStorage.setItem("smart_study_nickname_v2", tempName.trim());
    setIsEditingName(false);
  };

  const handleSetUserGrade = (newGrade: string) => {
    setSelectedGradeView(newGrade);
    if (onUpdateProgress) {
      onUpdateProgress({ grade: newGrade });
    } else {
      localStorage.setItem("smart_study_user_grade", newGrade);
    }
  };

  const activeMascotIdx = React.useMemo(() => {
    if (progress.avatarUrl && progress.avatarUrl.startsWith("mascot:")) {
      const p = parseInt(progress.avatarUrl.replace("mascot:", ""), 10);
      if (!isNaN(p) && p >= 0 && p < 6) return p;
    }
    return selectedAvatarIdx >= 0 && selectedAvatarIdx < 6 ? selectedAvatarIdx : 0;
  }, [progress.avatarUrl, selectedAvatarIdx]);

  const userEvolution = getAvatarAtLevel(activeMascotIdx, progress.level);
  const currentUserCompetitor: Competitor = {
    id: "comp-user",
    name: (progress.displayName || nickname) + " (Em)",
    points: progress.points,
    level: progress.level,
    streak: progress.streak,
    grade: userGrade,
    classroom: progress.school ? `${progress.school.split(" ").slice(-1)[0]} • ${userGrade}` : `${userGrade.replace("Lớp ", "")}A1`,
    avatarEmoji: userEvolution.emoji,
    avatarLabel: userEvolution.title,
    motto: progress.bio || "Hành trình vạn dặm bắt đầu từ một bài học!",
    trend: "up",
    testsTaken: progress.testsTakenCount || 0,
    achievementBadge: progress.titleBadge || "Chiến Binh Đồng Hành",
    isCurrentUser: true
  };

  const allCompetitorsWithUser = [...INITIAL_COMPETITORS];
  const userIdx = allCompetitorsWithUser.findIndex(c => c.id === "comp-user");
  if (userIdx > -1) {
    allCompetitorsWithUser[userIdx] = currentUserCompetitor;
  } else {
    allCompetitorsWithUser.push(currentUserCompetitor);
  }

  const sortedAllCompetitors = [...allCompetitorsWithUser].sort((a, b) => b.points - a.points);
  const overallUserRank = sortedAllCompetitors.findIndex(c => c.isCurrentUser) + 1;

  const competitorsInGrade = allCompetitorsWithUser.filter(c => c.grade === selectedGradeView);
  if (selectedGradeView === userGrade && !competitorsInGrade.some(c => c.isCurrentUser)) {
    competitorsInGrade.push(currentUserCompetitor);
  }
  const sortedGradeCompetitors = [...competitorsInGrade].sort((a, b) => b.points - a.points);
  const gradeUserRank = sortedGradeCompetitors.findIndex(c => c.isCurrentUser) + 1;

  const targetList = activeTab === "all" ? sortedAllCompetitors : sortedGradeCompetitors;
  const filteredCompetitors = targetList.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.classroom.toLowerCase().includes(q) ||
      c.grade.toLowerCase().includes(q) ||
      c.achievementBadge.toLowerCase().includes(q)
    );
  });

  const gradePoints = sortedGradeCompetitors.map(c => c.points);
  const avgGradePoints = gradePoints.length > 0 
    ? Math.round(gradePoints.reduce((acc, curr) => acc + curr, 0) / gradePoints.length) 
    : 0;
  const topGradeCompetitor = sortedGradeCompetitors[0];
  const topGradeStreak = Math.max(...sortedGradeCompetitors.map(c => c.streak), 0);
  const firstPlaceDiff = topGradeCompetitor ? Math.max(0, topGradeCompetitor.points - progress.points) : 0;

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shadow-2xs text-amber-950 font-mono font-bold text-sm relative shrink-0">
          <Crown className="w-4 h-4 text-amber-600 fill-amber-300 absolute -top-2.5 animate-bounce" />
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-800 font-mono font-bold text-sm shrink-0">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-mono font-bold text-sm shrink-0">
          3
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-mono font-semibold text-xs shrink-0 border border-slate-200">
        {rank}
      </div>
    );
  };

  const renderTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />;
    if (trend === "down") return <ArrowDown className="w-3.5 h-3.5 text-rose-600" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  const [chartScope, setChartScope] = useState<"grade" | "all">("grade");

  useEffect(() => {
    setChartScope(activeTab);
  }, [activeTab]);

  const targetCurrentRank = chartScope === "grade" ? gradeUserRank : overallUserRank;
  const targetTotalCompetitors = chartScope === "grade" ? sortedGradeCompetitors.length : sortedAllCompetitors.length;

  const rankHistory7Days = useMemo(() => {
    const days = [];
    const now = new Date();
    const offsets = targetCurrentRank === 1 
      ? [3, 2, 2, 2, 1, 1, 0]
      : [4, 3, 3, 2, 2, 1, 0];

    const weekdayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isToday = i === 0;
      const dayShort = isToday ? "Hôm nay" : weekdayNames[d.getDay()];
      const dateFormatted = `${d.getDate()}/${d.getMonth() + 1}`;
      
      const offset = offsets[6 - i];
      const histRank = isToday 
        ? targetCurrentRank 
        : Math.min(targetTotalCompetitors, Math.max(1, targetCurrentRank + offset));

      const xpBase = Math.round(progress.points / (progress.level * 3 + 7));
      const dailyXP = Math.max(15, xpBase + (6 - i) * 10);

      days.push({
        day: dayShort,
        date: dateFormatted,
        fullLabel: isToday ? `Hôm nay (${dateFormatted})` : `${dayShort}, ${dateFormatted}`,
        rank: histRank,
        xpEarned: dailyXP,
        isToday
      });
    }
    return days;
  }, [targetCurrentRank, targetTotalCompetitors, progress.points, progress.level]);

  const startRank = rankHistory7Days[0]?.rank || targetCurrentRank;
  const currentRankToday = rankHistory7Days[6]?.rank || targetCurrentRank;
  const rankDelta = startRank - currentRankToday;
  const bestRank7d = Math.min(...rankHistory7Days.map(d => d.rank));
  const rawMin = Math.min(...rankHistory7Days.map(d => d.rank));
  const rawMax = Math.max(...rankHistory7Days.map(d => d.rank));
  const minRankVal = Math.max(1, rawMin - 1);
  const maxRankVal = rawMax <= minRankVal ? minRankVal + 2 : rawMax + 1;

  const CustomRankTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
            <span className="font-semibold text-slate-200">{data.fullLabel}</span>
            <span className="font-mono font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded text-[11px]">
              Hạng #{data.rank}
            </span>
          </div>
          <div className="text-xs text-slate-300 flex items-center justify-between gap-4 pt-0.5">
            <span>XP tích lũy:</span>
            <span className="font-mono font-bold text-emerald-400">+{data.xpEarned} XP</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderRankDot = (props: any) => {
    const { cx, cy, index, payload } = props;
    const isToday = payload?.isToday || index === 6;
    return (
      <g key={`rank-dot-${index}`}>
        <circle
          cx={cx}
          cy={cy}
          r={isToday ? 5 : 3.5}
          fill={isToday ? "#2563eb" : "#60a5fa"}
          stroke="#ffffff"
          strokeWidth={2}
        />
        {isToday && (
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill="none"
            stroke="#2563eb"
            strokeWidth={1.5}
            className="animate-pulse"
          />
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* 1. Header Card */}
      <div className="bg-white rounded-2xl p-6 md:p-7 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>Bảng vàng thi đua học tập</span>
              </span>
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200 inline-flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>Khối của em: {userGrade}</span>
              </span>
            </div>

            <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900 tracking-tight">
              Bảng xếp hạng và So tài Boss / Bot AI
            </h1>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              {activeTab === "grade"
                ? `Hiện chưa có người chơi thật khác vào phòng — Hệ thống tự động xếp hạng em cùng dàn Boss và Bot AI huấn luyện của ${selectedGradeView}.`
                : "Khi chưa có học sinh thật khác tham gia, bảng xếp hạng đối chiếu thành tích của em với toàn bộ Boss và Bot AI các khối."}
            </p>
          </div>

          {/* Current User Rank Highlight */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center gap-4 min-w-[240px] w-full md:w-auto">
            <div className="w-12 h-12 bg-amber-400 text-amber-950 rounded-xl flex items-center justify-center shadow-2xs shrink-0">
              <Crown className="w-6 h-6 fill-amber-100" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500">
                {activeTab === "grade" ? `Thứ hạng ${selectedGradeView} của em` : "Thứ hạng toàn trường"}
              </p>
              <p className="text-xl font-mono font-bold text-slate-900 leading-tight tabular-nums mt-0.5">
                {activeTab === "grade" ? (
                  selectedGradeView === userGrade ? `Hạng #${gradeUserRank}` : `Đang xem ${selectedGradeView}`
                ) : (
                  `Hạng #${overallUserRank}`
                )}
              </p>
              <p className="text-xs text-blue-700 font-semibold mt-0.5">
                {activeTab === "grade" && selectedGradeView === userGrade ? (
                  gradeUserRank === 1 
                    ? "Đang dẫn đầu toàn khối" 
                    : `Cách vị trí số 1: ${firstPlaceDiff} XP`
                ) : (
                  `Top ${Math.round((overallUserRank / sortedAllCompetitors.length) * 100)}% toàn trường`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab("grade");
                setSelectedGradeView(userGrade);
              }}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                activeTab === "grade" && selectedGradeView === userGrade
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Cùng khối lớp ({userGrade})</span>
            </button>

            {/* Grade Dropdown */}
            <div className="relative flex items-center">
              <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <select
                id="grade-filter-dropdown"
                value={selectedGradeView}
                onChange={(e) => {
                  setSelectedGradeView(e.target.value);
                  setActiveTab("grade");
                }}
                aria-label="Chọn khối lớp (Lớp 6-9)"
                className="appearance-none pl-8 pr-7 py-2 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-slate-200 hover:border-slate-300 cursor-pointer focus:outline-none focus:border-blue-600"
              >
                {AVAILABLE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    Khối {g} {g === userGrade ? "(Của em)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Toàn trường ({sortedAllCompetitors.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm đối thủ" placeholder="Tìm tên Boss, Bot AI hoặc mã khối..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Scope & Subject Pills (Clean text without broken flag emojis) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">Phạm vi:</span>
            {[
              { id: "nation", label: "Toàn quốc" },
              { id: "province", label: "Tỉnh / Thành phố" },
              { id: "school", label: "Trường học" }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setScopeFilter(item.id as any)}
                className={`py-1.5 px-3 rounded-lg font-semibold text-xs transition-all cursor-pointer border ${
                  scopeFilter === item.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">Môn học:</span>
            {[
              { id: "all", label: "Tất cả môn" },
              { id: "toan", label: "Toán học" },
              { id: "tieng-anh", label: "Tiếng Anh" },
              { id: "ngu-van", label: "Ngữ văn" }
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSubjectFilter(sub.id)}
                className={`py-1.5 px-3 rounded-lg font-semibold text-xs transition-all cursor-pointer border ${
                  subjectFilter === sub.id
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Grade Selection & Benchmarking Metrics */}
      {activeTab === "grade" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-700">Khối lớp đang xem:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {AVAILABLE_GRADES.map((g) => {
                const isSelected = selectedGradeView === g;
                const isUserCurrent = userGrade === g;

                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGradeView(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    <span>{g}</span>
                    {isUserCurrent && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        isSelected ? "bg-blue-800 text-blue-100" : "bg-white text-blue-700"
                      }`}>
                        Của em
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedGradeView !== userGrade && (
              <button
                type="button"
                onClick={() => handleSetUserGrade(selectedGradeView)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đặt {selectedGradeView} làm khối của em</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Vị trí trong khối</span>
              </div>
              <p className="text-xl font-mono font-bold text-slate-900 tabular-nums">
                {selectedGradeView === userGrade ? `#${gradeUserRank}` : "--"}
                <span className="text-xs font-sans font-normal text-slate-500 ml-1">/ {sortedGradeCompetitors.length} bạn</span>
              </p>
              <p className="text-xs text-slate-500">
                {selectedGradeView === userGrade
                  ? `Top ${Math.round((gradeUserRank / sortedGradeCompetitors.length) * 100)}% của khối`
                  : `Em thuộc ${userGrade}`}
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>XP của em</span>
              </div>
              <p className="text-xl font-mono font-bold text-slate-900 tabular-nums">
                {progress.points} XP
              </p>
              <p className="text-xs text-slate-500">
                Trung bình khối: <strong className="text-slate-800 font-mono">{avgGradePoints} XP</strong>
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Dẫn đầu khối</span>
              </div>
              <p className="text-xl font-mono font-bold text-amber-600 tabular-nums">
                {topGradeCompetitor ? `${topGradeCompetitor.points} XP` : "0 XP"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {topGradeCompetitor?.isCurrentUser 
                  ? "Em đang dẫn đầu khối" 
                  : topGradeCompetitor?.name || "Bạn học"}
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Chuỗi ngày học</span>
              </div>
              <p className="text-xl font-mono font-bold text-slate-900 tabular-nums">
                {progress.streak} <span className="text-xs font-sans font-normal text-slate-500">ngày</span>
              </p>
              <p className="text-xs text-slate-500">
                Cao nhất khối: <strong className="text-slate-800 font-mono">{topGradeStreak} ngày</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. 7-Day Rank Trend LineChart */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base">
                Xu hướng thứ hạng 7 ngày qua
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi tiến trình cải thiện thứ hạng của em theo từng ngày
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setChartScope("grade")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                chartScope === "grade"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {selectedGradeView}
            </button>
            <button
              type="button"
              onClick={() => setChartScope("all")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                chartScope === "all"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Toàn trường
            </button>
          </div>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <p className="text-xs text-slate-500">Hôm nay</p>
            <p className="text-base font-mono font-bold text-slate-900 mt-0.5 tabular-nums">Hạng #{currentRankToday}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <p className="text-xs text-slate-500">Biến động 7 ngày</p>
            <div className="flex items-center gap-1 mt-0.5">
              {rankDelta > 0 ? (
                <span className="text-xs md:text-sm font-bold text-emerald-700 flex items-center gap-0.5">
                  <ArrowUp className="w-3.5 h-3.5" />
                  Tăng {rankDelta} bậc
                </span>
              ) : rankDelta < 0 ? (
                <span className="text-xs md:text-sm font-bold text-rose-700 flex items-center gap-0.5">
                  <ArrowDown className="w-3.5 h-3.5" />
                  Giảm {Math.abs(rankDelta)} bậc
                </span>
              ) : (
                <span className="text-xs md:text-sm font-bold text-blue-700 flex items-center gap-0.5">
                  <Minus className="w-3.5 h-3.5" />
                  Giữ vững hạng
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <p className="text-xs text-slate-500">Cao nhất tuần</p>
            <p className="text-base font-mono font-bold text-amber-600 mt-0.5 tabular-nums">Hạng #{bestRank7d}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <p className="text-xs text-slate-500">Phạm vi thống kê</p>
            <p className="text-xs md:text-sm font-bold text-slate-800 truncate mt-0.5">
              {chartScope === "grade" ? `${selectedGradeView} (${targetTotalCompetitors} bạn)` : `Toàn trường (${targetTotalCompetitors} bạn)`}
            </p>
          </div>
        </div>

        {/* Recharts LineChart */}
        <div className="h-48 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rankHistory7Days} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="day" 
                tickLine={false} 
                axisLine={{ stroke: "#e2e8f0" }} 
                tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
              />
              <YAxis 
                reversed={true} 
                domain={[minRankVal, maxRankVal]} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                tickFormatter={(val) => `#${val}`}
                allowDecimals={false}
              />
              <Tooltip content={<CustomRankTooltip />} />
              <Line 
                type="monotone" 
                dataKey="rank" 
                stroke="#2563eb" 
                strokeWidth={2.5} 
                dot={renderRankDot}
                activeDot={{ r: 6, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 text-xs text-slate-700">
          <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="leading-relaxed">
            {rankDelta > 0 
              ? `Em đã tiến thêm +${rankDelta} bậc trong 7 ngày qua nhờ duy trì việc ôn bài và làm đề đều đặn.` 
              : currentRankToday === 1
              ? "Em đang giữ vị trí dẫn đầu bảng thi đua. Hãy tiếp tục duy trì chuỗi học tập mỗi ngày!"
              : "Gợi ý: Hoàn thành thêm 1 đề trắc nghiệm hoặc bộ thẻ Flashcard để tích lũy XP và tăng hạng."}
          </p>
        </div>
      </div>

      {/* 5. Nickname Editor */}
      <div className="bg-white rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200 shrink-0">
            <Edit2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Biệt danh hiển thị trên bảng xếp hạng</h3>
            <p className="text-xs text-slate-500">Tên hiển thị cùng các bạn học trong khối và đấu trường</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value.slice(0, 20))}
                className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 w-full md:w-52"
                placeholder="Nhập tên của em..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveNickname();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
              />
              <button
                type="button"
                onClick={saveNickname}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all cursor-pointer"
                aria-label="Lưu biệt danh"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                {nickname}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempName(nickname);
                  setIsEditingName(true);
                }}
                className="p-2 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Đổi biệt danh"
                aria-label="Đổi biệt danh"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6. Leaderboard List */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-base md:text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span>
                {activeTab === "grade" 
                  ? `Danh sách thi đua với Boss và Bot AI · ${selectedGradeView}` 
                  : "Danh sách thi đua với Boss và Bot AI · Toàn trường"}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              1 người chơi thật (Bạn) và {Math.max(0, filteredCompetitors.length - 1)} Boss / Bot AI trong danh sách
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredCompetitors.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Search className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs md:text-sm font-semibold text-slate-600">
                Không tìm thấy Boss / Bot AI nào khớp với từ khóa "{searchQuery}"
              </p>
            </div>
          ) : (
            filteredCompetitors.map((comp, index) => {
              const rank = index + 1;
              const isSelf = comp.isCurrentUser;
              const xpDiff = comp.points - progress.points;
              
              return (
                <div 
                  key={comp.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    isSelf 
                      ? "bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/20 shadow-2xs" 
                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {/* Left: Rank, Avatar, Name & Motto */}
                  <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left w-full sm:w-auto min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                      {renderRankBadge(rank)}
                      <span className="sm:hidden text-xs font-semibold text-slate-500">Hạng {rank}</span>
                    </div>

                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden border ${
                      isSelf ? "bg-white border-blue-300" : "bg-slate-50 border-slate-200"
                    }`}>
                      {isSelf ? (
                        <UserAvatar
                          avatarUrl={progress.avatarUrl}
                          displayName={progress.displayName || comp.name}
                          selectedAvatarIdx={activeMascotIdx}
                          level={progress.level}
                          equippedOutfit={progress.equippedOutfit}
                          size={48}
                        />
                      ) : (
                        comp.avatarEmoji
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {comp.name}
                        </span>

                        {isSelf ? (
                          <span className="bg-blue-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md animate-pulse">
                            Người chơi thật (Bạn)
                          </span>
                        ) : comp.botRole === "BOSS" ? (
                          <span className="bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-2xs">
                            [BOSS AI]
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-sky-200 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            [BOT AI]
                          </span>
                        )}

                        <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-slate-500" />
                          <span>{comp.classroom}</span>
                        </span>

                        <span className="text-xs bg-amber-50 text-amber-800 font-medium px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                          <span>{comp.achievementBadge}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 leading-normal line-clamp-1">
                        "{comp.motto}"
                      </p>

                      {!isSelf && activeTab === "grade" && (
                        <div className="text-xs font-semibold">
                          {xpDiff > 0 ? (
                            <span className="text-amber-700">Hơn em +{xpDiff} XP</span>
                          ) : xpDiff < 0 ? (
                            <span className="text-emerald-700">Kém em {Math.abs(xpDiff)} XP</span>
                          ) : (
                            <span className="text-blue-700">Bằng điểm với em</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Stats & Trend */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-center sm:text-right hidden md:block">
                      <p className="text-[11px] text-slate-500">Đề đã làm</p>
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-slate-700 mt-0.5">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" /> {comp.testsTaken}
                      </span>
                    </div>

                    <div className="text-center sm:text-right">
                      <p className="text-[11px] text-slate-500">Chuỗi</p>
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-800 mt-0.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> {comp.streak} ngày
                      </span>
                    </div>

                    <div className="text-center sm:text-right min-w-[68px]">
                      <p className="text-[11px] text-slate-500">Điểm XP</p>
                      <span className="text-sm font-mono font-bold text-blue-700 tabular-nums mt-0.5 block">{comp.points} XP</span>
                    </div>

                    <div className="flex flex-col items-center gap-0.5">
                      <p className="text-[11px] text-slate-500">Xu thế</p>
                      <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center">
                        {renderTrendIcon(comp.trend)}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 7. Bottom CTA Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between border border-slate-200/90 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-slate-900 text-base">
              {activeTab === "grade" 
                ? `Cải thiện thứ hạng ${selectedGradeView} của em`
                : "Cải thiện thứ hạng toàn trường"}
            </h4>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Hoàn thành các bài luyện trắc nghiệm và ôn tập Flashcard mỗi ngày để nhận thêm điểm XP.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToQuiz}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm rounded-xl shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
        >
          Làm bài trắc nghiệm ngay
        </button>
      </div>

    </div>
  );
}
