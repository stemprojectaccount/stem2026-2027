// English read-aloud for the dictionary.
// Order: ① the dictionary's real recording (mp3) ② the server's /api/dict/tts (natural AI voice, online only)
// ③ the device's own voice (Android: native TTS plugin, because speechSynthesis is unreliable in Android
// WebView; Windows/web: speechSynthesis). Only one sound plays at a time.
import { Capacitor } from "@capacitor/core";
import { apiUrl } from "../../lib/apiBase";
import { loudAudio } from "../../lib/loudAudio";

export type Accent = "us" | "uk";

let current: HTMLAudioElement | null = null;

export function stopAll() {
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

function playUrl(url: string, rate = 1, startMs = 0): Promise<boolean> {
  return new Promise((resolve) => {
    const a = loudAudio(url);
    a.playbackRate = rate;
    current = a;
    let settled = false;
    const done = (ok: boolean) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };
    a.onended = () => done(true);
    a.onerror = () => done(false);
    if (startMs) setTimeout(() => { if (!settled && a.currentTime === 0) { a.pause(); done(false); } }, startMs);
    a.play().then(() => setTimeout(() => done(true), 50)).catch(() => done(false));
  });
}

async function nativeSpeak(text: string, lang: string, slow: boolean): Promise<boolean> {
  try {
    const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
    await TextToSpeech.speak({ text, lang, rate: slow ? 0.6 : 0.95, pitch: 1, volume: 1, category: "playback" });
    return true;
  } catch {
    return false;
  }
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() || [];
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  const want = lang.toLowerCase();
  return voices.find((v) => norm(v.lang) === want && /natural|online|google/i.test(v.name)) || voices.find((v) => norm(v.lang) === want) || voices.find((v) => norm(v.lang).startsWith("en"));
}

function webSpeak(text: string, lang: string, slow: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve(false);
    const voice = pickVoice(lang);
    if (!voice) return resolve(false);
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = slow ? 0.65 : 0.95;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.speak(u);
    setTimeout(() => resolve(true), 8000);
  });
}

/** Speak an English word or sentence. `audio` = the dictionary recording for that accent, if any. */
export async function speak(text: string, opts: { accent?: Accent; slow?: boolean; audio?: string } = {}) {
  const accent = opts.accent || "us";
  const lang = accent === "uk" ? "en-GB" : "en-US";
  const slow = !!opts.slow;
  stopAll();
  if (opts.audio && (await playUrl(opts.audio, slow ? 0.7 : 1))) return;
  if (navigator.onLine !== false) {
    const url = apiUrl(`/api/dict/tts?text=${encodeURIComponent(text.slice(0, 400))}&lang=${lang}&slow=${slow ? 1 : 0}`);
    if (await playUrl(url, 1, 8000)) return;
    if (!current) return; // stopped by a newer speak()
    current = null;
  }
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    await nativeSpeak(text, lang, slow);
  } else {
    await webSpeak(text, lang, slow);
  }
}

// Voices load asynchronously in Chromium: warm the list once
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  } catch {
    // ignore
  }
}
