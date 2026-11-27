// Time limit for SmartStudy itself.
//  - Off (default): a gentle, dismissible reminder every 30 minutes and once after 2 hours a day.
//  - Switched on by the parent ("Giới hạn dùng SmartStudy"): after each sitting (default 30 min) the app
//    shows a rest screen for a few minutes; after the daily limit (default 2 h) the app is closed for
//    the day. Only the parent PIN can give extra time. The study gate (Windows forced study) always wins.
import React, { useEffect, useRef, useState } from "react";
import { Coffee, Moon, X } from "lucide-react";
import {
  CHANGE_EVENT,
  addLocalAlert,
  grantExtraMinutes,
  isStudyGateActive,
  loadControls,
  readBreakUntil,
  readExtraMinutesToday,
  readTodayUsageSeconds,
  todayStr,
  verifyParentPin,
  writeBreakUntil,
  writeTodayUsageSeconds,
} from "../lib/parentControls";

const IDLE_RESET_MS = 5 * 60_000; // a 5-minute pause starts a new sitting
const TICK_MS = 5000;

type Block = { kind: "break"; until: number } | { kind: "daily"; minutes: number } | null;

function PinExtra({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-6 min-h-[44px] px-4 text-sm font-semibold text-indigo-100 underline underline-offset-4">
        Phụ huynh cho thêm thời gian
      </button>
    );
  return (
    <form
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await verifyParentPin(pin)) {
          grantExtraMinutes(30);
          writeBreakUntil(0);
          onDone();
        } else setErr("Mã PIN không đúng.");
      }}
    >
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        aria-label="Mã PIN phụ huynh"
        placeholder="PIN phụ huynh"
        value={pin}
        onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 8)); setErr(""); }}
        className="w-40 min-h-[44px] px-3 rounded-lg text-slate-900 text-base"
      />
      <button type="submit" className="min-h-[44px] px-4 rounded-lg bg-white text-indigo-800 font-semibold">+30 phút</button>
      {err && <p role="alert" className="w-full text-sm text-rose-200">{err}</p>}
    </form>
  );
}

