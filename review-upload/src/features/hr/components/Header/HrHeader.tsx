import React from 'react';
import { Calendar, ChevronDown, RefreshCw, Flame, Sparkles, Radio } from 'lucide-react';
import { localISODate } from '../../utils/localDate';

export type HrViewMode = 'cards' | 'table' | 'treemap';

export interface HrHeaderProps {
  mode: string;
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

const DatePicker: React.FC<{ date: string; isToday: boolean; onChange: (date: string) => void }> = ({ date, isToday, onChange }) => (
  <label className="relative flex h-9 min-w-[150px] cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-3 text-white transition hover:border-vouch-cyan hover:bg-black/60 shadow-inner">
    <Calendar className="h-3.5 w-3.5 text-vouch-cyan" />
    <span className="flex-1 font-mono text-xs font-bold">{isToday ? 'Today' : date}</span>
    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
    <input
      type="date"
      value={date}
      max={todayISO()}
      onChange={(event) => event.target.value && onChange(event.target.value)}
      className="absolute inset-0 cursor-pointer opacity-0"
      aria-label="Pick a date"
    />
  </label>
);

export const HrHeader: React.FC<HrHeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  date,
  isToday = true,
  onDateChange,
}) => (
  <header className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-[#0d1c30] via-[#091525] to-[#060c14] p-3.5 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
    {/* Subtle Background Glow Orbs */}
    <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-vouch-cyan/10 blur-3xl" />
    <div className="pointer-events-none absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-vouch-emerald/10 blur-3xl" />

    <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Title & Subtitle Badge */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-vouch-cyan/40 bg-vouch-cyan/15 text-vouch-cyan shadow-[0_0_15px_rgba(0,240,255,0.25)]">
          <Flame className="h-6 w-6 fill-current text-vouch-cyan" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
              Home Run Intelligence
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-2 py-0.5 font-mono text-[9px] font-black text-vouch-cyan uppercase tracking-wider">
              <Sparkles className="h-2.5 w-2.5" /> Model v3.6
            </span>
          </div>
          <p className="truncate text-xs text-slate-300 font-medium mt-0.5">
            Power. Matchup Vulnerability. Park Factors. Official Batting Orders.
          </p>
        </div>
      </div>

      {/* Control Actions & Indicators */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {/* Live Slate Status Pill */}
        <div className="hidden sm:flex h-9 items-center gap-2 rounded-xl border border-vouch-emerald/30 bg-vouch-emerald/10 px-3 font-mono text-xs font-bold text-vouch-emerald shadow-[0_0_12px_rgba(0,255,148,0.15)]">
          <Radio className="h-3.5 w-3.5 animate-pulse text-vouch-emerald" />
          <span>{isToday ? 'LIVE SLATE' : 'HISTORICAL'}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh slate data"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-vouch-cyan hover:border-vouch-cyan transition disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        ) : null}

        {/* Date Selector */}
        {date && onDateChange ? (
          <DatePicker date={date} isToday={isToday} onChange={onDateChange} />
        ) : null}
      </div>
    </div>
  </header>
);

export default HrHeader;
