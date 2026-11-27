import { useEffect, useState } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import {
  HistoryItem,
  ImageTranslationResult,
  PdfConversionResult,
  WorkspaceTab,
} from './types/document';
import {
  countWordsInBlocks,
  countWordsInText,
  getLanguageLabel,
} from './utils/documentParser';
import { loadHistory, saveHistory } from './utils/storage';
import { MobileTabs, SidebarNav } from './components/SidebarNav';
import { PdfToWordView } from './components/PdfToWordView';
import { ImageTranslateView } from './components/ImageTranslateView';
import { HistoryView } from './components/HistoryView';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('pdf-to-word');
  const [pdfResult, setPdfResult] = useState<PdfConversionResult | null>(null);
  const [imageResult, setImageResult] = useState<ImageTranslationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [incomingImage, setIncomingImage] = useState<{
    file: File;
    sourceMethod: 'paste' | 'file';
    receivedAt: number;
  } | null>(null);
  const [incomingPdf, setIncomingPdf] = useState<{
    file: File;
    receivedAt: number;
  } | null>(null);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Global Ctrl+V / Cmd+V listener for instant screenshot paste anywhere in the app
  useEffect(() => {
    function handleGlobalPaste(event: ClipboardEvent) {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const items = Array.from(clipboardData.items || []);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          event.preventDefault();
          setActiveTab('image-translate');
          setIncomingImage({
            file,
            sourceMethod: 'paste',
            receivedAt: Date.now(),
          });
          setNoticeBanner('Đã nhận ảnh chụp màn hình từ Ctrl + V.');
          return;
        }
      }

      // Also check clipboardData.files fallback (some browsers/automated events populate files directly)
      const files = Array.from(clipboardData.files || []);
      const imageFile = files.find((f) => f.type.startsWith('image/'));
      if (imageFile) {
        event.preventDefault();
        setActiveTab('image-translate');
        setIncomingImage({
          file: imageFile,
          sourceMethod: 'paste',
          receivedAt: Date.now(),
        });
        setNoticeBanner('Đã nhận ảnh chụp màn hình từ Ctrl + V.');
      }
    }

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  useEffect(() => {
    if (!noticeBanner) return;
    const timer = window.setTimeout(() => setNoticeBanner(null), 4000);
    return () => window.clearTimeout(timer);
  }, [noticeBanner]);

  function handlePdfResultChange(next: PdfConversionResult | null, shouldSave = false) {
    setPdfResult(next);
    if (next && shouldSave) {
      const entry: HistoryItem = {
        id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: 'pdf',
        title: next.title || next.sourceFileName,
        createdAt: next.createdAt,
        wordCount: countWordsInBlocks(next.blocks),
        languageSummary: next.targetLanguage
          ? `${next.detectedLanguage} → ${getLanguageLabel(next.targetLanguage)}`
          : next.detectedLanguage,
        data: next,
      };
      setHistory((prev) => [entry, ...prev]);
    }
  }

  function handleImageResultChange(next: ImageTranslationResult | null, shouldSave = false) {
    setImageResult(next);
    if (next && shouldSave) {
      const entry: HistoryItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: 'image',
        title: next.sourceLabel,
        createdAt: next.createdAt,
        wordCount: countWordsInText(next.translatedText),
        languageSummary: `${next.detectedLanguage} → ${getLanguageLabel(next.targetLanguage)}`,
        data: next,
      };
      setHistory((prev) => [entry, ...prev]);
    }
  }

  function handleReopenHistory(item: HistoryItem) {
    if (item.kind === 'pdf') {
      setPdfResult(item.data);
      setActiveTab('pdf-to-word');
    } else {
      setImageResult(item.data);
      setActiveTab('image-translate');
    }
  }

  function handleRouteImageFile(file: File) {
    setActiveTab('image-translate');
    setIncomingImage({
      file,
      sourceMethod: 'file',
      receivedAt: Date.now(),
    });
    setNoticeBanner(`Đã chuyển ảnh "${file.name}" sang mục Dịch chữ từ ảnh.`);
  }

  function handleRoutePdfFile(file: File) {
    setActiveTab('pdf-to-word');
    setIncomingPdf({ file, receivedAt: Date.now() });
    setNoticeBanner(`Đã chuyển tệp "${file.name}" sang mục Chuyển PDF sang Word.`);
  }

  return (
    <div className="flex min-h-full w-full bg-slate-50 text-slate-900">
      <SidebarNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        historyCount={history.length}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Clean 1-row top header on mobile & sticky contextual breadcrumb bar on desktop */}
        <header className="z-20 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:sticky lg:top-0 lg:h-16 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden text-sm text-slate-500 lg:inline whitespace-nowrap">
              Không gian làm việc /{' '}
              <span className="font-medium text-slate-900">
                {activeTab === 'pdf-to-word'
                  ? 'Chuyển PDF sang Word'
                  : activeTab === 'image-translate'
                    ? 'Dịch chữ từ ảnh'
                    : 'Lịch sử gần đây'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('image-translate')}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              <span>Dán ảnh</span>
              <kbd className="hidden rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-800 sm:inline">
                Ctrl+V
              </kbd>
            </button>
          </div>
        </header>

        <MobileTabs activeTab={activeTab} onSelectTab={setActiveTab} historyCount={history.length} />

        {/* Global notification banner (e.g. Ctrl+V screenshot detected) */}
        {noticeBanner && (
          <div
            role="status"
            aria-live="polite"
            className="border-b border-blue-200 bg-blue-50 px-4 py-2.5 sm:px-6 lg:px-8"
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-sm text-blue-900">
              <span className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                <span>{noticeBanner}</span>
              </span>
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => setNoticeBanner(null)}
                className="rounded p-1 text-blue-700 hover:bg-blue-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Canvas */}
        <main className="flex-1 px-4 py-6 pb-10 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
          {activeTab === 'pdf-to-word' && (
            <PdfToWordView
              result={pdfResult}
              incomingPdf={incomingPdf}
              onConsumeIncomingPdf={() => setIncomingPdf(null)}
              onResultChange={handlePdfResultChange}
              onRouteImageFile={handleRouteImageFile}
            />
          )}

          {activeTab === 'image-translate' && (
            <ImageTranslateView
              result={imageResult}
              incomingImage={incomingImage}
              onConsumeIncomingImage={() => setIncomingImage(null)}
              onResultChange={handleImageResultChange}
              onRoutePdfFile={handleRoutePdfFile}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              items={history}
              onReopen={handleReopenHistory}
              onDelete={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
              onClearAll={() => setHistory([])}
              onNavigate={setActiveTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
