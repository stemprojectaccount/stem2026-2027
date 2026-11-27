import { Flashcard, Lesson, QuizAttempt, UserProgress } from "../types";

export type SupportedGradeNumber = 6 | 7 | 8 | 9;

export interface StudentProfile {
  userId: string;
  name: string;
  grade: string; // "Lớp 6" | "Lớp 7" | "Lớp 8" | "Lớp 9"
  gradeNumber: SupportedGradeNumber;
  isGradeConfirmed: boolean;
  level: number; // XP Level (separate from school grade)
  curriculum: string;
}

export interface CompactLearningHistory {
  grade: SupportedGradeNumber;
  gradeLabel: string;
  curriculum: string;
  subject: "Toán";
  recentLessons: Array<{
    id: string;
    title: string;
    topic: string;
    keyFormulas: string[];
  }>;
  weakTopics: Array<{
    topic: string;
    errorRate: number;
  }>;
  dueReviewCards: Array<{
    front: string;
    back: string;
  }>;
  askedQuestionIds: string[];
  difficultyTarget: 1 | 2 | 3;
  count: number;
}

export const PV_QUESTION_HISTORY_KEY = "smart_study_pv_question_history_v1";
export const GRADE_CONFIRMED_KEY = "smart_study_grade_confirmed_v1";

export function parseGradeNumber(rawGrade?: string | number | null): {
  gradeNumber: SupportedGradeNumber;
  valid: boolean;
} {
  if (typeof rawGrade === "number") {
    if (rawGrade === 6 || rawGrade === 7 || rawGrade === 8 || rawGrade === 9) {
      return { gradeNumber: rawGrade, valid: true };
    }
  }
  if (typeof rawGrade === "string" && rawGrade.trim().length > 0) {
    const match = rawGrade.match(/\b([6789])\b/);
    if (match) {
      const n = Number(match[1]) as SupportedGradeNumber;
      if (n === 6 || n === 7 || n === 8 || n === 9) {
        return { gradeNumber: n, valid: true };
      }
    }
  }
  return { gradeNumber: 6, valid: false };
}

/**
 * Single Source of Truth for Student Profile & School Grade (Grades 6–9).
 * Strictly separates school grade (Lớp 6..9) from XP level (Lv.1..n).
 */
export function getStudentProfile(progressOverride?: Partial<UserProgress> | null): StudentProfile {
  let rawGrade: string | undefined = progressOverride?.grade;
  let name = progressOverride?.displayName || progressOverride?.nickname || "";
  let level = typeof progressOverride?.level === "number" ? progressOverride.level : 1;
  let userId = "student_local";
  let curriculum = "Kết nối tri thức với cuộc sống";
  let explicitGradeFound = false;

  if (rawGrade && parseGradeNumber(rawGrade).valid) {
    explicitGradeFound = true;
  }

  try {
    const directGrade = localStorage.getItem("smart_study_user_grade");
    if (!explicitGradeFound && directGrade && parseGradeNumber(directGrade).valid) {
      rawGrade = directGrade;
      explicitGradeFound = true;
    }

    const savedProgressRaw = localStorage.getItem("smart_study_progress");
    if (savedProgressRaw) {
      const savedProgress = JSON.parse(savedProgressRaw);
      if (!explicitGradeFound && savedProgress?.grade && parseGradeNumber(savedProgress.grade).valid) {
        rawGrade = savedProgress.grade;
        explicitGradeFound = true;
      }
      if (!name) {
        name = savedProgress?.displayName || savedProgress?.nickname || "";
      }
      if (!progressOverride?.level && typeof savedProgress?.level === "number") {
        level = savedProgress.level;
      }
    }

    const aiMemRaw = localStorage.getItem("smart_study_ai_memory_v1");
    if (aiMemRaw) {
      const aiMem = JSON.parse(aiMemRaw);
      const memGrade = aiMem?.userProfile?.grade;
      if (!explicitGradeFound && memGrade && parseGradeNumber(memGrade).valid) {
        rawGrade = memGrade;
        explicitGradeFound = true;
      }
      if (!name && aiMem?.userProfile?.name) {
        name = aiMem.userProfile.name;
      }
    }

    const lessonsRaw = localStorage.getItem("smart_study_lessons");
    if (lessonsRaw) {
      const lessons: Lesson[] = JSON.parse(lessonsRaw);
      if (Array.isArray(lessons) && lessons.length > 0 && lessons[0]?.curriculum) {
        curriculum = lessons[0].curriculum;
      }
    }

    const confirmedFlag = localStorage.getItem(GRADE_CONFIRMED_KEY);
    if (confirmedFlag === "true") {
      explicitGradeFound = true;
    }
  } catch {}

  const parsed = parseGradeNumber(rawGrade);
  const gradeNumber = parsed.gradeNumber;
  const grade = `Lớp ${gradeNumber}`;

  return {
    userId,
    name: name || "Học sinh",
    grade,
    gradeNumber,
    isGradeConfirmed: explicitGradeFound && parsed.valid,
    level: Math.max(1, level),
    curriculum,
  };
}

