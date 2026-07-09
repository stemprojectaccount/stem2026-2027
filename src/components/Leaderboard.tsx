import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Sparkles, 
  Crown, 
  Search, 
  Flame, 
  Zap, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  MessageSquare,
  Award,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Check,
  User,
  HelpCircle,
  Play
} from "lucide-react";
import { UserProgress } from "../types";
import { getAvatarAtLevel } from "../lib/avatarEvolution";

interface LeaderboardProps {
  progress: UserProgress;
  selectedAvatarIdx: number;
  onNavigateToQuiz: () => void;
}

interface Competitor {
  id: string;
  name: string;
  points: number;
  level: number;
  streak: number;
  avatarEmoji: string;
  avatarLabel: string;
  motto: string;
  trend: "up" | "down" | "stable";
  isCurrentUser?: boolean;
}

const INITIAL_COMPETITORS: Competitor[] = [
  {
    id: "comp-1",
    name: "Nguyễn Minh Đức",
    points: 480,
    level: 5,
    streak: 12,
    avatarEmoji: "🐺",
    avatarLabel: "Sói Bạc Kiên Cường",
    motto: "Kỷ luật tạo nên sức mạnh học tập! 💪",
    trend: "stable"
  },
  {
    id: "comp-2",
    name: "Trần Mai Anh",
    points: 390,
    level: 4,
    streak: 8,
    avatarEmoji: "🐈‍💻",
    avatarLabel: "Mèo Bách Khoa",
    motto: "Học không chơi đánh rơi tuổi trẻ, chơi không học bán rẻ tương lai 🌟",
    trend: "up"
  },
  {
    id: "comp-3",
    name: "Lê Hoàng Nam",
    points: 260,
    level: 3,
    streak: 5,
    avatarEmoji: "🦖",
    avatarLabel: "Khủng Long Nhí",
    motto: "Chinh phục mọi bài kiểm tra khó nhất! 🦖",
    trend: "down"
  },
  {
    id: "comp-4",
    name: "Phạm Quỳnh Chi",
    points: 180,
    level: 2,
    streak: 7,
    avatarEmoji: "🐼",
    avatarLabel: "Gấu Trúc Cần Mẫn",
    motto: "Mỗi ngày tiến bộ 1% là đủ rồi 🍃",
    trend: "up"
  },
  {
    id: "comp-5",
    name: "Vũ Tiến Đạt",
    points: 80,
    level: 1,
    streak: 3,
    avatarEmoji: "🥚",
    avatarLabel: "Trứng Tiền Sử",
    motto: "Bắt đầu từ số không để bay thật cao 🚀",
    trend: "stable"
  }
];

