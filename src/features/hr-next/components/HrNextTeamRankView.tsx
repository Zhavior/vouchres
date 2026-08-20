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

const ROWS_PER_STACK = 5;
const STACK_LEGS = 3;
const RANK_ACCENTS = ['#10B981', '#6EE7B7', '#F59E0B'] as const;

function rankAccent(rank: number): string {
  return RANK_ACCENTS[rank - 1] ?? '#64748B';
}

interface HrNextTeamRankViewProps {
  rankings: TeamRankings;
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
    <div className="min-w-0 border border-white/15 bg-zinc-950 px-2.5 py-2 font-mono">
      <span className="block truncate text-[8.5px] font-black uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <strong
        className="mt-1 block truncate text-sm font-black leading-none tabular-nums"
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
  const headlineLabel = basis === 'xhr' && stack.expectedHr != null ? 'EXPECTED HR' : 'STACK RATING';

  const coverageNote = stack.expectedHr == null
    ? 'NO MODEL PROBABILITY PUBLISHED'
    : stack.pricedRows < stack.batters
      ? `${stack.pricedRows}/${stack.batters} BATS PRICED BY MODEL`
      : `ALL ${stack.batters} BATS PRICED BY MODEL`;

  const secondary = basis === 'xhr'
    ? `STACK RATING ${stack.stackRating}`
    : stack.expectedHr != null
      ? `xHR ${stack.expectedHr.toFixed(2)} · ${stack.pricedRows}/${stack.batters} PRICED`
      : 'xHR UNAVAILABLE';

  const visibleRows = expanded ? stack.rows : stack.rows.slice(0, ROWS_PER_STACK);
  const stackLegs = stack.rows.slice(0, STACK_LEGS);

