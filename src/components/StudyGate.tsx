// Full-screen study challenge shown by the study lock.
//  - Phone ("unlock"): answer 5 questions correctly → locked apps open for a while.
//  - Computer ("break"): 5 correct answers → read 1 lesson → pass 1 short quiz → screen unlocks.
// Questions come from the AI (no repeats, see /api/study-gate/questions) with an offline bank
// as fallback, so the lock can always be completed even without internet.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CheckCircle2, ChevronRight, KeyRound, Lock, RefreshCw, XCircle } from "lucide-react";
import { Lesson } from "../types";
import { SAMPLE_LESSONS } from "../data";
import { GATE_SUBJECTS, GateQuestion, bankQuestions } from "../data/studyGateBank";
import { loadSeen, rememberSeen } from "../games/shared/questionMemory";
import { GateRequest, StudyLockAndroid, desktopStudyLock } from "../lib/studyLock";
import { normalizeQuestionKey } from "../data/gameCurriculum";

const MathMarkdown = React.lazy(() => import("./MathMarkdown"));

const NEED_CORRECT = 5;
const QUIZ_SIZE = 5;
const QUIZ_PASS = 3;
const MIN_READ_SECONDS = 60;
const SEEN_KEY = "study-gate";

type Step = "questions" | "lesson" | "quiz" | "done";

async function fetchWithTimeout(url: string, body: unknown, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
  } finally {
    clearTimeout(t);
  }
}

function subjectForLesson(lesson: Lesson): string {
  const name = `${lesson.bookName} ${lesson.title}`.toLowerCase();
  if (/toán/.test(name)) return "toan";
  if (/anh|english/.test(name)) return "tieng-anh";
  if (/lịch sử|địa/.test(name)) return "lich-su-dia-ly";
  if (/văn|tiếng việt/.test(name)) return "ngu-van";
  if (/tin học/.test(name)) return "tin-hoc";
  if (/gdcd|công dân/.test(name)) return "gdcd";
  return "khtn";
}

function pickUnseen(pool: GateQuestion[], seenKeys: Set<string>, n: number): GateQuestion[] {
  const fresh = pool.filter((q) => !seenKeys.has(normalizeQuestionKey(q.question)));
  const source = fresh.length >= n ? fresh : pool; // bank exhausted: allow repeats rather than block
  return [...source].sort(() => Math.random() - 0.5).slice(0, n);
}

