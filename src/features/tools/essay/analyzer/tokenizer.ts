import type {
  DetectedLanguage,
  ParagraphSegment,
  SentenceSegment,
  TextRange,
  WordToken,
} from './types';

/**
 * Common Vietnamese function words / stopwords that naturally recur in prose
 * and should not trigger low-threshold repetition warnings.
 */
export const VIETNAMESE_STOPWORDS = new Set<string>([
  'và', 'là', 'của', 'có', 'không', 'một', 'các', 'những', 'được', 'trong',
  'cho', 'với', 'để', 'về', 'đã', 'đang', 'sẽ', 'này', 'đó', 'kia', 'ấy',
  'khi', 'nếu', 'thì', 'mà', 'nhưng', 'tuy', 'vì', 'nên', 'bởi', 'do',
  'từ', 'đến', 'tới', 'tại', 'ở', 'trên', 'dưới', 'sau', 'trước', 'giữa',
  'như', 'cũng', 'vẫn', 'còn', 'chỉ', 'đều', 'lại', 'rồi', 'ra', 'vào',
  'lên', 'xuống', 'đi', 'qua', 'theo', 'cùng', 'hay', 'hoặc', 'bị', 'phải',
  'cần', 'muốn', 'thấy', 'biết', 'làm', 'nói', 'rằng', 'thật', 'quá',
  'hơn', 'nhất', 'mỗi', 'mọi', 'nhiều', 'ít', 'khác', 'người', 'chúng',
  'ta', 'tôi', 'em', 'bạn', 'họ', 'mình', 'nó', 'ai', 'gì', 'nào', 'đâu',
  'sao', 'thế', 'vậy', 'đây', 'nữa', 'cả', 'lúc', 'điều', 'việc',
  'sự', 'cách', 'khiến', 'giúp', 'tạo', 'mang', 'nhằm', 'đồng', 'thời',
]);

/**
 * Common English function words / stopwords for English essay analysis.
 */
export const ENGLISH_STOPWORDS = new Set<string>([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while',
  'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
  'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just',
  'should', 'now', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'would', 'could', 'might', 'must',
  'shall', 'may', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'also', 'many',
  'much', 'make', 'get', 'take', 'one', 'two', 'us', 'our', 'well', 'even',
]);

/**
 * Common Vietnamese intentional reduplicatives ("từ láy toàn bộ")
 * that should not be flagged as accidental adjacent duplicate words.
 */
export const VIETNAMESE_REDUPLICATIVES = new Set<string>([
  'từ', 'dần', 'luôn', 'mãi', 'ngày', 'đêm', 'năm', 'tháng', 'người', 'nhà',
  'xanh', 'đỏ', 'vàng', 'trắng', 'đen', 'hồng', 'tím', 'nhẹ', 'chậm', 'nhanh',
  'xa', 'gần', 'cao', 'thấp', 'đều', 'lặng', 'vội', 'rưng', 'run', 'lấp',
  'sâu', 'dài', 'rộng', 'nhỏ', 'lớn', 'nhiều', 'ít', 'khẽ', 'sát', 'gấp',
  'lớp', 'tầng', 'hàng', 'đời', 'kiếp', 'chút', 'tí', 'đoàn', 'nhóm',
]);

