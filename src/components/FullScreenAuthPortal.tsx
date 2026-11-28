import React, { useState } from "react";
import { Accessibility, ArrowLeft, ArrowRight, RefreshCw, AlertCircle, Cloud, WifiOff, ShieldCheck, Globe, Check, Captions, Vibrate, Mic, TimerOff, Ear, Hand, Settings, BookOpen, ListChecks, Languages, Gamepad2 } from "lucide-react";
import { BrandLogo, getMascotComponent, WhaleMascot } from "./CustomMascots";
import { SupportAskDialog } from "./support/SupportFirstRun";
import { isSupportActive, setSupportNeed, setSupportProfile, useSupportProfile, type SupportNeed, type SupportProfile } from "../lib/support/profile";
import { isDesktopApp, isNativeMobileApp } from "../firebase";
import { authErrorMessage, isUserCancelled } from "../lib/authErrorMessage";

interface FullScreenAuthPortalProps {
  onLoginWithGoogle: (options?: { forceRedirect?: boolean }) => Promise<any>;
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
  authLoading: boolean;
  selectedAvatarIdx?: number;
}

const GRADES = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"];

const FEATURES = [
  { icon: Accessibility, title: "Hỗ trợ học tập", tint: "bg-[#ccfbf1] text-[#0e7279]" },
  { icon: Cloud, title: "Lưu tiến độ", tint: "bg-[#dbeafe] text-[#2e5cb8]" },
  { icon: WifiOff, title: "Học khi mất mạng", tint: "bg-[#fef3c7] text-[#b45309]" },
];

type Mode = "standard" | "support";
const MODE_KEY = "smartstudy_learning_mode";

// Support mode asks for one difficulty and turns on only that help (NEED_PATCH in profile.ts).
// Standard mode turns the help back off and the voice assistant back to its default (on).
const SUPPORT_OFF: Partial<SupportProfile> = { visualFeedback: false, vibration: false, timeMode: "normal", voiceAssistant: true };
const NEEDS: { id: SupportNeed; icon: React.ComponentType<{ className?: string }>; label: string; hint: string; keys: (keyof SupportProfile)[] }[] = [
  { id: "hearing", icon: Ear, label: "Khó nghe", hint: "Báo bằng hình, chữ và rung thay cho âm thanh", keys: ["visualFeedback", "vibration"] },
  { id: "motor", icon: Hand, label: "Khó vận động", hint: "Nói thay cho bấm, làm bài không tính giờ", keys: ["voiceAssistant", "timeMode"] },
];

const SUPPORT_SWITCHES: { key: keyof SupportProfile; on: SupportProfile[keyof SupportProfile]; off: SupportProfile[keyof SupportProfile]; icon: React.ComponentType<{ className?: string }>; label: string; hint: string }[] = [
  { key: "visualFeedback", on: true, off: false, icon: Captions, label: "Báo bằng hình", hint: "Báo đúng, sai, hết giờ bằng hình và chữ" },
  { key: "vibration", on: true, off: false, icon: Vibrate, label: "Rung thông báo", hint: "Điện thoại rung khi có thông báo" },
  { key: "voiceAssistant", on: true, off: false, icon: Mic, label: "Ra lệnh bằng giọng", hint: "Gọi “Này SmartStudy” rồi nói điều em cần" },
  { key: "timeMode", on: "off", off: "normal", icon: TimerOff, label: "Không tính giờ", hint: "Bỏ đồng hồ đếm giờ khi làm bài" },
];
const STANDARD_FEATURES = [
  { icon: BookOpen, label: "Bài học" },
  { icon: ListChecks, label: "Luyện đề" },
  { icon: Languages, label: "Từ điển" },
  { icon: Gamepad2, label: "Trò chơi ôn tập" },
];

// Feature rows on the mode cards: white icon bubble on a soft tint (the student's 2026-11 mock-up)
const ROW_TINTS = [
  "bg-[#e0efff] text-[#1e4fa3] [&_svg]:text-[#2e6fd8]",
  "bg-[#dcfce7] text-[#166534] [&_svg]:text-[#16a34a]",
  "bg-[#ffedd5] text-[#9a3412] [&_svg]:text-[#ea7a0c]",
  "bg-[#ffe4e6] text-[#9f1239] [&_svg]:text-[#e11d48]",
];

