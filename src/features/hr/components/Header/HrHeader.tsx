import React from 'react';
import { LayoutGrid, Table2, RefreshCw, Calendar, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { HrBrandIcon } from '../HrBrandIcon';
import { localISODate } from '../../utils/localDate';

export type HrViewMode = 'cards' | 'table' | 'treemap';

export interface HrHeaderProps {
  mode: string;
  viewMode: HrViewMode;
  onViewModeChange: (mode: HrViewMode) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
  date?: string;
  isToday?: boolean;
  onDateChange?: (date: string) => void;
}

function todayISO(): string {
  return localISODate();
}

function isoAddDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

const HrDateNav: React.FC<{ date: string; isToday: boolean; onChange: (date: string) => void }> = ({ date, isToday, onChange }) => (
  <div className="flex items-center gap-1 border border-white/10 bg-black/25 px-1 py-1 font-mono sm:px-1.5">
    <button
      type="button"
      onClick={() => onChange(isoAddDays(date, -1))}
      aria-label="Previous day"
      className="flex h-11 w-11 items-center justify-center border border-transparent text-zinc-400 transition-colors duration-150 hover:border-vouch-cyan/30 hover:bg-vouch-cyan/5 hover:text-vouch-cyan sm:h-6 sm:w-6"
    >
      <ChevronLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
    </button>
    <label className="relative flex cursor-pointer items-center gap-1.5 px-1.5">
      <Calendar className="h-3.5 w-3.5 text-vouch-cyan" />
      <span className="text-xs font-bold uppercase tracking-widest tabular-nums text-zinc-200">{isToday ? 'Today' : date}</span>
      <input
        type="date"
        value={date}
        max={todayISO()}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Pick a date"
      />
    </label>
    <button
      type="button"
      onClick={() => onChange(isoAddDays(date, 1))}
      disabled={isToday}
      aria-label="Next day"
      className="flex h-11 w-11 items-center justify-center border border-transparent text-zinc-400 transition-colors duration-150 hover:border-vouch-cyan/30 hover:bg-vouch-cyan/5 hover:text-vouch-cyan disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 sm:h-6 sm:w-6"
    >
      <ChevronRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
    </button>
  </div>
);

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
    <div className="flex items-center gap-2 border border-white/10 bg-black/25 px-3 py-1.5 font-mono">
      <div className="flex items-end gap-[3px] h-3">
        <span
          className={`w-[3px] bg-vouch-cyan ${active ? 'animate-[pulse-bar_1s_ease-in-out_infinite]' : 'opacity-30'}`}
          style={{ height: '40%', animationDelay: '0ms' }}
        />
        <span
          className={`w-[3px] bg-vouch-cyan ${active ? 'animate-[pulse-bar_1s_ease-in-out_infinite]' : 'opacity-30'}`}
          style={{ height: '100%', animationDelay: '150ms' }}
        />
        <span
          className={`w-[3px] bg-vouch-cyan ${active ? 'animate-[pulse-bar_1s_ease-in-out_infinite]' : 'opacity-30'}`}
          style={{ height: '65%', animationDelay: '300ms' }}
        />
      </div>
      <span className={`text-[10px] font-bold tracking-widest ${active ? 'text-vouch-cyan' : 'text-zinc-600'}`}>
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
  date,
  isToday = true,
  onDateChange,
}) => {
  const relativeTime = formatRelativeTime(lastUpdated);

  return (
    <header className="flex flex-col gap-3 border border-white/10 bg-black/25 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
      {/* Left: brand */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <HrBrandIcon />
        <div className="min-w-0">
          <h1 className="truncate font-mono text-sm font-extrabold uppercase tracking-tight text-white sm:text-lg">
            HOME RUN INTELLIGENCE
          </h1>
          <p className="truncate font-mono text-[10px] font-medium uppercase tracking-widest text-white/40 sm:text-[11px]">
            MLB &middot; {isToday ? 'TODAY' : date} &middot; {mode}
          </p>
        </div>
      </div>

      {/* Center: date nav + live pulse */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {date && onDateChange && <HrDateNav date={date} isToday={isToday} onChange={onDateChange} />}
        <LivePulse active={!isRefreshing && isToday} />
        {relativeTime && isToday && (
          <span className="hidden sm:inline text-[11px] font-medium text-zinc-500">{relativeTime}</span>
        )}
        {!isToday && (
          <span className="hidden sm:inline text-[11px] font-medium text-zinc-500">Graded history</span>
        )}
      </div>

      {/* Right: view toggle + refresh */}
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
        <div className="flex items-center border border-white/10 bg-black/25 p-1 font-mono">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`flex h-11 min-w-11 items-center justify-center gap-1.5 border px-2 text-xs font-bold uppercase tracking-wide transition duration-200 sm:h-auto sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5 ${
              viewMode === 'cards'
                ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                : 'border-transparent text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
            }`}
            aria-pressed={viewMode === 'cards'}
            title="Cards"
          >
            <LayoutGrid className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`flex h-11 min-w-11 items-center justify-center gap-1.5 border px-2 text-xs font-bold uppercase tracking-wide transition duration-200 sm:h-auto sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5 ${
              viewMode === 'table'
                ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                : 'border-transparent text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
            }`}
            aria-pressed={viewMode === 'table'}
            title="Table"
          >
            <Table2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('treemap')}
            className={`flex h-11 min-w-11 items-center justify-center gap-1.5 border px-2 text-xs font-bold uppercase tracking-wide transition duration-200 sm:h-auto sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5 ${
              viewMode === 'treemap'
                ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                : 'border-transparent text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
            }`}
            aria-pressed={viewMode === 'treemap'}
            title="Map"
          >
            <LayoutDashboard className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Map</span>
          </button>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh"
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 bg-black/25 text-zinc-400 transition duration-200 hover:border-vouch-cyan/35 hover:text-vouch-cyan disabled:opacity-50 sm:h-9 sm:w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};

export default HrHeader;
