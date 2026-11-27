export interface LanguageOption {
  code: string;
  label: string;
  englishName: string;
}

export type TranslationTone = 'natural' | 'formal' | 'concise';

export const SOURCE_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Tự động nhận diện', englishName: 'Auto-detect' },
  { code: 'vi', label: 'Tiếng Việt', englishName: 'Vietnamese' },
  { code: 'en', label: 'Tiếng Anh', englishName: 'English' },
  { code: 'zh', label: 'Tiếng Trung', englishName: 'Simplified Chinese' },
  { code: 'ja', label: 'Tiếng Nhật', englishName: 'Japanese' },
  { code: 'ko', label: 'Tiếng Hàn', englishName: 'Korean' },
  { code: 'fr', label: 'Tiếng Pháp', englishName: 'French' },
  { code: 'de', label: 'Tiếng Đức', englishName: 'German' },
];

export const TARGET_LANGUAGES: LanguageOption[] = SOURCE_LANGUAGES.filter(
  (lang) => lang.code !== 'auto'
);

export const TONE_OPTIONS: { value: TranslationTone; label: string; instruction: string }[] = [
  {
    value: 'natural',
    label: 'Tự nhiên',
    instruction: 'Use natural, fluent, everyday phrasing faithful to the original meaning.',
  },
  {
    value: 'formal',
    label: 'Trang trọng',
    instruction: 'Use formal, academic, and professional tone suitable for documents and reports.',
  },
  {
    value: 'concise',
    label: 'Ngắn gọn',
    instruction: 'Use clear, concise wording without adding filler while preserving all facts.',
  },
];

export const MAX_TRANSLATE_CHARS = 30_000;

export interface TranslatePayload {
  text: string;
  sourceLang: string;
  targetLang: string;
  tone: TranslationTone;
}

export type SupportedFileKind = 'text' | 'docx' | 'legacy-doc' | 'unsupported';

export function classifyUploadedFile(fileName: string, mimeType = ''): SupportedFileKind {
  const lowerName = fileName.toLowerCase().trim();
  const lowerMime = mimeType.toLowerCase().trim();

  if (
    lowerName.endsWith('.docx') ||
    lowerMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }

  if (lowerName.endsWith('.doc') || lowerMime === 'application/msword') {
    return 'legacy-doc';
  }

  if (
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md') ||
    lowerMime === 'text/plain' ||
    lowerMime === 'text/markdown'
  ) {
    return 'text';
  }

  return 'unsupported';
}

export function validateTranslatePayload(input: unknown): {
  valid: boolean;
  error?: string;
  data?: TranslatePayload;
} {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Dữ liệu yêu cầu không hợp lệ.' };
  }

  const record = input as Record<string, unknown>;
  const text = typeof record.text === 'string' ? record.text : '';
  const sourceLang = typeof record.sourceLang === 'string' ? record.sourceLang : 'auto';
  const targetLang = typeof record.targetLang === 'string' ? record.targetLang : 'en';
  const toneRaw = typeof record.tone === 'string' ? record.tone : 'natural';

  if (text.trim().length === 0) {
    return { valid: false, error: 'Vui lòng nhập hoặc tải văn bản trước khi dịch.' };
  }

  if (text.length > MAX_TRANSLATE_CHARS) {
    return {
      valid: false,
      error: `Văn bản vượt quá giới hạn ${MAX_TRANSLATE_CHARS.toLocaleString('vi-VN')} ký tự cho mỗi lần dịch.`,
    };
  }

  const validSource = SOURCE_LANGUAGES.some((lang) => lang.code === sourceLang);
  const validTarget = TARGET_LANGUAGES.some((lang) => lang.code === targetLang);
  const validTone = TONE_OPTIONS.some((item) => item.value === toneRaw);

  if (!validSource || !validTarget) {
    return { valid: false, error: 'Ngôn ngữ nguồn hoặc ngôn ngữ đích không được hỗ trợ.' };
  }

  return {
    valid: true,
    data: {
      text,
      sourceLang,
      targetLang,
      tone: (validTone ? toneRaw : 'natural') as TranslationTone,
    },
  };
}

export function buildTranslationPrompt(payload: TranslatePayload): {
  systemInstruction: string;
  userContent: string;
} {
  const sourceOption = SOURCE_LANGUAGES.find((l) => l.code === payload.sourceLang);
  const targetOption = TARGET_LANGUAGES.find((l) => l.code === payload.targetLang);
  const toneOption = TONE_OPTIONS.find((t) => t.value === payload.tone) ?? TONE_OPTIONS[0];

  const sourceLine =
    payload.sourceLang === 'auto'
      ? 'Detect the source language automatically.'
      : `The source language is ${sourceOption?.englishName ?? payload.sourceLang}.`;

  const targetName = targetOption?.englishName ?? payload.targetLang;

  const systemInstruction = [
    `You are a precise document translator. Translate the provided text into ${targetName}.`,
    sourceLine,
    toneOption.instruction,
    'Preserve paragraph breaks, line breaks, list numbering/bullets, and URLs/links verbatim without modifying URL paths.',
    'Return ONLY the translated text with no commentary, preamble, quotes, or markdown code fences.',
  ].join(' ');

  return {
    systemInstruction,
    userContent: payload.text,
  };
}
