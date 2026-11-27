// Right / wrong / done signals that do not depend on hearing: a coloured frame with a big
// ✓ or ✗ (FeedbackFlash) and a vibration pattern. Pages call signalFeedback(); nothing happens
// unless the student turned the matching option on in "Hỗ trợ học tập".
import { getSupportProfile } from "./profile";
import { speakVi } from "../../features/tools/conversation/speakVi";

export type FeedbackKind = "correct" | "wrong" | "done";
export const FEEDBACK_EVENT = "smartstudy-feedback";

// Distinct rhythms so the meaning can be felt without looking: 1 short = right,
// 2 longer = wrong, 3 short + 1 long = finished.
const VIBRATION: Record<FeedbackKind, number[]> = {
  correct: [70],
  wrong: [160, 90, 160],
  done: [60, 60, 60, 60, 60, 60, 220],
};

const SPOKEN: Record<FeedbackKind, string> = { correct: "Đúng rồi!", wrong: "Chưa đúng.", done: "Hoàn thành!" };

/** `spoken`: what to say instead of the plain label when read-aloud is on (e.g. the right answer). */
export function signalFeedback(kind: FeedbackKind, spoken?: string) {
  const p = getSupportProfile();
  // students who listen instead of looking ("Nghe thay nhìn", "Vừa nghe vừa đọc") hear the result too
  if (p.readAloud) void speakVi(spoken || SPOKEN[kind]);
  if (p.visualFeedback) {
    window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: kind }));
  }
  if (p.vibration) {
    try {
      navigator.vibrate?.(VIBRATION[kind]);
    } catch {
      // not supported (desktop, iPhone browsers)
    }
  }
}

export function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}
