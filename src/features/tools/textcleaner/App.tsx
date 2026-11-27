import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorPane, type StatusMessage } from './components/EditorPane';
import { Header } from './components/Header';
import { ToolsPanel, type ToolTab } from './components/ToolsPanel';
import {
  cleanAllFormatting,
  collapseSpaces,
  computeTextStats,
  countMatchingLines,
  createHistory,
  deduplicateLines,
  extractLinks,
  filterLinesByKeyword,
  numberLines,
  pushHistory,
  removeExtraBlankLines,
  SAMPLE_MESSY_TEXT,
  sortLines,
  splitListItems,
  stripLinePrefixes,
  toCsvContent,
  undoHistory,
  unwrapPdfLines,
  type HistoryState,
  type ProcessResult,
} from './lib/textProcessor';
import { loadDocumentFile } from './lib/documentLoader';
import { TARGET_LANGUAGES, type TranslationTone } from './lib/translationHelpers';

const STORAGE_KEY = 'textcleaner_draft_v1';

function readStoredDraft(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return typeof saved === 'string' ? saved : '';
  } catch {
    return '';
  }
}

function writeStoredDraft(text: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, text);
  } catch {
    // Ignore storage quota or sandbox restrictions silently.
  }
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to execCommand below for restricted iframe contexts.
  }

  try {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(helper);
    return ok;
  } catch {
    return false;
  }
}

