import { QuizAttempt, QuizSession, Lesson, WeakTopicRecommendation } from "../types";
import { detectLessonSubject, SUBJECT_DEFINITIONS } from "../components/LessonLibraryFilterBar";

export const DEFAULT_QUIZ_ATTEMPTS: QuizAttempt[] = [
  // Session 1: 10 days ago
  {
    id: "attempt-1",
    timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
    dateLabel: "25/09",
    lessonId: "sample-1",
    lessonTitle: "Tập hợp các số tự nhiên",
    subjectId: "math",
    subjectName: "Toán học",
    topic: "Tập hợp số tự nhiên và Phép tính cơ bản",
    score: 3,
    totalQuestions: 5,
    percentage: 60,
    scoreOn10: 6.0
  },
  {
    id: "attempt-2",
    timestamp: new Date(Date.now() - 9 * 86400000).toISOString(),
    dateLabel: "26/09",
    lessonId: "sample-3",
    lessonTitle: "Thì Hiện tại đơn và Hiện tại tiếp diễn",
    subjectId: "english",
    subjectName: "Tiếng Anh",
    topic: "Present Simple vs Continuous",
    score: 3,
    totalQuestions: 5,
    percentage: 60,
    scoreOn10: 6.0
  },
  // Session 2: 7 days ago
  {
    id: "attempt-3",
    timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
    dateLabel: "28/09",
    lessonId: "sample-2",
    lessonTitle: "Chu trình nước trong tự nhiên",
    subjectId: "science",
    subjectName: "Khoa học Tự nhiên",
    topic: "Chu trình nước và Sự bay hơi",
    score: 3,
    totalQuestions: 5,
    percentage: 60,
    scoreOn10: 6.0
  },
  {
    id: "attempt-4",
    timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
    dateLabel: "29/09",
    subjectId: "literature",
    subjectName: "Ngữ văn",
    topic: "Biện pháp tu từ ẩn dụ và hoán dụ",
    score: 3,
    totalQuestions: 5,
    percentage: 60,
    scoreOn10: 6.5
  },
  {
    id: "attempt-5",
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    dateLabel: "30/09",
    subjectId: "social",
    subjectName: "Lịch sử và Địa lý",
    topic: "Bản đồ và Tọa độ địa lý",
    score: 3,
    totalQuestions: 5,
    percentage: 60,
    scoreOn10: 6.5
  },
  // Session 3: 4 days ago - Showing clear improvement
  {
    id: "attempt-6",
    timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    dateLabel: "01/10",
    subjectId: "math",
    subjectName: "Toán học",
    topic: "Lũy thừa với số mũ tự nhiên ($x^2, a^n$)",
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    scoreOn10: 7.5
  },
  {
    id: "attempt-7",
    timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    dateLabel: "01/10",
    subjectId: "english",
    subjectName: "Tiếng Anh",
    topic: "Từ vựng Unit 2 Collocations",
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    scoreOn10: 7.5
  },
  {
    id: "attempt-8",
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    dateLabel: "02/10",
    subjectId: "science",
    subjectName: "Khoa học Tự nhiên",
    topic: "Quang hợp và Hô hấp tế bào",
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    scoreOn10: 8.0
  },
  // Weak topic test: Student encountered difficulty in geometry!
  {
    id: "attempt-9",
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    dateLabel: "02/10",
    subjectId: "math",
    subjectName: "Toán học",
    topic: "Hình học không gian và Góc đối đỉnh",
    score: 2,
    totalQuestions: 5,
    percentage: 40,
    scoreOn10: 4.0
  },
  {
    id: "attempt-10",
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    dateLabel: "03/10",
    subjectId: "literature",
    subjectName: "Ngữ văn",
    topic: "Nghị luận xã hội và Liên kết câu",
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    scoreOn10: 8.0
  },
  {
    id: "attempt-11",
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    dateLabel: "03/10",
    subjectId: "informatics",
    subjectName: "Tin học",
    topic: "Thuật toán tìm kiếm tuần tự và nhị phân",
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    scoreOn10: 8.0
  },
  // Weak topic test: Conditional sentences in English
  {
    id: "attempt-12",
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
    dateLabel: "04/10",
    lessonId: "sample-6",
    lessonTitle: "Câu điều kiện loại 1 và loại 2",
    subjectId: "english",
    subjectName: "Tiếng Anh",
    topic: "Câu điều kiện If loại 2 đảo ngữ",
    score: 2,
    totalQuestions: 5,
    percentage: 40,
    scoreOn10: 5.0
  },
  // Recent high marks - Overall mastery climbing
  {
    id: "attempt-13",
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
    dateLabel: "04/10",
    lessonId: "sample-5",
    lessonTitle: "Bảy hằng đẳng thức đáng nhớ",
    subjectId: "math",
    subjectName: "Toán học",
    topic: "Khai triển $a^2 - b^2$ & $(a+b)^2$",
    score: 5,
    totalQuestions: 5,
    percentage: 100,
    scoreOn10: 9.5
  },
  {
    id: "attempt-14",
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    dateLabel: "05/10",
    subjectId: "science",
    subjectName: "Khoa học Tự nhiên",
    topic: "Vận tốc và Đồ thị chuyển động",
    score: 5,
    totalQuestions: 5,
    percentage: 100,
    scoreOn10: 9.0
  },
  {
    id: "attempt-15",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    dateLabel: "Hôm nay",
    subjectId: "social",
    subjectName: "Lịch sử và Địa lý",
    topic: "Rừng Amazon và Biến đổi khí hậu",
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    scoreOn10: 8.5
  }
];

