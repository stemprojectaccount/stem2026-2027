// Speech input for "Tra từ & Dịch": say a word to look it up, and pronunciation practice.
// Android app: @capacitor-community/speech-recognition (asks for the microphone on first use).
// Browsers: Web Speech API (Chrome / Edge). Windows app (Electron): not available – Electron has no
// speech service, so the 🎤 buttons are hidden there.
import { Capacitor } from "@capacitor/core";

export type SpeechLang = "en-US" | "vi-VN";

export class SpeechError extends Error {
  constructor(message: string, public denied = false) {
    super(message);
  }
}

const isElectron = () => typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);
type WebRecognition = {
  lang: string;
  maxAlternatives: number;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
const webCtor = (): (new () => WebRecognition) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return ((w.SpeechRecognition || w.webkitSpeechRecognition) as new () => WebRecognition) || null;
};

let availableCache: Promise<boolean> | null = null;
/** Can this device listen? (cached) */
export function speechAvailable(): Promise<boolean> {
  if (!availableCache) {
    availableCache = (async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
          return (await SpeechRecognition.available()).available;
        } catch {
          return false;
        }
      }
      return !isElectron() && !!webCtor();
    })();
  }
  return availableCache;
}

let current: { stop: () => void } | null = null;
export function stopListening() {
  current?.stop();
  current = null;
}

/** Listen once; resolves with what was heard (best guess first, up to 5 alternatives). */
export async function listenOnce(lang: SpeechLang, timeoutMs = 8000): Promise<string[]> {
  stopListening();
  if (Capacitor.isNativePlatform()) {
    const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
    let perm = await SpeechRecognition.checkPermissions();
    if (perm.speechRecognition !== "granted") perm = await SpeechRecognition.requestPermissions();
    if (perm.speechRecognition !== "granted") throw new SpeechError("Cần cho phép dùng micro để nói. Mở Cài đặt điện thoại → Ứng dụng → SmartStudy → Quyền → Micro.", true);
    current = { stop: () => void SpeechRecognition.stop().catch(() => {}) };
    try {
      const res = await Promise.race([
        SpeechRecognition.start({ language: lang, maxResults: 5, partialResults: false, popup: false, prompt: lang === "vi-VN" ? "Hãy nói…" : "Say it…" }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new SpeechError("Không nghe thấy gì. Bấm 🎤 và nói rõ hơn nhé.")), timeoutMs + 2000)),
      ]);
      const matches = (res as { matches?: string[] })?.matches || [];
      if (!matches.length) throw new SpeechError("Không nghe rõ. Thử nói lại chậm và rõ hơn nhé.");
      return matches;
    } catch (e) {
      if (e instanceof SpeechError) throw e;
      throw new SpeechError("Không nghe rõ. Thử nói lại chậm và rõ hơn nhé.");
    } finally {
      current = null;
    }
  }
  const Ctor = webCtor();
  if (!Ctor || isElectron()) throw new SpeechError("Thiết bị này chưa hỗ trợ nhận giọng nói.");
  return new Promise<string[]>((resolve, reject) => {
    const rec = new Ctor();
    rec.lang = lang;
    rec.maxAlternatives = 5;
    rec.interimResults = false;
    rec.continuous = false;
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      current = null;
      fn();
    };
    const timer = setTimeout(() => {
      rec.abort();
      finish(() => reject(new SpeechError("Không nghe thấy gì. Bấm 🎤 và nói rõ hơn nhé.")));
    }, timeoutMs);
    rec.onresult = (e) => {
      const r = e.results[0];
      const list: string[] = [];
      for (let i = 0; i < r.length; i++) list.push(r[i].transcript.trim());
      finish(() => resolve(list.filter(Boolean)));
    };
    rec.onerror = (e) =>
      finish(() =>
        reject(
          e.error === "not-allowed" || e.error === "service-not-allowed"
            ? new SpeechError("Cần cho phép dùng micro (biểu tượng ổ khoá trên thanh địa chỉ).", true)
            : e.error === "no-speech"
            ? new SpeechError("Không nghe thấy gì. Bấm 🎤 và nói rõ hơn nhé.")
            : e.error === "network"
            ? new SpeechError("Nhận giọng nói cần có mạng.")
            : new SpeechError("Không nghe rõ. Thử nói lại nhé.")
        )
      );
    rec.onend = () => finish(() => reject(new SpeechError("Không nghe thấy gì. Bấm 🎤 và nói rõ hơn nhé.")));
    current = { stop: () => rec.stop() };
    rec.start();
  });
}

// ---------- pronunciation check ----------
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[n];
}

export type PronunciationGrade = "good" | "close" | "retry";
/**
 * Compare what the recogniser heard with the target word. This only checks whether the machine
 * understood the right word – it does not score individual sounds.
 */
export function gradePronunciation(target: string, heard: string[]): { grade: PronunciationGrade; heard: string } {
  const t = norm(target);
  let best = { grade: "retry" as PronunciationGrade, heard: heard[0] || "", ratio: 1 };
  for (let i = 0; i < heard.length; i++) {
    const h = heard[i];
    const n = norm(h);
    if (!n) continue;
    // the target may be inside a longer phrase ("the key"); only the machine's first guess counts as "Chuẩn!"
    if (n === t || n.split(" ").includes(t) || n.replace(/ /g, "") === t.replace(/ /g, "")) return { grade: i === 0 ? "good" : "close", heard: h };
    const ratio = levenshtein(n, t) / Math.max(n.length, t.length);
    if (ratio < best.ratio) best = { grade: ratio <= 0.34 ? "close" : "retry", heard: h, ratio };
  }
  return { grade: best.grade, heard: best.heard };
}
