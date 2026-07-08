export type ScoreInput = {
  value: number;
  weight?: number;
};

export function calculateScore({
  value,
  weight = 1,
}: ScoreInput): number {
  return value * weight;
}
