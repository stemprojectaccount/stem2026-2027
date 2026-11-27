import { useCallback, useEffect, useRef, useState } from 'react';
import { CodeLookupPanel } from './components/CodeLookupPanel';
import { RecentSharesPanel } from './components/RecentSharesPanel';
import { ShareComposer, type ComposerDraft } from './components/ShareComposer';
import { ShareResultPanel } from './components/ShareResultPanel';
import { ShareViewer } from './components/ShareViewer';
import { TopNav, type AppView } from './components/TopNav';
import {
  clearRecentShares,
  createShare,
  fetchShareByCode,
  loadRecentShares,
  removeRecentShare,
  resolveShareFromLocation,
  saveRecentShare,
} from './core/shareClient';
import { normalizeShareCode, parseShareLocation } from './core/shareCodec';
import type {
  CreateShareInput,
  RecentShareEntry,
  ShareLookupResult,
  ShareRecord,
} from './core/types';

const DEFAULT_DRAFT: ComposerDraft = {
  title: '',
  content: '',
  mode: 'read-only',
  ttlMinutes: 1440,
};

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('compose');
  const [draft, setDraft] = useState<ComposerDraft>(DEFAULT_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [createdShare, setCreatedShare] = useState<ShareRecord | null>(null);

  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerResult, setViewerResult] = useState<ShareLookupResult | null>(null);

  const [recentShares, setRecentShares] = useState<RecentShareEntry[]>(() =>
    loadRecentShares()
  );

  const resultPanelRef = useRef<HTMLDivElement | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Inside SmartStudy the address bar belongs to the app: the tool only reads a QR link once
  // (?c=CODE or ?p=...) and then removes it again, without adding history entries.
  const syncUrlToRoot = useCallback(() => {}, []);
  const syncUrlToCode = useCallback((_code: string) => {}, []);

  const openShareByCode = useCallback(
    async (rawCode: string, updateHistory = true) => {
      const normalized = normalizeShareCode(rawCode);
      setActiveView('viewer');
      setViewerLoading(true);
      setViewerResult(null);

      if (updateHistory && normalized) {
        syncUrlToCode(normalized);
      }

      const result = await fetchShareByCode(rawCode);
      setViewerResult(result);
      setViewerLoading(false);

      if (result.ok) {
        setRecentShares(saveRecentShare(result.share, 'viewed'));
      }
    },
    [syncUrlToCode]
  );

  // Resolve share directly if user opens a QR link (/?c=CODE, /s/CODE, or /?p=...)
  useEffect(() => {
    let mounted = true;

    const loadFromCurrentLocation = async () => {
      const parsed = parseShareLocation(
        window.location.pathname,
        window.location.search,
        window.location.hash
      );
      if (parsed.type === 'none') {
        return;
      }

      setActiveView('viewer');
      setViewerLoading(true);
      const result = await resolveShareFromLocation(
        window.location.pathname,
        window.location.search,
        window.location.hash
      );
      try {
        window.history.replaceState(window.history.state, '', window.location.pathname);
      } catch {
        // ignore
      }
      if (!mounted) return;
      setViewerResult(result);
      setViewerLoading(false);

      if (result && result.ok && result.source === 'server') {
        setRecentShares(saveRecentShare(result.share, 'viewed'));
      }
    };

    loadFromCurrentLocation();
    return () => {
      mounted = false;
    };
  }, []);

  const handleNavigate = (view: 'compose' | 'lookup' | 'recent') => {
    setActiveView(view);
    syncUrlToRoot();
  };

  const handleCreateSubmit = async (input: CreateShareInput) => {
    setComposerError(null);
    if (!input.content || input.content.trim().length === 0) {
      setComposerError(
        'Bạn chưa nhập nội dung cần chia sẻ. Hãy dán ghi chú hoặc đường link vào ô soạn thảo.'
      );
      return;
    }

    setIsSubmitting(true);
    const result = await createShare(input);
    setIsSubmitting(false);

    if (!result.ok) {
      setComposerError(result.message);
      return;
    }

    setCreatedShare(result.share);
    setRecentShares(saveRecentShare(result.share, 'created'));

    // On narrow mobile viewports, smoothly scroll the generated code & QR into view
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        resultPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const handleStartNew = () => {
    setDraft(DEFAULT_DRAFT);
    setCreatedShare(null);
    setComposerError(null);
    setActiveView('compose');
    syncUrlToRoot();
  };

  const handleForkCopy = (share: ShareRecord) => {
    setDraft({
      title: share.title ? `${share.title} (bản sao)` : '',
      content: share.content,
      mode: 'allow-copy',
      ttlMinutes: 1440,
      sourceCode: share.code,
    });
    setCreatedShare(null);
    setComposerError(null);
    setActiveView('compose');
    syncUrlToRoot();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelFork = () => {
    setDraft((prev) => ({ ...prev, sourceCode: undefined }));
  };

  const handleRemoveRecent = (code: string) => {
    setRecentShares(removeRecentShare(code));
  };

  const handleClearRecent = () => {
    setRecentShares(clearRecentShares());
  };

  return (
    <div className="flex min-h-full flex-col bg-[#F7F8FA] text-[#141923]">
      <TopNav
        activeView={activeView}
        recentCount={recentShares.length}
        onNavigate={handleNavigate}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:px-8">
        {activeView === 'compose' && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <ShareComposer
                draft={draft}
                isSubmitting={isSubmitting}
                errorMessage={composerError}
                onChange={setDraft}
                onClearError={() => setComposerError(null)}
                onSubmit={handleCreateSubmit}
                onCancelFork={handleCancelFork}
              />
            </div>

            <div ref={resultPanelRef} className="lg:col-span-5">
              <ShareResultPanel
                share={createdShare}
                origin={origin}
                onOpenViewer={(code) => openShareByCode(code)}
                onStartNew={handleStartNew}
                onQuickLookup={(code) => openShareByCode(code)}
              />
            </div>
          </div>
        )}

        {activeView === 'lookup' && (
          <CodeLookupPanel onOpenCode={(code) => openShareByCode(code)} />
        )}

        {activeView === 'recent' && (
          <RecentSharesPanel
            items={recentShares}
            onOpenCode={(code) => openShareByCode(code)}
            onRemoveItem={handleRemoveRecent}
            onClearAll={handleClearRecent}
            onCreateNew={handleStartNew}
          />
        )}

        {activeView === 'viewer' && (
          <ShareViewer
            loading={viewerLoading}
            result={viewerResult}
            origin={origin}
            onBackToCompose={() => handleNavigate('compose')}
            onGoToLookup={() => handleNavigate('lookup')}
            onForkCopy={handleForkCopy}
          />
        )}
      </main>

      <footer className="hidden border-t border-[#E1E6EF] bg-white py-4 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-[#556174] lg:px-8">
          <span>Chia sẻ nhanh văn bản &amp; đường link giữa các thiết bị</span>
          <span>Không lưu thông tin cá nhân · Tự động khóa sau khi hết hạn</span>
        </div>
      </footer>
    </div>
  );
}
