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
    <div className="glass-command flex min-w-0 items-center gap-2 border border-ve-fuse/45 px-2 py-2 font-mono shadow-[inset_0_0_16px_rgba(0,229,255,0.06)] sm:gap-2.5 sm:px-3.5 sm:py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-ve-ion/30 bg-ve-ion/10 text-ve-ion sm:h-8 sm:w-8">{icon}</div>
      <div className="min-w-0 flex flex-col leading-tight">
        <span className="text-base font-extrabold text-ve-flash sm:text-lg">{value}</span>
        <span className="truncate text-[9px] font-semibold uppercase tracking-widest text-ve-ion/50 sm:text-[10px]">{label}</span>
      </div>
    </div>
  );
}

export function HrCommandCenter(props: Props) {
  return (
    <div className="space-y-3 sm:space-y-5 lg:sticky lg:top-0 lg:z-30 lg:-mx-8 lg:space-y-5 lg:bg-ve-obsidian/95 lg:px-8 lg:py-2 lg:backdrop-blur-md">
      {/* Mobile: header + toolbar stick together; desktop stats/toolbar scroll normally under lg sticky */}
      <div className="sticky top-0 z-30 -mx-3 space-y-2 bg-ve-obsidian/95 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md sm:-mx-4 sm:space-y-3 sm:px-4 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0 lg:pt-0 lg:backdrop-blur-none">
        <HrHeader {...props} />

        {props.autoSwitchedToPreview && (
          <div className="flex items-start gap-2 border border-vouch-cyan/25 bg-vouch-cyan/10 px-3 py-2 font-mono text-[10px] font-bold uppercase leading-snug tracking-widest text-vouch-cyan sm:items-center sm:px-4 sm:py-2.5">
            <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
            No confirmed lineups posted yet — showing preview candidates from projected lineups instead.
          </div>
        )}

        <div className="md:hidden">
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
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="hidden grid-cols-2 gap-2 sm:grid sm:grid-cols-4 sm:gap-3">
          <MiniStatChip label="Elite" value={props.eliteCount} icon={<Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} />
          <MiniStatChip label="Strong" value={props.strongCount} icon={<Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} />
          <MiniStatChip label="Watch" value={props.watchCount} icon={<Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} />
          <MiniStatChip label="Sleepers" value={props.sleeperCount} icon={<Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} />
        </div>

        <VEButton onClick={props.onRefresh} disabled={props.isRefreshing} variant="ghost" size="sm" className="hidden self-end sm:inline-flex sm:self-auto">
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${props.isRefreshing ? 'animate-spin' : ''}`} />
          {props.lastUpdatedLabel}
        </VEButton>
      </div>

      <div className="hidden md:block">
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
    </div>
  );
}
