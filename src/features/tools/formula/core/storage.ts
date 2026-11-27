import { DEFAULT_SORT_OPTION } from './formulaEngine';
import { parseFormulasFromJson } from './jsonCodec';
import { SEED_FORMULAS } from './seedData';
import { EXTRA_FORMULAS } from './extraSeed';

const EXTRA_MERGED_KEY = 'formulabank.extra-merged.v1';
import type { FormulaEntry, FormulaSortOption, QuickCheckConfig } from './types';

export const STORAGE_KEYS = {
  formulas: 'formulabank.entries.v1',
  quickCheck: 'formulabank.quickcheck.v1',
  sortBy: 'formulabank.sort.v1',
} as const;

const VALID_SORT_OPTIONS: readonly FormulaSortOption[] = [
  'newest',
  'title-asc',
  'last-edited',
];

export function loadStoredFormulas(): FormulaEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.formulas);
    if (!raw) {
      return SEED_FORMULAS;
    }
    const parsed = parseFormulasFromJson(raw);
    if (parsed.ok) {
      // One-time: notebooks saved before the SmartStudy version get the added formulas too
      if (!window.localStorage.getItem(EXTRA_MERGED_KEY)) {
        window.localStorage.setItem(EXTRA_MERGED_KEY, '1');
        const have = new Set(parsed.entries.map((e) => e.id));
        return [...parsed.entries, ...EXTRA_FORMULAS.filter((e) => !have.has(e.id))];
      }
      return parsed.entries;
    }
    return SEED_FORMULAS;
  } catch {
    return SEED_FORMULAS;
  }
}

export function saveStoredFormulas(entries: FormulaEntry[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEYS.formulas, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function loadQuickCheckConfig(): QuickCheckConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.quickCheck);
    if (!raw) {
      return { hideExpression: false, hideExample: false };
    }
    const parsed = JSON.parse(raw) as Partial<QuickCheckConfig>;
    return {
      hideExpression: Boolean(parsed.hideExpression),
      hideExample: Boolean(parsed.hideExample),
    };
  } catch {
    return { hideExpression: false, hideExample: false };
  }
}

export function saveQuickCheckConfig(config: QuickCheckConfig): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEYS.quickCheck, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

export function loadSortOption(): FormulaSortOption {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.sortBy);
    if (raw && (VALID_SORT_OPTIONS as readonly string[]).includes(raw)) {
      return raw as FormulaSortOption;
    }
    return DEFAULT_SORT_OPTION;
  } catch {
    return DEFAULT_SORT_OPTION;
  }
}

export function saveSortOption(sortBy: FormulaSortOption): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEYS.sortBy, sortBy);
    return true;
  } catch {
    return false;
  }
}
