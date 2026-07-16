import type { MLBPlayer } from '../../../types';
import type { HrWatchRow, TruthStatus } from '../types/hrWatch';

export type HrBoardFreshness = 'fresh' | 'delayed' | 'stale';

export interface HrDecisionBrief {
  reason: string;
  risk: string;
  lineupLabel: string;
  pitcherLabel: string;
  freshnessLabel: string;
  canAddToSlip: boolean;
  addToSlipBlockReason: string | null;
}

export type HrParlayPickerPlayer = Pick<
  MLBPlayer,
  'id' | 'name' | 'team' | 'position' | 'headshot' | 'propositions'
> & {
  resolvedGamePk?: string;
};

function lineupLabel(status: TruthStatus): string {
  if (status === 'official') return 'Confirmed lineup';
  if (status === 'projected') return 'Projected lineup';
  if (status === 'blocked') return 'Lineup blocked';
  return 'Lineup unverified';
}

function freshnessLabel(freshness: HrBoardFreshness, generatedAt: Date | null): string {
  const prefix = freshness === 'fresh' ? 'Fresh' : freshness === 'delayed' ? 'Delayed' : 'Stale';
  if (!generatedAt || Number.isNaN(generatedAt.getTime())) return `${prefix} · update time unavailable`;

  const ageMinutes = Math.max(0, Math.round((Date.now() - generatedAt.getTime()) / 60_000));
  if (ageMinutes < 1) return `${prefix} · updated now`;
  if (ageMinutes < 60) return `${prefix} · updated ${ageMinutes}m ago`;
  return `${prefix} · updated ${Math.round(ageMinutes / 60)}h ago`;
}

export function buildHrDecisionBrief(
  player: HrWatchRow,
  freshness: HrBoardFreshness,
  generatedAt: Date | null,
  slipActionAvailable = true,
): HrDecisionBrief {
  const hasPlayerId = player.playerId != null && String(player.playerId).trim().length > 0;
  const isBlocked = player.truthStatus === 'blocked';

  return {
    reason: player.reasons[0]?.trim() || 'No model rationale was supplied for this signal.',
    risk: player.warnings[0]?.trim() || 'No specific risk note was supplied. Verify the lineup and market before adding.',
    lineupLabel: lineupLabel(player.truthStatus),
    pitcherLabel: player.pitcherName?.trim() || 'Probable pitcher unavailable',
    freshnessLabel: freshnessLabel(freshness, generatedAt),
    canAddToSlip: slipActionAvailable && hasPlayerId && !isBlocked,
    addToSlipBlockReason: !slipActionAvailable
      ? 'Open the app to build a slip.'
      : isBlocked
        ? 'This signal is blocked and cannot be added.'
        : hasPlayerId
          ? null
          : 'Official player ID unavailable.',
  };
}

export function toHrParlayPickerPlayer(player: HrWatchRow): HrParlayPickerPlayer {
  return {
    id: player.playerId == null ? '' : String(player.playerId),
    name: player.playerName,
    team: player.team,
    position: '',
    headshot: player.headshotUrl ?? '',
    propositions: [],
    ...(player.gamePk == null ? {} : { resolvedGamePk: String(player.gamePk) }),
  };
}
