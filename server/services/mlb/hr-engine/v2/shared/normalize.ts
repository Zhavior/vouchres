export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(value, 0, 1);
}

export function safeNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeRange(
  value: number | null | undefined,
  min: number,
  max: number,
  fallback = 0,
): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  if (max <= min) return fallback;
  return clamp01((value - min) / (max - min));
}

export function weightedAverage(values: Array<{ value: number; weight: number }>, fallback = 0): number {
  const usable = values.filter(
    (entry) => Number.isFinite(entry.value) && Number.isFinite(entry.weight) && entry.weight > 0,
  );

  if (usable.length === 0) return fallback;

  const totalWeight = usable.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return fallback;

  const weightedSum = usable.reduce((sum, entry) => sum + entry.value * entry.weight, 0);
  return weightedSum / totalWeight;
}

export function shrinkToBaseline(
  observed: number | null | undefined,
  sampleSize: number | null | undefined,
  baseline: number,
  stabilizationSample = 50,
): number {
  if (observed == null || !Number.isFinite(observed)) return baseline;

  const n = safeNumber(sampleSize, 0);
  const weight = clamp01(n / Math.max(1, stabilizationSample));

  return observed * weight + baseline * (1 - weight);
}

export function probabilityToPercentScore(value: number): number {
  return Math.round(clamp01(value) * 100);
}
