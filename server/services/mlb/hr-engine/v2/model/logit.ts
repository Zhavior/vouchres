import { clamp } from "../shared/normalize";
import {
  HR_MODEL_PROBABILITY_CEILING,
  HR_MODEL_PROBABILITY_FLOOR,
  HR_MODEL_WEIGHTS_V2,
} from "./weights";

export type HrModelComponentVector = {
  PCQI: number;
  ZFAS: number;
  PVM: number;
  EPV: number;
  OVS: number;
};

export function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

export function buildHrLogit(components: HrModelComponentVector): number {
  return (
    HR_MODEL_WEIGHTS_V2.intercept +
    HR_MODEL_WEIGHTS_V2.pcqi * components.PCQI +
    HR_MODEL_WEIGHTS_V2.zfas * components.ZFAS +
    HR_MODEL_WEIGHTS_V2.pvm * components.PVM +
    HR_MODEL_WEIGHTS_V2.epv * components.EPV +
    HR_MODEL_WEIGHTS_V2.ovs * components.OVS
  );
}

export function applyNoOpCalibration(probability: number): number {
  return probability;
}

export function boundProbability(probability: number): number {
  return clamp(probability, HR_MODEL_PROBABILITY_FLOOR, HR_MODEL_PROBABILITY_CEILING);
}

export function runHrModel(components: HrModelComponentVector) {
  const logitHr = buildHrLogit(components);
  const pRaw = sigmoid(logitHr);
  const pCalibrated = applyNoOpCalibration(pRaw);
  const pModel = boundProbability(pCalibrated);

  return {
    logitHr,
    pRaw,
    pCalibrated,
    pModel,
  };
}
