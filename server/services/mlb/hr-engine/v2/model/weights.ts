import type { ModelMetadataV2 } from "../types";

export const HR_MODEL_METADATA_V2: ModelMetadataV2 = {
  modelVersion: "hr-probability-v2-seed",
  trainingWindow: "insufficient-live-outcomes",
  calibrationMethod: "none-pass-through",
  lastValidationDate: "2026-08-10",
  coefficientSet: "seed-equal-weights-uncalibrated",
  featureNormalizationVersion: "v1",
};

export const HR_MODEL_WEIGHTS_V2 = {
  intercept: -2.2,
  pcqi: 1,
  zfas: 1,
  pvm: 1,
  epv: 1,
  ovs: 1,
} as const;

export const HR_MODEL_PROBABILITY_FLOOR = 0.03;
export const HR_MODEL_PROBABILITY_CEILING = 0.4;
