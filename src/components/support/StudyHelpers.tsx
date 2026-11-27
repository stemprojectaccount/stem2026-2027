// Two helpers from the support profile that live above every screen:
// - ReadingRuler ("Thước đọc"): a clear band follows the finger, mouse or keyboard focus and the lines above
//   and below are dimmed, so a student who loses their place while reading keeps one line in view.
// - BreakReminder ("Nhắc nghỉ giải lao"): after 20 minutes of active study, a small note (not a pop-up that
//   blocks the screen) suggests a 2–3 minute break, as ADHD classroom guides recommend short breaks.
import { useEffect, useRef, useState } from "react";
import { Coffee } from "lucide-react";
import { useSupportProfile } from "../../lib/support/profile";
import { speakVi } from "../../features/tools/conversation/speakVi";

const BAND_REM = 3.4; // about two lines of body text

export function ReadingRuler() {
  const { readingRuler } = useSupportProfile();
  const [y, setY] = useState<number | null>(null);

  useEffect(() => {
    if (!readingRuler) return;
    const move = (e: PointerEvent) => setY(e.clientY);
    const focus = (e: FocusEvent) => {
      const r = (e.target as HTMLElement)?.getBoundingClientRect?.();
      if (r && r.height) setY(r.top + r.height / 2);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    window.addEventListener("focusin", focus);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.removeEventListener("focusin", focus);
    };
  }, [readingRuler]);

  if (!readingRuler) return null;
  const center = y ?? window.innerHeight * 0.4;
  const half = `calc(${BAND_REM / 2}rem)`;
  const shade = "pointer-events-none fixed inset-x-0 z-[250] bg-slate-900/35";
  return (
    <div aria-hidden data-reading-ruler>
      <div className={`${shade} top-0`} style={{ height: `calc(${center}px - ${half})` }} />
      <div className="pointer-events-none fixed inset-x-0 z-[250] border-y-2 border-[#2e5cb8]/70" style={{ top: `calc(${center}px - ${half})`, height: `${BAND_REM}rem` }} />
      <div className={`${shade} bottom-0`} style={{ top: `calc(${center}px + ${half})` }} />
    </div>
  );
}

const STUDY_MS = 20 * 60_000;
const IDLE_MS = 3 * 60_000; // no tap / key for this long = not studying, the clock stops
const LATER_MS = 5 * 60_000;
const MESSAGE = "Em đã học 20 phút rồi. Nghỉ 2 đến 3 phút nhé: nhìn ra xa, uống nước, duỗi tay.";

export function BreakReminder() {
  const { breakReminder, readAloud } = useSupportProfile();
  const [show, setShow] = useState(false);
  const studied = useRef(0);
  const lastActive = useRef(Date.now());

  useEffect(() => {
    if (!breakReminder) {
      setShow(false);
      return;
    }
    studied.current = 0;
    const active = () => (lastActive.current = Date.now());
    window.addEventListener("pointerdown", active, { passive: true });
    window.addEventListener("keydown", active);
    const tick = window.setInterval(() => {
      if (document.hidden || Date.now() - lastActive.current > IDLE_MS) return;
      studied.current += 30_000;
      if (studied.current >= STUDY_MS) setShow(true);
    }, 30_000);
    return () => {
      window.removeEventListener("pointerdown", active);
      window.removeEventListener("keydown", active);
      window.clearInterval(tick);
    };
  }, [breakReminder]);

  useEffect(() => {
    if (show && readAloud) void speakVi(MESSAGE);
  }, [show, readAloud]);

  if (!breakReminder || !show) return null;
  const close = (studiedSoFar: number) => {
    studied.current = studiedSoFar;
    setShow(false);
  };
  return (
    <div role="status" className="fixed inset-x-3 bottom-20 z-[260] mx-auto max-w-md rounded-3xl border-2 border-[#13808a] bg-white p-4 shadow-2xl sm:bottom-6">
      <div className="flex items-start gap-3">
        <Coffee className="mt-0.5 h-7 w-7 shrink-0 text-[#13808a]" aria-hidden />
        <p className="text-base font-bold leading-snug text-[#243c6e]">{MESSAGE}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => close(0)} className="ss-btn-grad min-h-12 rounded-2xl text-sm font-black text-white">
          Nghỉ xong rồi
        </button>
        <button type="button" onClick={() => close(STUDY_MS - LATER_MS)} className="min-h-12 rounded-2xl border-2 border-[#c9dcf4] bg-white text-sm font-bold text-slate-800">
          Nhắc lại sau 5 phút
        </button>
      </div>
    </div>
  );
}
