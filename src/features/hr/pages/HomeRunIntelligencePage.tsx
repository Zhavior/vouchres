import React, { useMemo, useState } from 'react';
import { RefreshCw, AlertOctagon, Inbox, Aperture, BellRing, Database, ShieldCheck, ScanSearch, Brain, ChartNoAxesCombined, ArrowRight, Clock3, TriangleAlert, CheckCircle2, Activity, ChevronRight } from 'lucide-react';
import {
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL_PREMIUM,
  Z8_STAT_CHIP,
} from '../../../theme/z8Tokens';
import { useHrBoardViewModel } from '../hooks/useHrBoardViewModel';
import { HrHeader } from '../components/Header/HrHeader';
import { HrToolbar } from '../components/Toolbar/HrToolbar';
import { HrCommandCenter } from '../components/CommandCenter/HrCommandCenter';
import { HrBoard } from '../components/Columns/HrBoard';
import { HrSpreadsheet } from '../components/Table/HrSpreadsheet';
import { HrPlayerDrawer } from '../components/Drawer/HrPlayerDrawer';
import { HrPlayerProfile } from '../components/Profile/HrPlayerProfile';
import { HrTreemap } from '../components/Treemap/HrTreemap';
import { summarizeHrLens } from '../engine/hrLensModel';
import { localISODate } from '../utils/localDate';
import { ProductEvents } from '../../../lib/productEvents';
import '../../../styles/z8-hr-lens.css';

interface MiniStatChipProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClasses: string;
  glowClasses: string;
}

const MiniStatChip: React.FC<MiniStatChipProps> = ({ label, value, icon, colorClasses, glowClasses }) => (
  <div className={`${Z8_STAT_CHIP} flex items-center gap-2.5 transition duration-200 ${colorClasses} ${glowClasses}`}>
    <div className="flex h-8 w-8 items-center justify-center border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan">{icon}</div>
    <div className="flex flex-col leading-tight">
      <span className="text-lg font-extrabold text-ve-flash">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-ve-ion/40">{label}</span>
    </div>
  </div>
);

