import { useState } from 'react';
import { Download, ExternalLink, FileText, Image as ImageIcon, Search, Trash2 } from 'lucide-react';
import { HistoryItem, WorkspaceTab } from '../types/document';
import {
  buildDocxFileName,
  filterHistoryItems,
  formatRelativeTimestamp,
} from '../utils/documentParser';
import {
  buildDocxFromBlocks,
  buildDocxFromImageTranslation,
  triggerDocxDownload,
} from '../utils/docxBuilder';

interface HistoryViewProps {
  items: HistoryItem[];
  onReopen: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (tab: WorkspaceTab) => void;
}

export function HistoryView({
  items,
  onReopen,
  onDelete,
  onClearAll,
  onNavigate,
}: HistoryViewProps) {
  const [filterKind, setFilterKind] = useState<'all' | 'pdf' | 'image'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmingClear, setConfirmingClear] = useState(false);

  const visibleItems = filterHistoryItems(items, filterKind, searchQuery);

  async function handleQuickDownload(item: HistoryItem) {
    if (item.kind === 'pdf') {
      const bytes = await buildDocxFromBlocks(item.data.title, item.data.blocks);
      const suffix = item.data.targetLanguage ? `dich-${item.data.targetLanguage}` : undefined;
      triggerDocxDownload(bytes, buildDocxFileName(item.data.sourceFileName, suffix));
    } else {
      const bytes = await buildDocxFromImageTranslation(item.data, true);
      triggerDocxDownload(
        bytes,
        buildDocxFileName(item.data.sourceLabel, `dich-${item.data.targetLanguage}`),
      );
    }
  }

  return (
    <section aria-labelledby="history-heading" className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 id="history-heading" className="text-2xl font-bold tracking-tight text-slate-900">
            Lịch sử xử lý gần đây
          </h1>
          <p className="text-sm text-slate-600">
            Các tệp PDF đã chuyển đổi và ảnh đã dịch được lưu cục bộ trên trình duyệt này để bạn mở lại hoặc tải Word bất cứ lúc nào.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {confirmingClear ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmingClear(false);
                  }}
                  className="inline-flex h-10 items-center rounded-lg bg-red-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-red-700 whitespace-nowrap"
                >
                  Xác nhận xóa tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  Hủy
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>Xóa toàn bộ lịch sử</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter & Search bar */}
      {items.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Lọc theo loại tác vụ"
            className="inline-flex items-center self-start rounded-lg bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => setFilterKind('all')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                filterKind === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterKind('pdf')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                filterKind === 'pdf'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PDF → Word
            </button>
            <button
              type="button"
              onClick={() => setFilterKind('image')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                filterKind === 'image'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dịch ảnh
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Tìm kiếm trong lịch sử"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên tệp hoặc nội dung..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
            />
          </div>
        </div>
      )}

      {/* Empty history state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <h2 className="text-base font-semibold text-slate-900">Chưa có tài liệu nào được lưu</h2>
          <p className="mt-1.5 max-w-md text-sm text-slate-600">
            Sau khi chuyển đổi file PDF sang Word hoặc dịch chữ từ ảnh chụp màn hình, kết quả sẽ xuất hiện tại đây để bạn mở lại nhanh chóng.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('pdf-to-word')}
              className="inline-flex h-10 items-center rounded-lg bg-blue-700 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
            >
              Chuyển PDF sang Word
            </button>
            <button
              type="button"
              onClick={() => onNavigate('image-translate')}
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              Dịch chữ từ ảnh
            </button>
          </div>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
          Không tìm thấy mục nào khớp với bộ lọc hiện tại.
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {visibleItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  {item.kind === 'pdf' ? (
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                    <span>{item.kind === 'pdf' ? 'PDF → Word' : 'Dịch ảnh'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.languageSummary}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{item.wordCount} từ</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatRelativeTimestamp(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => onReopen(item)}
                  aria-label={`Mở lại ${item.title}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mở lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleQuickDownload(item)}
                  aria-label={`Tải file Word cho ${item.title}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tải .docx</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Xóa ${item.title}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