const STORAGE_KEY = "smart_study_quiz_history_v2";

export function loadQuizHistory(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading quiz history from localStorage", e);
  }
  // Initialize baseline history
  saveQuizHistory(DEFAULT_QUIZ_ATTEMPTS);
  return DEFAULT_QUIZ_ATTEMPTS;
}

export function saveQuizHistory(history: QuizAttempt[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Error saving quiz history to localStorage", e);
  }
}

export function recordNewQuizAttempt(
  session: QuizSession,
  lessons: Lesson[]
): QuizAttempt {
  let matchedLesson: Lesson | undefined;
  if (session.lessonId) {
    matchedLesson = lessons.find((l) => l.id === session.lessonId);
  }

  let subjectId = session.subjectId;
  let subjectName = session.subjectName;

  if (!subjectId && matchedLesson) {
    subjectId = detectLessonSubject(matchedLesson);
  }
  if (!subjectId) {
    // deduce from questions or title
    const combined = `${session.lessonTitle || ""} ${session.topic || ""}`.toLowerCase();
    if (combined.includes("toán") || combined.includes("math")) subjectId = "math";
    else if (combined.includes("tiếng anh") || combined.includes("english")) subjectId = "english";
    else if (combined.includes("văn") || combined.includes("ngữ văn")) subjectId = "literature";
    else if (combined.includes("khoa học") || combined.includes("khtn") || combined.includes("nước")) subjectId = "science";
    else if (combined.includes("sử") || combined.includes("địa")) subjectId = "social";
    else subjectId = "math";
  }

  if (!subjectName) {
    const def = SUBJECT_DEFINITIONS.find((s) => s.id === subjectId);
    subjectName = def ? def.name : "Toán học";
  }

  const now = new Date();
  const dateLabel = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  const total = Math.max(1, session.questions.length);
  const percentage = Math.round((session.score / total) * 100);
  const scoreOn10 = Math.round((session.score / total) * 10 * 10) / 10;

  const topic = session.topic || (matchedLesson ? matchedLesson.topic || matchedLesson.title : "Kiến thức tổng hợp");

  const newAttempt: QuizAttempt = {
    id: `attempt-${Date.now()}`,
    timestamp: now.toISOString(),
    dateLabel,
    lessonId: session.lessonId || (matchedLesson ? matchedLesson.id : undefined),
    lessonTitle: session.lessonTitle || (matchedLesson ? matchedLesson.title : undefined),
    subjectId,
    subjectName,
    topic,
    score: session.score,
    totalQuestions: total,
    percentage,
    scoreOn10
  };

  const current = loadQuizHistory();
  const updated = [...current, newAttempt];
  saveQuizHistory(updated);
  return newAttempt;
}

export interface ScoreImprovementTimelinePoint {
  date: string;
  timestamp: number;
  math?: number;
  english?: number;
  literature?: number;
  science?: number;
  social?: number;
  informatics?: number;
  overallAvg?: number;
  details?: Record<string, { topic: string; scoreOn10: number; percentage: number }>;
}

