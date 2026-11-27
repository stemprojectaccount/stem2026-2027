import { useState } from 'react';
import { AlertCircle, ArrowDownAZ, ArrowLeftRight, ArrowRightLeft, ArrowUpZA, Check, Copy, Download, ExternalLink, Filter, Languages, Link2, ListOrdered, ListPlus, Loader2, RemoveFormatting, Rows3, Scissors, WrapText, Eraser } from "lucide-react";
import type { ExtractedLink } from '../lib/textProcessor';
import {
  SOURCE_LANGUAGES,
  TARGET_LANGUAGES,
  TONE_OPTIONS,
  type TranslationTone,
} from '../lib/translationHelpers';

export type ToolTab = 'clean' | 'links' | 'translate';

interface ToolsPanelProps {
  activeTab: ToolTab;
  hasText: boolean;
  links: ExtractedLink[];
  totalRawLinksCount: number;
  deduplicateLinks: boolean;
  keyword: string;
  keywordMatchCount: number;
  onTabChange: (tab: ToolTab) => void;
  onCleanAll: () => void;
  onUnwrapPdf: () => void;
  onRemoveBlankLines: () => void;
  onCollapseSpaces: () => void;
  onSplitList: () => void;
  onNumberLines: () => void;
  onStripPrefixes: () => void;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onDeduplicateLines: () => void;
  onKeywordChange: (value: string) => void;
  onFilterKeep: () => void;
  onFilterExclude: () => void;
  onToggleDeduplicateLinks: (checked: boolean) => void;
  onCopyAllLinks: () => void;
  onCopySingleLink: (url: string) => void;
  onReplaceWithLinks: () => void;
  sourceLang: string;
  targetLang: string;
  tone: TranslationTone;
  translatedText: string;
  isTranslating: boolean;
  translateError: string | null;
  onSourceLangChange: (lang: string) => void;
  onTargetLangChange: (lang: string) => void;
  onSwapLanguages: () => void;
  onToneChange: (tone: TranslationTone) => void;
  onTranslate: () => void;
  onCopyTranslation: () => void;
  onApplyTranslation: () => void;
  onDownloadTranslation: () => void;
}

