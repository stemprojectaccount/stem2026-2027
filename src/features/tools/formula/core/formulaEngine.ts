import { cleanDisplayText, normalizeTextForSearch, tokenizeQuery } from './text';
import type {
  FormulaDraft,
  FormulaEntry,
  FormulaFilterState,
  FormulaSortOption,
  SubjectSummary,
  ValidationErrors,
} from './types';

export const ALL_FILTER_VALUE = 'ALL';
export const DEFAULT_SORT_OPTION: FormulaSortOption = 'newest';

export const DEFAULT_FILTER_STATE: FormulaFilterState = {
  query: '',
  subject: ALL_FILTER_VALUE,
  topic: ALL_FILTER_VALUE,
  priorityOnly: false,
};

export function validateFormulaDraft(draft: FormulaDraft): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!cleanDisplayText(draft.subject)) {
    errors.subject = 'Vui lòng nhập hoặc chọn môn học.';
  }
  if (!cleanDisplayText(draft.topic)) {
    errors.topic = 'Vui lòng nhập chủ đề.';
  }
  if (!cleanDisplayText(draft.title)) {
    errors.title = 'Vui lòng nhập tên công thức hoặc quy tắc.';
  }
  if (!cleanDisplayText(draft.expression)) {
    errors.expression = 'Vui lòng nhập biểu thức hoặc nội dung chính.';
  }
  if (!cleanDisplayText(draft.explanation)) {
    errors.explanation = 'Vui lòng nhập ý nghĩa đại lượng hoặc lưu ý áp dụng.';
  }
  if (!cleanDisplayText(draft.example)) {
    errors.example = 'Vui lòng nhập một ví dụ minh họa ngắn.';
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function createFormulaId(prefix = 'fb'): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  const timePart = Date.now().toString(36);
  return `${prefix}_${timePart}_${randomPart}`;
}

export function createFormula(
  entries: FormulaEntry[],
  draft: FormulaDraft,
  nowIso: string = new Date().toISOString(),
  id: string = createFormulaId()
): FormulaEntry[] {
  const newEntry: FormulaEntry = {
    id,
    subject: cleanDisplayText(draft.subject),
    topic: cleanDisplayText(draft.topic),
    title: cleanDisplayText(draft.title),
    expression: cleanDisplayText(draft.expression),
    explanation: cleanDisplayText(draft.explanation),
    example: cleanDisplayText(draft.example),
    isPriority: Boolean(draft.isPriority),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  return [newEntry, ...entries];
}

export function updateFormula(
  entries: FormulaEntry[],
  id: string,
  draft: FormulaDraft,
  nowIso: string = new Date().toISOString()
): FormulaEntry[] {
  return entries.map((entry) => {
    if (entry.id !== id) return entry;
    return {
      ...entry,
      subject: cleanDisplayText(draft.subject),
      topic: cleanDisplayText(draft.topic),
      title: cleanDisplayText(draft.title),
      expression: cleanDisplayText(draft.expression),
      explanation: cleanDisplayText(draft.explanation),
      example: cleanDisplayText(draft.example),
      isPriority:
        typeof draft.isPriority === 'boolean' ? draft.isPriority : entry.isPriority,
      updatedAt: nowIso,
    };
  });
}

export function deleteFormula(entries: FormulaEntry[], id: string): FormulaEntry[] {
  return entries.filter((entry) => entry.id !== id);
}

export function togglePriority(
  entries: FormulaEntry[],
  id: string
): FormulaEntry[] {
  return entries.map((entry) =>
    entry.id === id ? { ...entry, isPriority: !entry.isPriority } : entry
  );
}

export function matchesSearchTokens(entry: FormulaEntry, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const searchable = normalizeTextForSearch(
    [
      entry.title,
      entry.subject,
      entry.topic,
      entry.expression,
      entry.explanation,
      entry.example,
    ].join(' ')
  );
  return tokens.every((token) => searchable.includes(token));
}

export function filterFormulas(
  entries: FormulaEntry[],
  filter: FormulaFilterState
): FormulaEntry[] {
  const tokens = tokenizeQuery(filter.query);

  return entries.filter((entry) => {
    if (filter.priorityOnly && !entry.isPriority) {
      return false;
    }
    if (filter.subject !== ALL_FILTER_VALUE && entry.subject !== filter.subject) {
      return false;
    }
    if (filter.topic !== ALL_FILTER_VALUE && entry.topic !== filter.topic) {
      return false;
    }
    return matchesSearchTokens(entry, tokens);
  });
}

function parseTimestamp(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

export function sortFormulas(
  entries: FormulaEntry[],
  sortBy: FormulaSortOption
): FormulaEntry[] {
  const indexed = entries.map((entry, index) => ({ entry, index }));

  indexed.sort((a, b) => {
    if (sortBy === 'title-asc') {
      const cmp = a.entry.title.localeCompare(b.entry.title, 'vi', {
        sensitivity: 'base',
      });
      return cmp !== 0 ? cmp : a.index - b.index;
    }

    if (sortBy === 'last-edited') {
      const diff =
        parseTimestamp(b.entry.updatedAt) - parseTimestamp(a.entry.updatedAt);
      return diff !== 0 ? diff : a.index - b.index;
    }

    const diff =
      parseTimestamp(b.entry.createdAt) - parseTimestamp(a.entry.createdAt);
    return diff !== 0 ? diff : a.index - b.index;
  });

  return indexed.map((item) => item.entry);
}

export function getSubjectSummaries(entries: FormulaEntry[]): SubjectSummary[] {
  const subjectMap = new Map<string, Map<string, number>>();

  for (const entry of entries) {
    let topicMap = subjectMap.get(entry.subject);
    if (!topicMap) {
      topicMap = new Map<string, number>();
      subjectMap.set(entry.subject, topicMap);
    }
    topicMap.set(entry.topic, (topicMap.get(entry.topic) ?? 0) + 1);
  }

  return Array.from(subjectMap.entries())
    .map(([subject, topicMap]) => {
      const topics = Array.from(topicMap.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => a.topic.localeCompare(b.topic, 'vi'));
      const count = topics.reduce((sum, item) => sum + item.count, 0);
      return { subject, count, topics };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject, 'vi'));
}

export function getTopicsForSubject(
  entries: FormulaEntry[],
  subject: string
): { topic: string; count: number }[] {
  const scoped =
    subject === ALL_FILTER_VALUE
      ? entries
      : entries.filter((entry) => entry.subject === subject);

  const counts = new Map<string, number>();
  for (const entry of scoped) {
    counts.set(entry.topic, (counts.get(entry.topic) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => a.topic.localeCompare(b.topic, 'vi'));
}

export function getPriorityCount(entries: FormulaEntry[]): number {
  let count = 0;
  for (const entry of entries) {
    if (entry.isPriority) count += 1;
  }
  return count;
}
