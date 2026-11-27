export interface TextStats {
  words: number;
  charsWithSpaces: number;
  charsWithoutSpaces: number;
  lines: number;
  nonEmptyLines: number;
  linksCount: number;
  uniqueLinksCount: number;
}

export interface ExtractedLink {
  raw: string;
  href: string;
  count: number;
}

export interface ProcessResult {
  text: string;
  summary: string;
  changed: boolean;
}

export interface HistoryState {
  past: string[];
  present: string;
  maxSteps: number;
}

const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
const TRAILING_PUNCTUATION_REGEX = /[.,;:!?)\]}>'"»”’]+$/;
const LIST_ITEM_PREFIX_REGEX = /^\s*(?:[-–—•·*+]|\d+[.)]|[a-zA-Z][.)])\s+/;
const HEADING_LIKE_REGEX = /^(?:[IVXLCDM]+\.|chương\s+\d+|phần\s+\d+|mục\s+\d+|bài\s+\d+|\d+(?:\.\d+)*\.?\s+\S)/i;

/**
 * Sample Vietnamese text simulating a messy copy-paste from PDF/slides
 * with broken mid-sentence line wraps, extra spaces, inline list items, and duplicate URLs.
 */
export const SAMPLE_MESSY_TEXT = `Báo cáo tổng hợp   tài liệu học tập   và nguồn tham khảo
https://developer.mozilla.org/vi/docs/Web/JavaScript

Trong quá trình đọc tài liệu định dạng PDF,   các đoạn văn thường bị
ngắt dòng đột ngột giữa câu khiến việc chỉnh sửa và trích dẫn
trở nên mất thời gian.   Ngoài ra, nhiều khoảng trắng   thừa hoặc
dòng trống liên tiếp cũng làm rối bố cục bài viết.



Danh sách nguồn tra cứu cần lưu lại:
- Tài liệu web chuẩn: https://developer.mozilla.org/vi/docs/Web/JavaScript
- Kho dữ liệu mở: www.wikipedia.org/wiki/Việt_Nam,   https://thuvienphapluat.vn/
- Cổng học liệu: https://hanhtrangso.nxbgd.vn/ (bản cập nhật mới).
- Xem thêm tại www.wikipedia.org/wiki/Việt_Nam

Các đầu việc cần sắp xếp: Tóm tắt chương 1; Lọc danh sách liên kết; Chuẩn hóa khoảng trắng; Kiểm tra trích dẫn; Xuất file CSV gửi nhóm`;

/**
 * Normalizes line endings to LF (`\n`) and strips invisible zero-width chars often copied from PDFs.
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Cleans trailing punctuation from a raw URL match while preserving balanced closing parentheses
 * (e.g. Wikipedia links like `https://en.wikipedia.org/wiki/Text_(computing)`).
 */
function trimUrlTrailingPunctuation(rawUrl: string): string {
  let cleaned = rawUrl;
  while (cleaned.length > 0) {
    const lastChar = cleaned[cleaned.length - 1];
    if (lastChar === ')') {
      const openCount = (cleaned.match(/\(/g) || []).length;
      const closeCount = (cleaned.match(/\)/g) || []).length;
      if (closeCount > openCount) {
        cleaned = cleaned.slice(0, -1);
        continue;
      }
      break;
    }
    if (TRAILING_PUNCTUATION_REGEX.test(lastChar)) {
      cleaned = cleaned.slice(0, -1);
      continue;
    }
    break;
  }
  return cleaned;
}

/**
 * Converts a raw URL (`http://`, `https://`, or `www.`) into a safe navigable URL.
 */
export function normalizeUrlHref(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Scans text and extracts all web links (`http://`, `https://`, `www.`).
 * When `deduplicate` is true, merges identical URLs (case-insensitive on protocol+host)
 * while recording occurrence counts.
 */
export function extractLinks(text: string, deduplicate = true): ExtractedLink[] {
  const matches = text.match(URL_REGEX);
  if (!matches) {
    return [];
  }

  const cleanedList = matches
    .map((match) => trimUrlTrailingPunctuation(match))
    .filter((url) => url.length > 4 && /[a-zA-Z0-9]\.[a-zA-Z]{2,}/.test(url));

  if (!deduplicate) {
    return cleanedList.map((raw) => ({
      raw,
      href: normalizeUrlHref(raw),
      count: 1,
    }));
  }

  const seen = new Map<string, ExtractedLink>();
  for (const raw of cleanedList) {
    const href = normalizeUrlHref(raw);
    const dedupKey = href.replace(/\/+$/, '').toLowerCase();
    const existing = seen.get(dedupKey);
    if (existing) {
      existing.count += 1;
    } else {
      seen.set(dedupKey, { raw, href, count: 1 });
    }
  }

  return Array.from(seen.values());
}

/**
 * Computes instant document metrics: words, characters (with/without spaces), lines, and links.
 */
export function computeTextStats(text: string): TextStats {
  const normalized = normalizeLineEndings(text);
  const trimmed = normalized.trim();

  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).filter(Boolean).length;
  const charsWithSpaces = normalized.length;
  const charsWithoutSpaces = normalized.replace(/\s/g, '').length;

  const rawLines = normalized === '' ? [] : normalized.split('\n');
  const lines = rawLines.length;
  const nonEmptyLines = rawLines.filter((line) => line.trim().length > 0).length;

  const allLinks = extractLinks(normalized, false);
  const uniqueLinks = extractLinks(normalized, true);

  return {
    words,
    charsWithSpaces,
    charsWithoutSpaces,
    lines,
    nonEmptyLines,
    linksCount: allLinks.length,
    uniqueLinksCount: uniqueLinks.length,
  };
}

