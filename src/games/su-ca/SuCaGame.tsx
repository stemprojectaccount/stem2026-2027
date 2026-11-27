// Sử Ca – Dice History: roll the dice, the face sets the difficulty, answer a history question.
// Original game design by the author; integrated into SmartStudy with textbook topics,
// optional student content and non-repeating AI questions served by /api/game-questions.
import React, { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Dices, Trophy, Flame, ScrollText, AlertCircle, RefreshCw, User, GraduationCap,
  History as HistoryIcon, ArrowRight, Volume2, VolumeX, Shuffle, Palette, X, Rocket, Zap,
  RotateCcw, HelpCircle, CheckCircle2, BookOpen, ChevronDown,
} from "lucide-react";
import "./suCa.css";
import { GameComponentProps } from "../types";
import { GameState, Question, HistoryItem, Difficulty } from "./types";
import Dice from "./components/Dice";
import QuestionCard from "./components/QuestionCard";
import HistoryModal from "./components/HistoryModal";
import SummaryModal from "./components/SummaryModal";
import ProgressBar from "./components/ProgressBar";
import HelpModal from "./components/HelpModal";
import { GAME_GRADES, GradeLabel, HISTORY_TOPICS, findTopicLabel } from "../../data/gameCurriculum";
import { loadSeen, rememberSeen, requestGameQuestions } from "../shared/questionMemory";
import { rewardFor } from "../shared/rewards";
import { signalFeedback } from "../../lib/support/feedback";
import { prefersLessMotion } from "../../lib/support/profile";
import { offlineHistoryQuestions } from "./offlineBank";

const SEEN_KEY = "su-ca";
const ESSAY_SHARE = 0.75; // the original game asks mostly short essay questions

