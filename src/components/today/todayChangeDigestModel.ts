import type { HrWatchRow, RiskTier, TruthStatus } from '../../features/hr/types/hrWatch';
import type { DailyMlbReport } from '../../types/mlb';
import type { LiveGameCard } from '../../types/liveGames';

export const TODAY_CHANGE_DIGEST_VERSION = 1 as const;
export const MATERIAL_HR_SCORE_DELTA = 5;
export const MATERIAL_CONFIDENCE_DELTA = 10;

export type TodayChangeKind = 'lineup' | 'game-final' | 'game-status' | 'research';

export interface TodayChange {
  id: string;
  kind: TodayChangeKind;
  subjectId: string;
  title: string;
  detail: string;
  previousValue: string;
  currentValue: string;
  teamIds?: number[];
  playerId?: number | null;
}

interface GameSnapshot {
  gamePk: number;
  matchup: string;
  status: string;
  awayScore: number;
  homeScore: number;
  teamIds: number[];
}

interface PlayerSnapshot {
  stableId: string;
  playerName: string;
  truthStatus: TruthStatus;
  hrScore: number;
  dataConfidence: number | null;
  riskTier: RiskTier;
  playerId: number | null;
  teamId: number | null;
}

export interface TodayChangeSnapshotV1 {
  version: typeof TODAY_CHANGE_DIGEST_VERSION;
  date: string;
  capturedAt: string;
  games: GameSnapshot[];
  players: PlayerSnapshot[];
}

export interface TodayChangeDigestEnvelopeV1 {
  version: typeof TODAY_CHANGE_DIGEST_VERSION;
  accountId: string;
  snapshot: TodayChangeSnapshotV1;
}

const FINAL_STATUS = /final|game over|completed/i;

export function createTodayChangeSnapshot(
  report: DailyMlbReport | null,
  hrRows: HrWatchRow[],
  liveGamesOrCapturedAt: LiveGameCard[] | string = [],
  capturedAtOverride?: string,
): TodayChangeSnapshotV1 {
  const liveGames = Array.isArray(liveGamesOrCapturedAt) ? liveGamesOrCapturedAt : [];
  const capturedAt = typeof liveGamesOrCapturedAt === 'string'
    ? liveGamesOrCapturedAt
    : capturedAtOverride ?? new Date().toISOString();
  const seenPlayers = new Set<string>();
  return {
    version: TODAY_CHANGE_DIGEST_VERSION,
    date: report?.date ?? '',
    capturedAt,
    games: liveGames.length > 0
      ? liveGames.flatMap((game) => {
          const gamePk = Number(game.id);
          if (!Number.isInteger(gamePk)) return [];
          return [{
            gamePk,
            matchup: `${game.awayAbbr || game.awayTeam} at ${game.homeAbbr || game.homeTeam}`,
            status: game.liveStateLabel || game.status,
            awayScore: game.awayScore ?? 0,
            homeScore: game.homeScore ?? 0,
            teamIds: [game.awayTeamId, game.homeTeamId].filter((id): id is number => Number.isInteger(id)),
          }];
        })
      : (report?.games ?? []).map((game) => ({
          gamePk: game.gamePk,
          matchup: `${game.awayTeam.abbreviation || game.awayTeam.name} at ${game.homeTeam.abbreviation || game.homeTeam.name}`,
          status: game.status,
          awayScore: game.score.away,
          homeScore: game.score.home,
          teamIds: [game.awayTeam.teamId, game.homeTeam.teamId],
        })),
    players: hrRows.reduce<PlayerSnapshot[]>((players, row) => {
      if (seenPlayers.has(row.stableId)) return players;
      seenPlayers.add(row.stableId);
      players.push({
        stableId: row.stableId,
        playerName: row.playerName,
        truthStatus: row.truthStatus,
        hrScore: Math.round(row.hrScore),
        dataConfidence: row.dataConfidence === null ? null : Math.round(row.dataConfidence),
        riskTier: row.riskTier,
        playerId: Number.isInteger(Number(row.playerId)) ? Number(row.playerId) : null,
        teamId: null,
      });
      return players;
    }, []),
  };
}