export function ToolsPanel({
  activeTab,
  hasText,
  links,
  totalRawLinksCount,
  deduplicateLinks,
  keyword,
  keywordMatchCount,
  onTabChange,
  onCleanAll,
  onUnwrapPdf,
  onRemoveBlankLines,
  onCollapseSpaces,
  onSplitList,
  onNumberLines,
  onStripPrefixes,
  onSortAsc,
  onSortDesc,
  onDeduplicateLines,
  onKeywordChange,
  onFilterKeep,
  onFilterExclude,
  onToggleDeduplicateLinks,
  onCopyAllLinks,
  onCopySingleLink,
  onReplaceWithLinks,
  sourceLang,
  targetLang,
  tone,
  translatedText,
  isTranslating,
  translateError,
  onSourceLangChange,
  onTargetLangChange,
  onSwapLanguages,
  onToneChange,
  onTranslate,
  onCopyTranslation,
  onApplyTranslation,
  onDownloadTranslation,
}: ToolsPanelProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  const handleCopyOne = (url: string) => {
    onCopySingleLink(url);
    setCopiedUrl(url);
    window.setTimeout(() => {
      setCopiedUrl((current) => (current === url ? null : current));
    }, 1600);
  };

  const handleCopyTranslatedClick = () => {
    onCopyTranslation();
    setCopiedTranslation(true);
    window.setTimeout(() => {
      setCopiedTranslation(false);
    }, 1600);
  };

  return (
    <aside
      aria-label="Bộ công cụ xử lý văn bản"
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      {/* Segmented tab switcher */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-2">
        <div
          role="tablist"
          aria-label="Chế độ xử lý"
          className="grid grid-cols-3 gap-1 rounded-lg bg-slate-200/70 p-1"
        >
          <button
            type="button"
            role="tab"
            id="tab-clean"
            aria-selected={activeTab === 'clean'}
            aria-controls="panel-clean"
            onClick={() => onTabChange('clean')}
            className={`min-h-10 rounded-md px-2 py-2 text-xs font-semibold transition-colors whitespace-nowrap sm:text-sm ${
              activeTab === 'clean'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dọn &amp; Xếp
          </button>

          <button
            type="button"
            role="tab"
            id="tab-links"
            aria-selected={activeTab === 'links'}
            aria-controls="panel-links"
            onClick={() => onTabChange('links')}
            className={`inline-flex min-h-10 items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-semibold transition-colors whitespace-nowrap sm:text-sm ${
              activeTab === 'links'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Lọc link</span>
            <span className="font-mono text-xs tabular-nums text-slate-500">
              ({links.length})
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-translate"
            aria-selected={activeTab === 'translate'}
            aria-controls="panel-translate"
            onClick={() => onTabChange('translate')}
            className={`min-h-10 rounded-md px-2 py-2 text-xs font-semibold transition-colors whitespace-nowrap sm:text-sm ${
              activeTab === 'translate'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dịch văn bản
          </button>
        </div>
      </div>

      {/* Tab 1: Clean & List Sort/Filter */}
      <div
        id="panel-clean"
        role="tabpanel"
        aria-labelledby="tab-clean"
        hidden={activeTab !== 'clean'}
        className="divide-y divide-slate-200"
      >
        {/* Group 1: PDF & Whitespace Cleanup */}
        <div className="p-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Dọn xuống dòng &amp; khoảng trắng
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Xử lý nhanh lỗi ngắt dòng khi copy từ tài liệu PDF hoặc ảnh.
          </p>

          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={onCleanAll}
              disabled={!hasText}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
            >
              <Eraser className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Dọn toàn bộ (PDF + khoảng trắng)</span>
            </button>

            <div className="grid grid-cols-1 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={onUnwrapPdf}
                disabled={!hasText}
                className="flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
              >
                <WrapText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="truncate">Nối dòng bị ngắt quãng (PDF/ảnh)</span>
              </button>

              <button
                type="button"
                onClick={onRemoveBlankLines}
                disabled={!hasText}
                className="flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
              >
                <Rows3 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="truncate">Xóa dòng trống thừa</span>
              </button>

              <button
                type="button"
                onClick={onCollapseSpaces}
                disabled={!hasText}
                className="flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
              >
                <Scissors className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="truncate">Thu gọn nhiều khoảng trắng thành 1</span>
              </button>
            </div>
          </div>
        </div>

        {/* Group 2: Split & Sort List */}
        <div className="p-4">
          <h2 className="text-sm font-semibold text-slate-900">Tách &amp; sắp xếp danh sách</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Tách mục thành từng dòng, đánh số hoặc sắp xếp theo tiếng Việt.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={onSplitList}
              disabled={!hasText}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-2 whitespace-nowrap"
            >
              <ListPlus className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span>Tách mỗi mục thành 1 dòng</span>
            </button>

            <button
              type="button"
              onClick={onNumberLines}
              disabled={!hasText}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
            >
              <ListOrdered className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span>Đánh số thứ tự</span>
            </button>

            <button
              type="button"
              onClick={onStripPrefixes}
              disabled={!hasText}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
            >
              <RemoveFormatting className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span>Bỏ số đầu dòng</span>
            </button>

            <button
              type="button"
              onClick={onSortAsc}
              disabled={!hasText}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
            >
              <ArrowDownAZ className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span>Sắp xếp A → Z</span>
            </button>

            <button
              type="button"
              onClick={onSortDesc}
              disabled={!hasText}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
            >
              <ArrowUpZA className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span>Sắp xếp Z → A</span>
            </button>

            <button
              type="button"
              onClick={onDeduplicateLines}
              disabled={!hasText}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-2 whitespace-nowrap"
            >
              <Filter className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span>Xóa các dòng trùng lặp</span>
            </button>
          </div>
        </div>

        {/* Group 3: Keyword Line Filter */}
        <div className="p-4">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="keyword-filter-input" className="text-sm font-semibold text-slate-900">
              Lọc dòng theo từ khóa
            </label>
            {keyword.trim() !== '' && (
              <span
                data-testid="keyword-match-count"
                className="font-mono text-xs text-slate-600 tabular-nums"
              >
                Khớp {keywordMatchCount} dòng
              </span>
            )}
          </div>

          <input
            id="keyword-filter-input"
            type="text"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="Nhập từ khóa cần giữ hoặc loại..."
            className="mt-2 block min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none"
          />

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onFilterKeep}
              disabled={!hasText || keyword.trim() === ''}
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
            >
              Giữ dòng khớp
            </button>
            <button
              type="button"
              onClick={onFilterExclude}
              disabled={!hasText || keyword.trim() === ''}
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
            >
              Loại dòng khớp
            </button>
          </div>
        </div>
      </div>

      {/* Tab 2: Link Extractor */}
      <div
        id="panel-links"
        role="tabpanel"
        aria-labelledby="tab-links"
        hidden={activeTab !== 'links'}
        className="flex flex-col"
      >
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Lọc đường link (URL)</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Tự động quét toàn bộ địa chỉ <span className="font-mono text-xs">http://</span>,{' '}
                <span className="font-mono text-xs">https://</span> và{' '}
                <span className="font-mono text-xs">www.</span>
              </p>
            </div>
          </div>

          <label className="mt-3 flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-800">
            <span className="flex items-center gap-2.5 font-medium">
              <input
                type="checkbox"
                checked={deduplicateLinks}
                onChange={(event) => onToggleDeduplicateLinks(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#1D4ED8]"
              />
              <span>Loại bỏ link trùng lặp</span>
            </span>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {links.length}/{totalRawLinksCount}
            </span>
          </label>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCopyAllLinks}
              disabled={links.length === 0}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
            >
              <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Copy tất cả link</span>
            </button>

            <button
              type="button"
              onClick={onReplaceWithLinks}
              disabled={links.length === 0}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
            >
              <Link2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span>Đưa ra khung chính</span>
            </button>
          </div>
        </div>

        {/* Extracted links list */}
        <div className="max-h-[420px] overflow-y-auto p-4 sm:p-5">
          {links.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-700">Chưa phát hiện đường link nào</p>
              <p className="mt-1 text-sm text-slate-500">
                Dán văn bản chứa địa chỉ web vào khung bên trái để tự động trích xuất.
              </p>
            </div>
          ) : (
            <ul data-testid="extracted-links-list" className="divide-y divide-slate-200">
              {links.map((item, index) => {
                const isCopied = copiedUrl === item.href;
                return (
                  <li
                    key={`${item.href}-${index}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        title={item.raw}
                        className="truncate font-mono text-xs text-slate-800 sm:text-sm"
                      >
                        {item.raw}
                      </p>
                      {deduplicateLinks && item.count > 1 && (
                        <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                          Xuất hiện {item.count} lần
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Mở liên kết ${item.raw} trong tab mới`}
                        className="inline-flex min-h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Mở</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyOne(item.href)}
                        aria-label={`Sao chép liên kết ${item.raw}`}
                        className="inline-flex min-h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 shrink-0 text-[#15803D]" aria-hidden="true" />
                            <span>Đã copy</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Tab 3: Document Translation */}
      <div
        id="panel-translate"
        role="tabpanel"
        aria-labelledby="tab-translate"
        hidden={activeTab !== 'translate'}
        className="flex flex-col divide-y divide-slate-200"
      >
        <div className="p-4">
          <h2 className="text-sm font-semibold text-slate-900">Dịch văn bản</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Dịch nội dung đang soạn hoặc tệp Word đã tải lên, giữ nguyên bố cục đoạn và đường link.
          </p>

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
            <div>
              <label
                htmlFor="source-lang-select"
                className="block text-xs font-medium text-slate-600"
              >
                Từ ngôn ngữ
              </label>
              <select
                id="source-lang-select"
                value={sourceLang}
                onChange={(event) => onSourceLangChange(event.target.value)}
                className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none"
              >
                {SOURCE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onSwapLanguages}
              disabled={sourceLang === 'auto'}
              aria-label="Đảo ngôn ngữ nguồn và đích"
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <div>
              <label
                htmlFor="target-lang-select"
                className="block text-xs font-medium text-slate-600"
              >
                Sang ngôn ngữ
              </label>
              <select
                id="target-lang-select"
                value={targetLang}
                onChange={(event) => onTargetLangChange(event.target.value)}
                className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none"
              >
                {TARGET_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <span className="block text-xs font-medium text-slate-600">Văn phong</span>
            <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onToneChange(option.value)}
                  className={`min-h-9 rounded-md px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    tone === option.value
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onTranslate}
            disabled={!hasText || isTranslating}
            className="mt-3.5 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
                <span>Đang dịch văn bản...</span>
              </>
            ) : (
              <>
                <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Dịch văn bản</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-slate-700">Bản dịch</h3>
            {translatedText && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyTranslatedClick}
                  className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 whitespace-nowrap"
                >
                  {copiedTranslation ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
                      <span>Đã copy</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onDownloadTranslation}
                  className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tải .txt</span>
                </button>
              </div>
            )}
          </div>

          {translateError && (
            <div
              role="alert"
              data-testid="translate-error"
              className="mt-2.5 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-[#9A3412]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C2410C]" aria-hidden="true" />
              <span>{translateError}</span>
            </div>
          )}

          {isTranslating ? (
            <div className="mt-2.5 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="h-3.5 w-5/6 animate-pulse rounded bg-slate-200" />
              <div className="h-3.5 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200" />
            </div>
          ) : translatedText ? (
            <>
              <div
                data-testid="translation-output"
                className="mt-2.5 max-h-[240px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm leading-relaxed text-slate-900"
              >
                {translatedText}
              </div>

              <button
                type="button"
                onClick={onApplyTranslation}
                className="mt-2.5 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 whitespace-nowrap"
              >
                <ArrowLeftRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span>Thay bản dịch vào khung chính</span>
              </button>
            </>
          ) : (
            !translateError && (
              <p className="mt-2.5 rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                Chọn ngôn ngữ đích rồi bấm <strong className="font-medium text-slate-700">Dịch văn bản</strong> để xem bản dịch tại đây.
              </p>
            )
          )}
        </div>
      </div>
    </aside>
  );
}
