import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, PartyPopper, X } from "lucide-react";
import { FEEDBACK_EVENT, type FeedbackKind } from "../../lib/support/feedback";
import { prefersLessMotion } from "../../lib/support/profile";
import { WhaleMascot } from "../CustomMascots";

const LOOK: Record<FeedbackKind, { label: string; frame: string; pill: string; Icon: React.ComponentType<{ className?: string }> }> = {
  correct: { label: "Đúng rồi!", frame: "border-emerald-500", pill: "bg-emerald-600", Icon: Check },
  wrong: { label: "Chưa đúng", frame: "border-rose-500", pill: "bg-rose-600", Icon: X },
  done: { label: "Hoàn thành!", frame: "border-amber-400", pill: "bg-amber-500", Icon: PartyPopper },
};

/** Full-screen coloured frame + big ✓ / ✗ for about a second (see lib/support/feedback). */
export default function FeedbackFlash() {
  const [kind, setKind] = useState<FeedbackKind | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const on = (e: Event) => {
      const k = (e as CustomEvent<FeedbackKind>).detail;
      setKind(k);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setKind(null), k === "done" ? 1600 : 1100);
    };
    window.addEventListener(FEEDBACK_EVENT, on);
    return () => {
      window.removeEventListener(FEEDBACK_EVENT, on);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  // A full-screen game hides everything outside its element, so the flash moves inside it
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    const on = () => setHost(document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const look = kind ? LOOK[kind] : null;
  const still = prefersLessMotion();

  const flash = (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-[400]">
      {look && (
        <>
          <div className={`absolute inset-0 border-[10px] ${look.frame} ${still ? "" : "animate-pulse"}`} />
          <div className="absolute inset-x-0 top-[max(16px,env(safe-area-inset-top))] flex justify-center px-4">
            <div className={`flex items-center gap-3 rounded-full py-2 pl-2 pr-6 text-white shadow-2xl ${look.pill}`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95">
                <WhaleMascot mood={kind === "wrong" ? "thinking" : "great"} size={50} />
              </span>
              <look.Icon className="h-8 w-8" />
              <span className="text-2xl font-black">{look.label}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
  return host ? createPortal(flash, host) : flash;
}
