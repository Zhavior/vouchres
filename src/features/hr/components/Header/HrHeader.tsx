import React from 'react';
import { Calendar, ChevronDown, Info, RefreshCw } from 'lucide-react';
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
  <label className="relative flex min-h-10 min-w-[166px] cursor-pointer items-center gap-2 border border-white/10 bg-black/25 px-3 text-white/75 transition hover:border-[#00f0ff]/30">
    <Calendar className="h-4 w-4 text-[#00f0ff]" />
    <span className="flex-1 text-[12px] font-bold">{isToday ? 'Today' : date}</span>
    <ChevronDown className="h-3.5 w-3.5 text-white/40" />
    <input type="date" value={date} max={todayISO()} onChange={(event) => event.target.value && onChange(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Pick a date" />
  </label>
);

export const HrHeader: React.FC<HrHeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  date,
  isToday = true,
  onDateChange,
}) => (
  <header className="flex flex-col gap-4 px-1 py-1 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <h1 className="truncate text-[22px] font-black uppercase tracking-[-0.035em] text-white sm:text-[28px]">Home Run Intelligence</h1>
        <Info className="h-4 w-4 shrink-0 text-white/42" />
      </div>
      <p className="mt-1 text-[12px] text-white/50 sm:text-[14px]">Power. Matchups. Parks. Lineups. All in one place.</p>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <div className="flex min-h-10 items-center gap-3 border border-[#00ff94]/20 bg-black/25 px-3 text-[11px] text-white/70">
        <span className={`h-2 w-2 rounded-full ${isToday && !isRefreshing ? 'bg-ve-voltage shadow-[0_0_10px_rgba(0,255,148,.65)]' : 'bg-white/20'}`} />
        <span className="font-bold">Live Updates</span>
        <span className="h-3 w-px bg-white/10" />
        <span className="flex items-center gap-1.5 text-white/48"><span className="h-2 w-2 rounded-full bg-ve-voltage/40" />{isToday ? 'On' : 'Off'}</span>
      </div>
      {onRefresh ? (
        <button type="button" onClick={onRefresh} disabled={isRefreshing} aria-label="Refresh" className="flex h-10 w-10 items-center justify-center border border-white/10 bg-black/25 text-[#00f0ff] transition hover:border-[#00f0ff]/35 disabled:opacity-40">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      ) : null}
      {date && onDateChange ? <DatePicker date={date} isToday={isToday} onChange={onDateChange} /> : null}
    </div>
  </header>
);

export default HrHeader;
