import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  RefreshCw,
  AlertOctagon,
  Inbox,
  Clock3,
  TriangleAlert,
  CheckCircle2,
  Sparkles,
  Radio,
  Zap,
  Flame,
} from 'lucide-react';
import {
  AURORA_PAGE,
  AURORA_PAGE_GAP,
  AURORA_PAGE_PAD_X,
  AURORA_PAGE_PAD_Y,
  AURORA_PANEL_PREMIUM,
  AURORA_STAT_CHIP,
  AURORA_MAX_SHELL,
  AURORA_MAX_PANEL,
} from '../../../theme/auroraTokens';
import { AuroraMaxEyebrow, AuroraMaxControl } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { useHrBoardViewModel } from '../hooks/useHrBoardViewModel';
import { HrHeader } from '../components/Header/HrHeader';
import { HrCommandCenter } from '../components/CommandCenter/HrCommandCenter';
import { HrTopSignalPanel } from '../components/Hero/HrTopSignalPanel';
import { HrBoard } from '../components/Columns/HrBoard';
import { MostVouchedPlayersPanel } from '../components/Social/MostVouchedPlayersPanel';
import { HrSpreadsheet } from '../components/Table/HrSpreadsheet';
import { HrPlayerProfile } from '../components/Profile/HrPlayerProfile';
import {
  usePlayerVouchLeaderboard,
  usePlayerVouchSummary,
  useTogglePlayerVouch,
} from '../../../hooks/queries/usePlayerVouchLayer';
import { toHrParlayPickerPlayer } from '../utils/hrDecisionBrief';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { HrSignalField } from '../components/SignalField/HrSignalField';
import { HrSpotlightDeck } from '../components/Spotlight/HrSpotlightDeck';
import { HrSignalGrid } from '../components/Standard/HrSignalGrid';
import WorkspaceSwitcher from '../components/workspace/WorkspaceSwitcher';
import WorkspaceRenderer from '../components/workspace/WorkspaceRenderer';
import type { WorkspaceView } from '../components/workspace/types';
import { useProMode } from '../hooks/useProMode';
import { HR_MAP_ENABLED } from '../featureAvailability';
import { localISODate } from '../utils/localDate';
import { preloadSection } from '../../../lib/routePreload';
import {
  clearHrResearchPlayer,
  isHrResearchHistoryEntry,
  pushHrResearchPlayer,
  readHrResearchPlayerId,
} from '../utils/hrResearchRoute';
import { ProductEvents } from '../../../lib/productEvents';
import type { HrWatchRow } from '../types/hrWatch';
import { useAppProfile } from '../../../context/AppShellContext';
import '../../../styles/z8-hr-lens.css';
import '../hr-aurora-max.css';

interface MiniStatChipProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClasses: string;
  glowClasses: string;
}

export const MiniStatChip: React.FC<MiniStatChipProps> = ({
  label,
  value,
  icon,
  colorClasses,
  glowClasses,
}) => (
  <div
    className={`${AURORA_STAT_CHIP} flex items-center gap-2.5 transition duration-200 ${colorClasses} ${glowClasses}`}
  >
    <div className="flex h-8 w-8 items-center justify-center border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan">
      {icon}
    </div>
    <div className="flex flex-col leading-tight">
      <span className="text-lg font-extrabold text-ve-flash">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-ve-ion/40">
        {label}
      </span>
    </div>
  </div>
);

