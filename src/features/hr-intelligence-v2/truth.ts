import type { AuroraMaxTruthState } from '../../components/aurora-max/AuroraMaxPrimitives';
import type { HrWatchRow, TruthStatus } from '../hr/types/hrWatch';

export function truthState(status: TruthStatus): AuroraMaxTruthState {
  if (status === 'official') return 'confirmed';
  if (status === 'projected') return 'projected';
  if (status === 'blocked') return 'warning';
  return 'missing';
}

export function truthLabel(status: TruthStatus): string {
  if (status === 'official') return 'Confirmed';
  if (status === 'projected') return 'Projected';
  if (status === 'blocked') return 'Blocked';
  return 'Unverified';
}

export function finite(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function displayTier(row: HrWatchRow): 'Elite' | 'Strong' | 'Watch' | 'Sleepers' | null {
  if (row.riskTier === 'Elite') return 'Elite';
  if (row.riskTier === 'Core') return 'Strong';
  if (row.riskTier === 'Watch') return 'Watch';
  if (row.riskTier === 'Deep') return 'Sleepers';
  return null;
}
