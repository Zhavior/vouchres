/**
 * Shared opponent-lineup fallback for Batter vs Pitcher surfaces.
 * Prefer teamId / abbreviation / gamePk over fragile full-name includes().
 */

export type FallbackHitterRow = {
  id: number;
  name: string;
  bats: 'L' | 'R' | 'S' | 'U';
  position: string;
  lineupSpot: number | null;
  headshotUrl?: string | null;
  recentForm: { games: number; hr: number; hits: number; atBats: number; strikeOuts: number } | null;
  vsPitcher: {
    ab: number;
    h: number;
    hr: number;
    bb: number;
    k: number;
    avgText: string | null;
    slgText: string | null;
    opsText: string | null;
  } | null;
  seasonStats: {
    pa: number;
    avg: number;
    obp: number;
    slg: number;
    iso: number;
    ops: number;
    hr: number;
  } | null;
  statcast: {
    playerId: number;
    pa: number | null;
    xwoba: number | null;
    barrelPct: number | null;
    hardHitPct: number | null;
    avgExitVelo: number | null;
  } | null;
  tags: string[];
};

export type OpponentLineupFallback = {
  gamePk: number;
  pitcher: { id: number; name: string; team: string; throws: 'L' | 'R' | 'U' };
  opponent: { team: string; projectedLineup: FallbackHitterRow[] };
  warnings: string[];
};

type HrBoardLike = {
  rows?: Array<Record<string, unknown>>;
  candidates?: Array<Record<string, unknown>>;
  confirmedCandidates?: Array<Record<string, unknown>>;
  projectedCandidates?: Array<Record<string, unknown>>;
  allProjectedCandidates?: Array<Record<string, unknown>>;
  games?: Array<{
    gamePk?: number;
    rows?: Array<Record<string, unknown>>;
  }>;
};

export type OpponentTeamRef = {
  teamId?: number | null;
  name?: string | null;
  abbreviation?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function num(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** True when an HR-board / candidate row belongs to the opponent team (or game). */
export function rowMatchesOpponentTeam(
  row: Record<string, unknown>,
  opponent: OpponentTeamRef,
  gamePk?: number | null,
): boolean {
  const rowGamePk = num(row.gamePk);
  if (gamePk && rowGamePk && rowGamePk === gamePk) {
    // Same game — still require team identity when we have it, to avoid mixing both sides.
    const hasTeamHint = opponent.teamId || opponent.abbreviation || opponent.name;
    if (!hasTeamHint) return true;
  }

  const rowTeamId = num(row.teamId) ?? num(row.sourceTeamId) ?? num(row.activeRosterTeamId) ?? num(row.currentTeamId);
  if (opponent.teamId && rowTeamId && opponent.teamId === rowTeamId) return true;

  const rowTeam = str(row.team) || str(row.teamAbbr) || str(row.teamAbbreviation) || str(row.teamName);
  const rowAbbr = str(row.teamAbbr) || str(row.teamAbbreviation) || str(row.abbreviation);
  const oppAbbr = str(opponent.abbreviation);
  const oppName = str(opponent.name);

  if (oppAbbr) {
    const abbr = normalizeToken(oppAbbr);
    if (abbr && (normalizeToken(rowAbbr) === abbr || normalizeToken(rowTeam) === abbr)) return true;
  }

  if (oppName && rowTeam) {
    const a = normalizeToken(oppName);
    const b = normalizeToken(rowTeam);
    if (a && b && (a === b || a.includes(b) || b.includes(a))) return true;
  }

  // Last resort: same gamePk only when team fields are missing on the row.
  if (gamePk && rowGamePk === gamePk && !rowTeamId && !rowTeam && !rowAbbr) return true;

  return false;
}

function collectHrBoardRows(hrBoard: HrBoardLike | null | undefined, gamePk?: number | null): Array<Record<string, unknown>> {
  if (!hrBoard) return [];
  const buckets: Array<Record<string, unknown>> = [];

  if (gamePk && Array.isArray(hrBoard.games)) {
    for (const game of hrBoard.games) {
      if (num(game.gamePk) === gamePk && Array.isArray(game.rows)) {
        buckets.push(...game.rows.map((r) => asRecord(r)).filter(Boolean) as Array<Record<string, unknown>>);
      }
    }
  }

  for (const list of [
    hrBoard.candidates,
    hrBoard.confirmedCandidates,
    hrBoard.projectedCandidates,
    hrBoard.allProjectedCandidates,
    hrBoard.rows,
  ]) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const row = asRecord(item);
      if (row) buckets.push(row);
    }
  }

  return buckets;
}