/**
 * Collapses consecutive horizontal spaces/tabs into a single space and trims each line.
 */
export function collapseSpaces(text: string): ProcessResult {
  const normalized = normalizeLineEndings(text);
  const cleaned = normalized
    .split('\n')
    .map((line) => line.replace(/[ \t\u00A0]+/g, ' ').trim())
    .join('\n');

  const changed = cleaned !== text;
  return {
    text: cleaned,
    changed,
    summary: changed
      ? 'Đã thu gọn khoảng trắng thừa trên toàn bộ văn bản.'
      : 'Văn bản không có khoảng trắng thừa cần thu gọn.',
  };
}

/**
 * Removes redundant blank lines: collapses 2+ consecutive blank lines into a single blank line
 * (or removes all blank lines if `removeAll` is true) and trims leading/trailing empty lines.
 */
export function removeExtraBlankLines(text: string, removeAll = false): ProcessResult {
  const normalized = normalizeLineEndings(text);
  const lines = normalized.split('\n').map((line) => line.trimEnd());

  let resultLines: string[];
  if (removeAll) {
    resultLines = lines.filter((line) => line.trim().length > 0);
  } else {
    resultLines = [];
    let previousWasBlank = false;
    for (const line of lines) {
      const isBlank = line.trim().length === 0;
      if (isBlank) {
        if (!previousWasBlank && resultLines.length > 0) {
          resultLines.push('');
        }
        previousWasBlank = true;
      } else {
        resultLines.push(line);
        previousWasBlank = false;
      }
    }
    while (resultLines.length > 0 && resultLines[resultLines.length - 1] === '') {
      resultLines.pop();
    }
  }

  const cleaned = resultLines.join('\n');
  const changed = cleaned !== text;
  return {
    text: cleaned,
    changed,
    summary: changed
      ? removeAll
        ? 'Đã xóa toàn bộ dòng trống.'
        : 'Đã xóa các dòng trống thừa.'
      : 'Không có dòng trống thừa cần xóa.',
  };
}

/**
 * Joins broken lines commonly produced when copying text from PDFs or OCR images.
 * Preserves blank-line paragraph breaks, list items, standalone URLs, and heading-like lines.
 */
export function unwrapPdfLines(text: string): ProcessResult {
  const normalized = normalizeLineEndings(text);
  const rawLines = normalized.split('\n');
  const outputLines: string[] = [];
  let joinedCount = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const current = rawLines[i].trim();

    if (current === '') {
      if (outputLines.length > 0 && outputLines[outputLines.length - 1] !== '') {
        outputLines.push('');
      }
      continue;
    }

    if (outputLines.length === 0 || outputLines[outputLines.length - 1] === '') {
      outputLines.push(current);
      continue;
    }

    const previous = outputLines[outputLines.length - 1];
    const currentIsList = LIST_ITEM_PREFIX_REGEX.test(current);
    const currentIsUrlOnly = /^(?:https?:\/\/|www\.)\S+$/i.test(current);
    const previousIsUrlOnly = /^(?:https?:\/\/|www\.)\S+$/i.test(previous);
    const currentIsHeading = HEADING_LIKE_REGEX.test(current) && current.length < 90;
    const previousEndsSentenceWithColon = /:\s*$/.test(previous);
    const previousLooksLikeShortTitle =
      previous.length < 65 &&
      !/[.,;!?…]$/.test(previous) &&
      !LIST_ITEM_PREFIX_REGEX.test(previous) &&
      /^[A-ZÀ-Ỹ]/.test(current);

    if (
      currentIsList ||
      currentIsUrlOnly ||
      previousIsUrlOnly ||
      currentIsHeading ||
      previousEndsSentenceWithColon ||
      previousLooksLikeShortTitle
    ) {
      outputLines.push(current);
      continue;
    }

    // Handle hyphenated word wrap at end of line (e.g. "chuyên-\nngành" -> "chuyên ngành" or "inter-\nnational")
    if (/[a-zA-ZÀ-ỹ]-$/.test(previous) && /^[a-zà-ỹ]/.test(current)) {
      outputLines[outputLines.length - 1] = `${previous.slice(0, -1)}${current}`;
      joinedCount += 1;
    } else {
      outputLines[outputLines.length - 1] = `${previous} ${current}`;
      joinedCount += 1;
    }
  }

  while (outputLines.length > 0 && outputLines[outputLines.length - 1] === '') {
    outputLines.pop();
  }

  const cleaned = outputLines.join('\n');
  const changed = cleaned !== text;

  return {
    text: cleaned,
    changed,
    summary:
      joinedCount > 0
        ? `Đã nối ${joinedCount} dòng bị ngắt quãng từ PDF/tài liệu.`
        : changed
          ? 'Đã chuẩn hóa các ngắt dòng trong văn bản.'
          : 'Không phát hiện dòng bị ngắt quãng cần nối.',
  };
}

