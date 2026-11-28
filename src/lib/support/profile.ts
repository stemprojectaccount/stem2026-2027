// "Hỗ trợ học tập": per-device settings that help students who have difficulty hearing or moving
// (tapping, clicking). Everything is off by default, so the app looks exactly like before until a
// student (or parent) turns something on. Settings are applied as classes on <html>, so pages do
// not need to change. Saved in localStorage, kept across app updates, and synced with the signed-in
// account by useFirestoreSync (users/{uid}.support).
import { useEffect, useState } from "react";

export const TEXT_SCALES = [100, 115, 130, 150, 175, 200] as const;
export type TextScale = (typeof TEXT_SCALES)[number];

export interface SupportProfile {
  /** Bigger text (scales the root font size; layout breakpoints stay the same). */
  textScale: TextScale;
  /** Darker grey text, darker borders and a thick focus outline. */
  highContrast: boolean;
  /** More space between letters, words and lines (WCAG 1.4.12 values); phones have no such setting. */
  wideSpacing: boolean;
  /** No fireworks, no moving effects. */
  reduceMotion: boolean;
  /** Right / wrong also shown as a coloured frame + big ✓ ✗ (not only by sound). */
  visualFeedback: boolean;
  /** Phone vibrates on right / wrong (Android; ignored where unsupported). */
  vibration: boolean;
  /** Timed practice: normal clock, twice the time, or no clock at all. */
  timeMode: TimeMode;
  /** Each new quiz question (and its 4 answers) is read aloud as soon as it appears. */
  readAloud: boolean;
  /** No sound effects or music (voices still speak): for students who find noise overwhelming. */
  quietSounds: boolean;
  /** A band that follows the finger / mouse and dims the other lines (like Immersive Reader's "line focus"). */
  readingRuler: boolean;
  /** Cream page and cards instead of bright white (dyslexia style guides: dark text on a light, not white, background). */
  softBackground: boolean;
  /** A gentle "time for a short break" note after 20 minutes of continuous study. */
  breakReminder: boolean;
  /** Voice assistant, on by default: say "này SmartStudy" and it answers, opens screens ("mở trò chơi"),
   *  scrolls, or answers study questions, so students who find tapping hard need no hands. Replaces the
   *  old voiceControl switch (off by default, so its saved false is ignored on purpose). */
  voiceAssistant: boolean;
  /** Shows the voice assistant's box (what it hears, its answer). Off by default: it still always listens and
   *  speaks its answers, the box just stays out of the way until the student turns it on in Settings. */
  voicePanel: boolean;
  /** Hand signs in front of the camera: 1–4 fingers pick answer A–D, 👍 👎 ✋ 🤟 speak a short sentence for
   *  students who cannot speak. Off by default (it turns the camera on). */
  handSigns: boolean;
  /** When it last changed (ms); the newest copy wins when the account syncs across devices. */
  updatedAt?: number;
}

export type TimeMode = "normal" | "double" | "off";

export const DEFAULT_SUPPORT: SupportProfile = {
  textScale: 100,
  highContrast: false,
  wideSpacing: false,
  reduceMotion: false,
  visualFeedback: false,
  vibration: false,
  timeMode: "normal",
  readAloud: false,
  quietSounds: false,
  readingRuler: false,
  softBackground: false,
  breakReminder: false,
  voiceAssistant: true,
  voicePanel: false,
  handSigns: false,
};

// Support now targets hearing and movement only (decided 11/2026); these sight / reading / focus settings
// have no switch any more, so they are forced off for students who had turned them on earlier.
const RETIRED: Partial<SupportProfile> = {
  textScale: 100,
  highContrast: false,
  wideSpacing: false,
  reduceMotion: false,
  readAloud: false,
  quietSounds: false,
  readingRuler: false,
  softBackground: false,
  breakReminder: false,
};

/** Seconds for a timed task after the student's time setting; null = no clock. */
export function supportSeconds(base: number, p: SupportProfile = getSupportProfile()): number | null {
  return p.timeMode === "off" ? null : p.timeMode === "double" ? base * 2 : base;
}

const KEY = "smartstudy_support_v1";
export const SUPPORT_CHANGED = "smartstudy-support-changed";

export function getSupportProfile(): SupportProfile {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (v && typeof v === "object") {
      const scale = (TEXT_SCALES as readonly number[]).includes(v.textScale) ? v.textScale : 100;
      const timeMode = ["normal", "double", "off"].includes(v.timeMode) ? v.timeMode : "normal";
      return { ...DEFAULT_SUPPORT, ...v, textScale: scale, timeMode, ...RETIRED };
    }
  } catch {
    // storage blocked: defaults
  }
  return { ...DEFAULT_SUPPORT };
}

export function setSupportProfile(patch: Partial<SupportProfile>): SupportProfile {
  const next = { ...getSupportProfile(), updatedAt: Date.now(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  applySupportProfile(next);
  window.dispatchEvent(new CustomEvent(SUPPORT_CHANGED, { detail: next }));
  return next;
}

export function isSupportActive(p: SupportProfile = getSupportProfile()): boolean {
  return p.textScale !== 100 || p.highContrast || p.wideSpacing || p.reduceMotion || p.visualFeedback || p.vibration || p.timeMode !== "normal" || p.readAloud || p.quietSounds || p.readingRuler || p.softBackground || p.breakReminder;
}

/** Puts the settings on <html> (classes + CSS variable read by index.css). */
export function applySupportProfile(p: SupportProfile = getSupportProfile()) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.style.setProperty("--ss-text-scale", String(p.textScale / 100));
  html.classList.toggle("ss-text-scaled", p.textScale !== 100);
  html.classList.toggle("ss-high-contrast", p.highContrast);
  html.classList.toggle("ss-wide-spacing", p.wideSpacing);
  html.classList.toggle("ss-soft-bg", p.softBackground);
  // the phone's own "remove animations" setting counts too, so students need not turn it on twice
  html.classList.toggle("ss-reduce-motion", p.reduceMotion || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export function useSupportProfile(): SupportProfile {
  const [p, setP] = useState(getSupportProfile);
  useEffect(() => {
    const on = (e: Event) => setP((e as CustomEvent<SupportProfile>).detail || getSupportProfile());
    const onStorage = (e: StorageEvent) => e.key === KEY && setP(getSupportProfile());
    window.addEventListener(SUPPORT_CHANGED, on);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SUPPORT_CHANGED, on);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return p;
}

/** True when the student asked for fewer effects (setting) or the device asks for it. */
export function prefersLessMotion(): boolean {
  if (getSupportProfile().reduceMotion) return true;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