function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [history, setHistory] = useState<HistoryState>(() => createHistory(readStoredDraft(), 50));
  const [activeTab, setActiveTab] = useState<ToolTab>('clean');
  const [deduplicateLinks, setDeduplicateLinks] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [justCopied, setJustCopied] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [tone, setTone] = useState<TranslationTone>('natural');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const copyTimerRef = useRef<number | null>(null);
  const lastTypingSnapshotRef = useRef<number>(0);

  const text = history.present;

  useEffect(() => {
    writeStoredDraft(text);
  }, [text]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const stats = useMemo(() => computeTextStats(text), [text]);
  const extractedLinks = useMemo(
    () => extractLinks(text, deduplicateLinks),
    [text, deduplicateLinks]
  );
  const keywordMatchCount = useMemo(
    () => countMatchingLines(text, keyword),
    [text, keyword]
  );

  const commitTextChange = useCallback((nextText: string, message?: StatusMessage) => {
    setHistory((prev) => pushHistory(prev, nextText));
    if (message) {
      setStatus(message);
    }
  }, []);

  const handleEditorChange = useCallback((nextValue: string) => {
    const now = Date.now();
    const isLargeChange = Math.abs(nextValue.length - text.length) > 15;
    const isElapsed = now - lastTypingSnapshotRef.current > 1200;

    if (isLargeChange || isElapsed) {
      lastTypingSnapshotRef.current = now;
      setHistory((prev) => pushHistory(prev, nextValue));
    } else {
      setHistory((prev) => ({ ...prev, present: nextValue }));
    }
  }, [text.length]);

  const applyTransform = useCallback((transformer: (input: string) => ProcessResult) => {
    setHistory((prev) => {
      const outcome = transformer(prev.present);
      setStatus({
        kind: outcome.changed ? 'success' : 'info',
        text: outcome.summary,
      });
      return outcome.changed ? pushHistory(prev, outcome.text) : prev;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const next = undoHistory(prev);
      setStatus({
        kind: 'info',
        text: `Đã hoàn tác về bước trước (còn ${next.past.length} bước lưu).`,
      });
      return next;
    });
  }, []);

  const handleCopyResult = useCallback(async () => {
    if (!text) return;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setJustCopied(true);
      setStatus({
        kind: 'success',
        text: 'Đã sao chép kết quả vào bộ nhớ tạm.',
      });
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setJustCopied(false);
      }, 2000);
    } else {
      setStatus({
        kind: 'error',
        text: 'Trình duyệt chặn truy cập bộ nhớ tạm. Hãy chọn văn bản và nhấn Ctrl+C.',
      });
    }
  }, [text]);

  const handlePasteClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
        throw new Error('Clipboard API unavailable');
      }
      const pasted = await navigator.clipboard.readText();
      if (!pasted) {
        setStatus({ kind: 'info', text: 'Bộ nhớ tạm đang trống.' });
        return;
      }
      commitTextChange(pasted, {
        kind: 'success',
        text: 'Đã dán nội dung từ bộ nhớ tạm.',
      });
    } catch {
      setStatus({
        kind: 'error',
        text: 'Không thể đọc tự động bộ nhớ tạm. Hãy bấm vào khung văn bản và nhấn Ctrl+V.',
      });
    }
  }, [commitTextChange]);

  const handleLoadFile = useCallback(
    async (file: File) => {
      setIsLoadingFile(true);
      try {
        const result = await loadDocumentFile(file);
        if (!result.ok || typeof result.text !== 'string') {
          setStatus({
            kind: 'error',
            text: result.error || `Không thể đọc tệp "${file.name}".`,
          });
          return;
        }
        commitTextChange(result.text, {
          kind: 'success',
          text: `Đã nạp nội dung từ tệp "${result.fileName}".`,
        });
      } finally {
        setIsLoadingFile(false);
      }
    },
    [commitTextChange]
  );

  const handleLoadSample = useCallback(() => {
    commitTextChange(SAMPLE_MESSY_TEXT, {
      kind: 'info',
      text: 'Đã nạp văn bản mẫu (dữ liệu mô phỏng copy từ PDF) để bạn thử các nút xử lý.',
    });
  }, [commitTextChange]);

  const handleClear = useCallback(() => {
    if (!text) return;
    commitTextChange('', {
      kind: 'info',
      text: 'Đã xóa trắng khung văn bản. Bấm Hoàn tác nếu cần khôi phục.',
    });
  }, [commitTextChange, text]);

  const handleDownloadTxt = useCallback(() => {
    if (!text) return;
    triggerFileDownload(text, 'textcleaner-ket-qua.txt', 'text/plain;charset=utf-8');
    setStatus({ kind: 'success', text: 'Đã tải xuống tệp textcleaner-ket-qua.txt.' });
  }, [text]);

  const handleDownloadCsv = useCallback(() => {
    if (!text) return;
    const csv = toCsvContent(text);
    triggerFileDownload(csv, 'textcleaner-danh-sach.csv', 'text/csv;charset=utf-8');
    setStatus({ kind: 'success', text: 'Đã tải xuống tệp textcleaner-danh-sach.csv.' });
  }, [text]);

  const handleCopyAllLinks = useCallback(async () => {
    if (extractedLinks.length === 0) return;
    const content = extractedLinks.map((item) => item.href).join('\n');
    const ok = await copyTextToClipboard(content);
    setStatus(
      ok
        ? { kind: 'success', text: `Đã sao chép ${extractedLinks.length} đường link.` }
        : { kind: 'error', text: 'Không thể sao chép tự động. Hãy đưa link ra khung chính để copy.' }
    );
  }, [extractedLinks]);

  const handleCopySingleLink = useCallback(async (url: string) => {
    const ok = await copyTextToClipboard(url);
    setStatus(
      ok
        ? { kind: 'success', text: `Đã sao chép đường link ${url}.` }
        : { kind: 'error', text: 'Không thể sao chép đường link này.' }
    );
  }, []);

  const handleReplaceWithLinks = useCallback(() => {
    if (extractedLinks.length === 0) return;
    const linkListText = extractedLinks.map((item) => item.href).join('\n');
    commitTextChange(linkListText, {
      kind: 'success',
      text: `Đã đưa ${extractedLinks.length} đường link ra khung văn bản chính.`,
    });
  }, [commitTextChange, extractedLinks]);

  const handleSwapLanguages = useCallback(() => {
    if (sourceLang === 'auto') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  }, [sourceLang, targetLang]);

  const handleTranslate = useCallback(async () => {
    if (!text.trim() || isTranslating) return;
    setIsTranslating(true);
    setTranslateError(null);

    try {
      const response = await fetch('/api/tools/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLang, targetLang, tone }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        translatedText?: string;
        error?: string;
      };

      if (!response.ok || !data.translatedText) {
        const message = data.error || 'Không thể dịch văn bản lúc này. Vui lòng thử lại.';
        setTranslateError(message);
        setStatus({ kind: 'error', text: message });
        return;
      }

      const targetLabel =
        TARGET_LANGUAGES.find((lang) => lang.code === targetLang)?.label ?? targetLang;
      setTranslatedText(data.translatedText);
      setStatus({
        kind: 'success',
        text: `Đã dịch văn bản sang ${targetLabel}.`,
      });
    } catch {
      const message = 'Không kết nối được tới máy chủ dịch. Vui lòng kiểm tra kết nối và thử lại.';
      setTranslateError(message);
      setStatus({ kind: 'error', text: message });
    } finally {
      setIsTranslating(false);
    }
  }, [isTranslating, sourceLang, targetLang, text, tone]);

  const handleCopyTranslation = useCallback(async () => {
    if (!translatedText) return;
    const ok = await copyTextToClipboard(translatedText);
    setStatus(
      ok
        ? { kind: 'success', text: 'Đã sao chép bản dịch vào bộ nhớ tạm.' }
        : { kind: 'error', text: 'Không thể sao chép bản dịch tự động.' }
    );
  }, [translatedText]);

  const handleApplyTranslation = useCallback(() => {
    if (!translatedText) return;
    commitTextChange(translatedText, {
      kind: 'success',
      text: 'Đã đưa bản dịch vào khung chính. Bấm Hoàn tác nếu cần quay lại bản gốc.',
    });
  }, [commitTextChange, translatedText]);

  const handleDownloadTranslation = useCallback(() => {
    if (!translatedText) return;
    triggerFileDownload(
      translatedText,
      `textcleaner-ban-dich-${targetLang}.txt`,
      'text/plain;charset=utf-8'
    );
    setStatus({
      kind: 'success',
      text: `Đã tải xuống tệp textcleaner-ban-dich-${targetLang}.txt.`,
    });
  }, [targetLang, translatedText]);

  return (
    <div className="min-h-full bg-[#F6F8FB] text-[#0F172A]">
      <Header
        canUndo={history.past.length > 0}
        undoCount={history.past.length}
        hasText={text.length > 0}
        justCopied={justCopied}
        onUndo={handleUndo}
        onCopy={handleCopyResult}
      />

      <main className="mx-auto max-w-[1360px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <EditorPane
            value={text}
            stats={stats}
            status={status}
            justCopied={justCopied}
            isLoadingFile={isLoadingFile}
            onChange={handleEditorChange}
            onLoadFile={handleLoadFile}
            onPasteClipboard={handlePasteClipboard}
            onLoadSample={handleLoadSample}
            onClear={handleClear}
            onCopy={handleCopyResult}
            onDownloadTxt={handleDownloadTxt}
            onDownloadCsv={handleDownloadCsv}
            onInspectLinks={() => setActiveTab('links')}
          />

          <ToolsPanel
            activeTab={activeTab}
            hasText={text.length > 0}
            links={extractedLinks}
            totalRawLinksCount={stats.linksCount}
            deduplicateLinks={deduplicateLinks}
            keyword={keyword}
            keywordMatchCount={keywordMatchCount}
            onTabChange={setActiveTab}
            onCleanAll={() => applyTransform(cleanAllFormatting)}
            onUnwrapPdf={() => applyTransform(unwrapPdfLines)}
            onRemoveBlankLines={() => applyTransform((v) => removeExtraBlankLines(v, false))}
            onCollapseSpaces={() => applyTransform(collapseSpaces)}
            onSplitList={() => applyTransform(splitListItems)}
            onNumberLines={() => applyTransform(numberLines)}
            onStripPrefixes={() => applyTransform(stripLinePrefixes)}
            onSortAsc={() => applyTransform((v) => sortLines(v, 'asc'))}
            onSortDesc={() => applyTransform((v) => sortLines(v, 'desc'))}
            onDeduplicateLines={() => applyTransform(deduplicateLines)}
            onKeywordChange={setKeyword}
            onFilterKeep={() => applyTransform((v) => filterLinesByKeyword(v, keyword, 'keep'))}
            onFilterExclude={() =>
              applyTransform((v) => filterLinesByKeyword(v, keyword, 'exclude'))
            }
            onToggleDeduplicateLinks={setDeduplicateLinks}
            onCopyAllLinks={handleCopyAllLinks}
            onCopySingleLink={handleCopySingleLink}
            onReplaceWithLinks={handleReplaceWithLinks}
            sourceLang={sourceLang}
            targetLang={targetLang}
            tone={tone}
            translatedText={translatedText}
            isTranslating={isTranslating}
            translateError={translateError}
            onSourceLangChange={setSourceLang}
            onTargetLangChange={setTargetLang}
            onSwapLanguages={handleSwapLanguages}
            onToneChange={setTone}
            onTranslate={handleTranslate}
            onCopyTranslation={handleCopyTranslation}
            onApplyTranslation={handleApplyTranslation}
            onDownloadTranslation={handleDownloadTranslation}
          />
        </div>
      </main>
    </div>
  );
}