const WORD_REGEX = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const OUTLINE_PREFIX_REGEX = /^\s*(?:[-•*–—]|(?:\d+|[IVXLCDM]+|[a-zA-Z])[.)])\s+/;
const ABBREVIATIONS_REGEX =
  /(?:^|[\s(])(?:TP|ThS|TS|PGS|GS|VD|STT|Stt|Tr|Mr|Mrs|Ms|Dr|Prof|Jr|Sr|St|vs|etc|e\.g|i\.e|v\.v|U\.S|U\.K)\.$/i;
const VIETNAMESE_DIACRITIC_REGEX =
  /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/gi;

export function getStopwords(language: DetectedLanguage): Set<string> {
  return language === 'en' ? ENGLISH_STOPWORDS : VIETNAMESE_STOPWORDS;
}

/**
 * Automatically detects whether text is primarily Vietnamese or English.
 */
export function detectLanguage(text: string): DetectedLanguage {
  const trimmed = text.trim();
  if (!trimmed) return 'vi';

  const diacriticMatches = trimmed.match(VIETNAMESE_DIACRITIC_REGEX);
  const diacriticCount = diacriticMatches ? diacriticMatches.length : 0;

  const rawWords = trimmed.match(WORD_REGEX) ?? [];
  if (rawWords.length === 0) return 'vi';

  // Vietnamese text almost always contains multiple Vietnamese-specific diacritics
  if (diacriticCount >= 2 || diacriticCount / rawWords.length >= 0.08) {
    return 'vi';
  }

  let englishHits = 0;
  let vietnameseHits = 0;
  for (const w of rawWords) {
    const norm = normalizeWord(w);
    if (ENGLISH_STOPWORDS.has(norm)) englishHits += 1;
    if (VIETNAMESE_STOPWORDS.has(norm)) vietnameseHits += 1;
  }

  if (englishHits > vietnameseHits && englishHits >= 1) {
    return 'en';
  }

  // Fallback for ASCII-only English sentences without stopwords (e.g. "Students practice writing.")
  if (diacriticCount === 0 && /[a-zA-Z]{3,}/.test(trimmed) && vietnameseHits === 0) {
    return 'en';
  }

  return 'vi';
}

export function normalizeWord(word: string): string {
  return word.normalize('NFC').toLowerCase();
}

export function extractWordsFromSlice(
  text: string,
  baseOffset: number,
  paragraphIndex: number,
  sentenceIndex: number
): WordToken[] {
  const tokens: WordToken[] = [];
  WORD_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WORD_REGEX.exec(text)) !== null) {
    tokens.push({
      raw: match[0],
      normalized: normalizeWord(match[0]),
      start: baseOffset + match.index,
      end: baseOffset + match.index + match[0].length,
      paragraphIndex,
      sentenceIndex,
    });
  }
  return tokens;
}

export function countWords(text: string): number {
  const matches = text.match(WORD_REGEX);
  return matches ? matches.length : 0;
}

export function splitParagraphs(text: string): ParagraphSegment[] {
  const paragraphs: ParagraphSegment[] = [];
  const lineRegex = /[^\r\n]+/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = lineRegex.exec(text)) !== null) {
    const rawLine = match[0];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const leadingSpaces = rawLine.indexOf(trimmed);
    const start = match.index + leadingSpaces;
    const end = start + trimmed.length;
    index += 1;

    paragraphs.push({
      index,
      text: trimmed,
      start,
      end,
      wordCount: countWords(trimmed),
    });
  }

  return paragraphs;
}

