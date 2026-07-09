import React from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Trophy, 
  Sparkles,
  Flame,
  Zap,
  Coins,
  Award,
  User,
  Layers
} from "lucide-react";
import { UserProgress } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  progress: UserProgress;
}

export default function Sidebar({ activeTab, setActiveTab, progress }: SidebarProps) {
  const menuItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      mobileLabel: "Home",
      icon: LayoutDashboard, 
      color: "text-indigo-500", 
      bg: "hover:bg-indigo-50/50 hover:text-indigo-600" 
    },
    { 
      id: "learn", 
      label: "Học Bài Mới", 
      mobileLabel: "Học bài",
      icon: Sparkles, 
      color: "text-violet-500", 
      bg: "hover:bg-violet-50/50 hover:text-violet-600" 
    },
    { 
      id: "review", 
      label: "Ôn Tập Bài Cũ", 
      mobileLabel: "Ôn tập",
      icon: BookOpen, 
      color: "text-emerald-500", 
      bg: "hover:bg-emerald-50/50 hover:text-emerald-600" 
    },
    { 
      id: "flashcards", 
      label: "Thẻ Flashcard 🗂️", 
      mobileLabel: "Flashcard",
      icon: Layers, 
      color: "text-pink-500", 
      bg: "hover:bg-pink-50/50 hover:text-pink-600" 
    },

    { 
      id: "quiz", 
      label: "Làm Kiểm Tra", 
      mobileLabel: "Đố vui",
      icon: GraduationCap, 
      color: "text-amber-500", 
      bg: "hover:bg-amber-50/50 hover:text-amber-600" 
    },
    { 
      id: "pk", 
      label: "Đấu PK Trí Tuệ ⚔️", 
      mobileLabel: "Đấu PK",
      icon: Zap, 
      color: "text-red-500", 
      bg: "hover:bg-red-50/50 hover:text-red-600" 
    },
    { 
      id: "shop", 
      label: "Cửa Hàng", 
      mobileLabel: "Cửa hàng",
      icon: Coins, 
      color: "text-amber-600", 
      bg: "hover:bg-amber-50/50 hover:text-amber-700" 
    },
    { 
      id: "leaderboard", 
      label: "Bảng Xếp Hạng", 
      mobileLabel: "Bảng xếp hạng",
      icon: Trophy, 
      color: "text-yellow-500", 
      bg: "hover:bg-yellow-50/50 hover:text-yellow-600" 
    },
    { 
      id: "profile", 
      label: "Thành Tích", 
      mobileLabel: "Cá nhân",
      icon: User, 
      color: "text-pink-500", 
      bg: "hover:bg-pink-50/50 hover:text-pink-600" 
    },
  ];

  return (
    <>
      {/* 1. Desktop Sidebar (Hidden on mobile) */}
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0 shrink-0">
        {/* Brand logo */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-100 animate-pulse-slow">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-display font-black text-lg text-slate-800">
                SmartStudy <span className="text-indigo-600">AI</span>
              </span>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">EDUFLOW POWERED</p>
            </div>
          </div>
        </div>

        {/* Quick Streak Stats (EduFlow-style) */}
        <div className="p-4 mx-4 my-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-100/80 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-600 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800">Chuỗi liên tục</p>
              <p className="text-[10px] text-amber-600 font-medium">Học tập mỗi ngày</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-display font-extrabold text-2xl text-amber-600">{progress.streak}</span>
            <span className="text-xs font-bold text-amber-500"> ngày</span>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.01]"
                    : `text-slate-600 ${item.bg}`
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : item.color}`} />
                <span>{item.label}</span>
                {item.id === "learn" && (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600 animate-pulse"
                  }`}>
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User simple level display */}
        <div className="p-4 m-4 bg-slate-50 rounded-[1.25rem] border border-slate-100 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Cấp độ {progress.level}</span>
            <span className="text-xs font-black text-indigo-600">{progress.points} XP</span>
          </div>
          <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (progress.points % 100))}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 text-center font-bold">Còn {100 - (progress.points % 100)} XP để thăng cấp!</p>
          
          <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1">🪙 Số dư Xu:</span>
            <span className="font-black text-amber-600">{progress.coins || 0} Xu</span>
          </div>
        </div>
      </div>

      {/* 2. Mobile Bottom Navigation Bar (Fixed bottom on screens smaller than md) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex md:hidden items-center justify-around px-2 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pb-safe">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1.5 relative"
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? "bg-indigo-50 text-indigo-600 scale-110" : "text-slate-500 hover:text-slate-800"
              }`}>
                <Icon className="w-5 h-5" />
                {item.id === "learn" && !isActive && (
                  <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${
                isActive ? "text-indigo-600 font-extrabold" : "text-slate-400"
              }`}>
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
