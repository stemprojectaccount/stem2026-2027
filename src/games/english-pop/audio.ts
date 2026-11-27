// Sound effects (synthesised) and background music for English Pop & Learn.
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  // One shared context: creating one per beep exhausts the browser's limit on phones
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

export const playTone = (frequency: number, type: OscillatorType, duration: number, volume = 0.5) => {
  const ctx = getCtx();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
};

const BGM_PREF_KEY = "english_pop_bgm_enabled";
let bgmAudio: HTMLAudioElement | null = null;
let bgmPreferredEnabled = (() => {
  try {
    return localStorage.getItem(BGM_PREF_KEY) !== "false";
  } catch {
    return true;
  }
})();

export const playBGM = (force = false) => {
  if (!bgmPreferredEnabled && !force) return;
  if (!bgmAudio) {
    bgmAudio = new Audio("/games/english-pop/bgm.mp3");
    bgmAudio.loop = true;
    bgmAudio.volume = 0.4;
  }
  if (bgmAudio.paused) {
    bgmAudio.play().catch(() => {
      // Autoplay blocked until the next user gesture
    });
  }
};

export const stopBGM = () => {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }
};

export const isBGMPlaying = (): boolean => (bgmAudio ? !bgmAudio.paused : false);
export const getBGMPreference = (): boolean => bgmPreferredEnabled;

export const toggleBGM = (): boolean => {
  bgmPreferredEnabled = !bgmPreferredEnabled;
  try {
    localStorage.setItem(BGM_PREF_KEY, String(bgmPreferredEnabled));
  } catch {
    // ignore
  }
  if (bgmPreferredEnabled) playBGM(true);
  else bgmAudio?.pause();
  return bgmPreferredEnabled;
};

export const playPopSound = () => {
  playTone(600, "sine", 0.1, 0.3);
  setTimeout(() => playTone(800, "sine", 0.15, 0.2), 50);
};

export const playCorrectSound = () => {
  playTone(400, "sine", 0.1, 0.3);
  setTimeout(() => playTone(600, "sine", 0.1, 0.3), 100);
  setTimeout(() => playTone(800, "sine", 0.3, 0.3), 200);
};

export const playIncorrectSound = () => {
  playTone(300, "triangle", 0.2, 0.25);
  setTimeout(() => playTone(250, "triangle", 0.3, 0.2), 200);
};

export const playStartSound = () => {
  playTone(440, "square", 0.1, 0.2);
  setTimeout(() => playTone(554, "square", 0.1, 0.2), 100);
  setTimeout(() => playTone(659, "square", 0.1, 0.2), 200);
  setTimeout(() => playTone(880, "square", 0.4, 0.2), 300);
};

export const playEndSound = () => {
  playTone(880, "triangle", 0.2, 0.3);
  setTimeout(() => playTone(784, "triangle", 0.2, 0.3), 200);
  setTimeout(() => playTone(698, "triangle", 0.2, 0.3), 400);
  setTimeout(() => playTone(659, "triangle", 0.6, 0.3), 600);
};
