import { Download } from 'lucide-react';
import { HrFilters } from '../Filters/HrFilters';
import { HrSearch } from '../Search/HrSearch';
import type { HrWatchMode } from '../../types/hrWatch';

interface HrToolbarProps {
  searchValue: string;
  onSearchChange: (next: string) => void;
  mode: HrWatchMode;
  onModeChange: (mode: HrWatchMode) => void;
  selectedTiers: string[];
  onToggleTier: (tier: string) => void;
  visibleCount: number;
  totalCount: number;
  onExportCsv: () => void;
}

export function HrToolbar({
  searchValue,
  onSearchChange,
  mode,
  onModeChange,
  selectedTiers,
  onToggleTier,
  visibleCount,
  totalCount,
  onExportCsv,
}: HrToolbarProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#081124]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <HrSearch value={searchValue} onChange={onSearchChange} />
          <HrFilters mode={mode} onModeChange={onModeChange} selectedTiers={selectedTiers} onToggleTier={onToggleTier} />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <div className="font-semibold text-slate-100">Showing</div>
            <div>{visibleCount} of {totalCount} players</div>
          </div>
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-4 py-3 text-sm font-semibold text-[#DBEAFE] transition hover:bg-[#3B82F6]/20"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
