import { Bookmark, Plus, RotateCcw, SearchX } from 'lucide-react';

interface EmptyStateProps {
  mode: 'no-search-results' | 'no-priority' | 'empty-bank';
  query: string;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onGoToAll: () => void;
}

export function EmptyState({
  mode,
  query,
  onResetFilters,
  onOpenCreate,
  onGoToAll,
}: EmptyStateProps) {
  if (mode === 'no-priority') {
    return (
      <div
        role="status"
        className="rounded-xl border border-border bg-surface px-6 py-12 text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-ink-muted">
          <Bookmark className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-ink">
          Chưa có mục nào trong danh sách ưu tiên ôn tập
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-secondary">
          Khi học, hãy bấm nút Đánh dấu ưu tiên trên những công thức quan trọng hoặc hay
          quên để gom lại ôn nhanh trước giờ kiểm tra.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGoToAll}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Xem tất cả công thức
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'empty-bank') {
    return (
      <div
        role="status"
        className="rounded-xl border border-border bg-surface px-6 py-12 text-center"
      >
        <h2 className="text-lg font-semibold text-ink">Sổ tay chưa có công thức nào</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-secondary">
          Hãy thêm công thức đầu tiên của bạn hoặc nhập danh sách từ tệp JSON trong mục
          Nhập / Xuất JSON.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm công thức mới</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-border bg-surface px-6 py-12 text-center"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-ink-muted">
        <SearchX className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-ink">
        Không tìm thấy công thức phù hợp
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-secondary">
        {query
          ? `Không có mục nào khớp với từ khóa "${query}" trong bộ lọc hiện tại. Hãy thử từ khóa ngắn hơn hoặc đặt lại bộ lọc.`
          : 'Không có công thức nào thuộc môn học và chủ đề bạn đang chọn.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Xóa bộ lọc tìm kiếm</span>
        </button>
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Thêm công thức này</span>
        </button>
      </div>
    </div>
  );
}
