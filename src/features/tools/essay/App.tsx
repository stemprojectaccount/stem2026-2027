import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  analyzeEssay,
  type AnalysisIssue,
  type CriterionInput,
  type DetectedLanguage,
  type LanguagePreference,
  type TextRange,
} from './analyzer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { CriteriaPanel } from './components/CriteriaPanel';
import { EditorPanel } from './components/EditorPanel';
import { Header } from './components/Header';
import { SAMPLE_ENGLISH_ESSAY, SAMPLE_ESSAY } from './data/sampleEssay';
import {
  clearStoredDraft,
  downloadEssayAsWord,
  loadDraft,
  saveDraft,
  type EssayDraft,
} from './utils/draftStorage';

function createCriterionId(): string {
  return `crit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function App() {
  const [draft, setDraft] = useState<EssayDraft>(() => loadDraft());
  const [isExporting, setIsExporting] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  const showNotice = useCallback((message: string) => {
    setNoticeMessage(message);
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setNoticeMessage(null);
      noticeTimerRef.current = null;
    }, 3400);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  // Auto-save draft changes safely to localStorage
  useEffect(() => {
    const isCompletelyEmpty =
      draft.title.trim().length === 0 &&
      draft.content.trim().length === 0 &&
      draft.criteria.length === 0;

    if (isCompletelyEmpty) {
      clearStoredDraft();
      return;
    }

    saveDraft(draft);
  }, [draft]);

  // Run pure decoupled bilingual analyzer whenever content, criteria, or language changes
  const analysis = useMemo(
    () => analyzeEssay(draft.content, draft.criteria, { language: draft.language }),
    [draft.content, draft.criteria, draft.language]
  );

  const canExport = draft.title.trim().length > 0 || draft.content.trim().length > 0;

  const handleTitleChange = useCallback((nextTitle: string) => {
    setDraft((prev) => ({
      ...prev,
      title: nextTitle,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleContentChange = useCallback((nextContent: string) => {
    setDraft((prev) => ({
      ...prev,
      content: nextContent,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleLanguageChange = useCallback((nextLang: LanguagePreference) => {
    setDraft((prev) => ({
      ...prev,
      language: nextLang,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleAddCriteria = useCallback((items: string[]) => {
    setDraft((prev) => {
      const existingNormalized = new Set(
        prev.criteria.map((c) => c.text.normalize('NFC').toLowerCase())
      );
      const additions: CriterionInput[] = [];

      for (const raw of items) {
        const cleaned = raw.trim();
        const norm = cleaned.normalize('NFC').toLowerCase();
        if (cleaned && !existingNormalized.has(norm)) {
          existingNormalized.add(norm);
          additions.push({ id: createCriterionId(), text: cleaned });
        }
      }

      if (additions.length === 0) {
        return prev;
      }

      return {
        ...prev,
        criteria: [...prev.criteria, ...additions],
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const handleRemoveCriterion = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((item) => item.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleClearCriteria = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      criteria: [],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleLoadSample = useCallback(
    (lang: DetectedLanguage) => {
      const sample = lang === 'en' ? SAMPLE_ENGLISH_ESSAY : SAMPLE_ESSAY;
      setDraft({
        title: sample.title,
        content: sample.content,
        criteria: sample.criteria.map((c) => ({ ...c })),
        language: 'auto',
        updatedAt: new Date().toISOString(),
      });
      showNotice(`Đã nạp ${sample.label}`);
    },
    [showNotice]
  );

  const handleClearAll = useCallback(() => {
    clearStoredDraft();
    setDraft({
      title: '',
      content: '',
      criteria: [],
      language: 'auto',
      updatedAt: null,
    });
    showNotice('Đã xóa bản nháp');
  }, [showNotice]);

  const handleExportWord = useCallback(async () => {
    if (!canExport || isExporting) return;
    setIsExporting(true);
    try {
      const filename = await downloadEssayAsWord(draft.title, draft.content);
      showNotice(`Đã xuất tệp Word ${filename}`);
    } catch {
      showNotice('Không thể tạo tệp Word, bạn hãy thử lại.');
    } finally {
      setIsExporting(false);
    }
  }, [canExport, isExporting, draft.title, draft.content, showNotice]);

  const handleJumpToSection = useCallback(
    (sectionId: 'editor-section' | 'criteria-section' | 'analysis-section') => {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    []
  );

  const handleHighlightRange = useCallback(
    (range: TextRange, label?: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      textarea.focus();
      textarea.setSelectionRange(range.start, range.end);

      const ratio =
        textarea.value.length > 0 ? range.start / textarea.value.length : 0;
      const targetScroll = Math.max(
        0,
        ratio * textarea.scrollHeight - textarea.clientHeight * 0.35
      );
      textarea.scrollTop = targetScroll;

      if (label) {
        showNotice(label);
      }
    },
    [showNotice]
  );

  const handleApplyFix = useCallback(
    (issue: AnalysisIssue) => {
      if (!issue.suggestedFix) return;
      const { start, end } = issue.range;

      setDraft((prev) => {
        if (start < 0 || end > prev.content.length || start > end) {
          return prev;
        }
        const currentSlice = prev.content.slice(start, end);
        if (issue.wrongText && currentSlice !== issue.wrongText) {
          return prev;
        }
        const updatedContent =
          prev.content.slice(0, start) + issue.suggestedFix + prev.content.slice(end);
        return {
          ...prev,
          content: updatedContent,
          updatedAt: new Date().toISOString(),
        };
      });

      const fixLength = issue.suggestedFix.length;
      window.requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(start, start + fixLength);
        }
      });

      showNotice(
        issue.wrongText
          ? `Đã sửa “${issue.wrongText}” → “${issue.suggestedFix}”`
          : `Đã áp dụng sửa tại ${issue.locationLabel}`
      );
    },
    [showNotice]
  );

  return (
    <div className="min-h-full flex flex-col bg-canvas text-ink">
      <Header
        canExport={canExport}
        isExporting={isExporting}
        onExportWord={handleExportWord}
        onJumpToSection={handleJumpToSection}
      />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Zone (~58%): Writing Sheet + Target Keywords/Main Ideas */}
          <div className="lg:col-span-7 space-y-6">
            <EditorPanel
              title={draft.title}
              content={draft.content}
              language={draft.language}
              detectedLanguage={analysis.detectedLanguage}
              metrics={analysis.metrics}
              updatedAt={draft.updatedAt}
              noticeMessage={noticeMessage}
              textareaRef={textareaRef}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              onLanguageChange={handleLanguageChange}
              onLoadSample={handleLoadSample}
              onClearAll={handleClearAll}
            />

            <CriteriaPanel
              criteria={draft.criteria}
              onAddCriteria={handleAddCriteria}
              onRemoveCriterion={handleRemoveCriterion}
              onClearCriteria={handleClearCriteria}
            />
          </div>

          {/* Right Zone (~42%): Structured Analysis, Mistakes & Fix Guidance */}
          <div className="lg:col-span-5">
            <AnalysisPanel
              analysis={analysis}
              onHighlightRange={handleHighlightRange}
              onApplyFix={handleApplyFix}
              onLoadSample={handleLoadSample}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-line bg-surface/60">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
          <span>Rà soát bài viết Tiếng Việt &amp; Tiếng Anh trước khi nộp</span>
          <span>Dữ liệu chỉ lưu cục bộ trên trình duyệt của bạn</span>
        </div>
      </footer>
    </div>
  );
}
