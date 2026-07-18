import { z } from 'zod';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrWatchBoard, HrWatchMode, HrWatchRow, RiskTier, TruthStatus } from '../types/hrWatch';

type UnknownRecord = z.infer<typeof UnknownRecordSchema>;

const UnknownRecordSchema = z.record(z.string(), z.unknown());

function firstString(row: UnknownRecord, keys: readonly string[], fallback: string): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return fallback;
}

function firstScalar(row: UnknownRecord, keys: readonly string[]): string | number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
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

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

const OFFICIAL_LINEUP_WARNING = 'Official lineup not posted yet';

function hasOfficialLineupWarning(warnings: readonly string[]): boolean {
  return warnings.some((warning) => /official lineup not posted yet/i.test(warning));
}

function truthStatus(row: UnknownRecord, mode: HrWatchMode): TruthStatus {
  if (mode === 'blocked') return 'blocked';
  // Bucket provenance wins over stale row-level labels. The API guarantees
  // curated/all pools are projection previews, even when an upstream row still
  // carries an old "confirmed" lineupStatus value.
  if (mode === 'curated' || mode === 'all') return 'projected';
  const status = firstString(row, ['lineupStatus', 'truthStatus', 'status'], '').toLowerCase();
  if (status.includes('project') || status.includes('preview') || status.includes('unconfirmed')) {
    return 'projected';
  }
  if (row.isConfirmed === false) return 'projected';
  const official = row.officialLineup ?? row.isOfficialLineup ?? row.confirmedLineup;
  if (
    row.isConfirmed === true
    || official === true
    || status.includes('official')
    || status.includes('confirmed')
  ) {
    return 'official';
  }
  return 'unknown';
}

function riskTier(score: number, status: TruthStatus): RiskTier {
  if (status === 'blocked') return 'Blocked';
  if (score >= 82) return 'Elite';
  if (score >= 72) return 'Core';
  if (score >= 62) return 'Watch';
  return 'Deep';
}

function readReasons(row: UnknownRecord): string[] {
  const values = [row.reasons, row.why, row.reasonCodes, row.notes];
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    const reasons = value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, 4);
    if (reasons.length > 0) return reasons;
  }
  const single = firstString(row, ['reason', 'summary', 'edgeReason'], '');
  return single ? [single] : [];
}

function readWarnings(row: UnknownRecord): string[] {
  const values = [row.warnings, row.warningCodes, row.safetyWarnings];
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    const warnings = value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, 3);
    if (warnings.length > 0) return warnings;
  }
  const single = firstString(row, ['warning', 'safetyWarning'], '');
  return single ? [single] : [];
}

