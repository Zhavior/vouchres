import { normalizePlayerId } from '../../lib/mlbHeadshot';
import { safeNumber, safeText } from './proLabData';

export interface AuroraGraphCandidate {
  key: string;
  playerId: string | null;
  name: string;
  team: string | null;
  opponent: string | null;
  pitcherName: string | null;
  grade: string | null;
  lineupStatus: 'confirmed' | 'projected' | 'unavailable';
  metrics: {
    hrEdge: number | null;
    hitterPower: number | null;
    pitcherVulnerability: number | null;
    parkFactor: number | null;
  };
}

function nullableText(value: unknown): string | null {
  const text = safeText(value, '');
  return text || null;
}

function lineupStatus(value: unknown): AuroraGraphCandidate['lineupStatus'] {
  const status = safeText(value, '').toLowerCase();
  if (status === 'confirmed') return 'confirmed';
  if (status === 'projected' || status === 'projected_unconfirmed') return 'projected';
  return 'unavailable';
}

export function buildAuroraGraphCandidate(
  row: Record<string, any>,
): AuroraGraphCandidate {
  const name = safeText(row.playerName ?? row.player_name ?? row.name, 'Unknown player');
  const team = nullableText(row.team);
  const opponent = nullableText(row.opponent ?? row.opposingPitcherTeam);
  const playerId = normalizePlayerId(
    row.playerId ?? row.player_id ?? row.mlbId ?? row.mlb_id,
  );
  const gameKey = safeText(row.gamePk ?? row.game_pk ?? row.game_id, 'no-game');

  return {
    key: playerId
      ? `mlb:${playerId}:${gameKey}`
      : `ui:${name}:${team ?? 'no-team'}:${opponent ?? 'no-opponent'}:${gameKey}`,
    playerId,
    name,
    team,
    opponent,
    pitcherName: nullableText(
      row.opponentPitcherName ?? row.opposingPitcher ?? row.pitcherName ?? row.pitcher,
    ),
    grade: nullableText(row.grade),
    lineupStatus: lineupStatus(
      row.lineupStatus ?? row.lineup_status ?? row.projectionType ?? row.projection_type,
    ),
    metrics: {
      hrEdge: safeNumber(row.hrEdge ?? row.hr_edge ?? row.hrScore ?? row.hr_score),
      hitterPower: safeNumber(row.hitterPower ?? row.scoreBreakdown?.hitterPower),
      pitcherVulnerability: safeNumber(
        row.pitcherVulnerability ?? row.scoreBreakdown?.pitcherVulnerability,
      ),
      parkFactor: safeNumber(row.parkFactor ?? row.scoreBreakdown?.parkFactor),
    },
  };
}

export function formatGraphMetric(value: number | null): string {
  return value === null ? 'Unavailable' : String(value);
}

export function lineupStatusLabel(status: AuroraGraphCandidate['lineupStatus']): string {
  if (status === 'confirmed') return 'Confirmed lineup';
  if (status === 'projected') return 'Projected lineup';
  return 'Lineup unavailable';
}
