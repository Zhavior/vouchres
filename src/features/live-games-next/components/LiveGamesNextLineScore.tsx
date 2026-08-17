import React, { useMemo } from 'react';
import { Radio, AlertTriangle } from 'lucide-react';
import type { GameMatchup } from '../../../types/matchup';
import type { OfficialLineScore } from '../api/officialLineScore';

/**
 * Official Line Score — MLB StatsAPI `linescore`, rendered verbatim.
 *
 * Every cell is a published number. A half-inning the feed has no entry for
 * renders as a dash (walk-off bottom halves, innings not yet reached); R/H/E
 * show `–` rather than 0 when the feed omits them. Nothing here is estimated.
 */

export interface LiveGamesNextLineScoreProps {
  game: GameMatchup;
  lineScore: OfficialLineScore | null;
  isLoading: boolean;
  isError: boolean;
  /** Drawer variant — tighter padding, same data. */
  compact?: boolean;
}

/** Regulation columns to show before the feed reports more. */
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
      className={`w-full min-w-0 rounded-2xl border border-white/10 bg-ve-obsidian/95 font-mono shadow-xl ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--aurora-max-emerald)]">
            Official Line Score
          </h3>
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${badgeTone}`}>
            {badge}
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">MLB StatsAPI · linescore</span>
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
      <Frame compact={compact} badge="Feed down" badgeTone="border-rose-500/40 bg-rose-500/15 text-rose-300">
        <p className="flex items-center gap-2 py-4 text-[11px] text-white/50">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
          The MLB line score feed did not respond. Nothing is shown in its place — retry with Fast Sync.
        </p>
      </Frame>
    );
  }

  // Reserve the table's real height while the first fetch lands so the panel
  // never grows under the reader once data arrives.
  if (isLoading && !lineScore) {
    return (
      <Frame compact={compact} badge="Syncing" badgeTone="border-white/15 bg-white/5 text-white/50">
        <div className="space-y-2 py-1" aria-hidden="true">
          <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="h-6 w-full animate-pulse rounded bg-white/[0.04]" />
          <div className="h-6 w-full animate-pulse rounded bg-white/[0.04]" />
        </div>
      </Frame>
    );
  }

  if (!lineScore) {
    return (
      <Frame compact={compact} badge="Not published" badgeTone="border-white/15 bg-white/5 text-white/50">
        <p className="py-4 text-[11px] leading-relaxed text-white/45">
          MLB has not opened a line score for this game yet. Per-inning runs appear here the moment the official feed
          publishes them — this panel never fills the gap with estimates.
        </p>
      </Frame>
    );
  }

  const badgeTone = lineScore.isLive
    ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
    : lineScore.isFinal
      ? 'border-white/15 bg-white/5 text-white/60'
      : 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]';

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

  const headCell = 'px-1 py-1 text-[9px] font-black uppercase tracking-wider text-white/40';

  return (
    <Frame compact={compact} badge={lineScore.stateLabel} badgeTone={badgeTone}>
      <div className="w-full min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-center tabular-nums">
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className={`sticky left-0 z-10 bg-ve-obsidian text-left ${headCell} min-w-[64px]`}>
                Team
              </th>
              {columns.map((inning) => {
                const isCurrent = lineScore.isLive && lineScore.currentInning === inning.num;
                return (
                  <th
                    key={inning.num}
                    scope="col"
                    className={`min-w-[22px] sm:min-w-[26px] ${headCell} ${
                      isCurrent ? 'rounded-t bg-rose-500/15 text-rose-300' : ''
                    }`}
                  >
                    {inning.num}
                  </th>
                );
              })}
              <th scope="col" className={`min-w-[26px] border-l border-white/10 bg-[var(--aurora-max-emerald)]/10 ${headCell} !text-[var(--aurora-max-emerald)]`}>
                R
              </th>
              <th scope="col" className={`min-w-[26px] ${headCell}`}>H</th>
              <th scope="col" className={`min-w-[26px] ${headCell}`}>E</th>
              <th scope="col" className={`min-w-[30px] ${headCell}`}>LOB</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {rows.map((row) => {
              const isBatting = battingSide === row.side;
              return (
                <tr key={row.side} className={isBatting ? 'bg-rose-500/[0.06]' : ''}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-ve-obsidian px-1 py-1.5 text-left font-normal"
                  >
                    <span className="flex items-center gap-1.5">
                      {row.logo && <img src={row.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />}
                      <span className="text-[11px] font-black text-white">{row.abbr}</span>
                      {isBatting && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.9)]"
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
                        className={`px-1 py-1 text-[11px] ${
                          value == null ? 'text-white/20' : 'font-bold text-white'
                        } ${isCurrent ? 'bg-rose-500/10' : ''}`}
                      >
                        {value == null ? '·' : value}
                      </td>
                    );
                  })}

                  <td className="border-l border-white/10 bg-[var(--aurora-max-emerald)]/10 px-1 py-1 text-sm font-black text-[var(--aurora-max-emerald)]">
                    {cell(row.totals.runs)}
                  </td>
                  <td className="px-1 py-1 text-[11px] font-bold text-white/80">{cell(row.totals.hits)}</td>
                  <td className="px-1 py-1 text-[11px] font-bold text-white/60">{cell(row.totals.errors)}</td>
                  <td className="px-1 py-1 text-[11px] font-bold text-white/45">{cell(row.totals.leftOnBase)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live count strip — balls / strikes / outs, exactly as published */}
      {lineScore.isLive && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/10 pt-2.5">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-rose-300">
            <Radio className="h-3 w-3 animate-pulse" />
            {lineScore.inningState ?? 'Live'} {lineScore.currentInningOrdinal ?? ''}
          </span>

          {lineScore.balls != null && lineScore.strikes != null && (
            <span className="text-[10px] font-bold text-white/60">
              <span className="text-white/35">Count</span> {lineScore.balls}-{lineScore.strikes}
            </span>
          )}

          {lineScore.outs != null && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
              <span className="text-white/35">Outs</span>
              <span className="flex items-center gap-1" aria-label={`${lineScore.outs} out`}>
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 rounded-full border ${
                      index < (lineScore.outs ?? 0)
                        ? 'border-rose-400 bg-rose-400'
                        : 'border-white/20 bg-transparent'
                    }`}
                  />
                ))}
              </span>
            </span>
          )}

          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-white/25">
            Regulation {lineScore.scheduledInnings} Inn
          </span>
        </div>
      )}
    </Frame>
  );
});