export function buildScoreImprovementTimeline(history: QuizAttempt[]): {
  timeline: ScoreImprovementTimelinePoint[];
  subjectStats: Record<string, {
    firstScore: number;
    latestScore: number;
    avgScore: number;
    improvement: number; // delta in points e.g. +2.5
    pctImprovement: number; // delta in %
    totalTests: number;
    trend: "up" | "stable" | "down";
  }>;
  overallImprovementDelta: number;
  strongestSubject: string;
  fastestGrowingSubject: string;
} {
  // Sort history chronologically
  const sorted = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Group by dateLabel (or timestamp rounded to day/session)
  const dateMap: Map<string, {
    date: string;
    timestamp: number;
    scores: Record<string, number[]>;
    details: Record<string, { topic: string; scoreOn10: number; percentage: number }>;
  }> = new Map();

  sorted.forEach((item) => {
    const key = item.dateLabel || "Hôm nay";
    if (!dateMap.has(key)) {
      dateMap.set(key, {
        date: key,
        timestamp: new Date(item.timestamp).getTime(),
        scores: {},
        details: {}
      });
    }
    const entry = dateMap.get(key)!;
    if (!entry.scores[item.subjectId]) {
      entry.scores[item.subjectId] = [];
    }
    entry.scores[item.subjectId].push(item.scoreOn10);
    entry.details[item.subjectId] = {
      topic: item.topic,
      scoreOn10: item.scoreOn10,
      percentage: item.percentage
    };
  });

  // Keep running average or latest score per subject to form continuous curves
  const runningScores: Record<string, number> = {};
  const timeline: ScoreImprovementTimelinePoint[] = [];

  Array.from(dateMap.values()).forEach((entry) => {
    const point: ScoreImprovementTimelinePoint = {
      date: entry.date,
      timestamp: entry.timestamp,
      details: entry.details
    };

    let totalPoints = 0;
    let countedSubs = 0;

    // Update running score for subjects present on this date
    Object.keys(entry.scores).forEach((subId) => {
      const avg = entry.scores[subId].reduce((a, b) => a + b, 0) / entry.scores[subId].length;
      runningScores[subId] = Math.round(avg * 10) / 10;
    });

    // Populate all known running scores into this timeline point
    (["math", "english", "literature", "science", "social", "informatics"] as const).forEach((subKey) => {
      if (runningScores[subKey] !== undefined) {
        point[subKey] = runningScores[subKey];
        totalPoints += runningScores[subKey];
        countedSubs++;
      }
    });

    point.overallAvg = countedSubs > 0 ? Math.round((totalPoints / countedSubs) * 10) / 10 : 7.0;
    timeline.push(point);
  });

  // Calculate per-subject stats
  const subjectScoresMap: Record<string, number[]> = {};
  sorted.forEach((item) => {
    if (!subjectScoresMap[item.subjectId]) {
      subjectScoresMap[item.subjectId] = [];
    }
    subjectScoresMap[item.subjectId].push(item.scoreOn10);
  });

  const subjectStats: Record<string, {
    firstScore: number;
    latestScore: number;
    avgScore: number;
    improvement: number;
    pctImprovement: number;
    totalTests: number;
    trend: "up" | "stable" | "down";
  }> = {};

  let maxImprovement = -999;
  let fastestGrowingSubject = "math";
  let maxScore = -999;
  let strongestSubject = "math";

  Object.entries(subjectScoresMap).forEach(([subId, scores]) => {
    const first = scores[0];
    const latest = scores[scores.length - 1];
    const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const delta = Math.round((latest - first) * 10) / 10;
    const pct = first > 0 ? Math.round(((latest - first) / first) * 100) : 0;

    subjectStats[subId] = {
      firstScore: first,
      latestScore: latest,
      avgScore: avg,
      improvement: delta,
      pctImprovement: pct,
      totalTests: scores.length,
      trend: delta > 0.3 ? "up" : delta < -0.3 ? "down" : "stable"
    };

    if (delta > maxImprovement) {
      maxImprovement = delta;
      fastestGrowingSubject = subId;
    }
    if (latest > maxScore) {
      maxScore = latest;
      strongestSubject = subId;
    }
  });

  const firstPointAvg = timeline[0]?.overallAvg || 6.5;
  const lastPointAvg = timeline[timeline.length - 1]?.overallAvg || 8.5;
  const overallImprovementDelta = Math.round((lastPointAvg - firstPointAvg) * 10) / 10;

  return {
    timeline,
    subjectStats,
    overallImprovementDelta,
    strongestSubject,
    fastestGrowingSubject
  };
}

