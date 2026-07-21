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

export function HrCommandCenter(props: Props) {
  const confirmedCount = (props.rows as any[])?.filter(
    (r) => String(r?.truthStatus || '').toLowerCase().includes('official') || String(r?.sourceMode || '').toLowerCase().includes('confirmed')
  ).length ?? 0;
  const previewCount = Math.max(0, ((props.rows as any[])?.length ?? 0) - confirmedCount);

  return (
    <div id="hr-command-center" className="scroll-mt-4">
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
        confirmedCount={confirmedCount}
        previewCount={previewCount}
      />
    </div>
  );
}