function inspectSentenceStart(
  sentenceText: string,
  baseOffset: number
): { startsWithCapital: boolean; firstLetterRange: TextRange | null; isOutlineItem: boolean } {
  const outlineMatch = sentenceText.match(OUTLINE_PREFIX_REGEX);
  const isOutlineItem = Boolean(outlineMatch);
  const scanFrom = outlineMatch ? outlineMatch[0].length : 0;

  for (let i = scanFrom; i < sentenceText.length; i += 1) {
    const ch = sentenceText[i];
    if (/[\s"'“”‘’«»(\[{–—-]/.test(ch)) {
      continue;
    }
    if (/\p{N}/u.test(ch)) {
      return { startsWithCapital: true, firstLetterRange: null, isOutlineItem };
    }
    if (/\p{L}/u.test(ch)) {
      const normalizedChar = ch.normalize('NFC');
      const isUpper =
        normalizedChar === normalizedChar.toUpperCase() &&
        normalizedChar !== normalizedChar.toLowerCase();
      return {
        startsWithCapital: isUpper,
        firstLetterRange: { start: baseOffset + i, end: baseOffset + i + 1 },
        isOutlineItem,
      };
    }
    break;
  }

  return { startsWithCapital: true, firstLetterRange: null, isOutlineItem };
}

function hasTerminalPunctuation(sentenceText: string): boolean {
  const trimmed = sentenceText.trimEnd();
  if (!trimmed) return true;
  const withoutClosers = trimmed.replace(/["'”’»)\]]+$/u, '');
  if (!withoutClosers) return true;
  const lastChar = withoutClosers[withoutClosers.length - 1];
  return ['.', '!', '?', '…', ':', ';'].includes(lastChar);
}

/**
 * Splits paragraphs into sentences while preserving exact character offsets in the source text.
 */
export function segmentText(text: string): {
  paragraphs: ParagraphSegment[];
  sentences: SentenceSegment[];
  words: WordToken[];
} {
  const paragraphs = splitParagraphs(text);
  const sentences: SentenceSegment[] = [];
  const words: WordToken[] = [];
  let globalIndex = 0;

  for (const para of paragraphs) {
    const paraText = para.text;
    const rawSlices: Array<{ startInPara: number; endInPara: number }> = [];
    let segStart = 0;

    const outlinePrefix = paraText.match(OUTLINE_PREFIX_REGEX);
    const minBreakPos = outlinePrefix ? outlinePrefix[0].length : 0;

    for (let i = minBreakPos; i < paraText.length; i += 1) {
      const ch = paraText[i];
      if (ch !== '.' && ch !== '!' && ch !== '?' && ch !== '…') {
        continue;
      }

      let endPunct = i;
      while (
        endPunct + 1 < paraText.length &&
        ['.', '!', '?', '…'].includes(paraText[endPunct + 1])
      ) {
        endPunct += 1;
      }

      if (
        ch === '.' &&
        endPunct === i &&
        i > 0 &&
        i + 1 < paraText.length &&
        /\d/.test(paraText[i - 1]) &&
        /\d/.test(paraText[i + 1])
      ) {
        continue;
      }

      if (ch === '.' && endPunct === i) {
        const upToDot = paraText.slice(segStart, i + 1);
        if (ABBREVIATIONS_REGEX.test(upToDot)) {
          continue;
        }
      }

      let boundaryEnd = endPunct + 1;
      while (
        boundaryEnd < paraText.length &&
        /["'”’»)\]]/.test(paraText[boundaryEnd])
      ) {
        boundaryEnd += 1;
      }

      if (boundaryEnd >= paraText.length || /\s/.test(paraText[boundaryEnd])) {
        rawSlices.push({ startInPara: segStart, endInPara: boundaryEnd });
        let nextStart = boundaryEnd;
        while (nextStart < paraText.length && /\s/.test(paraText[nextStart])) {
          nextStart += 1;
        }
        segStart = nextStart;
        i = nextStart - 1;
      }
    }

    if (segStart < paraText.length) {
      rawSlices.push({ startInPara: segStart, endInPara: paraText.length });
    }

    let sentenceInParagraph = 0;
    for (const slice of rawSlices) {
      const rawSliceText = paraText.slice(slice.startInPara, slice.endInPara);
      const trimmed = rawSliceText.trim();
      if (!trimmed) continue;

      const leadOffset = rawSliceText.indexOf(trimmed);
      const absStart = para.start + slice.startInPara + leadOffset;
      const absEnd = absStart + trimmed.length;

      globalIndex += 1;
      sentenceInParagraph += 1;

      const sentenceTokens = extractWordsFromSlice(trimmed, absStart, para.index, globalIndex);
      if (sentenceTokens.length === 0) {
        globalIndex -= 1;
        sentenceInParagraph -= 1;
        continue;
      }

      words.push(...sentenceTokens);
      const startInfo = inspectSentenceStart(trimmed, absStart);

      sentences.push({
        globalIndex,
        paragraphIndex: para.index,
        sentenceInParagraph,
        text: trimmed,
        start: absStart,
        end: absEnd,
        wordCount: sentenceTokens.length,
        isOutlineItem: startInfo.isOutlineItem,
        hasEndingPunctuation: hasTerminalPunctuation(trimmed),
        startsWithCapital: startInfo.startsWithCapital,
        firstLetterRange: startInfo.firstLetterRange,
      });
    }
  }

  return { paragraphs, sentences, words };
}
