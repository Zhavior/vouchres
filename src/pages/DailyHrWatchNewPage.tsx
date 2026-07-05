import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { vouchedgeApi } from '../api/vouchedgeApi';
import { logoByTeamName } from '../lib/teamLogos';
import type { CreatorProofProfile, MLBPlayer } from '../types';

const UnknownRecordSchema = z.record(z.string(), z.unknown());

const RawBoardSchema = z
  .object({
    candidates: z.array(UnknownRecordSchema).optional(),
    confirmedCandidates: z.array(UnknownRecordSchema).optional(),
    projectedCandidates: z.array(UnknownRecordSchema).optional(),
    allProjectedCandidates: z.array(UnknownRecordSchema).optional(),
    blockedPlayers: z.array(UnknownRecordSchema).optional(),
    counts: UnknownRecordSchema.optional(),
    truthSummary: UnknownRecordSchema.optional(),
    previewMeta: UnknownRecordSchema.optional(),
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

type RawBoard = z.infer<typeof RawBoardSchema>;
type UnknownRecord = z.infer<typeof UnknownRecordSchema>;

type HrWatchMode = 'confirmed' | 'curated' | 'all' | 'blocked';
type TruthStatus = 'official' | 'projected' | 'blocked' | 'unknown';
type RiskTier = 'Elite' | 'Core' | 'Watch' | 'Deep' | 'Blocked';

type HrWatchAddLegHandler = (
  player: MLBPlayer,
  prop: {
    id: string;
    market: string;
    odds: number | null;
    spec: string;
    gamePk?: string | number;
    playerId?: string | number;
  },
) => void;

interface DailyHrWatchNewPageProps {
  profile?: CreatorProofProfile | null;
  onAddLegToParlay?: HrWatchAddLegHandler;
}

interface HrWatchRow {
  stableId: string;
  playerName: string;
  playerId: string | number | null;
  team: string;
  opponent: string;
  teamLogoUrl: string | null;
  opponentLogoUrl: string | null;
  pitcherName: string;
  venue: string;
  gamePk: string | number | null;
  gameTime: string | null;
  headshotUrl: string | null;
  rank: number | null;
  hrScore: number;
  hitterPower: number | null;
  pitcherVulnerability: number | null;
  parkFactor: number | null;
  recentForm: number | null;
  vouchScore: number | null;
  truthStatus: TruthStatus;
  riskTier: RiskTier;
  oddsLabel: string;
  reasons: string[];
  warnings: string[];
  sourceMode: HrWatchMode;
}

interface HrWatchBoard {
  confirmed: HrWatchRow[];
  curated: HrWatchRow[];
  all: HrWatchRow[];
  blocked: HrWatchRow[];
  warnings: string[];
  note: string | null;
  disclaimer: string | null;
  truthMessage: string | null;
  counts: {
    confirmedCandidates: number;
    projectedCandidates: number;
    hiddenProjectedCandidates: number;
    blockedPlayers: number;
    totalVisiblePool: number;
  };
}

const TIERS = [
  { key: 'elite', title: 'Vouch Elite', subtitle: 'Highest HR score and strongest math stack.', min: 82, max: 101 },
  { key: 'core', title: 'Core Targets', subtitle: 'Strong candidates with playable research context.', min: 72, max: 82 },
  { key: 'watch', title: 'Watch List', subtitle: 'Useful candidates needing lineup or matchup confirmation.', min: 62, max: 72 },
  { key: 'deep', title: 'Deep Research', subtitle: 'Lower confidence research-only darts.', min: 0, max: 62 },
] as const;

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

function firstArray(...arrays: Array<readonly UnknownRecord[] | undefined>): readonly UnknownRecord[] {
  for (const rows of arrays) {
    if (rows && rows.length > 0) return rows;
  }

  return [];
}

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

function readRecord(value: unknown): UnknownRecord {
  const parsed = UnknownRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function truthStatus(row: UnknownRecord, mode: HrWatchMode): TruthStatus {
  if (mode === 'blocked') return 'blocked';

  const status = firstString(row, ['lineupStatus', 'truthStatus', 'status'], '').toLowerCase();

  if (status.includes('official') || status.includes('confirmed')) return 'official';
  if (status.includes('projected') || status.includes('unconfirmed')) return 'projected';

  const official = row.officialLineup ?? row.isOfficialLineup ?? row.confirmedLineup;
  if (official === true) return 'official';

  if (mode === 'curated' || mode === 'all') return 'projected';

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
  if (playerId === null || playerId === '') {
    return null;
  }

  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_384,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`;
}

function normalizeRows(rows: readonly UnknownRecord[], mode: HrWatchMode): HrWatchRow[] {
  const normalized: HrWatchRow[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const playerName = firstString(row, ['playerName', 'name', 'batterName', 'fullName'], '');

    if (!playerName) continue;

    const gamePk = firstScalar(row, ['gamePk', 'gameId']);
    const playerId = firstScalar(row, ['playerId', 'mlbId', 'id']);
    const team = firstString(row, ['team', 'teamAbbr', 'teamName'], 'TBD');
    const opponent = firstString(row, ['opponent', 'opponentAbbr', 'opponentName'], 'TBD');
    const hrScore = clampScore(firstNumber(row, ['hrScore', 'hrEdge', 'finalScore', 'score', 'batterScore'], 0));
    const truth = truthStatus(row, mode);
    const breakdown = readBreakdown(row);

    normalized.push({
      stableId: `${gamePk ?? 'game'}-${playerId ?? playerName}-${mode}-${index}`,
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
      truthStatus: truth,
      riskTier: riskTier(hrScore, truth),
      oddsLabel: firstString(row, ['impliedOdds', 'odds', 'americanOdds'], 'Odds TBD'),
      reasons: readReasons(row),
      warnings: readWarnings(row),
      sourceMode: mode,
    });
  }

  normalized.sort((a, b) => b.hrScore - a.hrScore);
  return normalized;
}

function buildBoard(input: unknown): HrWatchBoard {
  const { board, warnings } = parseBoard(input);

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
    warnings,
    note: board.note ?? null,
    disclaimer: board.disclaimer ?? null,
    truthMessage: firstString(truthSummary, ['message'], '') || board.note || null,
    counts: {
      confirmedCandidates: firstNumber(counts, ['confirmedCandidates'], confirmedRaw.length),
      projectedCandidates: firstNumber(counts, ['projectedCandidates'], curatedRaw.length),
      hiddenProjectedCandidates: firstNumber(counts, ['hiddenProjectedCandidates', 'hiddenProjectedCount'], Math.max(0, allRaw.length - curatedRaw.length)),
      blockedPlayers: firstNumber(counts, ['blockedPlayers'], blockedRaw.length),
      totalVisiblePool: firstNumber(counts, ['totalVisiblePool'], confirmedRaw.length + curatedRaw.length),
    },
  };
}

function scoreText(value: number | null): string {
  return value === null ? '—' : String(Math.round(value));
}

function truthBadgeClass(status: TruthStatus): string {
  if (status === 'official') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (status === 'projected') return 'border-amber-300/30 bg-amber-300/10 text-amber-200';
  if (status === 'blocked') return 'border-rose-400/30 bg-rose-400/10 text-rose-200';
  return 'border-slate-400/20 bg-slate-400/10 text-slate-300';
}

function rowsForMode(board: HrWatchBoard, mode: HrWatchMode): readonly HrWatchRow[] {
  if (mode === 'confirmed') return board.confirmed;
  if (mode === 'curated') return board.curated;
  if (mode === 'all') return board.all;
  return board.blocked;
}

function ModeButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-2 text-left transition ${
        active
          ? 'border-[hsl(var(--ve-accent-cyan)/0.50)] bg-[hsl(var(--ve-accent-cyan)/0.14)] text-[hsl(var(--ve-accent-cyan))]'
          : 'border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.30)] text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-secondary))]'
      }`}
    >
      <div className="text-[10px] font-black uppercase tracking-wide">{label}</div>
      <div className="font-mono text-lg font-black">{count}</div>
    </button>
  );
}

function TeamLogoBadge({ label, logoUrl }: { label: string; logoUrl: string | null }) {
  const fallback = label
    .split(/\s+/)
    .filter(Boolean)
    .map((piece) => piece[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-inner">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${label} logo`}
          className="h-8 w-8 animate-[fadeIn_220ms_ease-out] object-contain"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <span className="text-[10px] font-black uppercase tracking-wide text-cyan-100/70">{fallback || 'TBD'}</span>
      )}
    </div>
  );
}

