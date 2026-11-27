// Level curve: each level asks for 75 XP more than the one before (150, 225, 300…), so a student who gets
// 200 XP for a perfect quiz no longer climbs two levels per quiz. Level 10 ≈ 20 perfect quizzes.
const FIRST = 150;
const STEP = 75;

/** XP needed to go from `level` to `level + 1`. */
export const xpForNextLevel = (level: number) => FIRST + STEP * (Math.max(1, level) - 1);

/** Total XP at which `level` starts (level 1 starts at 0). */
export const xpAtLevel = (level: number) => {
  const n = Math.max(1, level) - 1;
  return FIRST * n + (STEP * n * (n - 1)) / 2;
};

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpAtLevel(level + 1) <= Math.max(0, xp)) level++;
  return level;
}

/** Progress inside the current level, for the XP bar. */
export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const into = Math.max(0, xp) - xpAtLevel(level);
  const need = xpForNextLevel(level);
  return { level, into, need, pct: Math.min(100, Math.round((into / need) * 100)) };
}
