import { Columns, Table } from 'lucide-react';
import type { HrWatchMode } from '../../types/hrWatch';

interface HrHeaderProps {
  viewMode: 'cards' | 'spreadsheet';
  onViewModeChange: (mode: 'cards' | 'spreadsheet') => void;
  mode: HrWatchMode;
}

export function HrHeader({ viewMode, onViewModeChange, mode }: HrHeaderProps) {
  return (
    <header className="rounded-2xl border border-white/[0.06] bg-[rgba(10,13,20,.88)] px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.26em] text-amber-400">
            <span>🔥</span>
            HOME RUN INTELLIGENCE
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            MLB • TODAY • {mode.toUpperCase()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onViewModeChange('cards')} className={`rounded-lg border px-3 py-2 text-xs font-bold ${viewMode === 'cards' ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-white/[0.06] bg-white/[0.03] text-zinc-400'}`}>
            <Columns className="mr-1 inline h-3.5 w-3.5" /> Cards
          </button>
          <button onClick={() => onViewModeChange('spreadsheet')} className={`rounded-lg border px-3 py-2 text-xs font-bold ${viewMode === 'spreadsheet' ? 'border-blue-400/40 bg-blue-400/10 text-blue-300' : 'border-white/[0.06] bg-white/[0.03] text-zinc-400'}`}>
            <Table className="mr-1 inline h-3.5 w-3.5" /> Table
          </button>
        </div>
      </div>
    </header>
  );
}