// ---------- one multiple-choice question ----------
function QuestionCard({ q, onAnswered }: { q: GateQuestion; onAnswered: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => setPicked(null), [q.id]);
  const answered = picked !== null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
      <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
        <React.Suspense fallback={<p>{q.question}</p>}>
          <MathMarkdown text={q.question} />
        </React.Suspense>
      </div>
      <div className="mt-4 grid gap-2">
        {q.options.map((opt, i) => {
          const isRight = i === q.correctIndex;
          const state = !answered ? "idle" : isRight ? "right" : i === picked ? "wrong" : "dim";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i)}
              className={
                "min-h-[52px] w-full text-left px-4 py-3 rounded-xl border-2 text-base transition-colors flex items-center gap-3 " +
                (state === "idle"
                  ? "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50"
                  : state === "right"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : state === "wrong"
                  ? "border-red-400 bg-red-50 text-red-900"
                  : "border-slate-100 text-slate-500")
              }
            >
              <span className="w-7 h-7 shrink-0 rounded-full bg-slate-100 text-slate-700 text-sm font-bold flex items-center justify-center">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">
                <React.Suspense fallback={opt}>
                  <MathMarkdown text={opt} />
                </React.Suspense>
              </span>
              {state === "right" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {state === "wrong" && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-4">
          <p className={"font-semibold " + (picked === q.correctIndex ? "text-emerald-700" : "text-red-700")}>
            {picked === q.correctIndex ? "Chính xác!" : "Chưa đúng."}
          </p>
          {q.explanation && (
            <div className="text-slate-700 mt-1 text-sm sm:text-base">
              <React.Suspense fallback={q.explanation}>
                <MathMarkdown text={q.explanation} />
              </React.Suspense>
            </div>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => onAnswered(picked === q.correctIndex)}
            className="mt-4 min-h-[48px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-2"
          >
            Tiếp tục <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- main gate ----------
export default function StudyGate({
  request,
  lessons,
  grade,
  onClose,
}: {
  request: GateRequest;
  lessons: Lesson[];
  grade: string;
  onClose: () => void;
}) {
  const isBreak = request.mode === "break";
  const [step, setStep] = useState<Step>("questions");
  const [subject, setSubject] = useState<string | null>(null);
  const [queue, setQueue] = useState<GateQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [readSeconds, setReadSeconds] = useState(0);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [quiz, setQuiz] = useState<GateQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [finishing, setFinishing] = useState(false);
  // Required study time (set by the parent, 30 min – 2 h) and the active time studied so far.
  const progressKey = `smartstudy_gate_progress_v1:${request.mode}`;
  const [requiredMinutes, setRequiredMinutes] = useState(30);
  const [activeSeconds, setActiveSeconds] = useState<number>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`smartstudy_gate_progress_v1:${request.mode}`) || "null");
      // Resume an unfinished session from the last few hours (app closed or phone locked)
      if (saved && Date.now() - saved.at < 3 * 3600_000) return Number(saved.seconds) || 0;
    } catch {
      // ignore
    }
    return 0;
  });
  const [quizPassedOnce, setQuizPassedOnce] = useState(false);
  const lastInteraction = useRef(Date.now());
  const pinnedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const m = isBreak ? (await desktopStudyLock()?.getState())?.studyMinutes : (await StudyLockAndroid.getStatus()).studyMinutes;
        if (m) setRequiredMinutes(Math.max(30, Math.min(120, m)));
      } catch {
        // keep 30
      }
    })();
  }, [isBreak]);

  // Android: pin the study screen so the child cannot leave this gate to go back to a game.
  // Unpinned again when they finish studying, a parent enters the PIN, or the gate closes.
  useEffect(() => {
    if (isBreak) return;
    (async () => {
      try {
        if (!(await StudyLockAndroid.getStatus()).autoPin) return;
        const r = await StudyLockAndroid.startStudyPin();
        pinnedRef.current = !!r.pinning;
      } catch {
        // pinning not available on this device: the overlay still covers the games
      }
    })();
    return () => {
      if (pinnedRef.current) {
        pinnedRef.current = false;
        StudyLockAndroid.stopStudyPin().catch(() => {});
      }
    };
  }, [isBreak]);

  const unpin = async () => {
    if (pinnedRef.current) {
      pinnedRef.current = false;
      await StudyLockAndroid.stopStudyPin().catch(() => {});
    }
  };

  // Count only real study time: the screen is visible and the student touched/scrolled/typed recently
  useEffect(() => {
    const touch = () => { lastInteraction.current = Date.now(); };
    const events = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, touch, { capture: true, passive: true }));
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastInteraction.current > 90_000) return; // idle
      setActiveSeconds((s) => {
        const next = s + 1;
        if (next % 10 === 0) {
          try { localStorage.setItem(progressKey, JSON.stringify({ seconds: next, at: Date.now() })); } catch { /* full */ }
        }
        return next;
      });
    }, 1000);
    return () => {
      clearInterval(t);
      events.forEach((ev) => window.removeEventListener(ev, touch, { capture: true }));
    };
  }, [progressKey]);
  const timeDone = activeSeconds >= requiredMinutes * 60;
  const sessionSeen = useRef<Set<string>>(new Set());

  const allLessons = useMemo(() => {
    const map = new Map<string, Lesson>();
    [...lessons, ...SAMPLE_LESSONS].forEach((l) => {
      if (l?.content && l.content.length > 200 && !map.has(l.id)) map.set(l.id, l);
    });
    return [...map.values()];
  }, [lessons]);

  const seenKeys = useCallback(() => {
    const s = new Set(loadSeen(SEEN_KEY).map(normalizeQuestionKey));
    sessionSeen.current.forEach((k) => s.add(k));
    return s;
  }, []);

  const loadQuestions = useCallback(
    async (subj: string, count: number): Promise<GateQuestion[]> => {
      const seen = seenKeys();
      try {
        const data = await fetchWithTimeout(
          "/api/study-gate/questions",
          { subject: subj, grade, count, exclude: loadSeen(SEEN_KEY).slice(-60) },
          9000
        );
        const fresh = (data?.questions || []).filter((q: GateQuestion) => !seen.has(normalizeQuestionKey(q.question)));
        if (fresh.length >= Math.min(count, 3)) return fresh;
      } catch {
        // AI unavailable: offline bank below
      }
      return pickUnseen(bankQuestions(subj, grade), seen, count);
    },
    [grade, seenKeys]
  );

  const markSeen = (q: GateQuestion) => {
    const key = normalizeQuestionKey(q.question);
    sessionSeen.current.add(key);
    rememberSeen(SEEN_KEY, [q.question.slice(0, 150)]);
  };

  const chooseSubject = async (subj: string) => {
    setSubject(subj);
    setLoading(true);
    setQueue(await loadQuestions(subj, 6));
    setLoading(false);
  };

  // Keep the queue topped up while answering
  useEffect(() => {
    if (step !== "questions" || !subject || loading || queue.length > 2) return;
    let cancelled = false;
    loadQuestions(subject, 6).then((more) => {
      if (cancelled) return;
      setQueue((q) => {
        const have = new Set(q.map((x) => normalizeQuestionKey(x.question)));
        return [...q, ...more.filter((m) => !have.has(normalizeQuestionKey(m.question)))];
      });
    });
    return () => {
      cancelled = true;
    };
  }, [queue.length, step, subject, loading, loadQuestions]);

  const onQuestionAnswered = (ok: boolean) => {
    const q = queue[0];
    if (q) markSeen(q);
    setQueue((qs) => qs.slice(1));
    setAnswered((n) => n + 1);
    if (ok) {
      const next = correct + 1;
      setCorrect(next);
      if (next >= NEED_CORRECT) setStep("lesson");
    }
  };

  // Lesson reading timer
  useEffect(() => {
    if (step !== "lesson" || !lesson) return;
    const t = setInterval(() => setReadSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [step, lesson]);

  const startQuiz = async () => {
    if (!lesson) return;
    setStep("quiz");
    setQuizLoading(true);
    setQuizIndex(0);
    setQuizCorrect(0);
    let items: GateQuestion[] = [];
    try {
      const data = await fetchWithTimeout("/api/generate-quiz", { currentLesson: lesson, oldLessons: [] }, 15000);
      items = (data?.quiz || [])
        .filter((q: any) => Array.isArray(q?.options) && q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4)
        .slice(0, QUIZ_SIZE)
        .map((q: any, i: number) => ({ id: `quiz-${Date.now()}-${i}`, subject: subjectForLesson(lesson), question: String(q.question), options: q.options.map(String), correctIndex: q.correctIndex, explanation: String(q.explanation || "") }));
    } catch {
      // fall back below
    }
    if (items.length < QUIZ_SIZE) {
      items = [...items, ...pickUnseen(bankQuestions(subjectForLesson(lesson), lesson.grade), seenKeys(), QUIZ_SIZE - items.length)];
    }
    setQuiz(items);
    setQuizLoading(false);
  };

  const onQuizAnswered = (ok: boolean) => {
    const q = quiz[quizIndex];
    if (q) markSeen(q);
    const nextCorrect = quizCorrect + (ok ? 1 : 0);
    setQuizCorrect(nextCorrect);
    setQuizIndex((i) => i + 1);
  };
  const quizFinished = step === "quiz" && !quizLoading && quiz.length > 0 && quizIndex >= quiz.length;
  const quizPassed = quizFinished && quizCorrect >= QUIZ_PASS;

  // A passed quiz ends the round: finish if enough time was studied, otherwise study another lesson
  useEffect(() => {
    if (!quizPassed) return;
    setQuizPassedOnce(true);
    if (timeDone) setStep("done");
    else {
      setLesson(null);
      setStep("lesson");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizPassed]);

  // Enough time studied after the questions and a passed quiz: done
  useEffect(() => {
    if (timeDone && quizPassedOnce && correct >= NEED_CORRECT && step === "lesson") setStep("done");
  }, [timeDone, quizPassedOnce, correct, step]);

  useEffect(() => {
    if (step === "done") {
      try { localStorage.removeItem(progressKey); } catch { /* ignore */ }
    }
  }, [step, progressKey]);

  // ---------- finishing ----------
  const finish = async () => {
    setFinishing(true);
    try {
      if (isBreak) {
        await desktopStudyLock()?.finishBreak();
      } else {
        await unpin(); // leave the pinned study screen before opening the app
        await StudyLockAndroid.grantUnlock({});
        if (request.packageName) await StudyLockAndroid.openApp({ packageName: request.packageName });
      }
    } catch {
      // ignore: closing the gate is still fine
    }
    window.dispatchEvent(new CustomEvent("smartstudy-study-completed", { detail: { via: "study" } }));
    setFinishing(false);
    onClose();
  };

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    let ok = false;
    try {
      if (isBreak) ok = Boolean(await desktopStudyLock()?.emergencyUnlock(pin));
      else {
        ok = (await StudyLockAndroid.verifyPin({ pin })).ok;
        if (ok) {
          await unpin(); // parent PIN correct: release the pinned screen
          await StudyLockAndroid.grantUnlock({});
        }
      }
    } catch {
      ok = false;
    }
    if (ok) {
      window.dispatchEvent(new CustomEvent("smartstudy-study-completed", { detail: { via: "pin" } }));
      onClose();
    } else setPinError("Mã PIN không đúng.");
  };

  const steps: { id: Step; label: string }[] = [
    { id: "questions", label: `Trả lời đúng ${NEED_CORRECT} câu` },
    { id: "lesson", label: "Học bài" },
    { id: "quiz", label: "Làm quiz" },
  ];
  const studiedMin = Math.floor(activeSeconds / 60);
  const leftMin = Math.max(0, requiredMinutes - studiedMin);
  const stepIndex = step === "done" ? steps.length : steps.findIndex((s) => s.id === step);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Khoá học tập"
      className="fixed inset-0 z-[300] bg-gradient-to-br from-indigo-50 via-white to-sky-50 overflow-y-auto"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-8">
        <header className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isBreak ? "Đến giờ nghỉ học tập" : `Học để mở ${request.appLabel || "ứng dụng"}`}
            </h1>
            <p className="text-slate-600 mt-0.5">
              {request.reason ||
                `Trả lời đúng ${NEED_CORRECT} câu, học bài, làm quiz và học đủ ${requiredMinutes} phút để ${isBreak ? "tiếp tục dùng máy tính" : "mở khoá"}.`}
            </p>
          </div>
        </header>

        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-3" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
            <span>Thời gian học: {studiedMin}/{requiredMinutes} phút</span>
            <span className={timeDone ? "text-emerald-700" : "text-slate-600"}>{timeDone ? "Đã đủ ✓" : `còn ${leftMin} phút`}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (activeSeconds / (requiredMinutes * 60)) * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-600">Chỉ tính lúc bạn đang học trên màn hình này. Để yên quá 90 giây thì đồng hồ tạm dừng.</p>
        </div>

        <ol className="mt-5 flex flex-wrap gap-2" aria-label="Các bước">
          {steps.map((s, i) => (
            <li
              key={s.id}
              className={
                "px-3 py-1.5 rounded-full text-sm font-semibold border " +
                (i < stepIndex
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : i === stepIndex
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-slate-200 text-slate-500")
              }
            >
              {i < stepIndex ? "✓ " : `${i + 1}. `}
              {s.label}
            </li>
          ))}
        </ol>

        <main className="mt-5">
          {step === "questions" && !subject && (
            <section>
              <h2 className="font-semibold text-slate-800 mb-3">Chọn một môn bất kỳ</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GATE_SUBJECTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => chooseSubject(s.id)}
                    className="min-h-[64px] rounded-xl bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 px-3 py-3 text-left font-semibold text-slate-800 flex items-center gap-2"
                  >
                    <span className="text-2xl" aria-hidden="true">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === "questions" && subject && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-slate-800">
                  Đúng <span className="text-indigo-700 tabular-nums">{correct}</span>/{NEED_CORRECT}
                  <span className="text-slate-500 font-normal"> · đã trả lời {answered} câu</span>
                </p>
                <button type="button" onClick={() => { setSubject(null); setQueue([]); }} className="min-h-[44px] px-3 text-sm text-indigo-700 font-semibold hover:underline">
                  Đổi môn
                </button>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-4" aria-hidden="true">
                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(correct / NEED_CORRECT) * 100}%` }} />
              </div>
              {loading || !queue[0] ? (
                <div role="status" className="flex items-center gap-3 text-slate-600 py-10 justify-center">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Đang chuẩn bị câu hỏi…
                </div>
              ) : (
                <QuestionCard q={queue[0]} onAnswered={onQuestionAnswered} />
              )}
            </section>
          )}

          {step === "lesson" && !lesson && (
            <section>
              {quizPassedOnce && !timeDone && (
                <p className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                  Giỏi lắm! Còn {leftMin} phút nữa mới đủ thời gian học. Chọn thêm một bài để học tiếp nhé.
                </p>
              )}
              <h2 className="font-semibold text-slate-800 mb-3">Chọn một bài để học</h2>
              <div className="grid gap-2">
                {allLessons.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => { setLesson(l); setReadSeconds(0); setScrolledToEnd(false); }}
                    className="min-h-[56px] rounded-xl bg-white border-2 border-slate-200 hover:border-indigo-400 px-4 py-3 text-left"
                  >
                    <span className="font-semibold text-slate-900 block">{l.title}</span>
                    <span className="text-sm text-slate-600">{l.bookName} · {l.grade}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === "lesson" && lesson && (
            <section>
              <div className="flex items-center gap-2 mb-2 text-slate-700">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold">{lesson.title}</span>
              </div>
              <div
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 max-h-[60vh] overflow-y-auto prose prose-slate max-w-none"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setScrolledToEnd(true);
                }}
                ref={(el) => {
                  if (el && el.scrollHeight <= el.clientHeight + 40 && !scrolledToEnd) setScrolledToEnd(true);
                }}
              >
                <React.Suspense fallback={<p className="whitespace-pre-wrap">{lesson.content}</p>}>
                  <MathMarkdown text={lesson.content} />
                </React.Suspense>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={readSeconds < MIN_READ_SECONDS || !scrolledToEnd}
                  onClick={startQuiz}
                  className="min-h-[48px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-600 text-white font-semibold inline-flex items-center gap-2"
                >
                  Đã học xong, làm quiz <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-600" role="status">
                  {readSeconds < MIN_READ_SECONDS
                    ? `Đọc thêm ${MIN_READ_SECONDS - readSeconds} giây nữa`
                    : !scrolledToEnd
                    ? "Cuộn đến cuối bài để tiếp tục"
                    : "Sẵn sàng!"}
                </span>
                <button type="button" onClick={() => setLesson(null)} className="min-h-[44px] px-3 text-sm text-indigo-700 font-semibold hover:underline">
                  Chọn bài khác
                </button>
              </div>
            </section>
          )}

          {step === "quiz" && (
            <section>
              {quizLoading ? (
                <div role="status" className="flex items-center gap-3 text-slate-600 py-10 justify-center">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Đang tạo bài quiz từ bài học…
                </div>
              ) : quizFinished && !quizPassed ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                  <p className="text-lg font-semibold text-slate-900">Bạn đúng {quizCorrect}/{quiz.length} câu.</p>
                  <p className="text-slate-600 mt-1">Cần đúng ít nhất {QUIZ_PASS} câu. Xem lại bài rồi làm quiz mới nhé.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => { setStep("lesson"); setReadSeconds(MIN_READ_SECONDS - 20); }} className="min-h-[48px] px-5 rounded-xl border-2 border-slate-200 font-semibold">
                      Xem lại bài
                    </button>
                    <button type="button" onClick={startQuiz} className="min-h-[48px] px-5 rounded-xl bg-indigo-600 text-white font-semibold">
                      Làm quiz mới
                    </button>
                  </div>
                </div>
              ) : quiz[quizIndex] ? (
                <>
                  <p className="font-semibold text-slate-800 mb-3">
                    Quiz: câu {quizIndex + 1}/{quiz.length} · đúng {quizCorrect} (cần {QUIZ_PASS})
                  </p>
                  <QuestionCard q={quiz[quizIndex]} onAnswered={onQuizAnswered} />
                </>
              ) : null}
            </section>
          )}

          {step === "done" && (
            <section className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-amber-500 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-900 mt-2">Tuyệt vời, bạn đã hoàn thành!</h2>
              <p className="text-slate-600 mt-1">
                {isBreak ? "Máy tính đã được mở khoá." : `Các ứng dụng đã mở khoá. Hãy dùng có chừng mực nhé!`}
              </p>
              <button
                type="button"
                autoFocus
                disabled={finishing}
                onClick={finish}
                className="mt-5 min-h-[52px] px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg"
              >
                {isBreak ? "Tiếp tục dùng máy" : request.appLabel ? `Mở ${request.appLabel}` : "Xong"}
              </button>
            </section>
          )}
        </main>

        <footer className="mt-8 border-t border-slate-200 pt-4">
          {!showPin ? (
            <button type="button" onClick={() => setShowPin(true)} className="min-h-[44px] text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Phụ huynh mở khoá khẩn cấp
            </button>
          ) : (
            <form onSubmit={submitPin} className="flex flex-wrap items-center gap-2">
              <label htmlFor="gate-pin" className="text-sm text-slate-700">Mã PIN phụ huynh</label>
              <input
                id="gate-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="w-32 min-h-[44px] px-3 rounded-lg border border-slate-300 text-base"
              />
              <button type="submit" className="min-h-[44px] px-4 rounded-lg bg-slate-800 text-white font-semibold">Mở khoá</button>
              {pinError && <p role="alert" className="w-full text-sm text-red-600">{pinError}</p>}
            </form>
          )}
        </footer>
      </div>
    </div>
  );
}
