export function expDecayWeight(daysSinceEvent: number, lambda = 0.05): number {
  if (!Number.isFinite(daysSinceEvent) || daysSinceEvent < 0) return 0;
  return Math.exp(-lambda * daysSinceEvent);
}