export default function Leaderboard({ progress, selectedAvatarIdx, onNavigateToQuiz }: LeaderboardProps) {
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
  const [showTips, setShowTips] = useState<boolean>(true);

  const saveNickname = () => {
    if (!tempName.trim()) return;
    setNickname(tempName.trim());
    localStorage.setItem("smart_study_nickname_v2", tempName.trim());
    setIsEditingName(false);
  };

  // Construct current user as competitor
  const userEvolution = getAvatarAtLevel(selectedAvatarIdx, progress.level);
  const currentUserCompetitor: Competitor = {
    id: "comp-user",
    name: nickname + " (Em)",
    points: progress.points,
    level: progress.level,
    streak: progress.streak,
    avatarEmoji: userEvolution.emoji,
    avatarLabel: userEvolution.title,
    motto: "Hành trình vạn dặm bắt đầu từ một bài học! 📚🚀",
    trend: "up",
    isCurrentUser: true
  };

  // Merge & Sort all competitors by points descending
  const allCompetitors = [...INITIAL_COMPETITORS];
  const userIndex = allCompetitors.findIndex(c => c.id === "comp-user");
  if (userIndex > -1) {
    allCompetitors[userIndex] = currentUserCompetitor;
  } else {
    allCompetitors.push(currentUserCompetitor);
  }

  // Sort descending by points
  const sortedCompetitors = allCompetitors.sort((a, b) => b.points - a.points);

  // Find user's rank (1-indexed)
  const userRank = sortedCompetitors.findIndex(c => c.isCurrentUser) + 1;

  // Render Medal based on rank
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-md border border-white text-white font-extrabold text-sm relative">
          <Crown className="w-4 h-4 text-white fill-yellow-200 absolute -top-2.5 animate-bounce" />
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-400 flex items-center justify-center shadow-md border border-white text-white font-extrabold text-sm">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center shadow-md border border-white text-white font-extrabold text-sm">
          3
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-extrabold text-xs">
        {rank}
      </div>
    );
  };

  const renderTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <ArrowUp className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />;
    if (trend === "down") return <ArrowDown className="w-3.5 h-3.5 text-rose-500 stroke-[3]" />;
    return <Minus className="w-3.5 h-3.5 text-slate-300 stroke-[3]" />;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      
      {/* 1. Header Hero Card */}
      <div className="bg-gradient-to-tr from-indigo-900 via-indigo-850 to-violet-900 rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-violet-600 rounded-full blur-3xl opacity-35" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
              Đấu Trường Học Tập
            </span>
            <h2 className="font-display font-black text-3xl md:text-4xl tracking-tight leading-tight flex items-center justify-center md:justify-start gap-2">
              <span>BẢNG XẾP HẠNG</span>
              <Trophy className="w-8 h-8 text-amber-400 fill-amber-300 animate-pulse" />
            </h2>
            <p className="text-xs text-indigo-200/90 max-w-md leading-relaxed">
              Thi đua tự học cùng bạn bè bốn phương! Hãy tích cực làm bài tập, đố vui để nâng cao cấp độ, đưa linh thú của em lên đỉnh vinh quang.
            </p>
          </div>

          {/* User's Position Stats Widget */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex items-center gap-4 min-w-[240px] shadow-xl">
            <div className="w-12 h-12 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg relative">
              <Trophy className="w-6 h-6 fill-amber-200 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Hạng của em</p>
              <p className="text-2xl font-black text-white leading-tight">Hạng #{userRank}</p>
              <p className="text-[10px] text-indigo-100 font-bold mt-0.5">Top {Math.round((userRank / sortedCompetitors.length) * 100)}% thành viên tích cực</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nickname Editor */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">
            ✍️
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800">Biệt danh hiển thị của em</h3>
            <p className="text-[11px] text-slate-400 font-medium">Biệt danh này sẽ đại diện cho em trên bảng vàng thi đua!</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value.slice(0, 20))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full md:w-48"
                placeholder="Nhập tên của em..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveNickname();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
              />
              <button
                onClick={saveNickname}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
                {nickname}
              </span>
              <button
                onClick={() => {
                  setTempName(nickname);
                  setIsEditingName(true);
                }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all cursor-pointer"
                title="Đổi biệt danh"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-50">
          <div>
            <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Bảng Vàng Danh Dự</span>
            </h3>
            <p className="text-xs text-slate-400">Cập nhật theo thời gian thực dựa trên tiến độ học tập thực tế</p>
          </div>
          
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Xếp Hạng</span>
            <span className="w-24 text-center">Tiến độ</span>
          </div>
        </div>

        {/* Competitor Cards stack */}
        <div className="space-y-3">
          {sortedCompetitors.map((comp, index) => {
            const rank = index + 1;
            const isSelf = comp.isCurrentUser;
            
            return (
              <div 
                key={comp.id}
                className={`p-4 rounded-[1.75rem] border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isSelf 
                    ? "bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/10 shadow-md shadow-indigo-100/30" 
                    : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                }`}
              >
                {/* Left: Rank, Avatar, Name & Motto */}
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full sm:w-auto">
                  {/* Rank Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {renderRankBadge(rank)}
                    <span className="sm:hidden text-xs font-bold text-slate-400">Hạng</span>
                  </div>

                  {/* Avatar Circle */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0 ${
                    isSelf ? "bg-indigo-100 text-indigo-800" : "bg-slate-50 border border-slate-100"
                  }`}>
                    {comp.avatarEmoji}
                  </div>

                  {/* Competitor details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className={`text-sm font-black tracking-tight ${isSelf ? "text-indigo-900" : "text-slate-850"}`}>
                        {comp.name}
                      </span>
                      {isSelf && (
                        <span className="bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                          Bạn
                        </span>
                      )}
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                        {comp.avatarLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal italic">
                      "{comp.motto}"
                    </p>
                  </div>
                </div>

                {/* Right: Stats, Trend & Action buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                  {/* Streak and Level */}
                  <div className="flex items-center gap-4 text-left sm:text-right">
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100/30">
                        <Flame className="w-3.5 h-3.5 fill-orange-100" /> {comp.streak} ngày
                      </span>
                    </div>

                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cấp độ</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/30">
                        Lv {comp.level}
                      </span>
                    </div>

                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kinh nghiệm</p>
                      <span className="text-xs font-black text-slate-850">{comp.points} XP</span>
                    </div>
                  </div>

                  {/* Trend indicator */}
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Xu thế</p>
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center">
                      {renderTrendIcon(comp.trend)}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Competition encouragement panel */}
      {showTips && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row items-center gap-5 justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-2xl opacity-60" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              ⚡
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-black text-slate-800 text-sm">Vượt Lên Bạn Bè Bằng Cách Làm Đố Vui</h4>
              <p className="text-xs text-indigo-700/90 leading-relaxed font-medium">
                Mỗi bài kiểm tra trắc nghiệm hoàn thành xuất sắc sẽ đem về cho em hàng chục XP. Hãy đánh bại các cột mốc tri thức để thăng cấp liên tục!
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToQuiz}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-indigo-200 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer whitespace-nowrap"
          >
            Vào Làm Kiểm Tra Ngay 🚀
          </button>
        </div>
      )}

    </div>
  );
}
