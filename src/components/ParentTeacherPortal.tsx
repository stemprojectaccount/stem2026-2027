import React from "react";
import { ShieldCheck } from "lucide-react";
import { UserProgress, Lesson, QuizAttempt } from "../types";

// The teacher corner (fake class roster, assignment codes) was removed in 1.6.34; only the parent view remains.
interface ParentTeacherPortalProps {
  progress: UserProgress;
  lessons: Lesson[];
  quizHistory: QuizAttempt[];
  onUpdateProgress?: (fields: Partial<UserProgress>) => void;
  onNavigateToTab?: (tab: string) => void;
  onStartQuizWithTopic?: (topic: string) => void;
  user?: { uid: string; displayName?: string | null; email?: string | null } | null;
  onLogin?: () => void;
}

const ParentDashboard = React.lazy(() => import("./ParentDashboard"));

export default function ParentTeacherPortal({ user, onLogin }: ParentTeacherPortalProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      <div className="bg-white rounded-3xl p-6 border border-[#c9dcf4] shadow-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-[#eef4fc] text-[#2e5cb8]">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <h1 className="font-display font-black text-xl sm:text-2xl text-[#243c6e]">Theo dõi và đồng hành học tập</h1>
        </div>
        <p className="text-xs text-slate-600">Dành cho phụ huynh theo dõi tiến độ học tập của con</p>
      </div>

      <React.Suspense fallback={<p role="status" className="text-sm text-slate-600">Đang tải…</p>}>
        <ParentDashboard user={user || null} onLogin={onLogin} />
      </React.Suspense>
    </div>
  );
}
