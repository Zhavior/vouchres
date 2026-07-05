import React, { useMemo, useState } from 'react';
import { RefreshCw, AlertOctagon, Inbox, Flame, Award, Eye, Moon } from 'lucide-react';
import { useHrBoardViewModel } from '../hooks/useHrBoardViewModel';
import { HrHeader } from '../components/Header/HrHeader';
import { HrToolbar } from '../components/Toolbar/HrToolbar';
import { HrBoard } from '../components/Columns/HrBoard';
import { HrPlayerDrawer } from '../components/Drawer/HrPlayerDrawer';
// existing imports — keep all of them

interface MiniStatChipProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClasses: string;
  glowClasses: string;
}

const MiniStatChip: React.FC<MiniStatChipProps> = ({ label, value, icon, colorClasses, glowClasses }) => (
  <div
    className={`flex items-center gap-2.5 rounded-xl border bg-[#0A0D14] px-3.5 py-2.5 transition duration-200 ${colorClasses} ${glowClasses}`}
  >
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">{icon}</div>
    <div className="flex flex-col leading-tight">
      <span className="text-lg font-extrabold text-slate-50">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
    </div>
  </div>
);

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
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, colIdx) => (
      <div key={colIdx} className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#0A0D14] p-4">
        <div className="h-4 w-24 animate-pulse rounded-full bg-white/[0.08]" />
        {Array.from({ length: 3 }).map((__, cardIdx) => (
          <div
            key={cardIdx}
            className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#090C13] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/[0.08]" />
                <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-white/[0.06]" />
              </div>
              <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 4 }).map((___, chipIdx) => (
                <div key={chipIdx} className="h-10 animate-pulse rounded-lg bg-white/[0.05]" />
              ))}
            </div>
            <div className="h-6 w-full animate-pulse rounded-full bg-white/[0.05]" />
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
  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/25 bg-red-500/[0.04] px-6 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
      <AlertOctagon className="h-7 w-7 text-red-400" />
    </div>
    <div>
      <p className="text-base font-bold text-slate-100">Failed to load Home Run Intelligence</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{message}</p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition duration-200 hover:bg-red-500/15"
    >
      <RefreshCw className="h-4 w-4" />
      Retry
    </button>
  </div>
);

const EmptyState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.06] bg-[#0A0D14] px-6 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]">
      <Inbox className="h-7 w-7 text-zinc-500" />
    </div>
    <div>
      <p className="text-base font-bold text-slate-100">No players to show</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">
        There are no Home Run Intelligence candidates for the current filters or slate.
      </p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300 transition duration-200 hover:border-cyan-500/30 hover:text-cyan-300"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh
    </button>
  </div>
);

export const HomeRunIntelligencePage: React.FC = () => {
  const vm = useHrBoardViewModel();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Map vm.buckets (capitalized keys) to counts
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

  // Track last successful refresh time
  const handleRefresh = React.useCallback(() => {
    vm.refresh?.();
    setLastUpdated(new Date());
  }, [vm]);

  return (
    <div className="min-h-screen bg-[#05070B] px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <HrHeader
          mode={vm.mode}
          viewMode={vm.viewMode}
          onViewModeChange={vm.setViewMode}
          onRefresh={handleRefresh}
          isRefreshing={vm.loading}
          lastUpdated={lastUpdated}
        />

        {/* Stats bar row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <MiniStatChip
              label="Elite"
              value={eliteCount}
              icon={<Flame className="h-4 w-4 text-amber-400" />}
              colorClasses="border-amber-500/30"
              glowClasses="hover:shadow-[0_0_20px_-8px_rgba(245,158,11,0.5)]"
            />
            <MiniStatChip
              label="Strong"
              value={strongCount}
              icon={<Award className="h-4 w-4 text-emerald-400" />}
              colorClasses="border-emerald-500/30"
              glowClasses="hover:shadow-[0_0_20px_-8px_rgba(16,185,129,0.5)]"
            />
            <MiniStatChip
              label="Watch"
              value={watchCount}
              icon={<Eye className="h-4 w-4 text-blue-400" />}
              colorClasses="border-blue-500/30"
              glowClasses="hover:shadow-[0_0_20px_-8px_rgba(59,130,246,0.5)]"
            />
            <MiniStatChip
              label="Sleepers"
              value={sleeperCount}
              icon={<Moon className="h-4 w-4 text-purple-400" />}
              colorClasses="border-purple-500/30"
              glowClasses="hover:shadow-[0_0_20px_-8px_rgba(168,85,247,0.5)]"
            />
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#0A0D14] px-3.5 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                <span className="text-xs font-black text-cyan-300">Σ</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-extrabold text-slate-50">{totalCount}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Total</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Last refreshed {lastUpdatedLabel}</span>
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh data"
              disabled={vm.loading}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition duration-200 hover:border-cyan-500/30 hover:text-cyan-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${vm.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <HrToolbar
          searchValue={vm.search}
          onSearchChange={vm.setSearch}
          sourceMode={(vm.mode === 'curated' ? 'preview' : vm.mode) as 'confirmed' | 'preview' | 'all'}
          onSourceModeChange={(m) => vm.setMode(m === 'preview' ? 'curated' : m)}
          activeTiers={(vm.selectedTiers ?? []).map((t: string) => t.toLowerCase()) as ('elite' | 'strong' | 'watch' | 'sleeper')[]}
          onToggleTier={(t) => vm.onToggleTier(t.charAt(0).toUpperCase() + t.slice(1))}
          visibleCount={vm.rows?.length ?? totalCount}
          rows={(vm.rows ?? []) as any}
        />

        {vm.loading ? (
          <LoadingSkeleton />
        ) : vm.error ? (
          <ErrorState message={String(vm.error)} onRetry={handleRefresh} />
        ) : isAllZero ? (
          <EmptyState onRetry={handleRefresh} />
        ) : (
          <HrBoard
            buckets={vm.buckets}
            onSelectPlayer={(player) => {
              vm.setSelectedPlayer(player);
              setIsDrawerOpen(true);
            }}
          />
        )}

        <HrPlayerDrawer
          player={vm.selectedPlayer as any}
          isOpen={isDrawerOpen && Boolean(vm.selectedPlayer)}
          onClose={() => {
            setIsDrawerOpen(false);
            vm.setSelectedPlayer(null);
          }}
        />
      </div>
    </div>
  );
};

export default HomeRunIntelligencePage;
