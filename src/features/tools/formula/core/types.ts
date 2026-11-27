export interface FormulaEntry {
  id: string;
  subject: string;
  topic: string;
  title: string;
  expression: string;
  explanation: string;
  example: string;
  isPriority: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormulaDraft {
  subject: string;
  topic: string;
  title: string;
  expression: string;
  explanation: string;
  example: string;
  isPriority?: boolean;
}

export type FormulaSortOption = 'newest' | 'title-asc' | 'last-edited';

export interface FormulaFilterState {
  query: string;
  subject: string;
  topic: string;
  priorityOnly: boolean;
}

export interface QuickCheckConfig {
  hideExpression: boolean;
  hideExample: boolean;
}

export interface SubjectSummary {
  subject: string;
  count: number;
  topics: { topic: string; count: number }[];
}

export interface ValidationErrors {
  subject?: string;
  topic?: string;
  title?: string;
  expression?: string;
  explanation?: string;
  example?: string;
}

export type JsonImportMode = 'merge' | 'replace';

export interface JsonImportResult {
  ok: boolean;
  entries: FormulaEntry[];
  error?: string;
  warnings: string[];
}