/**
 * Analyzes previous quiz sessions to identify the student's weakest topics.
 * Returns prioritized recommendations with diagnosis and matching lesson references.
 */
export function identifyWeakTopics(
  history: QuizAttempt[],
  lessons: Lesson[]
): WeakTopicRecommendation[] {
  const topicStats: Record<string, {
    topic: string;
    subjectId: string;
    subjectName: string;
    correctCount: number;
    totalTested: number;
    lessonId?: string;
    lessonTitle?: string;
    lastTested: string;
  }> = {};

  history.forEach((attempt) => {
    const key = attempt.topic.toLowerCase().trim();
    if (!topicStats[key]) {
      topicStats[key] = {
        topic: attempt.topic,
        subjectId: attempt.subjectId,
        subjectName: attempt.subjectName,
        correctCount: 0,
        totalTested: 0,
        lessonId: attempt.lessonId,
        lessonTitle: attempt.lessonTitle,
        lastTested: attempt.timestamp
      };
    }
    topicStats[key].correctCount += attempt.score;
    topicStats[key].totalTested += attempt.totalQuestions;
    if (new Date(attempt.timestamp) > new Date(topicStats[key].lastTested)) {
      topicStats[key].lastTested = attempt.timestamp;
    }
  });

  // Calculate accuracy per topic
  const recommendations: WeakTopicRecommendation[] = [];

  Object.values(topicStats).forEach((item) => {
    const accuracy = Math.round((item.correctCount / Math.max(1, item.totalTested)) * 100);
    
    // Connect to matching lesson if not already linked
    let matched = item.lessonId ? lessons.find((l) => l.id === item.lessonId) : undefined;
    if (!matched) {
      const q = item.topic.toLowerCase();
      matched = lessons.find((l) => 
        l.title.toLowerCase().includes(q) || 
        (l.topic && l.topic.toLowerCase().includes(q))
      );
    }

    let reason = "";
    let priority: "high" | "medium" | "low" = "medium";

    if (accuracy <= 45) {
      priority = "high";
      reason = `Tỉ lệ đúng đạt ${accuracy}% (${item.correctCount}/${item.totalTested} câu). Em gặp vướng mắc ở các câu hỏi lý thuyết chuyên sâu và biến đổi công thức.`;
    } else if (accuracy <= 65) {
      priority = "medium";
      reason = `Tỉ lệ đúng đạt ${accuracy}% (${item.correctCount}/${item.totalTested} câu). Kiến thức đã hình thành nhưng còn nhầm lẫn ở các câu hỏi bẫy hoặc bài toán thực tế.`;
    } else if (accuracy < 80) {
      priority = "low";
      reason = `Tỉ lệ đúng ${accuracy}%. Đạt mức khá nhưng cần củng cố thêm để đạt điểm tuyệt đối 100%.`;
    }

    // Only topics that need improvement (accuracy < 80%)
    if (accuracy < 80) {
      recommendations.push({
        topic: item.topic,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        accuracy,
        correctCount: item.correctCount,
        totalTested: item.totalTested,
        reason,
        lessonId: matched?.id || item.lessonId,
        lessonTitle: matched?.title || item.lessonTitle,
        priority
      });
    }
  });

  // Sort by priority (high > medium > low) and then lowest accuracy first
  recommendations.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return a.accuracy - b.accuracy;
  });

  // If no weak topics found (e.g. fresh account or all > 80%), provide intelligent recommendations from incomplete lessons
  if (recommendations.length === 0) {
    const incomplete = lessons.filter((l) => !l.completed);
    const candidateLessons = incomplete.length > 0 ? incomplete : lessons;

    candidateLessons.slice(0, 3).forEach((l) => {
      const subId = detectLessonSubject(l);
      const subDef = SUBJECT_DEFINITIONS.find((s) => s.id === subId);
      recommendations.push({
        topic: l.topic || l.title,
        subjectId: subId,
        subjectName: subDef ? subDef.name : "Toán học",
        accuracy: 50,
        correctCount: 2,
        totalTested: 5,
        reason: `Giáo án "${l.title}" chưa hoàn thành bài kiểm tra đánh giá năng lực. Hãy làm đề củng cố để mở khóa danh hiệu mới!`,
        lessonId: l.id,
        lessonTitle: l.title,
        priority: "medium"
      });
    });
  }

  return recommendations;
}
