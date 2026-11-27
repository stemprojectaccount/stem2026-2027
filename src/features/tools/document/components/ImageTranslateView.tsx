import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  Copy,
  Crop,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { ImageTranslationResult, TargetLanguageCode } from '../types/document';
import {
  buildDocxFileName,
  countWordsInText,
  getLanguageLabel,
  normalizeBilingualSegments,
  validateInputFile,
} from '../utils/documentParser';
import { buildDocxFromImageTranslation, triggerDocxDownload } from '../utils/docxBuilder';
import {
  CropRect,
  cropDataUrlToRegion,
  isFullImageCrop,
} from '../utils/imageCrop';
import {
  createSampleImageTranslationResult,
  createSampleScreenshotDataUrl,
} from '../utils/sampleData';
import { ImageCropPanel } from './ImageCropPanel';
import { LanguageSelect } from './LanguageSelect';

type OutputTab = 'translated' | 'bilingual' | 'original';

interface ImageTranslateViewProps {
  result: ImageTranslationResult | null;
  incomingImage: {
    file: File;
    sourceMethod: 'paste' | 'file';
    receivedAt: number;
  } | null;
  onConsumeIncomingImage: () => void;
  onResultChange: (next: ImageTranslationResult | null, saveToHistory?: boolean) => void;
  onRoutePdfFile: (file: File) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Không thể đọc dữ liệu ảnh.'));
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc dữ liệu ảnh.'));
    reader.readAsDataURL(file);
  });
}

