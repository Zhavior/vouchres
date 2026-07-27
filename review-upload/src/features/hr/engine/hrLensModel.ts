import type { HrWatchRow, TruthStatus } from '../types/hrWatch';

export type LensFactor = {
  key: 'power' | 'pitcher' | 'park' | 'form';
  label: string;
  value: number;
};

export type HrLensSignal = {
  score: number;
  confidence: number | null;
  truthStatus: TruthStatus;
  factors: LensFactor[];
  strongestFactor: LensFactor | null;
  completeness: number;
  alertEligible: boolean;
  statusLabel: string;
  tags: string[];
};

const FACTORS = [
  ['power', 'Power', 'hitterPower'],
  ['pitcher', 'Pitcher', 'pitcherVulnerability'],
  ['park', 'Park', 'parkFactor'],
  ['form', 'Form', 'recentForm'],
] as const;

function validScore(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function buildHrLensSignal(row: HrWatchRow): HrLensSignal {
  const factors = FACTORS.flatMap(([key, label, field]) => {
    const value = row[field];
    return validScore(value) ? [{ key, label, value: Math.round(value) }] : [];
  });
  const strongestFactor = factors.reduce<LensFactor | null>(
    (best, factor) => (!best || factor.value > best.value ? factor : best),
    null,
  );
  const confidence = validScore(row.dataConfidence) ? Math.round(row.dataConfidence) : null;
  const statusLabel = row.truthStatus === 'official'
    ? 'Official lineup'
    : row.truthStatus === 'projected'
      ? 'Projection preview'
      : row.truthStatus === 'blocked'
        ? 'Safety blocked'
        : 'Source pending';
  const tags = factors
    .filter((factor) => factor.value >= 75)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((factor) => `${factor.label} ${factor.value >= 90 ? 'driver' : 'edge'}`);
  if (factors.length === FACTORS.length) tags.push('Complete stack');
  if (row.truthStatus === 'official') tags.push('Official alert-ready');
  else if (row.truthStatus === 'projected') tags.push('Lineup pending');

  return {
    score: Math.max(0, Math.min(100, Math.round(row.hrScore))),
    confidence,
    truthStatus: row.truthStatus,
    factors,
    strongestFactor,
    completeness: Math.round((factors.length / FACTORS.length) * 100),
    alertEligible: row.truthStatus === 'official' && row.riskTier !== 'Blocked',
    statusLabel,
    tags: tags.slice(0, 4),
  };
}

export function summarizeHrLens(rows: readonly HrWatchRow[]) {
  const official = rows.filter((row) => row.truthStatus === 'official').length;
  const projected = rows.filter((row) => row.truthStatus === 'projected').length;
  const complete = rows.filter((row) => buildHrLensSignal(row).completeness === 100).length;
  const averageConfidenceValues = rows
    .map((row) => buildHrLensSignal(row).confidence)
    .filter((value): value is number => value !== null);

  return {
    official,
    projected,
    complete,
    averageConfidence: averageConfidenceValues.length
      ? Math.round(averageConfidenceValues.reduce((sum, value) => sum + value, 0) / averageConfidenceValues.length)
      : null,
  };
}
