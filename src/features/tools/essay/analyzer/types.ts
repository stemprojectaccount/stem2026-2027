export interface TextRange {
  start: number;
  end: number;
}

export type LanguagePreference = 'auto' | 'vi' | 'en';
export type DetectedLanguage = 'vi' | 'en';

export interface AnalysisOptions {
  /** Target analysis language or auto-detection (default: 'auto') */
  language?: LanguagePreference;
  /** Estimated reading speed in words per minute (default: 200) */
  wordsPerMinute?: number;
  /** Maximum recommended words per sentence before flagging (default: 30 for VI, 28 for EN) */
  maxSentenceWords?: number;
  /** Minimum occurrences to flag a repeated non-stopword (default: 4) */
  minWordRepeatCount?: number;
  /** Minimum occurrences to flag a repeated 2-3 word phrase (default: 3) */
  minPhraseRepeatCount?: number;
}

export interface CriterionInput {
  id: string;
  text: string;
}

export type CriterionStatus = 'matched' | 'idea_covered' | 'missing';

export interface CriterionMatchResult {
  id: string;
  text: string;
  status: CriterionStatus;
  exactCount: number;
  ranges: TextRange[];
  /** For multi-word main ideas, which meaningful terms matched vs missed */
  matchedTerms: string[];
  missingTerms: string[];
  coverageRatio: number;
}

export interface WordToken {
  raw: string;
  normalized: string;
  start: number;
  end: number;
  paragraphIndex: number;
  sentenceIndex: number;
}

export interface ParagraphSegment {
  index: number;
  text: string;
  start: number;
  end: number;
  wordCount: number;
}

export interface SentenceSegment {
  globalIndex: number;
  paragraphIndex: number;
  sentenceInParagraph: number;
  text: string;
  start: number;
  end: number;
  wordCount: number;
  isOutlineItem: boolean;
  hasEndingPunctuation: boolean;
  startsWithCapital: boolean;
  firstLetterRange: TextRange | null;
}

export type IssueCategory =
  | 'grammar'
  | 'capitalization'
  | 'punctuation'
  | 'spacing'
  | 'long_sentence'
  | 'repetition';

export type IssueSeverity = 'warning' | 'error';

export interface AnalysisIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  reason: string;
  suggestion: string;
  /** Concrete step-by-step guidance so students learn how to fix the error */
  fixSteps: string[];
  /** Exact wrong snippet when applicable */
  wrongText?: string;
  /** Deterministic replacement string when safe to apply in 1 click */
  suggestedFix?: string;
  locationLabel: string;
  excerpt: string;
  range: TextRange;
  /** All occurrence ranges when an issue spans multiple spots (e.g. repeated word) */
  allRanges: TextRange[];
  count?: number;
}

export interface EssayMetrics {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeSeconds: number;
  averageWordsPerSentence: number;
  longestSentenceWords: number;
  longestSentenceParagraph: number | null;
}

export type ToneStyle = 'academic' | 'formal' | 'casual' | 'neutral';

export interface ToneAnalysis {
  style: ToneStyle;
  label: string;
  summary: string;
  signals: string[];
  feedback: string[];
}

export interface EssayAnalysisResult {
  detectedLanguage: DetectedLanguage;
  metrics: EssayMetrics;
  tone: ToneAnalysis;
  criteria: CriterionMatchResult[];
  issues: AnalysisIssue[];
  paragraphs: ParagraphSegment[];
  sentences: SentenceSegment[];
  summary: {
    matchedCriteriaCount: number;
    totalCriteriaCount: number;
    grammarCount: number;
    repetitionCount: number;
    longSentenceCount: number;
    mechanicsCount: number;
    totalIssueCount: number;
  };
}