  return (
    <section
      aria-label={`${stack.team} home run stack, ranked ${stack.rank}`}
      className={`flex min-w-0 flex-col border-2 bg-black font-mono shadow-md ${
        isLeader ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-white/15'
      }`}
    >
      {/* ── Stack header ─────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center border-2 border-white/20 bg-zinc-950 p-2">
              {stack.teamLogoUrl ? (
                <img src={stack.teamLogoUrl} alt="" className="h-9 w-9 object-contain" />
              ) : (
                <span className="font-mono text-sm font-black text-white">{stack.team.slice(0, 3)}</span>
              )}
              <span
                className="absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center border border-black font-mono text-[10px] font-black text-black tabular-nums"
                style={{ backgroundColor: accent }}
              >
                {stack.rank}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
                  style={{ color: accent, borderColor: `${accent}60`, backgroundColor: `${accent}1F` }}
                >
                  #{stack.rank} HR STACK
                </span>
                <span className="text-[10px] font-bold text-zinc-400">
                  {stack.isHome === false ? '@' : 'vs'} {stack.opponent}
                </span>
              </div>
              <h3 className="mt-1 truncate text-lg font-black leading-tight text-white uppercase">{stack.team}</h3>
              <p className="truncate text-xs text-zinc-400">
                {stack.pitcherName ? `SP ${stack.pitcherName}` : 'STARTER TBD'}
                {stack.gameTime ? ` · ${formatGameTime(stack.gameTime)}` : ''}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right font-mono">
            <span className="block text-[8.5px] font-black uppercase tracking-widest text-zinc-500">
              {headlineLabel}
            </span>
            <strong
              className="block text-2xl font-black leading-none tabular-nums font-sans"
              style={{ color: accent }}
            >
              {headlineValue}
            </strong>
            <span className="mt-1 block text-[9px] font-bold text-zinc-500">{secondary}</span>
          </div>
        </div>

        {/* Strength bar */}
        <div className="mt-3 h-1.5 w-full bg-zinc-900">
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${barPct}%`, backgroundColor: accent }}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="TOP HRPI" value={String(stack.topHrpi)} accent={stack.tier.accent} />
          <Metric label="TOP 3 AVG" value={String(stack.topAvgHrpi)} accent={stack.tier.accent} />
          <Metric label="70+ BATS" value={`${stack.depthCount}/${stack.batters}`} />
          <Metric
            label="BEST EV"
            value={stack.bestEvPct != null ? `${stack.bestEvPct > 0 ? '+' : ''}${stack.bestEvPct}%` : 'N/A'}
            accent={stack.bestEvPct != null && stack.bestEvPct > 0 ? '#10B981' : '#FFFFFF'}
          />
        </div>
      </header>

      {/* ── Bats ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-2 p-4">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
            POWER BATS ({stack.batters})
          </span>
          <span className="text-[9px] font-bold text-cyan-400">
            {stack.confirmedRows}/{stack.batters} CONFIRMED
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
              className="flex items-center gap-3 border border-white/10 bg-zinc-950 px-3 py-2 transition-colors hover:border-white/25"
            >
              <span className="w-4 shrink-0 text-[10px] font-bold tabular-nums text-zinc-500">
                {index + 1}
              </span>
              <div className="border border-white/15">
                <PlayerHeadshot
                  name={row.playerName}
                  playerId={row.playerId}
                  headshotUrl={row.headshotUrl}
                  size={32}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold leading-tight text-white uppercase">{row.playerName}</span>
                  {row.truthStatus === 'official' && (
                    <span className="h-1.5 w-1.5 shrink-0 bg-emerald-400" title="Lineup confirmed" />
                  )}
                  {typeof row.recentHomeRuns === 'number' && row.recentHomeRuns > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 border border-amber-500/40 bg-amber-950/40 px-1 text-[8.5px] font-black text-amber-300">
                      <Flame className="h-2.5 w-2.5" />
                      {row.recentHomeRuns}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 block truncate text-[9.5px] font-semibold text-zinc-400">
                  {oddsLabel ?? 'NO ODDS'}
                  {prob ? ` · MODEL ${prob}` : ''}
                </span>
              </div>

              <div className="shrink-0 text-right">
                <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">
                  HRPI
                </span>
                <strong
                  className="block text-sm font-black leading-none tabular-nums font-sans"
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
                  className="grid h-7 w-7 place-items-center border border-white/15 bg-black text-zinc-400 hover:border-white hover:text-white transition-colors cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleSaved(row.stableId)}
                  aria-pressed={saved}
                  title={saved ? 'Remove from saved' : 'Save row'}
                  aria-label={saved ? `Remove ${row.playerName} from saved` : `Save ${row.playerName}`}
                  className={`grid h-7 w-7 place-items-center border transition-colors cursor-pointer ${
                    saved
                      ? 'border-amber-400/60 bg-amber-950/40 text-amber-300'
                      : 'border-white/15 bg-black text-zinc-500 hover:border-white hover:text-white'
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onAddToSlip(row)}
                  title={`Add ${row.playerName} to slip`}
                  aria-label={`Add ${row.playerName} to slip`}
                  className="grid h-7 w-7 place-items-center border border-cyan-400/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer"
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
            className="w-full border border-white/15 bg-zinc-950 px-3 py-2 text-[9.5px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:border-white hover:text-white cursor-pointer"
          >
            {expanded ? `SHOW TOP ${ROWS_PER_STACK}` : `SHOW ALL ${stack.rows.length} BATS`}
          </button>
        )}
      </div>

      {/* ── Stack action ─────────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 bg-zinc-950">
        <span className="min-w-0 truncate text-[9px] font-bold text-zinc-500 uppercase">{coverageNote}</span>
        <button
          type="button"
          onClick={() => stackLegs.forEach((row) => onAddToSlip(row))}
          className="shrink-0 border border-emerald-400 bg-emerald-400 text-black px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-300 transition-colors cursor-pointer"
        >
          <Plus className="mr-1 inline h-3 w-3" />
          STACK TOP {stackLegs.length}
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
      <div className="border-2 border-dashed border-white/15 bg-black p-12 text-center font-mono text-xs text-zinc-500">
        NO TEAMS TO RANK UNDER ACTIVE FILTERS.
      </div>
    );
  }

  const leaderMetric = basis === 'xhr'
    ? (teams[0].expectedHr ?? 0)
    : teams[0].stackRating;

  const basisLabel = basis === 'xhr' ? 'RANKED BY EXPECTED HR' : 'RANKED BY STACK RATING';
  const basisNote = basis === 'xhr'
    ? XHR_METHODOLOGY
    : `Model HR probabilities are missing for part of this pool, so the board ranks on the composite instead of a projected HR total. ${STACK_RATING_METHODOLOGY}`;

  return (
    <section aria-label="Team home run power rankings" className="space-y-4 font-mono">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="border-2 border-white/15 bg-black p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 border border-emerald-400/50 bg-emerald-950/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
                <Trophy className="h-3 w-3" />
                TEAM POWER RANKINGS
              </span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase">{scopeLabel}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
              Which Lineup Goes Deep First
            </h2>
            <p className="max-w-2xl text-[10.5px] leading-relaxed text-zinc-400">
              {basisLabel}. {basisNote}
            </p>
          </div>

          <div className="flex shrink-0 items-start gap-2">
            <div className="border-2 border-white/15 bg-zinc-950 px-4 py-2.5 text-center">
              <span className="block text-[8.5px] font-black uppercase tracking-widest text-zinc-500">
                TEAMS RANKED
              </span>
              <strong className="mt-1 block text-2xl font-black leading-none tabular-nums text-emerald-400 font-sans">
                {teams.length}
              </strong>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Back to the game board"
              aria-label="Back to the game board"
              className="grid h-9 w-9 place-items-center border border-white/20 bg-zinc-900 text-zinc-400 hover:border-white hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Ladder */}
        <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
          <span className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-zinc-500">
            <Layers className="h-3 w-3" />
            POWER LADDER
          </span>
          {teams.map((team) => {
            const value = basis === 'xhr' ? (team.expectedHr ?? 0) : team.stackRating;
            const pct = leaderMetric > 0 ? Math.max(4, Math.round((value / leaderMetric) * 100)) : 0;
            const accent = rankAccent(team.rank);
            return (
              <div key={team.team} className="flex items-center gap-2.5">
                <span className="w-5 shrink-0 text-[10px] font-black tabular-nums text-zinc-500">
                  {team.rank}
                </span>
                {team.teamLogoUrl ? (
                  <img src={team.teamLogoUrl} alt="" className="h-4 w-4 shrink-0 object-contain" />
                ) : (
                  <span className="h-4 w-4 shrink-0" />
                )}
                <span className="w-12 shrink-0 truncate text-[10px] font-bold text-zinc-300">
                  {team.team}
                </span>
                <div className="h-1.5 min-w-0 flex-1 bg-zinc-900">
                  <div
                    className="h-full transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: accent }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-[10px] font-black tabular-nums text-zinc-400">
                  {basis === 'xhr' && team.expectedHr != null ? team.expectedHr.toFixed(2) : team.stackRating}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-3 flex items-start gap-1.5 border-t border-white/10 pt-2.5 text-[9px] leading-relaxed text-zinc-500">
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

export default HrNextTeamRankView;

