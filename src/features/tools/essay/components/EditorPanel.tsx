import { useState, type RefObject } from 'react';
import { BookOpenText, Check, Languages, Trash2 } from 'lucide-react';
import type { DetectedLanguage, EssayMetrics, LanguagePreference } from '../analyzer';
import { formatReadingTime } from '../analyzer';
import { formatSavedTime } from '../utils/draftStorage';

interface EditorPanelProps {
  title: string;
  content: string;
  language: LanguagePreference;
  detectedLanguage: DetectedLanguage;
  metrics: EssayMetrics;
  updatedAt: string | null;
  noticeMessage: string | null;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onTitleChange: (nextTitle: string) => void;
  onContentChange: (nextContent: string) => void;
  onLanguageChange: (nextLang: LanguagePreference) => void;
  onLoadSample: (lang: DetectedLanguage) => void;
  onClearAll: () => void;
}

const LANGUAGE_OPTIONS: Array<{ id: LanguagePreference; label: string }> = [
  { id: 'auto', label: 'Tự động' },
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'Tiếng Anh' },
];

export function EditorPanel({
  title,
  content,
  language,
  detectedLanguage,
  metrics,
  updatedAt,
  noticeMessage,
  textareaRef,
  onTitleChange,
  onContentChange,
  onLanguageChange,
  onLoadSample,
  onClearAll,
}: EditorPanelProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  const hasContent = title.trim().length > 0 || content.trim().length > 0;
  const savedTimeLabel = formatSavedTime(updatedAt);
  const readingTimeLabel = formatReadingTime(metrics.readingTimeSeconds);
  const detectedLabel = detectedLanguage === 'en' ? 'Tiếng Anh' : 'Tiếng Việt';

  const handleConfirmClear = () => {
    setConfirmingClear(false);
    onClearAll();
  };

  return (
    <section
      id="editor-section"
      aria-labelledby="editor-heading"
      className="scroll-mt-20 bg-surface border border-line rounded-xl overflow-hidden"
    >
      {/* Top workspace strip inside sheet */}
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-line flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1
            id="editor-heading"
            className="text-xl sm:text-2xl font-bold text-ink tracking-tight text-balance"
          >
            Tự rà soát bài viết
          </h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            Hỗ trợ kiểm tra Tiếng Việt &amp; Tiếng Anh, chỉ rõ lỗi sai và hướng dẫn cách sửa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setConfirmingClear(false);
              onLoadSample('vi');
            }}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-medium text-accent bg-accent-soft hover:bg-[#DBEAFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpenText className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Mẫu TV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmingClear(false);
              onLoadSample('en');
            }}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-medium text-accent bg-accent-soft hover:bg-[#DBEAFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Languages className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Mẫu EN</span>
          </button>

          {hasContent && !confirmingClear && (
            <button
              type="button"
              onClick={() => setConfirmingClear(true)}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-medium text-ink-secondary hover:text-alert hover:bg-alert-soft transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Xóa nháp</span>
            </button>
          )}

          {confirmingClear && (
            <div className="inline-flex items-center gap-1.5" role="group" aria-label="Xác nhận xóa bản nháp">
              <button
                type="button"
                onClick={handleConfirmClear}
                className="min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-alert hover:bg-[#991B1B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Xác nhận xóa
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-medium text-ink-secondary hover:bg-surface-subtle transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Language mode bar */}
      <div className="px-5 sm:px-6 py-2.5 bg-surface-subtle/40 border-b border-line flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-ink-secondary whitespace-nowrap">
            Ngôn ngữ kiểm tra:
          </span>
          <div
            role="group"
            aria-label="Chọn ngôn ngữ kiểm tra"
            className="inline-flex items-center gap-0.5 p-0.5 bg-surface-subtle rounded-lg border border-line"
          >
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = language === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onLanguageChange(opt.id)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-xs text-ink-muted" data-testid="active-language-indicator">
          {language === 'auto'
            ? hasContent
              ? `Đang nhận diện: ${detectedLabel}`
              : 'Tự nhận diện Tiếng Việt / Tiếng Anh'
            : `Đang kiểm tra theo chuẩn ${detectedLabel}`}
        </span>
      </div>

      {/* Essay Title + Body Sheet */}
      <div className="px-5 sm:px-6 pt-4 pb-5">
        <div className="mb-3">
          <label htmlFor="essay-title-input" className="sr-only">
            Tiêu đề bài viết (không bắt buộc)
          </label>
          <input
            id="essay-title-input"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={
              detectedLanguage === 'en'
                ? 'Essay title or prompt (optional)...'
                : 'Tiêu đề bài viết hoặc đề bài (không bắt buộc)...'
            }
            className="w-full py-2 text-base sm:text-lg font-semibold text-ink placeholder:text-ink-muted bg-transparent border-b border-line focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="essay-content-textarea" className="sr-only">
            Nội dung bài viết, đoạn văn hoặc dàn ý
          </label>
          <textarea
            ref={textareaRef}
            id="essay-content-textarea"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={13}
            spellCheck={false}
            placeholder="Nhập hoặc dán bài viết Tiếng Việt hoặc Tiếng Anh vào đây…&#10;&#10;Mẹo: Nhấn Enter để xuống đoạn mới. công cụ sẽ tự nhận diện ngôn ngữ, chỉ ra lỗi sai và hướng dẫn cách sửa ngay bên phải."
            className="w-full min-h-[290px] sm:min-h-[340px] py-2 text-base leading-[1.8] text-ink placeholder:text-ink-muted bg-transparent resize-y focus:outline-none"
          />
        </div>
      </div>

      {/* Direct live metrics footer — clean unboxed metadata without orphan separators */}
      <div className="px-5 sm:px-6 py-3 bg-surface-subtle/60 border-t border-line flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-secondary tabular-nums"
          aria-label="Số liệu trực tiếp của bài viết"
          data-testid="live-metrics-strip"
        >
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span>
              <strong className="font-semibold text-ink font-mono">{metrics.wordCount}</strong> từ
            </span>
            <span aria-hidden="true" className="text-line-strong">·</span>
            <span>
              <strong className="font-semibold text-ink font-mono">{metrics.sentenceCount}</strong> câu
            </span>
            <span aria-hidden="true" className="text-line-strong">·</span>
            <span>
              <strong className="font-semibold text-ink font-mono">{metrics.paragraphCount}</strong> đoạn
            </span>
          </span>
          <span className="whitespace-nowrap">
            Đọc khoảng <strong className="font-semibold text-ink">{readingTimeLabel}</strong>
          </span>
        </div>

        <div className="text-xs sm:text-sm text-ink-muted flex items-center gap-1.5" aria-live="polite">
          {noticeMessage ? (
            <span className="inline-flex items-center gap-1 text-ok font-medium">
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {noticeMessage}
            </span>
          ) : savedTimeLabel && hasContent ? (
            <span>Đã tự động lưu nháp lúc {savedTimeLabel}</span>
          ) : (
            <span>Bản nháp tự động lưu trên trình duyệt</span>
          )}
        </div>
      </div>
    </section>
  );
}
