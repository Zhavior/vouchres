import { AlertOctagon, Award, Eye, Flame, Moon, RefreshCw } from 'lucide-react';
import { VEButton } from '../../../../components/ui/ve/VEButton';
import { HrHeader } from '../Header/HrHeader';
import { HrToolbar } from '../Toolbar/HrToolbar';

type HrViewMode = 'cards' | 'table' | 'treemap';
type HrTier = 'elite' | 'strong' | 'watch' | 'sleeper';

type Props = {
  mode: string;
  viewMode: HrViewMode;
  onViewModeChange: (mode: HrViewMode) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  lastUpdatedLabel: string;
  date: string;
  isToday: boolean;
  onDateChange: (date: string) => void;
  autoSwitchedToPreview: boolean;
  eliteCount: number;
  strongCount: number;
  watchCount: number;
  sleeperCount: number;
  totalCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSourceModeChange: (mode: 'confirmed' | 'preview' | 'all') => void;
  activeTiers: HrTier[];
  onToggleTier: (tier: HrTier) => void;
  visibleCount: number;
  rows: unknown[];
};

function MiniStatChip({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 border border-white/10 bg-white/[0.03] px-3.5 py-2.5 font-mono">
      <div className="flex h-8 w-8 items-center justify-center border border-white/10 bg-black/30 text-vouch-cyan">{icon}</div>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-extrabold text-slate-50">{value}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</span>
      </div>
    </div>
  );
}

export function HrCommandCenter(props: Props) {
  return (
    <div className="sticky top-0 z-30 -mx-4 space-y-5 bg-[#0A0A0A]/95 px-4 py-2 backdrop-blur-md md:-mx-8 md:px-8">
      <HrHeader {...props} />

      {props.autoSwitchedToPreview && (
        <div className="flex items-center gap-2 border border-vouch-cyan/25 bg-vouch-cyan/10 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-vouch-cyan">
          <AlertOctagon className="h-4 w-4 shrink-0" />
          No confirmed lineups posted yet — showing preview candidates from projected lineups instead.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <MiniStatChip label="Elite" value={props.eliteCount} icon={<Flame className="h-4 w-4" />} />
          <MiniStatChip label="Strong" value={props.strongCount} icon={<Award className="h-4 w-4" />} />
          <MiniStatChip label="Watch" value={props.watchCount} icon={<Eye className="h-4 w-4" />} />
          <MiniStatChip label="Sleepers" value={props.sleeperCount} icon={<Moon className="h-4 w-4" />} />
        </div>

        <VEButton onClick={props.onRefresh} disabled={props.isRefreshing} variant="ghost" size="sm">
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${props.isRefreshing ? 'animate-spin' : ''}`} />
          {props.lastUpdatedLabel}
        </VEButton>
      </div>

      <HrToolbar
        searchValue={props.searchValue}
        onSearchChange={props.onSearchChange}
        sourceMode={(props.mode === 'curated' ? 'preview' : props.mode) as 'confirmed' | 'preview' | 'all'}
        onSourceModeChange={props.onSourceModeChange}
        activeTiers={props.activeTiers}
        onToggleTier={props.onToggleTier}
        visibleCount={props.visibleCount}
        rows={props.rows as any}
        viewMode={props.viewMode}
        onViewModeChange={props.onViewModeChange}
      />
    </div>
  );
}
