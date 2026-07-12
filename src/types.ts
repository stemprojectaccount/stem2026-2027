export interface Lesson {
  id: string;
  title: string;
  content: string;
  bookName: string;
  grade: string;
  curriculum: string;
  createdAt: string;
  topic: string;
  notes: string;
  completed: boolean;
  completedAt?: string;
  pinned?: boolean;
}

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizSession {
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswer: number | null; // index of currently selected answer for the current question
  answers: (number | null)[]; // historical answers
  completed: boolean;
  score: number;
}

export interface MagicCard {
  id: string;
  name: string;
  emoji: string;
  tier: "dong" | "sat" | "bac" | "vang" | "kimcuong" | "baymau";
  rarity: "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
  tierLabel: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
  effect: string;
  power: number;
  cooldownRounds: number;
}

export interface UserProgress {
  points: number;
  level: number;
  streak: number;
  lastActive: string | null;
  lessonsCompletedCount: number;
  testsTakenCount: number;
  coins: number;
}

export interface DailyQuest {
  id: string;
  type: string;
  text: string;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  rewardXp: number;
  rewardCoins: number;
  icon: string;
}

export interface Flashcard {
  id: string;
  lessonId: string;
  lessonTitle: string;
  front: string;
  back: string;
  interval: number; // in days (Leitner/SM-2 interval)
  easeFactor: number; // ease multiplier
  repetitions: number; // repetition count
  nextReviewDate: string; // ISO string
  status: "new" | "learning" | "reviewing" | "mastered";
}


export interface FusionRecipe {
  id: string;
  ingredients: string[];
  resultCardId: string;
  baseSuccessRate: number;
}
