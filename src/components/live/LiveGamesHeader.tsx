import React from 'react';
import { RefreshCw, Radio, Tv } from 'lucide-react';
import { AURORA_LABEL } from '../../theme/auroraTokens';
import '../../styles/command-deck.css';
import './live-command.css';

export type FilterTab = 'all' | 'live' | 'upcoming' | 'final';

export type FeedState = 'live' | 'reconnecting' | 'down';

export interface LiveGamesHeaderProps {
  onRefresh: () => void;
  isSyncing: boolean;
  feedState: FeedState;
  feedNote: string;
  lastSyncLabel: string;
  totalCount: number;
  liveCount: number;
  upcomingCount: number;
  finalCount: number;
  filterTab: FilterTab;
  onFilterChange: (tab: FilterTab) => void;
}

const FEED_COPY: Record<FeedState, string> = {
  live: 'Streaming',
  reconnecting: 'Reconnecting',
  down: 'Offline',
};

function RailCell({
  label,
  value,
  tone = 'cyan',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'cyan' | 'rose' | 'emerald' | 'amber' | 'danger';
}) {
  return (
    <div className="deck-rail-cell" data-tone={tone}>
      <span className="deck-rail-label font-mono">{label}</span>
      <span className="deck-rail-value">{value}</span>
    </div>
  );
}

// Rose is reserved for in-play, so the catch-all tab takes the telemetry cyan.
const TABS: Array<{ key: FilterTab; label: string; tone: 'cyan' | 'rose' | 'sky' | 'emerald' }> = [
  { key: 'all', label: 'All games', tone: 'cyan' },
  { key: 'live', label: 'Live now', tone: 'rose' },
  { key: 'upcoming', label: 'Upcoming', tone: 'sky' },
  { key: 'final', label: 'Final', tone: 'emerald' },
];

export const LiveGamesHeader: React.FC<LiveGamesHeaderProps> = ({
  onRefresh,
  isSyncing,
  feedState,
  feedNote,
  lastSyncLabel,
  totalCount,
  liveCount,
  upcomingCount,
  finalCount,
  filterTab,
  onFilterChange,
}) => {
  const counts: Record<FilterTab, number> = {
    all: totalCount,
    live: liveCount,
    upcoming: upcomingCount,
    final: finalCount,
  };

  return (
    <header className="deck-hero rounded-2xl p-3.5 sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className={`${AURORA_LABEL} deck-product-mark !text-[9.5px] font-bold sm:!text-xs`}>
            <Tv className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 truncate">
              Live Games<span className="hidden sm:inline"> · Real-Time Telemetry</span>
            </span>
          </div>
          <h1 className="mt-2 max-w-2xl text-xl font-black leading-tight tracking-tight text-white sm:text-3xl">
            The whole slate, <span className="text-vouch-cyan">pitch by pitch.</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-white/60 sm:text-sm">
            Official game state first — scores, innings and line scores straight from the MLB feed. Matchup research
            appears only when a verified source backs it.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div
            className="live-feed-pill inline-flex h-10 items-center gap-2 rounded-xl px-3 font-mono text-[10px] font-bold uppercase tracking-wider sm:text-xs"
            data-state={feedState}
          >
            <Radio className={`h-3.5 w-3.5 ${feedState === 'live' && !isSyncing ? 'animate-pulse' : ''}`} />
            <span>{FEED_COPY[feedState]}</span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isSyncing}
            className="deck-control inline-flex h-10 items-center gap-2 rounded-xl px-4 font-mono text-[11px] font-bold uppercase tracking-wider sm:text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Fast sync</span>
          </button>
        </div>
      </div>

      {/* Slate vitals — replaces the buried status line under the old title. */}
      <div className="deck-rail mt-4 rounded-xl">
        <RailCell label="Live now" tone="rose" value={`${liveCount} in play`} />
        <RailCell label="Upcoming" value={`${upcomingCount} scheduled`} />
        <RailCell label="Final" tone="emerald" value={`${finalCount} complete`} />
        <RailCell
          label="Feed"
          tone={feedState === 'live' ? 'emerald' : feedState === 'down' ? 'danger' : 'amber'}
          value={
            <span className="inline-flex items-center gap-1">
              {FEED_COPY[feedState]}
              <span className="font-normal text-white/35">· {lastSyncLabel}</span>
            </span>
          }
        />
      </div>

      <p className="mt-2 truncate font-mono text-[10px] text-white/35">{feedNote}</p>

      {/* Filter tabs — 44px targets, snap-scroll on mobile, wrap on desktop. */}
      <nav
        aria-label="Filter games by state"
        className="scrollbar-none -mx-1 mt-3 flex snap-x snap-mandatory items-stretch gap-1.5 overflow-x-auto px-1 py-0.5 sm:flex-wrap sm:overflow-x-visible"
      >
        {TABS.map((tab) => {
          const isActive = filterTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              data-active={isActive}
              data-tone={tab.tone}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onFilterChange(tab.key)}
              className="deck-tab flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-xl px-3.5 font-mono text-[11px] font-black uppercase tracking-wider sm:text-xs"
            >
              {tab.key === 'live' && liveCount > 0 && (
                <span className="relative flex h-2 w-2 items-center justify-center">
                  <span className="absolute h-2 w-2 animate-ping rounded-full bg-rose-500" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-rose-400" />
                </span>
              )}
              <span>{tab.label}</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[9px] tabular-nums">
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default LiveGamesHeader;
