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
  pressureBand: 'Cold' | 'Building' | 'Heating Up' | 'High Pressure' | 'Breakout Zone';
  playerState: 'hot' | 'due-watch' | 'building' | 'insufficient-data';
  playerStateLabel: 'Hot' | 'Due Watch' | 'Building' | 'More Data Needed';
  stateExplanation: string;
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

function pressureBand(score: number): HrLensSignal['pressureBand'] {
  if (score >= 80) return 'Breakout Zone';
  if (score >= 60) return 'High Pressure';
  if (score >= 40) return 'Heating Up';
  if (score >= 20) return 'Building';
  return 'Cold';
}

function playerState(row: HrWatchRow): Pick<HrLensSignal, 'playerState' | 'playerStateLabel' | 'stateExplanation'> {
  const games = row.recentGamesChecked;
  const homeRuns = row.recentHomeRuns;
  const hrGames = row.recentHrGames;
  const hasResults = games != null && games >= 3 && homeRuns != null && hrGames != null;
  const hasUnderlyingSignals = validScore(row.hitterPower) && validScore(row.pitcherVulnerability);

  if (!hasResults || !hasUnderlyingSignals) {
    return {
      playerState: 'insufficient-data',
      playerStateLabel: 'More Data Needed',
      stateExplanation: 'Aurora needs verified recent results plus power and matchup inputs before assigning a player state.',
    };
  }

  if (homeRuns >= 2 && hrGames >= 2 && row.hitterPower >= 60 && row.hrScore >= 60) {
    return {
      playerState: 'hot',
      playerStateLabel: 'Hot',
      stateExplanation: `${homeRuns} HR across ${games} recent games, backed by current power and matchup signals.`,
    };
  }

  if (homeRuns === 0 && games >= 5 && row.hitterPower >= 60 && row.pitcherVulnerability >= 55 && row.hrScore >= 60) {
    return {
      playerState: 'due-watch',
      playerStateLabel: 'Due Watch',
      stateExplanation: `0 HR across ${games} recent games while current power and matchup signals remain aligned. Results gap, not a guarantee.`,
    };
  }

  return {
    playerState: 'building',
    playerStateLabel: 'Building',
    stateExplanation: `${homeRuns} HR across ${games} recent games. Current evidence does not support a Hot or Due Watch label yet.`,
  };
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
  const score = Math.max(0, Math.min(100, Math.round(row.hrScore)));
  const state = playerState(row);

  return {
    score,
    confidence,
    truthStatus: row.truthStatus,
    factors,
    strongestFactor,
    completeness: Math.round((factors.length / FACTORS.length) * 100),
    alertEligible: row.truthStatus === 'official' && row.riskTier !== 'Blocked',
    statusLabel,
    tags: tags.slice(0, 4),
    pressureBand: pressureBand(score),
    ...state,
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
