// Spaced repetition for the word book (Sổ từ) with FSRS (ts-fsrs).
// Each saved word gets an FSRS card the first time it is reviewed (a word never reviewed is "new" and due now).
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";
import type { WordBookItem } from "./types";
import { listWordbook, updateWord } from "./dictStore";

export { Rating };
export const scheduler = fsrs(generatorParameters({ enable_fuzz: true, enable_short_term: true, request_retention: 0.9 }));

/** Cards stored in IndexedDB keep Date objects; JSON copies (backups) have strings – revive both. */
export function cardOf(item: WordBookItem): Card {
  const raw = item.fsrs as (Card & { due: Date | string; last_review?: Date | string }) | undefined;
  if (!raw || raw.due === undefined) return createEmptyCard(new Date(item.addedAt || Date.now()));
  return { ...raw, due: new Date(raw.due), last_review: raw.last_review ? new Date(raw.last_review) : undefined } as Card;
}

const endOfToday = (now: Date) => {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
};

/** Words due for review (due today or earlier, and every word never reviewed), oldest first. */
export async function dueWords(now = new Date(), limit = 20): Promise<WordBookItem[]> {
  const items = await listWordbook();
  const end = endOfToday(now).getTime();
  return items
    .map((it) => ({ it, due: cardOf(it).due.getTime() }))
    .filter((x) => x.due <= end)
    .sort((a, b) => a.due - b.due)
    .slice(0, limit)
    .map((x) => x.it);
}

export async function countDue(now = new Date()): Promise<number> {
  return (await dueWords(now, 10_000)).length;
}

/** Human interval: "10 phút", "1 ngày", "3 tháng". */
export function intervalLabel(from: Date, to: Date): string {
  const min = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60000));
  if (min < 60) return `${min} phút`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} giờ`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} ngày`;
  const m = Math.round(d / 30);
  if (m < 12) return `${m} tháng`;
  return `${Math.round(d / 365)} năm`;
}

/** What each answer would schedule (for the buttons). */
export function previewIntervals(item: WordBookItem, now = new Date()): Record<Grade, string> {
  const preview = scheduler.repeat(cardOf(item), now);
  return {
    [Rating.Again]: intervalLabel(now, preview[Rating.Again].card.due),
    [Rating.Hard]: intervalLabel(now, preview[Rating.Hard].card.due),
    [Rating.Good]: intervalLabel(now, preview[Rating.Good].card.due),
    [Rating.Easy]: intervalLabel(now, preview[Rating.Easy].card.due),
  } as Record<Grade, string>;
}

/** Record an answer: new FSRS card + word status (Đã thuộc when remembered for 3 weeks or more). */
export async function rateWord(item: WordBookItem, grade: Grade, now = new Date()): Promise<WordBookItem | null> {
  const { card } = scheduler.next(cardOf(item), now, grade);
  const status: WordBookItem["status"] = card.state === State.Review && card.scheduled_days >= 21 ? "known" : "learning";
  return updateWord(item.word, { fsrs: card, status });
}
