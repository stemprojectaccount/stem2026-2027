import React, { useState, useEffect } from "react";
import { Target, CheckCircle2, ChevronDown, Sparkles, Award } from "lucide-react";

interface WeeklyGoalProgressRingProps {
  completedCount: number;
  weeklyGoal: number;
  onUpdateGoal?: (newGoal: number) => void;
  className?: string;
  size?: number;
}

export default function WeeklyGoalProgressRing({
  completedCount,
  weeklyGoal,
  onUpdateGoal,
  className = "",
  size = 78
}: WeeklyGoalProgressRingProps) {
  const [animatedPct, setAnimatedPct] = useState<number>(0);
  const [showGoalPicker, setShowGoalPicker] = useState<boolean>(false);

  const goalOptions = [3, 5, 7, 10];
  const targetPct = weeklyGoal > 0 
    ? Math.min(100, Math.round((completedCount / weeklyGoal) * 100))
    : 0;

  // Smooth animation effect on mount or value changes
  useEffect(() => {
    // Reset slightly first to trigger transition if updating
    const timer = setTimeout(() => {
      setAnimatedPct(targetPct);
    }, 60);
    return () => clearTimeout(timer);
  }, [targetPct]);

  const radius = 36;
  const circumference = 2 * Math.PI * radius; // ~226.19
  const strokeDashoffset = circumference - (animatedPct / 100) * circumference;
  const isCompleted = completedCount >= weeklyGoal;

  return (
    <div className={`relative bg-sky-100/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-sky-300/80 shadow-2xs flex items-center gap-3.5 transition-all hover:bg-sky-150/90 ${className}`}>
      {/* Circular SVG Progress Ring */}
      <div 
        className="relative shrink-0 flex items-center justify-center cursor-pointer group"
        style={{ width: size, height: size }}
        onClick={() => setShowGoalPicker(!showGoalPicker)}
        title="Nhấn để tùy chỉnh mục tiêu học tuần"
      >
        <svg 
          className="w-full h-full -rotate-90 transform" 
          viewBox="0 0 96 96"
        >
          <defs>
            <linearGradient id="goalProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#3487c8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="goalCompletedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0e7f62" />
              <stop offset="50%" stopColor="#179574" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background circle track */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-sky-200/80"
            strokeWidth="7"
            fill="transparent"
          />

          {/* Animated SVG Progress Ring */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={isCompleted ? "url(#goalCompletedGradient)" : "url(#goalProgressGradient)"}
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="transparent"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: "stroke-dashoffset 1.3s cubic-bezier(0.34, 1.25, 0.64, 1)"
            }}
            filter={isCompleted ? "url(#ringGlow)" : undefined}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
          <div className="flex items-baseline justify-center">
            <span className="font-display font-black text-sm text-sky-950 leading-tight">
              {completedCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">
              /{weeklyGoal}
            </span>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-tight ${
            isCompleted ? "text-emerald-700" : "text-sky-700"
          }`}>
            {animatedPct}%
          </span>
        </div>
      </div>

      {/* Text Info & Status */}
      <div className="flex flex-col justify-center min-w-[120px]">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="text-[11px] font-black text-sky-950 uppercase tracking-wider">
            Mục Tiêu Tuần
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-1">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Đạt mục tiêu!
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-700">
              Còn <span className="font-black text-sky-700">{weeklyGoal - completedCount}</span> bài nữa
            </span>
          )}
        </div>

        {/* Goal Selector Trigger */}
        <div className="relative mt-1">
          <button
            onClick={() => setShowGoalPicker(!showGoalPicker)}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 hover:text-sky-950 bg-sky-200/60 hover:bg-sky-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
          >
            <span>Đổi mục tiêu: {weeklyGoal} bài</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showGoalPicker ? "rotate-180" : ""}`} />
          </button>

          {/* Goal Picker Dropdown */}
          {showGoalPicker && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-white/95 backdrop-blur-md rounded-xl border border-sky-200 shadow-lg p-2 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] font-bold text-slate-500 px-2 py-1 uppercase tracking-wider">
                Mục tiêu bài học/tuần:
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {goalOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      if (onUpdateGoal) onUpdateGoal(opt);
                      setShowGoalPicker(false);
                    }}
                    className={`px-2 py-1 text-xs font-bold rounded-lg text-center transition-colors cursor-pointer ${
                      weeklyGoal === opt
                        ? "bg-sky-600 text-white"
                        : "bg-sky-50 text-sky-900 hover:bg-sky-100"
                    }`}
                  >
                    {opt} bài
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