function TeamBanner({
  team,
  opponent,
  teamLogoUrl,
  opponentLogoUrl,
}: {
  team: string;
  opponent: string;
  teamLogoUrl: string | null;
  opponentLogoUrl: string | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 via-amber-300/10 to-cyan-400/10 px-4 py-3 text-center shadow-[0_0_34px_rgba(34,211,238,0.10)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="relative flex items-center justify-center gap-3">
        <TeamLogoBadge label={team} logoUrl={teamLogoUrl} />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/70">Team Matchup</p>
          <p className="mt-1 truncate text-base font-black text-white">
            {team} <span className="text-amber-200/80">vs</span> {opponent}
          </p>
        </div>
        <TeamLogoBadge label={opponent} logoUrl={opponentLogoUrl} />
      </div>
    </div>
  );
}

function MathChip({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--ve-border)/0.22)] bg-black/10 px-2 py-2 text-center">
      <div className="text-[8px] font-mono uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">{label}</div>
      <div className="font-mono text-sm font-black text-[hsl(var(--ve-text-primary))]">{scoreText(value)}</div>
    </div>
  );
}

function toMlbPlayerForParlay(row: HrWatchRow): MLBPlayer {
  return {
    id: String(row.playerId ?? row.stableId),
    name: row.playerName,
    team: row.team,
    headshot: row.headshotUrl ?? undefined,
  } as unknown as MLBPlayer;
}

