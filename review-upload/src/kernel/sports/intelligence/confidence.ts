export function calculateConfidence(
  sampleSize: number,
): number {
  return Math.min(
    88,
    Math.max(
      35,
      Math.round(35 + sampleSize * 1.8),
    ),
  );
}
