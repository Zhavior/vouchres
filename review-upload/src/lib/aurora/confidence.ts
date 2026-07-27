const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

export function calculateConfidence(score: number): number {
  return clamp(Math.round(score));
}
