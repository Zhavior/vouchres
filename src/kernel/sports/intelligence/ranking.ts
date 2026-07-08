export type Rankable = {
  score: number;
};

export function rankByScore<T extends Rankable>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}
