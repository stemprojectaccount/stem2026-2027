import { createFormulaId } from './formulaEngine';
import { cleanDisplayText } from './text';
import type { FormulaEntry, JsonImportMode, JsonImportResult } from './types';

export interface FormulaBankExportPayload {
  app: 'FormulaBank';
  schemaVersion: 1;
  exportedAt: string;
  count: number;
  entries: FormulaEntry[];
}

export function serializeFormulasToJson(
  entries: FormulaEntry[],
  exportedAt: string = new Date().toISOString()
): string {
  const payload: FormulaBankExportPayload = {
    app: 'FormulaBank',
    schemaVersion: 1,
    exportedAt,
    count: entries.length,
    entries,
  };
  return JSON.stringify(payload, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredString(
  obj: Record<string, unknown>,
  field: string
): string | null {
  const value = obj[field];
  if (typeof value !== 'string') return null;
  const cleaned = cleanDisplayText(value);
  return cleaned.length > 0 ? cleaned : null;
}

export function parseFormulasFromJson(
  rawJson: string,
  nowIso: string = new Date().toISOString()
): JsonImportResult {
  const trimmed = rawJson.trim();
  if (!trimmed) {
    return {
      ok: false,
      entries: [],
      error: 'Nội dung JSON đang trống. Hãy chọn tệp hoặc dán dữ liệu JSON.',
      warnings: [],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      entries: [],
      error: 'Tệp không đúng cú pháp JSON. Vui lòng kiểm tra dấu ngoặc và dấu phẩy.',
      warnings: [],
    };
  }

  let rawList: unknown[];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (isRecord(parsed) && Array.isArray(parsed.entries)) {
    rawList = parsed.entries;
  } else {
    return {
      ok: false,
      entries: [],
      error:
        'Cấu trúc JSON không hợp lệ. Cần một mảng công thức hoặc đối tượng có trường "entries".',
      warnings: [],
    };
  }

  if (rawList.length === 0) {
    return {
      ok: false,
      entries: [],
      error: 'Danh sách công thức trong JSON đang rỗng (0 mục).',
      warnings: [],
    };
  }

  const validEntries: FormulaEntry[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  rawList.forEach((item, index) => {
    if (!isRecord(item)) {
      warnings.push(`Mục #${index + 1} bị bỏ qua vì không phải đối tượng hợp lệ.`);
      return;
    }

    const subject = readRequiredString(item, 'subject');
    const topic = readRequiredString(item, 'topic');
    const title = readRequiredString(item, 'title');
    const expression = readRequiredString(item, 'expression');
    const explanation = readRequiredString(item, 'explanation');
    const example = readRequiredString(item, 'example');

    const missing: string[] = [];
    if (!subject) missing.push('subject');
    if (!topic) missing.push('topic');
    if (!title) missing.push('title');
    if (!expression) missing.push('expression');
    if (!explanation) missing.push('explanation');
    if (!example) missing.push('example');

    if (missing.length > 0) {
      warnings.push(
        `Mục #${index + 1} thiếu trường bắt buộc (${missing.join(', ')}) nên đã bị bỏ qua.`
      );
      return;
    }

    let id =
      typeof item.id === 'string' && item.id.trim().length > 0
        ? item.id.trim()
        : createFormulaId('imp');

    if (seenIds.has(id)) {
      id = createFormulaId('imp');
    }
    seenIds.add(id);

    const createdAt =
      typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))
        ? item.createdAt
        : nowIso;
    const updatedAt =
      typeof item.updatedAt === 'string' && !Number.isNaN(Date.parse(item.updatedAt))
        ? item.updatedAt
        : nowIso;

    validEntries.push({
      id,
      subject: subject!,
      topic: topic!,
      title: title!,
      expression: expression!,
      explanation: explanation!,
      example: example!,
      isPriority: Boolean(item.isPriority),
      createdAt,
      updatedAt,
    });
  });

  if (validEntries.length === 0) {
    return {
      ok: false,
      entries: [],
      error:
        'Không có mục công thức nào hợp lệ trong dữ liệu JSON. Mỗi mục cần đủ: subject, topic, title, expression, explanation, example.',
      warnings,
    };
  }

  return {
    ok: true,
    entries: validEntries,
    warnings,
  };
}

export function applyImportedFormulas(
  current: FormulaEntry[],
  incoming: FormulaEntry[],
  mode: JsonImportMode
): { nextEntries: FormulaEntry[]; addedCount: number; updatedCount: number } {
  if (mode === 'replace') {
    return {
      nextEntries: incoming,
      addedCount: incoming.length,
      updatedCount: 0,
    };
  }

  const byId = new Map<string, FormulaEntry>();
  for (const item of current) {
    byId.set(item.id, item);
  }

  let addedCount = 0;
  let updatedCount = 0;
  const newlyAdded: FormulaEntry[] = [];

  for (const item of incoming) {
    if (byId.has(item.id)) {
      byId.set(item.id, item);
      updatedCount += 1;
    } else {
      newlyAdded.push(item);
      addedCount += 1;
    }
  }

  const preservedExisting = current.map((item) => byId.get(item.id) ?? item);
  return {
    nextEntries: [...newlyAdded, ...preservedExisting],
    addedCount,
    updatedCount,
  };
}
