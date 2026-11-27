import type {
  CriterionInput,
  CriterionMatchResult,
  DetectedLanguage,
  SentenceSegment,
  TextRange,
  WordToken,
} from './types';
import { getStopwords, normalizeWord } from './tokenizer';

const CLEAN_PREFIX_REGEX = /^\s*(?:[-•*–—]|(?:\d+|[IVXLCDM]+|[a-zA-Z])[.)])\s+/;
const TOKEN_REGEX = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

function tokenizeTarget(raw: string): string[] {
  const cleaned = raw.replace(CLEAN_PREFIX_REGEX, '').trim();
  const matches = cleaned.match(TOKEN_REGEX);
  if (!matches) return [];
  return matches.map(normalizeWord);
}

/**
 * Matches exact sequential word-token sequences in the essay to avoid partial-word false positives.
 */
function findExactTokenPhraseRanges(
  targetTokens: string[],
  essayWords: WordToken[]
): TextRange[] {
  if (targetTokens.length === 0 || essayWords.length < targetTokens.length) {
    return [];
  }

  const ranges: TextRange[] = [];
  const targetLen = targetTokens.length;

  for (let i = 0; i <= essayWords.length - targetLen; i += 1) {
    let matched = true;
    for (let j = 0; j < targetLen; j += 1) {
      if (essayWords[i + j].normalized !== targetTokens[j]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      ranges.push({
        start: essayWords[i].start,
        end: essayWords[i + targetLen - 1].end,
      });
      i += targetLen - 1;
    }
  }

  return ranges;
}

function englishLooseStem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Evaluates a list of target keywords or main ideas against the tokenized essay in VI or EN.
 */
export function matchCriteria(
  criteria: CriterionInput[],
  essayWords: WordToken[],
  sentences: SentenceSegment[],
  language: DetectedLanguage = 'vi'
): CriterionMatchResult[] {
  const essayWordSet = new Set(essayWords.map((w) => w.normalized));
  const essayStemSet =
    language === 'en'
      ? new Set(essayWords.map((w) => englishLooseStem(w.normalized)))
      : essayWordSet;
  const stopwords = getStopwords(language);

  const hasTermInEssay = (term: string): boolean => {
    if (essayWordSet.has(term)) return true;
    if (language === 'en') {
      return essayStemSet.has(englishLooseStem(term));
    }
    return false;
  };

  return criteria
    .filter((item) => item.text.trim().length > 0)
    .map((item) => {
      const targetTokens = tokenizeTarget(item.text);
      if (targetTokens.length === 0) {
        return {
          id: item.id,
          text: item.text.trim(),
          status: 'missing',
          exactCount: 0,
          ranges: [],
          matchedTerms: [],
          missingTerms: [],
          coverageRatio: 0,
        };
      }

      const exactRanges = findExactTokenPhraseRanges(targetTokens, essayWords);
      if (exactRanges.length > 0) {
        return {
          id: item.id,
          text: item.text.trim(),
          status: 'matched',
          exactCount: exactRanges.length,
          ranges: exactRanges,
          matchedTerms: Array.from(new Set(targetTokens)),
          missingTerms: [],
          coverageRatio: 1,
        };
      }

      if (targetTokens.length >= 3) {
        const contentTerms = Array.from(
          new Set(
            targetTokens.filter((tok) => tok.length >= 2 && !stopwords.has(tok))
          )
        );

        const termsToCheck =
          contentTerms.length >= 2 ? contentTerms : Array.from(new Set(targetTokens));
        const matchedTerms = termsToCheck.filter(hasTermInEssay);
        const missingTerms = termsToCheck.filter((term) => !hasTermInEssay(term));
        const coverageRatio =
          termsToCheck.length > 0 ? matchedTerms.length / termsToCheck.length : 0;

        let bestSentence: SentenceSegment | null = null;
        let bestScore = 0;

        if (matchedTerms.length > 0) {
          const matchedStemSet = new Set(
            matchedTerms.map((t) => (language === 'en' ? englishLooseStem(t) : t))
          );
          for (const sentence of sentences) {
            const sTokens = sentence.text.match(TOKEN_REGEX)?.map(normalizeWord) ?? [];
            const uniqueHits = new Set(
              sTokens
                .map((t) => (language === 'en' ? englishLooseStem(t) : t))
                .filter((t) => matchedStemSet.has(t))
            ).size;
            if (uniqueHits > bestScore) {
              bestScore = uniqueHits;
              bestSentence = sentence;
            }
          }
        }

        const isCovered =
          termsToCheck.length >= 2 &&
          coverageRatio >= 0.65 &&
          bestScore >= Math.min(2, matchedTerms.length);

        return {
          id: item.id,
          text: item.text.trim(),
          status: isCovered ? 'idea_covered' : 'missing',
          exactCount: 0,
          ranges: bestSentence ? [{ start: bestSentence.start, end: bestSentence.end }] : [],
          matchedTerms,
          missingTerms,
          coverageRatio,
        };
      }

      return {
        id: item.id,
        text: item.text.trim(),
        status: 'missing',
        exactCount: 0,
        ranges: [],
        matchedTerms: [],
        missingTerms: targetTokens,
        coverageRatio: 0,
      };
    });
}
