import { useRef, useState } from 'react';
import { Check, Copy, Download, RotateCcw, Upload } from 'lucide-react';
import {
  parseFormulasFromJson,
  serializeFormulasToJson,
  type FormulaEntry,
  type JsonImportMode,
} from '../core';

interface DataPortViewProps {
  entries: FormulaEntry[];
  onImportEntries: (incoming: FormulaEntry[], mode: JsonImportMode) => {
    addedCount: number;
    updatedCount: number;
  };
  onRestoreSeedData: () => void;
}

export function DataPortView({
  entries,
  onImportEntries,
  onRestoreSeedData,
}: DataPortViewProps) {
  const [exportScope, setExportScope] = useState<'all' | 'priority'>('all');
  const [copied, setCopied] = useState(false);

  const [rawJson, setRawJson] = useState('');
  const [importMode, setImportMode] = useState<JsonImportMode>('merge');
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const [confirmRestore, setConfirmRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const priorityEntries = entries.filter((item) => item.isPriority);
  const entriesToExport = exportScope === 'priority' ? priorityEntries : entries;

  const handleDownloadJson = () => {
    const jsonString = serializeFormulasToJson(entriesToExport);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download =
      exportScope === 'priority'
        ? `formulabank-uu-tien-${dateStamp}.json`
        : `formulabank-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    const jsonString = serializeFormulasToJson(entriesToExport);
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setRawJson(jsonString);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportWarnings([]);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setRawJson(content);
    };
    reader.onerror = () => {
      setImportError('Không thể đọc tệp đã chọn. Vui lòng thử lại.');
    };
    reader.readAsText(file, 'utf-8');
    event.target.value = '';
  };

  const handleRunImport = () => {
    setImportError(null);
    setImportWarnings([]);
    setImportSuccess(null);

    const parsed = parseFormulasFromJson(rawJson);
    if (!parsed.ok) {
      setImportError(parsed.error ?? 'Dữ liệu JSON không hợp lệ.');
      setImportWarnings(parsed.warnings);
      return;
    }

    const result = onImportEntries(parsed.entries, importMode);
    setImportWarnings(parsed.warnings);
    if (importMode === 'replace') {
      setImportSuccess(
        `Đã thay thế sổ tay bằng ${result.addedCount} công thức từ dữ liệu JSON.`
      );
    } else {
      setImportSuccess(
        `Đã gộp dữ liệu thành công: thêm mới ${result.addedCount} mục, cập nhật ${result.updatedCount} mục trùng mã.`
      );
    }
    setRawJson('');
  };

  return (
    <section aria-labelledby="dataport-heading" className="space-y-6">
      <div>
        <h1 id="dataport-heading" className="text-2xl font-bold tracking-tight text-ink">
          Nhập và xuất dữ liệu JSON
        </h1>
        <p className="mt-1.5 text-base text-ink-secondary">
          Sao lưu sổ tay công thức của bạn sang tệp JSON hoặc nhập danh sách công thức
          từ thiết bị khác để tiếp tục ôn tập.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        {/* Export panel */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Xuất danh sách JSON</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Định dạng JSON chuẩn giúp tái sử dụng dữ liệu trong các ứng dụng học tập
              khác.
            </p>
          </div>

          <fieldset className="space-y-2.5">
            <legend className="text-sm font-medium text-ink">Phạm vi xuất dữ liệu</legend>
            <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:bg-surface-subtle">
              <span className="flex items-center gap-2.5 font-medium text-ink">
                <input
                  type="radio"
                  name="export-scope"
                  value="all"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="h-4 w-4 text-accent"
                />
                <span>Toàn bộ sổ tay</span>
              </span>
              <span className="tabular-nums text-ink-muted">{entries.length} mục</span>
            </label>

            <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:bg-surface-subtle">
              <span className="flex items-center gap-2.5 font-medium text-ink">
                <input
                  type="radio"
                  name="export-scope"
                  value="priority"
                  checked={exportScope === 'priority'}
                  onChange={() => setExportScope('priority')}
                  className="h-4 w-4 text-accent"
                />
                <span>Chỉ mục ưu tiên ôn tập</span>
              </span>
              <span className="tabular-nums text-ink-muted">
                {priorityEntries.length} mục
              </span>
            </label>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={entriesToExport.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Tải tệp .json</span>
            </button>

            <button
              type="button"
              onClick={handleCopyJson}
              disabled={entriesToExport.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
                  <span className="text-success">Đã sao chép JSON</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Sao chép JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import panel */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Nhập danh sách JSON</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Chọn tệp .json từ máy hoặc dán trực tiếp nội dung JSON vào ô bên dưới.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="sr-only"
              id="json-file-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
            >
              <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Chọn tệp .json</span>
            </button>
          </div>

          <div>
            <label
              htmlFor="json-paste-textarea"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Nội dung JSON
            </label>
            <textarea
              id="json-paste-textarea"
              rows={6}
              value={rawJson}
              onChange={(e) => {
                setRawJson(e.target.value);
                setImportError(null);
              }}
              placeholder='Dán mảng công thức [...] hoặc đối tượng { "entries": [...] }'
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-ink-muted focus:border-accent"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">Cách nhập dữ liệu</legend>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="import-mode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="h-4 w-4 text-accent"
                />
                <span>Gộp vào sổ tay hiện có</span>
              </label>

              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="import-mode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="h-4 w-4 text-accent"
                />
                <span>Thay thế toàn bộ</span>
              </label>
            </div>
          </fieldset>

          {importError && (
            <div
              role="alert"
              className="rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
            >
              {importError}
            </div>
          )}

          {importWarnings.length > 0 && (
            <div
              role="status"
              className="rounded-lg border border-priority-border bg-priority-soft px-4 py-3 text-sm text-priority space-y-1"
            >
              <p className="font-medium">Lưu ý khi đọc dữ liệu:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {importWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {importSuccess && (
            <div
              role="status"
              className="rounded-lg border border-success/25 bg-success-soft px-4 py-3 text-sm font-medium text-success"
            >
              {importSuccess}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleRunImport}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <span>Nhập vào sổ tay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Restore sample data row */}
      <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Khôi phục bộ công thức mẫu THCS
          </h2>
          <p className="mt-0.5 text-sm text-ink-secondary">
            Đưa sổ tay về 12 công thức mẫu chuẩn Toán, Vật lý, Hóa học và Tiếng Anh.
          </p>
        </div>

        {!confirmRestore ? (
          <button
            type="button"
            onClick={() => setConfirmRestore(true)}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink whitespace-nowrap shrink-0 transition-colors hover:bg-surface-subtle sm:self-center"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Khôi phục dữ liệu mẫu</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmRestore(false)}
              className="min-h-10 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-surface-subtle"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                onRestoreSeedData();
                setConfirmRestore(false);
                setImportSuccess('Đã khôi phục 12 công thức mẫu THCS.');
              }}
              className="min-h-10 rounded-lg bg-danger px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Xác nhận khôi phục
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