// Help symbols floating around the support whale (hearing, vibration, voice, no timer, accessibility)
const WHALE_BADGES = [
  { icon: Accessibility, pos: "left-0 top-0 sm:left-1 sm:top-1", tint: "bg-[#ccfbf1] text-[#0f766e]" },
  { icon: Ear, pos: "right-0 top-0 sm:right-1 sm:top-2", tint: "bg-[#e0efff] text-[#2e6fd8]" },
  { icon: Mic, pos: "-left-1 bottom-3 sm:left-0 sm:bottom-6", tint: "bg-[#ffedd5] text-[#ea7a0c]" },
  { icon: Vibrate, pos: "-right-1 bottom-3 sm:right-0 sm:bottom-6", tint: "bg-[#dcfce7] text-[#16a34a]" },
  { icon: Hand, pos: "left-1/2 -bottom-1 -translate-x-1/2 sm:bottom-0", tint: "bg-[#ffe4e6] text-[#e11d48]" },
];

/**
 * Props drawn over the "hello" whale (viewBox = the image's 354×417, so it lines up under object-contain):
 * hearing = headphones + sound waves, motor = waving fin + microphone (talk instead of tapping).
 */
function NeedWhaleProps({ need }: { need: SupportNeed }) {
  return (
    <svg viewBox="0 0 354 417" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <linearGradient id="nw-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc0ff" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="nw-mic" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {need === "hearing" ? (
        <g>
          {/* headband over the head, cups on both sides */}
          <path d="M40 190 C 40 70, 300 70, 300 190" fill="none" stroke="#1e3a8a" strokeWidth="22" strokeLinecap="round" />
          <path d="M40 190 C 40 70, 300 70, 300 190" fill="none" stroke="#60a5fa" strokeWidth="12" strokeLinecap="round" />
          <rect x="0" y="140" width="74" height="112" rx="32" fill="url(#nw-cup)" stroke="#fff" strokeWidth="8" />
          <rect x="266" y="140" width="74" height="112" rx="32" fill="url(#nw-cup)" stroke="#fff" strokeWidth="8" />
          <ellipse cx="30" cy="178" rx="8" ry="16" fill="#fff" opacity=".7" />
          <ellipse cx="292" cy="178" rx="8" ry="16" fill="#fff" opacity=".7" />
          {/* sound waves coming in */}
          <g fill="none" stroke="#2563eb" strokeWidth="12" strokeLinecap="round">
            <path d="M-18 168 Q -34 198 -18 228" />
            <path d="M-50 148 Q -76 198 -50 248" opacity=".6" />
            <path d="M358 168 Q 374 198 358 228" />
            <path d="M390 148 Q 416 198 390 248" opacity=".6" />
          </g>
        </g>
      ) : (
        <g>
          {/* motion lines by the waving fin */}
          <g fill="none" stroke="#16a34a" strokeWidth="11" strokeLinecap="round">
            <path d="M352 150 Q 378 175 372 210" />
            <path d="M378 120 Q 418 165 406 222" opacity=".6" />
          </g>
          {/* microphone held up to the mouth, with speech lines */}
          <g transform="rotate(-35 80 300)">
            <rect x="64" y="262" width="30" height="110" rx="12" fill="#1e293b" stroke="#fff" strokeWidth="7" />
            <rect x="58" y="258" width="42" height="18" rx="6" fill="#475569" stroke="#fff" strokeWidth="5" />
            <circle cx="79" cy="222" r="44" fill="url(#nw-mic)" stroke="#fff" strokeWidth="8" />
            <g stroke="#b45309" strokeWidth="5" opacity=".55">
              <path d="M45 210 H113 M42 230 H116 M79 182 V262 M56 190 V256 M102 190 V256" />
            </g>
            <ellipse cx="62" cy="203" rx="10" ry="7" fill="#fff" opacity=".8" />
          </g>
          {/* voice going into the mic */}
          <g fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round">
            <path d="M132 196 Q 118 218 132 240" />
            <path d="M110 184 Q 90 218 110 252" opacity=".6" />
          </g>
        </g>
      )}
    </svg>
  );
}