const DIFFICULTY_SETTINGS = {
  [Difficulty.EASY]: { label: "Dễ", questions: 5, multiplier: 1, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  [Difficulty.MEDIUM]: { label: "Trung bình", questions: 10, multiplier: 1.5, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  [Difficulty.HARD]: { label: "Khó", questions: 15, multiplier: 2, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  [Difficulty.INFINITY]: { label: "Vô tận", questions: Infinity, multiplier: 2.5, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
};

const BACKGROUNDS = [
  { id: "default", name: "Mặc định", class: "bg-amber-50", color: "#fffbeb" },
  { id: "vintage", name: "Giấy Dó", class: "bg-pattern-vintage", color: "#fdf6e3" },
  { id: "ceramic", name: "Gốm Sứ", class: "bg-pattern-ceramic", color: "#f0f9ff" },
  { id: "bamboo", name: "Tre Ngà", class: "bg-pattern-bamboo", color: "#f7fee7" },
  { id: "imperial", name: "Cung Đình", class: "bg-pattern-imperial", color: "#fff7ed" },
  { id: "ocean", name: "Sóng Biển", class: "bg-pattern-ocean", color: "#ecfeff" },
];

const ls = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // storage full or disabled
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

const seenEntry = (q: Question) => `${q.keyFact || ""} — ${q.text}`.slice(0, 150);

export default function SuCaGame({ onAwardReward, onSaveHighScore, highScore, onLogEvent, progress }: GameComponentProps) {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);

  const [studentName, setStudentName] = useState<string>(progress?.displayName || "");
  const [grade, setGrade] = useState<GradeLabel>(
    (GAME_GRADES.includes(progress?.grade as GradeLabel) ? progress?.grade : "Lớp 6") as GradeLabel
  );
  const [topicId, setTopicId] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [customContent, setCustomContent] = useState<string>("");
  const [showCustomContent, setShowCustomContent] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<Difficulty>(Difficulty.EASY);

  const [nameError, setNameError] = useState("");
  const [topicError, setTopicError] = useState("");

  const [currentRoll, setCurrentRoll] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const [sessionStats, setSessionStats] = useState({ totalQuestions: 0, correctAnswers: 0, sessionScore: 0, longestStreak: 0 });
  const [sessionMistakes, setSessionMistakes] = useState<Question[]>([]);
  const [sessionReward, setSessionReward] = useState({ xp: 0, coins: 0 });
  const [rollReady, setRollReady] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [bgId, setBgId] = useState("default");
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const topicLabel = findTopicLabel(HISTORY_TOPICS, grade, topicId) || customTopic.trim() || "Lịch sử theo chương trình";

  // ---------- persistence ----------
  useEffect(() => {
    try {
      const savedHistory = ls.get("suca_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      const savedScore = ls.get("suca_score");
      if (savedScore) setScore(parseInt(savedScore, 10) || 0);
      const savedStreak = ls.get("suca_streak");
      if (savedStreak) setStreak(parseInt(savedStreak, 10) || 0);
      const savedName = ls.get("suca_name");
      if (savedName) setStudentName(savedName);
      const savedGrade = ls.get("suca_grade");
      if (savedGrade && GAME_GRADES.includes(savedGrade as GradeLabel)) setGrade(savedGrade as GradeLabel);
      const savedTopicId = ls.get("suca_topic_id");
      if (savedTopicId) setTopicId(savedTopicId);
      const savedCustomTopic = ls.get("suca_topic");
      if (savedCustomTopic) setCustomTopic(savedCustomTopic);
      const savedContent = ls.get("suca_custom_content");
      if (savedContent) {
        setCustomContent(savedContent);
        setShowCustomContent(true);
      }
      const savedDifficulty = ls.get("suca_difficulty");
      if (savedDifficulty && Object.values(Difficulty).includes(savedDifficulty as Difficulty)) setDifficultyLevel(savedDifficulty as Difficulty);
      if (ls.get("suca_muted") === "true") setIsMuted(true);
      const savedVolume = ls.get("suca_volume");
      if (savedVolume) setVolume(parseFloat(savedVolume));
      const savedBg = ls.get("suca_bgId");
      if (savedBg) setBgId(savedBg);
      ls.remove("suca_apiKey"); // older versions stored an API key here: never keep it
    } catch {
      // corrupted storage: start fresh
    }
  }, []);

  useEffect(() => {
    ls.set("suca_score", String(score));
    ls.set("suca_streak", String(streak));
    ls.set("suca_history", JSON.stringify(history.slice(0, 200)));
    ls.set("suca_name", studentName);
    ls.set("suca_grade", grade);
    ls.set("suca_topic_id", topicId);
    ls.set("suca_topic", customTopic);
    ls.set("suca_custom_content", customContent);
    ls.set("suca_difficulty", difficultyLevel);
    ls.set("suca_muted", String(isMuted));
    ls.set("suca_volume", String(volume));
    ls.set("suca_bgId", bgId);
  }, [score, streak, history, studentName, grade, topicId, customTopic, customContent, difficultyLevel, isMuted, volume, bgId]);

  // ---------- question queue: one prepared question per dice face ----------
  const queueRef = useRef<Map<number, Question>>(new Map());
  const pendingRef = useRef<Promise<void> | null>(null);
  const sessionSeenRef = useRef<string[]>([]);
  const requestContextRef = useRef({ grade, topicId, customTopic, customContent });
  requestContextRef.current = { grade, topicId, customTopic, customContent };

  const prefetch = useCallback((faces: number[]): Promise<void> => {
    if (pendingRef.current) return pendingRef.current;
    const missing = faces.filter((f) => !queueRef.current.has(f));
    if (!missing.length) return Promise.resolve();
    const ctx = requestContextRef.current;
    const job = (async () => {
      const exclude = [
        ...loadSeen(SEEN_KEY).slice(-80),
        ...sessionSeenRef.current,
        ...Array.from(queueRef.current.values()).map(seenEntry),
      ];
      const questions = await requestGameQuestions<Question | null>({
        game: "history",
        grade: ctx.grade,
        topicId: ctx.topicId,
        topicText: ctx.customTopic,
        customContent: ctx.customContent,
        slots: missing.map((d) => ({ difficulty: d, type: Math.random() < ESSAY_SHARE ? "essay" : "multiple-choice" })),
        exclude,
      });
      questions.forEach((q, i) => {
        if (q) queueRef.current.set(missing[i], q);
      });
    })().finally(() => {
      pendingRef.current = null;
    });
    pendingRef.current = job;
    return job;
  }, []);

  // Offline bank used when the AI cannot answer (no internet / no credit)
  const offlineRef = useRef<{ grade: string; list: Question[] } | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const takeOffline = (face: number): Question | null => {
    const g = requestContextRef.current.grade;
    if (!offlineRef.current || offlineRef.current.grade !== g || !offlineRef.current.list.length) {
      const seen = new Set(sessionSeenRef.current);
      const all = offlineHistoryQuestions(g);
      const fresh = all.filter((q) => !seen.has(seenEntry(q)));
      offlineRef.current = { grade: g, list: fresh.length ? fresh : all };
    }
    const q = offlineRef.current.list.shift();
    return q ? { ...q, difficulty: face } : null;
  };

  const fetchQuestion = useCallback(
    async (face: number) => {
      setGameState(GameState.FETCHING);
      try {
        let aiFailed = false;
        if (!queueRef.current.has(face)) {
          if (pendingRef.current) await pendingRef.current.catch(() => {});
          if (!queueRef.current.has(face)) await prefetch([face]).catch(() => { aiFailed = true; });
        }
        let question = queueRef.current.get(face);
        if (!question) {
          // AI unavailable: keep playing with the offline history bank
          const offline = takeOffline(face);
          if (offline) {
            queueRef.current.set(face, offline);
            question = offline;
            setOfflineMode(true);
          }
        } else if (!aiFailed) setOfflineMode(false);
        if (!question) throw new Error("Chưa tạo được câu hỏi mới cho mặt xúc xắc này. Bấm thử lại.");
        queueRef.current.delete(face);
        sessionSeenRef.current.push(seenEntry(question));
        rememberSeen(SEEN_KEY, [seenEntry(question)]);
        setCurrentQuestion(question);
        setGameState(GameState.ANSWERING);
        // Prepare the other faces in the background for the next rolls
        void prefetch([1, 2, 3, 4, 5, 6]).catch(() => {});
      } catch (err: any) {
        setErrorMsg(err?.message || "Lỗi kết nối. Vui lòng thử lại.");
        setGameState(GameState.ERROR);
      }
    },
    [prefetch]
  );

  // Changing the topic invalidates prepared questions
  useEffect(() => {
    queueRef.current.clear();
  }, [grade, topicId, customTopic, customContent]);

  const handleRoll = useCallback(() => {
    if (gameState === GameState.ROLLING) return;
    if (difficultyLevel !== Difficulty.INFINITY && sessionStats.totalQuestions >= DIFFICULTY_SETTINGS[difficultyLevel].questions) {
      setShowSummary(true);
      return;
    }
    setGameState(GameState.ROLLING);
    setIsRolling(true);
    setSelectedAnswerIndex(null);
    setPointsEarned(null);
    setErrorMsg(null);
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setCurrentRoll(roll);
      setIsRolling(false);
      void fetchQuestion(roll);
    }, 1500);
  }, [gameState, fetchQuestion, difficultyLevel, sessionStats.totalQuestions]);

  const handleRefreshQuestion = useCallback(() => {
    setSelectedAnswerIndex(null);
    setPointsEarned(null);
    setErrorMsg(null);
    void fetchQuestion(currentRoll);
  }, [currentRoll, fetchQuestion]);

  const handleAnswer = useCallback(
    async (answer: number | string, isRetry: boolean) => {
      if (gameState !== GameState.ANSWERING || !currentQuestion) return;
      let isCorrect = false;
      let feedback = "";
      let index: number | null = null;
      let studentAnswer = "";

      if (currentQuestion.type === "essay" && typeof answer === "string") {
        setGameState(GameState.EVALUATING);
        try {
          const res = await fetch("/api/game-grade-essay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: currentQuestion.text,
              sampleAnswer: currentQuestion.sampleAnswer || currentQuestion.explanation,
              keyPoints: currentQuestion.keyPoints || [],
              studentAnswer: answer,
              grade,
            }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.success) throw new Error(data?.error || "Chưa chấm được bài lúc này. Hãy thử lại.");
          isCorrect = Boolean(data.isCorrect);
          feedback = String(data.feedback || "");
          studentAnswer = answer;
        } catch (err: any) {
          setErrorMsg(err?.message || "Lỗi chấm điểm. Vui lòng thử lại.");
          setGameState(GameState.ERROR);
          return;
        }
      } else if (typeof answer === "number") {
        index = answer;
        isCorrect = index === currentQuestion.correctAnswerIndex;
      }

      setSelectedAnswerIndex(index);
      setGameState(GameState.RESULT);
      setHistory((prev) => [
        { question: currentQuestion, selectedAnswerIndex: index ?? undefined, studentAnswer: studentAnswer || undefined, isCorrect, feedback: feedback || undefined, timestamp: Date.now() },
        ...prev,
      ]);

      const multiplier = DIFFICULTY_SETTINGS[difficultyLevel].multiplier;
      const limit = DIFFICULTY_SETTINGS[difficultyLevel].questions;
      signalFeedback(isCorrect ? "correct" : "wrong");
      if (isCorrect) {
        if (!prefersLessMotion()) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#f59e0b", "#fbbf24", "#d97706", "#ffffff"] });
        const earned = Math.round(currentQuestion.difficulty * (isRetry ? 5 : 10) * multiplier);
        setScore((s) => s + earned);
        if (!isRetry) {
          setStreak((s) => {
            const next = s + 1;
            setSessionStats((prev) => ({ ...prev, longestStreak: Math.max(prev.longestStreak, next) }));
            return next;
          });
        }
        setPointsEarned(earned);
        setSessionStats((prev) => {
          const total = prev.totalQuestions + 1;
          if (difficultyLevel !== Difficulty.INFINITY && total >= limit) setTimeout(() => setShowSummary(true), 1500);
          return { ...prev, correctAnswers: prev.correctAnswers + 1, sessionScore: prev.sessionScore + earned, totalQuestions: total };
        });
      } else {
        setStreak(0);
        setPointsEarned(0);
        setSessionMistakes((list) => (list.includes(currentQuestion) ? list : [...list, currentQuestion]));
        // read the explanation for at least 2 seconds before the next roll
        setRollReady(false);
        window.setTimeout(() => setRollReady(true), 2000);
        setSessionStats((prev) => {
          const total = prev.totalQuestions + 1;
          if (difficultyLevel !== Difficulty.INFINITY && total >= limit) setTimeout(() => setShowSummary(true), 1500);
          return { ...prev, totalQuestions: total };
        });
      }
    },
    [gameState, currentQuestion, difficultyLevel, grade]
  );

  // Rewards and record when a session summary opens (once per session)
  const sessionSettledRef = useRef(false);
  useEffect(() => {
    if (!showSummary || sessionSettledRef.current || sessionStats.totalQuestions === 0) return;
    sessionSettledRef.current = true;
    onLogEvent("state", `Kết thúc phiên Sử Ca: ${sessionStats.correctAnswers}/${sessionStats.totalQuestions} câu đúng.`);
    if (sessionStats.sessionScore > highScore) onSaveHighScore(sessionStats.sessionScore);
    // Shared rule for all games: from 3 correct answers, 4 XP + 2 Xu each (max 50 XP / 30 Xu)
    const rw = rewardFor(sessionStats.correctAnswers);
    setSessionReward(rw);
    if (rw.xp > 0) {
      onAwardReward({ xp: rw.xp, coins: rw.coins, reason: `Sử Ca – ${sessionStats.correctAnswers} câu đúng` });
    }
  }, [showSummary, sessionStats, highScore, onSaveHighScore, onAwardReward, onLogEvent]);

  const resetSessionStats = () => {
    sessionSettledRef.current = false;
    setSessionStats({ totalQuestions: 0, correctAnswers: 0, sessionScore: 0, longestStreak: 0 });
    setSessionMistakes([]);
    setSessionReward({ xp: 0, coins: 0 });
  };

  const resetGame = () => {
    setGameState(GameState.SETUP);
    setScore(0);
    setStreak(0);
    resetSessionStats();
    setCurrentQuestion(null);
    setSelectedAnswerIndex(null);
    setPointsEarned(null);
  };

  const clearHistory = () => {
    setHistory([]);
    setScore(0);
    setStreak(0);
  };

  const handleRandomTopic = () => {
    const list = HISTORY_TOPICS[grade];
    setTopicId(list[Math.floor(Math.random() * list.length)].id);
    setCustomTopic("");
    setTopicError("");
  };

  const startGame = () => {
    let valid = true;
    setNameError("");
    setTopicError("");
    const name = studentName.trim();
    if (name.length < 2) {
      setNameError("Hãy nhập tên của bạn (ít nhất 2 ký tự).");
      valid = false;
    } else if (name.length > 50) {
      setNameError("Tên quá dài, tối đa 50 ký tự.");
      valid = false;
    }
    if (!topicId && customTopic.trim().length < 2 && customContent.trim().length < 20) {
      setTopicError("Hãy chọn một chủ đề trong sách, hoặc nhập chủ đề/nội dung của bạn.");
      valid = false;
    }
    if (!valid) return;
    queueRef.current.clear();
    sessionSeenRef.current = [];
    resetSessionStats();
    setGameState(GameState.IDLE);
    onLogEvent("state", `Bắt đầu Sử Ca: ${grade}, ${topicLabel}.`);
    void prefetch([1, 2, 3, 4, 5, 6]).catch(() => {});
  };

  const currentBgClass = BACKGROUNDS.find((b) => b.id === bgId)?.class || "bg-amber-50";
  const topicList = HISTORY_TOPICS[grade];

  return (
    <div className={`su-ca-root ${currentBgClass} min-h-[80dvh] rounded-2xl overflow-hidden text-slate-900 flex flex-col selection:bg-amber-200`}>
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} onClearHistory={clearHistory} isMuted={isMuted} volume={volume} />

      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        stats={{ ...sessionStats, difficulty: DIFFICULTY_SETTINGS[difficultyLevel].label }}
        studentName={studentName}
        mistakes={sessionMistakes}
        reward={sessionReward}
        onRestart={() => {
          resetSessionStats();
          setShowSummary(false);
          setTimeout(() => handleRoll(), 0);
        }}
        onHome={() => {
          setShowSummary(false);
          resetGame();
        }}
      />

      {showThemeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 animate-[fadeIn_0.2s_ease-out]" role="dialog" aria-modal="true" aria-label="Chọn giao diện">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-amber-900">Chọn giao diện</h3>
              <button type="button" onClick={() => setShowThemeModal(false)} aria-label="Đóng" className="w-11 h-11 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBgId(bg.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${bgId === bg.id ? "border-indigo-500 bg-indigo-50" : "border-slate-100 hover:border-indigo-200"}`}
                >
                  <div className="w-8 h-8 rounded-full border border-slate-300" style={{ backgroundColor: bg.color }} />
                  <span className={`font-medium ${bgId === bg.id ? "text-indigo-700" : "text-slate-700"}`}>{bg.name}</span>
                  {bgId === bg.id && <CheckCircle2 size={16} className="ml-auto text-indigo-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/85 border-b border-amber-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          <button type="button" className="flex items-center gap-2 min-w-0" onClick={() => setGameState(GameState.SETUP)} aria-label="Về màn chọn chủ đề">
            <div className="bg-amber-700 p-2 rounded-lg text-white"><ScrollText size={22} /></div>
            <span className="text-xl font-bold font-serif text-amber-900 hidden sm:block">Sử Ca</span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-3">
            {gameState !== GameState.SETUP && (
              <div className="flex items-center gap-1.5 sm:gap-3 text-sm font-medium">
                <div className="hidden md:flex items-center gap-2 text-slate-600 mr-2 border-r border-slate-200 pr-4">
                  <User size={16} />
                  <span className="truncate max-w-[120px]">{studentName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200" title="Chuỗi trả lời đúng">
                  <Flame size={16} fill="currentColor" /><span className="num">{streak}</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200" title="Tổng điểm">
                  <Trophy size={16} /><span className="num">{score}</span>
                </div>
              </div>
            )}
            <button type="button" onClick={() => setShowThemeModal(true)} aria-label="Đổi giao diện" className="w-11 h-11 flex items-center justify-center text-slate-600 bg-slate-50 hover:bg-slate-200 rounded-full"><Palette size={20} /></button>
            <button type="button" onClick={() => setShowHelpModal(true)} aria-label="Hướng dẫn chơi" className="w-11 h-11 hidden sm:flex items-center justify-center bg-amber-50 hover:bg-amber-100 rounded-full text-amber-700"><HelpCircle size={20} /></button>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-full"
            >
              {isMuted || volume === 0 ? <VolumeX size={20} className="text-slate-400" /> : <Volume2 size={20} />}
            </button>
            <button type="button" onClick={() => setShowHistory(true)} aria-label="Lịch sử học tập" className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-full relative">
              <HistoryIcon size={22} />
              {history.length > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-3 sm:p-4 md:p-8 max-w-5xl mx-auto w-full">
        {gameState === GameState.SETUP && (
          <div className="w-full max-w-lg mt-4 md:mt-10 animate-[fadeIn_0.5s_ease-out]">
            <div className="bg-white p-5 md:p-10 rounded-xl shadow-xl border border-amber-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-red-600" />
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-900 mb-2">Hành Trình Lịch Sử</h2>
                <p className="text-slate-600">Tung xúc xắc: mặt càng lớn, câu hỏi càng khó.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="suca-name" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <User size={18} className="text-amber-600" /> Tên của bạn
                  </label>
                  <input
                    id="suca-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Nhập tên học sinh..."
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    aria-describedby={nameError ? "suca-name-error" : undefined}
                    className={`w-full p-3 rounded-lg border text-base ${nameError ? "border-red-500" : "border-slate-300 focus:border-amber-500"} bg-white focus:ring-2 focus:ring-amber-200 outline-none`}
                  />
                  {nameError && <p id="suca-name-error" className="text-red-600 text-sm mt-1">{nameError}</p>}
                </div>

                <div>
                  <label htmlFor="suca-grade" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <GraduationCap size={18} className="text-amber-600" /> Lớp học
                  </label>
                  <select
                    id="suca-grade"
                    value={grade}
                    onChange={(e) => {
                      setGrade(e.target.value as GradeLabel);
                      setTopicId("");
                    }}
                    className="w-full p-3 rounded-lg border border-slate-300 bg-white text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none cursor-pointer"
                  >
                    {GAME_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <Zap size={18} className="text-amber-600" /> Độ dài hành trình
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((level) => {
                      const s = DIFFICULTY_SETTINGS[level];
                      const selected = difficultyLevel === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setDifficultyLevel(level)}
                          className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${selected ? `${s.border} ${s.bg} ring-1 ring-amber-200` : "border-slate-100 bg-white hover:border-slate-200"}`}
                        >
                          <span className={`text-sm font-bold ${s.color}`}>{s.label}</span>
                          <span className="text-sm text-slate-600">{level === Difficulty.INFINITY ? "∞ câu" : `${s.questions} câu`}</span>
                          <span className="text-sm text-slate-600">x{s.multiplier} điểm</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="suca-topic" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <BookOpen size={18} className="text-amber-600" /> Chủ đề trong sách {grade}
                  </label>
                  <select
                    id="suca-topic"
                    value={topicId}
                    onChange={(e) => {
                      setTopicId(e.target.value);
                      if (topicError) setTopicError("");
                    }}
                    className="w-full p-3 rounded-lg border border-slate-300 bg-white text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none cursor-pointer"
                  >
                    <option value="">Chọn chủ đề…</option>
                    {topicList.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button type="button" onClick={handleRandomTopic} className="flex items-center gap-1 text-sm px-3 py-2 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md hover:bg-indigo-200 font-bold">
                      <Shuffle size={14} /> Chủ đề ngẫu nhiên
                    </button>
                  </div>

                  <label htmlFor="suca-custom-topic" className="block text-sm font-bold text-slate-700 mt-4 mb-2">
                    Hoặc nhập chủ đề của bạn
                  </label>
                  <input
                    id="suca-custom-topic"
                    type="text"
                    placeholder="VD: Chiến thắng Bạch Đằng năm 938, Nhà Trần..."
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value);
                      if (e.target.value.trim()) setTopicId("");
                      if (topicError) setTopicError("");
                    }}
                    className="w-full p-3 rounded-lg border border-slate-300 bg-white text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowCustomContent((v) => !v)}
                    aria-expanded={showCustomContent}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-amber-800"
                  >
                    <ChevronDown size={16} className={`transition-transform ${showCustomContent ? "rotate-180" : ""}`} />
                    Dán nội dung bài học của bạn (không bắt buộc)
                  </button>
                  {showCustomContent && (
                    <textarea
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value.slice(0, 2500))}
                      rows={4}
                      placeholder="Dán đoạn bài học, đề cương hoặc ghi chú. Câu hỏi sẽ bám theo nội dung này."
                      className="mt-2 w-full p-3 rounded-lg border border-slate-300 bg-white text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                    />
                  )}
                  {topicError && <p className="text-red-600 text-sm mt-2" role="alert">{topicError}</p>}
                </div>

                <button
                  type="button"
                  onClick={startGame}
                  className="w-full mt-2 min-h-[52px] bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-lg text-lg flex items-center justify-center gap-2 shadow-lg"
                >
                  <Rocket size={22} /> Bắt đầu hành trình
                </button>

                {history.length > 0 && (
                  <div className="text-center">
                    <button type="button" onClick={() => setShowHistory(true)} className="min-h-[44px] text-sm text-slate-600 hover:text-amber-800 underline">
                      Xem lại lịch sử ({history.length} câu)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {gameState !== GameState.SETUP && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex flex-col items-center mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-2 px-2 text-center">
                <ScrollText size={16} className="text-amber-600 shrink-0" />
                <span>{topicLabel}</span>
              </div>
              <ProgressBar
                currentQuestionIndex={sessionStats.totalQuestions + (gameState === GameState.ANSWERING || gameState === GameState.RESULT || gameState === GameState.EVALUATING ? 0 : 1)}
                totalQuestions={DIFFICULTY_SETTINGS[difficultyLevel].questions}
                difficultyLevel={difficultyLevel}
              />
              {offlineMode && <p className="mt-1 text-xs font-semibold text-amber-800">AI đang tạm nghỉ – đang dùng câu hỏi trắc nghiệm có sẵn.</p>}
            </div>

            <div className="relative mb-6 w-full max-w-md">
              <Dice value={currentRoll} isRolling={isRolling} isMuted={isMuted} volume={volume} />
              {(gameState === GameState.IDLE || gameState === GameState.RESULT || gameState === GameState.ERROR) && (
                <div className="flex flex-col gap-3 mt-4 items-center animate-[fadeInUp_0.3s_ease-out]">
                  <button type="button" onClick={handleRoll} disabled={gameState === GameState.RESULT && !rollReady} className="min-h-[52px] px-10 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 disabled:cursor-wait text-white font-bold rounded-full shadow-lg flex items-center gap-3 text-lg">
                    {gameState === GameState.IDLE ? (<><Dices className="w-6 h-6" /> Tung xúc xắc</>) : gameState === GameState.RESULT && !rollReady ? (<>Đọc giải thích…</>) : (<>Tiếp tục thử thách <ArrowRight className="w-6 h-6" /></>)}
                  </button>
                  {(gameState === GameState.RESULT || gameState === GameState.IDLE) && sessionStats.totalQuestions > 0 && (
                    <button type="button" onClick={() => setShowSummary(true)} className="min-h-[48px] px-8 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 flex items-center gap-2">
                      <Trophy size={18} className="text-amber-500" /> Kết thúc phiên học
                    </button>
                  )}
                  {gameState === GameState.RESULT && (
                    <button type="button" onClick={resetGame} className="min-h-[44px] flex items-center gap-2 text-sm text-slate-600 hover:text-amber-800 font-medium underline decoration-dotted underline-offset-4">
                      <RotateCcw size={14} /> Đổi chủ đề hoặc lớp
                    </button>
                  )}
                </div>
              )}
            </div>

            {gameState === GameState.ERROR && (
              <div role="alert" className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 flex items-center gap-3 max-w-lg mb-6">
                <AlertCircle className="shrink-0" />
                <p className="flex-1">{errorMsg}</p>
                <button type="button" onClick={handleRefreshQuestion} aria-label="Thử lại" className="w-11 h-11 flex items-center justify-center hover:bg-red-100 rounded-lg"><RefreshCw size={18} /></button>
              </div>
            )}

            {(gameState === GameState.FETCHING || gameState === GameState.EVALUATING) && (
              <div role="status" className="flex flex-col items-center justify-center p-10 text-slate-600 gap-3 bg-white/60 rounded-xl border border-white/60">
                <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" aria-hidden="true" />
                <p className="font-medium text-amber-900">{gameState === GameState.EVALUATING ? "Đang chấm bài…" : "Đang chuẩn bị câu hỏi…"}</p>
                <p className="text-sm text-slate-600">Chủ đề: {topicLabel}</p>
              </div>
            )}

            {(gameState === GameState.ANSWERING || gameState === GameState.RESULT || gameState === GameState.EVALUATING) && currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                selectedAnswerIndex={selectedAnswerIndex}
                onSelectAnswer={handleAnswer}
                isAnswered={gameState === GameState.RESULT}
                onRetry={() => setGameState(GameState.IDLE)}
                onRefresh={handleRefreshQuestion}
                isMuted={isMuted}
                volume={volume}
                pointsEarned={pointsEarned}
                feedback={history[0]?.question === currentQuestion ? history[0]?.feedback : undefined}
                isCorrectEssay={history[0]?.question === currentQuestion ? history[0]?.isCorrect : undefined}
              />
            )}
          </div>
        )}
      </main>

      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
}
