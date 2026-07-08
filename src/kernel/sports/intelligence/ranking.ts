export type ScoreRankable = {
  statScore: number;
};

export function rankByScore<T extends ScoreRankable>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => b.statScore - a.statScore,
  );
}
