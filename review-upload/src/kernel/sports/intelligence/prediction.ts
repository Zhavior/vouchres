export type PredictionInput = {
  baseline: number;
  adjustment?: number;
  min?: number;
  max?: number;
};

export function generatePrediction({
  baseline,
  adjustment = 0,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
}: PredictionInput): number {
  return Math.min(
    max,
    Math.max(
      min,
      baseline + adjustment,
    ),
  );
}
