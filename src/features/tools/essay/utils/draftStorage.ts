import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { CriterionInput, LanguagePreference } from '../analyzer';

export const DRAFT_STORAGE_KEY = 'essaychecker:draft:v1';

export interface EssayDraft {
  title: string;
  content: string;
  criteria: CriterionInput[];
  language: LanguagePreference;
  updatedAt: string | null;
}

export const EMPTY_DRAFT: EssayDraft = {
  title: '',
  content: '',
  criteria: [],
  language: 'auto',
  updatedAt: null,
};

function isValidLanguage(value: unknown): value is LanguagePreference {
  return value === 'auto' || value === 'vi' || value === 'en';
}

export function parseDraftPayload(raw: string | null): EssayDraft | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;

    const title = typeof obj.title === 'string' ? obj.title : '';
    const content = typeof obj.content === 'string' ? obj.content : '';
    const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : null;
    const language: LanguagePreference = isValidLanguage(obj.language) ? obj.language : 'auto';

    const criteria: CriterionInput[] = [];
    if (Array.isArray(obj.criteria)) {
      for (let i = 0; i < obj.criteria.length; i += 1) {
        const entry = obj.criteria[i];
        if (
          entry &&
          typeof entry === 'object' &&
          typeof (entry as Record<string, unknown>).id === 'string' &&
          typeof (entry as Record<string, unknown>).text === 'string'
        ) {
          const text = ((entry as Record<string, unknown>).text as string).trim();
          if (text) {
            criteria.push({
              id: (entry as Record<string, unknown>).id as string,
              text,
            });
          }
        }
      }
    }

    return { title, content, criteria, language, updatedAt };
  } catch {
    return null;
  }
}

export function loadDraft(): EssayDraft {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return EMPTY_DRAFT;
    }
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    return parseDraftPayload(raw) ?? EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

export function saveDraft(draft: EssayDraft): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredDraft(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted sandboxes
  }
}

/**
 * Builds a clean ASCII-safe `.docx` Word filename from an optional essay title.
 */
export function buildWordExportFilename(title: string): string {
  const cleaned = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${cleaned || 'bai-viet-essaychecker'}.docx`;
}

/**
 * Builds a genuine Microsoft Word (.docx) Document formatted cleanly for school essays
 * (Times New Roman 13pt, 1.5 line spacing, UTF-8 Vietnamese & English support).
 */
export function createEssayWordDocument(title: string, content: string): Document {
  const trimmedTitle = title.trim();
  const normalizedBody = content.replace(/\r\n/g, '\n');
  const bodyLines = normalizedBody
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const children: Paragraph[] = [];

  if (trimmedTitle) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240, line: 320 },
        children: [
          new TextRun({
            text: trimmedTitle,
            bold: true,
            size: 32, // 16pt
            font: 'Times New Roman',
            color: '111827',
          }),
        ],
      })
    );
  }

  for (const line of bodyLines) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 160, line: 360 }, // 1.5 line spacing
        children: [
          new TextRun({
            text: line,
            size: 26, // 13pt (Vietnamese school essay standard)
            font: 'Times New Roman',
            color: '111827',
          }),
        ],
      })
    );
  }

  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }

  return new Document({
    creator: 'SmartStudy',
    title: trimmedTitle || 'Bài viết SmartStudy',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2cm
              right: 1134,
              bottom: 1134,
              left: 1417, // 2.5cm standard left margin
            },
          },
        },
        children,
      },
    ],
  });
}

export async function downloadEssayAsWord(title: string, content: string): Promise<string> {
  const filename = buildWordExportFilename(title);
  const doc = createEssayWordDocument(title, content);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return filename;
}

export function formatSavedTime(isoTimestamp: string | null): string {
  if (!isoTimestamp) return '';
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