function mapRowToHitter(row: Record<string, unknown>, index: number): FallbackHitterRow {
  const playerId = num(row.playerId) ?? num(row.id) ?? index + 1000;
  const batsRaw = str(row.bats).toUpperCase();
  const bats: FallbackHitterRow['bats'] =
    batsRaw === 'L' || batsRaw === 'R' || batsRaw === 'S' ? batsRaw : 'U';

  const recent = asRecord(row.recentForm);
  const avg = num(row.avg);
  const slg = num(row.slg);
  const ops = num(row.ops);
  const iso = num(row.iso) ?? (avg != null && slg != null ? slg - avg : null);

  return {
    id: playerId,
    name: str(row.playerName) || str(row.name) || 'Hitter',
    bats,
    position: str(row.position) || 'DH',
    lineupSpot: num(row.battingOrder) ?? num(row.lineupSpot) ?? (index + 1),
    headshotUrl:
      str(row.headshot) ||
      str(row.headshotUrl) ||
      `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best/v1/people/${playerId}/headshot/67/current`,
    recentForm: recent
      ? {
          games: num(recent.games) ?? num(recent.gamesChecked) ?? 0,
          hr: num(recent.hr) ?? num(recent.homeRuns) ?? 0,
          hits: num(recent.hits) ?? 0,
          atBats: num(recent.atBats) ?? 0,
          strikeOuts: num(recent.strikeOuts) ?? 0,
        }
      : null,
    vsPitcher: {
      ab: num(row.bvpAb) ?? 0,
      h: num(row.bvpHits) ?? 0,
      hr: num(row.bvpHr) ?? 0,
      bb: 0,
      k: 0,
      avgText: row.bvpAvg != null ? String(row.bvpAvg) : null,
      slgText: null,
      opsText: row.bvpOps != null ? String(row.bvpOps) : null,
    },
    seasonStats:
      avg != null || slg != null || ops != null
        ? {
            pa: num(row.pa) ?? 0,
            avg: avg ?? 0,
            obp: num(row.obp) ?? 0,
            slg: slg ?? 0,
            iso: iso ?? 0,
            ops: ops ?? 0,
            hr: num(row.hr) ?? num(row.seasonHr) ?? 0,
          }
        : null,
    statcast: {
      playerId,
      pa: num(row.pa),
      xwoba: num(row.xwoba),
      barrelPct: num(row.barrelPct),
      hardHitPct: num(row.hardHitPct),
      avgExitVelo: num(row.avgExitVelo),
    },
    tags: Array.isArray(row.tags) ? row.tags.map(String) : ['Board fallback'],
  };
}

/**
 * Build a pitcher-matchup-shaped payload from HR board rows when the live
 * pitcher-matchup endpoint returns an empty / unavailable lineup.
 */
export function buildOpponentLineupFromHrBoard(args: {
  gamePk: number;
  pitcher: { id: number; name: string; team: string; throws: 'L' | 'R' | 'U' };
  opponent: OpponentTeamRef;
  hrBoard?: HrBoardLike | null;
}): OpponentLineupFallback {
  const collected = collectHrBoardRows(args.hrBoard, args.gamePk);
  const filtered = collected.filter((row) => rowMatchesOpponentTeam(row, args.opponent, args.gamePk));

  // De-dupe by playerId while preserving order.
  const seen = new Set<number>();
  const projectedLineup: FallbackHitterRow[] = [];
  for (const row of filtered) {
    const mapped = mapRowToHitter(row, projectedLineup.length);
    if (seen.has(mapped.id)) continue;
    seen.add(mapped.id);
    projectedLineup.push(mapped);
    if (projectedLineup.length >= 13) break;
  }

  const warnings = ['Board fallback lineup'];
  if (projectedLineup.length === 0) {
    warnings.push('No opponent hitters matched for this game yet');
  } else {
    warnings.push('Projected lineup may change');
  }

  return {
    gamePk: args.gamePk,
    pitcher: args.pitcher,
    opponent: {
      team: args.opponent.name || args.opponent.abbreviation || 'Opponent',
      projectedLineup,
    },
    warnings,
  };
}

export function hasProjectedHitters(
  payload: { opponent?: { projectedLineup?: unknown[] | null } | null } | null | undefined,
): boolean {
  return (payload?.opponent?.projectedLineup?.length ?? 0) > 0;
}
