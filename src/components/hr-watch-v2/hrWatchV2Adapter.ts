import { z } from 'zod';
import type {
  HrWatchV2Board,
  HrWatchV2Mode,
  HrWatchV2RecentForm,
  HrWatchV2RiskLabel,
  HrWatchV2Row,
  HrWatchV2ScoreBreakdown,
  HrWatchV2TruthStatus,
} from './hrWatchV2Types';

const UnknownRecordSchema = z.record(z.string(), z.unknown());

const RawBoardSchema = z
  .object({
    confirmedCandidates: z.array(UnknownRecordSchema).optional(),
    projectedCandidates: z.array(UnknownRecordSchema).optional(),
    allProjectedCandidates: z.array(UnknownRecordSchema).optional(),
    blockedPlayers: z.array(UnknownRecordSchema).optional(),
    candidateBuckets: z
      .object({
        confirmed: z.array(UnknownRecordSchema).optional(),
        projected: z.array(UnknownRecordSchema).optional(),
        allProjected: z.array(UnknownRecordSchema).optional(),
        blocked: z.array(UnknownRecordSchema).optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

type RawBoard = z.infer<typeof RawBoardSchema>;
type UnknownRecord = z.infer<typeof UnknownRecordSchema>;

function parseBoard(input: unknown): { board: RawBoard; warnings: string[] } {
  const parsed = RawBoardSchema.safeParse(input);

  if (parsed.success) {
    return { board: parsed.data, warnings: [] };
  }

  return {
    board: {},
    warnings: parsed.error.issues.map((issue) => issue.message).slice(0, 5),
  };
}

function firstString(row: UnknownRecord, keys: readonly string[], fallback: string): string {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function firstNumber(row: UnknownRecord, keys: readonly string[], fallback: number): number {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function firstNullableNumber(row: UnknownRecord, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function firstScalar(row: UnknownRecord, keys: readonly string[]): string | number | null {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }

  return null;
}

function asRecord(value: unknown): UnknownRecord {
  const parsed = UnknownRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function riskFromScore(score: number, blocked: boolean): HrWatchV2RiskLabel {
  if (blocked) return 'Blocked';
  if (score >= 82) return 'Elite';
  if (score >= 72) return 'Core';
  if (score >= 62) return 'Watch';
  return 'Deep';
}

function truthFromRow(row: UnknownRecord, mode: HrWatchV2Mode): HrWatchV2TruthStatus {
  if (mode === 'blocked') return 'blocked';

  const status = firstString(row, ['lineupStatus', 'truthStatus', 'status'], '').toLowerCase();

  if (status.includes('official') || status.includes('confirmed')) return 'official_lineup';
  if (status.includes('projected') || status.includes('unconfirmed')) return 'projected_unconfirmed';

  const official = row.officialLineup ?? row.isOfficialLineup ?? row.confirmedLineup;
  if (official === true) return 'official_lineup';

  if (mode === 'curated' || mode === 'all') return 'projected_unconfirmed';

  return 'unknown';
}

function readReasons(row: UnknownRecord): string[] {
  const candidates = [row.reasons, row.why, row.reasonCodes, row.notes];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;

    const reasons = candidate
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, 5);

    if (reasons.length) return reasons;
  }

  const single = firstString(row, ['reason', 'summary', 'edgeReason'], '');
  return single ? [single] : [];
}

function readBreakdown(row: UnknownRecord): HrWatchV2ScoreBreakdown {
  const nested = asRecord(row.scoreBreakdown);

  return {
    hitterPower:
      firstNullableNumber(nested, ['hitterPower', 'power', 'batterPower']) ??
      firstNullableNumber(row, ['hitterPower', 'batterPower']),
    pitcherVulnerability:
      firstNullableNumber(nested, ['pitcherVulnerability', 'pitcherWeakness']) ??
      firstNullableNumber(row, ['pitcherVulnerability']),
    parkFactor:
      firstNullableNumber(nested, ['parkFactor', 'park']) ??
      firstNullableNumber(row, ['parkFactor']),
    recentForm:
      firstNullableNumber(nested, ['recentForm', 'recentPower']) ??
      firstNullableNumber(row, ['recentFormScore', 'recentPower']),
    vouchScore:
      firstNullableNumber(nested, ['vouchScore']) ??
      firstNullableNumber(row, ['vouchScore']),
  };
}

function readRecentForm(row: UnknownRecord): HrWatchV2RecentForm | null {
  const nested = asRecord(row.recentForm);

  if (Object.keys(nested).length === 0) return null;

  return {
    gamesChecked: firstNullableNumber(nested, ['gamesChecked', 'games', 'sample']),
    homeRuns: firstNullableNumber(nested, ['homeRuns', 'hr']),
    extraBaseHits: firstNullableNumber(nested, ['extraBaseHits', 'xbh']),
    slugging: firstNullableNumber(nested, ['slugging', 'slg']),
  };
}

function oddsLabel(row: UnknownRecord): string {
  const raw = firstScalar(row, ['impliedOdds', 'odds', 'americanOdds']);
  return raw === null ? 'Odds TBD' : String(raw);
}

function normalizeRow(row: UnknownRecord, mode: HrWatchV2Mode, index: number): HrWatchV2Row | null {
  const playerName = firstString(row, ['playerName', 'name', 'batterName', 'fullName'], '');
  if (!playerName) return null;

  const playerId = firstScalar(row, ['playerId', 'mlbId', 'id']);
  const gamePk = firstScalar(row, ['gamePk', 'gameId']);
  const hrScore = clampScore(firstNumber(row, ['hrScore', 'hrEdge', 'finalScore', 'score', 'batterScore'], 0));
  const blocked = mode === 'blocked';

  return {
    stableId: `${gamePk ?? 'game'}-${playerId ?? playerName}-${mode}-${index}`,
    playerId,
    playerName,
    team: firstString(row, ['team', 'teamAbbr', 'teamName'], 'TBD'),
    opponent: firstString(row, ['opponent', 'opponentAbbr', 'opponentName'], 'TBD'),
    pitcherName: firstString(
      row,
      ['opponentPitcherName', 'opposingPitcher', 'pitcherName', 'probablePitcher'],
      'Pitcher TBD',
    ),
    venue: firstString(row, ['venue', 'ballpark', 'park'], 'Venue TBD'),
    gamePk,
    gameTime: firstString(row, ['gameTime', 'startTime', 'firstPitch'], '') || null,
    headshot: firstString(row, ['headshot', 'headshotUrl', 'imageUrl'], '') || null,
    rank: firstNullableNumber(row, ['rank', 'overallRank']),

    hrScore,
    vouchScore: firstNullableNumber(row, ['vouchScore']),
    pitcherVulnerability: firstNullableNumber(row, ['pitcherVulnerability']),
    recentPower: firstNullableNumber(row, ['recentPower', 'recentFormScore']),
    parkFactor: firstNullableNumber(row, ['parkFactor']),

    riskLabel: riskFromScore(hrScore, blocked),
    truthStatus: truthFromRow(row, mode),
    formTag: firstString(row, ['formTag', 'trendTag'], hrScore >= 72 ? 'Hot Watch' : 'Research Watch'),
    oddsLabel: oddsLabel(row),

    reasons: readReasons(row),
    scoreBreakdown: readBreakdown(row),
    recentForm: readRecentForm(row),

    sourceMode: mode,
  };
}

function normalizeRows(rows: readonly UnknownRecord[], mode: HrWatchV2Mode): HrWatchV2Row[] {
  const normalized: HrWatchV2Row[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = normalizeRow(rows[index], mode, index);
    if (row) normalized.push(row);
  }

  normalized.sort((a, b) => b.hrScore - a.hrScore);
  return normalized;
}

function firstNonEmptyArray(...arrays: Array<readonly UnknownRecord[] | undefined>): readonly UnknownRecord[] {
  for (const rows of arrays) {
    if (rows && rows.length > 0) return rows;
  }

  return [];
}

export function buildHrWatchV2Board(input: unknown): HrWatchV2Board {
  const { board, warnings } = parseBoard(input);

  const confirmedRaw = firstNonEmptyArray(board.confirmedCandidates, board.candidateBuckets?.confirmed);
  const curatedRaw = firstNonEmptyArray(board.projectedCandidates, board.candidateBuckets?.projected);
  const allRaw = firstNonEmptyArray(
    board.allProjectedCandidates,
    board.candidateBuckets?.allProjected,
    curatedRaw,
  );
  const blockedRaw = firstNonEmptyArray(board.blockedPlayers, board.candidateBuckets?.blocked);

  const confirmed = normalizeRows(confirmedRaw, 'confirmed');
  const curated = normalizeRows(curatedRaw, 'curated');
  const all = normalizeRows(allRaw, 'all');
  const blocked = normalizeRows(blockedRaw, 'blocked');

  return {
    confirmed,
    curated,
    all,
    blocked,
    warnings,
    counts: {
      confirmed: confirmed.length,
      curated: curated.length,
      all: all.length,
      blocked: blocked.length,
      visibleTruthPool: confirmed.length + all.length,
    },
  };
}

export function getRowsForHrWatchMode(board: HrWatchV2Board, mode: HrWatchV2Mode): readonly HrWatchV2Row[] {
  if (mode === 'confirmed') return board.confirmed;
  if (mode === 'curated') return board.curated;
  if (mode === 'all') return board.all;
  return board.blocked;
}
