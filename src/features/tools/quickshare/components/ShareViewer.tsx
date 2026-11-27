import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  CopyPlus,
  Download,
  ExternalLink,
  FileWarning,
  Globe,
  Lock,
  QrCode,
} from 'lucide-react';
import { copyTextToClipboard, downloadTextFile } from '../core/browserActions';
import {
  buildShareUrl,
  buildTxtContent,
  buildTxtFilename,
  formatDateTimeVi,
  formatRemainingTime,
  formatShareCode,
} from '../core/shareCodec';
import { extractUrls, tokenizeTextWithUrls } from '../core/urlExtractor';
import type { ShareLookupResult, ShareRecord } from '../core/types';
import { QrCodeDisplay } from './QrCodeDisplay';

interface ShareViewerProps {
  loading: boolean;
  result: ShareLookupResult | null;
  origin: string;
  onBackToCompose: () => void;
  onGoToLookup: () => void;
  onForkCopy: (share: ShareRecord) => void;
}

export function ShareViewer({
  loading,
  result,
  origin,
  onBackToCompose,
  onGoToLookup,
  onForkCopy,
}: ShareViewerProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLinkHref, setCopiedLinkHref] = useState<string | null>(null);
  const [showQrPanel, setShowQrPanel] = useState(false);

  const share = result && result.ok ? result.share : null;

  const extractedUrls = useMemo(
    () => (share ? extractUrls(share.content) : []),
    [share]
  );

  const textSegments = useMemo(
    () => (share ? tokenizeTextWithUrls(share.content) : []),
    [share]
  );

  if (loading) {
    return (
      <section aria-busy="true" aria-label="Đang tải nội dung chia sẻ" className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-[#E1E6EF] bg-white p-6 sm:p-8">
          <div className="h-7 w-56 animate-pulse rounded-lg bg-[#EEF1F6]" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-[#EEF1F6]" />
          <div className="mt-6 flex gap-3">
            <div className="h-11 w-36 animate-pulse rounded-xl bg-[#EEF1F6]" />
            <div className="h-11 w-32 animate-pulse rounded-xl bg-[#EEF1F6]" />
          </div>
          <div className="mt-7 space-y-3 border-t border-[#E1E6EF] pt-6">
            <div className="h-4 w-full animate-pulse rounded bg-[#EEF1F6]" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-[#EEF1F6]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#EEF1F6]" />
          </div>
        </div>
      </section>
    );
  }

  if (!result || !result.ok) {
    const errorCode = result ? result.errorCode : 'NOT_FOUND';
    const isExpired = errorCode === 'EXPIRED';
    const isInvalid = errorCode === 'INVALID_CODE' || errorCode === 'INVALID_PAYLOAD';

    const title = isExpired
      ? 'Mã chia sẻ đã hết hạn'
      : isInvalid
        ? 'Mã chia sẻ chưa đúng định dạng'
        : errorCode === 'NETWORK_ERROR'
          ? 'Chưa thể tải nội dung'
          : 'Không tìm thấy mã chia sẻ';

    const description =
      result?.message ??
      'Không tìm thấy nội dung tương ứng với mã này. Hãy kiểm tra lại mã hoặc nhờ người gửi tạo mã mới.';

    return (
      <section aria-labelledby="viewer-error-title" className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-[#E1E6EF] bg-white p-6 text-center sm:p-10">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${
              isExpired
                ? 'bg-[#FFFBEB] text-[#B45309]'
                : 'bg-[#FEF2F2] text-[#B91C1C]'
            }`}
          >
            {isExpired ? (
              <Clock className="h-6 w-6" aria-hidden="true" />
            ) : isInvalid ? (
              <FileWarning className="h-6 w-6" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            )}
          </div>

          <h1
            id="viewer-error-title"
            className="mt-4 text-xl font-bold text-[#141923] sm:text-2xl"
          >
            {title}
          </h1>

          {result?.code && (
            <p className="mt-2 font-mono text-base font-semibold tracking-wider text-[#475467] tabular-nums">
              Mã đã nhập: {formatShareCode(result.code)}
            </p>
          )}

          <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-[#475467]">
            {description}
          </p>

          {isExpired && result?.expiredAt && (
            <p className="mt-2 text-sm text-[#556174] tabular-nums">
              Thời điểm hết hạn: {formatDateTimeVi(result.expiredAt)}
            </p>
          )}

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onGoToLookup}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] whitespace-nowrap cursor-pointer"
            >
              <span>Thử nhập mã khác</span>
            </button>
            <button
              type="button"
              onClick={onBackToCompose}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D4DBE7] bg-white px-5 py-2.5 text-sm font-medium text-[#141923] transition-colors hover:bg-[#F7F8FA] whitespace-nowrap cursor-pointer"
            >
              <span>Tạo chia sẻ mới</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const activeShare = result.share;

  const handleCopyAll = async () => {
    const ok = await copyTextToClipboard(activeShare.content);
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2200);
    }
  };

  const handleDownloadTxt = () => {
    const filename = buildTxtFilename(activeShare);
    const body = buildTxtContent(activeShare);
    downloadTextFile(filename, body);
  };

  const handleCopySingleLink = async (href: string) => {
    const ok = await copyTextToClipboard(href);
    if (ok) {
      setCopiedLinkHref(href);
      setTimeout(() => {
        setCopiedLinkHref((prev) => (prev === href ? null : prev));
      }, 2000);
    }
  };

  const formattedCode = formatShareCode(activeShare.code);
  const shareUrl = buildShareUrl(origin, activeShare.code);

  return (
    <article
      aria-labelledby="viewer-heading"
      data-testid="share-viewer"
      className="mx-auto max-w-4xl space-y-6"
    >
      {/* Top breadcrumb / back row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToCompose}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#475467] transition-colors hover:bg-[#EEF1F6] hover:text-[#141923] whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Quay lại trang tạo mã</span>
        </button>

        <button
          type="button"
          onClick={onGoToLookup}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#475467] transition-colors hover:bg-[#EEF1F6] hover:text-[#141923] whitespace-nowrap cursor-pointer"
        >
          <span>Mở mã khác</span>
        </button>
      </div>

      {/* Main Reader Surface */}
      <div className="rounded-2xl border border-[#E1E6EF] bg-white p-5 sm:p-8">
        <header>
          <h1
            id="viewer-heading"
            className="text-2xl font-bold tracking-tight text-[#141923] sm:text-[28px]"
            style={{ textWrap: 'balance' }}
          >
            {activeShare.title.trim() ? activeShare.title : 'Nội dung được chia sẻ'}
          </h1>

          {/* Clean unboxed metadata row */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#556174]">
            <span>
              Mã{' '}
              <span className="font-mono font-semibold text-[#141923] tabular-nums">
                {formattedCode}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#141923]">
              {activeShare.mode === 'read-only' ? (
                <Lock className="h-3.5 w-3.5 text-[#475467]" aria-hidden="true" />
              ) : (
                <CopyPlus className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
              )}
              <span>
                {activeShare.mode === 'read-only' ? 'Chỉ đọc' : 'Cho phép tạo bản sao mới'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock className="h-3.5 w-3.5 text-[#556174]" aria-hidden="true" />
              <span>{formatRemainingTime(activeShare.expiresAt)}</span>
            </span>
            {activeShare.sourceCode && (
              <span className="tabular-nums">
                Bản sao từ{' '}
                <span className="font-mono font-medium text-[#141923]">
                  {formatShareCode(activeShare.sourceCode)}
                </span>
              </span>
            )}
          </div>
        </header>

        {/* Action Toolbar */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-y border-[#E1E6EF] py-4">
          <button
            type="button"
            onClick={handleCopyAll}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] whitespace-nowrap cursor-pointer ${
              copiedAll
                ? 'bg-[#15803D] hover:bg-[#166534]'
                : 'bg-[#1D4ED8] hover:bg-[#1E40AF]'
            }`}
          >
            {copiedAll ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Đã sao chép toàn bộ</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                <span>Copy toàn bộ</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D4DBE7] bg-white px-4 py-2.5 text-sm font-medium text-[#141923] transition-colors hover:bg-[#F7F8FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] whitespace-nowrap cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#475467]" aria-hidden="true" />
            <span>Tải file .txt</span>
          </button>

          {activeShare.mode === 'allow-copy' && (
            <button
              type="button"
              onClick={() => onForkCopy(activeShare)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF4FF] px-4 py-2.5 text-sm font-medium text-[#1E3A8A] transition-colors hover:bg-[#DBEAFE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] whitespace-nowrap cursor-pointer"
            >
              <CopyPlus className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
              <span>Tạo bản sao mới</span>
            </button>
          )}

          {result.source === 'server' && (
            <button
              type="button"
              aria-expanded={showQrPanel}
              onClick={() => setShowQrPanel((prev) => !prev)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D4DBE7] bg-white px-3.5 py-2.5 text-sm font-medium text-[#475467] transition-colors hover:bg-[#F7F8FA] hover:text-[#141923] whitespace-nowrap cursor-pointer sm:ml-auto"
            >
              <QrCode className="h-4 w-4" aria-hidden="true" />
              <span>{showQrPanel ? 'Ẩn mã QR' : 'Hiện mã QR'}</span>
            </button>
          )}
        </div>

        {/* Optional QR handoff disclosure */}
        {showQrPanel && result.source === 'server' && (
          <div className="mt-5 flex flex-col items-center justify-between gap-5 rounded-xl bg-[#F7F8FA] p-5 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-[#141923]">
                Chuyển tiếp sang một thiết bị khác
              </p>
              <p className="mt-1 text-sm text-[#475467]">
                Quét mã QR bên cạnh hoặc nhập mã{' '}
                <span className="font-mono font-semibold text-[#141923] tabular-nums">
                  {formattedCode}
                </span>{' '}
                trên thiết bị mới.
              </p>
            </div>
            <QrCodeDisplay url={shareUrl} code={activeShare.code} size={156} />
          </div>
        )}

        {/* Read-only quiet explanation */}
        {activeShare.mode === 'read-only' && (
          <p className="mt-4 text-sm text-[#556174]">
            Nội dung này đang ở chế độ chỉ đọc để giữ nguyên văn bản gốc. Bạn có thể sao chép toàn bộ, mở nhanh link hoặc tải về dạng file .txt.
          </p>
        )}

        {/* Clean Readable Text Body */}
        <div
          data-testid="shared-content-body"
          className="mt-6 whitespace-pre-wrap break-words text-[16px] leading-[1.75] text-[#141923]"
        >
          {textSegments.map((seg, index) => {
            if (seg.type === 'url' && seg.href) {
              return (
                <a
                  key={`${seg.href}-${index}`}
                  href={seg.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#1D4ED8] underline decoration-[#93C5FD] underline-offset-3 transition-colors hover:text-[#1E40AF] hover:decoration-[#1D4ED8] break-all"
                >
                  {seg.value}
                </a>
              );
            }
            return <span key={index}>{seg.value}</span>;
          })}
        </div>
      </div>

      {/* Extracted Quick-Open Links Section */}
      {extractedUrls.length > 0 && (
        <section
          aria-labelledby="extracted-links-heading"
          data-testid="extracted-links-section"
          className="rounded-2xl border border-[#E1E6EF] bg-white p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4">
            <h2
              id="extracted-links-heading"
              className="text-lg font-semibold text-[#141923]"
            >
              Mở nhanh từng đường link
            </h2>
            <span className="text-sm text-[#556174] tabular-nums">
              {extractedUrls.length} đường link trong nội dung
            </span>
          </div>

          <ul className="divide-y divide-[#E1E6EF] border-t border-[#E1E6EF]">
            {extractedUrls.map((item, idx) => {
              const isCopied = copiedLinkHref === item.href;
              return (
                <li
                  key={item.href}
                  className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F8FA] text-[#475467]">
                      <Globe className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-[#141923]">
                        {item.host}
                      </p>
                      <p className="truncate font-mono text-xs text-[#556174]">
                        {item.displayUrl}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopySingleLink(item.href)}
                      aria-label={`Sao chép link ${idx + 1}: ${item.host}`}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#D4DBE7] bg-white px-3.5 py-2 text-sm font-medium text-[#475467] transition-colors hover:bg-[#F7F8FA] hover:text-[#141923] whitespace-nowrap cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                          <span className="text-[#15803D]">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" aria-hidden="true" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>

                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Mở link ${idx + 1}: ${item.host}`}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#EFF4FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] whitespace-nowrap"
                    >
                      <span>Mở link</span>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
