// One reward rule for every learning game (also used by GameShell):
// from 3 correct answers in a round: 4 XP + 2 Xu per correct answer, capped at 50 XP / 30 Xu per round.
export const REWARD_RULE = { minCorrect: 3, xpPer: 4, coinsPer: 2, xpCap: 50, coinsCap: 30 } as const;

export const rewardFor = (correct: number) =>
  correct >= REWARD_RULE.minCorrect
    ? { xp: Math.min(REWARD_RULE.xpCap, correct * REWARD_RULE.xpPer), coins: Math.min(REWARD_RULE.coinsCap, correct * REWARD_RULE.coinsPer) }
    : { xp: 0, coins: 0 };

/** For games that pay as answers come in: what to give now so the round total follows rewardFor(). */
export function rewardStep(correctSoFar: number, alreadyGiven: { xp: number; coins: number }) {
  const t = rewardFor(correctSoFar);
  return { xp: Math.max(0, t.xp - alreadyGiven.xp), coins: Math.max(0, t.coins - alreadyGiven.coins) };
}

/** Text like "+8 XP · +4 Xu" (empty parts dropped). */
export function rewardText(r: { xp: number; coins: number }, extra: string[] = []) {
  return [r.xp > 0 ? `+${r.xp} XP` : "", r.coins > 0 ? `+${r.coins} Xu` : "", ...extra].filter(Boolean).join(" · ");
}
