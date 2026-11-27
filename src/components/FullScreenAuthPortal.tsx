import React, { useState } from "react";
import { Accessibility, ArrowLeft, ArrowRight, RefreshCw, AlertCircle, User as UserIcon, Cloud, WifiOff, ShieldCheck, Globe, X, Check, Captions, Vibrate, Mic, Hand, HandMetal, Settings, BookOpen, ListChecks, Languages, Gamepad2 } from "lucide-react";
import { BrandLogo, getMascotComponent } from "./CustomMascots";
import { SupportAskDialog } from "./support/SupportFirstRun";
import { isSupportActive, setSupportProfile, useSupportProfile, type SupportProfile } from "../lib/support/profile";
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
  { icon: Accessibility, title: "Hỗ trợ học tập", text: "Nhìn thay nghe, ký hiệu tay, nói thay bấm" },
  { icon: Cloud, title: "Lưu tiến độ", text: "Trên điện thoại và máy tính" },
  { icon: WifiOff, title: "Học khi mất mạng", text: "Luyện đề, từ điển, trò chơi" },
];

type Mode = "standard" | "support";
const MODE_KEY = "smartstudy_learning_mode";

// What the support mode turns on (hearing: see instead of hear; movement: speak instead of tap, no clock).
// Standard mode turns these back off; the voice assistant stays as the student set it.
const SUPPORT_ON: Partial<SupportProfile> = { visualFeedback: true, vibration: true, timeMode: "off", voiceAssistant: true };
const SUPPORT_OFF: Partial<SupportProfile> = { visualFeedback: false, vibration: false, timeMode: "normal", handSigns: false };

const SUPPORT_SWITCHES: { key: keyof SupportProfile; on: SupportProfile[keyof SupportProfile]; off: SupportProfile[keyof SupportProfile]; icon: React.ComponentType<{ className?: string }>; label: string; hint: string }[] = [
  { key: "handSigns", on: true, off: false, icon: HandMetal, label: "Ký hiệu tay", hint: "Giơ ngón tay trước camera để chọn đáp án, nói thay em" },
  { key: "visualFeedback", on: true, off: false, icon: Captions, label: "Nhìn thay nghe", hint: "Báo đúng, sai, hết giờ bằng hình và chữ" },
  { key: "vibration", on: true, off: false, icon: Vibrate, label: "Rung báo", hint: "Điện thoại rung khi có thông báo" },
  { key: "voiceAssistant", on: true, off: false, icon: Mic, label: "Nói thay bấm", hint: "Gọi “Này SmartStudy” rồi nói điều em cần" },
  { key: "timeMode", on: "off", off: "normal", icon: Hand, label: "Không vội", hint: "Bỏ đồng hồ đếm giờ khi làm bài" },
];
const STANDARD_FEATURES = [
  { icon: BookOpen, label: "Bài học" },
  { icon: ListChecks, label: "Luyện đề" },
  { icon: Languages, label: "Từ điển" },
  { icon: Gamepad2, label: "Trò chơi ôn tập" },
];
const HAND_SIGNS = ["☝️", "✌️", "👍", "✋", "🤟"]; // shown on the cards so the camera signs stand out

