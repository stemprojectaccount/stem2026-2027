export type WorkspaceTab = 'pdf-to-word' | 'image-translate' | 'history';

export type TargetLanguageCode = 'vi' | 'en' | 'ja' | 'ko' | 'zh' | 'fr' | 'de';

export interface LanguageOption {
  code: TargetLanguageCode;
  label: string;
  englishName: string;
}

export const TARGET_LANGUAGES: readonly LanguageOption[] = [
  { code: 'vi', label: 'Tiếng Việt', englishName: 'Vietnamese' },
  { code: 'en', label: 'Tiếng Anh', englishName: 'English' },
  { code: 'ja', label: 'Tiếng Nhật', englishName: 'Japanese' },
  { code: 'ko', label: 'Tiếng Hàn', englishName: 'Korean' },
  { code: 'zh', label: 'Tiếng Trung (Giản thể)', englishName: 'Simplified Chinese' },
  { code: 'fr', label: 'Tiếng Pháp', englishName: 'French' },
  { code: 'de', label: 'Tiếng Đức', englishName: 'German' },
] as const;

export type TextBlockType = 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bullet';

export interface TextDocumentBlock {
  id: string;
  type: TextBlockType;
  text: string;
}

export interface TableDocumentBlock {
  id: string;
  type: 'table';
  rows: string[][];
}

export type DocumentBlock = TextDocumentBlock | TableDocumentBlock;

export interface PdfConversionResult {
  title: string;
  sourceFileName: string;
  fileSizeBytes: number;
  detectedLanguage: string;
  targetLanguage: TargetLanguageCode | null;
  pageCountEstimate: number;
  blocks: DocumentBlock[];
  createdAt: string;
}

export interface BilingualSegment {
  id: string;
  original: string;
  translated: string;
  context?: string;
}

export interface ImageTranslationResult {
  sourceLabel: string;
  sourceMethod: 'paste' | 'file' | 'sample';
  detectedLanguage: string;
  targetLanguage: TargetLanguageCode;
  originalText: string;
  translatedText: string;
  segments: BilingualSegment[];
  imageDataUrl?: string;
  createdAt: string;
}

export interface PdfHistoryItem {
  id: string;
  kind: 'pdf';
  title: string;
  createdAt: string;
  wordCount: number;
  languageSummary: string;
  data: PdfConversionResult;
}

export interface ImageHistoryItem {
  id: string;
  kind: 'image';
  title: string;
  createdAt: string;
  wordCount: number;
  languageSummary: string;
  data: ImageTranslationResult;
}

export type HistoryItem = PdfHistoryItem | ImageHistoryItem;
