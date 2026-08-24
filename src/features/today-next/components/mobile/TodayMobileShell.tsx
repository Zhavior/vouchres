import React, { useMemo, useState } from 'react';
import { ArrowRight, Flame, Keyboard, ListFilter, Plus, ShieldCheck, Zap } from 'lucide-react';
import HrPlayerDrawer from '../../../hr/components/Drawer/HrPlayerDrawer';
import type { HrWatchRow } from '../../../hr/types/hrWatch';
import type { TodayDecision } from '../../../../components/today/todayDecisionModel';
import type { ApiGame } from '../../../../types/mlb';
import { formatCountdown, type TodayNextFirstPitch } from '../../hooks/useTodayNextHome';
import { TodayMobileChrome } from './TodayMobileChrome';
import { TodayMobileHero } from './TodayMobileHero';
import { TodayMobileLiveStrip } from './TodayMobileLiveStrip';
import { TodayMobileNewsWire } from './TodayMobileNewsWire';
import { TodayMobileResearchCta } from './TodayMobileResearchCta';
import {
  applyTodayMobileFilter,
  emptyReasonFor,
  TODAY_MOBILE_FILTERS,
  type TodayMobileFilter,
} from './todayMobileFilters';
import { boardScore } from '../../../hr/engine/signalScore';
import { buildHrMatchupGroups } from '../../../hr/components/Table/hrTableModel';
import { useAppSavedSlips } from '../../../../context/AppShellContext';

interface TodayMobileShellProps {
  decision: TodayDecision;
  reportDateLabel: string;
  firstPitch: TodayNextFirstPitch | null;
  liveGames: ApiGame[];
  deskRows: readonly HrWatchRow[];
  deskConfirmedRows: readonly HrWatchRow[];
  deskAllRows: readonly HrWatchRow[];
  gameCount?: number | null;
  onAddPlayer: (row: HrWatchRow) => void;
  onRoute: (section: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenShortcuts?: () => void;
}

const HERO_COUNT = 5;

/**
 * Mobile-First Layout: Single-column stacked telemetry ladder on mobile (<768px).
 * Features:
 * - Telemetry Top Bar (Sticky on Mobile)
 * - Hero Intel Callout with Stage 01 status & #31B583 hard shadow CTA
 * - Spotlight Dossier horizontal swipe deck with 3-tier gauge
 * - Daily Slate Queue horizontal swipe carousel (overflow-x-auto snap-x snap-mandatory flex gap-3)
 * - Curated Tactical Intel Wire (LINEUP, PITCHER, WEATHER, DEVIATION)
 * - Floating Action Hub (Sticky bottom bar with Quick Slip drawer pill [ ⚡ Slip (N) ])
 */
export function TodayMobileShell({
  decision,
  reportDateLabel,
  firstPitch,
  liveGames,
  deskRows,
  deskConfirmedRows,
  deskAllRows,
  gameCount,
  onAddPlayer,
  onRoute,
  onRefresh,
  isRefreshing,
  onOpenShortcuts,
}: TodayMobileShellProps) {
  const [filter, setFilter] = useState<TodayMobileFilter>('collision');
  const [openRow, setOpenRow] = useState<HrWatchRow | null>(null);
  const savedSlips = useAppSavedSlips();

  const source = deskAllRows.length > 0 ? deskAllRows : deskConfirmedRows.length > 0 ? deskConfirmedRows : deskRows;

  const counts = useMemo(() => {
    const next = {} as Record<TodayMobileFilter, number>;
    for (const def of TODAY_MOBILE_FILTERS) {
      next[def.id] = applyTodayMobileFilter(source, def.id, liveGames).length;
    }
    return next;
  }, [source, liveGames]);

  const filtered = useMemo(
    () => applyTodayMobileFilter(source, filter, liveGames),
    [source, filter, liveGames],
  );

  const hero = filtered.slice(0, HERO_COUNT);
  const rest = filtered.slice(HERO_COUNT);

  // Grouped matchups for the Daily Slate Queue swipe carousel
  const matchupGroups = useMemo(() => buildHrMatchupGroups(source), [source]);

  const pendingSlipCount = useMemo(
    () => savedSlips.filter((s) => String(s.status || 'PENDING').toUpperCase() === 'PENDING').length,
    [savedSlips],
  );

  const resolvedGameCount = gameCount ?? (decision.upcomingGames + decision.liveGames + decision.finalGames);

  return (
    <div className="pt-[52px] pb-[100px] md:hidden font-mono text-white min-h-screen">
      {/* 1. Telemetry Top Bar (Sticky on Mobile) */}
      <TodayMobileChrome
        reportDateLabel={reportDateLabel}
        liveCount={liveGames.length}
        gameCount={resolvedGameCount}
        firstPitch={firstPitch}
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 2. Hero Intel Callout (Compact Hero Card) */}
      <section className="px-3 pt-3.5" aria-label="Today's tactical brief">
        <div className="border border-white/[0.08] bg-[#0A0A0A] p-4.5 space-y-3.5 rounded-none">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 border border-ve-emerald/25 bg-ve-emerald/10 px-2.5 py-1 text-[9px] font-mono font-medium uppercase text-ve-emerald rounded-none">
              <span className="h-1.5 w-1.5 rounded-full bg-ve-emerald" />
              STAGE 01: PRE-PITCH THESIS
            </span>
            {firstPitch && liveGames.length === 0 && (
              <span className="text-[10px] text-white/55 font-mono">
                LOCK:{' '}
                <strong className="text-ve-emerald font-medium tabular-nums font-mono">
                  {firstPitch.countdownMs != null ? formatCountdown(firstPitch.countdownMs) : 'NOW'}
                </strong>
              </span>
            )}
          </div>

          <div>
            <h2 className="font-z8 text-balance text-[2rem] font-bold italic leading-[1.05] tracking-tighter text-white">
              {decision.title}
            </h2>
            <p className="mt-3 font-z8 text-sm font-light leading-relaxed text-white/55">{decision.description}</p>
          </div>

          <button
            type="button"
            onClick={() => onRoute(decision.ctaSection || 'hr_board')}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 bg-ve-cyan text-black font-mono text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-white active:bg-white rounded-none transition-colors cursor-pointer"
          >
            <span>{decision.ctaLabel || 'Review HR Intelligence ->'}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* 3. Spotlight Dossier (3-Tier Gauge Snap Deck) */}
      <div className="pt-4">
        <TodayMobileHero rows={hero} onAdd={onAddPlayer} onOpen={setOpenRow} />
      </div>