export function setStudentGradePreference(gradeInput: SupportedGradeNumber | string): StudentProfile {
  const { gradeNumber } = parseGradeNumber(gradeInput);
  const normalizedGrade = `Lớp ${gradeNumber}`;
  try {
    localStorage.setItem("smart_study_user_grade", normalizedGrade);
    localStorage.setItem(GRADE_CONFIRMED_KEY, "true");
    const savedProgressRaw = localStorage.getItem("smart_study_progress");
    if (savedProgressRaw) {
      const parsed = JSON.parse(savedProgressRaw);
      parsed.grade = normalizedGrade;
      localStorage.setItem("smart_study_progress", JSON.stringify(parsed));
    }
  } catch {}
  return getStudentProfile({ grade: normalizedGrade });
}

function extractFormulasOrKeyLines(content: string): string[] {
  if (!content) return [];
  const results: string[] = [];
  // Extract LaTeX formulas or bullet points with math expressions
  const latexMatches = content.match(/\$[^$\n]{2,60}\$/g);
  if (latexMatches) {
    for (const m of latexMatches) {
      const cleaned = m.replace(/\$/g, "").trim();
      if (cleaned && !results.includes(cleaned)) {
        results.push(cleaned);
        if (results.length >= 4) break;
      }
    }
  }
  if (results.length < 3) {
    const lines = content
      .split(/\n/)
      .map((l) => l.replace(/^[#\-*>\d.\s]+/, "").trim())
      .filter((l) => l.length >= 10 && l.length <= 90);
    for (const line of lines.slice(0, 3)) {
      if (!results.includes(line)) results.push(line);
      if (results.length >= 4) break;
    }
  }
  return results;
}

export interface PVQuestionAttemptRecord {
  questionId: string;
  topic: string;
  grade: SupportedGradeNumber;
  difficulty: 1 | 2 | 3;
  correct: boolean;
  timeMs: number;
  timestamp: string;
  questionText?: string;
  correctAnswerText?: string;
  explanation?: string;
}

export function loadPVQuestionHistory(): PVQuestionAttemptRecord[] {
  try {
    const raw = localStorage.getItem(PV_QUESTION_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * Collects the student's real learning history (lessons, flashcards, quiz attempts, and game history)
 * filtered strictly to the student's active school grade (Grades 6–9) and strips all PII.
 */
export function collectLearningHistory(
  progressOverride?: Partial<UserProgress> | null,
  options?: {
    count?: number;
    difficultyTarget?: 1 | 2 | 3;
    topicFilter?: string;
  }
): CompactLearningHistory {
  const profile = getStudentProfile(progressOverride);
  const grade = profile.gradeNumber;
  const count = options?.count || 10;
  const difficultyTarget = options?.difficultyTarget || 2;

  const recentLessons: CompactLearningHistory["recentLessons"] = [];
  const weakTopicsMap = new Map<string, { wrong: number; total: number }>();
  const dueReviewCards: CompactLearningHistory["dueReviewCards"] = [];
  const askedQuestionIds: string[] = [];

  try {
    // 1. Lessons from smart_study_lessons
    const lessonsRaw = localStorage.getItem("smart_study_lessons");
    if (lessonsRaw) {
      const lessons: Lesson[] = JSON.parse(lessonsRaw);
      if (Array.isArray(lessons)) {
        const gradeLessons = lessons.filter((l) => {
          const g = parseGradeNumber(l.grade);
          const isSameGrade = g.valid && g.gradeNumber === grade;
          const isMath =
            !l.bookName ||
            l.bookName.toLowerCase().includes("toán") ||
            l.title.toLowerCase().includes("toán") ||
            l.topic?.toLowerCase().includes("số") ||
            l.topic?.toLowerCase().includes("hình") ||
            l.topic?.toLowerCase().includes("đại số") ||
            l.topic?.toLowerCase().includes("phương trình");
          return isSameGrade && isMath;
        });

        for (const l of gradeLessons.slice(0, 5)) {
          recentLessons.push({
            id: l.id,
            title: l.title.slice(0, 80),
            topic: (l.topic || l.title).slice(0, 60),
            keyFormulas: extractFormulasOrKeyLines(l.content || l.notes || ""),
          });
        }
      }
    }

    // 2. Flashcards from smart_study_flashcards
    const flashcardsRaw = localStorage.getItem("smart_study_flashcards");
    if (flashcardsRaw) {
      const cards: Flashcard[] = JSON.parse(flashcardsRaw);
      if (Array.isArray(cards)) {
        const nowIso = new Date().toISOString();
        const due = cards.filter(
          (c) => !c.nextReviewDate || c.nextReviewDate <= nowIso || c.status !== "mastered"
        );
        for (const c of due.slice(0, 6)) {
          dueReviewCards.push({
            front: String(c.front || "").slice(0, 90),
            back: String(c.back || "").slice(0, 90),
          });
        }
      }
    }

    // 3. Quiz attempts from smart_study_quiz_attempts_v1
    const quizRaw = localStorage.getItem("smart_study_quiz_attempts_v1");
    if (quizRaw) {
      const attempts: QuizAttempt[] = JSON.parse(quizRaw);
      if (Array.isArray(attempts)) {
        for (const att of attempts.slice(0, 30)) {
          if (!att.topic) continue;
          // Check if attempt mentions another grade explicitly
          const explicitGradeInTopic = att.topic.match(/Lớp\s*([6789])/i);
          if (explicitGradeInTopic && Number(explicitGradeInTopic[1]) !== grade) {
            continue;
          }
          const total = Math.max(1, att.totalQuestions || 5);
          const wrong = Math.max(0, total - (att.score || 0));
          const prev = weakTopicsMap.get(att.topic) || { wrong: 0, total: 0 };
          weakTopicsMap.set(att.topic, {
            wrong: prev.wrong + wrong,
            total: prev.total + total,
          });
        }
      }
    }

    // 4. Pixel Vanguard question history
    const pvHistory = loadPVQuestionHistory();
    for (const rec of pvHistory) {
      if (rec.grade === grade) {
        if (rec.questionId && !askedQuestionIds.includes(rec.questionId)) {
          askedQuestionIds.push(rec.questionId);
        }
        if (rec.topic) {
          const prev = weakTopicsMap.get(rec.topic) || { wrong: 0, total: 0 };
          weakTopicsMap.set(rec.topic, {
            wrong: prev.wrong + (rec.correct ? 0 : 1),
            total: prev.total + 1,
          });
        }
      }
    }
  } catch {}

  const weakTopics: CompactLearningHistory["weakTopics"] = Array.from(weakTopicsMap.entries())
    .map(([topic, stat]) => ({
      topic: topic.slice(0, 60),
      errorRate: Number((stat.wrong / Math.max(1, stat.total)).toFixed(2)),
    }))
    .filter((item) => item.errorRate >= 0.25)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5);

  if (options?.topicFilter && options.topicFilter !== "all") {
    weakTopics.unshift({
      topic: options.topicFilter,
      errorRate: 0.5,
    });
  }

  return {
    grade,
    gradeLabel: `Lớp ${grade}`,
    curriculum: profile.curriculum,
    subject: "Toán",
    recentLessons,
    weakTopics,
    dueReviewCards,
    askedQuestionIds: askedQuestionIds.slice(-60),
    difficultyTarget,
    count,
  };
}
