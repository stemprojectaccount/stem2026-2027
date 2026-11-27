import { HistoryItem } from '../types/document';

const HISTORY_STORAGE_KEY = 'vanban_history_v1';
const MAX_HISTORY_ITEMS = 25;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is HistoryItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        (item.kind === 'pdf' || item.kind === 'image') &&
        Boolean(item.data),
    );
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  const trimmed = items.slice(0, MAX_HISTORY_ITEMS);
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // If large image data URLs exceed storage quota, strip image previews from older entries
    const compact = trimmed.map((item, idx) => {
      if (item.kind === 'image' && idx > 2 && item.data.imageDataUrl) {
        return {
          ...item,
          data: {
            ...item.data,
            imageDataUrl: undefined,
          },
        };
      }
      return item;
    });
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // Ignore persistent quota failures gracefully
    }
  }
}
