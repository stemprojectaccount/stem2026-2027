export type ShareMode = 'read-only' | 'allow-copy';

export type ShareTtlMinutes = 15 | 60 | 1440 | 10080;

export interface ShareRecord {
  code: string;
  title: string;
  content: string;
  mode: ShareMode;
  createdAt: number;
  expiresAt: number;
  sourceCode?: string;
}

export interface CreateShareInput {
  title?: string;
  content: string;
  mode: ShareMode;
  ttlMinutes: ShareTtlMinutes;
  sourceCode?: string;
}

export type ShareErrorCode =
  | 'EMPTY_CONTENT'
  | 'CONTENT_TOO_LONG'
  | 'INVALID_CODE'
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'INVALID_PAYLOAD'
  | 'NETWORK_ERROR';

export type ShareLookupResult =
  | {
      ok: true;
      share: ShareRecord;
      source: 'server' | 'portable';
      // (lets the app narrow the union without strictNullChecks)
      errorCode?: never;
      message?: never;
      code?: never;
      expiredAt?: never;
    }
  | {
      ok: false;
      errorCode: ShareErrorCode;
      message: string;
      code?: string;
      expiredAt?: number;
    };

export type CreateShareResult =
  | {
      ok: true;
      share: ShareRecord;
      errorCode?: never;
      message?: never;
    }
  | {
      ok: false;
      errorCode: ShareErrorCode;
      message: string;
    };

export interface ExtractedUrl {
  raw: string;
  href: string;
  displayUrl: string;
  host: string;
  pathLabel: string;
}

export interface TextSegment {
  type: 'text' | 'url';
  value: string;
  href?: string;
}

export interface RecentShareEntry {
  code: string;
  title: string;
  preview: string;
  mode: ShareMode;
  expiresAt: number;
  savedAt: number;
  role: 'created' | 'viewed';
  linkCount: number;
}

export const TTL_OPTIONS: ReadonlyArray<{ value: ShareTtlMinutes; label: string }> = [
  { value: 15, label: '15 phút' },
  { value: 60, label: '1 giờ' },
  { value: 1440, label: '24 giờ' },
  { value: 10080, label: '7 ngày' },
];

export const MAX_CONTENT_LENGTH = 50000;
export const MAX_TITLE_LENGTH = 120;
