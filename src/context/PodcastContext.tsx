import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { apiUrl } from "../lib/apiBase";
import { loudAudio } from "../lib/loudAudio";
import { PodcastEpisode, PodcastDialogueLine } from "../types";
import { SAMPLE_PODCAST_EPISODES } from "../data/podcasts";

export interface PodcastListeningDayPoint {
  dateKey: string;
  dateLabel: string;
  dailyMinutes: number;
  cumulativeMinutes: number;
}

interface PodcastContextType {
  episodes: PodcastEpisode[];
  currentEpisode: PodcastEpisode | null;
  isPlaying: boolean;
  currentLineIndex: number;
  playbackSpeed: number;
  hasSpeechSupport: boolean;
  hasVietnameseVoice: boolean;
  availableVoices: SpeechSynthesisVoice[];
  listeningHistory30Days: PodcastListeningDayPoint[];
  totalCumulativeMinutes30Days: number;
  monthlyListeningGoalMinutes: number;
  // Actions
  playEpisode: (episode: PodcastEpisode, startLine?: number) => void;
  pauseEpisode: () => void;
  resumeEpisode: () => void;
  togglePlayPause: () => void;
  seekToLine: (lineIndex: number) => void;
  skipNextLine: () => void;
  skipPreviousLine: () => void;
  setSpeed: (speed: number) => void;
  closePlayer: () => void;
  addEpisode: (episode: PodcastEpisode) => void;
  deleteEpisode: (id: string) => void;
  toggleFavorite: (id: string) => void;
  markEpisodeCompleted: (id: string) => void;
  setMonthlyListeningGoalMinutes: (goal: number) => void;
  recordListeningMinutes: (minutesToAdd: number) => void;
}

const PodcastContext = createContext<PodcastContextType | null>(null);

