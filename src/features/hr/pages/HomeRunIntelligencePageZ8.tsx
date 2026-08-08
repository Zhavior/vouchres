import React, { lazy, Suspense, useMemo, useState } from 'react';
import { RefreshCw, AlertOctagon, Inbox } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import {
  AURORA_PAGE,
  AURORA_PAGE_GAP,
  AURORA_PAGE_PAD_X,
  AURORA_PAGE_PAD_Y,
  AURORA_PANEL_PREMIUM,
} from '../../../theme/auroraTokens';
import { useHrBoardViewModel } from '../hooks/useHrBoardViewModel';
import { HrHeader } from '../components/Header/HrHeader';
import { HrCommandCenter } from '../components/CommandCenter/HrCommandCenter';
import WorkspaceSwitcher from '../components/workspace/WorkspaceSwitcher';
import WorkspaceRenderer from '../components/workspace/WorkspaceRenderer';
import type { WorkspaceView } from '../components/workspace/types';
import { HrTopSignalPanel } from '../components/Hero/HrTopSignalPanel';
import { HrBoard } from '../components/Columns/HrBoard';
import { HrSpotlightDeck } from '../components/Spotlight/HrSpotlightDeck';
import { HrSignalGrid } from '../components/Standard/HrSignalGrid';
import { useProMode } from '../hooks/useProMode';
const MostVouchedPlayersPanel = lazy(() => import('../components/Social/MostVouchedPlayersPanel').then(m => ({ default: m.MostVouchedPlayersPanel })));
const HrSpreadsheet = lazy(() => import('../components/Table/HrSpreadsheet').then(m => ({ default: m.HrSpreadsheet })));
const HrPlayerProfile = lazy(() => import('../components/Profile/HrPlayerProfile').then(m => ({ default: m.HrPlayerProfile })));
import { usePlayerVouchLeaderboard, usePlayerVouchSummary, useTogglePlayerVouch } from '../../../hooks/queries/usePlayerVouchLayer';
import { toHrParlayPickerPlayer } from '../utils/hrDecisionBrief';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { HrSignalField } from '../components/SignalField/HrSignalField';
import { HR_MAP_ENABLED } from '../featureAvailability';
import { localISODate } from '../utils/localDate';
import {
  clearHrResearchPlayer,
  isHrResearchHistoryEntry,
  pushHrResearchPlayer,
  readHrResearchPlayerId,
} from '../utils/hrResearchRoute';
import { ProductEvents } from '../../../lib/productEvents';
import type { HrWatchRow } from '../types/hrWatch';
import '../../../styles/z8-hr-lens.css';

function HeroTeamMark({ team, logoUrl }: { team: string; logoUrl: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedLogo = logoUrl || logoByTeamName(team);

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/12 bg-black/45">
      {resolvedLogo && !imageFailed ? (
        <img src={resolvedLogo} alt="" className="h-5 w-5 object-contain" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
      ) : (
        <span className="font-mono text-[7px] font-black text-white/55">{team.slice(0, 3).toUpperCase()}</span>
      )}
    </span>
  );
}

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
            <div className="hidden grid-cols-4 gap-2 lg:grid">
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

type ToolbarTier = 'elite' | 'strong' | 'watch' | 'sleeper';

function toToolbarTier(tier: string): ToolbarTier {
  const normalized = tier.toLowerCase();
  return normalized === 'sleepers' ? 'sleeper' : normalized as ToolbarTier;
}

function toBoardTier(tier: ToolbarTier): string {
  return tier === 'sleeper' ? 'Sleepers' : tier.charAt(0).toUpperCase() + tier.slice(1);
}

