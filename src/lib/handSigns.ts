// Hand signs in front of the camera, recognised on the device with MediaPipe's gesture recogniser (files in
// public/mediapipe and public/models/gesture_recognizer.task, so it works offline). These are simple control
// gestures, not Vietnamese Sign Language: VSL needs deaf signers and teachers to review it.
export type Sign = "1" | "2" | "3" | "4" | "up" | "down" | "palm" | "ily";

export const SIGN_ACTIONS: Record<Sign, { emoji: string; label: string; speak?: string }> = {
  "1": { emoji: "☝️", label: "Chọn A" },
  "2": { emoji: "✌️", label: "Chọn B" },
  "3": { emoji: "3️⃣", label: "Chọn C" },
  "4": { emoji: "4️⃣", label: "Chọn D" },
  up: { emoji: "👍", label: "Em hiểu rồi", speak: "Em hiểu rồi ạ." },
  down: { emoji: "👎", label: "Em chưa hiểu", speak: "Em chưa hiểu, thầy cô giảng lại giúp em ạ." },
  palm: { emoji: "✋", label: "Em muốn hỏi", speak: "Em muốn hỏi ạ." },
  ily: { emoji: "🤟", label: "Cảm ơn", speak: "Em cảm ơn ạ." },
};

type Pt = { x: number; y: number };

/** Fingers held up (index to pinky): a finger is up when its tip is above its middle joint. The thumb is
 *  left out on purpose, it sticks out sideways for most people even when "folded". */
export function fingersUp(lm: Pt[]): number {
  return [[8, 6], [12, 10], [16, 14], [20, 18]].filter(([tip, pip]) => lm[tip].y < lm[pip].y).length;
}

/** One frame's sign from MediaPipe's gesture name, its score and the 21 hand landmarks; null = nothing. */
export function signOf(gesture: string | undefined, score: number, lm: Pt[] | undefined): Sign | null {
  if (!lm || lm.length < 21) return null;
  if (score >= 0.6) {
    if (gesture === "Thumb_Up") return "up";
    if (gesture === "Thumb_Down") return "down";
    if (gesture === "Open_Palm") return "palm";
    if (gesture === "ILoveYou") return "ily";
    if (gesture === "Closed_Fist") return null;
  }
  // "Pointing_Up", "Victory" and "None" (3 or 4 fingers): count the fingers
  const n = fingersUp(lm);
  return n >= 1 && n <= 4 ? (String(n) as Sign) : null;
}

/** Turns per-frame signs into actions: a sign fires once after it is held for `hold` frames, and again only
 *  after the hand changes. */
export function makeDebouncer(hold = 6) {
  let last: Sign | null = null;
  let count = 0;
  let fired = false;
  return (s: Sign | null): Sign | null => {
    if (s !== last) {
      last = s;
      count = 0;
      fired = false;
    }
    if (!s || fired) return null;
    if (++count >= hold) {
      fired = true;
      return s;
    }
    return null;
  };
}

let recognizerP: Promise<import("@mediapipe/tasks-vision").GestureRecognizer> | null = null;

export function loadRecognizer() {
  return (recognizerP ??= (async () => {
    const { FilesetResolver, GestureRecognizer } = await import("@mediapipe/tasks-vision");
    const base = new URL(import.meta.env.BASE_URL, location.href).href;
    const files = await FilesetResolver.forVisionTasks(base + "mediapipe");
    const opts = (delegate: "GPU" | "CPU") => ({
      baseOptions: { modelAssetPath: base + "models/gesture_recognizer.task", delegate },
      runningMode: "VIDEO" as const,
      numHands: 1,
    });
    // GPU is faster but missing on some old phones and WebViews
    return GestureRecognizer.createFromOptions(files, opts("GPU")).catch(() => GestureRecognizer.createFromOptions(files, opts("CPU")));
  })().catch((e) => {
    recognizerP = null;
    throw e;
  }));
}
