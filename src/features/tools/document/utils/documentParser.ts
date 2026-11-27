import {
  BilingualSegment,
  DocumentBlock,
  HistoryItem,
  TARGET_LANGUAGES,
  TargetLanguageCode,
} from '../types/document';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

export interface FileValidationResult {
  valid: boolean;
  kind?: 'pdf' | 'image';
  error?: string;
}

export function validateInputFile(
  file: { name: string; type: string; size: number },
  expectedKind: 'pdf' | 'image' | 'any' = 'any',
): FileValidationResult {
  if (!file || file.size <= 0) {
    return { valid: false, error: 'Tệp trống hoặc không đọc được. Vui lòng chọn tệp khác.' };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: `Dung lượng tệp vượt quá giới hạn 20 MB (${formatFileSize(file.size)}).`,
    };
  }

  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
  const isImage =
    ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase()) ||
    /\.(png|jpe?g|webp|gif)$/i.test(lowerName);

  if (expectedKind === 'pdf') {
    if (!isPdf) {
      if (isImage) {
        return { valid: true, kind: 'image' };
      }
      return {
        valid: false,
        error: 'Định dạng chưa hỗ trợ. Vui lòng chọn tệp PDF (.pdf).',
      };
    }
    return { valid: true, kind: 'pdf' };
  }

  if (expectedKind === 'image') {
    if (!isImage) {
      if (isPdf) {
        return { valid: true, kind: 'pdf' };
      }
      return {
        valid: false,
        error: 'Định dạng chưa hỗ trợ. Vui lòng chọn ảnh PNG, JPG, WebP hoặc dán bằng Ctrl+V.',
      };
    }
    return { valid: true, kind: 'image' };
  }

  if (isPdf) return { valid: true, kind: 'pdf' };
  if (isImage) return { valid: true, kind: 'image' };

  return {
    valid: false,
    error: 'Chỉ hỗ trợ tệp PDF (.pdf) và hình ảnh (PNG, JPG, WebP, GIF).',
  };
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1).replace('.', ',')} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2).replace('.', ',')} MB`;
}

export function getLanguageLabel(code: TargetLanguageCode | string | null): string {
  if (!code) return 'Giữ nguyên ngôn ngữ gốc';
  const match = TARGET_LANGUAGES.find((item) => item.code === code);
  return match ? match.label : code;
}

export function buildDocxFileName(sourceName: string, suffix?: string): string {
  const withoutExt = sourceName
    .trim()
    .replace(/\.(pdf|png|jpe?g|webp|gif|docx)$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const base = withoutExt.length > 0 ? withoutExt : 'tai-lieu';
  const cleanSuffix = suffix ? `_${suffix}` : '';
  return `${base}${cleanSuffix}.docx`;
}

export function countWordsInText(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function countWordsInBlocks(blocks: DocumentBlock[]): number {
  let total = 0;
  for (const block of blocks) {
    if (block.type === 'table') {
      for (const row of block.rows) {
        for (const cell of row) {
          total += countWordsInText(cell);
        }
      }
    } else {
      total += countWordsInText(block.text);
    }
  }
  return total;
}

export function blocksToPlainText(blocks: DocumentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'table') {
        return block.rows.map((row) => row.join(' | ')).join('\n');
      }
      if (block.type === 'bullet') {
        return `• ${block.text}`;
      }
      return block.text;
    })
    .filter((chunk) => chunk.trim().length > 0)
    .join('\n\n');
}

interface RawBlockCandidate {
  type?: string;
  text?: string;
  rows?: unknown;
}

export function normalizeDocumentBlocks(rawBlocks: unknown, fallbackText = ''): DocumentBlock[] {
  const normalized: DocumentBlock[] = [];

  if (Array.isArray(rawBlocks)) {
    rawBlocks.forEach((item, index) => {
      if (!item || typeof item !== 'object') return;
      const candidate = item as RawBlockCandidate;
      const rawType = typeof candidate.type === 'string' ? candidate.type.toLowerCase() : 'paragraph';

      if (rawType === 'table' && Array.isArray(candidate.rows)) {
        const cleanRows = candidate.rows
          .filter((r): r is unknown[] => Array.isArray(r))
          .map((row) => row.map((cell) => String(cell ?? '').trim()))
          .filter((row) => row.some((cell) => cell.length > 0));

        if (cleanRows.length > 0) {
          const maxCols = Math.max(...cleanRows.map((r) => r.length));
          const paddedRows = cleanRows.map((r) =>
            r.length < maxCols ? [...r, ...Array<string>(maxCols - r.length).fill('')] : r,
          );
          normalized.push({
            id: `blk-${index + 1}`,
            type: 'table',
            rows: paddedRows,
          });
        }
        return;
      }

      const text = typeof candidate.text === 'string' ? candidate.text.trim() : '';
      if (!text) return;

      const validTypes = new Set(['heading1', 'heading2', 'heading3', 'paragraph', 'bullet']);
      const blockType = (validTypes.has(rawType) ? rawType : 'paragraph') as
        | 'heading1'
        | 'heading2'
        | 'heading3'
        | 'paragraph'
        | 'bullet';

      normalized.push({
        id: `blk-${index + 1}`,
        type: blockType,
        text,
      });
    });
  }

  if (normalized.length === 0 && fallbackText.trim()) {
    const paragraphs = fallbackText
      .split(/\n{2,}/)
      .map((line) => line.trim())
      .filter(Boolean);

    paragraphs.forEach((text, index) => {
      normalized.push({
        id: `blk-${index + 1}`,
        type: index === 0 ? 'heading1' : 'paragraph',
        text,
      });
    });
  }

  return normalized;
}

export function normalizeBilingualSegments(
  rawSegments: unknown,
  fallbackOriginal: string,
  fallbackTranslated: string,
): BilingualSegment[] {
  const segments: BilingualSegment[] = [];

  if (Array.isArray(rawSegments)) {
    rawSegments.forEach((item, index) => {
      if (!item || typeof item !== 'object') return;
      const obj = item as { original?: unknown; translated?: unknown; context?: unknown };
      const original = typeof obj.original === 'string' ? obj.original.trim() : '';
      const translated = typeof obj.translated === 'string' ? obj.translated.trim() : '';
      const context = typeof obj.context === 'string' ? obj.context.trim() : undefined;

      if (original || translated) {
        segments.push({
          id: `seg-${index + 1}`,
          original,
          translated,
          context: context || undefined,
        });
      }
    });
  }

  if (segments.length === 0 && (fallbackOriginal.trim() || fallbackTranslated.trim())) {
    segments.push({
      id: 'seg-1',
      original: fallbackOriginal.trim(),
      translated: fallbackTranslated.trim(),
    });
  }

  return segments;
}

export function filterHistoryItems(
  items: HistoryItem[],
  kindFilter: 'all' | 'pdf' | 'image',
  query: string,
): HistoryItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    if (kindFilter !== 'all' && item.kind !== kindFilter) {
      return false;
    }

    if (!normalizedQuery) return true;

    const haystackParts = [item.title, item.languageSummary];
    if (item.kind === 'pdf') {
      haystackParts.push(item.data.sourceFileName, blocksToPlainText(item.data.blocks));
    } else {
      haystackParts.push(item.data.sourceLabel, item.data.originalText, item.data.translatedText);
    }

    return haystackParts.join(' ').toLowerCase().includes(normalizedQuery);
  });
}

export function formatRelativeTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
