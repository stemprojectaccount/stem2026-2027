import type {
  AnalysisOptions,
  CriterionInput,
  DetectedLanguage,
  EssayAnalysisResult,
  EssayMetrics,
} from './types';
import { detectLanguage, segmentText } from './tokenizer';
import { matchCriteria } from './criteriaMatcher';
import { detectIssues } from './issueDetector';
import { detectTone } from './toneDetector';

export const DEFAULT_ANALYSIS_OPTIONS = {
  language: 'auto' as const,
  wordsPerMinute: 200,
  maxSentenceWordsVi: 30,
  maxSentenceWordsEn: 28,
  minWordRepeatCount: 4,
  minPhraseRepeatCount: 3,
};

/**
 * Formats estimated reading time in natural Vietnamese.
 */
export function formatReadingTime(seconds: number): string {
  if (seconds <= 0) return '0 phút';
  if (seconds < 60) return 'Dưới 1 phút';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds < 15) {
    return `${minutes} phút`;
  }
  if (remainingSeconds >= 45) {
    return `${minutes + 1} phút`;
  }
  return `${minutes} phút 30 giây`;
}

/**
 * Pure, framework-agnostic bilingual (Vietnamese & English) essay analysis engine.
 */
export function analyzeEssay(
  text: string,
  criteria: CriterionInput[] = [],
  options: AnalysisOptions = {}
): EssayAnalysisResult {
  const languagePref = options.language ?? DEFAULT_ANALYSIS_OPTIONS.language;
  const detectedLanguage: DetectedLanguage =
    languagePref === 'vi' || languagePref === 'en'
      ? languagePref
      : detectLanguage(text);

  const wordsPerMinute = options.wordsPerMinute ?? DEFAULT_ANALYSIS_OPTIONS.wordsPerMinute;
  const maxSentenceWords =
    options.maxSentenceWords ??
    (detectedLanguage === 'en'
      ? DEFAULT_ANALYSIS_OPTIONS.maxSentenceWordsEn
      : DEFAULT_ANALYSIS_OPTIONS.maxSentenceWordsVi);
  const minWordRepeatCount =
    options.minWordRepeatCount ?? DEFAULT_ANALYSIS_OPTIONS.minWordRepeatCount;
  const minPhraseRepeatCount =
    options.minPhraseRepeatCount ?? DEFAULT_ANALYSIS_OPTIONS.minPhraseRepeatCount;

  const { paragraphs, sentences, words } = segmentText(text);
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;
  const characterCount = text.replace(/\s+/g, '').length;

  const readingTimeSeconds =
    wordCount === 0
      ? 0
      : Math.max(1, Math.round((wordCount / wordsPerMinute) * 60));

  let longestSentenceWords = 0;
  let longestSentenceParagraph: number | null = null;
  for (const s of sentences) {
    if (s.wordCount > longestSentenceWords) {
      longestSentenceWords = s.wordCount;
      longestSentenceParagraph = s.paragraphIndex;
    }
  }

  const averageWordsPerSentence =
    sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0;

  const metrics: EssayMetrics = {
    wordCount,
    characterCount,
    sentenceCount,
    paragraphCount,
    readingTimeSeconds,
    averageWordsPerSentence,
    longestSentenceWords,
    longestSentenceParagraph,
  };

  const tone = detectTone(text, words, sentences, metrics, detectedLanguage);
  const criteriaResults = matchCriteria(criteria, words, sentences, detectedLanguage);
  const issues = detectIssues(text, words, sentences, criteria, detectedLanguage, {
    maxSentenceWords,
    minWordRepeatCount,
    minPhraseRepeatCount,
  });

  const matchedCriteriaCount = criteriaResults.filter(
    (c) => c.status === 'matched' || c.status === 'idea_covered'
  ).length;
  const grammarCount = issues.filter((i) => i.category === 'grammar').length;
  const repetitionCount = issues.filter((i) => i.category === 'repetition').length;
  const longSentenceCount = issues.filter((i) => i.category === 'long_sentence').length;
  const mechanicsCount = issues.filter(
    (i) =>
      i.category === 'capitalization' ||
      i.category === 'punctuation' ||
      i.category === 'spacing'
  ).length;

  return {
    detectedLanguage,
    metrics,
    tone,
    criteria: criteriaResults,
    issues,
    paragraphs,
    sentences,
    summary: {
      matchedCriteriaCount,
      totalCriteriaCount: criteriaResults.length,
      grammarCount,
      repetitionCount,
      longSentenceCount,
      mechanicsCount,
      totalIssueCount: issues.length,
    },
  };
}