export function buildTodayChangeDigest(
  previous: TodayChangeSnapshotV1 | null,
  current: TodayChangeSnapshotV1,
): TodayChange[] {
  if (!previous) return [];
  if (previous.version !== TODAY_CHANGE_DIGEST_VERSION || current.version !== TODAY_CHANGE_DIGEST_VERSION) return [];
  if (previous.date && current.date && previous.date !== current.date) return [];

  const changes: TodayChange[] = [];
  const previousPlayers = new Map(previous.players.map((player) => [player.stableId, player]));
  const previousGames = new Map(previous.games.map((game) => [game.gamePk, game]));

  // Fixed category and subject order prevents changes from jumping around as rankings refresh.
  const currentPlayers = [...current.players].sort((a, b) => a.stableId.localeCompare(b.stableId));
  const currentGames = [...current.games].sort((a, b) => a.gamePk - b.gamePk);

  for (const player of currentPlayers) {
    const before = previousPlayers.get(player.stableId);
    if (!before || before.truthStatus !== 'projected' || player.truthStatus !== 'official') continue;
    changes.push({
      id: `lineup:${player.stableId}:${before.truthStatus}:${player.truthStatus}`,
      kind: 'lineup',
      subjectId: player.stableId,
      title: `${player.playerName} lineup status changed`,
      detail: player.truthStatus === 'official' && before.truthStatus === 'projected'
        ? 'Projected status is now official.'
        : `Status changed from ${truthLabel(before.truthStatus)} to ${truthLabel(player.truthStatus)}.`,
      previousValue: truthLabel(before.truthStatus),
      currentValue: truthLabel(player.truthStatus),
      playerId: player.playerId,
    });
  }

  for (const game of currentGames) {
    const before = previousGames.get(game.gamePk);
    if (!before || before.status === game.status) continue;
    const becameFinal = !FINAL_STATUS.test(before.status) && FINAL_STATUS.test(game.status);
    changes.push({
      id: `${becameFinal ? 'game-final' : 'game-status'}:${game.gamePk}:${game.status}`,
      kind: becameFinal ? 'game-final' : 'game-status',
      subjectId: String(game.gamePk),
      title: becameFinal ? `${game.matchup} is final` : `${game.matchup} status changed`,
      detail: becameFinal
        ? `Final score: ${game.awayScore}–${game.homeScore}.`
        : `${before.status || 'Status unavailable'} → ${game.status || 'Status unavailable'}`,
      previousValue: before.status || 'Status unavailable',
      currentValue: game.status || 'Status unavailable',
      teamIds: game.teamIds,
    });
  }

  for (const player of currentPlayers) {
    const before = previousPlayers.get(player.stableId);
    if (!before) continue;
    const details: string[] = [];
    const previousValues: string[] = [];
    const currentValues: string[] = [];

    if (Math.abs(player.hrScore - before.hrScore) >= MATERIAL_HR_SCORE_DELTA) {
      details.push(`HR research score: ${before.hrScore} → ${player.hrScore}.`);
      previousValues.push(`Score ${before.hrScore}`);
      currentValues.push(`Score ${player.hrScore}`);
    }
    if (
      player.dataConfidence !== null
      && before.dataConfidence !== null
      && Math.abs(player.dataConfidence - before.dataConfidence) >= MATERIAL_CONFIDENCE_DELTA
    ) {
      details.push(`Data confidence: ${before.dataConfidence} → ${player.dataConfidence}.`);
      previousValues.push(`Confidence ${before.dataConfidence}`);
      currentValues.push(`Confidence ${player.dataConfidence}`);
    }
    if (player.riskTier !== before.riskTier) {
      details.push(`Risk tier: ${before.riskTier} → ${player.riskTier}.`);
      previousValues.push(`Risk ${before.riskTier}`);
      currentValues.push(`Risk ${player.riskTier}`);
    }

    if (details.length > 0) {
      changes.push({
        id: `research:${player.stableId}:${player.hrScore}:${player.dataConfidence ?? 'na'}:${player.riskTier}`,
        kind: 'research',
        subjectId: player.stableId,
        title: `${player.playerName} research changed`,
        detail: details.join(' '),
        previousValue: previousValues.join(' · '),
        currentValue: currentValues.join(' · '),
        playerId: player.playerId,
      });
    }
  }

  return changes;
}

export function todayChangeDigestStorageKey(accountId: string) {
  return `vouchedge.today-change-digest.v${TODAY_CHANGE_DIGEST_VERSION}:${encodeURIComponent(accountId)}`;
}

export function parseTodayChangeDigestEnvelope(raw: string | null, accountId: string): TodayChangeDigestEnvelopeV1 | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<TodayChangeDigestEnvelopeV1>;
    if (
      value.version !== TODAY_CHANGE_DIGEST_VERSION
      || value.accountId !== accountId
      || value.snapshot?.version !== TODAY_CHANGE_DIGEST_VERSION
      || !Array.isArray(value.snapshot.games)
      || !Array.isArray(value.snapshot.players)
    ) return null;
    return value as TodayChangeDigestEnvelopeV1;
  } catch {
    return null;
  }
}

function truthLabel(value: TruthStatus) {
  if (value === 'official') return 'Official';
  if (value === 'projected') return 'Projected';
  if (value === 'blocked') return 'Blocked';
  return 'Unknown';
}
