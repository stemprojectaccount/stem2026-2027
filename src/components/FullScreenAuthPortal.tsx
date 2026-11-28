import React, { useState } from "react";
import { Accessibility, ArrowLeft, ArrowRight, RefreshCw, AlertCircle, User as UserIcon, Cloud, WifiOff, ShieldCheck, Globe, X, Check, Captions, Vibrate, Mic, TimerOff, Ear, Hand, Settings, BookOpen, ListChecks, Languages, Gamepad2 } from "lucide-react";
import { BrandLogo, getMascotComponent } from "./CustomMascots";
import { SupportAskDialog } from "./support/SupportFirstRun";
import { isSupportActive, setSupportNeed, setSupportProfile, useSupportProfile, type SupportNeed, type SupportProfile } from "../lib/support/profile";
import { isDesktopApp, isNativeMobileApp } from "../firebase";
import { authErrorMessage, isUserCancelled } from "../lib/authErrorMessage";

interface FullScreenAuthPortalProps {
  onLoginWithGoogle: (options?: { forceRedirect?: boolean }) => Promise<any>;
  onContinueAsGuest: () => void;
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
// Bright tile colours for the feature chips, cycled (the screen used to be all pale grey-blue)
const CHIP_TINTS = ["bg-[#dbeafe] text-[#1e40af]", "bg-[#dcfce7] text-[#166534]", "bg-[#fef3c7] text-[#92400e]", "bg-[#ffe4e6] text-[#9f1239]"];

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

/** One of the two big cards of the first step (layout and palette 3 from the student's own mock-up). */
function ModeCard({ mode, onPick, picked }: { mode: Mode; onPick: (m: Mode) => void; picked: boolean }) {
  const support = mode === "support";
  const chips = support ? NEEDS : STANDARD_FEATURES;
  // The card is a div (click anywhere) with a real button inside for keyboard and screen readers: a whole
  // card made of one <button> lost its stretch layout in the desktop app's older Chromium.
  return (
    <div
      onClick={() => onPick(mode)}
      className={`group relative flex w-full cursor-pointer flex-col rounded-2xl border-2 bg-white p-2.5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
        support ? "border-[#14b8a6]" : picked ? "border-[#2e5cb8]" : "border-[#93c5fd]"
      } ${picked ? "ring-2 ring-[#8ee8b4] ring-offset-2 ring-offset-[#eef4fc]" : ""}`}
    >

      <div className="flex flex-col">
        <div aria-hidden className={`order-2 mt-2 flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-gradient-to-br sm:mt-3 sm:h-44 ${support ? "from-[#ccfbf1] to-[#fef9c3]" : "from-[#dbeafe] to-[#fce7f3]"}`}>
          {support ? (
            <span className="grid grid-cols-2 gap-2 sm:gap-4">
              {NEEDS.map(({ id, icon: Icon }, i) => (
                <span key={id} className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm sm:h-24 sm:w-24 ${CHIP_TINTS[i % CHIP_TINTS.length]}`}>
                  <Icon className="h-7 w-7 sm:h-12 sm:w-12" />
                </span>
              ))}
            </span>
          ) : (
            <span className="h-24 w-24 sm:h-40 sm:w-40 [&>*]:!h-full [&>*]:!w-full">{getMascotComponent(0, 160, 2, "default")}</span>
          )}
        </div>
        <div className="order-1 mt-1 min-w-0 text-center sm:mt-0">
          <h2 className="font-display text-sm font-black uppercase leading-tight text-[#243c6e] sm:text-2xl">{support ? "Chế độ hỗ trợ" : "Chế độ tiêu chuẩn"}</h2>
        </div>
      </div>

      <ul aria-hidden className="mt-2.5 grid grid-cols-1 gap-1 sm:mt-3 sm:grid-cols-2 sm:gap-1.5">
        {chips.map(({ icon: Icon, label }, i) => (
          <li key={label} className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold leading-tight sm:px-2.5 sm:text-sm ${CHIP_TINTS[i % CHIP_TINTS.length]}`}>
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            {label}
          </li>
        ))}
      </ul>


      <div className="mt-auto flex w-full flex-col items-center pt-3 sm:pt-4">
        <button
          type="button"
          className={`flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-black uppercase sm:w-auto sm:gap-2 sm:px-6 leading-tight text-white shadow-md focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#fbbf24] sm:text-base ${support ? "bg-[#0e7279] group-hover:bg-[#0e5f66]" : "ss-btn-grad"}`}
        >
          <span className="sm:hidden">Vào học</span>
          <span className="hidden sm:inline">{support ? "Vào chế độ hỗ trợ" : "Vào chế độ tiêu chuẩn"}</span>
          <ArrowRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}


export default function FullScreenAuthPortal({
  onLoginWithGoogle,
  onContinueAsGuest,
  selectedGrade,
  onSelectGrade,
  authLoading,
  selectedAvatarIdx = 0
}: FullScreenAuthPortalProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [need, setNeed] = useState<SupportNeed | null>(null);
  const choosing = mode === null || (mode === "support" && need === null); // still on the "pick a mode / a difficulty" steps
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
        {/* the interface is chosen first: no way in (sign-in or guest) until a mode is picked */}
        {!choosing && (
        <button
          type="button"
          onClick={onContinueAsGuest}
          aria-label="Đóng, vào học dạng Khách"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-[#eef4fc]"
        >
          <X className="h-5 w-5" aria-hidden />
          <span className="hidden sm:inline">Đóng</span>
        </button>
        )}
      </header>

      {mode === "support" && need === null ? (
      /* Step 1b: which difficulty; only its help is turned on */
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-3 py-3 sm:gap-6 sm:px-6 sm:py-6">
        <div className="text-center">
          <h1 className="font-display text-xl font-black uppercase text-[#0e7279] sm:text-3xl">Em gặp khó khăn ở phần nào?</h1>
          <p className="mt-1 text-sm font-semibold text-slate-600 sm:text-base">Chọn một. SmartStudy chỉ bật hỗ trợ cho phần đó.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:gap-6">
          {NEEDS.map(({ id, icon: Icon, label, hint }, i) => (
            <button
              key={id}
              type="button"
              onClick={() => pickNeed(id)}
              className="group flex min-h-[200px] flex-col items-center gap-2 rounded-2xl border-2 border-[#14b8a6] bg-white p-3 text-center shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#fbbf24] sm:gap-3 sm:p-6"
            >
              <span aria-hidden className={`flex h-20 w-20 items-center justify-center rounded-3xl shadow-sm sm:h-28 sm:w-28 ${CHIP_TINTS[i % CHIP_TINTS.length]}`}>
                <Icon className="h-10 w-10 sm:h-14 sm:w-14" />
              </span>
              <span className="font-display text-lg font-black uppercase leading-tight text-[#243c6e] sm:text-2xl">{label}</span>
              <span className="text-xs font-semibold leading-snug text-slate-600 sm:text-base">{hint}</span>
              <span aria-hidden className="mt-auto flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#0e7279] px-3 text-sm font-black uppercase text-white group-hover:bg-[#0e5f66] sm:w-auto sm:px-6 sm:text-base">
                Chọn <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setMode(null)} className="flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-sm font-bold text-[#2e5cb8] hover:bg-[#eef4fc]">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Quay lại
        </button>
      </main>
      ) : mode === null ? (
      /* Step 1: pick the interface first, so a student who needs help gets it before any sign-in */
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-3 py-3 sm:gap-6 sm:px-6 sm:py-6">
        <div className="text-center">
          <h1 className="font-display text-xl font-black uppercase text-[#2e5cb8] sm:text-3xl">Chọn chế độ học tập</h1>
        </div>
        <div className="mt-2 grid w-full grid-cols-2 gap-2 sm:mt-0 sm:gap-6">
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

                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="ss-btn-grad flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-black text-white"
                >
                  <UserIcon className="h-5 w-5 shrink-0" aria-hidden />
                  <span>Vào học dạng Khách</span>
                  <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
                </button>
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