export default function AppUsageReminder() {
  const [message, setMessage] = useState<string | null>(null);
  const [block, setBlock] = useState<Block>(null);
  const [, force] = useState(0);
  const sessionSec = useRef(0);
  const lastTick = useRef(Date.now());
  const lastActive = useRef(Date.now());
  const dailyNoticeShown = useRef(false);
  const dailyAlertDay = useRef("");

  useEffect(() => {
    const onActive = () => { lastActive.current = Date.now(); };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActive, { passive: true }));

    const evaluate = () => {
      const { appLimit } = loadControls();
      if (!appLimit.enabled || isStudyGateActive()) {
        setBlock(null);
        return;
      }
      const usedMin = readTodayUsageSeconds() / 60;
      const allowed = appLimit.dailyMinutes + readExtraMinutesToday();
      if (usedMin >= allowed) {
        if (dailyAlertDay.current !== todayStr()) {
          dailyAlertDay.current = todayStr();
          addLocalAlert("app-limit", `Con đã dùng SmartStudy đủ ${Math.round(usedMin)} phút hôm nay (giới hạn ${appLimit.dailyMinutes} phút).`);
        }
        setBlock({ kind: "daily", minutes: Math.round(usedMin) });
        return;
      }
      const until = readBreakUntil();
      if (until > Date.now()) {
        setBlock({ kind: "break", until });
        return;
      }
      setBlock(null);
    };

    const timer = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTick.current;
      lastTick.current = now;
      const { appLimit } = loadControls();
      evaluate();
      if (isStudyGateActive()) return;
      // a running rest / end-of-day screen is not app use
      if (appLimit.enabled && (readBreakUntil() > now || readTodayUsageSeconds() / 60 >= appLimit.dailyMinutes + readExtraMinutesToday())) {
        sessionSec.current = 0;
        return;
      }
      // only count while the window is visible and the student interacted in the last 5 minutes
      if (document.visibilityState !== "visible" || now - lastActive.current > IDLE_RESET_MS) {
        sessionSec.current = 0; // a pause resets the sitting
        return;
      }
      sessionSec.current += Math.min(dt, TICK_MS * 3) / 1000;
      const daily = readTodayUsageSeconds() + Math.min(dt, TICK_MS * 3) / 1000;
      writeTodayUsageSeconds(daily);

      const sessionLimit = appLimit.enabled ? appLimit.sessionMinutes : 30;
      if (sessionSec.current >= sessionLimit * 60) {
        sessionSec.current = 0;
        if (appLimit.enabled) {
          writeBreakUntil(now + appLimit.breakMinutes * 60_000);
          evaluate();
        } else {
          setMessage(`Bạn đã học liên tục ${sessionLimit} phút. Nghỉ mắt 1–2 phút rồi học tiếp nhé!`);
        }
      } else if (!appLimit.enabled && !dailyNoticeShown.current && daily >= 120 * 60) {
        dailyNoticeShown.current = true;
        setMessage("Hôm nay bạn đã dùng SmartStudy 2 giờ. Học vừa đủ, nhớ nghỉ ngơi và vận động nhé!");
      }
    }, TICK_MS);

    const onChange = () => evaluate();
    window.addEventListener(CHANGE_EVENT, onChange);
    evaluate();
    // the rest screen counts down every second
    const clock = window.setInterval(() => {
      force((n) => n + 1);
      const until = readBreakUntil();
      if (until && until <= Date.now()) {
        writeBreakUntil(0); // rest finished
        evaluate();
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(clock);
      window.removeEventListener(CHANGE_EVENT, onChange);
      events.forEach((e) => window.removeEventListener(e, onActive));
    };
  }, []);

  if (block) {
    const left = block.kind === "break" ? Math.max(0, block.until - Date.now()) : 0;
    const mm = Math.floor(left / 60_000);
    const ss = Math.floor((left % 60_000) / 1000);
    return (
      <div role="alertdialog" aria-modal="true" aria-label={block.kind === "break" ? "Giờ nghỉ giải lao" : "Hết giờ dùng SmartStudy hôm nay"} className="fixed inset-0 z-[290] bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          {block.kind === "break" ? (
            <>
              <Coffee className="w-16 h-16 mx-auto text-amber-300" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-bold">Giờ nghỉ giải lao</h2>
              <p className="mt-3 text-indigo-100">Bạn đã học {loadControls().appLimit.sessionMinutes} phút rồi. Đứng dậy vận động, uống nước, nhìn ra xa cho mắt nghỉ nhé!</p>
              <p className="mt-6 text-5xl font-bold tabular-nums" aria-live="polite">{mm}:{String(ss).padStart(2, "0")}</p>
            </>
          ) : (
            <>
              <Moon className="w-16 h-16 mx-auto text-amber-300" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-bold">Hôm nay học đủ rồi!</h2>
              <p className="mt-3 text-indigo-100">Bạn đã dùng SmartStudy {block.minutes} phút hôm nay. Phụ huynh đặt giới hạn {loadControls().appLimit.dailyMinutes} phút/ngày để bạn có thời gian nghỉ ngơi, vui chơi. Hẹn gặp lại ngày mai!</p>
            </>
          )}
          <PinExtra onDone={() => setBlock(null)} />
        </div>
      </div>
    );
  }

  if (!message) return null;
  return (
    <div role="status" aria-live="polite" className="fixed left-1/2 -translate-x-1/2 bottom-[max(16px,env(safe-area-inset-bottom))] z-[250] w-[min(92vw,460px)]">
      <div className="flex items-start gap-3 rounded-2xl bg-indigo-600 text-white shadow-xl px-4 py-3">
        <Coffee className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button type="button" onClick={() => setMessage(null)} aria-label="Đóng nhắc nhở" className="shrink-0 w-8 h-8 -mr-1 -mt-0.5 rounded-lg hover:bg-white/15 inline-flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
