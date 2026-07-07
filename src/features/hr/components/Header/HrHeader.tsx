import React from 'react';
import { Flame, LayoutGrid, Table2, RefreshCw } from 'lucide-react';

export type HrViewMode = 'cards' | 'table';

export interface HrHeaderProps {
  mode: string;
  viewMode: HrViewMode;
  onViewModeChange: (mode: HrViewMode) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
}

function formatRelativeTime(date: Date | null | undefined): string | null {
  if (!date) return null;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 10) return 'Updated just now';
  if (diffSec < 60) return `Updated ${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Updated ${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Updated ${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `Updated ${diffDay}d ago`;
}

const LivePulse: React.FC<{ active: boolean }> = ({ active }) => {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
      <div className="flex items-end gap-[3px] h-3">
        <span
          className={`w-[3px] rounded-full bg-cyan-400 ${active ? 'animate-[pulse-bar_1s_ease-in-out_infinite]' : 'opacity-30'}`}
          style={{ height: '40%', animationDelay: '0ms' }}
        />
        <span
          className={`w-[3px] rounded-full bg-cyan-400 ${active ? 'animate-[pulse-bar_1s_ease-in-out_infinite]' : 'opacity-30'}`}
          style={{ height: '100%', animationDelay: '150ms' }}
        />
        <span
          className={`w-[3px] rounded-full bg-cyan-400 ${active ? 'animate-[pulse-bar_1s_ease-in-out_infinite]' : 'opacity-30'}`}
          style={{ height: '65%', animationDelay: '300ms' }}
        />
      </div>
      <span className={`text-[10px] font-bold tracking-widest ${active ? 'text-cyan-400' : 'text-zinc-600'}`}>
        {active ? 'LIVE' : 'IDLE'}
      </span>
      <style>{`
        @keyframes pulse-bar {
          0%, 100% { transform: scaleY(0.4); opacity: 0.6; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export const HrHeader: React.FC<HrHeaderProps> = ({
  mode,
  viewMode,
  onViewModeChange,
  onRefresh,
  isRefreshing = false,
  lastUpdated = null,
}) => {
  const relativeTime = formatRelativeTime(lastUpdated);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[hsl(var(--ve-bg-deep))] px-5 py-4">
      {/* Left: brand */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-1 ring-amber-500/30">
          <Flame className="h-5 w-5 text-amber-400" strokeWidth={2.25} />
          <div className="absolute inset-0 rounded-xl bg-amber-500/10 blur-md -z-10" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            HOME RUN INTELLIGENCE
          </h1>
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            MLB &middot; TODAY &middot; {mode}
          </p>
        </div>
      </div>

      {/* Center: live pulse */}
      <div className="flex items-center gap-3">
        <LivePulse active={!isRefreshing} />
        {relativeTime && (
          <span className="hidden sm:inline text-[11px] font-medium text-zinc-500">{relativeTime}</span>
        )}
      </div>

      {/* Right: view toggle + refresh */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-full border border-white/[0.06] bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 ${
              viewMode === 'cards'
                ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            aria-pressed={viewMode === 'cards'}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 ${
              viewMode === 'table'
                ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            aria-pressed={viewMode === 'table'}
          >
            <Table2 className="h-3.5 w-3.5" />
            Table
          </button>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition duration-200 hover:border-cyan-500/30 hover:text-cyan-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};

export default HrHeader;
