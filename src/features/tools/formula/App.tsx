import { useEffect, useMemo, useState } from 'react';
import {
  ALL_FILTER_VALUE,
  DEFAULT_FILTER_STATE,
  SEED_FORMULAS,
  applyImportedFormulas,
  createFormula,
  deleteFormula,
  filterFormulas,
  getPriorityCount,
  getSubjectSummaries,
  getTopicsForSubject,
  loadQuickCheckConfig,
  loadSortOption,
  loadStoredFormulas,
  saveQuickCheckConfig,
  saveSortOption,
  saveStoredFormulas,
  sortFormulas,
  togglePriority,
  updateFormula,
  type FormulaDraft,
  type FormulaEntry,
  type FormulaFilterState,
  type FormulaSortOption,
  type JsonImportMode,
  type QuickCheckConfig,
} from './core';
import { DataPortView } from './components/DataPortView';
import { EmptyState } from './components/EmptyState';
import { FormulaCard } from './components/FormulaCard';
import { FormulaModal } from './components/FormulaModal';
import { Header, type ActiveTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';

export default function App() {
  const [entries, setEntries] = useState<FormulaEntry[]>(() => loadStoredFormulas());
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [filter, setFilter] = useState<FormulaFilterState>(DEFAULT_FILTER_STATE);
  const [sortBy, setSortBy] = useState<FormulaSortOption>(() => loadSortOption());
  const [quickCheck, setQuickCheck] = useState<QuickCheckConfig>(() =>
    loadQuickCheckConfig()
  );

  // Per-card reveal sets when quick-check masking is enabled
  const [revealedExpressions, setRevealedExpressions] = useState<Set<string>>(
    () => new Set()
  );
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(
    () => new Set()
  );

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FormulaEntry | null>(null);

  // Live feedback banner
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    saveStoredFormulas(entries);
  }, [entries]);

  useEffect(() => {
    saveQuickCheckConfig(quickCheck);
  }, [quickCheck]);

  useEffect(() => {
    saveSortOption(sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const effectiveFilter = useMemo<FormulaFilterState>(
    () => ({
      ...filter,
      priorityOnly: activeTab === 'priority',
    }),
    [filter, activeTab]
  );

  const scopeEntries = useMemo(
    () => (activeTab === 'priority' ? entries.filter((item) => item.isPriority) : entries),
    [entries, activeTab]
  );

  const subjectSummaries = useMemo(
    () => getSubjectSummaries(scopeEntries),
    [scopeEntries]
  );

  const availableTopics = useMemo(
    () => getTopicsForSubject(scopeEntries, filter.subject),
    [scopeEntries, filter.subject]
  );

  const visibleEntries = useMemo(
    () => sortFormulas(filterFormulas(entries, effectiveFilter), sortBy),
    [entries, effectiveFilter, sortBy]
  );

  const priorityCount = useMemo(() => getPriorityCount(entries), [entries]);

  const allExistingSubjects = useMemo(
    () => getSubjectSummaries(entries).map((item) => item.subject),
    [entries]
  );

  const allExistingTopics = useMemo(
    () => getTopicsForSubject(entries, ALL_FILTER_VALUE).map((item) => item.topic),
    [entries]
  );

  const hasActiveFilters =
    filter.query.trim().length > 0 ||
    filter.subject !== ALL_FILTER_VALUE ||
    filter.topic !== ALL_FILTER_VALUE;

  const hasRevealedAny =
    (quickCheck.hideExpression && revealedExpressions.size > 0) ||
    (quickCheck.hideExample && revealedExamples.size > 0);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab !== 'data') {
      setFilter((prev) => ({
        ...prev,
        subject: ALL_FILTER_VALUE,
        topic: ALL_FILTER_VALUE,
      }));
    }
  };

  const handleSelectSubject = (subject: string) => {
    setFilter((prev) => ({
      ...prev,
      subject,
      topic: ALL_FILTER_VALUE,
    }));
  };

  const handleSelectTopic = (topic: string) => {
    setFilter((prev) => ({
      ...prev,
      topic,
    }));
  };

  const handleResetFilters = () => {
    setFilter(DEFAULT_FILTER_STATE);
  };

  const handleToggleHideExpression = () => {
    setQuickCheck((prev) => ({
      ...prev,
      hideExpression: !prev.hideExpression,
    }));
    setRevealedExpressions(new Set());
  };

  const handleToggleHideExample = () => {
    setQuickCheck((prev) => ({
      ...prev,
      hideExample: !prev.hideExample,
    }));
    setRevealedExamples(new Set());
  };

  const handleToggleRevealExpression = (id: string) => {
    setRevealedExpressions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleRevealExample = (id: string) => {
    setRevealedExamples((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRevealAll = () => {
    const ids = visibleEntries.map((item) => item.id);
    if (quickCheck.hideExpression) {
      setRevealedExpressions(new Set(ids));
    }
    if (quickCheck.hideExample) {
      setRevealedExamples(new Set(ids));
    }
  };

  const handleMaskAll = () => {
    setRevealedExpressions(new Set());
    setRevealedExamples(new Set());
  };

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: FormulaEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleSaveFormula = (draft: FormulaDraft, editingId: string | null) => {
    if (editingId) {
      setEntries((prev) => updateFormula(prev, editingId, draft));
      setStatusMessage(`Đã cập nhật "${draft.title.trim()}".`);
    } else {
      setEntries((prev) => createFormula(prev, draft));
      setStatusMessage(`Đã thêm "${draft.title.trim()}" vào sổ tay.`);
      if (activeTab === 'data') {
        setActiveTab('all');
      }
    }
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteFormula = (id: string) => {
    const target = entries.find((item) => item.id === id);
    setEntries((prev) => deleteFormula(prev, id));
    if (target) {
      setStatusMessage(`Đã xóa "${target.title}" khỏi sổ tay.`);
    }
  };

  const handleTogglePriority = (id: string) => {
    setEntries((prev) => togglePriority(prev, id));
  };

  const handleImportEntries = (incoming: FormulaEntry[], mode: JsonImportMode) => {
    const result = applyImportedFormulas(entries, incoming, mode);
    setEntries(result.nextEntries);
    setFilter(DEFAULT_FILTER_STATE);
    return {
      addedCount: result.addedCount,
      updatedCount: result.updatedCount,
    };
  };

  const handleRestoreSeedData = () => {
    setEntries(SEED_FORMULAS);
    setFilter(DEFAULT_FILTER_STATE);
    setRevealedExpressions(new Set());
    setRevealedExamples(new Set());
  };

  const emptyStateMode =
    entries.length === 0
      ? 'empty-bank'
      : activeTab === 'priority' && scopeEntries.length === 0
        ? 'no-priority'
        : 'no-search-results';

  return (
    <div className="min-h-full bg-canvas pb-12">
      <Header
        activeTab={activeTab}
        priorityCount={priorityCount}
        onSelectTab={handleSelectTab}
        onOpenCreate={handleOpenCreate}
      />

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-success/25 bg-success-soft px-4 py-3 text-sm font-medium text-success"
          >
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-sm font-medium underline hover:opacity-80"
            >
              Đóng
            </button>
          </div>
        )}

        {activeTab === 'data' ? (
          <DataPortView
            entries={entries}
            onImportEntries={handleImportEntries}
            onRestoreSeedData={handleRestoreSeedData}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink text-balance">
                {activeTab === 'priority'
                  ? 'Ưu tiên ôn tập'
                  : 'Sổ tay công thức và quy tắc'}
              </h1>
              <p className="text-base text-ink-secondary">
                {activeTab === 'priority'
                  ? 'Các công thức quan trọng hoặc hay quên đã được đánh dấu để bạn tự kiểm tra lại.'
                  : 'Tra cứu nhanh công thức, ý nghĩa đại lượng và ví dụ mẫu theo từng môn học và chủ đề.'}
              </p>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
              <Sidebar
                totalCount={scopeEntries.length}
                subjectSummaries={subjectSummaries}
                availableTopics={availableTopics}
                selectedSubject={filter.subject}
                selectedTopic={filter.topic}
                onSelectSubject={handleSelectSubject}
                onSelectTopic={handleSelectTopic}
              />

              <div className="min-w-0 flex-1 space-y-5">
                <Toolbar
                  query={filter.query}
                  onQueryChange={(value) =>
                    setFilter((prev) => ({ ...prev, query: value }))
                  }
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  quickCheck={quickCheck}
                  onToggleHideExpression={handleToggleHideExpression}
                  onToggleHideExample={handleToggleHideExample}
                  hasRevealedAny={hasRevealedAny}
                  onRevealAll={handleRevealAll}
                  onMaskAll={handleMaskAll}
                  visibleCount={visibleEntries.length}
                  totalInScopeCount={scopeEntries.length}
                  hasActiveFilters={hasActiveFilters}
                  onResetFilters={handleResetFilters}
                />

                {visibleEntries.length === 0 ? (
                  <EmptyState
                    mode={emptyStateMode}
                    query={filter.query}
                    onResetFilters={handleResetFilters}
                    onOpenCreate={handleOpenCreate}
                    onGoToAll={() => handleSelectTab('all')}
                  />
                ) : (
                  <div className="space-y-4">
                    {visibleEntries.map((entry) => (
                      <FormulaCard
                        key={entry.id}
                        entry={entry}
                        hideExpression={quickCheck.hideExpression}
                        hideExample={quickCheck.hideExample}
                        isExpressionRevealed={revealedExpressions.has(entry.id)}
                        isExampleRevealed={revealedExamples.has(entry.id)}
                        onToggleRevealExpression={handleToggleRevealExpression}
                        onToggleRevealExample={handleToggleRevealExample}
                        onTogglePriority={handleTogglePriority}
                        onEdit={handleOpenEdit}
                        onDelete={handleDeleteFormula}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <FormulaModal
        isOpen={isModalOpen}
        editingEntry={editingEntry}
        existingSubjects={allExistingSubjects}
        existingTopics={allExistingTopics}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveFormula}
      />
    </div>
  );
}
