import {
  decodePortablePayload,
  generateShareCode,
  isValidShareCodeFormat,
  normalizeShareCode,
  parseShareLocation,
} from './shareCodec';
import { extractUrls } from './urlExtractor';
import { MAX_CONTENT_LENGTH, MAX_TITLE_LENGTH } from './types';
import type {
  CreateShareInput,
  CreateShareResult,
  RecentShareEntry,
  ShareLookupResult,
  ShareRecord,
} from './types';

const RECENT_STORAGE_KEY = 'quickshare.recent.v1';
const MAX_RECENT_ITEMS = 12;
const ALLOWED_TTLS = new Set([15, 60, 1440, 10080]);

// Shares live in Firestore (collection "shares", create-only, see firestore.rules) so a code made
// on the phone opens on any computer. The SmartStudy server (/api/tools/shares) is the fallback
// when Firestore is unreachable or the rules have not been deployed yet.
async function firestoreApi() {
  const [{ db }, fs] = await Promise.all([import('../../../../firebase'), import('firebase/firestore')]);
  return { db, ...fs };
}

async function createInFirestore(input: CreateShareInput): Promise<ShareRecord | null> {
  try {
    const { db, doc, setDoc } = await firestoreApi();
    const createdAt = Date.now();
    const ttl = ALLOWED_TTLS.has(input.ttlMinutes) ? input.ttlMinutes : 1440;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const code = generateShareCode();
      const record: ShareRecord = {
        code,
        title: (input.title ?? '').trim().slice(0, MAX_TITLE_LENGTH),
        content: input.content,
        mode: input.mode === 'allow-copy' ? 'allow-copy' : 'read-only',
        createdAt,
        expiresAt: createdAt + ttl * 60_000,
        ...(input.sourceCode && isValidShareCodeFormat(input.sourceCode)
          ? { sourceCode: normalizeShareCode(input.sourceCode) }
          : {}),
      };
      try {
        await withTimeout(setDoc(doc(db, 'shares', code), record), 8000);
        return record;
      } catch (err: any) {
        // an existing code is an "update", which the rules refuse: try another code
        if (String(err?.code || '').includes('permission-denied') && attempt < 3) continue;
        return null;
      }
    }
  } catch {
    // Firestore not available (offline / blocked)
  }
  return null;
}

