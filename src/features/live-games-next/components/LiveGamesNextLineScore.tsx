import React, { useMemo } from 'react';
import { Radio, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { GameMatchup } from '../../../types/matchup';
import type { OfficialLineScore } from '../api/officialLineScore';

/**
 * Official Line Score — MLB StatsAPI `linescore`, rendered verbatim in sharp HUD matrix style.
 */

export interface LiveGamesNextLineScoreProps {
  game: GameMatchup;
  lineScore: OfficialLineScore | null;
  isLoading: boolean;
  isError: boolean;
  compact?: boolean;
}

const MIN_COLUMNS = 9;

function cell(value: number | null): string {
  return value == null ? '–' : String(value);
}

function Frame({
  children,
  compact,
  badge,
  badgeTone,
}: {
  children: React.ReactNode;
  compact?: boolean;
  badge: string;
  badgeTone: string;
}) {
  return (
    <section
      data-testid="live-next-linescore"
      aria-label="Official line score"
      className={`w-full min-w-0 border-2 border-white/15 bg-black font-mono shadow-2xl ${
        compact ? 'p-3' : 'p-4 sm:p-5'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-cyan-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">
            OFFICIAL LINE SCORE MATRIX
          </h3>
          <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase border tracking-wider ${badgeTone}`}>
            {badge}
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          MLB STATSAPI · LINESCORE VERIFIED
        </span>
      </div>
      {children}
    </section>
  );
}

export const LiveGamesNextLineScore = React.memo(function LiveGamesNextLineScore({
  game,
  lineScore,
  isLoading,
  isError,
  compact = false,
}: LiveGamesNextLineScoreProps) {
  const columns = useMemo(() => {
    const published = lineScore?.innings ?? [];
    const total = Math.max(
      MIN_COLUMNS,
      lineScore?.scheduledInnings ?? MIN_COLUMNS,
      published.length,
      lineScore?.currentInning ?? 0,
    );
    return Array.from({ length: total }, (_, index) => {
      const num = index + 1;
      return published.find((inning) => inning.num === num) ?? { num, ordinal: String(num), away: null, home: null };
    });
  }, [lineScore]);

  if (isError) {
    return (
      <Frame compact={compact} badge="FEED DOWN" badgeTone="border-rose-500/40 bg-rose-500/15 text-rose-300">
        <p className="flex items-center gap-2 py-4 text-xs text-zinc-400">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          The MLB line score feed did not respond. No estimations applied — retry with Fast Sync.
        </p>
      </Frame>
    );
  }

  if (isLoading && !lineScore) {
    return (
      <Frame compact={compact} badge="SYNCING" badgeTone="border-white/20 bg-zinc-900 text-zinc-400">
        <div className="space-y-2 py-2" aria-hidden="true">
          <div className="h-4 w-full animate-pulse bg-zinc-900 border border-white/10" />
          <div className="h-6 w-full animate-pulse bg-zinc-900 border border-white/10" />
          <div className="h-6 w-full animate-pulse bg-zinc-900 border border-white/10" />
        </div>
      </Frame>
    );
  }

  if (!lineScore) {
    return (
      <Frame compact={compact} badge="SCHEDULED" badgeTone="border-white/20 bg-zinc-900 text-zinc-400">
        <p className="py-4 text-xs leading-relaxed text-zinc-400">
          MLB has not published in-game per-inning runs for this scheduled matchup yet. Inning scores appear here the moment the official feed transmits them.
        </p>
      </Frame>
    );
  }

  const badgeTone = lineScore.isLive
    ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
    : lineScore.isFinal
      ? 'border-white/20 bg-zinc-900 text-zinc-400'
      : 'border-emerald-400/40 bg-emerald-950/40 text-emerald-300';

  const battingSide: 'away' | 'home' | null = lineScore.isLive
    ? lineScore.isTopInning === true
      ? 'away'
      : lineScore.isTopInning === false
        ? 'home'
        : null
    : null;

  const rows = [
    {
      side: 'away' as const,
      abbr: game.away.abbreviation,
      logo: game.away.logo,
      name: game.away.name,
      totals: lineScore.away,
    },
    {
      side: 'home' as const,
      abbr: game.home.abbreviation,
      logo: game.home.logo,
      name: game.home.name,
      totals: lineScore.home,
    },
  ];

  const headCell = 'px-1.5 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-500';

  return (
    <Frame compact={compact} badge={lineScore.stateLabel.toUpperCase()} badgeTone={badgeTone}>
      <div className="w-full min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-center tabular-nums font-mono">
          <thead>
            <tr className="border-b border-white/15 bg-zinc-950">
              <th scope="col" className={`sticky left-0 z-10 bg-zinc-950 text-left ${headCell} min-w-[70px]`}>
                TEAM
              </th>
              {columns.map((inning) => {
                const isCurrent = lineScore.isLive && lineScore.currentInning === inning.num;
                return (
                  <th
                    key={inning.num}
                    scope="col"
                    className={`min-w-[24px] sm:min-w-[28px] ${headCell} ${
                      isCurrent ? 'bg-rose-500/20 text-rose-300 border-x border-rose-500/40' : ''
                    }`}
                  >
                    {inning.num}
                  </th>
                );
              })}
              <th scope="col" className={`min-w-[28px] border-l border-white/15 bg-emerald-950/40 ${headCell} !text-emerald-300`}>
                R
              </th>
              <th scope="col" className={`min-w-[28px] ${headCell}`}>H</th>
              <th scope="col" className={`min-w-[28px] ${headCell}`}>E</th>
              <th scope="col" className={`min-w-[32px] ${headCell}`}>LOB</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {rows.map((row) => {
              const isBatting = battingSide === row.side;
              return (
                <tr key={row.side} className={isBatting ? 'bg-rose-500/[0.08]' : 'hover:bg-zinc-950/60'}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-black px-2 py-2 text-left font-normal border-r border-white/10"
                  >
                    <span className="flex items-center gap-2">
                      {row.logo && <img src={row.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />}
                      <strong className="text-xs font-black text-white">{row.abbr}</strong>
                      {isBatting && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 bg-rose-400 animate-pulse"
                          title={`${row.name} batting`}
                        />
                      )}
                    </span>
                  </th>

                  {columns.map((inning) => {
                    const value = row.side === 'away' ? inning.away : inning.home;
                    const isCurrent = lineScore.isLive && lineScore.currentInning === inning.num;
                    return (
                      <td
                        key={inning.num}
                        className={`px-1 py-2 text-xs ${
                          value == null ? 'text-zinc-600' : 'font-bold text-white'
                        } ${isCurrent ? 'bg-rose-500/10 font-black text-rose-200' : ''}`}
                      >
                        {value == null ? '·' : value}
                      </td>
                    );
                  })}

                  <td className="border-l border-white/15 bg-emerald-950/40 px-2 py-2 text-sm font-black text-emerald-400">
                    {cell(row.totals.runs)}
                  </td>
                  <td className="px-2 py-2 text-xs font-bold text-zinc-300">{cell(row.totals.hits)}</td>
                  <td className="px-2 py-2 text-xs font-bold text-zinc-400">{cell(row.totals.errors)}</td>
                  <td className="px-2 py-2 text-xs font-bold text-zinc-500">{cell(row.totals.leftOnBase)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live count strip */}
      {lineScore.isLive && (
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-rose-300 border border-rose-500/40 bg-rose-950/40 px-2 py-0.5">
            <Radio className="h-3 w-3 animate-pulse" />
            {lineScore.inningState?.toUpperCase() ?? 'LIVE'} {lineScore.currentInningOrdinal?.toUpperCase() ?? ''}
          </span>

          {lineScore.balls != null && lineScore.strikes != null && (
            <span className="text-xs font-bold text-zinc-300">
              <span className="text-zinc-500 uppercase text-[9px]">COUNT:</span> {lineScore.balls}-{lineScore.strikes}
            </span>
          )}

          {lineScore.outs != null && (
            <span className="flex items-center gap-2 text-xs font-bold text-zinc-300">
              <span className="text-zinc-500 uppercase text-[9px]">OUTS:</span>
              <span className="flex items-center gap-1" aria-label={`${lineScore.outs} out`}>
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-2.5 border ${
                      index < (lineScore.outs ?? 0)
                        ? 'border-rose-400 bg-rose-400'
                        : 'border-white/20 bg-black'
                    }`}
                  />
                ))}
              </span>
            </span>
          )}

          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-zinc-500">
            REGULATION {lineScore.scheduledInnings} INNINGS
          </span>
        </div>
      )}
    </Frame>
  );
});

