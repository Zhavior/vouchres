import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { GameMatchup } from '../../../types/matchup';
import type { OfficialLineScore } from '../api/officialLineScore';

/**
 * Official Line Score — MLB StatsAPI `linescore`, rendered verbatim on the
 * Cupertino Pro material plate shared with Today Next.
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
      className={`w-full min-w-0 border border-white/[0.08] bg-white/[0.015] font-mono ${
        compact ? 'p-3' : 'p-4 sm:p-5'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-ve-cyan" />
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
            Official line score
          </h3>
          <span className={`px-1.5 py-0.5 text-[9px] font-medium uppercase border tracking-wider ${badgeTone}`}>
            {badge}
          </span>
        </div>
        <span className="text-[9px] font-medium uppercase tracking-wider text-white/30">
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
      <Frame compact={compact} badge="FEED DOWN" badgeTone="border-ve-amber/25 bg-ve-amber/10 text-ve-amber">
        <p className="flex items-center gap-2 py-4 text-xs text-white/55">
          <AlertTriangle className="h-4 w-4 shrink-0 text-ve-amber" />
          The MLB line score feed did not respond. No estimations applied — retry with Fast Sync.
        </p>
      </Frame>
    );
  }

  if (isLoading && !lineScore) {
    return (
      <Frame compact={compact} badge="SYNCING" badgeTone="border-white/[0.08] bg-white/[0.04] text-white/40">
        <div className="space-y-2 py-2" aria-hidden="true">
          <div className="h-4 w-full animate-pulse bg-white/[0.04] border border-white/[0.06]" />
          <div className="h-6 w-full animate-pulse bg-white/[0.04] border border-white/[0.06]" />
          <div className="h-6 w-full animate-pulse bg-white/[0.04] border border-white/[0.06]" />
        </div>
      </Frame>
    );
  }

  if (!lineScore) {
    return (
      <Frame compact={compact} badge="SCHEDULED" badgeTone="border-white/[0.08] bg-white/[0.04] text-white/40">
        <p className="py-4 text-xs leading-relaxed text-white/55">
          MLB has not published in-game per-inning runs for this scheduled matchup yet. Inning scores appear here the moment the official feed transmits them.
        </p>
      </Frame>
    );
  }

  const badgeTone = lineScore.isLive
    ? 'border-ve-red/25 bg-ve-red/10 text-ve-red'
    : lineScore.isFinal
      ? 'border-white/[0.08] bg-white/[0.04] text-white/40'
      : 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald';

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

  const headCell = 'px-1.5 py-1 text-[9px] font-medium uppercase tracking-wider text-white/40';

  return (
    <Frame compact={compact} badge={lineScore.stateLabel.toUpperCase()} badgeTone={badgeTone}>
      <div className="w-full min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-center tabular-nums font-mono">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03]">
              <th scope="col" className={`sticky left-0 z-10 bg-[#0a0a0a] text-left ${headCell} min-w-[70px]`}>
                TEAM
              </th>
              {columns.map((inning) => {
                const isCurrent = lineScore.isLive && lineScore.currentInning === inning.num;
                return (
                  <th
                    key={inning.num}
                    scope="col"
                    className={`min-w-[24px] sm:min-w-[28px] ${headCell} ${
                      isCurrent ? 'bg-ve-red/10 text-ve-red border-x border-ve-red/25' : ''
                    }`}
                  >
                    {inning.num}
                  </th>
                );
              })}
              <th scope="col" className={`min-w-[28px] border-l border-white/[0.08] bg-ve-emerald/[0.08] ${headCell} !text-ve-emerald`}>
                R
              </th>
              <th scope="col" className={`min-w-[28px] ${headCell}`}>H</th>
              <th scope="col" className={`min-w-[28px] ${headCell}`}>E</th>
              <th scope="col" className={`min-w-[32px] ${headCell}`}>LOB</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.06]">
            {rows.map((row) => {
              const isBatting = battingSide === row.side;
              return (
                <tr key={row.side} className={isBatting ? 'bg-ve-red/[0.06]' : 'hover:bg-white/[0.03]'}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-[#0a0a0a] px-2 py-2 text-left font-normal border-r border-white/[0.06]"
                  >
                    <span className="flex items-center gap-2">
                      {row.logo && <img src={row.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />}
                      <strong className="text-xs font-semibold text-white">{row.abbr}</strong>
                      {isBatting && <span className="lg-live-dot" title={`${row.name} batting`} />}
                    </span>
                  </th>

                  {columns.map((inning) => {
                    const value = row.side === 'away' ? inning.away : inning.home;
                    const isCurrent = lineScore.isLive && lineScore.currentInning === inning.num;
                    return (
                      <td
                        key={inning.num}
                        className={`px-1 py-2 text-xs ${
                          value == null ? 'text-white/25' : 'font-semibold text-white'
                        } ${isCurrent ? 'bg-ve-red/[0.08] font-bold text-ve-red' : ''}`}
                      >
                        {value == null ? '·' : value}
                      </td>
                    );
                  })}

                  <td className="border-l border-white/[0.08] bg-ve-emerald/[0.08] px-2 py-2 text-sm font-bold text-ve-emerald">
                    {cell(row.totals.runs)}
                  </td>
                  <td className="px-2 py-2 text-xs font-semibold text-white/70">{cell(row.totals.hits)}</td>
                  <td className="px-2 py-2 text-xs font-semibold text-white/55">{cell(row.totals.errors)}</td>
                  <td className="px-2 py-2 text-xs font-semibold text-white/40">{cell(row.totals.leftOnBase)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live count strip */}
      {lineScore.isLive && (
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-3">
          <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-ve-red border border-ve-red/25 bg-ve-red/10 px-2 py-0.5">
            <span className="lg-live-dot" />
            {lineScore.inningState?.toUpperCase() ?? 'LIVE'} {lineScore.currentInningOrdinal?.toUpperCase() ?? ''}
          </span>

          {lineScore.balls != null && lineScore.strikes != null && (
            <span className="text-xs font-semibold tabular-nums text-white/70">
              <span className="text-white/40 uppercase text-[9px]">COUNT:</span> {lineScore.balls}-{lineScore.strikes}
            </span>
          )}

          {lineScore.outs != null && (
            <span className="flex items-center gap-2 text-xs font-semibold text-white/70">
              <span className="text-white/40 uppercase text-[9px]">OUTS:</span>
              <span className="flex items-center gap-1" aria-label={`${lineScore.outs} out`}>
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-2.5 border ${
                      index < (lineScore.outs ?? 0)
                        ? 'border-ve-red bg-ve-red'
                        : 'border-white/[0.16] bg-transparent'
                    }`}
                  />
                ))}
              </span>
            </span>
          )}

          <span className="ml-auto text-[9px] font-medium uppercase tracking-wider text-white/30">
            REGULATION {lineScore.scheduledInnings} INNINGS
          </span>
        </div>
      )}
    </Frame>
  );
});

