import type { FeatureVector } from "./types";
import { HR_MASTER_MODEL } from "./modelConfig";
import { clamp, sigmoid } from "./normalize";

export function computeLogit(features: FeatureVector): number {
  const { intercept, w_pcqi, w_zfas, w_pvm, w_epv, w_ovs } = HR_MASTER_MODEL.coefficient_set;
  return (
    intercept +
    w_pcqi * features.pcqi +
    w_zfas * features.zfas +
    w_pvm * features.pvm +
    w_epv * features.epv +
    w_ovs * features.ovs
  );
}

export function calibrateProbability(pRaw: number): number {
  const buckets = HR_MASTER_MODEL.calibration_buckets;
  for (const bucket of buckets) {
    if (pRaw <= bucket.raw_max) return bucket.calibrated;
  }
  return buckets[buckets.length - 1].calibrated;
}

export function boundedProbability(pCalibrated: number): number {
  const { min, max } = HR_MASTER_MODEL.probability_bounds;
  return clamp(pCalibrated, min, max);
}

export function computeModelProbability(features: FeatureVector): {
  logit_hr: number;
  p_raw: number;
  p_calibrated: number;
  p_model: number;
} {
  const logit_hr = computeLogit(features);
  const p_raw = sigmoid(logit_hr);
  const p_calibrated = calibrateProbability(p_raw);
  const p_model = boundedProbability(p_calibrated);
  return { logit_hr, p_raw, p_calibrated, p_model };
}
