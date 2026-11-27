import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  hasValidationErrors,
  validateFormulaDraft,
  type FormulaDraft,
  type FormulaEntry,
  type ValidationErrors,
} from '../core';

interface FormulaModalProps {
  isOpen: boolean;
  editingEntry: FormulaEntry | null;
  existingSubjects: string[];
  existingTopics: string[];
  onClose: () => void;
  onSave: (draft: FormulaDraft, editingId: string | null) => void;
}

const EMPTY_DRAFT: FormulaDraft = {
  subject: '',
  topic: '',
  title: '',
  expression: '',
  explanation: '',
  example: '',
  isPriority: false,
};

export function FormulaModal({
  isOpen,
  editingEntry,
  existingSubjects,
  existingTopics,
  onClose,
  onSave,
}: FormulaModalProps) {
  const [draft, setDraft] = useState<FormulaDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingEntry) {
      setDraft({
        subject: editingEntry.subject,
        topic: editingEntry.topic,
        title: editingEntry.title,
        expression: editingEntry.expression,
        explanation: editingEntry.explanation,
        example: editingEntry.example,
        isPriority: editingEntry.isPriority,
      });
    } else {
      setDraft(EMPTY_DRAFT);
    }
    setErrors({});
    const timer = window.setTimeout(() => {
      firstInputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [isOpen, editingEntry]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFieldChange = <K extends keyof FormulaDraft>(
    field: K,
    value: FormulaDraft[K]
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof ValidationErrors];
        return next;
      });
    }
  };

  const handleConfirmSave = () => {
    const validation = validateFormulaDraft(draft);
    if (hasValidationErrors(validation)) {
      setErrors(validation);
      return;
    }
    onSave(draft, editingEntry ? editingEntry.id : null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-[1px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="formula-modal-title"
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id="formula-modal-title" className="text-lg font-semibold text-ink">
            {editingEntry ? 'Chỉnh sửa công thức' : 'Thêm công thức hoặc quy tắc mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="field-subject"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Môn học <span className="text-danger">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="field-subject"
                type="text"
                list="subject-suggestions"
                value={draft.subject}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                placeholder="VD: Toán học, Vật lý, Hóa học..."
                aria-invalid={Boolean(errors.subject)}
                className="min-h-11 w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-base text-ink placeholder:text-ink-muted focus:border-accent"
              />
              <datalist id="subject-suggestions">
                {existingSubjects.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              {errors.subject && (
                <p role="alert" className="mt-1 text-sm text-danger">
                  {errors.subject}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="field-topic"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Chủ đề <span className="text-danger">*</span>
              </label>
              <input
                id="field-topic"
                type="text"
                list="topic-suggestions"
                value={draft.topic}
                onChange={(e) => handleFieldChange('topic', e.target.value)}
                placeholder="VD: Đại số, Điện học, Ngữ pháp..."
                aria-invalid={Boolean(errors.topic)}
                className="min-h-11 w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-base text-ink placeholder:text-ink-muted focus:border-accent"
              />
              <datalist id="topic-suggestions">
                {existingTopics.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              {errors.topic && (
                <p role="alert" className="mt-1 text-sm text-danger">
                  {errors.topic}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="field-title"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Tên công thức hoặc quy tắc <span className="text-danger">*</span>
            </label>
            <input
              id="field-title"
              type="text"
              value={draft.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="VD: Công thức tính áp suất chất lỏng"
              aria-invalid={Boolean(errors.title)}
              className="min-h-11 w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-base text-ink placeholder:text-ink-muted focus:border-accent"
            />
            {errors.title && (
              <p role="alert" className="mt-1 text-sm text-danger">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="field-expression"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Biểu thức / Nội dung chính <span className="text-danger">*</span>
            </label>
            <textarea
              id="field-expression"
              rows={2}
              value={draft.expression}
              onChange={(e) => handleFieldChange('expression', e.target.value)}
              placeholder="VD: p = d × h"
              aria-invalid={Boolean(errors.expression)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 font-mono text-base text-ink placeholder:text-ink-muted focus:border-accent"
            />
            {errors.expression && (
              <p role="alert" className="mt-1 text-sm text-danger">
                {errors.expression}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="field-explanation"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Ý nghĩa từng đại lượng hoặc lưu ý áp dụng{' '}
              <span className="text-danger">*</span>
            </label>
            <textarea
              id="field-explanation"
              rows={3}
              value={draft.explanation}
              onChange={(e) => handleFieldChange('explanation', e.target.value)}
              placeholder="VD: p là áp suất chất lỏng (Pa), d là trọng lượng riêng (N/m³), h là độ sâu tính từ mặt thoáng (m)."
              aria-invalid={Boolean(errors.explanation)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted focus:border-accent"
            />
            {errors.explanation && (
              <p role="alert" className="mt-1 text-sm text-danger">
                {errors.explanation}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="field-example"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Ví dụ minh họa ngắn <span className="text-danger">*</span>
            </label>
            <textarea
              id="field-example"
              rows={2}
              value={draft.example}
              onChange={(e) => handleFieldChange('example', e.target.value)}
              placeholder="VD: Nước có d = 10 000 N/m³, tại độ sâu h = 1,5 m ⇒ p = 10 000 × 1,5 = 15 000 Pa."
              aria-invalid={Boolean(errors.example)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted focus:border-accent"
            />
            {errors.example && (
              <p role="alert" className="mt-1 text-sm text-danger">
                {errors.example}
              </p>
            )}
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 pt-1 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={Boolean(draft.isPriority)}
              onChange={(e) => handleFieldChange('isPriority', e.target.checked)}
              className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
            />
            <span>Đánh dấu vào mục ưu tiên ôn tập</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-canvas px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            className="min-h-11 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {editingEntry ? 'Lưu thay đổi' : 'Lưu vào sổ tay'}
          </button>
        </div>
      </div>
    </div>
  );
}
