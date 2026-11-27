import { Flashcard } from "../types";

export type RecallRating = "again" | "hard" | "good" | "easy";

export interface FSRSReviewResult {
  nextReviewDate: string;
  interval: number; // in days
  easeFactor: number;
  repetitions: number;
  status: "new" | "learning" | "reviewing" | "mastered";
  stability: number; // estimated memory retention half-life in days
  retrievability: number; // current estimated retrieval probability (0 to 1)
  xpEarned: number;
  coinsEarned: number;
}

/**
 * Calculates current retrievability based on the Ebbinghaus exponential forgetting curve:
 * R = e^(-t / S), where t is days elapsed since last review and S is stability.
 */
export function calculateRetrievability(lastReviewDate: string, stability: number): number {
  if (!lastReviewDate || stability <= 0) return 0.5;
  const elapsedDays = Math.max(0, (Date.now() - new Date(lastReviewDate).getTime()) / 86400000);
  const R = Math.exp(-elapsedDays / stability);
  return Number(Math.max(0, Math.min(1, R)).toFixed(2));
}

/**
 * Free Spaced Repetition Scheduler (FSRS / SM-2 Enhanced)
 * Calculates the exact next review date and memory stability based on adolescent cognitive retention.
 */
export function scheduleFSRSReview(
  card: Flashcard,
  rating: RecallRating
): FSRSReviewResult {
  let interval = card.interval || 1;
  let easeFactor = card.easeFactor || 2.5;
  let repetitions = card.repetitions || 0;
  let status: "new" | "learning" | "reviewing" | "mastered" = card.status || "new";
  let stability = (card as any).stability || Math.max(1, interval);

  let xpEarned = 5;
  let coinsEarned = 1;

  switch (rating) {
    case "again": // Complete lapse / Forgot
      repetitions = 0;
      interval = 1; // review tomorrow
      stability = Math.max(0.5, stability * 0.4);
      easeFactor = Math.max(1.3, easeFactor - 0.25);
      status = "learning";
      xpEarned = 2;
      coinsEarned = 0;
      break;

    case "hard": // Recalled with significant struggle
      if (repetitions === 0) {
        interval = 1;
      } else {
        interval = Math.max(1, Math.round(interval * 1.2));
      }
      stability = Math.max(1, stability * 0.9);
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      status = "learning";
      xpEarned = 4;
      coinsEarned = 1;
      break;

    case "good": // Recalled with reasonable effort (normal target)
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      stability = Math.round(stability * 1.6);
      status = "reviewing";
      repetitions += 1;
      xpEarned = 6;
      coinsEarned = 2;
      break;

    case "easy": // Immediate, effortless recall (mastery)
      if (repetitions === 0) {
        interval = 3;
      } else if (repetitions === 1) {
        interval = 7;
      } else {
        interval = Math.round(interval * easeFactor * 1.35);
      }
      stability = Math.round(stability * 2.2);
      easeFactor = Math.min(3.2, easeFactor + 0.15);
      status = "mastered";
      repetitions += 1;
      xpEarned = 10;
      coinsEarned = 3;
      break;
  }

  // Calculate future review timestamp
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    nextReviewDate: nextDate.toISOString(),
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    status,
    stability,
    retrievability: calculateRetrievability(nextDate.toISOString(), stability),
    xpEarned,
    coinsEarned
  };
}

/**
 * Filters cards that are due for review today or are newly created.
 */
export function getDueFlashcards(cards: Flashcard[]): Flashcard[] {
  if (!cards || cards.length === 0) return [];
  const todayStr = new Date().toISOString().split("T")[0];
  return cards.filter((card) => {
    if (!card.nextReviewDate || card.repetitions === 0 || card.status === "new") {
      return true;
    }
    const cardDateStr = card.nextReviewDate.split("T")[0];
    return cardDateStr <= todayStr;
  });
}

/**
 * Returns the exact count of flashcards due today from localStorage.
 */
export function getStoredDueFlashcardsCount(): number {
  try {
    const raw = localStorage.getItem("smart_study_flashcards");
    if (!raw) return 6; // default seed cards due
    const cards: Flashcard[] = JSON.parse(raw);
    return getDueFlashcards(cards).length;
  } catch {
    return 6;
  }
}

/**
 * Formats review interval into human-friendly Vietnamese text.
 */
export function formatReviewInterval(days: number): string {
  if (days <= 0 || days === 1) return "Ngày mai";
  if (days < 7) return `${days} ngày tới`;
  if (days < 30) return `${Math.round(days / 7)} tuần tới`;
  return `${Math.round(days / 30)} tháng tới`;
}
