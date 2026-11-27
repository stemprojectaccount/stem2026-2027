// English Pop topic "Sổ từ của tôi": questions from the student's word book
// (right meaning + 3 meanings of other saved words). Words due for review come first.
import type { VocabQuestion } from "./types";

export const WORDBOOK_TOPIC = "wordbook";
const shortMeaning = (m: string) => m.split(/[;(]/)[0].replace(/[.,]+$/, "").trim().slice(0, 48);

export async function wordbookVocab(): Promise<Omit<VocabQuestion, "id" | "difficulty">[]> {
  const [{ listWordbook }, { withVietnamese }, { cardOf }] = await Promise.all([
    import("../../features/dictionary/dictStore"),
    import("../../features/dictionary/offlineDict"),
    import("../../features/dictionary/review"),
  ]);
  const items = await listWordbook();
  const rows = (
    await Promise.all(
      items.map(async (it) => {
        const entry = await withVietnamese(it.entry).catch(() => it.entry);
        const pos = entry.partsOfSpeech[0];
        const sense = pos?.senses[0];
        const meaning = shortMeaning(sense?.meaningVi || "");
        return { word: entry.word, meaning, pos: pos?.posVi || pos?.pos, example: sense?.examples[0], due: cardOf(it).due.getTime() };
      })
    )
  ).filter((r) => r.meaning);
  if (rows.length < 4) return [];
  rows.sort((a, b) => a.due - b.due);
  const shuffle = <T,>(a: T[]) => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  return rows.map((r) => {
    const others = shuffle(rows.filter((o) => o.word !== r.word && o.meaning.toLowerCase() !== r.meaning.toLowerCase()).map((o) => o.meaning));
    const options = shuffle([r.meaning, ...[...new Set(others)].slice(0, 3)]);
    return {
      type: "translate" as const,
      word: r.word,
      partOfSpeech: r.pos,
      options,
      answer: r.meaning,
      example: r.example?.en,
      exampleVi: r.example?.vi,
      textToRead: r.word,
      source: "local" as const,
    };
  });
}

export async function wordbookSize(): Promise<number> {
  const { listWordbook } = await import("../../features/dictionary/dictStore");
  return (await listWordbook()).length;
}

/**
 * Offline vocabulary questions for a grade / unit (Global Success words + offline dictionary), used when
 * the AI cannot make questions – replaces the old 8 fixed fallback words.
 */
export async function offlineUnitVocab(grade: string, unitId: string, exclude: Set<string>, count = 5): Promise<Omit<VocabQuestion, "id" | "difficulty">[]> {
  const { vocabItems, shuffled } = await import("../shared/offlineGenerators");
  let pool = await vocabItems(grade, unitId === "all" || unitId === WORDBOOK_TOPIC ? undefined : unitId);
  if (pool.length < 4) pool = await vocabItems(grade); // a unit with too few known words: whole grade
  const fresh = shuffled(pool.filter((p) => !exclude.has(p.word.toLowerCase())));
  const list = (fresh.length ? fresh : shuffled(pool)).slice(0, count);
  return list.map((it) => {
    const others = [...new Set(shuffled(pool.filter((o) => o.word !== it.word && o.meaning !== it.meaning)).map((o) => o.meaning))].slice(0, 3);
    const options = shuffled([it.meaning, ...others]);
    return { type: "translate" as const, word: it.word, partOfSpeech: it.pos, options, answer: it.meaning, textToRead: it.word, source: "local" as const };
  });
}
