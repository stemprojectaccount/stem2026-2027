import React, { useState } from "react";
import { 
  Trophy, 
  Award, 
  Flame, 
  Zap, 
  CheckCircle2, 
  Calendar,
  Lock,
  User,
  Heart,
  Sparkles,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { UserProgress, Lesson } from "../types";
import { AVATAR_EVOLUTIONS, getAvatarAtLevel, getNextStageAtLevel } from "../lib/avatarEvolution";

interface ProfileProps {
  progress: UserProgress;
  lessons: Lesson[];
  onResetProgress: () => void;
  selectedAvatarIdx: number;
  onSelectAvatar: (idx: number) => void;
}

interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  color: string;
}

export default function Profile({ 
  progress, 
  lessons, 
  onResetProgress,
  selectedAvatarIdx,
  onSelectAvatar
}: ProfileProps) {
  const completedCount = lessons.filter(l => l.completed).length;
  const noteWroteCount = lessons.filter(l => l.notes && l.notes.trim().length > 0).length;

  const currentEvolution = getAvatarAtLevel(selectedAvatarIdx, progress.level);
  const nextEvolution = getNextStageAtLevel(selectedAvatarIdx, progress.level);
  const activeAvatarData = AVATAR_EVOLUTIONS[selectedAvatarIdx] || AVATAR_EVOLUTIONS[0];

  const BADGES: Badge[] = [
    {
      id: "badge-1",
      title: "Học Sinh Mới",
      description: "Gia nhập giảng đường SmartStudy",
      emoji: "🎒",
      unlocked: true,
      color: "from-indigo-400 to-indigo-600 text-white"
    },
    {
      id: "badge-2",
      title: "Chúa Tể Ghi Chú",
      description: "Viết ghi chép tự học trong ít nhất 1 bài",
      emoji: "✍️",
      unlocked: noteWroteCount >= 1,
      color: "from-indigo-500 to-violet-600 text-white"
    },
    {
      id: "badge-3",
      title: "Vua Khám Phá",
      description: "Soạn thành công 3 bài học mới tinh từ AI",
      emoji: "🧭",
      unlocked: lessons.length >= 3,
      color: "from-violet-500 to-pink-500 text-white"
    },
    {
      id: "badge-4",
      title: "Bất Bại Đấu Trường",
      description: "Đạt số điểm tuyệt đối 5/5 trong bài kiểm tra",
      emoji: "👑",
      unlocked: progress.points >= 100, // achieved points threshold
      color: "from-amber-400 to-orange-500 text-white"
    },
    {
      id: "badge-5",
      title: "Kiên Trì Bền Bỉ",
      description: "Duy trì chuỗi học tập từ 3 ngày trở lên",
      emoji: "🔥",
      unlocked: progress.streak >= 3,
      color: "from-red-500 to-orange-600 text-white"
    },
    {
      id: "badge-6",
      title: "Nhà Bác Học Trẻ",
      description: "Hoàn thành học xong 2 bài học",
      emoji: "🧠",
      unlocked: completedCount >= 2,
      color: "from-cyan-400 to-indigo-500 text-white"
    }
  ];

  const unlockedCount = BADGES.filter(b => b.unlocked).length;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* 1. Header & Character Card with Evolved State */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-indigo-50/30 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Evolved Avatar */}
        <div className={`w-32 h-32 rounded-[2rem] ${activeAvatarData.color} border-2 flex items-center justify-center text-7xl shadow-inner relative group shrink-0`}>
          <span className="animate-pulse-slow">{currentEvolution.emoji}</span>
          <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white shadow-sm uppercase tracking-wider">
            Cấp {currentEvolution.stageNum}
          </div>
        </div>

        <div className="space-y-3.5 text-center md:text-left flex-1 w-full">
          <div className="space-y-1">
            <h2 className="font-display font-black text-2xl text-slate-800 flex items-center justify-center md:justify-start gap-2">
              <span>Đồng hành cùng: {currentEvolution.title}</span>
              <Sparkles className="w-5 h-5 text-indigo-600 animate-spin-slow shrink-0" />
            </h2>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              "{currentEvolution.description}"
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[11px] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100/50">
              <Zap className="w-3.5 h-3.5 fill-indigo-100" /> {progress.points} XP tích lũy
            </span>
            <span className="flex items-center gap-1 text-orange-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/50">
              <Flame className="w-3.5 h-3.5 fill-amber-100" /> Chuỗi {progress.streak} ngày
            </span>
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Đã xong {completedCount} bài
            </span>
          </div>

          {/* Level progress meter */}
          <div className="space-y-2 max-w-sm mx-auto md:mx-0">
            <div className="flex justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              <span>Kinh nghiệm level {progress.level}</span>
              <span className="text-indigo-600">{progress.points % 100} / 100 XP</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/20">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress.points % 100}%` }}
              />
            </div>
            {nextEvolution ? (
              <p className="text-[10px] font-bold text-slate-400">
                ⭐ Thăng cấp lên <span className="text-indigo-600">Level {nextEvolution.minLevel}</span> để tiến hóa thành <strong>{nextEvolution.emoji} {nextEvolution.title}</strong>!
              </p>
            ) : (
              <p className="text-[10px] font-extrabold text-amber-500 flex items-center gap-1 justify-center md:justify-start">
                👑 Đã đạt trạng thái tiến hóa Thần Thú tối cao!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Evolution Route / Timeline */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Tuyến Đường Tiến Hóa: {activeAvatarData.label}</span>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">Sơ đồ 4 giai đoạn</span>
          </h3>
          <p className="text-xs text-slate-400">Tích lũy kinh nghiệm tự học để chứng kiến sự thay đổi diệu kỳ của người bạn đồng hành!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {activeAvatarData.stages.map((stage) => {
            const isUnlocked = progress.level >= stage.minLevel;
            const isCurrent = currentEvolution.stageNum === stage.stageNum;
            return (
              <div 
                key={stage.stageNum}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col items-center text-center space-y-2 ${
                  isCurrent 
                    ? "border-indigo-500 bg-indigo-50/25 ring-2 ring-indigo-500/10 shadow-lg"
                    : isUnlocked 
                      ? "border-slate-100 bg-white" 
                      : "border-slate-100 bg-slate-50/60 opacity-60"
                }`}
              >
                {/* Evolution status indicator */}
                {isCurrent && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                )}

                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-inner relative ${
                  isUnlocked ? "bg-indigo-50" : "bg-slate-200"
                }`}>
                  {isUnlocked ? (
                    stage.emoji
                  ) : (
                    <div className="relative">
                      <span className="blur-[1px] select-none text-slate-400">{stage.emoji}</span>
                      <Lock className="w-4 h-4 text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 shadow-sm" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className={`text-xs font-extrabold block truncate ${isUnlocked ? "text-slate-850" : "text-slate-400"}`}>
                    {stage.title}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                    isCurrent 
                      ? "bg-indigo-600 text-white" 
                      : isUnlocked 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "bg-slate-200 text-slate-500"
                  }`}>
                    {isUnlocked ? (isCurrent ? "Đang đồng hành" : "Đã mở khóa") : `Yêu cầu Lv ${stage.minLevel}`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-medium">{stage.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Choose Avatar Section */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-display font-bold text-slate-800 text-sm">Chọn Linh Vật Học Tập Của Em</h3>
          <p className="text-xs text-slate-400">Em hãy click chọn linh vật đại diện để cùng học tập và tiến hóa nhé!</p>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {AVATAR_EVOLUTIONS.map((avatar, idx) => {
            // Get the preview emoji of this pet at their current level so they can see what it currently is
            const petAtCurrentLevel = getAvatarAtLevel(idx, progress.level);
            return (
              <button
                key={idx}
                onClick={() => onSelectAvatar(idx)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  selectedAvatarIdx === idx
                    ? "border-indigo-600 bg-indigo-50/20 scale-105 shadow-md shadow-indigo-500/5"
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <span className="text-3xl">{petAtCurrentLevel.emoji}</span>
                <span className="text-[10px] font-bold text-slate-600 tracking-tight text-center truncate w-full">{avatar.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Medal Room / Badge Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="font-display font-bold text-slate-800 text-lg">Phòng Trưng Bày Huy Chương ({unlockedCount} / {BADGES.length})</h3>
          <p className="text-xs text-slate-400">Vượt qua các thử thách tự học để thu thập bộ sưu tập huy chương cực ngầu!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {BADGES.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border flex items-start gap-4 transition-all relative overflow-hidden ${
                badge.unlocked
                  ? "bg-white border-slate-100 hover:shadow-md"
                  : "bg-slate-50/80 border-slate-200/50 grayscale opacity-70"
              }`}
            >
              {/* Badge visual icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                badge.unlocked 
                  ? "bg-gradient-to-tr " + badge.color 
                  : "bg-slate-200 text-slate-400"
              }`}>
                {badge.unlocked ? badge.emoji : <Lock className="w-5 h-5 text-slate-400" />}
              </div>

              <div className="space-y-1 overflow-hidden">
                <span className={`font-display font-bold text-sm block ${
                  badge.unlocked ? "text-slate-800" : "text-slate-400"
                }`}>
                  {badge.title}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  {badge.description}
                </span>
              </div>

              {/* Unlock visual overlay */}
              {badge.unlocked && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Reset options & telemetry details */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <span className="font-bold text-xs text-slate-700 block">Dữ liệu hồ sơ học tập</span>
          <span className="text-[10px] text-slate-400">Toàn bộ thông tin được đồng bộ trực tiếp với trình duyệt của em.</span>
        </div>
        <button
          onClick={() => {
            if (confirm("Em có chắc chắn muốn đặt lại toàn bộ điểm số và bài học đã lưu không? Quá trình này không thể hoàn tác!")) {
              onResetProgress();
            }
          }}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Đặt lại toàn bộ ⚙️
        </button>
      </div>
    </div>
  );
}
