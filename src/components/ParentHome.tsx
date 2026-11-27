// What a parent account sees: only the child-monitoring tools (linked children, reports, alerts,
// remote limits). None of the learning features (lessons, quizzes, games, shop…) are shown.
import React, { useState } from "react";
import { LogOut, Repeat, ShieldCheck } from "lucide-react";
import ParentDashboard from "./ParentDashboard";
import { OPEN_ROLE_CHOOSER } from "./AccountCenter";

type User = { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null };

export default function ParentHome({ user, onLogout }: { user: User; onLogout: () => Promise<void> | void }) {
  const [leaving, setLeaving] = useState(false);
  return (
    <div className="min-h-[100dvh] w-full bg-[#eff7f5] text-slate-800 font-sans antialiased overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-sky-200/80">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-black text-sky-950 leading-tight">SmartStudy</p>
            <p className="text-xs font-semibold text-amber-600">Tài khoản phụ huynh</p>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_ROLE_CHOOSER))}
            className="min-h-[44px] px-3 rounded-xl text-sm font-semibold text-sky-800 hover:bg-sky-50 inline-flex items-center gap-1.5"
          >
            <Repeat className="w-4 h-4" /> <span className="hidden sm:inline">Đổi vai trò</span>
          </button>
          <button
            type="button"
            disabled={leaving}
            onClick={async () => {
              setLeaving(true);
              try {
                await onLogout();
              } finally {
                setLeaving(false);
              }
            }}
            className="min-h-[44px] px-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Đăng xuất</span>
          </button>
          {user.photoURL ? (
            <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full shrink-0" />
          ) : null}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-5 sm:py-8">
        <ParentDashboard user={user} />
      </main>
    </div>
  );
}