/**
 * 1-tap full cleanup: unwraps broken PDF lines, removes redundant blank lines, and collapses spaces.
 */
export function cleanAllFormatting(text: string): ProcessResult {
  if (text.trim() === '') {
    return {
      text,
      changed: false,
      summary: 'Chưa có văn bản để dọn định dạng.',
    };
  }

  const step1 = unwrapPdfLines(text);
  const step2 = removeExtraBlankLines(step1.text, false);
  const step3 = collapseSpaces(step2.text);

  const changed = step3.text !== text;
  return {
    text: step3.text,
    changed,
    summary: changed
      ? 'Đã dọn xuống dòng PDF, xóa dòng trống thừa và thu gọn khoảng trắng.'
      : 'Văn bản đã gọn gàng, không có thay đổi nào.',
  };
}

/**
 * Splits items into one item per line using common separators (semicolons, inline bullets,
 * numbered inline markers, or comma-separated phrases when appropriate).
 */
export function splitListItems(text: string): ProcessResult {
  const normalized = normalizeLineEndings(text).trim();
  if (!normalized) {
    return { text, changed: false, summary: 'Chưa có nội dung để tách danh sách.' };
  }

  const lines = normalized.split('\n');
  const items: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Preserve prefix like "Các đầu việc cần sắp xếp:" on its own line if followed by list items
    let working = line;
    const colonPrefixMatch = working.match(/^([^:]{3,60}):\s+(.+)$/);
    if (
      colonPrefixMatch &&
      !/^https?$/i.test(colonPrefixMatch[1]) &&
      /[;•·|]|,\s+/.test(colonPrefixMatch[2])
    ) {
      items.push(`${colonPrefixMatch[1].trim()}:`);
      working = colonPrefixMatch[2].trim();
    }

    // Split by semicolons, pipes, inline bullets, or commas outside URLs
    if (/[;•·|]/.test(working)) {
      const parts = working
        .split(/\s*[;•·|]\s*/)
        .map((part) => part.replace(/^[-–—*]\s+/, '').trim())
        .filter(Boolean);
      items.push(...parts);
    } else if (/,\s+/.test(working) && !URL_REGEX.test(working)) {
      const parts = working
        .split(/,\s+/)
        .map((part) => part.replace(/^[-–—*]\s+/, '').trim())
        .filter(Boolean);
      items.push(...parts);
    } else {
      items.push(working.replace(/^[-–—•·*]\s+/, '').trim());
    }
  }

  const result = items.filter(Boolean).join('\n');
  const changed = result !== text;

  return {
    text: result,
    changed,
    summary: changed
      ? `Đã tách thành ${items.length} dòng riêng biệt.`
      : 'Các mục đã nằm trên từng dòng riêng.',
  };
}

/**
 * Adds sequential numbering (`1. `, `2. `, ...) to each non-empty line,
 * replacing any existing leading numeric prefix cleanly.
 */
export function numberLines(text: string): ProcessResult {
  const normalized = normalizeLineEndings(text);
  const lines = normalized.split('\n');
  let index = 0;

  const numbered = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    index += 1;
    const withoutOldNumber = trimmed.replace(/^\d+[.)]\s+/, '');
    return `${index}. ${withoutOldNumber}`;
  });

  const result = numbered.join('\n');
  const changed = result !== text;
  return {
    text: result,
    changed,
    summary:
      index > 0
        ? `Đã đánh số thứ tự cho ${index} dòng.`
        : 'Chưa có dòng nào để đánh số thứ tự.',
  };
}

/**
 * Removes leading numbers or list bullets from each line.
 */
export function stripLinePrefixes(text: string): ProcessResult {
  const normalized = normalizeLineEndings(text);
  const result = normalized
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-–—•·*])\s+/, ''))
    .join('\n');

  const changed = result !== text;
  return {
    text: result,
    changed,
    summary: changed
      ? 'Đã bỏ số thứ tự và ký hiệu đầu dòng.'
      : 'Không tìm thấy số thứ tự hoặc ký hiệu đầu dòng.',
  };
}

