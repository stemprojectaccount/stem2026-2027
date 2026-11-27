import { Check, Copy, Undo2 } from 'lucide-react';

interface HeaderProps {
  canUndo: boolean;
  undoCount: number;
  hasText: boolean;
  justCopied: boolean;
  onUndo: () => void;
  onCopy: () => void;
}

export function Header({
  canUndo,
  undoCount,
  hasText,
  justCopied,
  onUndo,
  onCopy,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg whitespace-nowrap shrink-0">
            Dọn văn bản
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 sm:px-3.5 whitespace-nowrap shrink-0"
            aria-label={
              canUndo ? `Hoàn tác bước trước (còn ${undoCount} bước)` : 'Hoàn tác (chưa có lịch sử)'
            }
          >
            <Undo2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Hoàn tác</span>
            {undoCount > 0 && (
              <span className="font-mono text-xs text-slate-500 tabular-nums">({undoCount})</span>
            )}
          </button>

          <button
            type="button"
            onClick={onCopy}
            disabled={!hasText}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-45 sm:px-4 whitespace-nowrap shrink-0"
          >
            {justCopied ? (
              <>
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="sm:hidden">Đã copy</span>
                <span className="hidden sm:inline">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="sm:hidden">Copy</span>
                <span className="hidden sm:inline">Copy kết quả</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
