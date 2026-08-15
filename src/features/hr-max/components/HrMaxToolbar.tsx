import React, { useEffect } from 'react';
import { RefreshCw, Search, X, Layers, LayoutGrid, Table, Swords } from 'lucide-react';
import { AuroraMaxControl } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { localISODate } from '../../hr/utils/localDate';
import type { HrDeskViewMode } from './HrMaxDesk';

const TIER_KEYS = ['Elite', 'Strong', 'Watch', 'Sleepers'] as const;

export interface HrMaxToolbarProps {
  date: string;
  onDateChange: (date: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  syncing: boolean;
  onRefresh: () => void;
  viewMode: HrDeskViewMode;
  onViewModeChange: (mode: HrDeskViewMode) => void;
  selectedTiers: string[];
  tierStats: { elite: number; strong: number; watch: number; sleepers: number };
  onToggleTier: (tier: string) => void;
  onFocusTier: (tier: string) => void;
}

function tierCount(
  tier: (typeof TIER_KEYS)[number],
  tierStats: HrMaxToolbarProps['tierStats'],
): number {
  if (!tierStats) return 0;
  if (tier === 'Elite') return tierStats.elite ?? 0;
  if (tier === 'Strong') return tierStats.strong ?? 0;
  if (tier === 'Watch') return tierStats.watch ?? 0;
  return tierStats.sleepers ?? 0;
}

export const HrMaxToolbar = React.memo(function HrMaxToolbar({
  date,
  onDateChange,
  search,
  onSearchChange,
  syncing,
  onRefresh,
  viewMode,
  onViewModeChange,
  selectedTiers,
  tierStats,
  onToggleTier,
  onFocusTier,
}: HrMaxToolbarProps) {
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) onFocusTier('Elite');
  }, [onFocusTier]);

  const onTierClick = (tier: (typeof TIER_KEYS)[number]) => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      onFocusTier(tier);
      return;
    }
    onToggleTier(tier);
  };

  return (
    <div className="flex flex-col gap-3 border-y border-white/[0.07] bg-black/20 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Date Picker, Refresh, Live Search */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="hr-max-date">Slate date</label>
          <input
            id="hr-max-date"
            type="date"
            max={localISODate()}
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="aurora-max-control px-3 py-1.5 font-mono text-xs font-bold normal-case tracking-normal"
          />
          <AuroraMaxControl onClick={onRefresh} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </AuroraMaxControl>

          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-white/35" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter player / team / pitcher..."
              className="aurora-max-control pl-8 pr-7 py-1.5 font-mono text-xs text-white placeholder-white/30 focus:outline-none focus:border-[var(--aurora-max-emerald)]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2 text-white/40 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Right: 4 View Modes (Queue, Cards, Table, Stacks) */}
        <div className="flex items-center gap-1.5">
          <AuroraMaxControl
            aria-pressed={viewMode === 'queue'}
            onClick={() => onViewModeChange('queue')}
            className={viewMode === 'queue' ? 'aurora-max-control--active' : ''}
            title="Tactical Queue View"
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            Queue
          </AuroraMaxControl>
          <AuroraMaxControl
            aria-pressed={viewMode === 'cards'}
            onClick={() => onViewModeChange('cards')}
            className={viewMode === 'cards' ? 'aurora-max-control--active' : ''}
            title="4-Tier Kanban Board"
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            Cards
          </AuroraMaxControl>
          <AuroraMaxControl
            aria-pressed={viewMode === 'table'}
            onClick={() => onViewModeChange('table')}
            className={viewMode === 'table' ? 'aurora-max-control--active' : ''}
            title="High-Density Table View"
          >
            <Table className="h-3.5 w-3.5" aria-hidden="true" />
            Table
          </AuroraMaxControl>
          <AuroraMaxControl
            aria-pressed={viewMode === 'games'}
            onClick={() => onViewModeChange('games')}
            className={viewMode === 'games' ? 'aurora-max-control--active' : ''}
            title="Game Matchup Stacks View"
          >
            <Swords className="h-3.5 w-3.5" aria-hidden="true" />
            Stacks
          </AuroraMaxControl>
        </div>
      </div>

      {/* Tier Filter Bar */}
      <div
        className="sticky top-0 z-20 -mx-1 w-[calc(100%+0.5rem)] bg-[#05070d]/95 py-1.5 backdrop-blur-md md:static md:mx-0 md:w-full md:bg-transparent md:py-0 md:backdrop-blur-none"
        role="group"
        aria-label="HRPI tiers"
      >
        <div className="flex flex-nowrap items-center gap-1 overflow-x-auto md:flex-wrap md:gap-1.5">
          <span className="mr-1 hidden font-mono text-[10px] uppercase tracking-[0.12em] text-white/40 md:inline">
            Tiers:
          </span>
          {TIER_KEYS.map((tier) => {
            const isSelected = selectedTiers.includes(tier);
            const count = tierCount(tier, tierStats);
            return (
              <button
                key={tier}
                type="button"
                onClick={() => onTierClick(tier)}
                aria-pressed={isSelected}
                className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition ${
                  isSelected
                    ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.12)] text-[var(--aurora-max-emerald)] shadow-sm'
                    : 'border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/70'
                }`}
              >
                <span>{tier}</span>
                <span className="tabular-nums opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
