// English Pop & Learn: pop falling balloons with your hand (camera) or finger/mouse, then
// translate the English word. Original game design by the author; integrated into SmartStudy
// with curriculum-based, non-repeating AI questions served by /api/game-questions.
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, Palette, Sun, Moon, Leaf, Droplet, Sunset, Zap, Star, Volume2, VolumeX, X, Camera, CameraOff, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import "./englishPop.css";
import { GameComponentProps } from "../types";
import { initializeHandTracker, getLoadedHandTracker } from "./handTracker";
import { playPopSound, playStartSound, playEndSound, playBGM, stopBGM, toggleBGM, getBGMPreference } from "./audio";
import { QuestionModal } from "./QuestionModal";
import { Difficulty, VocabQuestion, OFFLINE_QUESTIONS } from "./types";
import { ENGLISH_UNITS, GAME_GRADES, GradeLabel, normalizeQuestionKey } from "../../data/gameCurriculum";
import { loadSeen, rememberSeen, requestGameQuestions } from "../shared/questionMemory";
import { enterGameMode, exitGameMode } from "../../lib/gameMode";
import { supportSeconds, useSupportProfile } from "../../lib/support/profile";
import { rewardFor, rewardText } from "../shared/rewards";
import { offlineUnitVocab, WORDBOOK_TOPIC, wordbookSize, wordbookVocab } from "./wordbookVocab";

const SEEN_KEY = "english-pop";
const SETTINGS_KEY = "english_pop_settings_v1";

const THEME_EMOJIS = {
  light: ["✨", "🌟", "☁️", "🎈", "☀️", "🕊️"],
  dark: ["🌙", "🦇", "👾", "🌌", "💎", "🔮"],
  nature: ["🍃", "🌸", "🦋", "🍀", "🌻", "🐞"],
  ocean: ["🫧", "🐠", "🌊", "🐬", "🐚", "🦈"],
  sunset: ["🌇", "🌅", "🍹", "🌴", "🌺", "☀️"],
  neon: ["⚡", "🎸", "🕹️", "🕺", "🚀", "💎"],
  galaxy: ["⭐", "🚀", "🛸", "☄️", "🪐", "👽"],
};
type ThemeId = keyof typeof THEME_EMOJIS;

