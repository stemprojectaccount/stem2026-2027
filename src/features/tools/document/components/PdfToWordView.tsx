import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
} from 'lucide-react';
import {
  DocumentBlock,
  PdfConversionResult,
  TargetLanguageCode,
} from '../types/document';
import {
  blocksToPlainText,
  buildDocxFileName,
  countWordsInBlocks,
  formatFileSize,
  getLanguageLabel,
  normalizeDocumentBlocks,
  validateInputFile,
} from '../utils/documentParser';
import { buildDocxFromBlocks, triggerDocxDownload } from '../utils/docxBuilder';
import { createSamplePdfConversionResult } from '../utils/sampleData';
import { LanguageSelect } from './LanguageSelect';

interface PdfToWordViewProps {
  result: PdfConversionResult | null;
  incomingPdf: { file: File; receivedAt: number } | null;
  onConsumeIncomingPdf: () => void;
  onResultChange: (next: PdfConversionResult | null, saveToHistory?: boolean) => void;
  onRouteImageFile: (file: File) => void;
}

export function PdfToWordView({
  result,
  incomingPdf,
  onConsumeIncomingPdf,
  onResultChange,
  onRouteImageFile,
}: PdfToWordViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguageCode>('vi');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFileName, setProcessingFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (!incomingPdf) return;
    const { file } = incomingPdf;
    onConsumeIncomingPdf();
    void processPdfFile(file, translateEnabled, targetLanguage);
  }, [incomingPdf]);

  async function processPdfFile(file: File, shouldTranslate: boolean, lang: TargetLanguageCode) {
    setErrorMessage(null);
    const check = validateInputFile(file, 'pdf');
    if (!check.valid) {
      setErrorMessage(check.error || 'Tệp không hợp lệ.');
      return;
    }

    if (check.kind === 'image') {
      onRouteImageFile(file);
      return;
    }

    setPendingFile(file);
    setProcessingFileName(file.name);
    setIsProcessing(true);
    setExportDone(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (shouldTranslate) {
        formData.append('targetLanguage', lang);
      }

      const response = await fetch('/api/tools/convert-pdf', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Chuyển đổi PDF thất bại. Vui lòng thử lại.');
      }

      const blocks = normalizeDocumentBlocks(payload.blocks);
      const conversion: PdfConversionResult = {
        title: payload.title || file.name.replace(/\.pdf$/i, ''),
        sourceFileName: file.name,
        fileSizeBytes: file.size,
        detectedLanguage: payload.detectedLanguage || 'Không xác định',
        targetLanguage: shouldTranslate ? lang : null,
        pageCountEstimate: Number(payload.pageCountEstimate) || 1,
        blocks,
        createdAt: new Date().toISOString(),
      };

      onResultChange(conversion, true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi chuyển đổi tệp PDF.',
      );
    } finally {
      setIsProcessing(false);
      setProcessingFileName('');
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void processPdfFile(file, translateEnabled, targetLanguage);
    }
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processPdfFile(file, translateEnabled, targetLanguage);
    }
  }

  function handleLoadSample() {
    setErrorMessage(null);
    setExportDone(false);
    const sample = createSamplePdfConversionResult();
    onResultChange(sample, true);
  }

  function handleUpdateBlockText(blockId: string, nextText: string) {
    if (!result) return;
    const nextBlocks: DocumentBlock[] = result.blocks.map((block) =>
      block.id === blockId && block.type !== 'table' ? { ...block, text: nextText } : block,
    );
    onResultChange({ ...result, blocks: nextBlocks }, false);
  }

  function handleUpdateTableCell(
    blockId: string,
    rowIndex: number,
    colIndex: number,
    nextValue: string,
  ) {
    if (!result) return;
    const nextBlocks: DocumentBlock[] = result.blocks.map((block) => {
      if (block.id !== blockId || block.type !== 'table') return block;
      const nextRows = block.rows.map((row, rIdx) =>
        rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? nextValue : cell)) : row,
      );
      return { ...block, rows: nextRows };
    });
    onResultChange({ ...result, blocks: nextBlocks }, false);
  }

  async function handleExportWord() {
    if (!result) return;
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const suffix = result.targetLanguage ? `dich-${result.targetLanguage}` : undefined;
      const fileName = buildDocxFileName(result.sourceFileName, suffix);
      const bytes = await buildDocxFromBlocks(result.title, result.blocks);
      triggerDocxDownload(bytes, fileName);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch {
      setErrorMessage('Không thể tạo tệp Word (.docx). Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleCopyPlainText() {
    if (!result) return;
    const plain = blocksToPlainText(result.blocks);
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage('Trình duyệt không cho phép sao chép tự động. Bạn có thể bôi đen văn bản để sao chép.');
    }
  }

  const wordCount = result ? countWordsInBlocks(result.blocks) : 0;

  return (
    <section aria-labelledby="pdf-heading" className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1
            id="pdf-heading"
            className="text-2xl font-bold tracking-tight text-slate-900"
            style={{ textWrap: 'balance' }}
          >
            Chuyển đổi PDF sang Word (.docx)
          </h1>
          <p className="text-sm text-slate-600">
            Trích xuất tiêu đề, đoạn văn, danh sách và bảng biểu từ file PDF (kể cả bản scan) để chỉnh sửa và tải về dạng Word.
          </p>
        </div>

        {result && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                onResultChange(null, false);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Chọn tệp khác</span>
            </button>
            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExporting}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : exportDone ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{exportDone ? 'Đã tải file Word' : 'Tải file Word (.docx)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Conversion options bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Chế độ chuyển đổi:</span>
          <div
            role="group"
            aria-label="Chế độ ngôn ngữ chuyển đổi PDF"
            className="inline-flex items-center rounded-lg bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => setTranslateEnabled(false)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                !translateEnabled
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Giữ ngôn ngữ gốc
            </button>
            <button
              type="button"
              onClick={() => setTranslateEnabled(true)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                translateEnabled
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chuyển kèm dịch
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {translateEnabled && (
            <LanguageSelect
              id="pdf-target-language"
              label="Dịch sang"
              value={targetLanguage}
              onChange={setTargetLanguage}
              disabled={isProcessing}
            />
          )}

          {pendingFile && result && !isProcessing && (
            <button
              type="button"
              onClick={() => void processPdfFile(pendingFile, translateEnabled, targetLanguage)}
              className="inline-flex h-10 items-center rounded-lg border border-blue-200 bg-blue-50 px-3.5 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap"
            >
              Áp dụng lại cho tệp này
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="pdf-file-input"
        type="file"
        aria-hidden="true"
        tabIndex={-1}
        accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Processing state */}
      {isProcessing && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" aria-hidden="true" />
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            Đang chuyển đổi tài liệu PDF sang cấu trúc Word...
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            {processingFileName}
            {translateEnabled ? ` · Dịch sang ${getLanguageLabel(targetLanguage)}` : ''}
          </p>
        </div>
      )}

      {/* Empty Upload Dropzone */}
      {!isProcessing && !result && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
            isDragging
              ? 'border-blue-600 bg-blue-50/70'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Kéo thả tệp PDF vào đây hoặc chọn từ máy tính
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-slate-600">
            Hỗ trợ PDF văn bản và PDF bản scan tối đa 20 MB. Nếu bạn kéo thả ảnh vào đây, ứng dụng sẽ tự động chuyển sang mục Dịch chữ từ ảnh.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Chọn tệp PDF</span>
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <span>Thử tài liệu mẫu</span>
            </button>
          </div>
        </div>
      )}

      {/* Editable Word Preview */}
      {!isProcessing && result && (
        <div className="rounded-xl border border-slate-200 bg-white">
          {/* Unboxed metadata header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{result.sourceFileName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{formatFileSize(result.fileSizeBytes)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{result.pageCountEstimate} trang</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{wordCount} từ</span>
              <span aria-hidden="true">·</span>
              <span>
                {result.targetLanguage
                  ? `${result.detectedLanguage} → ${getLanguageLabel(result.targetLanguage)}`
                  : result.detectedLanguage}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyPlainText}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{copied ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
            </button>
          </div>

          {/* Paper-like editable document canvas */}
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <p className="mb-5 text-xs text-slate-500">
              Bản xem trước có thể chỉnh sửa trực tiếp — nhấn vào bất kỳ đoạn văn hoặc ô bảng nào để sửa trước khi xuất file Word (.docx).
            </p>

            <div className="space-y-4">
              {result.blocks.map((block) => {
                if (block.type === 'table') {
                  return (
                    <div key={block.id} className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full border-collapse text-left text-sm">
                        <tbody>
                          {block.rows.map((row, rowIdx) => (
                            <tr
                              key={`${block.id}-r-${rowIdx}`}
                              className={
                                rowIdx === 0
                                  ? 'bg-slate-50 font-semibold text-slate-900'
                                  : 'border-t border-slate-200 text-slate-800'
                              }
                            >
                              {row.map((cell, colIdx) => (
                                <td
                                  key={`${block.id}-c-${rowIdx}-${colIdx}`}
                                  className="border-r border-slate-200 p-0 last:border-r-0"
                                >
                                  <input
                                    type="text"
                                    aria-label={`Ô bảng hàng ${rowIdx + 1} cột ${colIdx + 1}`}
                                    value={cell}
                                    onChange={(e) =>
                                      handleUpdateTableCell(
                                        block.id,
                                        rowIdx,
                                        colIdx,
                                        e.target.value,
                                      )
                                    }
                                    className={`w-full min-w-[120px] bg-transparent px-3 py-2 text-sm focus:bg-blue-50/50 focus:outline-none ${
                                      rowIdx === 0 ? 'font-semibold text-slate-900' : 'text-slate-800'
                                    }`}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (block.type === 'heading1') {
                  return (
                    <input
                      key={block.id}
                      type="text"
                      aria-label="Tiêu đề cấp 1"
                      value={block.text}
                      onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                      className="w-full rounded-md border border-transparent px-2 py-1 text-xl font-bold text-slate-900 transition-colors hover:border-slate-200 focus:border-blue-600 focus:bg-blue-50/30 focus:outline-none"
                    />
                  );
                }

                if (block.type === 'heading2' || block.type === 'heading3') {
                  return (
                    <input
                      key={block.id}
                      type="text"
                      aria-label={block.type === 'heading2' ? 'Tiêu đề cấp 2' : 'Tiêu đề cấp 3'}
                      value={block.text}
                      onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                      className={`w-full rounded-md border border-transparent px-2 py-1 font-semibold text-slate-900 transition-colors hover:border-slate-200 focus:border-blue-600 focus:bg-blue-50/30 focus:outline-none ${
                        block.type === 'heading2' ? 'text-lg' : 'text-base'
                      }`}
                    />
                  );
                }

                if (block.type === 'bullet') {
                  return (
                    <div key={block.id} className="flex items-start gap-2.5 pl-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
                      <textarea
                        aria-label="Mục danh sách"
                        rows={Math.max(1, Math.ceil(block.text.length / 85))}
                        value={block.text}
                        onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                        className="w-full resize-none rounded-md border border-transparent px-2 py-1 text-[15px] leading-relaxed text-slate-800 transition-colors hover:border-slate-200 focus:border-blue-600 focus:bg-blue-50/30 focus:outline-none"
                      />
                    </div>
                  );
                }

                return (
                  <textarea
                    key={block.id}
                    aria-label="Đoạn văn bản"
                    rows={Math.max(2, Math.ceil(block.text.length / 88))}
                    value={block.text}
                    onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                    className="w-full resize-none rounded-md border border-transparent px-2 py-1.5 text-[15px] leading-relaxed text-slate-800 transition-colors hover:bg-slate-50 focus:border-blue-600 focus:bg-blue-50/30 focus:outline-none"
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
