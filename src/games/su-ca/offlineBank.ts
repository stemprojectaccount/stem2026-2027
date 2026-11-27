// Sử Ca without AI (no internet / no credit): multiple-choice history questions built from the
// places of "Bản Đồ Sử – Địa" (history clues, by grade) plus the offline study bank.
// CẦN GIÁO VIÊN KIỂM TRA (same content as those two sources).
import { cluesForGrade, PLACES, dist, placeXY } from "../history-map/places";
import { bankQuestions } from "../../data/studyGateBank";
import type { Question } from "./types";

const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

const HISTORY_WORDS = /chiến|năm \d|nhà nước|vua|dời đô|khởi nghĩa|quốc khánh|triều|kháng chiến|lịch sử/i;

export function offlineHistoryQuestions(grade: string): Question[] {
  const g = Number(String(grade).replace(/\D/g, "")) || 6;
  // own grade (and earlier) first; later grades only when the pool is too small
  const history = cluesForGrade(9).filter((c) => c.clue.topic === "Lịch sử").sort((a, b) => a.clue.grade - b.clue.grade);
  const own = history.filter((c) => c.clue.grade <= g);
  const picked = own.length >= 10 ? own : [...own, ...history.filter((c) => c.clue.grade > g).slice(0, 10 - own.length)];
  const fromPlaces: Question[] = picked
    .map((c) => {
      const here = placeXY(c.place);
      const others = shuffle(PLACES.filter((p) => p.id !== c.place.id && dist(placeXY(p), here) > 8)).slice(0, 3);
      const options = shuffle([c.place.name, ...others.map((p) => p.name)]);
      return {
        type: "multiple-choice" as const,
        text: `${c.clue.text}. Sự kiện/di tích này gắn với địa danh nào?`,
        options,
        correctAnswerIndex: options.indexOf(c.place.name),
        explanation: c.clue.explain,
        difficulty: Math.min(6, Math.max(1, c.clue.grade - 4)),
        topic: `Lịch sử · Lớp ${c.clue.grade}`,
        hint: `Nhớ lại bài Lịch sử lớp ${c.clue.grade}: địa danh này ở đâu trên bản đồ?`,
        funFact: c.clue.explain,
        keyFact: `${c.place.name}: ${c.clue.text}`,
      };
    });
  const fromBank: Question[] = bankQuestions("lich-su-dia-ly")
    .filter((q) => HISTORY_WORDS.test(q.question))
    .map((q) => ({
      type: "multiple-choice" as const,
      text: q.question,
      options: q.options,
      correctAnswerIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: 2,
      topic: "Lịch sử",
      hint: "Đọc kĩ câu hỏi và nhớ lại mốc thời gian quan trọng.",
      funFact: q.explanation,
      keyFact: q.question,
    }));
  return shuffle([...fromPlaces, ...fromBank]);
}
