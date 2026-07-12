import React, { useMemo, useState } from 'react';
import { RefreshCw, AlertOctagon, Inbox, Brain, ChartNoAxesCombined } from 'lucide-react';
import {
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
} from '../../../theme/z8Tokens';
import { useHrBoardViewModel } from '../hooks/useHrBoardViewModel';
import { HrCommandCenter } from '../components/CommandCenter/HrCommandCenter';
import { HrBoard } from '../components/Columns/HrBoard';
import { HrSpreadsheet } from '../components/Table/HrSpreadsheet';
import { HrPlayerDrawer } from '../components/Drawer/HrPlayerDrawer';
import { HrPlayerProfile } from '../components/Profile/HrPlayerProfile';
import { HrTreemap } from '../components/Treemap/HrTreemap';

function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return '—';
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const LoadingSkeleton: React.FC = () => (
  <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:items-start md:gap-4 xl:grid-cols-4">
    {/* Mobile tier tab skeleton */}
    <div className="flex gap-1.5 overflow-hidden md:hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-11 w-24 shrink-0 animate-pulse bg-white/[0.08]" />
      ))}
    </div>
    {Array.from({ length: 4 }).map((_, colIdx) => (
      <div
        key={colIdx}
        className={`glass-command flex flex-col gap-3 border border-ve-fuse/40 p-4 ${colIdx > 0 ? 'hidden md:flex' : ''}`}
      >
        <div className="h-4 w-24 animate-pulse bg-white/[0.08]" />
        {Array.from({ length: 3 }).map((__, cardIdx) => (
          <div
            key={cardIdx}
            className="glass-command flex flex-col gap-3 border border-ve-fuse/40 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 animate-pulse bg-white/[0.08]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-pulse bg-white/[0.08]" />
                <div className="h-2.5 w-1/2 animate-pulse bg-white/[0.06]" />
              </div>
              <div className="h-14 w-14 shrink-0 animate-pulse bg-white/[0.08]" />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 4 }).map((___, chipIdx) => (
                <div key={chipIdx} className="h-10 animate-pulse bg-white/[0.05]" />
              ))}
            </div>
            <div className="h-6 w-full animate-pulse bg-white/[0.05]" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="glass-command flex flex-col items-center justify-center gap-4 border border-red-500/25 px-6 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center border border-red-500/30 bg-red-500/10">
      <AlertOctagon className="h-7 w-7 text-red-400" />
    </div>
    <div>
      <p className="text-base font-bold text-ve-flash">Failed to load Home Run Intelligence</p>
      <p className="mt-1 max-w-sm text-sm text-ve-locked">{message}</p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-red-300 transition duration-200 hover:bg-red-500/15"
    >
      <RefreshCw className="h-4 w-4" />
      Retry
    </button>
  </div>
);

const EmptyState: React.FC<{
  onRetry: () => void;
  mode: 'confirmed' | 'curated' | 'all' | 'blocked';
  previewCount: number;
  onShowPreview: () => void;
}> = ({ onRetry, mode, previewCount, onShowPreview }) => {
  const noLineupsYet = mode === 'confirmed' && previewCount > 0;

  return (
    <div
      className="glass-command flex flex-col items-center justify-center gap-4 border border-ve-fuse/40 px-6 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center border border-ve-fuse/40 bg-ve-graphite/50">
        <Inbox className="h-7 w-7 text-ve-locked" />
      </div>
      <div>
        <p className="text-base font-bold text-ve-flash">
          {noLineupsYet ? 'No confirmed lineups posted yet' : 'No players to show'}
        </p>
        <p className="mt-1 max-w-sm text-sm text-ve-locked">
          {noLineupsYet
            ? `MLB hasn't posted official batting orders for today's games yet — we never fake a confirmed lineup. ${previewCount} preview candidates are already scored from projected lineups.`
            : 'There are no Home Run Intelligence candidates for the current filters or slate.'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {noLineupsYet && (
          <button
            type="button"
            onClick={onShowPreview}
            className="flex items-center gap-2 border border-vouch-cyan/35 bg-vouch-cyan/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-vouch-cyan transition duration-200 hover:bg-vouch-cyan/15"
          >
            Show preview candidates ({previewCount})
          </button>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 border border-ve-fuse/40 bg-ve-graphite/50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ve-ion/70 transition duration-200 hover:border-vouch-cyan/35 hover:text-vouch-cyan"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
    </div>
  );
};

const HomeRunIntelligencePage: React.FC<{ onSectionChange?: (section: string) => void }> = ({ onSectionChange }) => {
  const vm = useHrBoardViewModel();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const eliteCount: number = vm.stats?.elite ?? vm.buckets?.Elite?.length ?? 0;
  const strongCount: number = vm.stats?.strong ?? vm.buckets?.Strong?.length ?? 0;
  const watchCount: number = vm.stats?.watch ?? vm.buckets?.Watch?.length ?? 0;
  const sleeperCount: number = vm.stats?.sleepers ?? vm.buckets?.Sleepers?.length ?? 0;

  const totalCount = useMemo(
    () => eliteCount + strongCount + watchCount + sleeperCount,
    [eliteCount, strongCount, watchCount, sleeperCount],
  );

  const isAllZero = totalCount === 0 && !vm.loading;
  const lastUpdatedLabel = formatRelativeTime(lastUpdated);
  const isToday = vm.date === new Date().toISOString().slice(0, 10);
  const autoSwitchedToPreview = vm.autoSwitchedToPreview || (vm.mode === 'curated' && (vm.modeCounts?.confirmed ?? 0) === 0);

  const handleRefresh = React.useCallback(() => {
    vm.refresh?.();
    setLastUpdated(new Date());
  }, [vm]);

  // 'cards' and 'treemap' both consume vm.buckets (cards data shape); only
  // 'table' needs the ViewModel to switch its underlying fetch/shape.
  const [localViewMode, setLocalViewMode] = useState<'cards' | 'table' | 'treemap'>(() => {
    if (typeof window === 'undefined') return 'cards';
    return window.matchMedia('(max-width: 767px)').matches ? 'table' : 'cards';
  });
  const viewMode = localViewMode;
  const handleViewModeChange = (mode: 'cards' | 'table' | 'treemap') => {
    setLocalViewMode(mode);
    vm.setViewMode(mode === 'table' ? 'spreadsheet' : 'cards');
  };

  return (
    <div className={`${Z8_PAGE} ve-page-shell min-h-0 min-w-0 overflow-x-hidden bg-ve-obsidian text-ve-flash ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
      <div className={`mx-auto flex max-w-[1600px] flex-col ${Z8_PAGE_GAP}`}>
        {onSectionChange && (
          <nav className="grid grid-cols-2 gap-2" aria-label="VouchEdge Brain pages">
            <button type="button" onClick={() => onSectionChange('brain_picks')} className="z8-control inline-flex min-h-11 items-center justify-center gap-2 border border-vouch-emerald/30 bg-vouch-emerald/8 px-4 font-mono text-[11px] font-bold uppercase tracking-wide text-vouch-emerald hover:border-vouch-emerald/55"><Brain className="h-4 w-4" /> Brain Picks · Pro</button>
            <button type="button" onClick={() => onSectionChange('brain_performance')} className="z8-control inline-flex min-h-11 items-center justify-center gap-2 border border-white/10 bg-black/25 px-4 font-mono text-[11px] font-bold uppercase tracking-wide text-white/55 hover:border-vouch-cyan/30 hover:text-white"><ChartNoAxesCombined className="h-4 w-4" /> Performance · Pro</button>
          </nav>
        )}
        <HrCommandCenter
          mode={vm.mode}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onRefresh={handleRefresh}
          isRefreshing={vm.loading}
          lastUpdated={lastUpdated}
          lastUpdatedLabel={lastUpdatedLabel}
          date={vm.date}
          isToday={isToday}
          onDateChange={vm.setDate}
          autoSwitchedToPreview={autoSwitchedToPreview}
          eliteCount={eliteCount}
          strongCount={strongCount}
          watchCount={watchCount}
          sleeperCount={sleeperCount}
          totalCount={totalCount}
          searchValue={vm.search}
          onSearchChange={vm.setSearch}
          onSourceModeChange={(m) => vm.setMode(m === 'preview' ? 'curated' : m)}
          activeTiers={(vm.selectedTiers ?? []).map((t: string) => t.toLowerCase()) as ('elite' | 'strong' | 'watch' | 'sleeper')[]}
          onToggleTier={(t) => vm.onToggleTier(t.charAt(0).toUpperCase() + t.slice(1))}
          visibleCount={vm.rows?.length ?? totalCount}
          rows={(vm.rows ?? []) as unknown[]}
        />

        {vm.loading && !vm.rows?.length ? (
          <LoadingSkeleton />
        ) : vm.error ? (
          <ErrorState message={String(vm.error)} onRetry={handleRefresh} />
        ) : isAllZero ? (
          <EmptyState
            onRetry={handleRefresh}
            mode={vm.mode}
            previewCount={vm.modeCounts?.curated ?? 0}
            onShowPreview={() => vm.setMode('curated')}
          />
        ) : viewMode === 'table' ? (
          <HrSpreadsheet
            rows={(vm.rows ?? []) as any}
            onSelectPlayer={(player) => {
              vm.setSelectedPlayer(player);
              setIsProfileOpen(true);
            }}
          />
        ) : viewMode === 'treemap' ? (
          <HrTreemap
            buckets={vm.buckets}
            onSelectPlayer={(player) => {
              vm.setSelectedPlayer(player);
              setIsProfileOpen(true);
            }}
            getHrResult={vm.getHrResult}
          />
        ) : (
          <div className="scroll-mt-[calc(8.5rem+env(safe-area-inset-top))] md:scroll-mt-0">
            <HrBoard
              buckets={vm.buckets}
              onSelectPlayer={(player) => {
                vm.setSelectedPlayer(player);
                setIsDrawerOpen(true);
              }}
              onViewProfile={(player) => {
                vm.setSelectedPlayer(player);
                setIsProfileOpen(true);
              }}
              getHrResult={vm.getHrResult}
            />
          </div>
        )}

        <HrPlayerDrawer
          player={vm.selectedPlayer as any}
          isOpen={isDrawerOpen && Boolean(vm.selectedPlayer)}
          onClose={() => {
            setIsDrawerOpen(false);
            vm.setSelectedPlayer(null);
          }}
        />

        <HrPlayerProfile
          player={vm.selectedPlayer as any}
          isOpen={isProfileOpen && Boolean(vm.selectedPlayer)}
          onClose={() => {
            setIsProfileOpen(false);
            vm.setSelectedPlayer(null);
          }}
        />
      </div>
    </div>
  );
};

export default HomeRunIntelligencePage;
