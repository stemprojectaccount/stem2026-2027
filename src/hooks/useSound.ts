
import { useCallback, useRef } from 'react';

type SoundType = 'click' | 'flip' | 'fusion_charging' | 'success' | 'fail';

export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: SoundType) => {
    // Phương pháp 1: HTML5 Audio (với placeholder URL theo yêu cầu)
    // Các đường dẫn dưới đây là placeholder, bạn có thể thay thế bằng file mp3/wav thật.
    const audioFiles: Record<SoundType, string> = {
      click: '/sounds/click.mp3',
      flip: '/sounds/flip.mp3',
      fusion_charging: '/sounds/charging.mp3',
      success: '/sounds/success.mp3',
      fail: '/sounds/fail.mp3'
    };
    
    // Thử sử dụng Audio API tiêu chuẩn (HTML5 Audio)
    try {
      const audio = new Audio(audioFiles[type]);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Autoplay bị chặn bởi trình duyệt, fallback sang Web Audio API/Synth:", error);
          playSynthFallback(type);
        });
      }
    } catch (e) {
      console.warn("Lỗi khi dùng HTML5 Audio:", e);
      playSynthFallback(type);
    }
  }, []);

  const playSynthFallback = (type: SoundType) => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const gainNode = ctx.createGain();

      if (type === 'click') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'flip') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'fusion_charging') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 1.5);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      } else if (type === 'success') {
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
          g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.12 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.65);
        });
        return; 
      } else if (type === 'fail') {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }

      gainNode.connect(ctx.destination);
    } catch (err) {
      console.warn("Audio blocked or not supported:", err);
    }
  };

  return { playSound };
}
