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
  lessonId?: string;
  lessonTitle?: string;
  subjectId?: string;
  subjectName?: string;
  topic?: string;
}

export interface QuizAttempt {
  id: string;
  timestamp: string;
  dateLabel: string;
  lessonId?: string;
  lessonTitle?: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  scoreOn10: number;
}

export interface WeakTopicRecommendation {
  topic: string;
  subjectId: string;
  subjectName: string;
  accuracy: number;
  correctCount: number;
  totalTested: number;
  reason: string;
  lessonId?: string;
  lessonTitle?: string;
  priority: "high" | "medium" | "low";
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
  equippedOutfit?: string;
  unlockedOutfits?: string[];
  grade?: string;
  school?: string;
  displayName?: string;
  nickname?: string;
  avatarUrl?: string;
  avatarPresetId?: string;
  bio?: string;
  titleBadge?: string;
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

// ==========================================
// AI CHATBOX & EDUCATION SYSTEM TYPES
// ==========================================

export interface UserProfileMemory {
  name?: string;
  age?: number;
  grade?: string;
  favorite_subject?: string;
  weak_subject?: string;
  goal?: string;
  communication_style?: "friendly" | "formal" | "concise" | "detailed" | string;
  learning_style?: "visual" | "logical" | "auditory" | "kinesthetic" | string;
  career_target?: string;
  current_project?: string;
  notes?: string;
}

export interface MemoryItem {
  id: string;
  category: "goal" | "preference" | "project" | "learning" | "habit" | "general";
  content: string;
  score: number; // Frequency / Priority score (higher score = more frequently mentioned)
  createdAt: string;
  updatedAt: string;
}

export interface LongTermMemory {
  learning_history: MemoryItem[];
  preference_history: MemoryItem[];
  project_history: MemoryItem[];
  goal_history: MemoryItem[];
  memory_scores: Record<string, number>; // e.g. {"IELTS": 20, "Toán": 15, "Writing": 8}
}

export interface ConversationTurn {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  summaryTag?: string;
}

export interface AIPersonalizationPreferences {
  brevity: "short" | "detailed" | "balanced";
  tone: "friendly" | "formal" | "academic";
  useSearchGrounding: boolean;
  latexMathRendering: boolean;
}

export interface AIMemoryStore {
  userProfile: UserProfileMemory;
  recentConversations: ConversationTurn[]; // Up to 20 recent messages
  longTermMemory: LongTermMemory;
  preferences: AIPersonalizationPreferences;
  lastMemorySummary?: string;
  lastUpdated: string;
}

export interface SearchSource {
  title?: string;
  uri?: string;
}

// ==========================================
// READING COMPREHENSION (ĐỌC HIỂU AI)
// ==========================================
export interface ReadingPassage {
  title: string;
  topic_verification: string;
  content: string;
  word_count_estimate: number;
}

export interface ReadingQuestion {
  id: number;
  skill_tested: string;
  question_type: "multiple_choice" | "short_answer" | string;
  question: string;
  options: string[];
  correct_answer: string;
  evidence_quote: string;
  explanation: string;
}

export interface ReadingTest {
  id?: string;
  metadata: {
    selected_topic: string;
    sub_topic: string;
    difficulty: string;
    language: string;
  };
  reading_passage: ReadingPassage;
  questions: ReadingQuestion[];
}

// ==========================================
// ESSAY & CONSTRUCTED RESPONSE (TỰ LUẬN AI)
// ==========================================
export interface RubricItem {
  criteria: string;
  points: number;
  keywords: string[];
}

export interface EssayQuestion {
  id: number;
  cognitive_level: string;
  question: string;
  max_score: number;
  sample_answer: string;
  rubric: RubricItem[];
}

export interface EssayTest {
  id?: string;
  metadata: {
    selected_topic: string;
    sub_topic: string;
    difficulty: string;
    total_score: number;
  };
  questions: EssayQuestion[];
}

export interface RubricEvaluation {
  criteria: string;
  max_points: number;
  earned_points: number;
  feedback: string;
  matched_keywords: string[];
  missing_keywords: string[];
}

export interface EssayGradeResult {
  question_id: number;
  earned_score: number;
  max_score: number;
  rubric_evaluations: RubricEvaluation[];
  strengths: string[];
  improvements: string[];
  general_feedback: string;
}

export interface PodcastDialogueLine {
  speaker: "Minh" | "Lan";
  text: string;
  role: "questioner" | "explainer";
}

export interface PodcastQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  summary: string;
  durationMinutes: number;
  dialogue: PodcastDialogueLine[];
  quickReviewQuestions: PodcastQuizQuestion[];
  createdAt: string;
  listened: boolean;
  isFavorite: boolean;
  lessonId?: string;
  xpReward: number;
}

