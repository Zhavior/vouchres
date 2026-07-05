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

export function HrToolbar(props: HrToolbarProps) {
  return (
    <div className="sticky top-2 z-20 rounded-2xl border border-white/[0.06] bg-[#080B12]/95 p-2 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[260px] flex-1">
          <HrSearch value={props.searchValue} onChange={props.onSearchChange} />
        </div>

        <HrFilters
          mode={props.mode}
          onModeChange={props.onModeChange}
          selectedTiers={props.selectedTiers}
          onToggleTier={props.onToggleTier}
        />

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-zinc-400">
          {props.visibleCount}/{props.totalCount}
        </div>

        <button onClick={props.onExportCsv} className="rounded-lg border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200">
          <Download className="mr-1 inline h-3.5 w-3.5" /> CSV
        </button>
      </div>
    </div>
  );
}
