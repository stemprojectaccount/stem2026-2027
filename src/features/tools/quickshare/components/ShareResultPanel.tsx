import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  CopyPlus,
  ExternalLink,
  KeyRound,
  Link2,
  Lock,
  Plus,
} from 'lucide-react';
import { copyTextToClipboard } from '../core/browserActions';
import {
  buildShareUrl,
  formatRemainingTime,
  formatShareCode,
  normalizeShareCode,
  parseShareLocation,
} from '../core/shareCodec';
import type { ShareRecord } from '../core/types';
import { QrCodeDisplay } from './QrCodeDisplay';

interface ShareResultPanelProps {
  share: ShareRecord | null;
  origin: string;
  onOpenViewer: (code: string) => void;
  onStartNew: () => void;
  onQuickLookup: (rawInput: string) => void;
}

export function ShareResultPanel({
  share,
  origin,
  onOpenViewer,
  onStartNew,
  onQuickLookup,
}: ShareResultPanelProps) {
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null);
  const [quickCode, setQuickCode] = useState('');

  const handleCopy = async (field: 'code' | 'link', text: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2200);
    }
  };

  const handleQuickSubmit = () => {
    const trimmed = quickCode.trim();
    if (!trimmed) return;

    // Support pasting either a 6-char code or a full QuickShare URL
    try {
      if (/^https?:\/\//i.test(trimmed)) {
        const parsedUrl = new URL(trimmed);
        const loc = parseShareLocation(parsedUrl.pathname, parsedUrl.search, parsedUrl.hash);
        if (loc.type === 'code' && loc.value) {
          onQuickLookup(loc.value);
          setQuickCode('');
          return;
        }
      }
    } catch {
      // Fall through as raw code
    }

    onQuickLookup(normalizeShareCode(trimmed));
    setQuickCode('');
  };

  if (!share) {
    return (
      <aside
        aria-label="Hướng dẫn nhanh và nhập mã"
        className="flex flex-col justify-between rounded-2xl border border-[#E1E6EF] bg-white p-5 sm:p-7"
      >
        <div>
          <h2 className="text-lg font-semibold text-[#141923]">
            Sẵn sàng gửi sang thiết bị khác
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#475467]">
            Sau khi bấm tạo mã, mã ngắn 6 ký tự và mã QR sẽ xuất hiện ngay tại đây để bạn mở trên điện thoại hoặc máy tính khác.
          </p>

          <ol className="mt-5 space-y-3.5 border-t border-[#E1E6EF] pt-5 text-sm text-[#141923]">
            <li className="flex items-start gap-3">
              <span className="font-mono text-xs font-semibold text-[#1D4ED8] tabular-nums pt-0.5">
                01.
              </span>
              <span className="leading-relaxed text-[#475467]">
                Dán ghi chú hoặc danh sách link tài liệu vào khung bên cạnh.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-mono text-xs font-semibold text-[#1D4ED8] tabular-nums pt-0.5">
                02.
              </span>
              <span className="leading-relaxed text-[#475467]">
                Chọn chế độ <strong className="font-medium text-[#141923]">Chỉ đọc</strong> hoặc{' '}
                <strong className="font-medium text-[#141923]">Tạo bản sao mới</strong> để tránh ghi đè bản gốc.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-mono text-xs font-semibold text-[#1D4ED8] tabular-nums pt-0.5">
                03.
              </span>
              <span className="leading-relaxed text-[#475467]">
                Quét mã QR hoặc nhập mã 6 ký tự để sao chép, mở nhanh từng link hay tải file{' '}
                <span className="font-mono text-xs text-[#141923]">.txt</span>.
              </span>
            </li>
          </ol>
        </div>

        {/* Quick receive box */}
        <div className="mt-7 border-t border-[#E1E6EF] pt-5">
          <label
            htmlFor="quick-receive-input"
            className="flex items-center gap-2 text-sm font-semibold text-[#141923]"
          >
            <KeyRound className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
            <span>Đã có mã từ máy khác?</span>
          </label>
          <p className="mt-1 text-[13px] text-[#556174]">
            Nhập 6 ký tự (ví dụ: <span className="font-mono font-medium text-[#141923]">HOC-202</span>) để mở ngay.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              id="quick-receive-input"
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickSubmit();
                }
              }}
              placeholder="VD: HOC-202"
              maxLength={80}
              className="min-w-0 flex-1 min-h-[44px] rounded-xl border border-[#D4DBE7] bg-white px-3.5 py-2 font-mono text-[15px] font-semibold tracking-wider text-[#141923] placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-[#748094] focus:border-[#1D4ED8] focus:outline-2 focus:outline-offset-0 focus:outline-[#1D4ED8]/20"
            />
            <button
              type="button"
              onClick={handleQuickSubmit}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#141923] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#273043] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Mở</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  const shareUrl = buildShareUrl(origin, share.code);
  const formattedCode = formatShareCode(share.code);
  const remainingLabel = formatRemainingTime(share.expiresAt);

  return (
    <aside
      aria-label="Mã chia sẻ vừa tạo"
      data-testid="share-result-panel"
      className="rounded-2xl border border-[#E1E6EF] bg-white p-5 sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D]">
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>Đã tạo mã chia sẻ</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#556174]">
            <span className="inline-flex items-center gap-1">
              {share.mode === 'read-only' ? (
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {share.mode === 'read-only' ? 'Chỉ đọc' : 'Cho phép tạo bản sao mới'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{remainingLabel}</span>
          </div>
        </div>
      </div>

      {/* Prominent 6-character Short Code */}
      <div className="mt-5 rounded-xl bg-[#F7F8FA] p-4">
        <span className="block text-xs font-medium text-[#556174]">
          Mã ngắn 6 ký tự
        </span>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <output
            data-testid="generated-share-code"
            className="font-mono text-3xl font-bold tracking-[0.06em] text-[#141923] tabular-nums whitespace-nowrap"
          >
            {formattedCode}
          </output>
          <button
            type="button"
            onClick={() => handleCopy('code', formattedCode)}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#D4DBE7] bg-white px-3.5 py-2 text-sm font-medium text-[#141923] transition-colors hover:border-[#1D4ED8] hover:text-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedField === 'code' ? (
              <>
                <Check className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                <span className="text-[#15803D]">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-[#475467]" aria-hidden="true" />
                <span>Sao chép mã</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* QR Code Display */}
      <div className="mt-5 flex flex-col items-center">
        <QrCodeDisplay url={shareUrl} code={share.code} size={188} />
        <p className="mt-2.5 text-center text-[13px] text-[#556174]">
          Mở camera điện thoại để quét và xem ngay nội dung.
        </p>
      </div>

      {/* Share Link Copy Row */}
      <div className="mt-5 border-t border-[#E1E6EF] pt-4">
        <label
          htmlFor="generated-share-link"
          className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#556174]"
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Đường link mở trực tiếp</span>
        </label>
        <div className="flex gap-2">
          <input
            id="generated-share-link"
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 min-h-[44px] rounded-lg border border-[#E1E6EF] bg-[#F7F8FA] px-3 py-2 font-mono text-xs text-[#141923] focus:border-[#1D4ED8] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleCopy('link', shareUrl)}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#D4DBE7] bg-white px-3.5 py-2 text-sm font-medium text-[#141923] transition-colors hover:border-[#1D4ED8] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedField === 'link' ? (
              <>
                <Check className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                <span className="text-[#15803D]">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-[#475467]" aria-hidden="true" />
                <span>Chép link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-[#E1E6EF] pt-4">
        <button
          type="button"
          onClick={() => onOpenViewer(share.code)}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#141923] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#273043] whitespace-nowrap cursor-pointer"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span>Mở trang xem</span>
        </button>
        <button
          type="button"
          onClick={onStartNew}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#D4DBE7] bg-white px-4 py-2.5 text-sm font-medium text-[#141923] transition-colors hover:bg-[#F7F8FA] whitespace-nowrap cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Tạo mới</span>
        </button>
      </div>
    </aside>
  );
}