const FloatingEmojis: React.FC<{ theme: ThemeId }> = ({ theme }) => {
  const [emojis, setEmojis] = useState<{ id: number; char: string; left: number; delay: number; duration: number; size: number }[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      setEmojis((prev) => {
        const available = THEME_EMOJIS[theme] || THEME_EMOJIS.light;
        const char = available[Math.floor(Math.random() * available.length)];
        return [
          ...prev.slice(-12),
          { id: Date.now() + Math.random(), char, left: Math.random() * 100, delay: Math.random() * 2, duration: 15 + Math.random() * 15, size: 0.5 + Math.random() },
        ];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [theme]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <AnimatePresence>
        {emojis.map((emoji) => (
          <motion.div
            key={emoji.id}
            initial={{ top: "100%", opacity: 0, left: `${emoji.left}%`, scale: 0.5 }}
            animate={{ top: "-10%", opacity: [0, 1, 1, 0], scale: emoji.size }}
            transition={{ duration: emoji.duration, ease: "linear", delay: emoji.delay, times: [0, 0.2, 0.8, 1] }}
            className="absolute text-4xl"
          >
            {emoji.char}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

interface Ball {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  active: boolean;
  drift?: number;
  swingPhase?: number;
}

type GameState = "START" | "PLAYING" | "POPPING" | "QUESTION" | "END" | "TUTORIAL" | "GAMEOVER";
type CameraState = "idle" | "starting" | "on" | "off";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
  size: number;
}

const getDifficultySettings = (diff: Difficulty) => {
  switch (diff) {
    case "easy": return { duration: 600, multiplier: 0.5, spawnRate: 5000, maxBalloons: 5, fallTime: 10 };
    case "hard": return { duration: 180, multiplier: 2, spawnRate: 2000, maxBalloons: 7, fallTime: 6 };
    case "impossible": return { duration: 60, multiplier: 3, spawnRate: 1000, maxBalloons: 10, fallTime: 4 };
    default: return { duration: 300, multiplier: 1, spawnRate: 4000, maxBalloons: 5, fallTime: 8 };
  }
};

const DIFFICULTIES: { id: Difficulty; label: string; time: string; desc: string; color: string; emoji: string }[] = [
  { id: "easy", label: "Dễ", time: "10 phút", desc: "x0.5", color: "from-blue-400 to-blue-500", emoji: "🌱" },
  { id: "medium", label: "Vừa", time: "5 phút", desc: "x1", color: "from-emerald-400 to-emerald-500", emoji: "⭐" },
  { id: "hard", label: "Khó", time: "3 phút", desc: "x2", color: "from-amber-400 to-orange-500", emoji: "🔥" },
  { id: "impossible", label: "Siêu khó", time: "1 phút", desc: "x3", color: "from-rose-500 to-rose-600", emoji: "💀" },
];

const THEMES: { id: ThemeId; label: string; icon: React.ComponentType<{ className?: string }>; iconClass: string }[] = [
  { id: "light", label: "Sáng", icon: Sun, iconClass: "text-amber-500" },
  { id: "dark", label: "Tối", icon: Moon, iconClass: "text-indigo-400" },
  { id: "nature", label: "Thiên nhiên", icon: Leaf, iconClass: "text-emerald-500" },
  { id: "ocean", label: "Đại dương", icon: Droplet, iconClass: "text-blue-400" },
  { id: "sunset", label: "Hoàng hôn", icon: Sunset, iconClass: "text-orange-500" },
  { id: "neon", label: "Neon", icon: Zap, iconClass: "text-pink-500" },
  { id: "galaxy", label: "Thiên hà", icon: Star, iconClass: "text-purple-400" },
];

const TUTORIAL_QUESTION: VocabQuestion = {
  id: "tut1",
  difficulty: "easy",
  type: "translate",
  word: "Welcome",
  options: ["Chào mừng", "Tạm biệt", "Cảm ơn", "Xin lỗi"],
  answer: "Chào mừng",
  textToRead: "Welcome",
  example: "Welcome to our class!",
  exampleVi: "Chào mừng đến với lớp của chúng mình!",
};

interface Settings {
  grade: GradeLabel;
  unitId: string;
  customContent: string;
  difficulty: Difficulty;
}

function loadSettings(defaultGrade: string): Settings {
  const grade = (GAME_GRADES.includes(defaultGrade as GradeLabel) ? defaultGrade : "Lớp 6") as GradeLabel;
  const fallback: Settings = { grade, unitId: "all", customContent: "", difficulty: "medium" };
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (!raw || typeof raw !== "object") return fallback;
    return {
      grade: GAME_GRADES.includes(raw.grade) ? raw.grade : grade,
      unitId: typeof raw.unitId === "string" ? raw.unitId : "all",
      customContent: typeof raw.customContent === "string" ? raw.customContent.slice(0, 2500) : "",
      difficulty: DIFFICULTIES.some((d) => d.id === raw.difficulty) ? raw.difficulty : "medium",
    };
  } catch {
    return fallback;
  }
}

export default function EnglishPopGame({ highScore, onSaveHighScore, onAwardReward, onLogEvent, progress }: GameComponentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const streamRef = useRef<MediaStream | null>(null);

  const [settings, setSettings] = useState<Settings>(() => loadSettings(progress?.grade || "Lớp 6"));
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);
  const difficulty = settings.difficulty;

  const [gameState, setGameState] = useState<GameState>("START");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  // "Thời gian làm bài" (Hỗ trợ học tập): double the round, or no clock (end with the "Kết thúc" button)
  const noClock = useSupportProfile().timeMode === "off";
  const roundSeconds = (d: typeof difficulty) => supportSeconds(getDifficultySettings(d).duration) ?? getDifficultySettings(d).duration;
  const [timeLeft, setTimeLeft] = useState(() => roundSeconds(settings.difficulty));
  const [currentQuestion, setCurrentQuestion] = useState<VocabQuestion | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bgmOn, setBgmOn] = useState(getBGMPreference());
  const [showCustom, setShowCustom] = useState(Boolean(settings.customContent));

  const [isTutorial, setIsTutorial] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>("light");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [tutorialPhase, setTutorialPhase] = useState<"HAND" | "BALLOON" | "QUESTION" | "DONE">("HAND");
  const tutorialHandDetected = useRef(false);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);

  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastBallTime = useRef<number>(0);
  // Hand detection is the heaviest part of a frame (GPU read-back): run it at most ~15 times a
  // second and only on a new camera frame; in between, the last hand position is reused.
  const handRef = useRef<{ at: number; videoTime: number; points: { x: number; y: number }[] }>({ at: 0, videoTime: -1, points: [] });

  // ---------- questions: queue + memory of words already asked ----------
  const queueRef = useRef<VocabQuestion[]>([]);
  const sessionWordsRef = useRef<Set<string>>(new Set());
  const fetchingRef = useRef<Promise<void> | null>(null);
  const wordbookPoolRef = useRef<Omit<VocabQuestion, "id" | "difficulty">[] | null>(null);
  const queueTopicRef = useRef<string>("");
  const [wordbookCount, setWordbookCount] = useState<number | null>(null);
  useEffect(() => {
    wordbookSize().then(setWordbookCount).catch(() => setWordbookCount(0));
  }, []);

  const refillQuestions = useCallback((): Promise<void> => {
    if (fetchingRef.current) return fetchingRef.current;
    const s = settingsRef.current;
    const job = (async () => {
      // "Sổ từ của tôi": questions from the word book (needs 4 words); otherwise the normal question bank
      if (s.unitId === WORDBOOK_TOPIC) {
        if (!wordbookPoolRef.current) wordbookPoolRef.current = await wordbookVocab().catch(() => []);
        const pool = wordbookPoolRef.current;
        if (pool.length >= 4) {
          const queued = new Set(queueRef.current.map((q) => normalizeQuestionKey(q.word)));
          let fresh = pool.filter((q) => !sessionWordsRef.current.has(normalizeQuestionKey(q.word)) && !queued.has(normalizeQuestionKey(q.word)));
          if (!fresh.length) {
            // every saved word was asked: go round again
            sessionWordsRef.current.clear();
            fresh = pool.filter((q) => !queued.has(normalizeQuestionKey(q.word)));
          }
          for (const q of fresh.slice(0, 5)) queueRef.current.push({ ...q, id: `wb_${q.word}_${Date.now()}`, difficulty: s.difficulty });
          return;
        }
        onLogEvent("debug", "Sổ từ có ít hơn 4 từ có nghĩa – dùng câu hỏi theo Unit.");
      }
      const exclude = [
        ...loadSeen(SEEN_KEY).slice(-100),
        ...Array.from(sessionWordsRef.current),
        ...queueRef.current.map((q) => q.word),
      ];
      try {
        const questions = await requestGameQuestions<VocabQuestion>({
          game: "english",
          grade: s.grade,
          topicId: s.unitId === "all" || s.unitId === WORDBOOK_TOPIC ? "" : s.unitId,
          topicText: s.unitId === "all" || s.unitId === WORDBOOK_TOPIC ? `Từ vựng các Unit Tiếng Anh ${s.grade}` : "",
          customContent: s.customContent,
          difficulty: s.difficulty,
          count: 5,
          exclude,
        });
        const queued = new Set(queueRef.current.map((q) => normalizeQuestionKey(q.word)));
        for (const q of questions) {
          const key = normalizeQuestionKey(q.word);
          if (!sessionWordsRef.current.has(key) && !queued.has(key)) {
            queueRef.current.push(q);
            queued.add(key);
          }
        }
      } catch (err: any) {
        onLogEvent("debug", `Không tải được câu hỏi: ${err?.message || err}`);
      }
      // AI unavailable / nothing new: words of the chosen unit with the offline dictionary (many different words)
      if (queueRef.current.length < 2) {
        const avoid = new Set<string>([...sessionWordsRef.current, ...queueRef.current.map((q) => normalizeQuestionKey(q.word))]);
        const offline = await offlineUnitVocab(s.grade, s.unitId, avoid, 6).catch(() => []);
        for (const q of offline) queueRef.current.push({ ...q, id: `unit_${q.word}_${Date.now()}`, difficulty: s.difficulty });
      }
    })().finally(() => {
      fetchingRef.current = null;
    });
    fetchingRef.current = job;
    return job;
  }, [onLogEvent]);

  const takeQuestion = useCallback(async (): Promise<VocabQuestion> => {
    if (queueRef.current.length === 0) await refillQuestions();
    let q = queueRef.current.shift();
    if (!q) {
      const pool = OFFLINE_QUESTIONS.filter((o) => !sessionWordsRef.current.has(normalizeQuestionKey(o.word)));
      const list = pool.length ? pool : OFFLINE_QUESTIONS;
      const pick = list[Math.floor(Math.random() * list.length)];
      q = { ...pick, id: `offline_${Date.now()}`, difficulty: settingsRef.current.difficulty, source: "local" };
    }
    sessionWordsRef.current.add(normalizeQuestionKey(q.word));
    rememberSeen(SEEN_KEY, [q.word]);
    if (queueRef.current.length < 3) void refillQuestions();
    return q;
  }, [refillQuestions]);

  // ---------- camera ----------
  const startCamera = useCallback(async () => {
    if (cameraState === "on" || cameraState === "starting") return;
    setCameraState("starting");
    setCameraMessage(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: "user" } }),
        initializeHandTracker(),
      ]);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraState("on");
    } catch (error: any) {
      const name = error?.name || "";
      setCameraState("off");
      setCameraMessage(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "Bạn chưa cho phép dùng camera. Vẫn chơi được: chạm ngón tay hoặc rê chuột vào bóng."
          : "Không bật được camera trên máy này. Vẫn chơi được: chạm ngón tay hoặc rê chuột vào bóng."
      );
    }
  }, [cameraState]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopBGM();
      void exitGameMode();
    };
  }, []);

  // ---------- full screen while a round runs ----------
  const enterFullscreen = useCallback(() => {
    if (isFullscreen) return;
    setIsFullscreen(true);
    void enterGameMode(rootRef.current, () => {
      setIsFullscreen(false);
      setGameState((s) => (s === "PLAYING" || s === "POPPING" || s === "QUESTION" ? "END" : "START"));
      setIsTutorial(false);
    });
  }, [isFullscreen]);

  const leaveFullscreen = useCallback(() => {
    setIsFullscreen(false);
    void exitGameMode();
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== "PLAYING" || timeLeft <= 0 || noClock) return;
    const timerInterval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          playEndSound();
          setGameState("END");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerInterval);
  }, [gameState, timeLeft, noClock]);

  // Rewards and record at the end of a round (once)
  const roundSettledRef = useRef(false);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundMistakes, setRoundMistakes] = useState<VocabQuestion[]>([]);
  const [roundReward, setRoundReward] = useState({ xp: 0, coins: 0 });
  useEffect(() => {
    if ((gameState !== "END" && gameState !== "GAMEOVER") || roundSettledRef.current) return;
    roundSettledRef.current = true;
    leaveFullscreen();
    onLogEvent("state", `Kết thúc ván English Pop. Điểm: ${score}.`);
    if (score > highScore) onSaveHighScore(score);
    // Shared rule for all games: from 3 correct answers, 4 XP + 2 Xu each (max 50 XP / 30 Xu)
    const rw = rewardFor(roundCorrect);
    setRoundReward(rw);
    if (rw.xp > 0) {
      onAwardReward({ xp: rw.xp, coins: rw.coins, reason: `English Pop – ${roundCorrect} từ đúng` });
    }
  }, [gameState, score, roundCorrect, highScore, onSaveHighScore, onAwardReward, onLogEvent, leaveFullscreen]);

  const startGame = () => {
    playStartSound();
    playBGM();
    void startCamera();
    enterFullscreen();
    // a different topic (or new words in the word book) since last round: fresh questions
    wordbookPoolRef.current = null;
    if (queueTopicRef.current !== settingsRef.current.unitId) {
      queueRef.current = [];
      queueTopicRef.current = settingsRef.current.unitId;
    }
    roundSettledRef.current = false;
    setIsTutorial(false);
    setGameState("PLAYING");
    setScore(0);
    setCombo(0);
    setRoundCorrect(0);
    setRoundMistakes([]);
    setRoundReward({ xp: 0, coins: 0 });
    setTimeLeft(roundSeconds(difficulty));
    sessionWordsRef.current = new Set();
    queueRef.current = [];
    ballsRef.current = [];
    void refillQuestions();
    onLogEvent("state", `Bắt đầu English Pop (${settings.grade}, ${difficulty}).`);
  };

  const startTutorial = () => {
    playBGM();
    void startCamera();
    enterFullscreen();
    setIsTutorial(true);
    setTutorialPhase("HAND");
    setGameState("TUTORIAL");
    tutorialHandDetected.current = false;
    ballsRef.current = [];
  };

  const popBall = (index: number, x: number, y: number) => {
    const ball = ballsRef.current[index];
    if (!ball || !ball.active) return;
    ball.active = false;
    playPopSound();
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 15 + 5;
      particlesRef.current.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: Math.random() * 0.02 + 0.02,
        color: Math.random() > 0.5 ? ball.color : "#ffffff", size: Math.random() * 12 + 4,
      });
    }
    setGameState("POPPING");
    const tutorial = isTutorial;
    setTimeout(async () => {
      setGameState("QUESTION");
      if (tutorial) {
        setTutorialPhase("QUESTION");
        setCurrentQuestion(TUTORIAL_QUESTION);
      } else {
        setCurrentQuestion(await takeQuestion());
      }
    }, 600);
  };

  const handleAnswerComplete = (isCorrect: boolean) => {
    if (isTutorial) {
      if (!isCorrect) {
        setCurrentQuestion(null);
        setTimeout(() => setCurrentQuestion({ ...TUTORIAL_QUESTION }), 100);
        return;
      }
      setTutorialPhase("DONE");
      setGameState("TUTORIAL");
      setCurrentQuestion(null);
      setTimeout(() => {
        setIsTutorial(false);
        setGameState("START");
        leaveFullscreen();
      }, 2500);
      return;
    }
    if (isCorrect) {
      setRoundCorrect((c) => c + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore((prev) => prev + Math.floor(10 * newCombo * getDifficultySettings(difficulty).multiplier));
    } else {
      setCombo(0);
      const missed = currentQuestion;
      if (missed) setRoundMistakes((list) => (list.some((m) => m.word === missed.word) ? list : [...list, missed]));
    }
    setCurrentQuestion(null);
    setGameState("PLAYING");
  };

  const drawFrame = useCallback(() => {
    requestRef.current = requestAnimationFrame(drawFrame);
    if (gameState !== "PLAYING" && gameState !== "POPPING" && gameState !== "TUTORIAL") return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // With a camera the canvas matches the video frame; without one it matches the screen
    const videoReady = cameraState === "on" && video && video.readyState >= 2 && video.videoWidth > 0;
    const targetW = videoReady ? video!.videoWidth : canvas.clientWidth;
    const targetH = videoReady ? video!.videoHeight : canvas.clientHeight;
    if (targetW > 0 && targetH > 0 && (canvas.width !== targetW || canvas.height !== targetH)) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let handPoints: { x: number; y: number }[] = [];
    const tracker = getLoadedHandTracker();
    if (videoReady && tracker) {
      const hand = handRef.current;
      const tNow = performance.now();
      if (tNow - hand.at >= 66 && video!.currentTime !== hand.videoTime) {
        hand.at = tNow;
        hand.videoTime = video!.currentTime;
        const pts: { x: number; y: number }[] = [];
        try {
          const results = tracker.detectForVideo(video!, tNow);
          for (const landmarks of results.landmarks || []) {
            for (const lm of landmarks) pts.push({ x: (1 - lm.x) * canvas.width, y: lm.y * canvas.height });
          }
        } catch {
          // occasional detector errors are harmless
        }
        hand.points = pts;
      }
      handPoints = hand.points;
    }

    if (isTutorial && gameState === "TUTORIAL" && tutorialPhase === "HAND" && !tutorialHandDetected.current && (handPoints.length > 0 || cameraState === "off")) {
      tutorialHandDetected.current = true;
      setTimeout(() => {
        setTutorialPhase("BALLOON");
        ballsRef.current = [{ id: Date.now(), x: canvas.width / 2, y: -150, radius: 70, speed: 2, color: "#33FF57", active: true, drift: 0, swingPhase: 0 }];
      }, 1500);
    }

    const now = Date.now();
    const currentSettings = getDifficultySettings(difficulty);
    if (gameState === "PLAYING" && now - lastBallTime.current > currentSettings.spawnRate && ballsRef.current.length < currentSettings.maxBalloons) {
      const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#33FFF6", "#FFD700"];
      const margin = Math.min(100, canvas.width * 0.12);
      ballsRef.current.push({
        id: now,
        x: Math.random() * (canvas.width - margin * 2) + margin,
        y: -150,
        radius: Math.max(32, Math.min(55, canvas.width * 0.05)) + Math.random() * 10,
        speed: ((canvas.height + 150) / (currentSettings.fallTime * 60)) * (0.8 + Math.random() * 0.4),
        color: colors[Math.floor(Math.random() * colors.length)],
        active: true,
        drift: (Math.random() - 0.5) * 1.5,
        swingPhase: Math.random() * Math.PI * 2,
      });
      lastBallTime.current = now;
    }

    let poppedThisFrame = false;
    ballsRef.current.forEach((ball, i) => {
      if (!ball.active) return;
      if (gameState === "PLAYING" || (isTutorial && tutorialPhase === "BALLOON")) {
        ball.swingPhase = (ball.swingPhase || 0) + 0.05;
        ball.y += ball.speed + Math.sin(ball.swingPhase) * 0.5;
        ball.x += (ball.drift || 0) + Math.cos(ball.swingPhase) * 0.5;
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.drift = Math.abs(ball.drift || 0);
        } else if (ball.x + ball.radius > canvas.width) {
          ball.x = canvas.width - ball.radius;
          ball.drift = -Math.abs(ball.drift || 0);
        }
      }
      const radiusY = ball.radius * 1.2;
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y, ball.radius, radiusY, 0, 0, 2 * Math.PI);
      ctx.fillStyle = ball.color;
      ctx.shadowColor = ball.color;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "white";
      ctx.shadowBlur = 0;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y + radiusY);
      ctx.lineTo(ball.x - 12, ball.y + radiusY + 15);
      ctx.lineTo(ball.x + 12, ball.y + radiusY + 15);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y + radiusY + 15);
      ctx.lineTo(ball.x - 5, ball.y + radiusY + 40);
      ctx.lineTo(ball.x + 5, ball.y + radiusY + 80);
      ctx.lineTo(ball.x - 2, ball.y + radiusY + 120);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.font = `bold ${Math.round(ball.radius * 0.9)}px "Be Vietnam Pro", Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 5;
      ctx.fillText("?", ball.x, ball.y - 6);
      ctx.shadowBlur = 0;

      if (!poppedThisFrame && handPoints.length && (gameState === "PLAYING" || (isTutorial && tutorialPhase === "BALLOON"))) {
        const hit = handPoints.some((pt) => Math.hypot(ball.x - pt.x, ball.y - pt.y) < radiusY + 35);
        if (hit) {
          popBall(i, ball.x, ball.y);
          poppedThisFrame = true;
        }
      }
    });

    let gameOverTriggered = false;
    ballsRef.current = ballsRef.current.filter((b) => {
      if (!b.active) return false;
      if (b.y + b.radius * 1.2 >= canvas.height) {
        if (gameState === "PLAYING") gameOverTriggered = true;
        return false;
      }
      return true;
    });
    if (gameOverTriggered && gameState === "PLAYING") {
      setGameState("GAMEOVER");
      playEndSound();
    }
    if (isTutorial && tutorialPhase === "BALLOON" && ballsRef.current.length === 0) {
      ballsRef.current = [{ id: Date.now(), x: canvas.width / 2, y: -150, radius: 70, speed: 2, color: "#33FF57", active: true, drift: 0, swingPhase: 0 }];
    }

    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5;
      p.life -= p.decay;
      if (p.life > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    });
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isTutorial, tutorialPhase, difficulty, cameraState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [drawFrame]);

  // Finger / mouse popping. The canvas is drawn with object-fit: cover, so screen points are
  // converted back to canvas pixels before testing against the balloons.
  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== "PLAYING" && !(isTutorial && tutorialPhase === "BALLOON")) return;
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.max(rect.width / canvas.width, rect.height / canvas.height);
    const offsetX = (rect.width - canvas.width * scale) / 2;
    const offsetY = (rect.height - canvas.height * scale) / 2;
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    ballsRef.current.forEach((ball, i) => {
      if (!ball.active) return;
      const radiusY = ball.radius * 1.2;
      const dx = (x - ball.x) / (ball.radius + 12);
      const dy = (y - ball.y) / (radiusY + 12);
      if (dx * dx + dy * dy <= 1) popBall(i, ball.x, ball.y);
    });
  };

  const unitOptions = ENGLISH_UNITS[settings.grade] || [];
  const durationTotal = roundSeconds(difficulty);
  const timerColor = noClock ? "#3b82f6" : timeLeft <= 10 ? "#f43f5e" : timeLeft <= 30 ? "#fbbf24" : "#3b82f6";
  const inRound = gameState === "PLAYING" || gameState === "POPPING" || gameState === "QUESTION";

  return (
    <div
      ref={rootRef}
      data-theme={currentTheme === "light" ? undefined : currentTheme}
      className={`english-pop-root ${
        isFullscreen ? "game-mode-stage fixed inset-0 z-[300] w-full h-[100dvh]" : "relative w-full h-[clamp(560px,82dvh,900px)] rounded-2xl"
      } text-dynamic overflow-hidden select-none touch-none`}
      onPointerMove={handlePointer}
      onPointerDown={handlePointer}
    >
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover z-0" style={{ transform: "scaleX(-1)" }} playsInline muted />
      {cameraState !== "on" && <div className="absolute inset-0 z-0 theme-gradient" aria-hidden="true" />}

      {cameraMessage && (
        <div role="status" className="absolute top-0 left-0 w-full z-[55] bg-slate-900/90 text-white px-4 py-3 text-center text-sm sm:text-base font-semibold">
          {cameraMessage}
        </div>
      )}

      {/* Theme switcher */}
      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 z-50 pointer-events-auto">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center"
            aria-label="Đổi giao diện trò chơi"
            aria-expanded={showThemeMenu}
          >
            <Palette className="w-5 h-5 text-dynamic" />
          </button>
          {showThemeMenu && (
            <div className="absolute bottom-16 left-0 glass-modal rounded-3xl p-3 flex flex-col gap-1 min-w-[180px] text-left">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setCurrentTheme(t.id);
                    setShowThemeMenu(false);
                  }}
                  className={`flex items-center gap-3 px-4 min-h-[44px] rounded-2xl transition-all ${currentTheme === t.id ? "bg-black/10 font-bold" : "font-medium"}`}
                >
                  <t.icon className={`w-4 h-4 ${t.iconClass}`} />
                  <span className="text-sm text-dynamic">{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-1000 ${
          currentTheme === "light" ? "bg-gradient-to-b from-white/10 to-transparent mix-blend-overlay" :
          currentTheme === "dark" ? "bg-gradient-to-b from-black/40 via-transparent to-black/60 mix-blend-multiply" :
          currentTheme === "nature" ? "bg-gradient-to-br from-emerald-900/20 via-transparent to-green-900/30 mix-blend-overlay" :
          currentTheme === "ocean" ? "bg-gradient-to-t from-blue-900/30 via-transparent to-cyan-900/20 mix-blend-overlay" :
          currentTheme === "sunset" ? "bg-gradient-to-t from-orange-600/20 via-transparent to-rose-500/10 mix-blend-color" :
          currentTheme === "neon" ? "bg-gradient-to-b from-fuchsia-600/10 via-transparent to-purple-900/30 mix-blend-overlay" :
          "bg-gradient-to-b from-indigo-900/10 via-transparent to-slate-900/40 mix-blend-overlay"
        }`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none" />

      <div className="absolute inset-0 z-30 pointer-events-none opacity-80">
        <FloatingEmojis theme={currentTheme} />
      </div>

      {/* Top bar: time, score, combo, controls */}
      <header className="absolute top-0 w-full flex flex-col z-40 pointer-events-none">
        <div className="w-full h-2 bg-slate-900/20 relative">
          <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / durationTotal) * 100}%`, backgroundColor: timerColor }} />
        </div>
        <div className="w-full px-4 pt-3 sm:px-8 sm:pt-6 flex justify-between items-start gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-blue-700">Điểm</span>
            <span className="text-5xl sm:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-blue-500 leading-none num">{score}</span>
            {combo > 1 && <span className="mt-1 text-xl font-display font-black text-pink-600">Combo x{combo}</span>}
          </div>
          <div className="glass-panel rounded-[1.5rem] px-4 py-2 flex flex-col items-center">
            <span className="text-sm font-bold text-dynamic-secondary">Thời gian</span>
            {noClock ? (
              <span className="text-lg sm:text-xl font-black text-dynamic">Không giới hạn</span>
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-dynamic num" style={{ color: timerColor }}>
                {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
          <div className="flex gap-2 pointer-events-auto">
            {noClock && inRound && (
              <button type="button" onClick={() => setGameState("END")} className="min-h-[44px] rounded-full bg-[#2e5cb8] px-4 text-sm font-bold text-white">
                Kết thúc
              </button>
            )}
            <button
              type="button"
              onClick={() => setBgmOn(toggleBGM())}
              aria-label={bgmOn ? "Tắt nhạc nền" : "Bật nhạc nền"}
              className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-dynamic"
            >
              {bgmOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            {isFullscreen && (
              <button
                type="button"
                onClick={() => {
                  if (inRound) setGameState("END");
                  else {
                    setIsTutorial(false);
                    setGameState("START");
                  }
                  leaveFullscreen();
                }}
                aria-label="Thoát toàn màn hình"
                className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tutorial prompts */}
      {isTutorial && (gameState === "TUTORIAL" || gameState === "POPPING" || gameState === "QUESTION") && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center w-[min(92%,640px)]">
          <div className="glass-modal px-6 py-5 rounded-3xl">
            {tutorialPhase === "HAND" && (
              <>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-dynamic">{cameraState === "off" ? "Dùng ngón tay hoặc chuột" : "Bước 1: Đưa tay lên"}</h2>
                <p className="text-base sm:text-lg mt-2 text-dynamic-secondary">
                  {tutorialHandDetected.current || cameraState === "off" ? "Tốt lắm! Chuẩn bị đập bóng." : "Giơ tay trước camera để bắt đầu."}
                </p>
              </>
            )}
            {tutorialPhase === "BALLOON" && (
              <>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-amber-600">Bước 2: Đập bóng!</h2>
                <p className="text-base sm:text-lg mt-2 text-dynamic-secondary">
                  {cameraState === "on" ? "Đưa tay chạm vào quả bóng đang rơi." : "Chạm ngón tay hoặc rê chuột vào quả bóng đang rơi."}
                </p>
              </>
            )}
            {tutorialPhase === "DONE" && (
              <>
                <h2 className="text-3xl font-display font-black text-emerald-600">Xong phần hướng dẫn!</h2>
                <p className="text-lg mt-2 text-dynamic-secondary">Giờ bạn đã sẵn sàng chơi thật.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Start screen */}
      {gameState === "START" && (
        <div className="absolute inset-0 flex items-center justify-center bg-dynamic-overlay backdrop-blur-xl z-40 p-3 overflow-y-auto">
          <div className="glass-modal p-5 sm:p-10 w-full max-w-[760px] text-center pointer-events-auto flex flex-col gap-5 rounded-[2rem] relative overflow-hidden my-auto">
            <div>
              <h1 className="text-4xl sm:text-7xl font-display font-black leading-none tracking-tight">
                <span className="text-gradient">Pop &amp; Learn</span> <span aria-hidden="true">🎈</span>
              </h1>
              <p className="mt-2 text-sm font-bold text-dynamic-muted">Made by ThanhDat7A</p>
            </div>
            <p className="text-dynamic-secondary font-medium text-base sm:text-lg max-w-[600px] mx-auto">
              Đập vỡ bóng bay đang rơi bằng tay (qua camera) hoặc bằng ngón tay, rồi dịch đúng từ tiếng Anh để ghi điểm.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 text-left">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold text-dynamic-secondary">Lớp</span>
                <select
                  value={settings.grade}
                  onChange={(e) => setSettings((s) => ({ ...s, grade: e.target.value as GradeLabel, unitId: "all" }))}
                  className="min-h-[48px] rounded-2xl px-3 bg-white/80 text-slate-900 border border-slate-200 text-base"
                >
                  {GAME_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold text-dynamic-secondary">Chủ đề trong sách</span>
                <select
                  value={settings.unitId}
                  onChange={(e) => setSettings((s) => ({ ...s, unitId: e.target.value }))}
                  className="min-h-[48px] rounded-2xl px-3 bg-white/80 text-slate-900 border border-slate-200 text-base"
                >
                  <option value="all">Tất cả các Unit của {settings.grade}</option>
                  <option value={WORDBOOK_TOPIC}>⭐ Sổ từ của tôi{wordbookCount !== null ? ` (${wordbookCount} từ)` : ""}</option>
                  {unitOptions.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
                {settings.unitId === WORDBOOK_TOPIC && wordbookCount !== null && wordbookCount < 4 && (
                  <span className="text-sm font-semibold text-amber-800">Cần ít nhất 4 từ trong Sổ từ (mục Tra từ và Dịch, bấm ⭐ Lưu). Hiện có {wordbookCount} từ – tạm dùng từ trong sách.</span>
                )}
              </label>
            </div>

            <div className="text-left">
              <button
                type="button"
                onClick={() => setShowCustom((v) => !v)}
                aria-expanded={showCustom}
                className="min-h-[44px] inline-flex items-center gap-2 text-sm font-bold text-dynamic-secondary"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showCustom ? "rotate-180" : ""}`} />
                Thêm từ vựng hoặc nội dung của riêng bạn (không bắt buộc)
              </button>
              {showCustom && (
                <textarea
                  value={settings.customContent}
                  onChange={(e) => setSettings((s) => ({ ...s, customContent: e.target.value.slice(0, 2500) }))}
                  rows={3}
                  placeholder="Ví dụ: danh sách từ thầy cô giao, đoạn bài đọc trong sách..."
                  className="mt-2 w-full rounded-2xl p-3 bg-white/80 text-slate-900 border border-slate-200 text-base"
                />
              )}
            </div>

            <div className="text-left">
              <h3 className="text-sm font-bold text-dynamic-secondary mb-2">Độ khó</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, difficulty: d.id }))}
                    aria-pressed={difficulty === d.id}
                    className={`relative overflow-hidden flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all ${
                      difficulty === d.id ? "bg-white shadow-xl border-2 border-slate-200 text-dynamic" : "border-2 border-dashed border-black/10 text-dynamic-secondary"
                    }`}
                  >
                    {difficulty === d.id && <div className={`absolute inset-0 bg-gradient-to-br ${d.color} opacity-20`} />}
                    <span className="text-xl relative z-10" aria-hidden="true">{d.emoji}</span>
                    <span className="text-base font-display font-black relative z-10">{d.label}</span>
                    <span className="text-sm relative z-10 text-dynamic-muted">{d.time} · {d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button type="button" onClick={startTutorial} className="btn-secondary min-h-[52px] px-6 flex-1 rounded-3xl font-bold text-base">
                Hướng dẫn
              </button>
              <button type="button" onClick={startGame} className="btn-primary min-h-[52px] px-8 flex-[2] rounded-3xl font-black text-lg flex items-center justify-center gap-2">
                Bắt đầu chơi <Play className="w-5 h-5 fill-current" />
              </button>
            </div>
            {highScore > 0 && <p className="text-sm text-dynamic-muted">Kỷ lục của bạn: <span className="num font-bold">{highScore}</span> điểm</p>}
          </div>
        </div>
      )}

      {/* End screens */}
      {(gameState === "END" || gameState === "GAMEOVER") && (
        <div className="absolute inset-0 flex justify-center overflow-y-auto bg-dynamic-overlay backdrop-blur-xl z-40 p-3">
          <div className="glass-modal p-6 sm:p-12 w-full max-w-2xl text-center pointer-events-auto flex flex-col gap-5 rounded-[2rem] my-auto">
            <h2 className="text-4xl sm:text-6xl font-display font-black leading-none">
              {gameState === "END" ? "Hết giờ!" : "Bóng đã rơi!"}
            </h2>
            {gameState === "GAMEOVER" && <p className="text-lg font-medium text-rose-600">Một quả bóng đã chạm đất trước khi bạn kịp đập.</p>}
            <div className="py-6 bg-white/60 rounded-3xl border border-white">
              <p className="text-sm font-bold mb-2 text-dynamic-muted">Điểm của ván này</p>
              <p className="text-6xl sm:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-blue-500 leading-none num">{score}</p>
              {score > 0 && score >= highScore && <p className="mt-2 font-bold text-emerald-700">Kỷ lục mới!</p>}
              <p className="mt-2 text-sm font-semibold text-dynamic-secondary">
                {roundCorrect} từ đúng{roundReward.xp > 0 ? ` · nhận ${rewardText(roundReward)}` : roundCorrect < 3 ? " · đúng từ 3 từ để nhận XP/Xu" : ""}
              </p>
            </div>
            {roundMistakes.length > 0 && (
              <div className="text-left max-h-48 overflow-y-auto rounded-2xl bg-white/70 border border-white p-3 space-y-2">
                <p className="text-sm font-bold text-dynamic">Ôn lại từ đã sai ({roundMistakes.length})</p>
                {roundMistakes.map((m) => (
                  <div key={m.word} className="text-sm">
                    <span translate="no" className="notranslate font-bold text-indigo-700">{m.word}</span> = {m.answer}
                    {m.example ? <span translate="no" className="notranslate block text-xs text-dynamic-muted">{m.example}</span> : null}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button type="button" onClick={() => setGameState("START")} className="btn-secondary min-h-[48px] px-8 rounded-full font-bold text-base">
                Về màn chính
              </button>
              <button type="button" onClick={startGame} className="btn-primary min-h-[48px] px-8 rounded-full font-bold text-base">
                Chơi lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera status (truthful) */}
      {(inRound || gameState === "TUTORIAL") && (
        <footer className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-20 pointer-events-none">
          <span className="glass-panel rounded-full px-3 py-2 text-sm font-semibold text-dynamic inline-flex items-center gap-2">
            {cameraState === "on" ? <Camera className="w-4 h-4 text-emerald-600" /> : <CameraOff className="w-4 h-4 text-slate-500" />}
            {cameraState === "on" ? "Camera đang theo dõi tay" : cameraState === "starting" ? "Đang bật camera…" : "Chơi bằng chạm / chuột"}
          </span>
        </footer>
      )}

      {gameState === "QUESTION" && !currentQuestion && (
        <div className="absolute inset-0 flex items-center justify-center bg-dynamic-overlay backdrop-blur-xl z-50">
          <div role="status" className="glass-modal px-10 py-8 rounded-[2rem] text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-[5px] border-slate-100 border-t-purple-500 rounded-full animate-spin" aria-hidden="true" />
            <p className="text-lg font-display font-bold text-dynamic">Đang chuẩn bị câu hỏi…</p>
          </div>
        </div>
      )}
      <QuestionModal question={currentQuestion} onAnswerComplete={handleAnswerComplete} />
    </div>
  );
}
