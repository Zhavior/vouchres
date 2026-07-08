export function calculateConfidence(
  sampleSize: number,
  volatility: number,
): number {
  const sizeFactor = Math.min(sampleSize / 100, 1);
  const volatilityFactor = Math.max(0, 1 - volatility);

  return Number(
    (sizeFactor * volatilityFactor).toFixed(3),
  );
}