      {/* 4. Daily Slate Queue (Horizontal Swipe Carousel) */}
      <section className="px-3 pt-4" aria-label="Daily Slate Queue">
        <div className="flex items-center justify-between pb-2">
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium uppercase tracking-wider text-white/55">
            <ListFilter className="h-3 w-3 text-ve-cyan" />
            DAILY SLATE QUEUE ({matchupGroups.length} MATCHUPS)
          </span>
          <span className="text-[9px] text-white/40 uppercase font-mono">SWIPE SLATE →</span>
        </div>

        <div className="tn-scrollbar-none flex snap-x snap-mandatory gap-3 scroll-pl-3 overflow-x-auto px-3 pb-2">
          {matchupGroups.map((group) => {
            const leadPlayer = group.rows[0];
            const confirmedCount = group.rows.filter((r) => r.truthStatus === 'official').length;

            return (
              <div
                key={group.key}
                className="w-[calc(100vw-3rem)] max-w-[320px] shrink-0 snap-start border border-white/[0.08] bg-[#0A0A0A] p-3.5 space-y-2.5 rounded-none flex flex-col justify-between"
              >
                {/* Matchup Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                  <strong className="text-xs font-bold text-[#ffffff] uppercase truncate font-sans">
                    {group.primaryTeam} vs {group.opponent}
                  </strong>
                  <span className="text-[9px] text-white/55 font-mono">
                    {group.gameTime ? new Date(group.gameTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'TBD'}
                  </span>
                </div>

                {/* Lead Bat Telemetry */}
                {leadPlayer && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-medium text-white/80">{leadPlayer.playerName}</span>
                      <span className="text-ve-emerald font-bold tabular-nums font-mono">{boardScore(leadPlayer)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-white/55 font-mono">
                      <span className="border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 rounded-none text-[8px] text-white/70">
                        {confirmedCount > 0 ? `${confirmedCount} CONFIRMED BATS` : 'PROJECTED'}
                      </span>
                      <span className="text-white/40 text-[8px] uppercase">LEAD HRPI</span>
                    </div>
                  </div>
                )}

                {/* Quick Add Button */}
                {leadPlayer && leadPlayer.truthStatus !== 'blocked' && (
                  <button
                    type="button"
                    onClick={() => onAddPlayer(leadPlayer)}
                    className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-none border border-white/[0.08] bg-white/[0.04] text-[10px] font-mono font-medium uppercase text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3 text-ve-emerald" /> ADD LEAD BAT
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Live scores ticker if games active */}
      {liveGames.length > 0 && (
        <div className="pt-3">
          <TodayMobileLiveStrip games={liveGames} onRoute={onRoute} />
        </div>
      )}

      {/* 6. Curated MLB Tactical Intel Wire */}
      <div className="pt-4">
        <TodayMobileNewsWire slateRows={source} onOpenPlayer={setOpenRow} />
      </div>

      {/* 7. Deep Research Board CTA */}
      <div className="pt-4 px-3">
        {filtered.length === 0 ? (
          <p className="border border-dashed border-white/[0.08] bg-[#0A0A0A] p-6 text-center text-xs leading-relaxed text-white/55 rounded-none">
            {emptyReasonFor(filter, source.length > 0)}
          </p>
        ) : (
          <TodayMobileResearchCta remaining={rest.length} onRoute={onRoute} />
        )}
      </div>

      {/* 8. Floating Action Hub (Mobile Only) */}
      <aside
        aria-label="Floating Action Hub"
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-2 rounded-none border border-white/[0.12] bg-[#0A0A0A]/95 p-2 md:hidden font-mono"
      >
        {/* Quick Slip Drawer Pill */}
        <button
          type="button"
          onClick={() => onRoute('live_parlays')}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 border border-ve-emerald/30 bg-ve-emerald/15 px-3 py-2 text-xs font-mono font-semibold uppercase text-ve-emerald rounded-none transition-all cursor-pointer"
        >
          <Zap className="h-4 w-4" />
          <span>⚡ SLIP ({pendingSlipCount})</span>
        </button>

        {/* Shortcuts button */}
        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            aria-label="Open Keyboard Shortcuts"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-none border border-white/[0.08] bg-white/[0.04] text-white/70 active:bg-white/10"
          >
            <Keyboard className="h-4 w-4 text-ve-cyan" />
          </button>
        )}
      </aside>

      {/* Deep Player Dossier Drawer */}
      <HrPlayerDrawer player={openRow} isOpen={openRow != null} onClose={() => setOpenRow(null)} />
    </div>
  );
}
