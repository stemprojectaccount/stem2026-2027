import { ArrowUpDown, Eye, EyeOff, RotateCcw, Search, X } from 'lucide-react';
import type { FormulaSortOption, QuickCheckConfig } from '../core';

interface ToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  sortBy: FormulaSortOption;
  onSortChange: (value: FormulaSortOption) => void;
  quickCheck: QuickCheckConfig;
  onToggleHideExpression: () => void;
  onToggleHideExample: () => void;
  hasRevealedAny: boolean;
  onRevealAll: () => void;
  onMaskAll: () => void;
  visibleCount: number;
  totalInScopeCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function Toolbar({
  query,
  onQueryChange,
  sortBy,
  onSortChange,
  quickCheck,
  onToggleHideExpression,
  onToggleHideExample,
  hasRevealedAny,
  onRevealAll,
  onMaskAll,
  visibleCount,
  totalInScopeCount,
  hasActiveFilters,
  onResetFilters,
}: ToolbarProps) {
  const isQuickCheckActive = quickCheck.hideExpression || quickCheck.hideExample;

  return (
    <section aria-label="Tìm kiếm và chế độ kiểm tra nhanh" className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <label htmlFor="formula-search-input" className="sr-only">
          Tìm kiếm công thức, quy tắc, đại lượng hoặc ví dụ
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <input
          id="formula-search-input"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Tìm công thức, ký hiệu, đại lượng..."
          className="min-h-12 w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-11 text-base text-ink placeholder:text-ink-muted transition-colors focus:border-accent"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Xóa từ khóa tìm kiếm"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Quick check mode bar, sorting control & result count */}
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="text-sm font-medium text-ink-secondary sm:mr-1">
              Kiểm tra nhanh:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleHideExpression}
                aria-pressed={quickCheck.hideExpression}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  quickCheck.hideExpression
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border bg-surface text-ink-secondary hover:border-border-strong hover:text-ink'
                }`}
              >
                {quickCheck.hideExpression ? (
                  <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>Che công thức</span>
              </button>

              <button
                type="button"
                onClick={onToggleHideExample}
                aria-pressed={quickCheck.hideExample}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  quickCheck.hideExample
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border bg-surface text-ink-secondary hover:border-border-strong hover:text-ink'
                }`}
              >
                {quickCheck.hideExample ? (
                  <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>Che ví dụ</span>
              </button>

              {isQuickCheckActive && (
                <button
                  type="button"
                  onClick={hasRevealedAny ? onMaskAll : onRevealAll}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary whitespace-nowrap shrink-0 transition-colors hover:bg-surface-subtle hover:text-ink"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{hasRevealedAny ? 'Che lại tất cả' : 'Mở xem tất cả'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor="formula-sort-select"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary whitespace-nowrap shrink-0"
            >
              <ArrowUpDown className="h-4 w-4 text-ink-muted shrink-0" aria-hidden="true" />
              <span>Sắp xếp:</span>
            </label>
            <select
              id="formula-sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as FormulaSortOption)}
              className="min-h-10 flex-1 sm:flex-none rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-border-strong focus:border-accent"
            >
              <option value="newest">Mới thêm nhất</option>
              <option value="title-asc">Tên (A–Z)</option>
              <option value="last-edited">Sửa gần nhất</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-ink-muted tabular-nums" aria-live="polite">
            Hiển thị <strong className="font-semibold text-ink">{visibleCount}</strong> /{' '}
            {totalInScopeCount} mục
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-sm font-medium text-accent whitespace-nowrap shrink-0 transition-colors hover:text-accent-hover hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
