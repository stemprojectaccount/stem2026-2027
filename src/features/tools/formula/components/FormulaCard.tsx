import { useState } from 'react';
import { Bookmark, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import type { FormulaEntry } from '../core';

interface FormulaCardProps {
  entry: FormulaEntry;
  hideExpression: boolean;
  hideExample: boolean;
  isExpressionRevealed: boolean;
  isExampleRevealed: boolean;
  onToggleRevealExpression: (id: string) => void;
  onToggleRevealExample: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onEdit: (entry: FormulaEntry) => void;
  onDelete: (id: string) => void;
}

export function FormulaCard({
  entry,
  hideExpression,
  hideExample,
  isExpressionRevealed,
  isExampleRevealed,
  onToggleRevealExpression,
  onToggleRevealExample,
  onTogglePriority,
  onEdit,
  onDelete,
}: FormulaCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const expressionMasked = hideExpression && !isExpressionRevealed;
  const exampleMasked = hideExample && !isExampleRevealed;

  return (
    <article
      data-testid="formula-card"
      data-formula-id={entry.id}
      className="rounded-xl border border-border bg-surface p-5 sm:p-6 transition-colors"
    >
      {/* Top metadata & actions row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <span className="font-medium text-accent">{entry.subject}</span>
            <span aria-hidden="true">·</span>
            <span>{entry.topic}</span>
            {entry.isPriority && (
              <>
                <span aria-hidden="true" className="sm:hidden">·</span>
                <span className="font-medium text-priority sm:hidden">
                  Ưu tiên ôn tập
                </span>
              </>
            )}
          </div>
          <h2 className="mt-1.5 text-lg font-semibold leading-snug text-ink text-balance">
            {entry.title}
          </h2>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onTogglePriority(entry.id)}
            aria-pressed={entry.isPriority}
            aria-label={
              entry.isPriority
                ? `Bỏ đánh dấu ưu tiên: ${entry.title}`
                : `Đánh dấu ưu tiên ôn tập: ${entry.title}`
            }
            title={entry.isPriority ? 'Bỏ ưu tiên ôn tập' : 'Đánh dấu ưu tiên ôn tập'}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors ${
              entry.isPriority
                ? 'bg-priority-soft text-priority hover:bg-priority-border/40'
                : 'text-ink-muted hover:bg-surface-subtle hover:text-ink'
            }`}
          >
            <Bookmark
              className={`h-4 w-4 shrink-0 ${entry.isPriority ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline whitespace-nowrap">
              {entry.isPriority ? 'Ưu tiên ôn tập' : 'Ưu tiên'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(entry)}
            aria-label={`Chỉnh sửa: ${entry.title}`}
            title="Chỉnh sửa"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setConfirmingDelete((prev) => !prev)}
            aria-expanded={confirmingDelete}
            aria-label={`Xóa: ${entry.title}`}
            title="Xóa mục này"
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              confirmingDelete
                ? 'bg-danger-soft text-danger'
                : 'text-ink-muted hover:bg-danger-soft hover:text-danger'
            }`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Inline delete confirmation */}
      {confirmingDelete && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-sm"
        >
          <p className="font-medium text-danger">
            Xóa công thức "{entry.title}" khỏi sổ tay?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="min-h-10 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="min-h-10 rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      )}

      {/* Expression / Main Rule block */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink-secondary">
            Biểu thức / Quy tắc
          </span>
          {hideExpression && isExpressionRevealed && (
            <button
              type="button"
              onClick={() => onToggleRevealExpression(entry.id)}
              aria-label={`Che lại công thức: ${entry.title}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover hover:underline"
            >
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Che lại</span>
            </button>
          )}
        </div>

        {expressionMasked ? (
          <button
            type="button"
            onClick={() => onToggleRevealExpression(entry.id)}
            aria-label={`Xem công thức bị che: ${entry.title}`}
            className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-dashed border-border-strong bg-surface-subtle px-4 py-3 text-left text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:bg-accent-soft/50 hover:text-accent"
          >
            <span>Tự nhẩm lại công thức rồi bấm để xem đáp án</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-accent">
              <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Xem công thức</span>
            </span>
          </button>
        ) : (
          <div
            data-testid="formula-expression"
            className="rounded-lg bg-surface-subtle px-4 py-3.5 font-mono text-base font-medium leading-relaxed text-ink whitespace-pre-wrap break-words"
          >
            {entry.expression}
          </div>
        )}
      </div>

      {/* Meaning & notes */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-ink-secondary">
          Ý nghĩa đại lượng &amp; lưu ý áp dụng
        </h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink whitespace-pre-wrap">
          {entry.explanation}
        </p>
      </div>

      {/* Short worked example */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-ink-secondary">Ví dụ minh họa</h3>
          {hideExample && isExampleRevealed && (
            <button
              type="button"
              onClick={() => onToggleRevealExample(entry.id)}
              aria-label={`Che lại ví dụ: ${entry.title}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover hover:underline"
            >
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Che lại</span>
            </button>
          )}
        </div>

        {exampleMasked ? (
          <button
            type="button"
            onClick={() => onToggleRevealExample(entry.id)}
            aria-label={`Xem ví dụ bị che: ${entry.title}`}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-dashed border-border-strong bg-surface-subtle px-4 py-2.5 text-left text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:bg-accent-soft/50 hover:text-accent"
          >
            <span>Tự thử giải ví dụ trước khi mở đáp án</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-accent">
              <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Xem ví dụ</span>
            </span>
          </button>
        ) : (
          <p
            data-testid="formula-example"
            className="text-[15px] leading-relaxed text-ink whitespace-pre-wrap"
          >
            {entry.example}
          </p>
        )}
      </div>
    </article>
  );
}
