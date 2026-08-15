import type { HrWatchBoard, HrWatchRow, TruthStatus } from '../../hr/types/hrWatch';
import { resolveMlbPersonId } from '../../../lib/mlbPersonId';
import { TIER_HIGH_MIN, TIER_MODERATE_MIN, TIER_VERY_HIGH_MIN } from '../constants';
import { americanToImplied } from '../presentHrV10Metric';
import type { ChunkA, MarketOdds, StatcastSummary } from './contracts';

function lineupStatusFromTruth(status: TruthStatus): ChunkA['lineupStatus'] {
  if (status === 'official') return 'confirmed_starter';
  if (status === 'projected') return 'roster';
  return 'unknown';
}

function confidenceLevel(hrIndex: number): ChunkA['score']['confidence']['level'] {
  if (hrIndex >= TIER_VERY_HIGH_MIN) return 'very_high';
  if (hrIndex >= TIER_HIGH_MIN) return 'high';
  if (hrIndex >= TIER_MODERATE_MIN) return 'medium';
  return 'low';
}

function recommendationFor(row: HrWatchRow): string {
  if (row.reasons[0]) return row.reasons[0];
  if (row.truthStatus === 'official') return 'Official lineup on validated HR board';
  if (row.truthStatus === 'projected') return 'Projected — official lineup not posted';
  return 'Lineup truth unavailable';
}

function oddsFromRow(row: HrWatchRow, updatedAt: string): MarketOdds | null {
  if (row.bookOdds == null || !Number.isFinite(row.bookOdds)) return null;
  const implied =
    row.impliedProbability != null && Number.isFinite(row.impliedProbability)
      ? row.impliedProbability
      : americanToImplied(row.bookOdds);
  return {
    price: row.bookOdds,
    impliedProbability: Number(implied.toFixed(3)),
    provider: 'Validated HR board',
    updatedAt,
  };
}

function statcastFromRow(row: HrWatchRow): StatcastSummary | undefined {
  // Extract direct Statcast fields from API / backend payload
  const xslg =
    row.xslg ??
    (typeof row.raw?.xslg === 'number' ? row.raw.xslg : undefined) ??
    (typeof row.raw?.xSLG === 'number' ? row.raw.xSLG : undefined);
  const barrelRate =
    row.barrelRate ??
    (typeof row.raw?.barrelRate === 'number' ? row.raw.barrelRate : undefined) ??
    (typeof row.raw?.barrel_rate === 'number' ? row.raw.barrel_rate : undefined);
  const parkFactor =
    row.parkIndex != null && Number.isFinite(row.parkIndex)
      ? row.parkIndex
      : undefined;

  if (xslg == null && barrelRate == null && parkFactor == null) {
    return undefined;
  }

  return {
    ...(parkFactor != null ? { parkFactor } : {}),
    ...(xslg != null ? { xSLG: xslg } : {}),
    ...(barrelRate != null ? { barrelRate } : {}),
  };
}

function collectRows(board: HrWatchBoard): HrWatchRow[] {
  const byId = new Map<string, HrWatchRow>();
  const take = (row: HrWatchRow) => {
    if (row.truthStatus === 'blocked') return;
    byId.set(String(row.playerId ?? row.stableId), row);
  };
  // Confirmed last so official lineup truth wins over projected duplicates.
  board.all.forEach(take);
  board.curated.forEach(take);
  board.confirmed.forEach(take);
  return [...byId.values()];
}

export function mapHrWatchRowToChunkA(row: HrWatchRow, updatedAt: string): ChunkA {
  const mlbId = resolveMlbPersonId(row.playerId, row.headshotUrl);
  const playerId = mlbId != null ? String(mlbId) : String(row.playerId ?? row.stableId);
  const lineupStatus = lineupStatusFromTruth(row.truthStatus);
  const hrIndex = row.hrScore;
  const now = updatedAt;
  const confidenceScore =
    row.dataConfidence != null && Number.isFinite(row.dataConfidence)
      ? Number((row.dataConfidence / 100).toFixed(2))
      : Number((hrIndex / 100).toFixed(2));

  return {
    playerId,
    identity: {
      id: playerId,
      mlbId: mlbId != null ? String(mlbId) : undefined,
      name: row.playerName,
      teamId: row.team,
      teamAbbreviation: row.team,
    },
    opponentTeamId: row.opponent,
    opposingPitcherId: row.pitcherName ?? 'unknown',
    opposingPitcherName: row.pitcherName?.trim() ? row.pitcherName : 'Pitcher unavailable',
    gameTime: row.gameTime ?? '',
    gameState: {
      gameId: String(row.gamePk ?? row.stableId),
      lifecycle: lineupStatus === 'confirmed_starter' ? 'pregame' : 'lineup_pending',
      gameTime: row.gameTime ?? '',
      homeTeamId: row.team,
      awayTeamId: row.opponent,
      stadiumId: row.venue ?? 'unknown',
      inning: 0,
      inningHalf: 'top',
      scoreDifferential: 0,
      outs: 0,
      runnersOnBase: 0,
    },
    score: {
      hrIndex,
      scoreBasis: lineupStatus === 'confirmed_starter' ? 'confirmed_lineup' : 'roster_baseline',
      confidence: {
        level: confidenceLevel(hrIndex),
        score: confidenceScore,
        reasons: row.reasons,
      },
      primaryRecommendation: recommendationFor(row),
      provenance: {
        generatedAt: now,
        versions: {
          scorer: 'validated_hr_board',
          weather: 'validated_hr_board',
          matchup: 'validated_hr_board',
        },
        freshness: {
          batter: now,
          pitcher: now,
          weather: now,
          odds: now,
        },
      },
    },
    rank: row.rank ?? 0,
    odds: oddsFromRow(row, now),
    statcastSummary: statcastFromRow(row),
    lineupStatus,
    updatedAt: now,
  };
}

export function mapHrWatchBoardToChunkA(board: HrWatchBoard, updatedAt: string): ChunkA[] {
  const mapped = collectRows(board)
    .map((row) => mapHrWatchRowToChunkA(row, updatedAt))
    .sort((a, b) => b.score.hrIndex - a.score.hrIndex);

  mapped.forEach((item, idx) => {
    if (!item.rank) item.rank = idx + 1;
  });

  return mapped;
}
