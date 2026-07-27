/**
 * Layer 11 — Batter vs. Pitcher (BvP)
 *
 * Very small weight (2–3%) because small samples are misleading.
 * We use it for directional signal only, never for primary ranking.
 *
 * BvP Score =
 *   IF samplePAs >= MIN_SAMPLE:
 *     Normalise(hrPerPA, 0, MAX_HR_PER_PA) × 60
 *     + Normalise(slugging, 0, 1.000) × 25
 *     + Normalise(obp, 0, 1.000) × 15
 *   ELSE:
 *     50 (neutral — insufficient sample)
 *
 * Confidence weight scales linearly from 0 at MIN_SAMPLE to 1.0 at FULL_SAMPLE.
 * Below MIN_SAMPLE → score is discarded (neutral 50, edge = 'Neutral').
 */

export interface BvPInputs {
  /** Career plate appearances vs this specific pitcher */
  paVsPitcher: number;
  /** Career home runs vs this specific pitcher */
  hrsVsPitcher: number;
  /** Career slugging % vs this pitcher */
  sluggingVsPitcher: number;
  /** Career OBP vs this pitcher */
  obpVsPitcher: number;
}

export interface BvPResult {
  score: number;        // 0–100
  sampleSize: number;   // PA count
  hrPerPA: number;      // HRs / PA
  slugging: number;
  obp: number;
  sampleWeight: number; // 0–1: how much to trust this score
  edge: 'Positive' | 'Neutral' | 'Negative';
  label: string;
  insufficientSample: boolean;
}

const MIN_SAMPLE = 8;    // Below this → discard (neutral)
const FULL_SAMPLE = 40;  // At this PA count → full weight
const MAX_HR_PER_PA = 0.15; // ~1 HR per 6–7 PA = historically elite for a matchup

function norm(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function calculateBvPScore(inputs: BvPInputs): BvPResult {
  const { paVsPitcher, hrsVsPitcher, sluggingVsPitcher, obpVsPitcher } = inputs;
  const hrPerPA = paVsPitcher > 0 ? hrsVsPitcher / paVsPitcher : 0;

  if (paVsPitcher < MIN_SAMPLE) {
    return {
      score: 50,
      sampleSize: paVsPitcher,
      hrPerPA,
      slugging: sluggingVsPitcher,
      obp: obpVsPitcher,
      sampleWeight: 0,
      edge: 'Neutral',
      label: '📊 Insufficient BvP Sample',
      insufficientSample: true,
    };
  }

  const raw =
    norm(hrPerPA, 0, MAX_HR_PER_PA) * 0.60 +
    norm(sluggingVsPitcher, 0.200, 0.900) * 0.25 +
    norm(obpVsPitcher, 0.200, 0.600) * 0.15;

  const score = Math.round(raw * 100);

  // Sample weight — scales 0 → 1 between MIN_SAMPLE and FULL_SAMPLE
  const sampleWeight = Math.min(1, (paVsPitcher - MIN_SAMPLE) / (FULL_SAMPLE - MIN_SAMPLE));

  const edge: BvPResult['edge'] =
    score >= 65 ? 'Positive' :
    score <= 38 ? 'Negative' :
    'Neutral';

  const label =
    score >= 75 ? `✅ Owns This Pitcher (${paVsPitcher} PA)` :
    score >= 58 ? `📈 Positive History (${paVsPitcher} PA)` :
    score >= 42 ? `➡️ Neutral History (${paVsPitcher} PA)` :
    `📉 Struggles vs. This Pitcher (${paVsPitcher} PA)`;

  return {
    score,
    sampleSize: paVsPitcher,
    hrPerPA,
    slugging: sluggingVsPitcher,
    obp: obpVsPitcher,
    sampleWeight,
    edge,
    label,
    insufficientSample: false,
  };
}
