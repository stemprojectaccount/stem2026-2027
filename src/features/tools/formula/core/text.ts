/**
 * Normalizes Vietnamese strings for accent-insensitive, case-insensitive search
 * while preserving Unicode NFC normalization for stored display text.
 */
export function normalizeTextForSearch(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanDisplayText(input: string): string {
  return input.normalize('NFC').trim();
}

export function tokenizeQuery(query: string): string[] {
  const normalized = normalizeTextForSearch(query);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}
