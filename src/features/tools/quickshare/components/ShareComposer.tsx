import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ClipboardPaste,
  CopyPlus,
  FileText,
  Lock,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { readTextFromClipboard } from '../core/browserActions';
import { formatShareCode } from '../core/shareCodec';
import { extractUrls } from '../core/urlExtractor';
import {
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  TTL_OPTIONS,
  type CreateShareInput,
  type ShareMode,
  type ShareTtlMinutes,
} from '../core/types';

export interface ComposerDraft {
  title: string;
  content: string;
  mode: ShareMode;
  ttlMinutes: ShareTtlMinutes;
  sourceCode?: string;
}

interface ShareComposerProps {
  draft: ComposerDraft;
  isSubmitting: boolean;
  errorMessage: string | null;
  onChange: (next: ComposerDraft) => void;
  onClearError: () => void;
  onSubmit: (input: CreateShareInput) => void;
  onCancelFork?: () => void;
}

const SAMPLE_NOTE_TITLE = 'Tài liệu thuyết trình nhóm 3';
const SAMPLE_NOTE_CONTENT = [
  'Danh sách link cần mở trên máy chiếu:',
  '',
  '1. Tài liệu tham khảo chuẩn web (MDN):',
  'https://developer.mozilla.org/vi/',
  '',
  '2. Hình minh họa Định lý Pytago:',
  'https://vi.wikipedia.org/wiki/Định_lý_Pytago',
  '',
  '3. Bài tập thực hành thêm:',
  'https://vi.khanacademy.org/',
  '',
  'Ghi chú: Nhớ mở sẵn trang 1 và trang 2 trước khi bắt đầu.',
].join('\n');

