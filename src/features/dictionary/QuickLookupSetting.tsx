import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { quickLookupEnabled, setQuickLookupEnabled } from "./quickLookupPrefs";

/** Settings row: "Tra nhanh khi bôi đen từ tiếng Anh" (default on). */
export default function QuickLookupSetting() {
  const [on, setOn] = useState(quickLookupEnabled);
  const toggle = () => {
    setQuickLookupEnabled(!on);
    setOn(!on);
  };
  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[#2e5cb8]" />
        <span>Tra từ</span>
      </h3>
      <div className={`p-4 rounded-2xl border ${on ? "bg-[#eef4fc] border-[#93b8e8]" : "bg-slate-50 border-slate-200"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <span id="ql-setting-label" className="text-sm font-black text-slate-900">Tra nhanh khi bôi đen từ tiếng Anh</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nhấp đúp vào một từ tiếng Anh (hoặc bôi đen tối đa 3 từ) trong bài học, flashcard hay câu trả lời của AI để xem phiên âm, nghĩa, nghe đọc và lưu vào Sổ từ.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby="ql-setting-label"
            onClick={toggle}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${on ? "bg-[#2e5cb8]" : "bg-slate-300"}`}
          >
            <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition ${on ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
