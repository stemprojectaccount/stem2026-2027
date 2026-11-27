import fs from 'fs';
import path from 'path';
import {
  generateShareCode,
  isValidShareCodeFormat,
  normalizeShareCode,
} from '../features/tools/quickshare/core/shareCodec';
import {
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  type CreateShareInput,
  type CreateShareResult,
  type ShareLookupResult,
  type ShareMode,
  type ShareRecord,
  type ShareTtlMinutes,
} from '../features/tools/quickshare/core/types';

const ALLOWED_TTLS: ReadonlySet<number> = new Set([15, 60, 1440, 10080]);
const ALLOWED_MODES: ReadonlySet<ShareMode> = new Set(['read-only', 'allow-copy']);

export interface ShareStoreOptions {
  persistPath?: string | null;
  now?: () => number;
  seedExamples?: boolean;
}

export class ShareStore {
  private readonly records = new Map<string, ShareRecord>();
  private readonly persistPath: string | null;
  private readonly now: () => number;

  constructor(options: ShareStoreOptions = {}) {
    this.persistPath = options.persistPath === undefined ? null : options.persistPath;
    this.now = options.now ?? (() => Date.now());

    this.loadFromDisk();

    if (options.seedExamples) {
      this.ensureSeedExamples();
    }
  }

  private loadFromDisk(): void {
    if (!this.persistPath) {
      return;
    }
    try {
      if (!fs.existsSync(this.persistPath)) {
        return;
      }
      const raw = fs.readFileSync(this.persistPath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            item &&
            typeof item === 'object' &&
            typeof (item as ShareRecord).code === 'string' &&
            typeof (item as ShareRecord).content === 'string'
          ) {
            const rec = item as ShareRecord;
            this.records.set(normalizeShareCode(rec.code), rec);
          }
        }
      }
    } catch {
      // Ignore corrupt persistence file and start clean
    }
  }

  private saveToDisk(): void {
    if (!this.persistPath) {
      return;
    }
    try {
      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.records.values());
      const tempPath = `${this.persistPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.persistPath);
    } catch {
      // Persistence failure should not crash active in-memory sharing
    }
  }

  private ensureSeedExamples(): void {
    const current = this.now();
    let changed = false;

    // Active sample record so users can immediately test opening a shared code
    if (!this.records.has('HOC202')) {
      this.records.set('HOC202', {
        code: 'HOC202',
        title: 'Danh sách tài liệu ôn tập tuần này',
        content: [
          'Ghi chú gửi nhanh sang máy tính lớp học:',
          '',
          '1. Ôn tập công thức & ví dụ trực quan:',
          'https://vi.wikipedia.org/wiki/Định_lý_Pytago',
          '',
          '2. Tra cứu tài liệu web chuẩn (MDN):',
          'https://developer.mozilla.org/vi/',
          '',
          '3. Luyện bài tập Khoa học tự nhiên:',
          'https://vi.khanacademy.org/',
          '',
          'Lưu ý: Mở từng đường link để kiểm tra trước buổi thuyết trình lúc 14:00.',
        ].join('\n'),
        mode: 'allow-copy',
        createdAt: current - 10 * 60 * 1000,
        expiresAt: current + 30 * 24 * 60 * 60 * 1000,
      });
      changed = true;
    }

    // Read-only sample record
    if (!this.records.has('DOC101')) {
      this.records.set('DOC101', {
        code: 'DOC101',
        title: 'Nội quy phòng máy — bản chỉ đọc',
        content: [
          '1. Lưu tệp bài làm vào đúng thư mục lớp trước khi tắt máy.',
          '2. Không cài thêm phần mềm ngoài danh sách cho phép.',
          '3. Kiểm tra lại hướng dẫn chi tiết tại https://www.w3.org/WAI/',
        ].join('\n'),
        mode: 'read-only',
        createdAt: current - 30 * 60 * 1000,
        expiresAt: current + 30 * 24 * 60 * 60 * 1000,
      });
      changed = true;
    }

    // Expired sample record so expired-code UX can be verified deterministically
    if (!this.records.has('HET404')) {
      this.records.set('HET404', {
        code: 'HET404',
        title: 'Ghi chú buổi học cũ',
        content: 'Nội dung này đã hết thời hạn chia sẻ.',
        mode: 'read-only',
        createdAt: current - 26 * 60 * 60 * 1000,
        expiresAt: current - 2 * 60 * 60 * 1000,
      });
      changed = true;
    }

    if (changed) {
      this.saveToDisk();
    }
  }

  public create(input: CreateShareInput): CreateShareResult {
    const rawContent = typeof input.content === 'string' ? input.content : '';
    if (rawContent.trim().length === 0) {
      return {
        ok: false,
        errorCode: 'EMPTY_CONTENT',
        message: 'Bạn chưa nhập nội dung cần chia sẻ. Hãy dán ghi chú hoặc đường link vào ô soạn thảo.',
      };
    }

    if (rawContent.length > MAX_CONTENT_LENGTH) {
      return {
        ok: false,
        errorCode: 'CONTENT_TOO_LONG',
        message: `Nội dung vượt quá giới hạn ${MAX_CONTENT_LENGTH.toLocaleString('vi-VN')} ký tự. Hãy rút gọn bớt trước khi tạo mã.`,
      };
    }

    const mode: ShareMode = ALLOWED_MODES.has(input.mode) ? input.mode : 'read-only';
    const ttlMinutes: ShareTtlMinutes = ALLOWED_TTLS.has(input.ttlMinutes)
      ? input.ttlMinutes
      : 1440;

    const rawTitle = typeof input.title === 'string' ? input.title.trim() : '';
    const title = rawTitle.slice(0, MAX_TITLE_LENGTH);

    const createdAt = this.now();
    const expiresAt = createdAt + ttlMinutes * 60 * 1000;

    let code = generateShareCode();
    let attempts = 0;
    while (this.records.has(code) && attempts < 20) {
      code = generateShareCode();
      attempts += 1;
    }

    const sourceCode =
      typeof input.sourceCode === 'string' && isValidShareCodeFormat(input.sourceCode)
        ? normalizeShareCode(input.sourceCode)
        : undefined;

    const record: ShareRecord = {
      code,
      title,
      content: rawContent,
      mode,
      createdAt,
      expiresAt,
      ...(sourceCode ? { sourceCode } : {}),
    };

    // forget shares expired more than a day ago (a day keeps the "đã hết hạn" message), so the file stays small
    for (const [k, r] of this.records) if (r.expiresAt < createdAt - 86_400_000) this.records.delete(k);
    this.records.set(code, record);
    this.saveToDisk();

    return { ok: true, share: record };
  }

  public getByCode(rawCode: string): ShareLookupResult {
    const normalized = normalizeShareCode(rawCode ?? '');
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

    const record = this.records.get(normalized);
    if (!record) {
      return {
        ok: false,
        errorCode: 'NOT_FOUND',
        code: normalized,
        message: 'Không tìm thấy nội dung tương ứng với mã này. Có thể mã bị nhập nhầm hoặc chưa được tạo.',
      };
    }

    if (record.expiresAt <= this.now()) {
      return {
        ok: false,
        errorCode: 'EXPIRED',
        code: normalized,
        expiredAt: record.expiresAt,
        message: 'Mã chia sẻ này đã hết thời hạn hiệu lực nên nội dung không còn mở được nữa.',
      };
    }

    return {
      ok: true,
      share: record,
      source: 'server',
    };
  }
}
