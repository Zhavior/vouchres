export type WeightedFactor = {
  value: number | null;
  weight: number;
};

export function calculateWeightedScore(
  drivers: WeightedFactor[],
): number {
  let sum = 0;
  let weight = 0;

  for (const driver of drivers) {
    if (driver.value == null) continue;

    sum += driver.value * driver.weight;
    weight += driver.weight;
  }

  return Math.round(weight > 0 ? sum / weight : 0);
}
