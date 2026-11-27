// Offline Vietnamese speech recognition (Vosk, Kaldi compiled to WebAssembly). Works in the browser, the
// desktop app and Android alike, with no network: the Web Speech API needs Google's servers and is missing
// in Electron and the Android WebView. Model: vosk-model-small-vn-0.4 (public/models/vosk-vn.tar.gz, 32 MB).
import { createModel, type Model } from "vosk-browser";
import { isSpeech, nextFloor } from "./gate";

const MODEL_URL = `${import.meta.env.BASE_URL}models/vosk-vn.tar.gz`;
let modelP: Promise<Model> | null = null;

export const loadSpeechModel = () =>
  (modelP ??= createModel(new URL(MODEL_URL, location.href).href).catch((e) => {
    modelP = null;
    throw e;
  }));

/** Recognises an already decoded clip (tests and self-checks). */
export async function recogniseBuffer(buf: AudioBuffer): Promise<string> {
  const model = await loadSpeechModel();
  const rec = new model.KaldiRecognizer(buf.sampleRate);
  const parts: string[] = [];
  // the worker answers asynchronously; the final result is the last "result" event
  const done = new Promise<void>((resolve) => {
    let quiet: ReturnType<typeof setTimeout>;
    rec.on("result", (m: any) => {
      if (m.result?.text) parts.push(m.result.text);
      clearTimeout(quiet);
      quiet = setTimeout(resolve, 400);
    });
    setTimeout(resolve, 15000);
  });
  rec.acceptWaveform(buf);
  rec.retrieveFinalResult();
  await done;
  rec.remove();
  return parts.join(" ").trim();
}

const WORKLET = `class P extends AudioWorkletProcessor {
  constructor() { super(); this.b = new Float32Array(4096); this.n = 0; }
  process(inputs) {
    const c = inputs[0] && inputs[0][0];
    if (c) for (let i = 0; i < c.length; i++) {
      this.b[this.n++] = c[i];
      if (this.n === 4096) { this.port.postMessage(this.b, [this.b.buffer]); this.b = new Float32Array(4096); this.n = 0; }
    }
    return true;
  }
}
registerProcessor("ss-mic", P);`;

export type Listener ={ stop(): void; mute(on: boolean): void; setVocabulary(words: string[]): void };

/** Listens to the microphone until stop(). Two recognisers hear the same audio: a free one (any sentence, for
 *  study questions) and one limited to a grammar (the wake call, commands and the words on screen), which
 *  is far more reliable for those. Each finished phrase goes to onText(free, grammar); either may be "".
 *  mute(true) drops audio, so the app does not hear its own voice while it answers. */
export async function listen(
  onText: (free: string, grammar: string) => void,
  onPartial?: (text: string) => void,
  /** Loudness of each ~0.25 s of mic audio (RMS, 0..1): lets the UI tell "the mic hears nothing" apart. */
  onLevel?: (rms: number) => void,
  grammar: string[] = [],
): Promise<Listener> {
  const model = await loadSpeechModel();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  // the model is trained on 16 kHz: let the browser resample the mic (better than Vosk resampling 48 kHz)
  const ctx = (() => { try { return new AudioContext({ sampleRate: 16000 }); } catch { return new AudioContext(); } })();
  // browsers keep audio suspended until the first tap or key press (the desktop app and Android do not)
  if (ctx.state === "suspended") {
    const wake = () => void ctx.resume().then(() => ctx.state === "running" && ["pointerdown", "keydown"].forEach((t) => removeEventListener(t, wake, true)));
    ["pointerdown", "keydown"].forEach((t) => addEventListener(t, wake, true));
    void ctx.resume();
  }

  // The two recognisers close a phrase at different moments (measured: often more than a second apart) and
  // one may cut it in two: join each side's pieces, and send the pair 0.3 s after both have answered, or
  // 2 s after the last piece if one side heard nothing.
  let pending: { free?: string; gram?: string } = {};
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  // Vosk turns any sound into words: a fan, or a voice from the next room, came out as "anh" and was
  // answered. Only phrases with a chunk clearly above the room's noise floor (a voice near the mic) count.
  // shortcut: fixed ratio/level, not measured on many mics; tune SPEECH_RATIO/SPEECH_MIN if quiet voices get dropped.
  let floor = 0;
  let loud = false;
  const flush = () => {
    clearTimeout(flushTimer);
    const { free = "", gram = "" } = pending;
    pending = {};
    const ok = loud;
    loud = false;
    if (ok && (free || gram)) onText(free, gram);
  };
  const got = (key: "free" | "gram", text: string) => {
    if (!text) return;
    pending[key] = pending[key] ? `${pending[key]} ${text}` : text;
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, pending.free !== undefined && pending.gram !== undefined ? 300 : 2000);
  };

  const rec = new model.KaldiRecognizer(ctx.sampleRate);
  rec.on("result", (m: any) => got("free", m.result?.text ?? ""));
  const makeGram = (words: string[]) => {
    const r = new model.KaldiRecognizer(ctx.sampleRate, JSON.stringify(words));
    r.on("result", (m: any) => got("gram", m.result?.text ?? ""));
    return r;
  };
  let gram = grammar.length ? makeGram(grammar) : null;

  // Vosk only closes a phrase after it hears noise-floor silence, which a quiet room or a muted mic may
  // never give; a partial that stays the same for ~1 s of audio is closed by hand. Counted in
  // audio chunks, not clock time, so a busy recogniser that lags behind never cuts a phrase in half.
  let last = "";
  let same = 0;
  rec.on("partialresult", (m: any) => {
    const p = m.result?.partial ?? "";
    onPartial?.(loud ? p : "");
    if (p !== last) return void ((last = p), (same = 0));
    if (p && ++same >= Math.ceil(ctx.sampleRate / 4096)) {
      last = "";
      same = 0;
      rec.retrieveFinalResult();
      gram?.retrieveFinalResult();
    }
  });
  const src = ctx.createMediaStreamSource(stream);
  // The audio thread collects 4096-sample chunks; the old ScriptProcessorNode ran on the main thread and
  // dropped audio whenever the page was busy, which garbled words ("mở trò chơi" -> "mới cho chế").
  await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" })));
  const node = new AudioWorkletNode(ctx, "ss-mic");
  let muted = false;
  node.port.onmessage = (e: MessageEvent<Float32Array>) => {
    if (muted) return;
    // a copy for the second recogniser: the chunk may be handed over (detached) to the worker
    gram?.acceptWaveformFloat(e.data.slice(), ctx.sampleRate);
    let s = 0;
    for (let i = 0; i < e.data.length; i++) s += e.data[i] * e.data[i];
    rec.acceptWaveformFloat(e.data, ctx.sampleRate);
    const rms = Math.sqrt(s / e.data.length);
    if (isSpeech(rms, floor)) loud = true;
    floor = nextFloor(rms, floor);
    onLevel?.(rms);
  };
  const sink = ctx.createGain();
  sink.gain.value = 0; // keeps the node pulled by the graph without playing the mic back
  src.connect(node);
  node.connect(sink).connect(ctx.destination);
  return {
    mute: (on) => void (muted = on),
    setVocabulary: (words) => {
      // let the old recogniser hand in the phrase it is hearing before it goes
      const old = gram;
      old?.retrieveFinalResult();
      setTimeout(() => old?.remove(), 2500);
      gram = makeGram(words);
    },
    stop: () => {
      clearTimeout(flushTimer);
      node.port.onmessage = null;
      node.disconnect();
      src.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      rec.remove();
      gram?.remove();
      void ctx.close();
    },
  };
}