export function ShareComposer({
  draft,
  isSubmitting,
  errorMessage,
  onChange,
  onClearError,
  onSubmit,
  onCancelFork,
}: ShareComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const detectedUrls = useMemo(() => extractUrls(draft.content), [draft.content]);
  const charCount = draft.content.length;

  const handlePasteClipboard = async () => {
    setPasteNotice(null);
    const text = await readTextFromClipboard();
    if (text === null) {
      setPasteNotice('Trình duyệt chặn đọc khay nhớ tự động. Hãy bấm Ctrl+V (hoặc dán trực tiếp) vào ô nội dung.');
      textareaRef.current?.focus();
      return;
    }
    if (!text.trim()) {
      setPasteNotice('Khay nhớ tạm hiện đang trống.');
      return;
    }
    const merged = draft.content.trim().length > 0 ? `${draft.content}\n${text}` : text;
    onChange({ ...draft, content: merged.slice(0, MAX_CONTENT_LENGTH) });
    onClearError();
    textareaRef.current?.focus();
  };

  const handleInsertSample = () => {
    setPasteNotice(null);
    onChange({
      ...draft,
      title: draft.title.trim() ? draft.title : SAMPLE_NOTE_TITLE,
      content: SAMPLE_NOTE_CONTENT,
    });
    onClearError();
  };

  const handleClear = () => {
    setPasteNotice(null);
    onChange({
      ...draft,
      title: '',
      content: '',
      sourceCode: undefined,
    });
    onClearError();
    textareaRef.current?.focus();
  };

  const handleCreateClick = () => {
    setPasteNotice(null);
    if (!draft.content.trim()) {
      textareaRef.current?.focus();
    }
    onSubmit({
      title: draft.title.trim(),
      content: draft.content,
      mode: draft.mode,
      ttlMinutes: draft.ttlMinutes,
      sourceCode: draft.sourceCode,
    });
  };

  return (
    <section
      aria-labelledby="composer-heading"
      className="rounded-2xl border border-[#E1E6EF] bg-white p-5 sm:p-7"
    >
      <div className="mb-5">
        <h1
          id="composer-heading"
          className="text-2xl font-bold tracking-tight text-[#141923] sm:text-[26px]"
          style={{ textWrap: 'balance' }}
        >
          {draft.sourceCode ? 'Tạo bản sao chia sẻ mới' : 'Chia sẻ nhanh ghi chú và đường link'}
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-[#475467]">
          Dán văn bản hoặc danh sách link tài liệu để nhận mã ngắn 6 ký tự và mã QR mở ngay trên thiết bị khác.
        </p>
      </div>

      {draft.sourceCode && (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF4FF] px-4 py-3 text-sm text-[#1E3A8A]">
          <div className="flex items-start gap-2.5">
            <CopyPlus className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
            <p className="leading-relaxed">
              Bạn đang tạo một bản chia sẻ độc lập từ mã{' '}
              <span className="font-mono font-semibold tabular-nums">
                {formatShareCode(draft.sourceCode)}
              </span>
              . Nội dung gốc sẽ không bị chỉnh sửa đè.
            </p>
          </div>
          {onCancelFork && (
            <button
              type="button"
              onClick={onCancelFork}
              aria-label="Hủy tạo bản sao từ mã gốc"
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[#1E3A8A] transition-colors hover:bg-[#DBEAFE] cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Optional Title Field */}
      <div className="mb-4">
        <label
          htmlFor="share-title-input"
          className="mb-1.5 block text-sm font-medium text-[#141923]"
        >
          Tiêu đề ngắn <span className="font-normal text-[#556174]">(không bắt buộc)</span>
        </label>
        <input
          id="share-title-input"
          type="text"
          maxLength={MAX_TITLE_LENGTH}
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="Ví dụ: Link tài liệu môn Tin học, Ghi chú bài tập..."
          className="w-full min-h-[44px] rounded-xl border border-[#D4DBE7] bg-white px-3.5 py-2.5 text-[16px] text-[#141923] placeholder:text-[#748094] transition-colors focus:border-[#1D4ED8] focus:outline-2 focus:outline-offset-0 focus:outline-[#1D4ED8]/20"
        />
      </div>

      {/* Main Content Textarea */}
      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="share-content-input"
            className="text-sm font-medium text-[#141923]"
          >
            Nội dung cần gửi
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#475467] transition-colors hover:bg-[#EEF1F6] hover:text-[#141923] whitespace-nowrap cursor-pointer"
            >
              <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
              <span>Dán</span>
            </button>
            <button
              type="button"
              onClick={handleInsertSample}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#475467] transition-colors hover:bg-[#EEF1F6] hover:text-[#141923] whitespace-nowrap cursor-pointer"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Điền mẫu</span>
            </button>
            {draft.content.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#475467] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C] whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Xóa</span>
              </button>
            )}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          id="share-content-input"
          rows={9}
          maxLength={MAX_CONTENT_LENGTH}
          value={draft.content}
          onChange={(e) => {
            onChange({ ...draft, content: e.target.value });
            if (errorMessage) onClearError();
          }}
          placeholder="Nhập hoặc dán đoạn văn bản, ghi chú học tập, hoặc nhiều đường link (mỗi link một dòng)..."
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? 'composer-error' : 'composer-meta'}
          className={`w-full min-h-[220px] resize-y rounded-xl border bg-white px-4 py-3 text-[16px] leading-[1.6] text-[#141923] placeholder:text-[#748094] transition-colors focus:outline-2 focus:outline-offset-0 ${
            errorMessage
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:outline-[#DC2626]/20'
              : 'border-[#D4DBE7] focus:border-[#1D4ED8] focus:outline-[#1D4ED8]/20'
          }`}
        />

        {/* Quiet Unboxed Inline Metadata (Zero-Pill Rule) */}
        <div
          id="composer-meta"
          className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#556174]"
        >
          <div className="flex flex-wrap items-center gap-2 tabular-nums">
            <span>{charCount.toLocaleString('vi-VN')} ký tự</span>
            <span aria-hidden="true">·</span>
            <span>
              {detectedUrls.length > 0
                ? `${detectedUrls.length} đường link sẽ có nút mở nhanh`
                : 'Chưa có đường link nào'}
            </span>
          </div>
          <span className="tabular-nums">Tối đa {MAX_CONTENT_LENGTH.toLocaleString('vi-VN')}</span>
        </div>

        {pasteNotice && (
          <p className="mt-2 text-sm text-[#475467]" role="status">
            {pasteNotice}
          </p>
        )}

        {errorMessage && (
          <div
            id="composer-error"
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3 text-sm text-[#B91C1C]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Share Mode & Expiration Controls */}
      <div className="mt-6 grid grid-cols-1 gap-5 border-t border-[#E1E6EF] pt-5 sm:grid-cols-12">
        <div className="sm:col-span-8">
          <span id="share-mode-label" className="mb-2 block text-sm font-medium text-[#141923]">
            Quyền của người nhận
          </span>
          <div
            role="radiogroup"
            aria-labelledby="share-mode-label"
            className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#EEF1F6] p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={draft.mode === 'read-only'}
              onClick={() => onChange({ ...draft, mode: 'read-only' })}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                draft.mode === 'read-only'
                  ? 'bg-white text-[#141923] shadow-xs'
                  : 'text-[#475467] hover:text-[#141923]'
              }`}
            >
              <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Chỉ đọc</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={draft.mode === 'allow-copy'}
              onClick={() => onChange({ ...draft, mode: 'allow-copy' })}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                draft.mode === 'allow-copy'
                  ? 'bg-white text-[#141923] shadow-xs'
                  : 'text-[#475467] hover:text-[#141923]'
              }`}
            >
              <CopyPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Tạo bản sao mới</span>
            </button>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[#556174]">
            {draft.mode === 'read-only'
              ? 'Người xem chỉ đọc, sao chép, mở link hoặc tải file .txt.'
              : 'Người xem có thể nhân bản sang mã chia sẻ mới mà không ghi đè nội dung gốc.'}
          </p>
        </div>

        <div className="sm:col-span-4">
          <label
            htmlFor="share-ttl-select"
            className="mb-2 block text-sm font-medium text-[#141923]"
          >
            Thời hạn hiệu lực
          </label>
          <div className="relative">
            <select
              id="share-ttl-select"
              value={draft.ttlMinutes}
              onChange={(e) =>
                onChange({
                  ...draft,
                  ttlMinutes: Number(e.target.value) as ShareTtlMinutes,
                })
              }
              className="w-full min-h-[48px] appearance-none rounded-xl border border-[#D4DBE7] bg-white py-2.5 pr-10 pl-3.5 text-[15px] font-medium text-[#141923] transition-colors focus:border-[#1D4ED8] focus:outline-2 focus:outline-offset-0 focus:outline-[#1D4ED8]/20 cursor-pointer"
            >
              {TTL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-[#475467]"
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 text-[13px] text-[#556174]">Tự khóa khi hết hạn.</p>
        </div>
      </div>

      {/* Primary Action */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleCreateClick}
          disabled={isSubmitting}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#1E40AF] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] sm:w-auto whitespace-nowrap cursor-pointer"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span>{isSubmitting ? 'Đang tạo mã...' : 'Tạo mã và QR chia sẻ'}</span>
        </button>

        <p className="text-[13px] text-[#556174]">
          Mỗi lần tạo sẽ sinh một mã mới, không ghi đè mã cũ.
        </p>
      </div>
    </section>
  );
}