function readBreakdown(row: UnknownRecord) {
  const nested = readRecord(row.scoreBreakdown);
  return {
    hitterPower:
      firstNullableNumber(nested, ['hitterPower', 'power', 'batterPower']) ??
      firstNullableNumber(row, ['hitterPower', 'batterPower', 'recentPower']),
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

function buildMlbHeadshotUrl(playerId: string | number | null): string | null {
  if (playerId === null || playerId === '') return null;
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_384,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`;
}

function normalizeRows(rows: readonly UnknownRecord[], mode: HrWatchMode): HrWatchRow[] {
  const normalized: HrWatchRow[] = [];
  for (const row of rows) {
    const playerName = firstString(row, ['playerName', 'name', 'batterName', 'fullName'], '');
    if (!playerName) continue;
    const gamePk = firstScalar(row, ['gamePk', 'gameId']);
    const playerId = firstScalar(row, ['playerId', 'mlbId', 'id']);
    const team = firstString(row, ['team', 'teamAbbr', 'teamName'], 'TBD');
    const opponent = firstString(row, ['opponent', 'opponentAbbr', 'opponentName'], 'TBD');
    const hrScore = clampScore(firstNumber(row, ['hrScore', 'hrEdge', 'finalScore', 'score', 'batterScore'], 0));
    const truth = truthStatus(row, mode);
    const breakdown = readBreakdown(row);
    const warnings = readWarnings(row);
    // Every projected preview row must carry the trust-first lineup warning.
    if (truth === 'projected' && !hasOfficialLineupWarning(warnings)) {
      warnings.unshift(OFFICIAL_LINEUP_WARNING);
    }

    normalized.push({
      stableId: `${gamePk ?? 'game'}-${playerId ?? playerName}-${team}`,
      playerName,
      playerId,
      team,
      opponent,
      teamLogoUrl: logoByTeamName(team),
      opponentLogoUrl: logoByTeamName(opponent),
      pitcherName: firstString(
        row,
        ['opponentPitcherName', 'opposingPitcher', 'pitcherName', 'probablePitcher'],
        'Pitcher TBD',
      ),
      venue: firstString(row, ['venue', 'ballpark', 'park'], 'Venue TBD'),
      gamePk,
      gameTime: firstString(row, ['gameTime', 'startTime', 'firstPitch'], '') || null,
      headshotUrl: firstString(row, ['headshot', 'headshotUrl', 'imageUrl'], '') || buildMlbHeadshotUrl(playerId),
      rank: firstNullableNumber(row, ['rank', 'overallRank']),
      hrScore,
      hitterPower: breakdown.hitterPower,
      pitcherVulnerability: breakdown.pitcherVulnerability,
      parkFactor: breakdown.parkFactor,
      recentForm: breakdown.recentForm,
      vouchScore: breakdown.vouchScore,
      dataConfidence: firstNullableNumber(row, ['dataConfidence']),
      truthStatus: truth,
      riskTier: riskTier(hrScore, truth),
      oddsLabel: firstString(row, ['impliedOdds', 'odds', 'americanOdds'], 'Odds TBD'),
      bookOdds: firstNullableNumber(row, ['bookOdds', 'americanOdds', 'bestOdds']),
      hrProbability: firstNullableNumber(row, ['hrProbability', 'estimatedHrProb', 'probability']),
      impliedProbability: firstNullableNumber(row, ['impliedProbability', 'bookImpliedProbability']),
      reasons: readReasons(row),
      warnings,
      sourceMode: mode,
    });
  }
  normalized.sort((a, b) => b.hrScore - a.hrScore);
  return normalized;
}

function firstArray(...arrays: Array<readonly UnknownRecord[] | undefined>): readonly UnknownRecord[] {
  for (const rows of arrays) {
    if (rows && rows.length > 0) return rows;
  }
  return [];
}

function readRecord(value: unknown): UnknownRecord {
  const parsed = UnknownRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

const HrBoardPayloadSchema = z
  .object({
    candidates: z.array(UnknownRecordSchema).optional(),
    confirmedCandidates: z.array(UnknownRecordSchema).optional(),
    projectedCandidates: z.array(UnknownRecordSchema).optional(),
    allProjectedCandidates: z.array(UnknownRecordSchema).optional(),
    blockedPlayers: z.array(UnknownRecordSchema).optional(),
    counts: z.record(z.string(), z.unknown()).optional(),
    truthSummary: z.record(z.string(), z.unknown()).optional(),
    warnings: z.array(z.string()).optional(),
    note: z.string().optional(),
    disclaimer: z.string().optional(),
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

type HrBoardPayload = z.infer<typeof HrBoardPayloadSchema>;

export function buildBoard(input: unknown): HrWatchBoard {
  const parsed = HrBoardPayloadSchema.safeParse(input);
  const board: HrBoardPayload = parsed.success ? parsed.data : {};
  const confirmedRaw = firstArray(board.candidates, board.confirmedCandidates, board.candidateBuckets?.confirmed);
  const curatedRaw = firstArray(board.projectedCandidates, board.candidateBuckets?.projected);
  const allRaw = firstArray(board.allProjectedCandidates, board.candidateBuckets?.allProjected, curatedRaw);
  const blockedRaw = firstArray(board.blockedPlayers, board.candidateBuckets?.blocked);
  const counts = readRecord(board.counts);
  const truthSummary = readRecord(board.truthSummary);

  return {
    confirmed: normalizeRows(confirmedRaw, 'confirmed'),
    curated: normalizeRows(curatedRaw, 'curated'),
    all: normalizeRows(allRaw, 'all'),
    blocked: normalizeRows(blockedRaw, 'blocked'),
    warnings: Array.isArray(board.warnings) ? board.warnings.filter((item): item is string => typeof item === 'string') : [],
    note: typeof board.note === 'string' ? board.note : null,
    disclaimer: typeof board.disclaimer === 'string' ? board.disclaimer : null,
    truthMessage: firstString(truthSummary, ['message'], '') || (typeof board.note === 'string' ? board.note : null),
    counts: {
      confirmedCandidates: firstNumber(counts, ['confirmedCandidates'], confirmedRaw.length),
      projectedCandidates: firstNumber(counts, ['projectedCandidates'], curatedRaw.length),
      hiddenProjectedCandidates: firstNumber(counts, ['hiddenProjectedCandidates', 'hiddenProjectedCount'], Math.max(0, allRaw.length - curatedRaw.length)),
      blockedPlayers: firstNumber(counts, ['blockedPlayers'], blockedRaw.length),
      totalVisiblePool: firstNumber(counts, ['totalVisiblePool'], confirmedRaw.length + curatedRaw.length),
    },
  };
}

export function rowsForMode(board: HrWatchBoard, mode: HrWatchMode): readonly HrWatchRow[] {
  if (mode === 'confirmed') return board.confirmed;
  if (mode === 'curated') return board.curated;
  if (mode === 'all') return board.all;
  return board.blocked;
}

export function tierDisplayLabel(riskTier: unknown): 'Vouch Elite' | 'Core Targets' | 'Watch List' | 'Deep Research' {
  const raw = String(riskTier).toLowerCase();
  if (raw.includes('elite')) return 'Vouch Elite';
  if (raw.includes('core')) return 'Core Targets';
  if (raw.includes('watch')) return 'Watch List';
  return 'Deep Research';
}

export function groupRowsByTier(rows: readonly HrWatchRow[]) {
  const order = ['Vouch Elite', 'Core Targets', 'Watch List', 'Deep Research'] as const;
  const meta: Record<(typeof order)[number], { title: string; subtitle: string }> = {
    'Vouch Elite': { title: 'Vouch Elite', subtitle: 'Best conviction, cleanest signal stack.' },
    'Core Targets': { title: 'Core Targets', subtitle: 'Strong plays with balanced risk.' },
    'Watch List': { title: 'Watch List', subtitle: 'Good targets worth monitoring.' },
    'Deep Research': { title: 'Deep Research', subtitle: 'Fewer rows, more context.' },
  };
  return order
    .map((key) => {
      const bucket = rows.filter((row) => tierDisplayLabel(row.riskTier) === key);
      return { key, title: meta[key].title, subtitle: meta[key].subtitle, rows: bucket };
    })
    .filter((bucket) => bucket.rows.length > 0);
}

export function groupRowsByGame(rows: readonly HrWatchRow[]) {
  const buckets = new Map<string, HrWatchRow[]>();
  for (const row of rows) {
    const key = String(row.gamePk ?? row.stableId);
    const existing = buckets.get(key);
    if (existing) existing.push(row);
    else buckets.set(key, [row]);
  }
  return Array.from(buckets.entries()).map(([key, gameRows]) => {
    const first = gameRows[0];
    return {
      key,
      title: `${first.team} vs ${first.opponent}`,
      subtitle: `${first.venue} · ${gameRows.length} HR row${gameRows.length === 1 ? '' : 's'}`,
      rows: gameRows,
    };
  });
}