const statusTone = {
  fresh: {
    label: 'Fresh',
    className: 'border-[hsl(var(--ve-success)/0.22)] bg-[hsl(var(--ve-success)/0.08)] text-[#7dffc5]',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  delayed: {
    label: 'Delayed',
    className: 'border-vouch-amber/25 bg-vouch-amber/10 text-vouch-amber',
    icon: <Clock3 className="h-3.5 w-3.5" />,
  },
  stale: {
    label: 'Stale',
    className: 'border-red-500/25 bg-red-500/10 text-red-300',
    icon: <TriangleAlert className="h-3.5 w-3.5" />,
  },
} as const;

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
  const isToday = vm.date === localISODate();
  const autoSwitchedToPreview = vm.autoSwitchedToPreview || (vm.mode === 'curated' && (vm.modeCounts?.confirmed ?? 0) === 0);
  const lensSummary = useMemo(() => summarizeHrLens(vm.rows ?? []), [vm.rows]);
  const topPlayer = vm.rows?.[0] ?? null;
  const freshnessTone = statusTone[vm.slate.freshness];
  const warningList = vm.slate.warnings.slice(0, 3);
  const noGamesToday = !vm.loading && !vm.slate.hasGames && (vm.slate.gameCount === 0 || totalCount === 0);

  const handleRefresh = React.useCallback(() => {
    vm.refresh?.();
    setLastUpdated(new Date());
  }, [vm]);

  React.useEffect(() => {
    ProductEvents.flagshipBoardViewed({
      section: 'daily_players',
      date: vm.date,
      mode: vm.mode,
      total_rows: vm.rows?.length ?? 0,
      game_count: vm.slate.gameCount,
      freshness: vm.slate.freshness,
      data_quality: vm.slate.dataQuality ?? 'unknown',
    });
  }, [vm.date, vm.mode, vm.rows?.length, vm.slate.dataQuality, vm.slate.freshness, vm.slate.gameCount]);

  const openPlayerDrawer = React.useCallback((player: typeof topPlayer) => {
    if (!player) return;
    ProductEvents.playerCardOpened({
      date: vm.date,
      mode: vm.mode,
      player_id: player.playerId == null ? null : String(player.playerId),
      player_name: player.playerName,
      truth_status: player.truthStatus,
      hr_score: player.hrScore,
    });
    vm.setSelectedPlayer(player);
    setIsDrawerOpen(true);
  }, [vm, topPlayer]);

  const openPlayerProfile = React.useCallback((player: typeof topPlayer) => {
    if (!player) return;
    ProductEvents.playerResearchViewed({
      date: vm.date,
      mode: vm.mode,
      player_id: player.playerId == null ? null : String(player.playerId),
      player_name: player.playerName,
      truth_status: player.truthStatus,
      hr_score: player.hrScore,
    });
    vm.setSelectedPlayer(player);
    setIsProfileOpen(true);
  }, [vm, topPlayer]);

  const goToBuild = React.useCallback(() => {
    ProductEvents.slipBuildStarted({
      entrypoint: 'hr_daily_loop',
      date: vm.date,
      top_player: topPlayer?.playerName ?? null,
      top_player_id: topPlayer?.playerId == null ? null : String(topPlayer.playerId),
    });
    onSectionChange?.('build');
  }, [onSectionChange, topPlayer, vm.date]);

  const goToResults = React.useCallback(() => {
    ProductEvents.slipResultsViewed({
      entrypoint: 'hr_daily_loop',
      date: vm.date,
    });
    onSectionChange?.('results');
  }, [onSectionChange, vm.date]);

  // 'cards' and 'treemap' both consume vm.buckets (cards data shape); only
  // 'table' needs the ViewModel to switch its underlying fetch/shape.
  const [localViewMode, setLocalViewMode] = useState<'cards' | 'table' | 'treemap'>(() => {
    if (typeof window === 'undefined') return 'cards';
    return 'cards';
  });
  const viewMode = localViewMode;
  const handleViewModeChange = (mode: 'cards' | 'table' | 'treemap') => {
    setLocalViewMode(mode);
    vm.setViewMode(mode === 'table' ? 'spreadsheet' : 'cards');
  };

  return (
    <div className={`${Z8_PAGE} z8-hr-lens ve-page-shell min-h-0 min-w-0 overflow-x-hidden text-ve-flash ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
      <div className={`mx-auto flex max-w-[1720px] flex-col ${Z8_PAGE_GAP}`}>
        <section className="z8-hr-hero relative overflow-hidden border border-[#00ff94]/20 px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
          <div className="z8-hr-hero__aperture" aria-hidden="true" />
          <div className="relative grid gap-7 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#00ff94]">
                <ScanSearch className="h-4 w-4" /> Z8 Home Run Intelligence
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-black leading-[.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">See the power.<br /><span className="text-[#00ff94]">Understand the signal.</span></h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/52 sm:text-base">Every candidate is resolved through observable power, pitcher vulnerability, park context and recent form. No hidden certainty. No projected lineup presented as official.</p>
              <div className="mt-5 flex flex-wrap gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                <span className="border border-[hsl(var(--ve-success)/0.2)] bg-[hsl(var(--ve-success)/0.06)] px-2.5 py-1.5 text-[#7dffc5]">Official data first</span>
                <span className="border border-white/10 bg-black/25 px-2.5 py-1.5">Explainable score</span>
                <span className="border border-white/10 bg-black/25 px-2.5 py-1.5">Alert-safe</span>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => openPlayerProfile(topPlayer)}
                  disabled={!topPlayer}
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-vouch-emerald/35 bg-vouch-emerald/10 px-4 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-vouch-emerald transition hover:border-vouch-emerald/55 hover:bg-vouch-emerald/14 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Research Top Signal
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToBuild}
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/12 bg-black/30 px-4 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/72 transition hover:border-vouch-cyan/35 hover:text-white"
                >
                  Build Slip
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToResults}
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/10 bg-black/20 px-4 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/48 transition hover:border-white/18 hover:text-white/82"
                >
                  Results Ledger
                </button>
              </div>
              {topPlayer && (
                <p className="mt-4 max-w-2xl text-xs leading-5 text-white/45 sm:text-sm">
                  Strongest next step: inspect <span className="font-semibold text-white">{topPlayer.playerName}</span> first,
                  then decide if the signal belongs in today&apos;s slip.
                </p>
              )}
              {onSectionChange && <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => onSectionChange('brain_picks')} className="z8-control inline-flex min-h-10 items-center gap-2 border border-vouch-emerald/30 bg-vouch-emerald/8 px-3 font-mono text-[10px] font-bold uppercase tracking-wide text-vouch-emerald hover:border-vouch-emerald/55"><Brain className="h-3.5 w-3.5" /> Brain Picks</button><button type="button" onClick={() => onSectionChange('brain_performance')} className="z8-control inline-flex min-h-10 items-center gap-2 border border-white/10 bg-black/25 px-3 font-mono text-[10px] font-bold uppercase tracking-wide text-white/55 hover:border-vouch-cyan/30 hover:text-white"><ChartNoAxesCombined className="h-3.5 w-3.5" /> Performance</button></div>}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {[
                ['Official', lensSummary.official, <ShieldCheck className="h-3.5 w-3.5" />],
                ['Preview', lensSummary.projected, <Aperture className="h-3.5 w-3.5" />],
                ['Full stack', lensSummary.complete, <Database className="h-3.5 w-3.5" />],
                ['Confidence', lensSummary.averageConfidence == null ? '—' : `${lensSummary.averageConfidence}%`, <BellRing className="h-3.5 w-3.5" />],
              ].map(([label, value, icon]) => (
                <div key={String(label)} className="border border-white/10 bg-black/35 px-3 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/35">{icon}{label}</div>
                  <div className="mt-1 font-mono text-xl font-black tabular-nums text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={`${Z8_PANEL_PREMIUM} border-white/10 bg-black/30 p-4`}>
            <p className={Z8_LABEL}>Slate Status</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-white">
                  {noGamesToday ? 'No MLB games' : `${vm.slate.gameCount} game${vm.slate.gameCount === 1 ? '' : 's'} on board`}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/42">
                  {noGamesToday
                    ? 'Nothing is backfilled when the slate is empty.'
                    : vm.mode === 'confirmed'
                      ? 'Official lineup board first. Preview stays labeled until lineups post.'
                      : 'Preview mode is active because confirmed batting orders are limited or not posted yet.'}
                </p>
              </div>
              <Activity className="mt-1 h-4 w-4 shrink-0 text-vouch-cyan" />
            </div>
          </div>

          <div className={`${Z8_PANEL_PREMIUM} border-white/10 bg-black/30 p-4`}>
            <p className={Z8_LABEL}>Freshness</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${freshnessTone.className}`}>
                {freshnessTone.icon}
                {freshnessTone.label}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">
              Source updated {vm.slate.generatedAt ? formatRelativeTime(vm.slate.generatedAt) : 'unknown'}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/42">
              {vm.slate.freshness === 'fresh'
                ? 'Board timing looks healthy for today’s decision loop.'
                : vm.slate.freshness === 'delayed'
                  ? 'Use the board, but verify late context before saving a slip.'
                  : 'Treat this board as degraded until the next successful refresh.'}
            </p>
          </div>

          <div className={`${Z8_PANEL_PREMIUM} border-white/10 bg-black/30 p-4`}>
            <p className={Z8_LABEL}>Confirmation</p>
            <p className="mt-2 text-lg font-black text-white">
              {(vm.modeCounts?.confirmed ?? 0) > 0 ? `${vm.modeCounts.confirmed} confirmed signals` : 'Waiting on official lineups'}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/42">
              {(vm.modeCounts?.confirmed ?? 0) > 0
                ? 'Candidates in the official board are batting-order players only.'
                : `Preview pool available: ${vm.modeCounts?.curated ?? 0}. Official lineup not posted yet rows remain explicitly unconfirmed.`}
            </p>
          </div>

          <div className={`${Z8_PANEL_PREMIUM} border-white/10 bg-black/30 p-4`}>
            <p className={Z8_LABEL}>Next Step</p>
            <p className="mt-2 text-lg font-black text-white">
              {topPlayer ? `Start with ${topPlayer.playerName}` : 'Wait for a qualified signal'}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/42">
              {topPlayer
                ? `${topPlayer.pitcherName ?? 'Pitcher TBD'} · ${topPlayer.truthStatus === 'official' ? 'official' : 'projected'} context · one tap into research.`
                : 'No qualifying signal is being invented to fill the gap.'}
            </p>
          </div>
        </section>

        {(warningList.length > 0 || vm.slate.truthMessage || vm.slate.note) && (
          <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="glass-command border border-vouch-amber/18 bg-vouch-amber/6 p-4">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-vouch-amber" />
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-vouch-amber">Decision warnings</p>
                  <div className="mt-2 flex flex-col gap-1.5 text-sm text-white/70">
                    {warningList.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-command border border-white/10 bg-black/25 p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Truth note</p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                {vm.slate.truthMessage ?? vm.slate.note ?? 'Missing context stays labeled as missing rather than being guessed.'}
              </p>
            </div>
          </section>
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
              openPlayerProfile(player);
            }}
          />
        ) : viewMode === 'treemap' ? (
          <HrTreemap
            buckets={vm.buckets}
            onSelectPlayer={(player) => {
              openPlayerProfile(player);
            }}
            getHrResult={vm.getHrResult}
          />
        ) : (
          <div className="scroll-mt-[calc(8.5rem+env(safe-area-inset-top))] md:scroll-mt-0">
            <HrBoard
              buckets={vm.buckets}
              onSelectPlayer={(player) => {
                openPlayerDrawer(player);
              }}
              onViewProfile={(player) => {
                openPlayerProfile(player);
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
