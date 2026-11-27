import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import type { TextStats } from '../lib/textProcessor';
import { StatsBar } from './StatsBar';

export interface StatusMessage {
  kind: 'success' | 'info' | 'error';
  text: string;
}

interface EditorPaneProps {
  value: string;
  stats: TextStats;
  status: StatusMessage | null;
  justCopied: boolean;
  isLoadingFile: boolean;
  onChange: (nextValue: string) => void;
  onLoadFile: (file: File) => void;
  onPasteClipboard: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  onCopy: () => void;
  onDownloadTxt: () => void;
  onDownloadCsv: () => void;
  onInspectLinks: () => void;
}

export function EditorPane({
  value,
  stats,
  status,
  justCopied,
  isLoadingFile,
  onChange,
  onLoadFile,
  onPasteClipboard,
  onLoadSample,
  onClear,
  onCopy,
  onDownloadTxt,
  onDownloadCsv,
  onInspectLinks,
}: EditorPaneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const hasText = value.length > 0;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onLoadFile(file);
    }
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onLoadFile(file);
    }
  };

  return (
    <section
      aria-label="Khung nhập và kết quả văn bản"
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      {/* Top input utility toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Chọn tệp Word .docx, .txt hoặc .md"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoadingFile}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {isLoadingFile ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-500 shrink-0" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
            )}
            <span>{isLoadingFile ? 'Đang đọc file...' : 'Tải Word / .txt'}</span>
          </button>

          <button
            type="button"
            onClick={onPasteClipboard}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0"
          >
            <ClipboardPaste className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
            <span>Dán nội dung</span>
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0"
          >
            <FileText className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
            <span>Nạp mẫu thử</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={!hasText}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Xóa trắng</span>
        </button>
      </div>

      {/* Instant statistics */}
      <StatsBar stats={stats} onInspectLinks={onInspectLinks} />

      {/* Spacious editable area with drag-and-drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-1 transition-colors ${
          isDragOver ? 'bg-blue-50/70' : 'bg-white'
        }`}
      >
        <label htmlFor="textcleaner-editor" className="sr-only">
          Nội dung văn bản cần xử lý
        </label>
        <textarea
          id="textcleaner-editor"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Soạn trực tiếp hoặc dán văn bản copy từ PDF, tài liệu vào đây — hoặc kéo thả tệp Word (.docx), .txt, .md vào khung này..."
          className="block min-h-[300px] w-full resize-y bg-transparent px-4 py-4 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none sm:px-5 lg:min-h-[540px]"
        />

        {isDragOver && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-lg border-2 border-dashed border-[#1D4ED8] bg-white/90 text-sm font-semibold text-[#1D4ED8]"
          >
            Thả tệp Word (.docx), .txt hoặc .md vào đây để nạp nội dung
          </div>
        )}
      </div>

      {/* Inline status confirmation + export bar */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role={status?.kind === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            data-testid="status-message"
            className="min-h-6 flex items-center gap-2 text-sm"
          >
            {status ? (
              <>
                {status.kind === 'error' ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#C2410C]" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803D]" aria-hidden="true" />
                )}
                <span
                  className={
                    status.kind === 'error' ? 'font-medium text-[#9A3412]' : 'text-slate-700'
                  }
                >
                  {status.text}
                </span>
              </>
            ) : (
              <span className="text-slate-500">
                Mọi thao tác xử lý chạy trực tiếp trên trình duyệt và có thể hoàn tác nhiều bước.
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDownloadTxt}
              disabled={!hasText}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>Tải .txt</span>
            </button>

            <button
              type="button"
              onClick={onDownloadCsv}
              disabled={!hasText}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>Tải .csv</span>
            </button>

            <button
              type="button"
              onClick={onCopy}
              disabled={!hasText}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-[#1D4ED8] transition-colors duration-150 hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              {justCopied ? (
                <>
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Đã copy</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Copy kết quả</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
