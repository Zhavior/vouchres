export type HistoricalStatcastRow = {
  gameId: string;
  gameDate: string;
  firstPitchAt: string | null;
  batterId: number;
  pitcherId: number;
  batterTeam: string | null;
  opponentTeam: string | null;
  parkId: string | null;
  batterHand: "L" | "R" | "S" | null;
  pitcherHand: "L" | "R" | null;
  pitchType: string | null;
  plateAppearanceId: string;
  homeRunOutcome: 0 | 1;
  exitVelocity: number | null;
  launchAngle: number | null;
  barrelFlag: 0 | 1 | null;
  hardHitFlag: 0 | 1 | null;
  sprayDirection: number | null;
  lineupSlot: number | null;
  startingLineupConfirmed: boolean | null;
  source: "Baseball Savant Statcast Search";
  sourceRetrievedAt: string;
  featureCutoffAt: string;
};

export type BacktestSplit = "train" | "calibration" | "test";

export type BacktestFeatureRow = HistoricalStatcastRow & {
  split: BacktestSplit;
  priorBatterPa: number;
  priorBatterHr: number;
  priorBatterHrPerPa: number | null;
  priorBatterBbe: number;
  priorBatterBarrelRate: number | null;
  priorBatterHardHitRate: number | null;
  priorBatterAvgExitVelocity: number | null;
  priorPitcherPa: number;
  priorPitcherHrAllowed: number;
  priorPitcherHrPerPa: number | null;
  dataQuality: "HIGH" | "MEDIUM" | "LOW";
};

export type ChronologicalSplitConfig = {
  trainEnd: string;
  calibrationEnd: string;
};

