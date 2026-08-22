import type { HrWatchRow } from '../../hr/types/hrWatch';

export type VerifiedNowRequirement =
  | 'official_lineup'
  | 'game_identity'
  | 'probable_pitcher'
  | 'statcast'
  | 'weather'
  | 'bullpen'
  | 'book_market';

export const VERIFIED_NOW_LABELS: Record<VerifiedNowRequirement, string> = {
  official_lineup: 'Official lineup',
  game_identity: 'Game time',
  probable_pitcher: 'Probable pitcher',
  statcast: 'Statcast',
  weather: 'Weather',
  bullpen: 'Bullpen',
  book_market: 'Book market',
};

export interface VerifiedNowAssessment {
  row: HrWatchRow;
  verified: boolean;
  missing: VerifiedNowRequirement[];
}

export interface VerifiedNowSlate {
  candidates: VerifiedNowAssessment[];
  totalRows: number;
  completeRows: number;
  missingCounts: Record<VerifiedNowRequirement, number>;
}

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function hasText(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !normalized.includes('unavailable') && normalized !== 'tbd';
}

/**
 * "Verified Now" means source-complete enough for a decision card. It does not
 * mean the player will hit a home run. HRPI alone can never pass this gate.
 */
export function assessVerifiedNow(row: HrWatchRow): VerifiedNowAssessment {
  const missing: VerifiedNowRequirement[] = [];

  if (row.truthStatus !== 'official') missing.push('official_lineup');
  if (row.gamePk == null || !hasText(row.gameTime)) missing.push('game_identity');
  if (!hasText(row.pitcherName)) missing.push('probable_pitcher');
  if (!finite(row.avgExitVelo) || !finite(row.barrelRate) || !finite(row.hardHitRate)) missing.push('statcast');
  if (!finite(row.weather)) missing.push('weather');
  if (!finite(row.bullpen)) missing.push('bullpen');
  if (!finite(row.bookOdds) || !finite(row.hrProbability) || !finite(row.impliedProbability) || row.impliedProbability <= 0) {
    missing.push('book_market');
  }

  return { row, verified: missing.length === 0, missing };
}

export function buildVerifiedNowSlate(rows: HrWatchRow[], limit = 5): VerifiedNowSlate {
  const missingCounts = Object.fromEntries(
    (Object.keys(VERIFIED_NOW_LABELS) as VerifiedNowRequirement[]).map((key) => [key, 0]),
  ) as Record<VerifiedNowRequirement, number>;

  const assessments = rows.map(assessVerifiedNow);
  for (const assessment of assessments) {
    for (const requirement of assessment.missing) missingCounts[requirement] += 1;
  }

  const complete = assessments
    .filter((assessment) => assessment.verified && assessment.row.riskTier !== 'Blocked')
    .sort((left, right) => right.row.hrScore - left.row.hrScore);

  return {
    candidates: complete.slice(0, Math.max(0, limit)),
    totalRows: rows.length,
    completeRows: complete.length,
    missingCounts,
  };
}
