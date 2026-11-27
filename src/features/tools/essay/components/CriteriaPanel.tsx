import { useState } from 'react';
import { ListPlus, Plus, X } from 'lucide-react';
import type { CriterionInput } from '../analyzer';

interface CriteriaPanelProps {
  criteria: CriterionInput[];
  onAddCriteria: (items: string[]) => void;
  onRemoveCriterion: (id: string) => void;
  onClearCriteria: () => void;
}

export function CriteriaPanel({
  criteria,
  onAddCriteria,
  onRemoveCriterion,
  onClearCriteria,
}: CriteriaPanelProps) {
  const [singleInput, setSingleInput] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAddSingle = () => {
    const trimmed = singleInput.trim();
    if (!trimmed) {
      setInputError('Hãy nhập một từ khóa hoặc ý chính trước khi thêm.');
      return;
    }
    setInputError(null);
    onAddCriteria([trimmed]);
    setSingleInput('');
  };

  const handleAddBulk = () => {
    const lines = bulkInput
      .split(/\r?\n|;/)
      .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setInputError('Hãy nhập ít nhất một dòng từ khóa hoặc ý chính.');
      return;
    }

    setInputError(null);
    onAddCriteria(lines);
    setBulkInput('');
    setBulkMode(false);
  };

  return (
    <section
      id="criteria-section"
      aria-labelledby="criteria-heading"
      className="scroll-mt-20 bg-surface border border-line rounded-xl p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h2 id="criteria-heading" className="text-base sm:text-lg font-semibold text-ink">
            Từ khóa mục tiêu &amp; ý chính cần có
          </h2>
          <p className="text-sm text-ink-secondary mt-0.5">
            Thêm từ vựng bắt buộc hoặc luận điểm trong dàn ý để đối chiếu tự động.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setBulkMode((prev) => !prev);
            setInputError(null);
          }}
          className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-medium text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors whitespace-nowrap shrink-0 self-start cursor-pointer"
        >
          <ListPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{bulkMode ? 'Nhập từng dòng' : 'Nhập nhiều dòng'}</span>
        </button>
      </div>

      {!bulkMode ? (
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1">
            <label htmlFor="criterion-single-input" className="sr-only">
              Nhập từ khóa hoặc ý chính cần có
            </label>
            <input
              id="criterion-single-input"
              type="text"
              value={singleInput}
              onChange={(e) => {
                setSingleInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSingle();
                }
              }}
              placeholder="Ví dụ: bảo vệ môi trường, phân loại rác, dẫn chứng thực tế…"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm sm:text-base text-ink placeholder:text-ink-muted bg-canvas/70 border border-line rounded-lg focus:bg-surface focus:border-accent focus:outline-none transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleAddSingle}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ink hover:bg-[#1F2937] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Thêm tiêu chí</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <label htmlFor="criterion-bulk-input" className="block text-sm font-medium text-ink-secondary">
            Mỗi dòng là một từ khóa hoặc ý chính cần kiểm tra:
          </label>
          <textarea
            id="criterion-bulk-input"
            rows={4}
            value={bulkInput}
            onChange={(e) => {
              setBulkInput(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder={'bảo vệ môi trường\nphân loại rác tại nguồn\ntác hại của rác thải nhựa'}
            className="w-full p-3 text-sm sm:text-base leading-relaxed text-ink placeholder:text-ink-muted bg-canvas/70 border border-line rounded-lg focus:bg-surface focus:border-accent focus:outline-none transition-colors"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddBulk}
              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ink hover:bg-[#1F2937] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Thêm danh sách</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkMode(false);
                setInputError(null);
              }}
              className="min-h-[42px] px-3.5 py-2 rounded-lg text-sm font-medium text-ink-secondary hover:bg-surface-subtle transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {inputError && (
        <p role="alert" className="mt-2 text-sm text-alert">
          {inputError}
        </p>
      )}

      {/* List of active criteria — clean rows with subtle dividers instead of pill clutter */}
      {criteria.length > 0 ? (
        <div className="mt-4 pt-3 border-t border-line">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-ink-muted tabular-nums">
              Đang đối chiếu {criteria.length} tiêu chí
            </span>
            <button
              type="button"
              onClick={onClearCriteria}
              className="text-xs font-medium text-ink-secondary hover:text-alert transition-colors cursor-pointer"
            >
              Xóa toàn bộ tiêu chí
            </button>
          </div>

          <ul className="divide-y divide-line" aria-label="Danh sách từ khóa và ý chính đang đối chiếu">
            {criteria.map((item, idx) => (
              <li
                key={item.id}
                className="py-2 flex items-center justify-between gap-3 text-sm text-ink"
              >
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <span className="text-xs font-mono text-ink-muted tabular-nums shrink-0">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span className="break-words">{item.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveCriterion(item.id)}
                  aria-label={`Xóa tiêu chí "${item.text}"`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-ink-muted hover:text-alert hover:bg-alert-soft transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 pt-3 border-t border-line text-sm text-ink-muted">
          Chưa có tiêu chí nào. Bạn có thể nhập từ vựng bắt buộc hoặc các ý chính trong dàn ý để kiểm tra xem bài viết đã nhắc tới đủ chưa.
        </p>
      )}
    </section>
  );
}
