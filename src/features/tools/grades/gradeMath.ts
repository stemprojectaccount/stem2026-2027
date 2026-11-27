// Điểm trung bình môn theo Thông tư 22/2021/TT-BGDĐT (Điều 9):
//   ĐTBmhk = (Tổng ĐĐGtx + 2 × ĐĐGgk + 3 × ĐĐGck) / (Số ĐĐGtx + 5)
//   ĐTBmcn = (ĐTBmhkI + 2 × ĐTBmhkII) / 3        — làm tròn 1 chữ số thập phân
// Kết quả học tập (khoản 2 Điều 9) cho học kỳ / cả năm, xét trên các môn tính điểm.

export interface TermScores {
  tx: number[]; // điểm đánh giá thường xuyên
  gk: number | null; // giữa kỳ
  ck: number | null; // cuối kỳ
}

export interface SubjectRecord {
  id: string;
  name: string;
  hk1: TermScores;
  hk2: TermScores;
}

export type Rank = "Tốt" | "Khá" | "Đạt" | "Chưa đạt";

export const round1 = (n: number) => Math.round(n * 10 + 1e-9) / 10;

export function isValidScore(n: number) {
  return Number.isFinite(n) && n >= 0 && n <= 10;
}

/** Parses "8 9,5 7.5" / "8; 9" into scores (Vietnamese decimal comma accepted when followed by digits). */
export function parseScores(raw: string): number[] {
  return raw
    .replace(/(\d),(\d)/g, "$1.$2")
    .split(/[\s;,/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter(isValidScore);
}

export function termAverage(t: TermScores): number | null {
  if (t.gk == null || t.ck == null || t.tx.length === 0) return null;
  const sum = t.tx.reduce((a, b) => a + b, 0);
  return round1((sum + 2 * t.gk + 3 * t.ck) / (t.tx.length + 5));
}

export function yearAverage(hk1: number | null, hk2: number | null): number | null {
  if (hk1 == null || hk2 == null) return null;
  return round1((hk1 + 2 * hk2) / 3);
}

/**
 * Smallest final-exam score needed so the term average reaches `target`
 * (null when it is impossible even with 10, 0 when already guaranteed).
 * Uses the rounded average (x.x5 rounds up), like the school report does.
 */
export function neededFinal(t: Pick<TermScores, "tx" | "gk">, target: number): number | null {
  if (t.gk == null || t.tx.length === 0) return null;
  const n = t.tx.length + 5;
  const sum = t.tx.reduce((a, b) => a + b, 0) + 2 * t.gk;
  // raw average ≥ target − 0.05 is enough because the result is rounded to 1 decimal
  const raw = ((target - 0.05) * n - sum) / 3;
  if (raw > 10 + 1e-9) return null;
  // scores are given in steps of 0.25 at most schools; show the next 0.25 step
  return Math.max(0, Math.ceil(raw * 4 - 1e-9) / 4);
}

/** Needed HK II average so the year average reaches target. */
export function neededHk2(hk1: number, target: number): number | null {
  const raw = (3 * (target - 0.05) - hk1) / 2;
  if (raw > 10 + 1e-9) return null;
  return Math.max(0, Math.ceil(raw * 10 - 1e-9) / 10);
}

/** Thông tư 22: kết quả học tập theo điểm các môn tính điểm + các môn nhận xét. */
export function classify(averages: number[], commentFails: number): Rank {
  if (averages.length === 0) return "Chưa đạt";
  const count = (min: number) => averages.filter((a) => a >= min).length;
  const need = Math.min(6, averages.length);
  const min = Math.min(...averages);
  if (commentFails === 0 && min >= 6.5 && count(8) >= need) return "Tốt";
  if (commentFails === 0 && min >= 5 && count(6.5) >= need) return "Khá";
  if (commentFails <= 1 && count(5) >= need && min >= 3.5) return "Đạt";
  return "Chưa đạt";
}

/** Short advice: what keeps the student from the next level. */
export function nextLevelHint(averages: { name: string; avg: number }[], commentFails: number): string | null {
  const values = averages.map((a) => a.avg);
  const rank = classify(values, commentFails);
  if (rank === "Tốt" || averages.length === 0) return null;
  const need = Math.min(6, averages.length);
  if (rank === "Khá") {
    const low = averages.filter((a) => a.avg < 6.5).map((a) => a.name);
    const atEight = values.filter((v) => v >= 8).length;
    const parts: string[] = [];
    if (low.length) parts.push(`nâng ${low.join(", ")} lên từ 6,5`);
    if (atEight < need) parts.push(`có thêm ${need - atEight} môn đạt từ 8,0`);
    if (commentFails) parts.push("đạt tất cả môn đánh giá bằng nhận xét");
    return parts.length ? `Để lên mức Tốt: ${parts.join("; ")}.` : null;
  }
  if (rank === "Đạt") {
    const low = averages.filter((a) => a.avg < 5).map((a) => a.name);
    const atSix5 = values.filter((v) => v >= 6.5).length;
    const parts: string[] = [];
    if (low.length) parts.push(`nâng ${low.join(", ")} lên từ 5,0`);
    if (atSix5 < need) parts.push(`có thêm ${need - atSix5} môn đạt từ 6,5`);
    if (commentFails) parts.push("đạt tất cả môn đánh giá bằng nhận xét");
    return parts.length ? `Để lên mức Khá: ${parts.join("; ")}.` : null;
  }
  const veryLow = averages.filter((a) => a.avg < 3.5).map((a) => a.name);
  return veryLow.length
    ? `Để đạt mức Đạt: không môn nào dưới 3,5 (đang thấp: ${veryLow.join(", ")}).`
    : `Để đạt mức Đạt: cần ít nhất ${need} môn từ 5,0 trở lên.`;
}

export const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toFixed(1).replace(".", ","));
export const fmtScore = (n: number) => String(n).replace(".", ",");
