import type { ShareMode, ShareRecord } from './types';

// Unambiguous uppercase alphanumeric set (excludes 0, O, 1, I, L)
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const SHARE_CODE_LENGTH = 6;

const VALID_CODE_REGEX = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

/**
 * Generates a readable 6-character share code.
 */
export function generateShareCode(randomSource?: () => number): string {
  const rand = randomSource ?? Math.random;
  let result = '';
  for (let i = 0; i < SHARE_CODE_LENGTH; i += 1) {
    const idx = Math.floor(rand() * CODE_ALPHABET.length) % CODE_ALPHABET.length;
    result += CODE_ALPHABET[idx];
  }
  return result;
}

/**
 * Strips spaces, hyphens, and uppercases user-entered share codes.
 */
export function normalizeShareCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]+/g, '');
}

/**
 * Formats a normalized 6-character code into readable XXX-XXX form.
 */
export function formatShareCode(raw: string): string {
  const normalized = normalizeShareCode(raw);
  if (normalized.length !== SHARE_CODE_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}

/**
 * Checks whether a code string matches the 6-character QuickShare format.
 * Accepts uppercase letters and digits (including legacy/custom alphanumeric codes).
 */
export function isValidShareCodeFormat(raw: string): boolean {
  const normalized = normalizeShareCode(raw);
  return /^[A-Z0-9]{6}$/.test(normalized);
}

/**
 * Checks strict alphabet membership for newly generated codes.
 */
export function isStrictGeneratedCode(code: string): boolean {
  return VALID_CODE_REGEX.test(code);
}

/**
 * Builds the canonical short share link for QR codes and sharing.
 */
export function buildShareUrl(origin: string, code: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const normalized = normalizeShareCode(code);
  return `${cleanOrigin}/?c=${encodeURIComponent(normalized)}`;
}

export interface ParsedShareLocation {
  type: 'none' | 'code' | 'portable';
  value?: string;
}

/**
 * Extracts a share reference from URL pathname, query string, or hash.
 * Supports: /?c=ABC123, /s/ABC123, and portable /?p=<base64url>.
 */
export function parseShareLocation(
  pathname: string,
  search: string,
  hash = ''
): ParsedShareLocation {
  const params = new URLSearchParams(search);
  const queryCode = params.get('c') ?? params.get('code');
  if (queryCode && queryCode.trim().length > 0) {
    return { type: 'code', value: queryCode.trim() };
  }

  const portable = params.get('p');
  if (portable && portable.trim().length > 0) {
    return { type: 'portable', value: portable.trim() };
  }

  const pathMatch = pathname.match(/^\/s\/([^/?#]+)\/?$/i);
  if (pathMatch && pathMatch[1]) {
    return { type: 'code', value: decodeURIComponent(pathMatch[1]) };
  }

  if (hash && hash.startsWith('#c=')) {
    const hashCode = decodeURIComponent(hash.slice(3)).trim();
    if (hashCode.length > 0) {
      return { type: 'code', value: hashCode };
    }
  }

  return { type: 'none' };
}

/**
 * Portable UTF-8 Base64URL encoding so QuickShare payloads can also be embedded
 * directly into standalone URLs when integrated into serverless utility suites.
 */
interface PortablePayloadV1 {
  v: 1;
  t: string;
  b: string;
  m: ShareMode;
  c: number;
  e: number;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(token: string): Uint8Array {
  const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodePortablePayload(record: ShareRecord): string {
  const compact: PortablePayloadV1 = {
    v: 1,
    t: record.title,
    b: record.content,
    m: record.mode,
    c: record.createdAt,
    e: record.expiresAt,
  };
  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodePortablePayload(
  token: string,
  now = Date.now()
): { ok: true; share: ShareRecord; reason?: never; expiredAt?: never } | { ok: false; reason: 'INVALID_PAYLOAD' | 'EXPIRED'; expiredAt?: number } {
  try {
    if (!token || token.length > 64000) {
      return { ok: false, reason: 'INVALID_PAYLOAD' };
    }
    const bytes = base64UrlToBytes(token);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Partial<PortablePayloadV1>;

    if (
      parsed.v !== 1 ||
      typeof parsed.b !== 'string' ||
      parsed.b.trim().length === 0 ||
      (parsed.m !== 'read-only' && parsed.m !== 'allow-copy') ||
      typeof parsed.c !== 'number' ||
      typeof parsed.e !== 'number'
    ) {
      return { ok: false, reason: 'INVALID_PAYLOAD' };
    }

    if (parsed.e <= now) {
      return { ok: false, reason: 'EXPIRED', expiredAt: parsed.e };
    }

    return {
      ok: true,
      share: {
        code: 'TRUCTIEP',
        title: typeof parsed.t === 'string' ? parsed.t : '',
        content: parsed.b,
        mode: parsed.m,
        createdAt: parsed.c,
        expiresAt: parsed.e,
      },
    };
  } catch {
    return { ok: false, reason: 'INVALID_PAYLOAD' };
  }
}

/**
 * Formats remaining validity duration into natural Vietnamese text.
 */
export function formatRemainingTime(expiresAt: number, now = Date.now()): string {
  const diffMs = expiresAt - now;
  if (diffMs <= 0) {
    return 'Đã hết hạn';
  }
  const totalMinutes = Math.ceil(diffMs / 60000);
  if (totalMinutes < 60) {
    return `Còn ${totalMinutes} phút`;
  }
  const totalHours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;
  if (totalHours < 24) {
    return remMinutes > 0 ? `Còn ${totalHours} giờ ${remMinutes} phút` : `Còn ${totalHours} giờ`;
  }
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  return remHours > 0 ? `Còn ${days} ngày ${remHours} giờ` : `Còn ${days} ngày`;
}

/**
 * Formats a timestamp cleanly in vi-VN locale.
 */
export function formatDateTimeVi(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

/**
 * Creates a safe ASCII-friendly filename for downloading a .txt file.
 */
export function buildTxtFilename(record: Pick<ShareRecord, 'code' | 'title'>): string {
  const baseTitle = record.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  if (baseTitle.length >= 2) {
    return `${baseTitle}-${normalizeShareCode(record.code).toLowerCase()}.txt`;
  }
  return `quickshare-${normalizeShareCode(record.code).toLowerCase()}.txt`;
}

/**
 * Formats the downloaded .txt file body cleanly with optional title header.
 */
export function buildTxtContent(record: Pick<ShareRecord, 'title' | 'content'>): string {
  const trimmedTitle = record.title.trim();
  if (!trimmedTitle) {
    return record.content;
  }
  return `${trimmedTitle}\n${'='.repeat(Math.min(trimmedTitle.length, 48))}\n\n${record.content}`;
}
