import { useState } from 'react';
import { Check, Clock, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { copyTextToClipboard } from '../core/browserActions';
import { formatRemainingTime, formatShareCode } from '../core/shareCodec';
import type { RecentShareEntry } from '../core/types';

interface RecentSharesPanelProps {
  items: RecentShareEntry[];
  onOpenCode: (code: string) => void;
  onRemoveItem: (code: string) => void;
  onClearAll: () => void;
  onCreateNew: () => void;
}

export function RecentSharesPanel({
  items,
  onOpenCode,
  onRemoveItem,
  onClearAll,
  onCreateNew,
}: RecentSharesPanelProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    const formatted = formatShareCode(code);
    const ok = await copyTextToClipboard(formatted);
    if (ok) {
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 2000);
    }
  };

  if (items.length === 0) {
    return (
      <section
        aria-labelledby="recent-empty-heading"
        className="mx-auto max-w-2xl rounded-2xl border border-[#E1E6EF] bg-white p-8 text-center sm:p-10"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF1F6] text-[#475467]">
          <Clock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1
          id="recent-empty-heading"
          className="mt-4 text-xl font-bold text-[#141923]"
        >
          Chưa có lịch sử chia sẻ trên máy này
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#475467]">
          Các mã bạn vừa tạo hoặc vừa mở sẽ được lưu cục bộ tại trình duyệt này để bạn mở lại nhanh khi cần.
        </p>
        <button
          type="button"
          onClick={onCreateNew}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] cursor-pointer"
        >
          Tạo chia sẻ đầu tiên
        </button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="recent-heading"
      className="mx-auto max-w-4xl rounded-2xl border border-[#E1E6EF] bg-white p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <h1 id="recent-heading" className="text-2xl font-bold tracking-tight text-[#141923]">
            Chia sẻ gần đây
          </h1>
          <p className="mt-1 text-sm text-[#475467]">
            Lưu riêng trên trình duyệt hiện tại để bạn mở lại nhanh.
          </p>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#556174] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C] whitespace-nowrap cursor-pointer"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span>Xóa tất cả</span>
        </button>
      </div>

      <ul className="divide-y divide-[#E1E6EF] border-t border-[#E1E6EF]">
        {items.map((item) => {
          const formatted = formatShareCode(item.code);
          const remaining = formatRemainingTime(item.expiresAt);
          const isExpired = remaining === 'Đã hết hạn';
          const isCopied = copiedCode === item.code;

          return (
            <li
              key={item.code}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono font-bold tracking-wider text-[#141923] tabular-nums">
                    {formatted}
                  </span>
                  <span aria-hidden="true" className="text-[#94A3B8]">
                    ·
                  </span>
                  <span className="font-medium text-[#141923] truncate">
                    {item.title || 'Ghi chú không tiêu đề'}
                  </span>
                </div>

                {item.preview && (
                  <p className="mt-1 truncate text-sm text-[#475467]">{item.preview}</p>
                )}

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#556174]">
                  <span>{item.role === 'created' ? 'Bạn đã tạo' : 'Bạn đã mở'}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {item.mode === 'read-only' ? 'Chỉ đọc' : 'Cho phép tạo bản sao mới'}
                  </span>
                  {item.linkCount > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.linkCount} đường link</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className={isExpired ? 'font-medium text-[#B45309]' : 'tabular-nums'}>
                    {remaining}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyCode(item.code)}
                  aria-label={`Sao chép mã ${formatted}`}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#D4DBE7] bg-white px-3 py-2 text-sm font-medium text-[#475467] transition-colors hover:bg-[#F7F8FA] hover:text-[#141923] whitespace-nowrap cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                      <span className="text-[#15803D]">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      <span>Chép mã</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCode(item.code)}
                  aria-label={`Mở nội dung mã ${formatted}`}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#EFF4FF] px-3.5 py-2 text-sm font-semibold text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE] whitespace-nowrap cursor-pointer"
                >
                  <span>Mở</span>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.code)}
                  aria-label={`Xóa mã ${formatted} khỏi lịch sử`}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#556174] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C] cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