async function getFromFirestore(code: string): Promise<ShareLookupResult | null> {
  try {
    const { db, doc, getDoc } = await firestoreApi();
    const snap = await withTimeout(getDoc(doc(db, 'shares', code)), 8000);
    if (!snap.exists()) return null;
    const share = snap.data() as ShareRecord;
    if (share.expiresAt <= Date.now()) {
      return {
        ok: false,
        errorCode: 'EXPIRED',
        code,
        expiredAt: share.expiresAt,
        message: 'Mã chia sẻ này đã hết thời hạn hiệu lực nên nội dung không còn mở được nữa.',
      };
    }
    return { ok: true, share, source: 'server' };
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Creates a new immutable share (Firestore first, SmartStudy server as fallback).
 */
export async function createShare(input: CreateShareInput): Promise<CreateShareResult> {
  if (!input.content || input.content.trim().length === 0) {
    return {
      ok: false,
      errorCode: 'EMPTY_CONTENT',
      message: 'Bạn chưa nhập nội dung cần chia sẻ. Hãy dán ghi chú hoặc đường link vào ô soạn thảo.',
    };
  }
  if (input.content.length > MAX_CONTENT_LENGTH) {
    return {
      ok: false,
      errorCode: 'CONTENT_TOO_LONG',
      message: `Nội dung vượt quá giới hạn ${MAX_CONTENT_LENGTH.toLocaleString('vi-VN')} ký tự. Hãy rút gọn bớt trước khi tạo mã.`,
    };
  }

  const stored = await createInFirestore(input);
  if (stored) return { ok: true, share: stored };

  try {
    const response = await fetch('/api/tools/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = (await response.json()) as CreateShareResult;
    if (!response.ok && data && !data.ok) {
      return data;
    }
    return data;
  } catch {
    return {
      ok: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Không thể kết nối tới máy chủ tạo mã lúc này. Hãy thử lại sau ít giây.',
    };
  }
}

/**
 * Fetches an existing share by its short code.
 */
export async function fetchShareByCode(rawCode: string): Promise<ShareLookupResult> {
  const normalized = normalizeShareCode(rawCode);
  if (!normalized) {
    return {
      ok: false,
      errorCode: 'INVALID_CODE',
      message: 'Bạn chưa nhập mã chia sẻ. Hãy nhập 6 ký tự từ thiết bị gửi.',
    };
  }

  if (!isValidShareCodeFormat(normalized)) {
    return {
      ok: false,
      errorCode: 'INVALID_CODE',
      code: normalized,
      message: 'Mã chia sẻ gồm đúng 6 chữ cái hoặc chữ số (ví dụ: HOC-202). Hãy kiểm tra lại từng ký tự.',
    };
  }

  const fromCloud = await getFromFirestore(normalized);
  if (fromCloud) return fromCloud;

  try {
    const response = await fetch(`/api/tools/shares/${encodeURIComponent(normalized)}`);
    const data = (await response.json()) as ShareLookupResult;
    return data;
  } catch {
    return {
      ok: false,
      errorCode: 'NETWORK_ERROR',
      code: normalized,
      message: 'Không thể tải nội dung lúc này do mất kết nối. Hãy kiểm tra mạng và thử lại.',
    };
  }
}

/**
 * Resolves a share directly from current browser location (?c=CODE, /s/CODE, or portable ?p=...).
 */
export async function resolveShareFromLocation(
  pathname: string,
  search: string,
  hash = ''
): Promise<ShareLookupResult | null> {
  const parsed = parseShareLocation(pathname, search, hash);
  if (parsed.type === 'none' || !parsed.value) {
    return null;
  }

  if (parsed.type === 'portable') {
    const decoded = decodePortablePayload(parsed.value);
    if (!decoded.ok) {
      if (decoded.reason === 'EXPIRED') {
        return {
          ok: false,
          errorCode: 'EXPIRED',
          expiredAt: decoded.expiredAt,
          message: 'Đường link chia sẻ này đã hết thời hạn hiệu lực.',
        };
      }
      return {
        ok: false,
        errorCode: 'INVALID_PAYLOAD',
        message: 'Đường link chia sẻ bị thiếu hoặc hỏng dữ liệu. Hãy nhờ người gửi tạo lại link mới.',
      };
    }
    return { ok: true, share: decoded.share, source: 'portable' };
  }

  return fetchShareByCode(parsed.value);
}

/**
 * Safe local recent-share history stored strictly on the current device.
 */
export function loadRecentShares(): RecentShareEntry[] {
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is RecentShareEntry =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as RecentShareEntry).code === 'string' &&
        typeof (item as RecentShareEntry).expiresAt === 'number'
    );
  } catch {
    return [];
  }
}

export function saveRecentShare(
  record: ShareRecord,
  role: 'created' | 'viewed'
): RecentShareEntry[] {
  const existing = loadRecentShares();
  const normalized = normalizeShareCode(record.code);
  const firstLine =
    record.content
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? '';

  const entry: RecentShareEntry = {
    code: normalized,
    title: record.title.trim(),
    preview: firstLine.slice(0, 96),
    mode: record.mode,
    expiresAt: record.expiresAt,
    savedAt: Date.now(),
    role,
    linkCount: extractUrls(record.content).length,
  };

  const next = [entry, ...existing.filter((item) => item.code !== normalized)].slice(
    0,
    MAX_RECENT_ITEMS
  );

  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota / sandbox restrictions
  }
  return next;
}

export function removeRecentShare(code: string): RecentShareEntry[] {
  const normalized = normalizeShareCode(code);
  const next = loadRecentShares().filter((item) => item.code !== normalized);
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage restrictions
  }
  return next;
}

export function clearRecentShares(): RecentShareEntry[] {
  try {
    window.localStorage.removeItem(RECENT_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions
  }
  return [];
}
