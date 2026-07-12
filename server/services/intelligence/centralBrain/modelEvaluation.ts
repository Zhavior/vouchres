export interface EvaluatedPrediction {
  probability: number;
  outcome: 0 | 1;
}

export interface CalibrationBucket {
  lowerBound: number;
  upperBound: number;
  count: number;
  meanProbability: number;
  observedRate: number;
  calibrationGap: number;
}

export interface ModelEvaluation {
  samples: number;
  positives: number;
  brierScore: number;
  logLoss: number;
  calibrationError: number;
  buckets: CalibrationBucket[];
}

export interface PromotionDecision {
  promote: boolean;
  reasons: string[];
  challenger: ModelEvaluation;
  incumbent: ModelEvaluation;
}

const EPSILON = 1e-6;

function probability(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Prediction probability must be finite.");
  return Math.max(EPSILON, Math.min(1 - EPSILON, value));
}

function rounded(value: number): number {
  return Number(value.toFixed(6));
}

export function evaluateBinaryPredictions(
  predictions: EvaluatedPrediction[],
  bucketCount = 10,
): ModelEvaluation {
  if (!Number.isInteger(bucketCount) || bucketCount < 2 || bucketCount > 20) {
    throw new Error("bucketCount must be an integer between 2 and 20.");
  }

  if (!predictions.length) {
    return { samples: 0, positives: 0, brierScore: 0, logLoss: 0, calibrationError: 0, buckets: [] };
  }

  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    lowerBound: index / bucketCount,
    upperBound: (index + 1) / bucketCount,
    probabilities: [] as number[],
    outcomes: [] as number[],
  }));

  let brier = 0;
  let logLoss = 0;
  let positives = 0;

  for (const item of predictions) {
    if (item.outcome !== 0 && item.outcome !== 1) throw new Error("Prediction outcome must be 0 or 1.");
    const p = probability(item.probability);
    brier += (p - item.outcome) ** 2;
    logLoss += -(item.outcome * Math.log(p) + (1 - item.outcome) * Math.log(1 - p));
    positives += item.outcome;
    const bucketIndex = Math.min(bucketCount - 1, Math.floor(p * bucketCount));
    buckets[bucketIndex].probabilities.push(p);
    buckets[bucketIndex].outcomes.push(item.outcome);
  }

  const populated: CalibrationBucket[] = buckets
    .filter((bucket) => bucket.probabilities.length)
    .map((bucket) => {
      const count = bucket.probabilities.length;
      const meanProbability = bucket.probabilities.reduce((sum, value) => sum + value, 0) / count;
      const observedRate = bucket.outcomes.reduce((sum, value) => sum + value, 0) / count;
      return {
        lowerBound: bucket.lowerBound,
        upperBound: bucket.upperBound,
        count,
        meanProbability: rounded(meanProbability),
        observedRate: rounded(observedRate),
        calibrationGap: rounded(Math.abs(meanProbability - observedRate)),
      };
    });

  const calibrationError = populated.reduce(
    (sum, bucket) => sum + (bucket.count / predictions.length) * bucket.calibrationGap,
    0,
  );

  return {
    samples: predictions.length,
    positives,
    brierScore: rounded(brier / predictions.length),
    logLoss: rounded(logLoss / predictions.length),
    calibrationError: rounded(calibrationError),
    buckets: populated,
  };
}

export function decideModelPromotion(input: {
  challenger: EvaluatedPrediction[];
  incumbent: EvaluatedPrediction[];
  minimumSamples?: number;
  minimumBrierImprovement?: number;
  maximumCalibrationRegression?: number;
}): PromotionDecision {
  if (input.challenger.length !== input.incumbent.length) {
    throw new Error("Challenger and incumbent must be evaluated on the same observations.");
  }

  const challenger = evaluateBinaryPredictions(input.challenger);
  const incumbent = evaluateBinaryPredictions(input.incumbent);
  const minimumSamples = input.minimumSamples ?? 250;
  const minimumBrierImprovement = input.minimumBrierImprovement ?? 0.005;
  const maximumCalibrationRegression = input.maximumCalibrationRegression ?? 0.01;
  const reasons: string[] = [];

  if (challenger.samples < minimumSamples) reasons.push(`Needs at least ${minimumSamples} out-of-sample observations.`);
  if (challenger.positives < 20) reasons.push("Needs at least 20 positive outcomes to judge rare-event behavior.");
  if (incumbent.brierScore - challenger.brierScore < minimumBrierImprovement) {
    reasons.push(`Brier score improvement must be at least ${minimumBrierImprovement}.`);
  }
  if (challenger.logLoss >= incumbent.logLoss) reasons.push("Challenger log loss does not beat the incumbent.");
  if (challenger.calibrationError - incumbent.calibrationError > maximumCalibrationRegression) {
    reasons.push("Challenger calibration regresses beyond the allowed tolerance.");
  }

  return { promote: reasons.length === 0, reasons, challenger, incumbent };
}