const HomeRunIntelligencePageZ8: React.FC<{ onSectionChange?: (section: string) => void }> = ({ onSectionChange }) => {
  const vm = useHrBoardViewModel();
  const [isProMode, toggleProMode] = useProMode();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [researchNotice, setResearchNotice] = useState<string | null>(null);

  const eliteCount: number = vm.stats?.elite ?? vm.buckets?.Elite?.length ?? 0;
  const strongCount: number = vm.stats?.strong ?? vm.buckets?.Strong?.length ?? 0;
  const watchCount: number = vm.stats?.watch ?? vm.buckets?.Watch?.length ?? 0;
  const sleeperCount: number = vm.stats?.sleepers ?? vm.buckets?.Sleepers?.length ?? 0;

  const totalCount = useMemo(
    () => eliteCount + strongCount + watchCount + sleeperCount,
    [eliteCount, strongCount, watchCount, sleeperCount],
  );

  const isAllZero = totalCount === 0 && !vm.loading;
  const lastUpdated = vm.lastUpdated;
  const lastUpdatedLabel = formatRelativeTime(lastUpdated);
  const isToday = vm.date === localISODate();
  const autoSwitchedToPreview = vm.autoSwitchedToPreview || (vm.mode === 'curated' && (vm.modeCounts?.confirmed ?? 0) === 0);
  const topPlayer = vm.rows?.[0] ?? null;
  const warningList = vm.slate.warnings.slice(0, 3);
  const noGamesToday = !vm.loading && !vm.slate.hasGames && (vm.slate.gameCount === 0 || totalCount === 0);
  const visiblePlayerIds = useMemo(
    () => (vm.rows ?? []).map((row) => row.playerId),
    [vm.rows],
  );
  const playerVouchSummary = usePlayerVouchSummary(vm.date, isProMode ? visiblePlayerIds : []);
  const playerVouchLeaderboard = usePlayerVouchLeaderboard(vm.date, 5);
  const togglePlayerVouch = useTogglePlayerVouch();
  const playerVouchMap = useMemo(
    () => new Map((playerVouchSummary.data ?? []).map((entry) => [entry.playerId, entry])),
    [playerVouchSummary.data],
  );
  const pendingPlayerVouchId = togglePlayerVouch.variables?.playerId != null
    ? String(togglePlayerVouch.variables.playerId)
    : null;
  const refreshBoard = vm.refresh;

  const handleRefresh = React.useCallback(async () => {
    await refreshBoard();
  }, [refreshBoard]);

  React.useEffect(() => {
    if (!vm.syncing) {
      setResearchNotice(null);
    }
  }, [vm.syncing]);

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

  React.useEffect(() => {
    const syncResearchFromUrl = () => {
      const playerId = readHrResearchPlayerId();
      if (!playerId) {
        setIsProfileOpen(false);
        vm.setSelectedPlayer(null);
        return;
      }

      const player = vm.researchRows.find((row) => String(row.playerId) === playerId);
      if (!player) return;
      vm.setSelectedPlayer(player);
      setIsProfileOpen(true);
    };

    syncResearchFromUrl();
    window.addEventListener('popstate', syncResearchFromUrl);
    return () => window.removeEventListener('popstate', syncResearchFromUrl);
  }, [vm.researchRows, vm.setSelectedPlayer]);

  const openPlayerProfile = React.useCallback((player: typeof topPlayer) => {
    if (!player) return;

    if (vm.syncing) {
      setResearchNotice(
        'Preparing validated player intelligence. Research will be ready momentarily.',
      );
      return;
    }

    setResearchNotice(null);

    ProductEvents.playerCardOpened({
      date: vm.date,
      mode: vm.mode,
      player_id: player.playerId == null ? null : String(player.playerId),
      player_name: player.playerName,
      truth_status: player.truthStatus,
      hr_score: player.hrScore,
    });
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
    if (player.playerId != null && readHrResearchPlayerId() !== String(player.playerId)) {
      pushHrResearchPlayer(player.playerId);
    }
  }, [vm, topPlayer]);

  const closePlayerProfile = React.useCallback(() => {
    if (readHrResearchPlayerId() && isHrResearchHistoryEntry()) {
      window.history.back();
      return;
    }
    clearHrResearchPlayer();
    setIsProfileOpen(false);
    vm.setSelectedPlayer(null);
  }, [vm]);

  const addPlayerToSlip = React.useCallback((player: NonNullable<typeof topPlayer>) => {
    ProductEvents.slipBuildStarted({
      entrypoint: 'hr_player_intelligence',
      date: vm.date,
      top_player: player.playerName,
      top_player_id: player.playerId == null ? null : String(player.playerId),
    });

    clearHrResearchPlayer();
    setIsProfileOpen(false);
    vm.setSelectedPlayer(null);

    openParlayAdd({
      player: toHrParlayPickerPlayer(player),
      propHint: {
        id: `hr-watch-${player.stableId}`,
        market: 'Home Runs',
        odds: player.bookOdds ?? null,
        spec: `${player.playerName} 1+ Home Run`,
        gamePk: player.gamePk ?? undefined,
        playerId: player.playerId ?? undefined,
      },
      initialFamily: 'home_runs',
      isPitcher: false,
      source: 'hr_intelligence',
      dataStatus: player.truthStatus === 'official' ? 'official' : player.truthStatus === 'projected' ? 'projected' : 'unknown',
      reasoningSnapshot: player.reasons[0] ?? null,
      riskSnapshot: player.warnings[0] ?? null,
    });
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

  const getPlayerVouchSummaryFor = React.useCallback((playerId: string | number | null) => {
    if (playerId == null) return null;
    return playerVouchMap.get(String(playerId)) ?? null;
  }, [playerVouchMap]);

  const handleTogglePlayerVouch = React.useCallback((player: HrWatchRow) => {
    if (player.playerId == null) return;
    togglePlayerVouch.mutate({
      playerId: player.playerId,
      playerName: player.playerName,
      team: player.team,
      opponent: player.opponent,
      gamePk: player.gamePk,
      contextDate: vm.date,
      sourcePage: 'hr_intelligence',
    }, {
      onError: () => {
        window.alert('Sign in to vouch players and save your community likes.');
      },
    });
  }, [togglePlayerVouch, vm.date]);

  // Pro Mode remembers the user's preferred analytics view.
  const [localViewMode, setLocalViewMode] = useState<'cards' | 'table' | 'treemap'>(() => {

    if (typeof window === 'undefined') return 'cards';
    try {
      const savedMode = window.localStorage.getItem('vouchedge_hr_view_mode');

      if (savedMode === 'table' || savedMode === 'cards') return savedMode;
      if (savedMode === 'treemap' && HR_MAP_ENABLED) return savedMode;
      return 'cards';
    } catch {
      return 'cards';
    }
  });

  const [workspace, setWorkspace] = useState<WorkspaceView>("overview");

  React.useEffect(() => {
    console.log("[HR Workspace]", workspace);
  }, [workspace]);


  const viewMode = localViewMode;
  const handleViewModeChange = (mode: 'cards' | 'table' | 'treemap') => {
    if (mode === 'treemap' && !HR_MAP_ENABLED) return;
    setLocalViewMode(mode);
    try {
      window.localStorage.setItem('vouchedge_hr_view_mode', mode);
    } catch {
      // The selected view still works for this session when storage is blocked.
    }
    vm.setViewMode(mode === 'table' ? 'spreadsheet' : 'cards');
  };

  return (
    <div className={`${AURORA_PAGE} hr-deck min-h-0 min-w-0 w-full max-w-full overflow-x-hidden text-ve-flash space-y-3 sm:space-y-4 ${AURORA_PAGE_PAD_Y}`}>
      <div className={`mx-auto flex min-h-0 w-full max-w-[1720px] flex-col space-y-3 sm:space-y-4 ${AURORA_PAGE_PAD_X}`}>

        {/* ── Aurora command deck ─────────────────────────────────────── */}
        <div className="deck-reveal space-y-3">
          <HrHeader
            mode={vm.mode}
            onRefresh={handleRefresh}
            isRefreshing={vm.syncing}
            lastUpdated={lastUpdated}
            lastUpdatedLabel={lastUpdatedLabel}
            date={vm.date}
            isToday={isToday}
            onDateChange={vm.setDate}
            gameCount={vm.slate.gameCount}
            hasGames={vm.slate.hasGames && !noGamesToday}
            freshness={vm.slate.freshness}
            confirmedCount={vm.modeCounts?.confirmed ?? 0}
            previewCount={vm.modeCounts?.curated ?? 0}
            isProMode={isProMode}
            onToggleProMode={toggleProMode}
          />
          {isProMode ? (
            <div className={`${AURORA_PANEL_PREMIUM} space-y-3 rounded-2xl p-2.5 sm:p-4`}>
              <HrCommandCenter
                mode={vm.mode}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                onRefresh={handleRefresh}
                isRefreshing={vm.syncing}
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
                activeTiers={(vm.selectedTiers ?? []).map(toToolbarTier)}
                onToggleTier={(tier) => vm.onToggleTier(toBoardTier(tier))}
                visibleCount={vm.rows?.length ?? totalCount}
                rows={(vm.rows ?? []) as unknown[]}
                confirmedCount={vm.modeCounts?.confirmed ?? 0}
                previewCount={vm.modeCounts?.curated ?? 0}
              />
              <WorkspaceSwitcher value={workspace} onChange={setWorkspace} />
            </div>
          ) : null}
        </div>

        {(vm.refreshError || vm.connection?.isLastGood || warningList.length > 0) && (
          <div
            className="rounded-xl border border-vouch-amber/30 bg-vouch-amber/10 px-3 py-2 text-xs text-amber-100"
            role="status"
            data-testid="hr-api-connection-status"
          >
            <p className="font-bold">
              {vm.refreshError
                ?? (vm.connection?.isLastGood
                  ? 'Validated feed is recovering — showing a demoted last-good snapshot.'
                  : warningList[0])}
            </p>
            {lastUpdated && (
              <p className="mt-1 text-[10px] text-amber-100/70">
                Source updated {lastUpdatedLabel}
                {vm.connection?.requestId ? ` · Request ${vm.connection.requestId}` : ''}
              </p>
            )}
          </div>
        )}

        {/* ── Main content area ───────────────────────────────────── */}
        <div className={`flex flex-col ${AURORA_PAGE_GAP}`}>
          {isProMode && topPlayer ? (
            <HrTopSignalPanel
              player={topPlayer}
              freshness={vm.slate.freshness}
              generatedAt={vm.slate.generatedAt}
              dateLabel={isToday ? 'Today' : vm.date}
              onResearch={openPlayerProfile}
              onAddToSlip={onSectionChange ? addPlayerToSlip : undefined}
              onTogglePlayerVouch={handleTogglePlayerVouch}
              onOpenBuild={goToBuild}
              playerVouchCount={getPlayerVouchSummaryFor(topPlayer.playerId)?.totalVouches ?? 0}
              playerVouchedByViewer={getPlayerVouchSummaryFor(topPlayer.playerId)?.viewerHasVouched ?? false}
              playerVouchPending={topPlayer.playerId != null && String(topPlayer.playerId) === pendingPlayerVouchId}
            />
          ) : null}

          {isProMode ? (
            <Suspense fallback={null}>
              <MostVouchedPlayersPanel
                players={playerVouchLeaderboard.data ?? []}
                subtitle="The hottest community-backed bats on this slate."
                onViewFullPage={onSectionChange ? () => onSectionChange('most_vouched_today') : undefined}
                onSelectPlayer={(playerId) => {
                  const match = vm.researchRows.find((row) => String(row.playerId) === playerId);
                  if (match) openPlayerProfile(match);
                }}
              />
            </Suspense>
          ) : null}

          {!isProMode ? (
            <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
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
              ) : (
                <>
                  <HrSpotlightDeck
                    rows={vm.rows ?? []}
                    onAddToSlip={onSectionChange ? addPlayerToSlip : undefined}
                    onResearch={openPlayerProfile}
                  />
                  <HrSignalGrid
                    rows={vm.rows ?? []}
                    onResearch={openPlayerProfile}
                    onAddToSlip={onSectionChange ? addPlayerToSlip : undefined}
                  />
                </>
              )}
            </div>
          ) : (
          <WorkspaceRenderer workspace={workspace} rows={vm.rows}>
          {/* Candidates Board / Spreadsheet / Treemap */}
          <div className="flex-1 pr-1">
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
              <Suspense fallback={<LoadingSkeleton />}>
                <HrSpreadsheet
                  rows={(vm.rows ?? []) as any}
                  freshness={vm.slate.freshness}
                  generatedAt={vm.slate.generatedAt}
                  onAddToSlip={onSectionChange ? addPlayerToSlip : undefined}
                  onTogglePlayerVouch={handleTogglePlayerVouch}
                  playerVouchMap={playerVouchMap}
                  pendingPlayerVouchId={pendingPlayerVouchId}
                  onSelectPlayer={(player) => {
                    openPlayerProfile(player);
                  }}
                />
              </Suspense>
            ) : viewMode === 'treemap' ? (
              <HrSignalField
                buckets={vm.buckets}
                onSelectPlayer={(player) => {
                  openPlayerProfile(player);
                }}
                onAddToSlip={onSectionChange ? addPlayerToSlip : undefined}
                getHrResult={vm.getHrResult}
              />
            ) : (
              <div className="scroll-mt-[calc(8.5rem+env(safe-area-inset-top))] md:scroll-mt-0">
                <HrBoard
                  buckets={vm.buckets}
                  onSelectPlayer={(player) => {
                    openPlayerProfile(player);
                  }}
                  onViewProfile={(player) => {
                    openPlayerProfile(player);
                  }}
                  onAddToSlip={onSectionChange ? addPlayerToSlip : undefined}
                  onTogglePlayerVouch={handleTogglePlayerVouch}
                  getPlayerVouchSummary={getPlayerVouchSummaryFor}
                  playerVouchPendingId={pendingPlayerVouchId}
                  getHrResult={vm.getHrResult}
                />
              </div>
            )}
          </div>
          </WorkspaceRenderer>
          )}

          <footer className="flex flex-col gap-2 border-t border-white/[0.08] px-2 py-3 text-[10px] text-white/38 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {vm.mode === 'curated'
                ? 'Preview mode: No confirmed lineups posted yet — showing preview candidates from projected lineups instead. Lineups are subject to change.'
                : vm.mode === 'confirmed'
                  ? 'Confirmed mode: Only players from official batting orders are shown.'
                  : 'All signals: Confirmed and projected players remain clearly labeled.'}
            </p>
            <span className="shrink-0 text-white/55">Learn about our scoring <span className="ml-2">-&gt;</span></span>
          </footer>
        </div>
      </div>

      {researchNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[120] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 border border-vouch-cyan/25 bg-[#071017]/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
        >
          <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-vouch-cyan" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-vouch-cyan">
              Validating board
            </p>
            <p className="mt-0.5 text-xs text-white/70">
              {researchNotice}
            </p>
          </div>
        </div>
      ) : null}

      <Suspense fallback={null}>
        <HrPlayerProfile
          player={vm.selectedPlayer}
          isOpen={isProfileOpen && Boolean(vm.selectedPlayer)}
          onClose={closePlayerProfile}
          onAddToSlip={addPlayerToSlip}
          boardFreshness={vm.slate.freshness}
          boardGeneratedAt={vm.slate.generatedAt}
          boardDate={vm.date}
          slipActionAvailable={Boolean(onSectionChange)}
        />
      </Suspense>
    </div>
  );
};

export default HomeRunIntelligencePageZ8;
