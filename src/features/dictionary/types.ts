// Shared types for the "Tra từ & Dịch" feature (client + server).

export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface DictSense {
  meaningVi: string;
  meaningEn?: string;
  examples: { en: string; vi: string }[];
  cefr?: Cefr;
}

export interface DictEntry {
  word: string;
  ipaUs?: string;
  ipaUk?: string;
  audioUs?: string; // mp3 link when the dictionary has a real recording
  audioUk?: string;
  partsOfSpeech: { pos: string; posVi: string; senses: DictSense[] }[];
  collocations: { en: string; vi: string }[];
  synonyms: string[];
  antonyms: string[];
  wordFamily: string[];
  memoryTip?: string;
  textbookUnits: { grade: string; unitId: string; label: string }[];
  /** English definitions (dictionary) when the main senses come from the offline Vietnamese dictionary. */
  enDefinitions?: { pos: string; defs: { en: string; example?: string }[] }[];
  source: ("freedict" | "ai" | "offline")[];
  fetchedAt: number;
}

export interface TranslateResult {
  translation: string;
  detectedLang: "en" | "vi" | "other";
  notes: string[];
  alternatives?: string[];
}

export interface WordBookItem {
  word: string;
  addedAt: number;
  entry: DictEntry;
  fsrs?: unknown; // ts-fsrs Card (added in the review step)
  status: "new" | "learning" | "known";
  practiceCount?: number;
  practiceGood?: number;
}
