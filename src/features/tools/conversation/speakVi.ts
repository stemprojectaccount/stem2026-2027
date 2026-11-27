// Vietnamese read-aloud (conversation board, "Nghe câu hỏi", first-run question).
// Order: the server's natural AI voice (/api/podcast-tts, HoaiMy) → Android native TTS → the device's
// speechSynthesis voice (vi-VN), so it still talks offline. Resolves false when nothing could speak.
import { Capacitor } from "@capacitor/core";
import { apiUrl } from "../../../lib/apiBase";
import { loudAudio } from "../../../lib/loudAudio";

let current: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (current) {
    current.pause();
    current = null;
  }
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // ignore
  }
}

function webVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() || [];
  return voices.find((v) => /^vi([-_]|$)/i.test(v.lang));
}

function webSpeak(text: string, rate = 1): Promise<boolean> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve(false);
    const voice = webVoice();
    if (!voice) return resolve(false);
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.95 * rate;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.speak(u);
    setTimeout(() => resolve(true), 15000);
  });
}

// the server may retry the AI voice a few times; past this it is treated as unreachable
const SERVER_START_MS = 20_000;

const viTtsUrl = (text: string) => apiUrl(`/api/podcast-tts?speaker=Lan&slow=0&text=${encodeURIComponent(text.trim().slice(0, 600))}`);

/** Asks the server for the AI voice ahead of time (it caches the audio), so a later speakVi(text) starts at once. */
export function prefetchVi(text: string) {
  if (!text.trim() || navigator.onLine === false) return;
  void fetch(viTtsUrl(text)).catch(() => undefined);
}

function serverSpeak(text: string, rate = 1): Promise<boolean> {
  return new Promise((resolve) => {
    const a = loudAudio(viTtsUrl(text));
    a.playbackRate = rate;
    current = a;
    let started = false;
    const giveUp = window.setTimeout(() => {
      if (started) return;
      a.pause();
      resolve(false);
    }, SERVER_START_MS);
    a.onplaying = () => { started = true; window.clearTimeout(giveUp); };
    a.onended = () => resolve(true);
    a.onerror = () => { window.clearTimeout(giveUp); resolve(started); };
    a.play().catch(() => { window.clearTimeout(giveUp); resolve(false); });
  });
}

/** `rate`: 1 = normal speed (the lesson reader passes its speed slider). */
export async function speakVi(text: string, rate = 1): Promise<boolean> {
  const t = text.trim();
  if (!t) return false;
  stopSpeaking();
  if (navigator.onLine !== false) {
    const parts = pieces(t);
    let i = 0;
    for (; i < parts.length; i++) {
      if (i + 1 < parts.length) prefetchVi(parts[i + 1]);
      if (!(await serverSpeak(parts[i], rate))) break;
      if (!current) return true; // stopped mid-way
    }
    if (i === parts.length) return true;
    if (!current) return false; // stopSpeaking() ran while the AI voice was loading
    current = null;
    return deviceSpeak(parts.slice(i).join(" "), rate);
  }
  return deviceSpeak(t, rate);
}

/** Sentence-sized pieces of at most ~500 characters (the server request carries 600 at most). */
function pieces(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (const s of text.match(/[^.!?…\n]+[.!?…]*\s*/g) || [text]) {
    if (cur && (cur + s).length > 500) { out.push(cur.trim()); cur = ""; }
    cur += s.length > 500 ? s.slice(0, 500) : s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function deviceSpeak(t: string, rate = 1): Promise<boolean> {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    try {
      const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
      await TextToSpeech.speak({ text: t, lang: "vi-VN", rate: 0.95 * rate, pitch: 1, volume: 1, category: "playback" });
      return true;
    } catch {
      // fall through
    }
  }
  return webSpeak(t, rate);
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.getVoices();
  } catch {
    // ignore
  }
}
