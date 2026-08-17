import React, { useState } from 'react';
import { Trophy, Plus, Search, Star, X, Flame, Layers, Info } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { toHrpi, tierForScore } from '../utils/tierPartition';
import { formatGameTime } from '../utils/cardUtils';
import {
  STACK_RATING_METHODOLOGY,
  XHR_METHODOLOGY,
  type TeamRankings,
  type TeamStackRanking,
} from '../utils/teamRanking';

/**
 * Team HR power rankings — the "Rank Teams" transform of the By Game board.
 *
 * Ordering, every metric, and every player line come from `buildTeamRankings`,
 * which reads typed board fields only. Where the pipeline published nothing the
 * tile says so rather than showing a number.
 */

/** Bats listed per team before the expander appears. */
const ROWS_PER_STACK = 5;
/** Legs sent when a stack is added to the slip in one click. */
const STACK_LEGS = 3;

const RANK_ACCENTS = ['#10B981', '#6EE7B7', '#F59E0B'] as const;

function rankAccent(rank: number): string {
  return RANK_ACCENTS[rank - 1] ?? '#64748B';
}

interface HrNextTeamRankViewProps {
  rankings: TeamRankings;
  /** What the ranking covers — the full slate or one selected game. */
  scopeLabel: string;
  savedMap: Record<string, true>;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrWatchRow) => void;
  onOpenResearch: (player: { id: string | number; name: string }) => void;
  onClose: () => void;
}

interface MetricProps {
  label: string;
  value: string;
  accent?: string;
}

function Metric({ label, value, accent = '#FFFFFF' }: MetricProps) {
  return (
    <div className="min-w-0 rounded-lg border border-white/[0.07] bg-[#060a0a] px-2.5 py-2">
      <span className="block truncate font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
      </span>
      <strong
        className="mt-1 block truncate font-mono text-sm font-black leading-none tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </strong>
    </div>
  );
}

