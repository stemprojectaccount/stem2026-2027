// Louder playback for every <audio>/new Audio() in the app (voices, podcast, recordings, sound effects):
// ① left+right are mixed to mono and sent to both speakers, so a phone with one broken speaker still hears
//   everything; ② a compressor + makeup gain lifts quiet speech ~10 dB; ③ a fast limiter keeps peaks from
//   distorting. Speech from the device's own voice (speechSynthesis / Android TTS) cannot be routed here.
//
// Safety: a media element routed into Web Audio is silent if the AudioContext is suspended or the file is
// cross-origin without CORS. So an element is only routed when the context is already running (unlocked by
// a tap/key) and its source is same-origin, blob/data, or loaded with crossOrigin (see loudAudio()).

import { getSupportProfile, SUPPORT_CHANGED, type SupportProfile } from "./support/profile";

let ctx: AudioContext | null = null;
/** Elements made by loudAudio() carry speech; "Yên tĩnh" mutes every other sound but never these. */
const voices = new WeakSet<HTMLMediaElement>();
let quiet = false;
let input: AudioNode | null = null;
const routed = new WeakSet<HTMLMediaElement>();

/** The processing chain; exported so it can be checked offline (scratch test renders a tone through it). */
export function buildLoudChain(c: BaseAudioContext, out: AudioNode): AudioNode {
  const mono = c.createGain();
  mono.channelCount = 1;
  mono.channelCountMode = "explicit";
  mono.channelInterpretation = "speakers";
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -30;
  comp.knee.value = 10;
  comp.ratio.value = 6;
  comp.attack.value = 0.005;
  comp.release.value = 0.2;
  const makeup = c.createGain();
  makeup.gain.value = 3.2;
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -1.5;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;
  mono.connect(comp).connect(makeup).connect(limiter).connect(out);
  return mono;
}

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      input = buildLoudChain(ctx, ctx.destination);
    } catch {
      ctx = null;
      return;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
}

function routable(el: HTMLMediaElement): boolean {
  const src = el.currentSrc || el.src;
  if (!src) return false;
  if (src.startsWith("blob:") || src.startsWith("data:")) return true;
  try {
    return new URL(src, location.href).origin === location.origin || el.crossOrigin != null;
  } catch {
    return false;
  }
}

/** new Audio(url), but our own /api audio on another origin (the Android app) is loaded with CORS so it can be boosted. */
export function loudAudio(url: string): HTMLAudioElement {
  const a = new Audio();
  try {
    const u = new URL(url, location.href);
    if (u.origin !== location.origin && u.pathname.startsWith("/api/")) a.crossOrigin = "anonymous";
  } catch {
    // leave as is
  }
  a.src = url;
  voices.add(a);
  return a;
}

export function installLoudAudio() {
  if (typeof window === "undefined" || typeof HTMLMediaElement === "undefined") return;
  // browsers only start audio after a user gesture: create/resume the context on the first tap or key
  window.addEventListener("pointerdown", ensureCtx, { capture: true });
  window.addEventListener("keydown", ensureCtx, { capture: true });
  quiet = getSupportProfile().quietSounds;
  window.addEventListener(SUPPORT_CHANGED, (e) => {
    quiet = !!((e as CustomEvent<SupportProfile>).detail ?? getSupportProfile()).quietSounds;
  });
  // synthesized beeps (games, Pomodoro, arena) are oscillators: silence them in quiet mode
  if (typeof OscillatorNode !== "undefined") {
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (this: OscillatorNode, ...args: Parameters<OscillatorNode["start"]>) {
      if (quiet) {
        try {
          this.disconnect();
        } catch {
          // not connected
        }
      }
      return start.apply(this, args);
    };
  }
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    // muted rather than skipped, so code waiting for "ended" still moves on
    if (quiet && !voices.has(this)) this.muted = true;
    if (ctx && input && ctx.state === "running" && !routed.has(this) && this instanceof HTMLAudioElement && routable(this)) {
      try {
        ctx.createMediaElementSource(this).connect(input);
        routed.add(this);
      } catch {
        // already attached elsewhere or not allowed: play unboosted
      }
    }
    return play.call(this);
  };
}
