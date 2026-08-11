export function expDecayWeight(daysSinceEvent: number, lambda = 0.05): number {
  if (!Number.isFinite(daysSinceEvent) || daysSinceEvent < 0) return 0;
  return Math.exp(-lambda * daysSinceEvent);
}

export function decayWeightDaysAgo(daysAgo: number, halfLifeDays = 7): number {
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) return 0;
  return expDecayWeight(daysAgo, Math.LN2 / halfLifeDays);
}
