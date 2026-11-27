// "Thêm vào Flashcard": copy word-book words into the Flashcards tab (deck "Sổ từ của tôi").
import type { Flashcard } from "../../types";
import type { WordBookItem } from "./types";

const KEY = "smart_study_flashcards";
export const WORDBOOK_DECK_ID = "wordbook";

/** Adds the words that are not in the deck yet; returns how many were added. */
export function addWordsToFlashcards(items: WordBookItem[]): { added: number; skipped: number } {
  let cards: Flashcard[] = [];
  try {
    cards = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(cards)) cards = [];
  } catch {
    cards = [];
  }
  const have = new Set(cards.map((c) => c.id));
  const now = new Date().toISOString();
  let added = 0;
  for (const it of items) {
    const id = `wb-${it.word.toLowerCase()}`;
    if (have.has(id)) continue;
    const meanings = it.entry.partsOfSpeech
      .flatMap((p) => p.senses.slice(0, 2).map((s) => ({ pos: p.posVi || p.pos, m: s.meaningVi || s.meaningEn || "" })))
      .filter((x) => x.m)
      .slice(0, 3);
    if (!meanings.length) continue;
    const ipa = it.entry.ipaUs || it.entry.ipaUk || "";
    cards.push({
      id,
      lessonId: WORDBOOK_DECK_ID,
      lessonTitle: "Sổ từ của tôi",
      front: ipa ? `${it.entry.word}  ${ipa}` : it.entry.word,
      back: meanings.map((x) => `(${x.pos}) ${x.m}`).join("\n"),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: now,
      status: "new",
    });
    have.add(id);
    added++;
  }
  localStorage.setItem(KEY, JSON.stringify(cards));
  return { added, skipped: items.length - added };
}