function TeamStackCard({
  stack,
  leaderMetric,
  basis,
  savedMap,
  onToggleSaved,
  onAddToSlip,
  onOpenResearch,
}: {
  stack: TeamStackRanking;
  leaderMetric: number;
  basis: TeamRankings['basis'];
  savedMap: Record<string, true>;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrWatchRow) => void;
  onOpenResearch: (player: { id: string | number; name: string }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const accent = rankAccent(stack.rank);
  const isLeader = stack.rank === 1;

  const metric = basis === 'xhr' ? (stack.expectedHr ?? 0) : stack.stackRating;
  const barPct = leaderMetric > 0 ? Math.max(6, Math.round((metric / leaderMetric) * 100)) : 0;

  const headlineValue = basis === 'xhr' && stack.expectedHr != null
    ? stack.expectedHr.toFixed(2)
    : String(stack.stackRating);
  const headlineLabel = basis === 'xhr' && stack.expectedHr != null ? 'Expected HR' : 'Stack Rating';

  const coverageNote = stack.expectedHr == null
    ? 'No batter on this stack carries a model HR probability'
    : stack.pricedRows < stack.batters
      ? `${stack.pricedRows} of ${stack.batters} bats priced by the model`
      : `All ${stack.batters} bats priced by the model`;

  const secondary = basis === 'xhr'
    ? `Stack Rating ${stack.stackRating}`
    : stack.expectedHr != null
      ? `xHR ${stack.expectedHr.toFixed(2)} · ${stack.pricedRows}/${stack.batters} priced`
      : 'xHR unavailable';

  const visibleRows = expanded ? stack.rows : stack.rows.slice(0, ROWS_PER_STACK);
  const stackLegs = stack.rows.slice(0, STACK_LEGS);

  return (
    <section
      aria-label={`${stack.team} home run stack, ranked ${stack.rank}`}
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-[#0a1010] transition-colors ${
        isLeader ? 'border-[#10B981]/35' : 'border-white/[0.07] hover:border-white/15'
      }`}
    >
      {/* ── Stack header ─────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.07] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#060a0a] p-2">
              {stack.teamLogoUrl ? (
                <img src={stack.teamLogoUrl} alt="" className="h-9 w-9 object-contain" />
              ) : (
                <span className="font-mono text-sm font-black text-white">{stack.team.slice(0, 3)}</span>
              )}
              <span
                className="absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-lg border border-black/50 font-mono text-[10px] font-black text-black tabular-nums"
                style={{ backgroundColor: accent }}
              >
                {stack.rank}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded-md border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.14em]"
                  style={{ color: accent, borderColor: `${accent}59`, backgroundColor: `${accent}1F` }}
                >
                  #{stack.rank} HR Stack
                </span>
                <span className="font-mono text-[10px] font-semibold text-white/45">
                  {stack.isHome === false ? '@' : 'vs'} {stack.opponent}
                </span>
              </div>
              <h3 className="mt-1 truncate text-lg font-black leading-tight text-white">{stack.team}</h3>
              <p className="truncate font-mono text-[10px] text-white/45">
                {stack.pitcherName ? `SP ${stack.pitcherName}` : 'Probable pitcher unavailable'}
                {stack.gameTime ? ` · ${formatGameTime(stack.gameTime)}` : ''}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="block font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/40">
              {headlineLabel}
            </span>
            <strong
              className="block font-mono text-2xl font-black leading-none tabular-nums"
              style={{ color: accent }}
            >
              {headlineValue}
            </strong>
            <span className="mt-0.5 block font-mono text-[9px] font-semibold text-white/40">{secondary}</span>
          </div>
        </div>

        {/* Relative-strength bar against the top-ranked stack */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${barPct}%`, backgroundColor: accent }}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Top HRPI" value={String(stack.topHrpi)} accent={stack.tier.accent} />
          <Metric label="Top 3 Avg" value={String(stack.topAvgHrpi)} accent={stack.tier.accent} />
          <Metric label="70+ Bats" value={`${stack.depthCount}/${stack.batters}`} />
          <Metric
            label="Best EV"
            value={stack.bestEvPct != null ? `${stack.bestEvPct > 0 ? '+' : ''}${stack.bestEvPct}%` : 'N/A'}
            accent={stack.bestEvPct != null && stack.bestEvPct > 0 ? '#10B981' : '#FFFFFF'}
          />
        </div>
      </header>

      {/* ── Bats ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
            Power Bats ({stack.batters})
          </span>
          <span className="font-mono text-[9px] font-semibold text-white/35">
            {stack.confirmedRows}/{stack.batters} lineup confirmed
          </span>
        </div>

        {visibleRows.map((row, index) => {
          const hrpi = toHrpi(row.hrScore);
          const tier = tierForScore(row.hrScore);
          const saved = Boolean(savedMap[row.stableId]);
          const oddsLabel = row.oddsLabel?.trim()
            ? row.oddsLabel.trim()
            : typeof row.bookOdds === 'number' && Number.isFinite(row.bookOdds)
              ? `${row.bookOdds > 0 ? '+' : ''}${row.bookOdds}`
              : null;
          const prob = typeof row.hrProbability === 'number' && Number.isFinite(row.hrProbability)
            ? `${Math.round(row.hrProbability * 1000) / 10}%`
            : null;

          return (
            <div
              key={row.stableId}
              id={`team-rank-bat-${row.stableId}`}
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#060a0a] px-3 py-2.5 transition-colors hover:border-white/15"
            >
              <span className="w-4 shrink-0 font-mono text-[10px] font-bold tabular-nums text-white/25">
                {index + 1}
              </span>
              <PlayerHeadshot
                name={row.playerName}
                playerId={row.playerId}
                headshotUrl={row.headshotUrl}
                size={34}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-bold leading-tight text-white">{row.playerName}</span>
                  {row.truthStatus === 'official' && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" title="Lineup confirmed" />
                  )}
                  {typeof row.recentHomeRuns === 'number' && row.recentHomeRuns > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded border border-[#F59E0B]/35 bg-[#F59E0B]/15 px-1 font-mono text-[8.5px] font-black text-[#F59E0B]">
                      <Flame className="h-2.5 w-2.5" />
                      {row.recentHomeRuns}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 block truncate font-mono text-[9.5px] font-semibold text-white/40">
                  {oddsLabel ?? 'Odds unavailable'}
                  {prob ? ` · Model ${prob}` : ''}
                </span>
              </div>

              <div className="shrink-0 text-right">
                <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-white/35">
                  HRPI
                </span>
                <strong
                  className="block font-mono text-sm font-black leading-none tabular-nums"
                  style={{ color: tier.accent }}
                >
                  {hrpi}
                </strong>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenResearch({ id: row.playerId || row.stableId, name: row.playerName })}
                  title={`Research ${row.playerName}`}
                  aria-label={`Research ${row.playerName}`}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-[#0a1010] text-white/45 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleSaved(row.stableId)}
                  aria-pressed={saved}
                  title={saved ? 'Remove from saved' : 'Save row'}
                  aria-label={saved ? `Remove ${row.playerName} from saved` : `Save ${row.playerName}`}
                  className={`grid h-7 w-7 place-items-center rounded-lg border transition-colors ${
                    saved
                      ? 'border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#F59E0B]'
                      : 'border-white/[0.07] bg-[#0a1010] text-white/45 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onAddToSlip(row)}
                  title={`Add ${row.playerName} to slip`}
                  aria-label={`Add ${row.playerName} to slip`}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-[#10B981]/35 bg-[#10B981]/15 text-[#10B981] transition-colors hover:bg-[#10B981]/25"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {stack.rows.length > ROWS_PER_STACK && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="w-full rounded-lg border border-white/[0.07] bg-[#060a0a] px-3 py-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50 transition-colors hover:border-white/20 hover:text-white"
          >
            {expanded ? `Show top ${ROWS_PER_STACK}` : `Show all ${stack.rows.length} bats`}
          </button>
        )}
      </div>

      {/* ── Stack action ─────────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3">
        <span className="min-w-0 truncate font-mono text-[9px] font-semibold text-white/35">{coverageNote}</span>
        <button
          type="button"
          onClick={() => stackLegs.forEach((row) => onAddToSlip(row))}
          className="shrink-0 rounded-lg border border-[#10B981]/35 bg-[#10B981]/15 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#10B981] transition-colors hover:bg-[#10B981]/25"
        >
          <Plus className="mr-1 inline h-3 w-3" />
          Stack top {stackLegs.length}
        </button>
      </footer>
    </section>
  );
}

export const HrNextTeamRankView = React.memo(function HrNextTeamRankView({
  rankings,
  scopeLabel,
  savedMap,
  onToggleSaved,
  onAddToSlip,
  onOpenResearch,
  onClose,
}: HrNextTeamRankViewProps) {
  const { teams, basis } = rankings;

  if (teams.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#0a1010] px-6 py-12 text-center font-mono text-xs text-white/40">
        No teams to rank under the active filters.
      </div>
    );
  }

  const leaderMetric = basis === 'xhr'
    ? (teams[0].expectedHr ?? 0)
    : teams[0].stackRating;

  const basisLabel = basis === 'xhr' ? 'Ranked by expected HR' : 'Ranked by Stack Rating';
  const basisNote = basis === 'xhr'
    ? XHR_METHODOLOGY
    : `Model HR probabilities are missing for part of this pool, so the board ranks on the composite instead of a projected HR total. ${STACK_RATING_METHODOLOGY}`;

  return (
    <section aria-label="Team home run power rankings" className="space-y-4">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0a1010] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#10B981]/35 bg-[#10B981]/15 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#10B981]">
                <Trophy className="h-3 w-3" />
                Team Power Rankings
              </span>
              <span className="font-mono text-[10px] font-semibold text-white/40">{scopeLabel}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Which lineup goes deep first
            </h2>
            <p className="max-w-2xl font-mono text-[10.5px] leading-relaxed text-white/45">
              {basisLabel}. {basisNote}
            </p>
          </div>

          <div className="flex shrink-0 items-start gap-2">
            <div className="rounded-xl border border-white/[0.07] bg-[#060a0a] px-4 py-3 text-center">
              <span className="block font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/40">
                Teams Ranked
              </span>
              <strong className="mt-1 block font-mono text-2xl font-black leading-none tabular-nums text-[#10B981]">
                {teams.length}
              </strong>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Back to the game board"
              aria-label="Back to the game board"
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] bg-[#060a0a] text-white/45 transition-colors hover:border-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Ladder — every ranked team in order, at a glance */}
        <div className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-3">
          <span className="flex items-center gap-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/35">
            <Layers className="h-3 w-3" />
            Power ladder
          </span>
          {teams.map((team) => {
            const value = basis === 'xhr' ? (team.expectedHr ?? 0) : team.stackRating;
            const pct = leaderMetric > 0 ? Math.max(4, Math.round((value / leaderMetric) * 100)) : 0;
            const accent = rankAccent(team.rank);
            return (
              <div key={team.team} className="flex items-center gap-2.5">
                <span className="w-5 shrink-0 font-mono text-[10px] font-black tabular-nums text-white/30">
                  {team.rank}
                </span>
                {team.teamLogoUrl ? (
                  <img src={team.teamLogoUrl} alt="" className="h-4 w-4 shrink-0 object-contain" />
                ) : (
                  <span className="h-4 w-4 shrink-0" />
                )}
                <span className="w-12 shrink-0 truncate font-mono text-[10px] font-bold text-white/70">
                  {team.team}
                </span>
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: accent }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[10px] font-black tabular-nums text-white/60">
                  {basis === 'xhr' && team.expectedHr != null ? team.expectedHr.toFixed(2) : team.stackRating}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-3 flex items-start gap-1.5 border-t border-white/[0.07] pt-2.5 font-mono text-[9px] leading-relaxed text-white/30">
          <Info className="mt-px h-3 w-3 shrink-0" />
          {STACK_RATING_METHODOLOGY}
        </p>
      </div>

      {/* ── Ranked stacks ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        {teams.map((team) => (
          <TeamStackCard
            key={team.team}
            stack={team}
            leaderMetric={leaderMetric}
            basis={basis}
            savedMap={savedMap}
            onToggleSaved={onToggleSaved}
            onAddToSlip={onAddToSlip}
            onOpenResearch={onOpenResearch}
          />
        ))}
      </div>
    </section>
  );
});