const statusTone = {
  fresh: {
    label: 'Fresh',
    className: 'border-[hsl(var(--ve-success)/0.22)] bg-[hsl(var(--ve-success)/0.08)] text-[#7dffc5]',
    icon: <CheckCircle2 className="h-2.5 w-2.5" />,
  },
  delayed: {
    label: 'Delayed',
    className: 'border-vouch-amber/25 bg-vouch-amber/10 text-vouch-amber',
    icon: <Clock3 className="h-2.5 w-2.5" />,
  },
  stale: {
    label: 'Stale',
    className: 'border-red-500/25 bg-red-500/10 text-red-300',
    icon: <TriangleAlert className="h-2.5 w-2.5" />,
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
    <div className="glass-command flex flex-col items-center justify-center gap-4 border border-ve-fuse/40 px-6 py-16 text-center">
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
  return normalized === 'sleepers' ? 'sleeper' : (normalized as ToolbarTier);
}

function toBoardTier(tier: ToolbarTier): string {
  return tier === 'sleeper' ? 'Sleepers' : tier.charAt(0).toUpperCase() + tier.slice(1);
}

const WORKSPACE_STORAGE_KEY = 'vouchedge_hr_workspace';
const WORKSPACE_VIEWS: readonly WorkspaceView[] = ['overview', 'edge', 'stacks', 'matrix', 'extremes'];

function readStoredWorkspace(): WorkspaceView {
  if (typeof window === 'undefined') return 'overview';
  try {
    const saved = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (saved && (WORKSPACE_VIEWS as readonly string[]).includes(saved)) {
      return saved as WorkspaceView;
    }
  } catch {
    // Session default when storage is blocked.
  }
  return 'overview';
}

export interface HomeRunIntelligencePageLegacyProps {
  onSectionChange?: (section: string) => void;
}

export const HomeRunIntelligencePageLegacy: React.FC<HomeRunIntelligencePageLegacyProps> = ({
  onSectionChange,
}) => {
  const vm = useHrBoardViewModel();
  const profile = useAppProfile();
  const isAdmin = Boolean(profile?.isAdmin || profile?.admin || profile?.isStaff || profile?.staff);
  const [isProMode, toggleProMode] = useProMode();
  const [workspace, setWorkspace] = useState<WorkspaceView>(readStoredWorkspace);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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
  const lastUpdatedLabel = formatRelativeTime(lastUpdated);
  const isToday = vm.date === localISODate();
  const autoSwitchedToPreview =
    vm.autoSwitchedToPreview || (vm.mode === 'curated' && (vm.modeCounts?.confirmed ?? 0) === 0);
  const topPlayer = vm.rows?.[0] ?? null;
  const freshnessTone = statusTone[vm.slate.freshness] ?? statusTone.fresh;
  const noGamesToday =
    !vm.loading && !vm.slate.hasGames && (vm.slate.gameCount === 0 || totalCount === 0);

  const visiblePlayerIds = useMemo(
    () => (vm.rows ?? []).map((row) => row.playerId),
    [vm.rows],
  );
  const playerVouchSummary = usePlayerVouchSummary(vm.date, visiblePlayerIds);
  const playerVouchLeaderboard = usePlayerVouchLeaderboard(vm.date, 5);
  const togglePlayerVouch = useTogglePlayerVouch();

  const playerVouchMap = useMemo(
    () => new Map((playerVouchSummary.data ?? []).map((entry) => [String(entry.playerId), entry])),
    [playerVouchSummary.data],
  );

  const pendingPlayerVouchId =
    togglePlayerVouch.variables?.playerId != null
      ? String(togglePlayerVouch.variables.playerId)
      : null;

  const handleRefresh = useCallback(() => {
    vm.refresh?.();
    setLastUpdated(new Date());
  }, [vm]);

  useEffect(() => {
    if (!vm.syncing) {
      setResearchNotice(null);
    }
  }, [vm.syncing]);

  useEffect(() => {
    ProductEvents.flagshipBoardViewed({
      section: 'daily_players',
      date: vm.date,
      mode: vm.mode,
      total_rows: vm.rows?.length ?? 0,
      game_count: vm.slate.gameCount,
      freshness: vm.slate.freshness,
      data_quality: vm.slate.dataQuality ?? 'unknown',
    });
  }, [
    vm.date,
    vm.mode,
    vm.rows?.length,
    vm.slate.dataQuality,
    vm.slate.freshness,
    vm.slate.gameCount,
  ]);

  useEffect(() => {
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

  const openPlayerProfile = useCallback(
    (player: typeof topPlayer) => {
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
    },
    [vm, topPlayer],
  );

  const closePlayerProfile = useCallback(() => {
    if (readHrResearchPlayerId() && isHrResearchHistoryEntry()) {
      window.history.back();
      return;
    }
    clearHrResearchPlayer();
    setIsProfileOpen(false);
    vm.setSelectedPlayer(null);
  }, [vm]);

  const addPlayerToSlip = useCallback(
    (player: NonNullable<typeof topPlayer>) => {
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
        dataStatus:
          player.truthStatus === 'official'
            ? 'official'
            : player.truthStatus === 'projected'
              ? 'projected'
              : 'unknown',
        reasoningSnapshot: player.reasons[0] ?? null,
        riskSnapshot: player.warnings[0] ?? null,
      });
    },
    [vm, topPlayer],
  );

  const goToBuild = useCallback(() => {
    ProductEvents.slipBuildStarted({
      entrypoint: 'hr_daily_loop',
      date: vm.date,
      top_player: topPlayer?.playerName ?? null,
      top_player_id: topPlayer?.playerId == null ? null : String(topPlayer.playerId),
    });
    onSectionChange?.('build');
  }, [onSectionChange, topPlayer, vm.date]);

  const getPlayerVouchSummaryFor = useCallback(
    (playerId: string | number | null) => {
      if (playerId == null) return null;
      return playerVouchMap.get(String(playerId)) ?? null;
    },
    [playerVouchMap],
  );

  const handleTogglePlayerVouch = useCallback(
    (player: HrWatchRow) => {
      if (player.playerId == null) return;
      togglePlayerVouch.mutate(
        {
          playerId: player.playerId,
          playerName: player.playerName,
          team: player.team,
          opponent: player.opponent,
          gamePk: player.gamePk,
          contextDate: vm.date,
          sourcePage: 'hr_intelligence',
        },
        {
          onError: () => {
            window.alert('Sign in to vouch players and save your community likes.');
          },
        },
      );
    },
    [togglePlayerVouch, vm.date],
  );

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

  const viewMode = localViewMode;
  const handleViewModeChange = (mode: 'cards' | 'table' | 'treemap') => {
    if (mode === 'treemap' && !HR_MAP_ENABLED) return;
    setLocalViewMode(mode);
    try {
      window.localStorage.setItem('vouchedge_hr_view_mode', mode);
    } catch {
      // Keep session state intact even when localStorage is blocked
    }
    vm.setViewMode(mode === 'table' ? 'spreadsheet' : 'cards');
  };

  const handleWorkspaceChange = (view: WorkspaceView) => {
    setWorkspace(view);
    try {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, view);
    } catch {
      // Keep session state intact even when localStorage is blocked
    }
  };

  const handleProIntent = useCallback(() => {
    preloadSection('player_edge_lab');
  }, []);

  const addToSlip = onSectionChange ? addPlayerToSlip : undefined;

  return (
    <div
      className={`${AURORA_PAGE} ${AURORA_MAX_SHELL} hr-aurora-max min-h-0 min-w-0 w-full max-w-full overflow-x-hidden text-ve-flash space-y-4 ${AURORA_PAGE_PAD_Y}`}
      data-aurora-generation="max"
      data-hr-desk-mode={isProMode ? 'pro' : 'standard'}
    >
      <div className={`mx-auto flex min-h-0 w-full max-w-[1720px] flex-col space-y-4 ${AURORA_PAGE_PAD_X}`}>
        {/* ── Admin Desks Quick-Switch Bar (Visible only to Admin / Staff) ──── */}
        {isAdmin && onSectionChange && (
          <div className="aurora-max-panel flex flex-wrap items-center justify-between gap-2.5 border border-[var(--aurora-max-line)] bg-[rgba(8,16,15,0.7)] p-2.5 sm:px-4 backdrop-blur-[18px]">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center border border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.12)] text-[var(--aurora-max-emerald)]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div>
                <AuroraMaxEyebrow className="!text-[9px] font-black uppercase tracking-[0.18em] text-[var(--aurora-max-emerald)]">
                  ADMIN HR LAB · FLAGSHIP DESKS
                </AuroraMaxEyebrow>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <AuroraMaxControl
                tone="primary"
                className="!min-h-7 !px-2.5 !text-[10px] font-bold"
              >
                <Flame className="h-3 w-3" /> HR Intelligence (Main)
              </AuroraMaxControl>
              <AuroraMaxControl
                onClick={() => onSectionChange('aurora_hr_hq')}
                className="!min-h-7 !px-2.5 !text-[10px]"
              >
                <Sparkles className="h-3 w-3 text-[var(--aurora-max-emerald)]" /> Aurora HQ
              </AuroraMaxControl>
              <AuroraMaxControl
                onClick={() => onSectionChange('hr_max')}
                className="!min-h-7 !px-2.5 !text-[10px]"
              >
                <Radio className="h-3 w-3 text-[var(--aurora-max-muted)]" /> Command Desk
              </AuroraMaxControl>
              <AuroraMaxControl
                onClick={() => onSectionChange('hr_v10')}
                className="!min-h-7 !px-2.5 !text-[10px]"
              >
                <Zap className="h-3 w-3 text-[var(--aurora-max-muted)]" /> HR Intel V10
              </AuroraMaxControl>
            </div>
          </div>
        )}

        {/* ── Top Header & Command Center Bar ──────────────────────────── */}
        <header className="aurora-max-panel relative border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] p-4 sm:p-5 shadow-[var(--aurora-max-shadow)] backdrop-blur-[18px] space-y-4">
          <HrHeader
            mode={vm.mode}
            onRefresh={handleRefresh}
            isRefreshing={vm.loading}
            lastUpdated={lastUpdated}
            lastUpdatedLabel={lastUpdatedLabel}
            date={vm.date}
            isToday={isToday}
            onDateChange={vm.setDate}
            gameCount={vm.slate.gameCount}
            hasGames={vm.slate.hasGames}
            freshness={vm.slate.freshness}
            confirmedCount={vm.modeCounts?.confirmed ?? 0}
            previewCount={vm.modeCounts?.curated ?? 0}
            isProMode={isProMode}
            onToggleProMode={toggleProMode}
            onProModeIntent={handleProIntent}
          />
          {isProMode ? (
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
              activeTiers={(vm.selectedTiers ?? []).map(toToolbarTier)}
              onToggleTier={(tier) => vm.onToggleTier(toBoardTier(tier))}
              visibleCount={vm.rows?.length ?? totalCount}
              rows={(vm.rows ?? []) as unknown[]}
              confirmedCount={vm.modeCounts?.confirmed ?? 0}
              previewCount={vm.modeCounts?.curated ?? 0}
            />
          ) : null}
        </header>

        {isProMode ? (
          <>
            <div className="flex items-center justify-between gap-2 border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] px-3 py-2 font-mono text-[10px] font-bold text-[var(--aurora-max-paper)] sm:hidden shadow-md backdrop-blur-[18px]">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-max-emerald)]" />
                <span>{noGamesToday ? 'No games' : `${vm.slate.gameCount} Games`}</span>
              </div>
              <span className="text-white/20">•</span>
              <span className={`inline-flex items-center gap-1 ${freshnessTone.className}`}>
                {freshnessTone.label}
              </span>
              <span className="text-white/20">•</span>
              <span className="text-[var(--aurora-max-emerald)]">{vm.modeCounts?.confirmed ?? 0} Confirmed</span>
              <span className="text-white/20">•</span>
              <span className="text-[var(--aurora-max-amber)]">{vm.modeCounts?.curated ?? 0} Preview</span>
            </div>

            <div className="hidden sm:grid sm:grid-cols-4 gap-3">
              <div className="aurora-max-panel border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] p-3.5 backdrop-blur-[18px]">
                <AuroraMaxEyebrow className="!text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aurora-max-muted)]">
                  MLB Slate
                </AuroraMaxEyebrow>
                <p className="mt-1 font-mono text-sm font-black text-[var(--aurora-max-paper)]">
                  {noGamesToday
                    ? 'No MLB games'
                    : `${vm.slate.gameCount} Game${vm.slate.gameCount === 1 ? '' : 's'} Active`}
                </p>
              </div>
              <div className="aurora-max-panel border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] p-3.5 backdrop-blur-[18px]">
                <AuroraMaxEyebrow className="!text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aurora-max-muted)]">
                  Freshness
                </AuroraMaxEyebrow>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${freshnessTone.className}`}
                  >
                    {freshnessTone.icon}
                    {freshnessTone.label}
                  </span>
                </div>
              </div>
              <div className="aurora-max-panel border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] p-3.5 backdrop-blur-[18px]">
                <AuroraMaxEyebrow className="!text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aurora-max-muted)]">
                  Confirmed Orders
                </AuroraMaxEyebrow>
                <p className="mt-1 font-mono text-sm font-black text-[var(--aurora-max-emerald)]">
                  {vm.modeCounts?.confirmed ?? 0} official lineups
                </p>
              </div>
              <div className="aurora-max-panel border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] p-3.5 backdrop-blur-[18px]">
                <AuroraMaxEyebrow className="!text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aurora-max-muted)]">
                  Preview Candidates
                </AuroraMaxEyebrow>
                <p className="mt-1 font-mono text-sm font-black text-[var(--aurora-max-amber)]">
                  {vm.modeCounts?.curated ?? 0} projected bats
                </p>
              </div>
            </div>

            <WorkspaceSwitcher value={workspace} onChange={handleWorkspaceChange} />
          </>
        ) : null}

        <div className={`flex flex-col ${AURORA_PAGE_GAP}`}>
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
          ) : !isProMode ? (
            <>
              <HrSpotlightDeck
                rows={vm.rows ?? []}
                onResearch={openPlayerProfile}
                onAddToSlip={addToSlip}
              />
              <HrSignalGrid
                rows={vm.rows ?? []}
                onResearch={openPlayerProfile}
                onAddToSlip={addToSlip}
              />
            </>
          ) : (
            <WorkspaceRenderer
              workspace={workspace}
              rows={vm.rows ?? []}
              getHrResult={vm.getHrResult}
            >
              <HrTopSignalPanel
                player={topPlayer}
                freshness={vm.slate.freshness}
                generatedAt={vm.slate.generatedAt}
                dateLabel={isToday ? 'Today' : vm.date}
                onResearch={openPlayerProfile}
                onAddToSlip={addToSlip}
                onTogglePlayerVouch={handleTogglePlayerVouch}
                onOpenBuild={goToBuild}
                playerVouchCount={
                  getPlayerVouchSummaryFor(topPlayer?.playerId ?? null)?.totalVouches ?? 0
                }
                playerVouchedByViewer={
                  getPlayerVouchSummaryFor(topPlayer?.playerId ?? null)?.viewerHasVouched ?? false
                }
                playerVouchPending={
                  topPlayer?.playerId != null && String(topPlayer.playerId) === pendingPlayerVouchId
                }
              />

              <MostVouchedPlayersPanel
                players={playerVouchLeaderboard.data ?? []}
                subtitle="The hottest community-backed bats on this slate."
                onViewFullPage={
                  onSectionChange ? () => onSectionChange('most_vouched_today') : undefined
                }
                onSelectPlayer={(playerId) => {
                  const match = vm.researchRows.find((row) => String(row.playerId) === playerId);
                  if (match) openPlayerProfile(match);
                }}
                onTogglePlayerVouch={(playerSummary) => {
                  const match = vm.researchRows.find((row) => String(row.playerId) === String(playerSummary.playerId));
                  if (match) handleTogglePlayerVouch(match);
                }}
                onAddToSlip={
                  onSectionChange
                    ? (playerSummary) => {
                        const match = vm.researchRows.find((row) => String(row.playerId) === String(playerSummary.playerId));
                        if (match) addPlayerToSlip(match);
                      }
                    : undefined
                }
                vouchPendingId={pendingPlayerVouchId}
              />

              <div className="flex-1 pr-1">
                {viewMode === 'table' ? (
                  <HrSpreadsheet
                    rows={(vm.rows ?? []) as any}
                    freshness={vm.slate.freshness}
                    generatedAt={vm.slate.generatedAt}
                    onAddToSlip={addToSlip}
                    onTogglePlayerVouch={handleTogglePlayerVouch}
                    playerVouchMap={playerVouchMap}
                    pendingPlayerVouchId={pendingPlayerVouchId}
                    onSelectPlayer={(player) => {
                      openPlayerProfile(player);
                    }}
                  />
                ) : viewMode === 'treemap' ? (
                  <HrSignalField
                    buckets={vm.buckets}
                    onSelectPlayer={(player) => {
                      openPlayerProfile(player);
                    }}
                    onAddToSlip={addToSlip}
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
                      onAddToSlip={addToSlip}
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

          {isProMode ? (
            <footer className="flex flex-col gap-2 border-t border-white/[0.08] px-2 py-3 text-[10px] text-white/38 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {vm.mode === 'curated'
                  ? 'Preview mode: No confirmed lineups posted yet — showing preview candidates from projected lineups instead. Lineups are subject to change.'
                  : vm.mode === 'confirmed'
                    ? 'Confirmed mode: Only players from official batting orders are shown.'
                    : 'All signals: Confirmed and projected players remain clearly labeled.'}
              </p>
              <span className="shrink-0 text-white/55">
                Learn about our scoring <span className="ml-2">-&gt;</span>
              </span>
            </footer>
          ) : null}
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
            <p className="mt-0.5 text-xs text-white/70">{researchNotice}</p>
          </div>
        </div>
      ) : null}

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
    </div>
  );
};

export default HomeRunIntelligencePageLegacy;