function buildHrProp(row: HrWatchRow, target: 1 | 2) {
  const market = 'Player Home Runs';
  const label = target === 1 ? '1+ HR' : '2+ HR';

  return {
    id: `mlb-hr-${target}-${row.gamePk ?? 'game-tbd'}-${row.playerId ?? row.stableId}`,
    market,
    odds: null,
    spec: `${row.playerName} ${label}`,
    gamePk: row.gamePk ?? undefined,
    playerId: row.playerId ?? undefined,
  };
}


function HrWatchCard({
  row,
  onAddHrLeg,
}: {
  row: HrWatchRow;
  onAddHrLeg?: (row: HrWatchRow, target: 1 | 2) => void;
}) {
  const truthLabel =
    row.truthStatus === 'official'
      ? 'Official lineup'
      : row.truthStatus === 'projected'
        ? 'Projected'
        : row.truthStatus === 'blocked'
          ? 'Blocked'
          : 'Truth TBD';
  const isPreview = row.truthStatus === 'projected';

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-[hsl(var(--ve-border)/0.30)] bg-[linear-gradient(145deg,hsl(var(--ve-surface)/0.88),hsl(var(--ve-surface-raised)/0.44))] p-4 shadow-xl shadow-black/10 transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.012] hover:border-[hsl(var(--ve-accent-cyan)/0.46)] hover:shadow-[0_18px_46px_rgba(34,211,238,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,hsl(var(--ve-accent-cyan)/0),hsl(var(--ve-accent-cyan)/0.72),hsl(var(--ve-accent-gold)/0.62),hsl(var(--ve-accent-cyan)/0))]" />

      <TeamBanner
        team={row.team}
        opponent={row.opponent}
        teamLogoUrl={row.teamLogoUrl}
        opponentLogoUrl={row.opponentLogoUrl}
      />

      <div className="mt-3 flex items-start gap-3 border-b border-[hsl(var(--ve-border)/0.16)] pb-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[hsl(var(--ve-border)/0.34)] bg-black/20 shadow-inner">
          {row.headshotUrl ? (
            <img
              src={row.headshotUrl}
              alt={row.playerName}
              className="h-full w-full object-cover [image-rendering:auto]"
              loading="lazy"
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="font-mono text-xs text-[hsl(var(--ve-text-muted))]">HR</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-[hsl(var(--ve-text-primary))]">
                {row.playerName}
              </h3>
              <p className="truncate text-[11px] font-semibold text-[hsl(var(--ve-text-muted))]">
                Pitcher matchup · {row.pitcherName}
              </p>
              <p className="truncate text-[10px] text-[hsl(var(--ve-text-secondary))]">
                Venue context · {row.venue}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-[hsl(var(--ve-accent-gold)/0.30)] bg-[linear-gradient(145deg,hsl(var(--ve-accent-gold)/0.13),rgba(0,0,0,0.24))] px-3 py-2 text-center shadow-[0_0_24px_rgba(245,158,11,0.10)]">
              <div className="text-[8px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">HR</div>
              <div className="font-mono text-2xl font-black leading-none text-[hsl(var(--ve-accent-gold))]">
                {row.hrScore}
              </div>
              <div className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">
                Score
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[hsl(var(--ve-border)/0.14)] py-3">
        <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wide ${truthBadgeClass(row.truthStatus)}`}>
          {truthLabel}
        </span>
        <span className="rounded-full border border-[hsl(var(--ve-accent-gold)/0.28)] bg-[hsl(var(--ve-accent-gold)/0.09)] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[hsl(var(--ve-accent-gold))]">
          {row.riskTier}
        </span>
        <span className="rounded-full border border-[hsl(var(--ve-border)/0.24)] bg-black/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">
          {row.oddsLabel}
        </span>
      </div>

      {isPreview ? (
        <div className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[11px] font-semibold leading-snug text-amber-100">
          Official lineup not posted yet. Projection preview only; this player is not confirmed.
        </div>
      ) : null}

      {row.truthStatus === 'blocked' ? (
        <div className="mt-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[11px] font-semibold leading-snug text-rose-100">
          Blocked reason: Team mismatch / stale roster assignment
        </div>
      ) : null}

      <div className="py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted))]">
            Model split
          </span>
          <span className="ml-3 h-px flex-1 bg-[linear-gradient(90deg,hsl(var(--ve-border)/0.30),transparent)]" />
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <MathChip label="Hitter" value={row.hitterPower} />
          <MathChip label="Pitcher" value={row.pitcherVulnerability} />
          <MathChip label="Park" value={row.parkFactor} />
          <MathChip label="Vouch" value={row.vouchScore} />
        </div>
      </div>

      {row.reasons.length > 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-[linear-gradient(145deg,rgba(0,0,0,0.18),hsl(var(--ve-surface-raised)/0.20))] px-3 py-2.5">
          <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--ve-accent-cyan))]" />
            Research signals
          </div>
          <div className="space-y-1.5">
            {row.reasons.slice(0, 3).map((reason) => (
              <p
                key={`${row.stableId}-${reason}`}
                className="border-l border-[hsl(var(--ve-accent-cyan)/0.30)] pl-2 text-[11px] leading-snug text-[hsl(var(--ve-text-secondary))]"
              >
                {reason}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {row.warnings.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-3 py-2">
          <div className="mb-1 text-[9px] font-black uppercase tracking-[0.22em] text-amber-200/80">
            Safety notes
          </div>
          {row.warnings.map((warning) => (
            <p key={`${row.stableId}-${warning}`} className="text-[11px] leading-snug text-amber-100/85">
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-3 border-t border-[hsl(var(--ve-border)/0.14)] pt-3">
        <details className="group">
          <summary className="list-none cursor-pointer rounded-2xl border border-[hsl(var(--ve-accent-cyan)/0.34)] bg-[linear-gradient(145deg,hsl(var(--ve-accent-cyan)/0.12),rgba(0,0,0,0.18))] px-3 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:-translate-y-0.5 hover:border-[hsl(var(--ve-accent-cyan)/0.58)] hover:bg-[hsl(var(--ve-accent-cyan)/0.18)]">
            Parlay
          </summary>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (onAddHrLeg == null) return;
                onAddHrLeg(row, 1);
              }}
              disabled={onAddHrLeg == null}
              className="rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-[hsl(var(--ve-surface)/0.96)] px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--ve-text-primary))] transition hover:bg-[hsl(var(--ve-accent-cyan)/0.10)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              1 HR
            </button>
            <button
              type="button"
              onClick={() => {
                if (onAddHrLeg == null) return;
                onAddHrLeg(row, 2);
              }}
              disabled={onAddHrLeg == null}
              className="rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-[hsl(var(--ve-surface)/0.96)] px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--ve-text-primary))] transition hover:bg-[hsl(var(--ve-accent-gold)/0.10)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              2 HR
            </button>
          </div>
        </details>
      </div>
    </article>
  );
}

function tierDisplayLabel(riskTier: unknown): 'Vouch Elite' | 'Core Targets' | 'Watch List' | 'Deep Research' {
  const raw = String(riskTier).toLowerCase();

  if (raw.includes('elite')) return 'Vouch Elite';
  if (raw.includes('core')) return 'Core Targets';
  if (raw.includes('watch')) return 'Watch List';
  return 'Deep Research';
}

function groupRowsByTier(rows: readonly HrWatchRow[]): Array<{
  key: string;
  title: string;
  subtitle: string;
  rows: HrWatchRow[];
}> {
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
      return {
        key,
        title: meta[key].title,
        subtitle: meta[key].subtitle,
        rows: bucket,
      };
    })
    .filter((bucket) => bucket.rows.length > 0);
}


function groupRowsByGame(rows: readonly HrWatchRow[]): Array<{
  key: string;
  title: string;
  subtitle: string;
  rows: HrWatchRow[];
}> {
  const buckets = new Map<string, HrWatchRow[]>();

  for (const row of rows) {
    const key = String(row.gamePk ?? row.stableId);
    const existing = buckets.get(key);
    if (existing) {
      existing.push(row);
    } else {
      buckets.set(key, [row]);
    }
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

function TierSection({
  title,
  subtitle,
  rows,
  visibleCount,
  onLoadMore,
  onAddHrLeg,
}: {
  title: string;
  subtitle: string;
  rows: readonly HrWatchRow[];
  visibleCount: number;
  onLoadMore: () => void;
  onAddHrLeg?: (row: HrWatchRow, target: 1 | 2) => void;
}) {
  const shownRows = rows.slice(0, visibleCount);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-primary))]">
            {title}
          </h2>
          <p className="mt-1 text-xs text-[hsl(var(--ve-text-muted))]">{subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
            Showing {shownRows.length}/{rows.length}
          </div>
          {shownRows.length < rows.length ? (
            <button
              type="button"
              onClick={onLoadMore}
              className="mt-1 rounded-full border border-[hsl(var(--ve-border)/0.24)] bg-[hsl(var(--ve-surface-raised)/0.16)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-primary))]"
            >
              Load 18 more
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {shownRows.map((row) => (
          <HrWatchCard key={row.stableId} row={row} onAddHrLeg={onAddHrLeg} />
        ))}
      </div>
    </section>
  );
}

export default function DailyHrWatchNewPage({ profile, onAddLegToParlay }: DailyHrWatchNewPageProps) {
  const [board, setBoard] = useState<HrWatchBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<HrWatchMode>('confirmed');
  const [search, setSearch] = useState('');
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
    'Vouch Elite': 18,
    'Core Targets': 18,
    'Watch List': 18,
    'Deep Research': 18,
  });

  const isProAccount = profile != null;

  useEffect(() => {
    let alive = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await vouchedgeApi.hrBoardToday();
        if (!alive) return;
        const nextBoard = buildBoard(response as unknown);
        setBoard(nextBoard);
        setMode(nextBoard.confirmed.length > 0 ? 'confirmed' : nextBoard.curated.length > 0 ? 'curated' : 'blocked');
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load Daily HR Watch.');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const allRows = useMemo<readonly HrWatchRow[]>(() => {
    if (!board) return [];
    return rowsForMode(board, mode);
  }, [board, mode]);

  const activeRows = useMemo<readonly HrWatchRow[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;

    return allRows.filter((row) => {
      const haystack = [
        row.playerName,
        row.team,
        row.opponent,
        row.pitcherName,
        row.venue,
        row.truthStatus,
        row.riskTier,
        row.oddsLabel,
        ...row.reasons,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [allRows, search]);

  const handleLoadMore = (tierKey: string): void => {
    setVisibleCounts((previous) => ({
      ...previous,
      [tierKey]: (previous[tierKey] ?? 18) + 18,
    }));
  };

  const handleAddHrLeg = (row: HrWatchRow, target: 1 | 2): void => {
    if (!onAddLegToParlay) return;
    onAddLegToParlay(toMlbPlayerForParlay(row), buildHrProp(row, target));
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--ve-bg))] text-[hsl(var(--ve-text-primary))]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 pb-10 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-[hsl(var(--ve-border)/0.22)] bg-[linear-gradient(145deg,hsl(var(--ve-surface)/0.96),hsl(var(--ve-surface-raised)/0.56))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--ve-text-muted))]">
                Verified MLB HR Board
              </p>
              <h1 className="text-2xl font-black tracking-tight text-[hsl(var(--ve-text-primary))]">
                HR board
              </h1>
              <p className="max-w-2xl text-sm text-[hsl(var(--ve-text-muted))]">
                {board?.truthMessage ??
                  'Confirmed rows use official batting orders only. Preview rows stay clearly marked until lineups post.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-right">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-100/70">
                  Confirmed
                </div>
                <div className="font-mono text-2xl font-black text-emerald-200">
                  {board?.counts.confirmedCandidates ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-100/70">
                  Preview
                </div>
                <div className="font-mono text-2xl font-black text-amber-200">
                  {board?.counts.projectedCandidates ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-100/70">
                  Blocked
                </div>
                <div className="font-mono text-2xl font-black text-rose-200">
                  {board?.counts.blockedPlayers ?? 0}
                </div>
              </div>
            </div>
          </div>

          {mode === 'curated' || mode === 'all' ? (
            <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100">
              Official lineup not posted yet. Projection preview rows are safe roster previews only and are never treated as confirmed candidates.
            </div>
          ) : null}

          {board?.counts.hiddenProjectedCandidates ? (
            <div className="mt-3 text-xs font-semibold text-[hsl(var(--ve-text-muted))]">
              {board.counts.hiddenProjectedCandidates} additional projected rows are hidden by the backend preview limit.
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-2 rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-black/10 px-3 py-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
                Search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Player, team, pitcher, venue..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[hsl(var(--ve-text-muted))]"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {(['confirmed', 'curated', 'all', 'blocked'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                    mode === item
                      ? 'border-[hsl(var(--ve-accent-cyan)/0.44)] bg-[hsl(var(--ve-accent-cyan)/0.12)] text-cyan-100'
                      : 'border-[hsl(var(--ve-border)/0.22)] bg-black/10 text-[hsl(var(--ve-text-muted))]'
                  }`}
                >
                  {item === 'confirmed'
                    ? `Confirmed ${board?.confirmed.length ?? 0}`
                    : item === 'curated'
                      ? `Preview ${board?.curated.length ?? 0}`
                      : item === 'all'
                        ? `All Projected ${board?.all.length ?? 0}`
                        : `Blocked ${board?.blocked.length ?? 0}`}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-[hsl(var(--ve-border)/0.22)] bg-[linear-gradient(145deg,hsl(var(--ve-surface)/0.92),hsl(var(--ve-surface-raised)/0.48))] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--ve-text-muted))]">
                Pro modules
              </p>
              <h2 className="text-lg font-black">
                {isProAccount ? 'Unlocked' : 'Locked'}
              </h2>
            </div>
            <div className="rounded-full border border-[hsl(var(--ve-border)/0.24)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
              {isProAccount ? 'Pro access' : 'Upgrade required'}
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {[
              'Advanced Swing Path',
              'Pitcher Mistake Zones',
              'Park / Weather Boost',
              'Recent Barrel Trend',
            ].map((module) => (
              <div
                key={module}
                className={`rounded-2xl border px-3 py-3 text-sm ${
                  isProAccount
                    ? 'border-[hsl(var(--ve-accent-cyan)/0.22)] bg-[hsl(var(--ve-accent-cyan)/0.08)]'
                    : 'border-[hsl(var(--ve-border)/0.22)] bg-black/10 opacity-80'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
                  {isProAccount ? 'Unlocked' : 'Locked'}
                </div>
                <div className="mt-1 font-semibold">{module}</div>
              </div>
            ))}
          </div>
        </section>

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.42)]"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface)/0.42)] p-8 text-center">
            <h2 className="text-lg font-black text-[hsl(var(--ve-text-primary))]">Screen failed safely</h2>
            <p className="mt-1 text-sm text-[hsl(var(--ve-text-muted))]">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && activeRows.length === 0 && (
          <div className="rounded-3xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface)/0.42)] p-8 text-center">
            <h2 className="text-lg font-black text-[hsl(var(--ve-text-primary))]">No HR rows in this view yet</h2>
            <p className="mt-1 text-sm text-[hsl(var(--ve-text-muted))]">
              Try All Projected, clear search, or wait for lineup confirmation.
            </p>
          </div>
        )}

        {!loading && !error && activeRows.length > 0 && (
          <div className="space-y-5">
            {groupRowsByGame(activeRows).map((game) => {
              const gameTierGroups = groupRowsByTier(game.rows);

              return (
                <section
                  key={game.key}
                  className="space-y-4 rounded-3xl border border-[hsl(var(--ve-border)/0.22)] bg-[linear-gradient(145deg,hsl(var(--ve-surface)/0.88),hsl(var(--ve-surface-raised)/0.40))] p-4"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-[hsl(var(--ve-border)/0.14)] pb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--ve-text-muted))]">
                        Game
                      </p>
                      <h2 className="truncate text-lg font-black text-[hsl(var(--ve-text-primary))]">
                        {game.title}
                      </h2>
                      <p className="mt-1 text-xs text-[hsl(var(--ve-text-muted))]">
                        {game.subtitle}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-[hsl(var(--ve-border)/0.24)] bg-black/10 px-3 py-2 text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
                        Rows
                      </div>
                      <div className="font-mono text-2xl font-black text-[hsl(var(--ve-accent-gold))]">
                        {game.rows.length}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {gameTierGroups.map((tier) => (
                      <TierSection
                        key={`${game.key}-${tier.key}`}
                        title={tier.title}
                        subtitle={tier.subtitle}
                        rows={tier.rows}
                        visibleCount={visibleCounts[`${game.key}:${tier.key}`] ?? 18}
                        onLoadMore={() => handleLoadMore(`${game.key}:${tier.key}`)}
                        onAddHrLeg={handleAddHrLeg}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
