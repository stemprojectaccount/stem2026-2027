// What a student has already been asked, per game, kept on the device so questions do not
// repeat across sessions. Sent to /api/game-questions, which excludes and re-filters them.
import { normalizeQuestionKey } from "../../data/gameCurriculum";

const MAX_REMEMBERED = 300;

function storageKey(game: string) {
  return `smartstudy_seen_questions_v1:${game}`;
}

export function loadSeen(game: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(game)) || "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string").slice(-MAX_REMEMBERED) : [];
  } catch {
    return [];
  }
}

export function rememberSeen(game: string, items: string[]) {
  const current = loadSeen(game);
  const keys = new Set(current.map(normalizeQuestionKey));
  for (const item of items) {
    const k = normalizeQuestionKey(item);
    if (k && !keys.has(k)) {
      current.push(item);
      keys.add(k);
    }
  }
  try {
    localStorage.setItem(storageKey(game), JSON.stringify(current.slice(-MAX_REMEMBERED)));
  } catch {
    // Storage full or disabled: the in-session list still prevents repeats
  }
}

export function forgetSeen(game: string) {
  try {
    localStorage.removeItem(storageKey(game));
  } catch {
    // ignore
  }
}

export interface GameQuestionsResponse<T> {
  success: boolean;
  questions: T[];
  error?: string;
}

export async function requestGameQuestions<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<T[]> {
  const res = await fetch("/api/game-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  let data: GameQuestionsResponse<T> | null = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON error page
  }
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Chưa tạo được câu hỏi. Kiểm tra mạng rồi thử lại.");
  }
  return data.questions;
}