export function ImageTranslateView({
  result,
  incomingImage,
  onConsumeIncomingImage,
  onResultChange,
  onRoutePdfFile,
}: ImageTranslateViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguageCode>('vi');
  const [autoTranslateOnPaste, setAutoTranslateOnPaste] = useState(true);
  const [outputTab, setOutputTab] = useState<OutputTab>('translated');
  const [originalImageDataUrl, setOriginalImageDataUrl] = useState<string | null>(
    result?.imageDataUrl || null,
  );
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(
    result?.imageDataUrl || null,
  );
  const [previewLabel, setPreviewLabel] = useState<string>(result?.sourceLabel || '');
  const [previewMethod, setPreviewMethod] = useState<'paste' | 'file' | 'sample'>(
    result?.sourceMethod || 'file',
  );
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [cropDimensions, setCropDimensions] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  // Sync preview when user reopens an item from history
  useEffect(() => {
    if (result) {
      setOriginalImageDataUrl((prev) =>
        result.imageDataUrl && prev && previewDataUrl === result.imageDataUrl
          ? prev
          : result.imageDataUrl || null,
      );
      setPreviewDataUrl(result.imageDataUrl || null);
      setPreviewLabel(result.sourceLabel);
      setPreviewMethod(result.sourceMethod);
      setTargetLanguage(result.targetLanguage);
    }
  }, [result?.createdAt]);

  // Handle global Ctrl+V paste or routed image file from App
  useEffect(() => {
    if (!incomingImage) return;
    const { file, sourceMethod } = incomingImage;
    onConsumeIncomingImage();
    void handleImageFile(file, sourceMethod);
  }, [incomingImage]);

  async function translateDataUrl(
    dataUrl: string,
    label: string,
    sourceMethod: 'paste' | 'file' | 'sample',
    lang: TargetLanguageCode,
  ) {
    setErrorMessage(null);
    setPasteHint(null);
    setIsProcessing(true);
    setExportDone(false);

    try {
      const response = await fetch('/api/tools/translate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl: dataUrl,
          targetLanguage: lang,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Không thể nhận diện và dịch chữ từ hình ảnh.');
      }

      const originalText = typeof payload.originalText === 'string' ? payload.originalText : '';
      const translatedText =
        typeof payload.translatedText === 'string' ? payload.translatedText : '';
      const segments = normalizeBilingualSegments(payload.segments, originalText, translatedText);

      const nextResult: ImageTranslationResult = {
        sourceLabel: label,
        sourceMethod,
        detectedLanguage: payload.detectedLanguage || 'Không xác định',
        targetLanguage: lang,
        originalText,
        translatedText,
        segments,
        imageDataUrl: dataUrl,
        createdAt: new Date().toISOString(),
      };

      onResultChange(nextResult, true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi dịch chữ trong ảnh.',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleImageFile(file: File, sourceMethod: 'paste' | 'file') {
    setErrorMessage(null);
    setPasteHint(null);

    const check = validateInputFile(file, 'image');
    if (!check.valid) {
      setErrorMessage(check.error || 'Tệp ảnh không hợp lệ.');
      return;
    }

    if (check.kind === 'pdf') {
      onRoutePdfFile(file);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const label =
        sourceMethod === 'paste'
          ? `Ảnh dán Ctrl+V (${new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })})`
          : file.name;

      setOriginalImageDataUrl(dataUrl);
      setPreviewDataUrl(dataUrl);
      setPreviewLabel(label);
      setPreviewMethod(sourceMethod);
      setCropRect(null);
      setCropDimensions(null);
      setIsCropping(false);

      if (autoTranslateOnPaste || sourceMethod === 'file') {
        await translateDataUrl(dataUrl, label, sourceMethod, targetLanguage);
      } else {
        onResultChange(null, false);
      }
    } catch {
      setErrorMessage('Không thể đọc hình ảnh vừa chọn. Vui lòng thử lại.');
    }
  }

  async function handlePasteButtonClick() {
    setErrorMessage(null);
    setPasteHint(null);

    if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
      setPasteHint(
        'Trình duyệt hiện tại không hỗ trợ đọc ảnh bằng nút bấm. Hãy nhấn trực tiếp phím Ctrl + V (hoặc Cmd + V) trên bàn phím để dán ảnh chụp màn hình.',
      );
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const pastedFile = new File([blob], `anh-chup-man-hinh.${ext}`, { type: imageType });
          await handleImageFile(pastedFile, 'paste');
          return;
        }
      }
      setPasteHint(
        'Bộ nhớ tạm hiện chưa có hình ảnh. Hãy chụp màn hình (Win + Shift + S hoặc Cmd + Shift + 4) rồi nhấn Ctrl + V.',
      );
    } catch {
      setPasteHint(
        'Không thể truy cập bộ nhớ tạm từ nút bấm. Hãy nhấn trực tiếp phím Ctrl + V (hoặc Cmd + V) ngay trên trang này để dán ảnh.',
      );
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void handleImageFile(file, 'file');
    }
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleImageFile(file, 'file');
    }
  }

  function handleLoadSampleImage() {
    setErrorMessage(null);
    setPasteHint(null);
    const sampleUrl = createSampleScreenshotDataUrl();
    const sampleResult = createSampleImageTranslationResult(sampleUrl);
    setOriginalImageDataUrl(sampleUrl);
    setPreviewDataUrl(sampleUrl);
    setPreviewLabel(sampleResult.sourceLabel);
    setPreviewMethod('sample');
    setCropRect(null);
    setCropDimensions(null);
    setIsCropping(false);
    setTargetLanguage('vi');
    onResultChange(sampleResult, true);
  }

  async function handleApplyCrop(nextRect: CropRect, translateImmediately: boolean) {
    const sourceUrl = originalImageDataUrl || previewDataUrl;
    if (!sourceUrl) return;
    setErrorMessage(null);

    if (isFullImageCrop(nextRect)) {
      setPreviewDataUrl(sourceUrl);
      setCropRect(null);
      setCropDimensions(null);
      setIsCropping(false);
      if (translateImmediately) {
        await translateDataUrl(
          sourceUrl,
          previewLabel || 'Ảnh đã tải lên',
          previewMethod,
          targetLanguage,
        );
      }
      return;
    }

    try {
      const cropped = await cropDataUrlToRegion(sourceUrl, nextRect);
      setPreviewDataUrl(cropped.dataUrl);
      setCropRect(nextRect);
      setCropDimensions({ width: cropped.width, height: cropped.height });
      setIsCropping(false);

      if (translateImmediately) {
        const baseLabel = (previewLabel || 'Ảnh đã tải lên').replace(/\s*\(đã cắt\)$/i, '');
        await translateDataUrl(
          cropped.dataUrl,
          `${baseLabel} (đã cắt)`,
          previewMethod,
          targetLanguage,
        );
      } else {
        onResultChange(null, false);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể cắt vùng ảnh đã chọn. Vui lòng thử lại.',
      );
    }
  }

  function handleRestoreOriginalImage() {
    if (!originalImageDataUrl) return;
    setPreviewDataUrl(originalImageDataUrl);
    setCropRect(null);
    setCropDimensions(null);
    setIsCropping(false);
  }

  async function handleCopyOutput() {
    if (!result) return;
    const textToCopy =
      outputTab === 'original'
        ? result.originalText
        : outputTab === 'bilingual'
          ? result.segments.map((s) => `${s.original}\n→ ${s.translated}`).join('\n\n')
          : result.translatedText;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage('Không thể sao chép tự động. Vui lòng bôi đen văn bản để sao chép.');
    }
  }

  async function handleExportDocx() {
    if (!result) return;
    setErrorMessage(null);
    try {
      const includeBilingual = outputTab === 'bilingual';
      const bytes = await buildDocxFromImageTranslation(result, includeBilingual);
      const fileName = buildDocxFileName(
        result.sourceLabel,
        includeBilingual ? `song-ngu-${result.targetLanguage}` : `dich-${result.targetLanguage}`,
      );
      triggerDocxDownload(bytes, fileName);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch {
      setErrorMessage('Không thể xuất tệp Word (.docx). Vui lòng thử lại.');
    }
  }

  function handleClear() {
    setOriginalImageDataUrl(null);
    setPreviewDataUrl(null);
    setPreviewLabel('');
    setCropRect(null);
    setCropDimensions(null);
    setIsCropping(false);
    setErrorMessage(null);
    setPasteHint(null);
    onResultChange(null, false);
  }

  const hasImageOrResult = Boolean(previewDataUrl || result);
  const translatedWordCount = result ? countWordsInText(result.translatedText) : 0;

  return (
    <section aria-labelledby="image-heading" className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1
            id="image-heading"
            className="text-2xl font-bold tracking-tight text-slate-900"
            style={{ textWrap: 'balance' }}
          >
            Dịch chữ trong hình ảnh và ảnh chụp màn hình
          </h1>
          <p className="text-sm text-slate-600">
            Chọn tệp ảnh từ máy hoặc nhấn{' '}
            <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs font-medium text-slate-800">
              Ctrl + V
            </kbd>{' '}
            để dán trực tiếp ảnh chụp màn hình và dịch ngay sang ngôn ngữ mong muốn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <LanguageSelect
            id="image-target-language"
            label="Dịch sang"
            value={targetLanguage}
            onChange={(nextLang) => {
              setTargetLanguage(nextLang);
            }}
            disabled={isProcessing}
          />
          {previewDataUrl && !isProcessing && (
            <button
              type="button"
              onClick={() =>
                void translateDataUrl(
                  previewDataUrl,
                  previewLabel || 'Ảnh đã tải lên',
                  previewMethod,
                  targetLanguage,
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>{result ? 'Dịch lại' : 'Dịch chữ ngay'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-translate setting + quick actions strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <label className="inline-flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={autoTranslateOnPaste}
            onChange={(e) => setAutoTranslateOnPaste(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
          />
          <span>Tự động dịch ngay khi dán ảnh chụp màn hình (Ctrl + V)</span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Chọn file ảnh</span>
          </button>
          <button
            type="button"
            onClick={handlePasteButtonClick}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Dán từ bộ nhớ tạm</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        id="image-file-input"
        type="file"
        aria-hidden="true"
        tabIndex={-1}
        accept="image/png,image/jpeg,image/webp,image/gif,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      )}

      {pasteHint && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
        >
          <ClipboardPaste className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
          <p>{pasteHint}</p>
        </div>
      )}

      {/* Empty state: Unified File Picker + Ctrl+V Paste Canvas */}
      {!hasImageOrResult && !isProcessing && (
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
            <ImageIcon className="h-6 w-6" aria-hidden="true" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Dán ảnh chụp màn hình bằng Ctrl + V hoặc chọn tệp ảnh
          </h2>
          <p className="mt-1.5 max-w-lg text-sm text-slate-600">
            Chụp màn hình bất kỳ tài liệu, trang web, thông báo hoặc ảnh chụp sách rồi nhấn{' '}
            <span className="font-mono font-medium text-slate-800">Ctrl + V</span> ngay tại đây. Hỗ trợ PNG, JPG, WebP tối đa 20 MB.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Chọn tệp ảnh</span>
            </button>
            <button
              type="button"
              onClick={handlePasteButtonClick}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
              <span>Dán ảnh (Ctrl + V)</span>
            </button>
            <button
              type="button"
              onClick={handleLoadSampleImage}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap"
            >
              <span>Thử ảnh chụp mẫu</span>
            </button>
          </div>
        </div>
      )}

      {/* Side-by-side Split Workspace: Original Image (left) + OCR & Translation (right) */}
      {hasImageOrResult && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left: Source Image Preview & Interactive Cropper */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white lg:sticky lg:top-20 lg:col-span-5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-900">
                  {previewLabel || 'Ảnh gốc'}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {previewMethod === 'paste'
                    ? 'Nguồn: Dán bằng Ctrl + V'
                    : previewMethod === 'sample'
                      ? 'Nguồn: Ảnh mẫu minh họa'
                      : 'Nguồn: Tệp ảnh tải lên'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {originalImageDataUrl && !isCropping && (
                  <button
                    type="button"
                    onClick={() => setIsCropping(true)}
                    disabled={isProcessing}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Crop className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{cropRect ? 'Cắt lại' : 'Cắt vùng ảnh'}</span>
                  </button>
                )}

                {cropRect && !isCropping && originalImageDataUrl && (
                  <button
                    type="button"
                    onClick={handleRestoreOriginalImage}
                    disabled={isProcessing}
                    aria-label="Khôi phục ảnh gốc"
                    title="Khôi phục ảnh gốc"
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Ảnh gốc</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Xóa ảnh hiện tại"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {isCropping && originalImageDataUrl ? (
              <ImageCropPanel
                imageDataUrl={originalImageDataUrl}
                initialRect={cropRect || undefined}
                onApplyCrop={(nextRect, translateNow) => void handleApplyCrop(nextRect, translateNow)}
                onCancel={() => setIsCropping(false)}
                disabled={isProcessing}
              />
            ) : (
              <div className="flex flex-col items-center justify-start bg-slate-50/80 p-4">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt={previewLabel || 'Ảnh gốc cần dịch chữ'}
                    referrerPolicy="no-referrer"
                    className="max-h-[480px] w-full rounded-lg border border-slate-200 bg-white object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                    <ImageIcon className="h-8 w-8 text-slate-400" aria-hidden="true" />
                    <p className="mt-2 text-xs">Ảnh xem trước không lưu trong bộ nhớ lịch sử</p>
                  </div>
                )}

                {cropDimensions && (
                  <p className="mt-2.5 w-full text-xs text-slate-600">
                    Đang dùng vùng cắt{' '}
                    <span className="font-mono font-medium tabular-nums text-blue-700">
                      {cropDimensions.width} × {cropDimensions.height} px
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: OCR & Translated Result */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div
                role="tablist"
                aria-label="Chế độ xem kết quả dịch"
                className="inline-flex items-center rounded-lg bg-slate-100 p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={outputTab === 'translated'}
                  onClick={() => setOutputTab('translated')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                    outputTab === 'translated'
                      ? 'bg-white text-slate-900 ring-1 ring-slate-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bản dịch
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={outputTab === 'bilingual'}
                  onClick={() => setOutputTab('bilingual')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                    outputTab === 'bilingual'
                      ? 'bg-white text-slate-900 ring-1 ring-slate-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Song ngữ
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={outputTab === 'original'}
                  onClick={() => setOutputTab('original')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                    outputTab === 'original'
                      ? 'bg-white text-slate-900 ring-1 ring-slate-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Văn bản gốc (OCR)
                </button>
              </div>

              {result && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    {result.detectedLanguage} → {getLanguageLabel(result.targetLanguage)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{translatedWordCount} từ</span>
                </div>
              )}
            </div>

            <div className="flex-1 p-5">
              {isProcessing ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex h-full min-h-[300px] flex-col items-center justify-center text-center"
                >
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Đang nhận diện chữ và dịch sang {getLanguageLabel(targetLanguage)}...
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Đang đọc từng khối văn bản trong hình ảnh theo đúng thứ tự.
                  </p>
                </div>
              ) : !result ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
                  <p className="max-w-md text-sm text-slate-600">
                    {cropDimensions
                      ? `Đã cắt vùng ảnh (${cropDimensions.width} × ${cropDimensions.height} px). Nhấn nút bên dưới để nhận diện và dịch đúng vùng này.`
                      : 'Ảnh đã sẵn sàng. Bạn có thể chọn vùng chữ cụ thể bằng nút "Cắt vùng ảnh" hoặc dịch toàn bộ ảnh ngay.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {originalImageDataUrl && !isCropping && (
                      <button
                        type="button"
                        onClick={() => setIsCropping(true)}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                      >
                        <Crop className="h-4 w-4" aria-hidden="true" />
                        <span>{cropRect ? 'Chỉnh lại vùng cắt' : 'Cắt vùng ảnh'}</span>
                      </button>
                    )}
                    {previewDataUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          void translateDataUrl(
                            previewDataUrl,
                            cropRect
                              ? `${(previewLabel || 'Ảnh đã tải lên').replace(/\s*\(đã cắt\)$/i, '')} (đã cắt)`
                              : previewLabel || 'Ảnh đã tải lên',
                            previewMethod,
                            targetLanguage,
                          )
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        <span>{cropRect ? 'Dịch vùng đã cắt' : 'Dịch chữ ngay'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : !result.originalText.trim() && !result.translatedText.trim() ? (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
                  <p className="text-sm font-medium text-slate-900">
                    Không phát hiện thấy chữ nào trong hình ảnh này.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Hãy thử chụp rõ hơn hoặc chọn ảnh có văn bản sắc nét hơn.
                  </p>
                </div>
              ) : outputTab === 'translated' ? (
                <textarea
                  aria-label="Nội dung bản dịch"
                  value={result.translatedText}
                  onChange={(e) =>
                    onResultChange({ ...result, translatedText: e.target.value }, false)
                  }
                  className="min-h-[340px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50/40 p-4 text-[15px] leading-relaxed text-slate-900 focus:border-blue-700 focus:bg-white focus:outline-none"
                />
              ) : outputTab === 'original' ? (
                <textarea
                  aria-label="Văn bản gốc trích xuất từ ảnh"
                  value={result.originalText}
                  onChange={(e) =>
                    onResultChange({ ...result, originalText: e.target.value }, false)
                  }
                  className="min-h-[340px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50/40 p-4 text-[15px] leading-relaxed text-slate-800 focus:border-blue-700 focus:bg-white focus:outline-none"
                />
              ) : (
                <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                  {result.segments.map((seg) => (
                    <div
                      key={seg.id}
                      className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-5"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">
                          {seg.context ? `Gốc · ${seg.context}` : 'Văn bản gốc'}
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                          {seg.original}
                        </p>
                      </div>
                      <div className="space-y-1 border-t border-slate-100 pt-3 sm:border-t-0 sm:border-l sm:border-slate-200 sm:pt-0 sm:pl-5">
                        <p className="text-xs font-medium text-blue-700">
                          Bản dịch ({getLanguageLabel(result.targetLanguage)})
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-900">
                          {seg.translated}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result && !isProcessing && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5">
                <button
                  type="button"
                  onClick={handleExportDocx}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                >
                  {exportDone ? (
                    <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>
                    {exportDone
                      ? 'Đã tải file Word'
                      : outputTab === 'bilingual'
                        ? 'Tải bản song ngữ (.docx)'
                        : 'Tải file Word (.docx)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyOutput}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
                >
                  {copied ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép bản dịch'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
