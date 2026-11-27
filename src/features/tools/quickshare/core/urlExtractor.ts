import type { ExtractedUrl, TextSegment } from './types';

// Matches http://, https://, or standalone www. URLs inside arbitrary text
const URL_PATTERN = /\b((?:https?:\/\/|www\.)[^\s<>"'`]+)/gi;

const TRAILING_PUNCTUATION = /[.,;:!?)\]}>'"]+$/;

function trimBalancedTrailing(raw: string): string {
  let value = raw;
  while (value.length > 0) {
    const lastChar = value[value.length - 1];
    if (lastChar === ')') {
      const openCount = (value.match(/\(/g) ?? []).length;
      const closeCount = (value.match(/\)/g) ?? []).length;
      if (closeCount > openCount) {
        value = value.slice(0, -1);
        continue;
      }
      break;
    }
    if (TRAILING_PUNCTUATION.test(lastChar)) {
      value = value.slice(0, -1);
      continue;
    }
    break;
  }
  return value;
}

function toSafeUrl(rawCandidate: string): ExtractedUrl | null {
  const cleaned = trimBalancedTrailing(rawCandidate);
  if (!cleaned) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return null;
    }

    const host = parsed.hostname.replace(/^www\./i, '');
    const rawPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    const pathLabel = rawPath === '/' ? '' : rawPath;
    const href = parsed.toString();

    let displayUrl = href;
    try {
      displayUrl = decodeURI(href);
    } catch {
      displayUrl = href;
    }

    return {
      raw: cleaned,
      href,
      displayUrl,
      host,
      pathLabel,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts unique, safe http/https URLs from arbitrary text while preserving order.
 */
export function extractUrls(text: string): ExtractedUrl[] {
  if (!text) {
    return [];
  }

  const seen = new Set<string>();
  const results: ExtractedUrl[] = [];
  const regex = new RegExp(URL_PATTERN.source, 'gi');

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const candidate = toSafeUrl(match[1]);
    if (candidate && !seen.has(candidate.href)) {
      seen.add(candidate.href);
      results.push(candidate);
    }
  }

  return results;
}

/**
 * Splits plain text into safe text and URL segments for rendering clickable links
 * without innerHTML injection.
 */
export function tokenizeTextWithUrls(text: string): TextSegment[] {
  if (!text) {
    return [];
  }

  const segments: TextSegment[] = [];
  const regex = new RegExp(URL_PATTERN.source, 'gi');
  let lastIndex = 0;

  const pushText = (chunk: string) => {
    if (!chunk) return;
    const prev = segments[segments.length - 1];
    if (prev && prev.type === 'text') {
      prev.value += chunk;
    } else {
      segments.push({ type: 'text', value: chunk });
    }
  };

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const rawMatch = match[1];
    const candidate = toSafeUrl(rawMatch);

    if (!candidate) {
      continue;
    }

    if (start > lastIndex) {
      pushText(text.slice(lastIndex, start));
    }

    segments.push({
      type: 'url',
      value: candidate.raw,
      href: candidate.href,
    });

    // Preserve any trailing punctuation that was stripped from the URL
    const trailingStart = start + candidate.raw.length;
    const matchEnd = start + rawMatch.length;
    if (trailingStart < matchEnd) {
      pushText(text.slice(trailingStart, matchEnd));
    }

    lastIndex = matchEnd;
  }

  if (lastIndex < text.length) {
    pushText(text.slice(lastIndex));
  }

  return segments;
}