/**
 * Sorts non-empty lines alphabetically using Vietnamese collation (`vi`).
 */
export function sortLines(text: string, direction: 'asc' | 'desc' = 'asc'): ProcessResult {
  const normalized = normalizeLineEndings(text);
  const nonEmpty = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (nonEmpty.length === 0) {
    return { text, changed: false, summary: 'Chưa có dòng nào để sắp xếp.' };
  }

  const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
  const sorted = [...nonEmpty].sort((a, b) => {
    const cmp = collator.compare(a, b);
    return direction === 'asc' ? cmp : -cmp;
  });

  const result = sorted.join('\n');
  const changed = result !== text;

  return {
    text: result,
    changed,
    summary:
      direction === 'asc'
        ? `Đã sắp xếp ${sorted.length} dòng theo thứ tự A → Z.`
        : `Đã sắp xếp ${sorted.length} dòng theo thứ tự Z → A.`,
  };
}

/**
 * Removes duplicate lines while preserving first-seen order (case-insensitive trim comparison).
 */
export function deduplicateLines(text: string): ProcessResult {
  const normalized = normalizeLineEndings(text);
  const lines = normalized.split('\n');
  const seen = new Set<string>();
  const unique: string[] = [];
  let removed = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      removed += 1;
    } else {
      seen.add(key);
      unique.push(trimmed);
    }
  }

  const result = unique.join('\n');
  const changed = result !== text;

  return {
    text: result,
    changed,
    summary:
      removed > 0
        ? `Đã loại bỏ ${removed} dòng trùng lặp, còn lại ${unique.length} dòng.`
        : 'Không có dòng trùng lặp nào.',
  };
}

/**
 * Counts how many non-empty lines match a keyword (case-insensitive).
 */
export function countMatchingLines(text: string, keyword: string): number {
  const query = keyword.trim().toLowerCase();
  if (!query) return 0;

  return normalizeLineEndings(text)
    .split('\n')
    .filter((line) => line.trim().length > 0 && line.toLowerCase().includes(query)).length;
}

/**
 * Filters lines containing (or excluding) the given keyword (case-insensitive).
 */
export function filterLinesByKeyword(
  text: string,
  keyword: string,
  mode: 'keep' | 'exclude' = 'keep'
): ProcessResult {
  const query = keyword.trim();
  if (!query) {
    return {
      text,
      changed: false,
      summary: 'Hãy nhập từ khóa trước khi lọc dòng.',
    };
  }

  const lowerQuery = query.toLowerCase();
  const nonEmptyLines = normalizeLineEndings(text)
    .split('\n')
    .filter((line) => line.trim().length > 0);

  const filtered = nonEmptyLines.filter((line) => {
    const matches = line.toLowerCase().includes(lowerQuery);
    return mode === 'keep' ? matches : !matches;
  });

  const result = filtered.join('\n');
  const changed = result !== text;

  if (mode === 'keep') {
    return {
      text: result,
      changed,
      summary:
        filtered.length > 0
          ? `Đã giữ lại ${filtered.length} dòng chứa "${query}".`
          : `Không có dòng nào chứa "${query}".`,
    };
  }

  return {
    text: result,
    changed,
    summary: `Đã loại bỏ các dòng chứa "${query}", còn lại ${filtered.length} dòng.`,
  };
}

/**
 * Escapes a single CSV field per RFC 4180.
 */
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Converts text lines into a UTF-8 BOM CSV string (`STT,Noi_dung`) so Excel displays Vietnamese accurately.
 */
export function toCsvContent(text: string): string {
  const lines = normalizeLineEndings(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = ['STT,Noi_dung'];
  lines.forEach((line, index) => {
    rows.push(`${index + 1},${escapeCsvField(line)}`);
  });

  return `\uFEFF${rows.join('\r\n')}`;
}

/**
 * History helpers for multi-step Undo.
 */
export function createHistory(initialText = '', maxSteps = 50): HistoryState {
  return {
    past: [],
    present: initialText,
    maxSteps,
  };
}

export function pushHistory(state: HistoryState, nextText: string): HistoryState {
  if (nextText === state.present) {
    return state;
  }
  const nextPast = [...state.past, state.present];
  const trimmedPast =
    nextPast.length > state.maxSteps
      ? nextPast.slice(nextPast.length - state.maxSteps)
      : nextPast;

  return {
    ...state,
    past: trimmedPast,
    present: nextText,
  };
}

export function undoHistory(state: HistoryState): HistoryState {
  if (state.past.length === 0) {
    return state;
  }
  const previous = state.past[state.past.length - 1];
  return {
    ...state,
    past: state.past.slice(0, -1),
    present: previous,
  };
}