/** One of the two big cards of the first step (layout and palette 3 from the student's own mock-up). */
function ModeCard({ mode, onPick, picked }: { mode: Mode; onPick: (m: Mode) => void; picked: boolean }) {
  const support = mode === "support";
  const profile = useSupportProfile();
  const signsOn = profile.handSigns;
  const chips = support ? SUPPORT_SWITCHES.filter((x) => x.key !== "handSigns") : STANDARD_FEATURES;
  // The card is a div (click anywhere) with a real button inside for keyboard and screen readers: a whole
  // card made of one <button> lost its stretch layout in the desktop app's older Chromium.
  return (
    <div
      onClick={() => onPick(mode)}
      className={`group relative flex w-full cursor-pointer flex-col rounded-2xl border-2 bg-white p-3 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
        support ? "mt-3 border-[#2e5cb8] sm:mt-0" : picked ? "border-[#2e5cb8]" : "border-[#c9dcf4]"
      } ${picked ? "ring-2 ring-[#8ee8b4] ring-offset-2 ring-offset-[#eef4fc]" : ""}`}
    >
      {support && (
        <span aria-hidden className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#f59e0b] bg-[#fbbf24] px-3 py-1 text-xs font-bold text-[#422006] shadow-sm sm:text-sm">
          🤟 Ký hiệu tay qua camera <span className="leading-none">☝️ ✌️ 👍 ✋</span>
        </span>
      )}

      <div className="flex items-center gap-3 sm:flex-col sm:gap-0">
        <div aria-hidden className="flex h-24 w-28 shrink-0 items-center justify-center rounded-xl bg-[#eef4fc] sm:order-2 sm:mt-3 sm:h-44 sm:w-full">
          {support ? (
            <span className="grid grid-cols-3 gap-1 text-2xl leading-none sm:gap-3 sm:text-5xl">
              {HAND_SIGNS.map((s) => <span key={s}>{s}</span>)}
            </span>
          ) : (
            <span className="h-20 w-20 sm:h-40 sm:w-40 [&>*]:!h-full [&>*]:!w-full">{getMascotComponent(0, 160, 2, "default")}</span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-left sm:order-1 sm:text-center">
          <h2 className="font-display text-base font-black uppercase leading-tight text-[#243c6e] sm:text-2xl">{support ? "Chế độ hỗ trợ khiếm thính" : "Chế độ tiêu chuẩn"}</h2>
          <p className="mt-0.5 text-sm font-medium text-slate-600">{support ? "Khiếm thính · Khó vận động" : "Học như bình thường"}</p>
        </div>
      </div>

      <ul aria-hidden className="mt-3 grid grid-cols-2 gap-1.5">
        {chips.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-1 rounded-full border border-[#c9dcf4] bg-[#eef4fc] px-2.5 py-1 text-xs font-bold text-[#243c6e]">
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#2e5cb8]" />
            {label}
          </li>
        ))}
      </ul>

      {support && (
        <button
          type="button"
          role="switch"
          aria-checked={signsOn}
          onClick={(e) => {
            e.stopPropagation(); // flips the switch without picking the card
            setSupportProfile(signsOn ? { handSigns: false } : { handSigns: true, visualFeedback: true });
          }}
          className="mt-2.5 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-1 text-left text-sm font-semibold text-slate-700"
        >
          Bật phụ đề và ký hiệu tay ngay lập tức
          <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition ${signsOn ? "bg-[#2e5cb8]" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${signsOn ? "left-[22px]" : "left-0.5"}`} />
          </span>
        </button>
      )}

      <div className="mt-auto flex w-full flex-col items-center pt-3 sm:pt-4">
        <button
          type="button"
          className={`flex min-h-[48px] w-auto items-center justify-center gap-2 rounded-xl px-6 text-sm font-black uppercase leading-tight text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#fbbf24] sm:text-base ${support ? "bg-[#2e5cb8] group-hover:bg-[#284d9a]" : "ss-btn-grad"}`}
        >
          {support ? "Vào chế độ hỗ trợ" : "Vào chế độ tiêu chuẩn"}
          <ArrowRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
        </button>
        <p className="mt-1.5 flex items-center justify-center gap-1 text-xs font-medium text-slate-600">
          <UserIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Đăng nhập để lưu tiến độ
        </p>
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
  const lastMode = (() => {
    try {
      return localStorage.getItem(MODE_KEY) as Mode | null;
    } catch {
      return null;
    }
  })();
  const pickMode = (m: Mode) => {
    setSupportProfile(m === "support" ? SUPPORT_ON : SUPPORT_OFF);
    try {
      localStorage.setItem(MODE_KEY, m);
      localStorage.setItem("smartstudy_support_asked_v1", String(Date.now())); // the mode answers the old "Em cần hỗ trợ gì?" question
    } catch {
      // storage blocked: the choice still applies for this visit
    }
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
    <div className="auth-portal desktop-safe-top fixed inset-0 z-[120] flex flex-col justify-between overflow-y-auto bg-[#eef4fc] font-sans">

      <header className="relative z-10 flex w-full shrink-0 items-center justify-between gap-2 border-b border-[#e3edfa] bg-white px-4 py-2.5 sm:px-8">
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
        <button
          type="button"
          onClick={onContinueAsGuest}
          aria-label="Đóng, vào học dạng Khách"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-[#eef4fc]"
        >
          <X className="h-5 w-5" aria-hidden />
          <span className="hidden sm:inline">Đóng</span>
        </button>
      </header>

      {mode === null ? (
      /* Step 1: pick the interface first, so a student who needs help gets it before any sign-in */
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-3 py-3 sm:gap-6 sm:px-6 sm:py-6">
        <div className="text-center">
          <h1 className="font-display text-xl font-black uppercase text-[#2e5cb8] sm:text-3xl">Chọn chế độ học tập</h1>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
          <ModeCard mode="standard" onPick={pickMode} picked={lastMode === "standard"} />
          <ModeCard mode="support" onPick={pickMode} picked={lastMode === "support"} />
        </div>

        <section aria-labelledby="start-login" className="w-full max-w-sm rounded-2xl border border-[#c9dcf4] bg-white p-4 text-center shadow-md">
          <h2 id="start-login" className="font-display text-base font-black uppercase text-[#243c6e]">Đăng nhập để bắt đầu</h2>
          {errorMessage && (
            <p role="alert" className="mt-2 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-left text-sm font-medium text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
              {errorMessage}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleGoogleLogin(false)}
              disabled={isLoggingIn || authLoading}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-2 text-sm font-black text-slate-900 hover:border-[#2e5cb8] disabled:opacity-60"
            >
              {isLoggingIn || authLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin text-[#2e5cb8]" aria-hidden />
              ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" aria-hidden className="h-5 w-5" />
              )}
              Google
            </button>
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-2 text-sm font-black text-slate-900 hover:border-[#2e5cb8]"
            >
              <UserIcon className="h-5 w-5 shrink-0" aria-hidden />
              Khách
            </button>
          </div>
          {isLoggingIn && isDesktopApp() && (
            <p role="status" className="mt-2 text-sm text-slate-600">Trình duyệt trên máy đã mở trang đăng nhập Google. Đăng nhập xong, quay lại cửa sổ này.</p>
          )}
          {showRedirectOption && (
            <button
              type="button"
              onClick={() => handleGoogleLogin(true)}
              disabled={isLoggingIn || authLoading}
              className="mt-2 min-h-[44px] w-full rounded-xl px-2 text-sm font-bold text-[#2e5cb8] hover:bg-[#eef4fc]"
            >
              Đăng nhập bằng cách chuyển trang
            </button>
          )}
          <p className="mt-2 text-xs font-medium text-slate-600">Không cần nhớ mật khẩu</p>
        </section>
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
              <p className="mx-auto max-w-xl text-base font-medium leading-relaxed text-slate-700 lg:mx-0">
                Bài học, luyện đề, từ điển và trò chơi ôn tập cho học sinh lớp 6 đến lớp 9. Đăng nhập để lưu tiến độ; không đăng nhập vẫn học được.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-3xl border border-[#c9dcf4] bg-white p-4 shadow-sm sm:flex-row sm:p-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-[#c9dcf4] bg-[#eef4fc] sm:h-24 sm:w-24" aria-hidden>
                {getMascotComponent(selectedAvatarIdx, 76, 2, "default")}
              </div>
              <p className="text-center text-base font-bold leading-snug text-[#243c6e] sm:text-left">
                {mode === "support" ? (
                  <>Chào em! Mọi âm thanh trong app đều có chữ và hình. Tay khó bấm thì gọi <span className="text-[#0e7279]">“Này SmartStudy”</span> rồi nói điều em cần; khó nói thì giơ ký hiệu tay trước camera.</>
                ) : (
                  <>Chào em! Cần báo đúng sai bằng hình hay nói thay bấm? Bấm <span className="text-[#0e7279]">“Em cần hỗ trợ khi học?”</span> trước khi vào học nhé.</>
                )}
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-center gap-3 rounded-2xl border border-[#c9dcf4] bg-white p-3 text-left sm:block sm:text-center">
                  <Icon className="h-5 w-5 shrink-0 text-[#13808a] sm:mx-auto sm:mb-1" aria-hidden />
                  <span>
                    <span className="block text-sm font-extrabold text-[#243c6e]">{title}</span>
                    <span className="text-sm text-slate-600">{text}</span>
                  </span>
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
                {mode === "support" ? "Chế độ hỗ trợ: khiếm thính, khó vận động" : "Chế độ tiêu chuẩn"}
              </p>

              {mode === "support" ? (
                <ul aria-label="Hỗ trợ đang bật" className="space-y-2">
                  {SUPPORT_SWITCHES.map(({ key, on, off, icon: Icon, label, hint }) => {
                    const isOn = profile[key] === on;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isOn}
                          onClick={() => setSupportProfile({ [key]: isOn ? off : on })}
                          className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left transition ${isOn ? "border-[#13808a] bg-[#e6f6f3]" : "border-[#c9dcf4] bg-white"} ${key === "handSigns" ? "ring-2 ring-[#8ee8b4] ring-offset-1" : ""}`}
                        >
                          <Icon className="h-6 w-6 shrink-0 text-[#13808a]" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-[#0e5f66]">{label}</span>
                            <span className="block text-xs text-slate-600">{hint}</span>
                            {key === "handSigns" && <span aria-hidden className="mt-1 flex gap-1 text-lg leading-none">{HAND_SIGNS.map((e) => <span key={e}>{e}</span>)}</span>}
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
                  <span className="block text-sm text-slate-600">{helpOn ? "Bấm để xem hoặc đổi" : "Báo bằng hình, nói thay bấm, không vội…"}</span>
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

              <p className="flex items-center justify-center gap-1.5 border-t border-[#e3edfa] pt-3 text-center text-sm font-semibold text-slate-600">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#13808a]" aria-hidden />
                Không cần nhớ mật khẩu · Miễn phí
              </p>
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
