export type PredictionInput = {
  baseline: number;
  adjustment: number;
};

export function generatePrediction({
  baseline,
  adjustment,
}: PredictionInput): number {
  return baseline + adjustment;
}