export function PodcastProvider({ 
  children,
  onRewardXP
}: { 
  children: React.ReactNode;
  onRewardXP?: (xp: number, coins: number, episodeTitle: string) => void;
}) {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>(() => {
    try {
      const saved = localStorage.getItem("smart_study_podcasts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SAMPLE_PODCAST_EPISODES;
  });

  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  // Mặc định tốc độ chậm (0.75x) giúp người học nghe tiếng Việt rõ từng chữ, dễ thấm kiến thức
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.75);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean>(true);

  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Mục tiêu tổng thời lượng nghe Podcast trong 30 ngày (mặc định 120 phút)
  const [monthlyListeningGoalMinutes, setMonthlyListeningGoalState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("smart_study_podcast_30d_goal_v1");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 30) return parsed;
      }
    } catch {}
    return 120;
  });

  const setMonthlyListeningGoalMinutes = useCallback((goal: number) => {
    const validGoal = Math.max(30, goal);
    setMonthlyListeningGoalState(validGoal);
    try {
      localStorage.setItem("smart_study_podcast_30d_goal_v1", String(validGoal));
    } catch {}
  }, []);

  // Lưu trữ số phút nghe theo từng ngày (YYYY-MM-DD -> minutes) trong 30 ngày qua
  const [dailyListeningMap, setDailyListeningMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("smart_study_podcast_daily_minutes_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {}

    // Khởi tạo dữ liệu mẫu hợp lý cho 30 ngày gần nhất (Mẫu minh họa lịch sử nghe)
    const seeded: Record<string, number> = {};
    const today = new Date();
    const pattern = [
      2, 0, 4, 3, 0, 5, 0, 4, 3, 2,
      0, 5, 4, 0, 3, 6, 0, 4, 5, 0,
      3, 4, 2, 0, 5, 4, 3, 5, 4, 5
    ];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDateKey(d);
      seeded[key] = pattern[29 - i] ?? 0;
    }
    try {
      localStorage.setItem("smart_study_podcast_daily_minutes_v1", JSON.stringify(seeded));
    } catch {}
    return seeded;
  });

  const recordListeningMinutes = useCallback((minutesToAdd: number) => {
    if (minutesToAdd <= 0) return;
    const todayKey = formatDateKey(new Date());
    setDailyListeningMap((prev) => {
      const currentVal = prev[todayKey] || 0;
      const updatedVal = Math.round((currentVal + minutesToAdd) * 10) / 10;
      const next = { ...prev, [todayKey]: updatedVal };
      try {
        localStorage.setItem("smart_study_podcast_daily_minutes_v1", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Tự động cộng dồn thời gian nghe thực tế khi đang phát Podcast (mỗi 6 giây = +0.1 phút)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      recordListeningMinutes(0.1);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying, recordListeningMinutes]);

  // Tính chuỗi dữ liệu lũy kế 30 ngày gần nhất cho biểu đồ Recharts & thanh tiến trình
  const listeningHistory30Days: PodcastListeningDayPoint[] = React.useMemo(() => {
    const result: PodcastListeningDayPoint[] = [];
    const today = new Date();
    let runningTotal = 0;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDateKey(d);
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const daily = Math.round((dailyListeningMap[key] || 0) * 10) / 10;
      runningTotal = Math.round((runningTotal + daily) * 10) / 10;
      result.push({
        dateKey: key,
        dateLabel: label,
        dailyMinutes: daily,
        cumulativeMinutes: runningTotal
      });
    }
    return result;
  }, [dailyListeningMap]);

  const totalCumulativeMinutes30Days =
    listeningHistory30Days.length > 0
      ? listeningHistory30Days[listeningHistory30Days.length - 1].cumulativeMinutes
      : 0;

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("smart_study_podcasts", JSON.stringify(episodes));
    } catch {}
  }, [episodes]);

  // Voice detection & Audio cleanup
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lineAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSpeakTokenRef = useRef<number>(0);

  const stopAllAudio = useCallback(() => {
    activeSpeakTokenRef.current += 1;
    if (lineAdvanceTimerRef.current) {
      clearTimeout(lineAdvanceTimerRef.current);
      lineAdvanceTimerRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  // Luôn hỗ trợ giọng Tiếng Việt nhờ kết hợp Cloud Vietnamese TTS (/api/podcast-tts) + Web Speech API
  const hasVietnameseVoice = true;

  // Keep ref for current state in callbacks
  const currentLineRef = useRef<number>(0);
  currentLineRef.current = currentLineIndex;

  const currentEpisodeRef = useRef<PodcastEpisode | null>(null);
  currentEpisodeRef.current = currentEpisode;

  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  const speedRef = useRef<number>(playbackSpeed);
  speedRef.current = playbackSpeed;

  // Chuẩn hóa ký hiệu Toán/Lý/Hóa sang lời đọc tiếng Việt tự nhiên
  const formatSpeechTextForVietnamese = useCallback((raw: string): string => {
    return (raw || "")
      .replace(/\$\$([\s\S]*?)\$\$/g, " $1 ")
      .replace(/\$([^$]+)\$/g, " $1 ")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 phần $2")
      .replace(/\\sqrt\{([^}]+)\}/g, "căn bậc hai của $1")
      .replace(/\^2\b/g, " bình phương")
      .replace(/\^3\b/g, " lập phương")
      .replace(/\^(\d+)/g, " mũ $1")
      .replace(/\\times|\*/g, " nhân ")
      .replace(/\\div/g, " chia ")
      .replace(/\\pi/gi, " pi ")
      .replace(/>=/g, " lớn hơn hoặc bằng ")
      .replace(/<=/g, " nhỏ hơn hoặc bằng ")
      .replace(/!=/g, " khác ")
      .replace(/=/g, " bằng ")
      .replace(/\+/g, " cộng ")
      .replace(/%/g, " phần trăm ")
      .replace(/\bXP\b/gi, " điểm kinh nghiệm ")
      .replace(/[*_#`~>\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  // Speak a specific line with Vietnamese Cloud TTS + Web Speech fallback at a calm medium-slow pace
  const speakLine = useCallback((episode: PodcastEpisode, lineIdx: number) => {
    stopAllAudio();
    const myToken = activeSpeakTokenRef.current;

    if (lineIdx < 0 || lineIdx >= episode.dialogue.length) {
      setIsPlaying(false);
      if (lineIdx >= episode.dialogue.length) {
        markEpisodeCompleted(episode.id);
        if (onRewardXP && !episode.listened) {
          onRewardXP(episode.xpReward || 15, 5, episode.title);
        }
      }
      return;
    }

    const line: PodcastDialogueLine = episode.dialogue[lineIdx];
    const spokenText = formatSpeechTextForVietnamese(line.text);

    // Pre-fetch next dialogue line in background for instant transition
    if (lineIdx + 1 < episode.dialogue.length) {
      const nextLine = episode.dialogue[lineIdx + 1];
      const nextText = formatSpeechTextForVietnamese(nextLine.text);
      const prefetchUrl = apiUrl(`/api/podcast-tts?text=${encodeURIComponent(nextText)}&speaker=${encodeURIComponent(nextLine.speaker)}&slow=1`);
      fetch(prefetchUrl).catch(() => {});
    }

    const advanceToNextLine = () => {
      if (myToken !== activeSpeakTokenRef.current || !isPlayingRef.current) return;
      const nextIdx = lineIdx + 1;
      if (nextIdx < episode.dialogue.length) {
        setCurrentLineIndex(nextIdx);
        // Nghỉ nhịp tự nhiên (420ms) giữa hai lượt đối thoại của Minh và Lan
        lineAdvanceTimerRef.current = setTimeout(() => {
          if (myToken === activeSpeakTokenRef.current && isPlayingRef.current) {
            speakLine(episode, nextIdx);
          }
        }, 420);
      } else {
        setIsPlaying(false);
        setCurrentLineIndex(episode.dialogue.length - 1);
        markEpisodeCompleted(episode.id);
        if (onRewardXP && !episode.listened) {
          onRewardXP(episode.xpReward || 15, 5, episode.title);
        }
      }
    };

    const speakWithBrowserFallback = () => {
      if (myToken !== activeSpeakTokenRef.current || !isPlayingRef.current) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        const wordCount = spokenText.split(/\s+/).length;
        const estDuration = Math.max(2200, (wordCount / 2.4) * 1000);
        lineAdvanceTimerRef.current = setTimeout(advanceToNextLine, estDuration);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch {}

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utteranceRef.current = utterance;
      utterance.lang = "vi-VN";
      // Tốc độ đọc chậm vừa phải, rõ chữ (hỗ trợ từ 0.5x)
      const effectiveRate = Math.max(0.45, Math.min(1.4, (line.speaker === "Minh" ? 0.96 : 1.0) * speedRef.current));
      utterance.rate = effectiveRate;
      utterance.pitch = line.speaker === "Minh" ? 0.94 : 1.12;

      const viVoices = availableVoices.filter(v => v.lang.toLowerCase().includes("vi"));
      if (viVoices.length > 0) {
        if (line.speaker === "Minh") {
          const maleVoice =
            viVoices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("nam") || v.name.toLowerCase().includes("minh")) ||
            viVoices[0];
          utterance.voice = maleVoice;
        } else {
          const femaleVoice =
            viVoices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("nu") || v.name.toLowerCase().includes("nữ") || v.name.toLowerCase().includes("hoaimy") || v.name.toLowerCase().includes("linh")) ||
            viVoices[viVoices.length - 1];
          utterance.voice = femaleVoice;
        }
      }

      utterance.onend = () => {
        advanceToNextLine();
      };

      utterance.onerror = () => {
        if (myToken !== activeSpeakTokenRef.current || !isPlayingRef.current) return;
        const wordCount = spokenText.split(/\s+/).length;
        const estDuration = Math.max(2200, (wordCount / 2.4) * 1000);
        lineAdvanceTimerRef.current = setTimeout(advanceToNextLine, estDuration);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Ưu tiên phát qua luồng âm thanh Tiếng Việt chuẩn (/api/podcast-tts) với tốc độ chậm vừa phải
    try {
      const ttsUrl = apiUrl(`/api/podcast-tts?text=${encodeURIComponent(spokenText)}&speaker=${encodeURIComponent(line.speaker)}&slow=1`);
      const audio = loudAudio(ttsUrl);
      audioRef.current = audio;
      audio.preload = "auto";
      (audio as any).preservesPitch = true;
      (audio as any).mozPreservesPitch = true;
      (audio as any).webkitPreservesPitch = true;

      // Điều chỉnh nhịp đọc chậm theo lựa chọn của người dùng (0.5x, 0.75x, 1x)
      const speakerFactor = line.speaker === "Minh" ? 0.98 : 1.02;
      audio.playbackRate = Math.max(0.45, Math.min(1.5, speedRef.current * speakerFactor));

      audio.onloadedmetadata = () => {
        if (audioRef.current === audio) {
          audio.playbackRate = Math.max(0.45, Math.min(1.5, speedRef.current * speakerFactor));
        }
      };

      audio.onended = () => {
        advanceToNextLine();
      };

      audio.onerror = () => {
        speakWithBrowserFallback();
      };

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          speakWithBrowserFallback();
        });
      }
    } catch {
      speakWithBrowserFallback();
    }
  }, [availableVoices, formatSpeechTextForVietnamese, onRewardXP, stopAllAudio]);

  // Update MediaSession
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (currentEpisode) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentEpisode.title,
        artist: "Minh và Lan · SmartStudy Podcast",
        album: `${currentEpisode.subject} - ${currentEpisode.grade}`,
        artwork: [
          { src: "/favicon.ico", sizes: "96x96", type: "image/x-icon" }
        ]
      });

      navigator.mediaSession.setActionHandler("play", () => resumeEpisode());
      navigator.mediaSession.setActionHandler("pause", () => pauseEpisode());
      navigator.mediaSession.setActionHandler("previoustrack", () => skipPreviousLine());
      navigator.mediaSession.setActionHandler("nexttrack", () => skipNextLine());
    }
  }, [currentEpisode]);

  const playEpisode = (episode: PodcastEpisode, startLine: number = 0) => {
    setCurrentEpisode(episode);
    setCurrentLineIndex(startLine);
    setIsPlaying(true);
    isPlayingRef.current = true;
    speakLine(episode, startLine);
  };

  const pauseEpisode = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    stopAllAudio();
  };

  const resumeEpisode = () => {
    if (!currentEpisode) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    speakLine(currentEpisode, currentLineIndex);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseEpisode();
    } else {
      resumeEpisode();
    }
  };

  const seekToLine = (lineIndex: number) => {
    if (!currentEpisode) return;
    const bounded = Math.max(0, Math.min(lineIndex, currentEpisode.dialogue.length - 1));
    setCurrentLineIndex(bounded);
    currentLineRef.current = bounded;
    if (isPlaying) {
      speakLine(currentEpisode, bounded);
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      speakLine(currentEpisode, bounded);
    }
  };

  const skipNextLine = () => {
    if (!currentEpisode) return;
    seekToLine(currentLineIndex + 1);
  };

  const skipPreviousLine = () => {
    if (!currentEpisode) return;
    seekToLine(currentLineIndex - 1);
  };

  const setSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    speedRef.current = speed;
    if (audioRef.current && !audioRef.current.paused) {
      const currentSpeaker = currentEpisode?.dialogue[currentLineIndex]?.speaker || "Lan";
      const speakerFactor = currentSpeaker === "Minh" ? 0.98 : 1.02;
      audioRef.current.playbackRate = Math.max(0.45, Math.min(1.5, speed * speakerFactor));
    } else if (isPlaying && currentEpisode) {
      speakLine(currentEpisode, currentLineIndex);
    }
  };

  const closePlayer = () => {
    pauseEpisode();
    setCurrentEpisode(null);
    setCurrentLineIndex(0);
  };

  const addEpisode = (newEp: PodcastEpisode) => {
    setEpisodes(prev => [newEp, ...prev]);
  };

  const deleteEpisode = (id: string) => {
    if (currentEpisode?.id === id) {
      closePlayer();
    }
    setEpisodes(prev => prev.filter(e => e.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setEpisodes(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e));
    if (currentEpisode?.id === id) {
      setCurrentEpisode(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const markEpisodeCompleted = (id: string) => {
    setEpisodes(prev => {
      const target = prev.find(e => e.id === id);
      if (target && !target.listened) {
        recordListeningMinutes(Math.max(1, Math.round((target.durationMinutes || 4) * 0.5)));
      }
      return prev.map(e => e.id === id ? { ...e, listened: true } : e);
    });
    if (currentEpisode?.id === id) {
      setCurrentEpisode(prev => prev ? { ...prev, listened: true } : null);
    }
  };

  return (
    <PodcastContext.Provider value={{
      episodes,
      currentEpisode,
      isPlaying,
      currentLineIndex,
      playbackSpeed,
      hasSpeechSupport,
      hasVietnameseVoice,
      availableVoices,
      listeningHistory30Days,
      totalCumulativeMinutes30Days,
      monthlyListeningGoalMinutes,
      playEpisode,
      pauseEpisode,
      resumeEpisode,
      togglePlayPause,
      seekToLine,
      skipNextLine,
      skipPreviousLine,
      setSpeed,
      closePlayer,
      addEpisode,
      deleteEpisode,
      toggleFavorite,
      markEpisodeCompleted,
      setMonthlyListeningGoalMinutes,
      recordListeningMinutes
    }}>
      {children}
    </PodcastContext.Provider>
  );
}

export function usePodcast() {
  const context = useContext(PodcastContext);
  if (!context) {
    throw new Error("usePodcast must be used within a PodcastProvider");
  }
  return context;
}