export type BacktestMetrics = {
  sampleCount: number;
  positiveRate: number | null;
  logLoss: number | null;
  brierScore: number | null;
  meanPrediction: number | null;
  baselineLogLoss: number | null;
  baselineBrierScore: number | null;
  reliability: Array<{ bucket: number; count: number; meanPrediction: number; observedRate: number }>;
  ranking: { topDecileCount: number; topDecileHrRate: number | null; overallHrRate: number | null; lift: number | null };
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function finiteOrNull(value: number | null): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

export function assertChronologicalSplit(config: ChronologicalSplitConfig): void {
  if (!ISO_DATE.test(config.trainEnd) || !ISO_DATE.test(config.calibrationEnd)) {
    throw new Error("Chronological split dates must use YYYY-MM-DD.");
  }
  if (config.trainEnd >= config.calibrationEnd) {
    throw new Error("trainEnd must be before calibrationEnd.");
  }
}

export function splitForDate(date: string, config: ChronologicalSplitConfig): BacktestSplit {
  assertChronologicalSplit(config);
  if (date <= config.trainEnd) return "train";
  if (date <= config.calibrationEnd) return "calibration";
  return "test";
}

export function assertNoFutureLeakage(rows: BacktestFeatureRow[]): void {
  for (const row of rows) {
    const firstPitch = row.firstPitchAt ? Date.parse(row.firstPitchAt) : Date.parse(`${row.gameDate}T00:00:00.000Z`);
    if (Date.parse(row.featureCutoffAt) >= firstPitch) {
      throw new Error(`Feature cutoff must precede first pitch/game date for ${row.plateAppearanceId}.`);
    }
  }
}

type BatterHistory = { pa: number; hr: number; bbe: number; barrels: number; hardHits: number; evTotal: number };
type PitcherHistory = { pa: number; hrAllowed: number };

function quality(row: HistoricalStatcastRow): "HIGH" | "MEDIUM" | "LOW" {
  const core = [row.exitVelocity, row.launchAngle, row.pitchType, row.batterHand, row.pitcherHand];
  if (core.every((value) => value != null)) return "HIGH";
  if (row.pitcherId > 0 && row.batterId > 0) return "MEDIUM";
  return "LOW";
}

export function buildPregameFeatures(
  input: HistoricalStatcastRow[],
  config: ChronologicalSplitConfig,
): BacktestFeatureRow[] {
  assertChronologicalSplit(config);
  const rows = [...input].sort((a, b) =>
    `${a.gameDate}:${a.gameId}:${a.plateAppearanceId}`.localeCompare(`${b.gameDate}:${b.gameId}:${b.plateAppearanceId}`),
  );
  const batters = new Map<number, BatterHistory>();
  const pitchers = new Map<number, PitcherHistory>();
  const output: BacktestFeatureRow[] = [];

  for (let index = 0; index < rows.length;) {
    const gameKey = `${rows[index].gameDate}:${rows[index].gameId}`;
    const gameRows: HistoricalStatcastRow[] = [];
    while (index < rows.length && `${rows[index].gameDate}:${rows[index].gameId}` === gameKey) {
      gameRows.push(rows[index]);
      index += 1;
    }

    // Every PA in a game receives the same pregame state. The game is added to
    // history only after all of its predictions have been materialized.
    for (const row of gameRows) {
    const batter = batters.get(row.batterId) ?? { pa: 0, hr: 0, bbe: 0, barrels: 0, hardHits: 0, evTotal: 0 };
    const pitcher = pitchers.get(row.pitcherId) ?? { pa: 0, hrAllowed: 0 };
    const cutoff = row.firstPitchAt
      ? new Date(Date.parse(row.firstPitchAt) - 1).toISOString()
      : new Date(Date.parse(`${row.gameDate}T00:00:00.000Z`) - 1).toISOString();
    const featureRow: BacktestFeatureRow = {
      ...row,
      split: splitForDate(row.gameDate, config),
      featureCutoffAt: cutoff,
      priorBatterPa: batter.pa,
      priorBatterHr: batter.hr,
      priorBatterHrPerPa: batter.pa ? batter.hr / batter.pa : null,
      priorBatterBbe: batter.bbe,
      priorBatterBarrelRate: batter.bbe ? batter.barrels / batter.bbe : null,
      priorBatterHardHitRate: batter.bbe ? batter.hardHits / batter.bbe : null,
      priorBatterAvgExitVelocity: batter.bbe ? batter.evTotal / batter.bbe : null,
      priorPitcherPa: pitcher.pa,
      priorPitcherHrAllowed: pitcher.hrAllowed,
      priorPitcherHrPerPa: pitcher.pa ? pitcher.hrAllowed / pitcher.pa : null,
      dataQuality: quality(row),
    };
    output.push(featureRow);
    }

    for (const row of gameRows) {
    const batter = batters.get(row.batterId) ?? { pa: 0, hr: 0, bbe: 0, barrels: 0, hardHits: 0, evTotal: 0 };
    const pitcher = pitchers.get(row.pitcherId) ?? { pa: 0, hrAllowed: 0 };
    batter.pa += 1;
    batter.hr += row.homeRunOutcome;
    if (row.exitVelocity != null) {
      batter.bbe += 1;
      batter.evTotal += row.exitVelocity;
      batter.barrels += row.barrelFlag === 1 ? 1 : 0;
      batter.hardHits += row.hardHitFlag === 1 ? 1 : 0;
    }
    batters.set(row.batterId, batter);
    pitcher.pa += 1;
    pitcher.hrAllowed += row.homeRunOutcome;
    pitchers.set(row.pitcherId, pitcher);
    }
  }

  assertNoFutureLeakage(output);
  return output;
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function featureValue(row: BacktestFeatureRow): number[] {
  return [
    1,
    row.priorBatterHrPerPa ?? 0,
    row.priorBatterBarrelRate ?? 0,
    row.priorBatterHardHitRate ?? 0,
    row.priorPitcherHrPerPa ?? 0,
  ];
}

export function fitLogisticCoefficients(rows: BacktestFeatureRow[], iterations = 600, learningRate = 0.08): number[] {
  if (!rows.length) throw new Error("Cannot fit coefficients without rows.");
  const coefficients = [Math.log(0.04 / 0.96), 0, 0, 0, 0];
  for (let iteration = 0; iteration < iterations; iteration++) {
    const gradient = [0, 0, 0, 0, 0];
    for (const row of rows) {
      const features = featureValue(row);
      const prediction = sigmoid(coefficients.reduce((sum, value, index) => sum + value * features[index], 0));
      const error = prediction - row.homeRunOutcome;
      for (let index = 0; index < gradient.length; index++) gradient[index] += error * features[index];
    }
    for (let index = 0; index < coefficients.length; index++) {
      coefficients[index] -= (learningRate * gradient[index]) / rows.length;
    }
  }
  return coefficients;
}

export function predict(row: BacktestFeatureRow, coefficients: number[]): number {
  return sigmoid(featureValue(row).reduce((sum, value, index) => sum + value * coefficients[index], 0));
}

export function calculateMetrics(rows: BacktestFeatureRow[], predictions: number[], baselineRate: number): BacktestMetrics {
  if (rows.length !== predictions.length) throw new Error("Rows and predictions must have equal length.");
  if (!rows.length) return { sampleCount: 0, positiveRate: null, logLoss: null, brierScore: null, meanPrediction: null, baselineLogLoss: null, baselineBrierScore: null, reliability: [], ranking: { topDecileCount: 0, topDecileHrRate: null, overallHrRate: null, lift: null } };
  const clamp = (value: number) => Math.min(1 - 1e-12, Math.max(1e-12, value));
  const logLoss = rows.reduce((sum, row, index) => {
    const p = clamp(predictions[index]);
    return sum - (row.homeRunOutcome * Math.log(p) + (1 - row.homeRunOutcome) * Math.log(1 - p));
  }, 0) / rows.length;
  const brierScore = rows.reduce((sum, row, index) => sum + (predictions[index] - row.homeRunOutcome) ** 2, 0) / rows.length;
  const baseline = clamp(baselineRate);
  const baselineLogLoss = rows.reduce((sum, row) => sum - (row.homeRunOutcome * Math.log(baseline) + (1 - row.homeRunOutcome) * Math.log(1 - baseline)), 0) / rows.length;
  const baselineBrierScore = rows.reduce((sum, row) => sum + (baseline - row.homeRunOutcome) ** 2, 0) / rows.length;
  const bucketed = Array.from({ length: 10 }, (_, bucket) => {
    const members = rows.flatMap((row, index) => Math.min(9, Math.floor(clamp(predictions[index]) * 10)) === bucket ? [{ row, prediction: predictions[index] }] : []);
    return {
      bucket,
      count: members.length,
      meanPrediction: members.length ? members.reduce((sum, member) => sum + member.prediction, 0) / members.length : 0,
      observedRate: members.length ? members.reduce((sum, member) => sum + member.row.homeRunOutcome, 0) / members.length : 0,
    };
  }).filter((bucket) => bucket.count > 0);
  const ranked = rows.map((row, index) => ({ row, prediction: predictions[index] })).sort((a, b) => b.prediction - a.prediction);
  const topDecileCount = Math.max(1, Math.ceil(ranked.length * 0.1));
  const overallHrRate = rows.reduce((sum, row) => sum + row.homeRunOutcome, 0) / rows.length;
  const topDecileHrRate = ranked.slice(0, topDecileCount).reduce((sum, member) => sum + member.row.homeRunOutcome, 0) / topDecileCount;
  return {
    sampleCount: rows.length,
    positiveRate: rows.reduce((sum, row) => sum + row.homeRunOutcome, 0) / rows.length,
    logLoss: finiteOrNull(logLoss),
    brierScore: finiteOrNull(brierScore),
    meanPrediction: predictions.reduce((sum, value) => sum + value, 0) / predictions.length,
    baselineLogLoss: finiteOrNull(baselineLogLoss),
    baselineBrierScore: finiteOrNull(baselineBrierScore),
    reliability: bucketed,
    ranking: {
      topDecileCount,
      topDecileHrRate,
      overallHrRate,
      lift: overallHrRate > 0 ? topDecileHrRate / overallHrRate : null,
    },
  };
}