/** One of the two big cards of the first step: happy whale = standard, whale with help symbols = support. */
function ModeCard({ mode, onPick, picked }: { mode: Mode; onPick: (m: Mode) => void; picked: boolean }) {
  const support = mode === "support";
  const rows = support ? SUPPORT_SWITCHES : STANDARD_FEATURES;
  // The card is a div (click anywhere) with a real button inside for keyboard and screen readers: a whole
  // card made of one <button> lost its stretch layout in the desktop app's older Chromium.
  return (
    <div
      onClick={() => onPick(mode)}
      className={`group relative flex w-full cursor-pointer flex-col rounded-[1.75rem] border-4 border-white/90 bg-gradient-to-b px-2 pb-3 pt-3 shadow-[0_12px_30px_-10px_rgba(30,64,140,0.45)] ring-2 transition hover:-translate-y-1 sm:px-5 sm:pb-5 sm:pt-5 ${
        support ? "from-[#e6fbe9] via-[#f4fff5] to-white ring-[#86d99a]" : "from-[#e3f0ff] via-[#f3f8ff] to-white ring-[#93c0f5]"
      } ${picked ? "outline outline-[3px] outline-offset-2 outline-[#fbbf24]" : ""}`}
    >
      <h2 className="sr-only">{support ? "Chế độ hỗ trợ" : "Chế độ tiêu chuẩn"}</h2>

      <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div aria-hidden className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-48 sm:w-[44%]">
          <span className={`absolute inset-2 rounded-full blur-xl ${support ? "bg-[#bbf7d0]" : "bg-[#bfdbfe]"}`} />
          {/* both cards use the whale; the support one is ringed by the help symbols */}
          <WhaleMascot mood={support ? "hello" : "great"} size={190} className={`relative drop-shadow-lg ${support ? "!h-[78%] !w-[78%]" : "!h-full !w-full"}`} />
          {support &&
            WHALE_BADGES.map(({ icon: Icon, pos, tint }) => (
              <span key={pos} className={`absolute ${pos} flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-md sm:h-10 sm:w-10 ${tint}`}>
                <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </span>
            ))}
        </div>
        <ul aria-hidden className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:gap-2.5">
          {rows.map(({ icon: Icon, label }, i) => (
            <li key={label} className={`flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 text-[11px] font-extrabold leading-tight shadow-sm sm:gap-3 sm:py-1 sm:pl-1 sm:pr-4 sm:text-base ${ROW_TINTS[i % ROW_TINTS.length]}`}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm sm:h-10 sm:w-10">
                <Icon className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex w-full justify-center pt-3 sm:pt-5">
        <button
          type="button"
          className={`flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-full border-2 border-white/70 bg-gradient-to-b px-2 text-sm font-black uppercase leading-tight shadow-[0_6px_0_rgba(0,0,0,0.12)] transition group-hover:brightness-105 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#fbbf24] sm:min-h-[60px] sm:w-[90%] sm:gap-3 sm:text-lg ${
            support ? "from-[#a3e635] to-[#22a845] text-[#123d1f]" : "from-[#fde047] to-[#f59e0b] text-[#1e2a5a]"
          }`}
        >
          <span className="sm:hidden">{support ? "Hỗ trợ" : "Tiêu chuẩn"}</span>
          <span className="hidden sm:inline">{support ? "Vào chế độ hỗ trợ" : "Vào chế độ tiêu chuẩn"}</span>
          <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white sm:h-8 sm:w-8 ${support ? "bg-[#14532d]" : "bg-[#1e2a5a]"}`}>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
        </button>
      </div>
    </div>
  );
}


export default function FullScreenAuthPortal({
  onLoginWithGoogle,
  selectedGrade,
  onSelectGrade,
  authLoading,
  selectedAvatarIdx = 0
}: FullScreenAuthPortalProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [need, setNeed] = useState<SupportNeed | null>(null);
  const lastMode = (() => {
    try {
      return localStorage.getItem(MODE_KEY) as Mode | null;
    } catch {
      return null;
    }
  })();
  const markAsked = () => {
    try {
      localStorage.setItem("smartstudy_support_asked_v1", String(Date.now())); // the mode answers the old "Em cần hỗ trợ gì?" question
    } catch {
      // ignore
    }
  };
  const pickNeed = (n: SupportNeed) => {
    setSupportNeed(n);
    markAsked();
    setNeed(n);
  };
  const pickMode = (m: Mode) => {
    if (m === "support") {
      setNeed(null); // next step: which difficulty
      setMode(m);
      return;
    }
    try {
      localStorage.setItem(MODE_KEY, m); // before setSupportProfile: its change event makes menus re-read the mode
      localStorage.setItem("smartstudy_support_asked_v1", String(Date.now())); // the mode answers the old "Em cần hỗ trợ gì?" question
    } catch {
      // storage blocked: the choice still applies for this visit
    }
    setSupportProfile(SUPPORT_OFF);
    setMode(m);
  };
  const profile = useSupportProfile(); // re-render when help is turned on, so the button shows it
  const helpOn = isSupportActive();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRedirectOption, setShowRedirectOption] = useState<boolean>(() => {
    return typeof window !== "undefined" && (
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
    );
  });

  const handleGoogleLogin = async (forceRedirect = false) => {
    try {
      setIsLoggingIn(true);
      setErrorMessage(null);
      await onLoginWithGoogle({ forceRedirect });
    } catch (err: any) {
      console.error("Lỗi đăng nhập:", err);
      const code = err?.code || "";
      const inApp = isNativeMobileApp() || isDesktopApp();
      if (inApp && isUserCancelled(code, err?.message || "")) {
        // Backing out of the Google account picker is not an error
        setErrorMessage(null);
      } else {
        setErrorMessage(authErrorMessage(code));
      }
      // "Chuyển trang" (redirect) only works in a real browser, never inside the apps
      setShowRedirectOption(
        !inApp &&
          ["auth/popup-blocked", "auth/popup-closed-by-user", "auth/operation-not-supported-in-this-environment", "auth/internal-error"].includes(code)
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="auth-portal desktop-safe-top fixed inset-0 z-[120] flex flex-col justify-between overflow-y-auto bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#fef9c3] font-sans">

      <header className="relative z-10 flex w-full shrink-0 items-center justify-between gap-2 border-b border-white/60 bg-white/70 px-4 py-2.5 backdrop-blur sm:px-8">
        <BrandLogo size={36} tagline={false} />
        <button
          type="button"
          onClick={() => setAskOpen(true)}
          className="ml-auto flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#2e5cb8] px-4 text-sm font-black uppercase text-white hover:bg-[#284d9a] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#fbbf24]"
        >
          <Settings className="h-4 w-4 shrink-0" aria-hidden />
          <span className="sr-only sm:hidden">Hỗ trợ</span>
          <span className="hidden sm:inline">Cài đặt hỗ trợ</span>
        </button>
      </header>

      {mode === "support" && need === null ? (
      /* Step 1b: which difficulty; only its help is turned on */
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-3 px-3 py-3 sm:gap-6 sm:px-6 sm:py-6">
        <span aria-hidden className="pointer-events-none absolute -left-10 top-10 h-24 w-56 rounded-full bg-white/70 blur-2xl" />
        <span aria-hidden className="pointer-events-none absolute -right-10 bottom-16 h-28 w-64 rounded-full bg-white/70 blur-2xl" />
        <div className="relative flex flex-col items-center text-center">
          <h1 className="rounded-[2rem] border-4 border-white/80 bg-gradient-to-b from-[#5aa8ff] to-[#2456b8] px-5 py-2 font-display text-lg font-black tracking-tight text-white shadow-xl [text-shadow:0_3px_0_rgba(20,40,110,0.45)] sm:px-10 sm:py-3 sm:text-4xl">
            Em gặp khó khăn ở phần nào?
          </h1>
          <p className="mt-2 text-sm font-bold text-[#1e3a6e] sm:text-lg">Chọn một. SmartStudy chỉ bật hỗ trợ cho phần đó.</p>
        </div>
        <div className="relative grid w-full grid-cols-2 gap-2 sm:gap-8">
          {NEEDS.map(({ id, icon: Icon, label, hint }) => {
            const hearing = id === "hearing";
            return (
              <button
                key={id}
                type="button"
                onClick={() => pickNeed(id)}
                className={`group flex flex-col items-center gap-2 rounded-[1.75rem] border-4 border-white/90 bg-gradient-to-b px-2 pb-3 pt-3 text-center shadow-[0_12px_30px_-10px_rgba(30,64,140,0.45)] ring-2 transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#fbbf24] sm:gap-3 sm:px-6 sm:pb-6 sm:pt-5 ${
                  hearing ? "from-[#e3f0ff] via-[#f3f8ff] to-white ring-[#93c0f5]" : "from-[#e6fbe9] via-[#f4fff5] to-white ring-[#86d99a]"
                }`}
              >
                {/* whale + the help sign in a big speech bubble (the reference's kids are swapped for our whale) */}
                <span aria-hidden className="relative flex w-full items-center justify-center gap-1 sm:gap-4">
                  <span className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-48 sm:w-48">
                    <span className={`absolute inset-2 rounded-full blur-xl ${hearing ? "bg-[#bfdbfe]" : "bg-[#bbf7d0]"}`} />
                    <WhaleMascot mood="hello" size={160} className="relative !h-full !w-full drop-shadow-lg" />
                    <NeedWhaleProps need={id} />
                  </span>
                  <span
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-lg sm:h-24 sm:w-24 ${
                      hearing ? "bg-gradient-to-b from-[#5aa8ff] to-[#2456b8] text-white" : "bg-white text-[#14532d]"
                    }`}
                  >
                    <Icon className="h-6 w-6 sm:h-12 sm:w-12" />
                    {/* "no hand" sign: motor card means talking instead of tapping */}
                    {!hearing && <span className="absolute inset-0 rounded-full border-[3px] border-[#e11d48] sm:border-[6px]"><span className="absolute left-1/2 top-1/2 h-[3px] w-[115%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#e11d48] sm:h-[6px]" /></span>}
                  </span>
                </span>
                <span
                  className={`-mt-1 w-full rounded-2xl border-2 border-white/80 bg-gradient-to-b px-2 py-1 font-display text-base font-black leading-tight text-white shadow-md [text-shadow:0_2px_0_rgba(0,0,0,0.25)] sm:w-[85%] sm:py-2 sm:text-3xl ${
                    hearing ? "from-[#5aa8ff] to-[#2456b8]" : "from-[#4ade80] to-[#16a34a]"
                  }`}
                >
                  {label}
                </span>
                <span className="text-xs font-bold leading-snug text-[#1e3a6e] sm:text-lg">{hint}</span>
                <span
                  aria-hidden
                  className={`mt-auto flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border-2 border-white/70 bg-gradient-to-b px-3 text-base font-black text-white shadow-[0_6px_0_rgba(0,0,0,0.12)] group-hover:brightness-105 sm:min-h-[56px] sm:w-auto sm:px-10 sm:text-xl ${
                    hearing ? "from-[#3b82f6] to-[#1d4ed8]" : "from-[#22c55e] to-[#15803d]"
                  }`}
                >
                  Chọn <ArrowRight className="h-4 w-4 sm:h-6 sm:w-6" />
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setMode(null)}
          className="relative flex min-h-[48px] items-center gap-2 rounded-full border-2 border-white bg-white/90 py-1 pl-1.5 pr-5 text-base font-black text-[#1e3a6e] shadow-md hover:bg-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#fbbf24]"
        >
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#5aa8ff] to-[#2456b8] text-white">
            <ArrowLeft className="h-5 w-5" />
          </span>
          Quay lại
        </button>
      </main>
      ) : mode === null ? (
      /* Step 1: pick the interface first, so a student who needs help gets it before any sign-in */
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-6">
        {/* soft clouds behind the cards */}
        <span aria-hidden className="pointer-events-none absolute -left-10 top-10 h-24 w-56 rounded-full bg-white/70 blur-2xl" />
        <span aria-hidden className="pointer-events-none absolute -right-10 bottom-16 h-28 w-64 rounded-full bg-white/70 blur-2xl" />
        <div className="relative flex flex-col items-center text-center">
          <h1 className="rounded-[2rem] border-4 border-white/80 bg-gradient-to-b from-[#5aa8ff] to-[#2456b8] px-5 py-2 font-display text-xl font-black uppercase tracking-tight text-white shadow-xl [text-shadow:0_3px_0_rgba(20,40,110,0.45)] sm:px-10 sm:py-3 sm:text-5xl">
            Chọn chế độ học tập
          </h1>
        </div>
        <div className="mt-2 grid w-full grid-cols-2 gap-2 sm:mt-0 sm:gap-8">
          <ModeCard mode="standard" onPick={pickMode} picked={lastMode === "standard"} />
          <ModeCard mode="support" onPick={pickMode} picked={lastMode === "support"} />
        </div>

      </main>
      ) : (
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-8">
        <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-10">
          {/* Left: who the app is for, in plain words */}
          <div className="order-2 space-y-5 text-center lg:order-1 lg:col-span-6 lg:text-left">
            <div className="space-y-3">
              <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-[#243c6e] sm:text-4xl lg:text-5xl">
                {mode === "support" ? (
                  <>Học tập <span className="whitespace-nowrap text-[#13808a]">không rào cản</span></>
                ) : (
                  <>Học theo cách <span className="whitespace-nowrap text-[#2e5cb8]">hợp với em</span></>
                )}
              </h1>
            </div>

            <div className="flex items-center justify-center gap-4 lg:justify-start">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#dbeafe] to-[#fce7f3] shadow-md sm:h-40 sm:w-40 [&>*]:!h-[85%] [&>*]:!w-[85%]" aria-hidden>
                {getMascotComponent(selectedAvatarIdx, 140, 2, "default")}
              </div>
              <p className="relative rounded-2xl bg-white px-4 py-3 text-left text-base font-bold leading-snug text-[#243c6e] shadow-md">
                {mode === "support" ? (need === "motor" ? "Em chỉ cần nói, mình làm giúp! 🎙️" : "Có hình, chữ và rung báo cho em! 💬") : "Chào em! Cùng học nhé! 👋"}
              </p>
            </div>

            <ul className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {FEATURES.map(({ icon: Icon, title, tint }) => (
                <li key={title} className="flex flex-col items-center gap-2 rounded-2xl bg-white/80 p-3 text-center shadow-sm">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="text-xs font-extrabold text-[#243c6e] sm:text-sm">{title}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: the sign-in card (first on phones) */}
          <div className="order-1 flex justify-center lg:order-2 lg:col-span-6">
            <div className={`relative w-full max-w-md space-y-5 overflow-hidden rounded-3xl border-2 bg-white p-5 shadow-xl sm:p-8 ${mode === "support" ? "border-[#13808a]/60" : "border-[#c9dcf4]"}`}>
              <div className={`absolute left-0 right-0 top-0 h-2 ${mode === "support" ? "bg-[#13808a]" : "ss-grad-brand"}`} aria-hidden />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="flex min-h-[44px] items-center gap-1 rounded-xl px-2 text-sm font-bold text-[#2e5cb8] hover:bg-[#eef4fc]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Đổi chế độ
                </button>
                <h2 className="flex-1 pr-16 text-center font-display text-2xl font-black text-[#243c6e]">Vào học</h2>
              </div>
              <p className={`-mt-3 text-center text-sm font-black ${mode === "support" ? "text-[#0e5f66]" : "text-[#2e5cb8]"}`}>
                {mode === "support" ? `Chế độ hỗ trợ: ${need === "motor" ? "khó vận động" : "khó nghe"}` : "Chế độ tiêu chuẩn"}
              </p>

              {mode === "support" ? (
                <ul aria-label="Hỗ trợ đang bật" className="space-y-2">
                  {SUPPORT_SWITCHES.filter((s) => NEEDS.find((n) => n.id === need)?.keys.includes(s.key)).map(({ key, on, off, icon: Icon, label, hint }) => {
                    const isOn = profile[key] === on;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isOn}
                          onClick={() => setSupportProfile({ [key]: isOn ? off : on })}
                          className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left transition ${isOn ? "border-[#13808a] bg-[#e6f6f3]" : "border-[#c9dcf4] bg-white"}`}
                        >
                          <Icon className="h-6 w-6 shrink-0 text-[#13808a]" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-[#0e5f66]" title={hint}>{label}</span>
                          </span>
                          <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition ${isOn ? "bg-[#13808a]" : "bg-slate-300"}`}>
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isOn ? "left-[22px]" : "left-0.5"}`} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
              /* Help before signing in: a student who needs help should not have to get through sign-in first */
              <button
                type="button"
                onClick={() => setAskOpen(true)}
                className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition ${
                  helpOn ? "border-[#13808a] bg-[#e6f6f3]" : "border-dashed border-[#13808a]/60 bg-white hover:bg-[#f0faf8]"
                }`}
              >
                <Accessibility className="h-7 w-7 shrink-0 text-[#13808a]" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black text-[#0e5f66]">{helpOn ? "Đang bật hỗ trợ" : "Em cần hỗ trợ khi học?"}</span>
                </span>
                {helpOn && <Check className="h-5 w-5 shrink-0 text-[#13808a]" aria-hidden />}
              </button>
              )}

              <div role="group" aria-labelledby="auth-grade-label" className="space-y-2">
                <p id="auth-grade-label" className="text-sm font-black text-[#243c6e]">
                  Em học lớp mấy?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {GRADES.map((g) => {
                    const on = selectedGrade === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onSelectGrade(g)}
                        className={`min-h-[48px] rounded-xl border-2 px-1 text-sm font-black transition ${
                          on ? "border-[#2e5cb8] bg-[#2e5cb8] text-white" : "border-[#c9dcf4] bg-[#f6f9fe] text-[#243c6e] hover:border-[#2e5cb8]"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMessage && (
                <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin(false)}
                  disabled={isLoggingIn || authLoading}
                  className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 font-display text-base font-black text-slate-900 shadow-sm transition hover:border-[#2e5cb8] disabled:opacity-60"
                >
                  {isLoggingIn || authLoading ? (
                    <>
                      <RefreshCw className="h-5 w-5 shrink-0 animate-spin text-[#2e5cb8]" aria-hidden />
                      <span>{isLoggingIn && isDesktopApp() ? "Đang chờ đăng nhập trong trình duyệt..." : "Đang đăng nhập..."}</span>
                    </>
                  ) : (
                    <>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" aria-hidden className="h-5 w-5" />
                      <span>Đăng nhập bằng Google</span>
                    </>
                  )}
                </button>

                {isLoggingIn && isDesktopApp() && (
                  <p role="status" className="text-center text-sm text-slate-600">
                    Trình duyệt trên máy đã mở trang đăng nhập Google. Đăng nhập xong, quay lại cửa sổ này.
                  </p>
                )}

                {showRedirectOption && (
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin(true)}
                    disabled={isLoggingIn || authLoading}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-100"
                  >
                    <Globe className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                    <span>Đăng nhập bằng cách chuyển trang</span>
                  </button>
                )}

              </div>

            </div>
          </div>
        </div>
      </main>
      )}

      <footer className="relative z-10 mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-3 text-xs font-medium text-slate-600 sm:justify-between sm:px-6 sm:text-sm">
        <span>© 2026 SmartStudy · Dành cho học sinh THCS</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-[#2e5cb8]" aria-hidden />Bảo mật Firebase</span>
      </footer>

      {askOpen && <SupportAskDialog onClose={() => setAskOpen(false)} />}
    </div>
  );
}
