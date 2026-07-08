import { useEffect, useMemo, useState } from 'react';
import { safeJsonFetch } from '../../api/safeApiClient';
import type {
  NormalizedGamePayload,
  NormalizedPlayerPayload,
} from '../../adapters/normalized';

export type ProLabBoardPayload = Record<string, any> | null;

export type ProLabGameGroup = {
  key: string;
  matchup: string;
  venue: string | null;
  rows: Record<string, any>[];
};

type BoardState = {
  board: ProLabBoardPayload;
  loading: boolean;
  error: string | null;
  source: 'network' | 'fallback';
};

const HR_BOARD_URL = '/api/mlb/hr-board/today?limit=75';

export function useHrBoardProData(): BoardState & {
  rows: Record<string, any>[];
  groups: ProLabGameGroup[];
  topRow: Record<string, any> | null;
  topGame: ProLabGameGroup | null;
} {
  const [state, setState] = useState<BoardState>({
    board: null,
    loading: true,
    error: null,
    source: 'fallback',
  });

  useEffect(() => {
    let cancelled = false;

    safeJsonFetch<ProLabBoardPayload>(HR_BOARD_URL, {
      fallbackData: null,
      timeoutMs: 12000,
    }).then((result) => {
      if (cancelled) return;
      setState({
        board: result.data,
        loading: false,
        error: result.ok ? null : result.error || 'Verified HR board feed unavailable',
        source: result.source,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => getBoardRows(state.board), [state.board]);
  const groups = useMemo(() => getGameGroups(state.board, rows), [state.board, rows]);

  return {
    ...state,
    rows,
    groups,
    topRow: rows[0] || null,
    topGame: groups[0] || null,
  };
}

export function buildPlayerPayload(row: Record<string, any> | null, index = 0): NormalizedPlayerPayload | null {
  if (!row) return null;
  const playerName = safeNullableText(row.playerName ?? row.player_name ?? row.player ?? row.name);
  if (!playerName) return null;

  const breakdown = row.scoreBreakdown && typeof row.scoreBreakdown === 'object' ? row.scoreBreakdown : {};
  const recentForm = row.recentForm && typeof row.recentForm === 'object' ? row.recentForm : undefined;

  return {
    player: {
      playerId: safeText(row.playerId ?? row.player_id ?? row.id, `${playerName}-${index}`),
      playerName,
      team: safeNullableText(row.team),
      opponent: safeNullableText(row.opponent ?? row.opposingPitcherTeam ?? row.matchup),
      position: safeNullableText(row.position),
      headshot: safeNullableText(row.headshot ?? row.headshot_url ?? row.image_url),
      venue: safeNullableText(row.venue),
      lineupStatus: normalizeLineupStatus(row.lineupStatus ?? row.lineup_status),
      grade: safeNullableText(row.grade),
      hrEdge: safeNumber(row.hrEdge ?? row.hrScore ?? row.score),
      vouchScore: safeNumber(row.vouchScore),
      riskLabel: safeNullableText(row.riskLabel ?? row.riskTier ?? row.risk),
      dataConfidence: safeNumber(row.dataConfidence),
      formTag: safeNullableText(row.formTag),
      opponentPitcherName: safeNullableText(row.opponentPitcherName ?? row.opposingPitcher ?? row.pitcherName ?? row.pitcher),
      opposingPitcherTeam: safeNullableText(row.opposingPitcherTeam),
      lineupSpot: safeNumber(row.lineupSpot),
      reasons: safeStringArray(row.reasons),
      warnings: safeStringArray(row.warnings),
      judgeNote: safeNullableText(row.judge?.judgeNote),
      source: safeNullableText(row.source),
      dataQuality: row.dataQuality || row.data_quality || 'unknown',
    },
    recentForm,
    scoreBreakdown: {
      hitterPower: safeNumber(breakdown.hitterPower ?? row.hitterPower),
      pitcherVulnerability: safeNumber(breakdown.pitcherVulnerability ?? row.pitcherVulnerability),
      parkFactor: safeNumber(breakdown.parkFactor ?? row.parkFactor),
      recentForm: safeNumber(breakdown.recentForm ?? row.recentFormScore),
      lineupConfidence: safeNumber(breakdown.lineupConfidence ?? row.lineupConfidence),
      riskPenalty: safeNumber(breakdown.riskPenalty),
      finalScore: safeNumber(breakdown.finalScore ?? row.finalScore ?? row.hrEdge ?? row.hrScore),
    },
    matchup: {
      pitcherVulnerability: safeNumber(breakdown.pitcherVulnerability ?? row.pitcherVulnerability),
      parkFactor: safeNumber(breakdown.parkFactor ?? row.parkFactor),
      weatherBoost: safeNumber(row.weatherBoost),
      hrMultiplier: safeNumber(row.hrMultiplier),
      pitcherHand: safeNullableText(row.pitcherHand),
    },
    isPro: true,
  };
}

export function buildGamePayload(group: ProLabGameGroup | null): NormalizedGamePayload | null {
  if (!group || !group.rows.length) return null;
  return {
    game: {
      gamePk: group.key,
      matchup: group.matchup,
      venue: group.venue,
      environmentTag: 'Unknown',
      rankedPlayerCount: group.rows.length,
    },
    players: group.rows
      .map((row, index) => buildPlayerPayload(row, index)?.player)
      .filter(Boolean) as NormalizedGamePayload['players'],
    isPro: true,
  };
}

export function getBoardRows(board: ProLabBoardPayload): Record<string, any>[] {
  const root = getBoardRoot(board);
  const rowsFromGames = Array.isArray(root.games)
    ? root.games.flatMap((game: any) => Array.isArray(game?.rows) ? game.rows : [])
    : [];
  const candidates = Array.isArray(root.candidates) ? root.candidates : [];
  const projected = Array.isArray(root.projectedCandidates) ? root.projectedCandidates : [];

  return [...rowsFromGames, ...candidates, ...projected]
    .filter((row) => row && typeof row === 'object')
    .filter((row) => safeText(row.playerName ?? row.player_name ?? row.player ?? row.name, '') !== '')
    .sort((a, b) => (safeNumber(b.hrEdge ?? b.hrScore ?? b.score) ?? -1) - (safeNumber(a.hrEdge ?? a.hrScore ?? a.score) ?? -1));
}

export function getGameGroups(board: ProLabBoardPayload, rows = getBoardRows(board)): ProLabGameGroup[] {
  const root = getBoardRoot(board);

  if (Array.isArray(root.games) && root.games.length) {
    return root.games.map((game: any, index: number) => {
      const gameRows = Array.isArray(game?.rows) ? game.rows : [];
      return {
        key: safeText(game.gamePk ?? game.id, `game-${index}`),
        matchup: safeText(game.matchup, buildMatchupFromRows(gameRows)),
        venue: safeNullableText(game.venue),
        rows: gameRows,
      };
    }).filter((group: ProLabGameGroup) => group.rows.length > 0);
  }

  const byKey = new Map<string, Record<string, any>[]>();
  rows.forEach((row, index) => {
    const key = safeText(row.gamePk ?? row.game_pk ?? row.game_id, `${safeText(row.team, 'TBD')}-${safeText(row.opponent, 'TBD')}-${index}`);
    byKey.set(key, [...(byKey.get(key) || []), row]);
  });

  return Array.from(byKey.entries()).map(([key, gameRows]) => ({
    key,
    matchup: buildMatchupFromRows(gameRows),
    venue: safeNullableText(gameRows[0]?.venue),
    rows: gameRows,
  }));
}

export function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(typeof value === 'string' ? value.replace('%', '').trim() : value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function safeText(value: unknown, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function getBoardRoot(board: ProLabBoardPayload): Record<string, any> {
  if (!board || typeof board !== 'object') return {};
  const root = board.data || board.payload || board;
  return root && typeof root === 'object' ? root : {};
}

function safeNullableText(value: unknown): string | null {
  const text = safeText(value, '');
  return text || null;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function normalizeLineupStatus(value: unknown): NormalizedPlayerPayload['player']['lineupStatus'] {
  const text = safeText(value, 'unknown');
  if (text === 'confirmed' || text === 'projected_unconfirmed' || text === 'projected') return text;
  return 'unknown';
}

function buildMatchupFromRows(rows: Record<string, any>[]) {
  const first = rows[0] || {};
  const team = safeText(first.team, 'TBD');
  const opponent = safeText(first.opponent ?? first.opposingPitcherTeam, 'TBD');
  return `${team} vs ${opponent}`;
}
