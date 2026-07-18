import React, { useMemo, useState } from 'react';
import { RefreshCw, AlertOctagon, Inbox, ScanSearch, ArrowRight, Clock3, TriangleAlert, CheckCircle2, Activity, ChevronRight, Crosshair, Plus } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
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
import { HrCommandCenter } from '../components/CommandCenter/HrCommandCenter';
import { HrTopSignalPanel } from '../components/Hero/HrTopSignalPanel';
import { HrBoard } from '../components/Columns/HrBoard';
import { HrSpreadsheet } from '../components/Table/HrSpreadsheet';
import { HrPlayerProfile } from '../components/Profile/HrPlayerProfile';
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

type ToolbarTier = 'elite' | 'strong' | 'watch' | 'sleeper';

function toToolbarTier(tier: string): ToolbarTier {
  const normalized = tier.toLowerCase();
  return normalized === 'sleepers' ? 'sleeper' : normalized as ToolbarTier;
}

function toBoardTier(tier: ToolbarTier): string {
  return tier === 'sleeper' ? 'Sleepers' : tier.charAt(0).toUpperCase() + tier.slice(1);
}

const HomeRunIntelligencePage: React.FC<{ onSectionChange?: (section: string) => void }> = ({ onSectionChange }) => {
  const vm = useHrBoardViewModel();
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

  // Only the finished card and table views are public during the paid beta.
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
      // The selected view still works for this session when storage is blocked.
    }
    vm.setViewMode(mode === 'table' ? 'spreadsheet' : 'cards');
  };

  return (
    <div className={`${Z8_PAGE} z8-hr-lens ve-page-shell h-[100dvh] max-h-[100dvh] min-h-0 min-w-0 overflow-hidden text-ve-flash ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
      <div className={`mx-auto flex h-full min-h-0 max-w-[1720px] flex-col overflow-hidden ${Z8_PAGE_GAP}`}>
        <HrHeader
          mode={vm.mode}
          onRefresh={handleRefresh}
          isRefreshing={vm.loading}
          lastUpdated={lastUpdated}
          date={vm.date}
          isToday={isToday}
          onDateChange={vm.setDate}
        />

        <HrTopSignalPanel
          player={topPlayer}
          freshness={vm.slate.freshness}
          generatedAt={vm.slate.generatedAt}
          dateLabel={isToday ? 'Today' : vm.date}
          onResearch={openPlayerProfile}
          onAddToSlip={onSectionChange ? addPlayerToSlip : undefined}
          onOpenBuild={goToBuild}
        />

        <section hidden className="z8-hr-hero relative overflow-hidden border border-[#00ff94]/20 px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
          <div className="z8-hr-hero__aperture" aria-hidden="true" />
          <div className="z8-hr-hero__field" aria-hidden="true" />
          <div className="z8-hr-hero__flight" aria-hidden="true" />
          <div className="relative grid gap-3 lg:grid-cols-[1fr_0.92fr] lg:items-stretch">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1 font-mono text-[8px] font-black uppercase tracking-[0.14em] text-[#00ff94]">
                <ScanSearch className="h-3 w-3" /> Z8 Home Run Intelligence
              </div>
              <h1 className="mt-2 max-w-3xl text-[17px] font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-[25px] lg:text-[34px]">See the power. <span className="text-[#00ff94]">Understand the signal.</span></h1>
              <p className="mt-2 hidden max-w-2xl text-[10px] leading-4 text-white/52 sm:block sm:text-xs">Power, pitcher risk, park, form, and lineup truth in one decision.</p>
              <p className="mt-1.5 hidden font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white/38 sm:block">
                <span className="text-[#7dffc5]">Official data first</span> · Explainable score · Alert-safe
              </p>
              <div className="mt-2.5 grid grid-cols-3 gap-1 sm:mt-3 sm:flex sm:flex-wrap sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => openPlayerProfile(topPlayer)}
                  disabled={!topPlayer}
                  className="inline-flex min-h-8 items-center justify-center gap-1 border border-vouch-emerald/35 bg-vouch-emerald/10 px-1 font-mono text-[7px] font-black uppercase tracking-[0.07em] text-vouch-emerald transition hover:border-vouch-emerald/55 hover:bg-vouch-emerald/14 disabled:cursor-not-allowed disabled:opacity-45 sm:px-2.5 sm:text-[8px] sm:tracking-[0.1em]"
                >
                  <span className="sm:hidden">Top Signal</span><span className="hidden sm:inline">Research Top Signal</span>
                  <ArrowRight className="hidden h-3 w-3 sm:block" />
                </button>
                <button
                  type="button"
                  onClick={() => topPlayer && onSectionChange ? addPlayerToSlip(topPlayer) : goToBuild()}
                  className="inline-flex min-h-8 items-center justify-center gap-1 border border-white/12 bg-black/30 px-1 font-mono text-[7px] font-black uppercase tracking-[0.07em] text-white/72 transition hover:border-vouch-cyan/35 hover:text-white sm:px-2 sm:text-[8px] sm:tracking-[0.09em]"
                >
                  {topPlayer ? 'Add to Slip' : 'Build Slip'}
                  {topPlayer ? <Plus className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={goToResults}
                  className="inline-flex min-h-8 items-center justify-center gap-1 border border-white/10 bg-black/20 px-1 font-mono text-[7px] font-black uppercase tracking-[0.07em] text-white/48 transition hover:border-white/18 hover:text-white/82 sm:px-2 sm:text-[8px] sm:tracking-[0.09em]"
                >
                  <span className="sm:hidden">Results</span><span className="hidden sm:inline">Results Ledger</span>
                </button>
              </div>
            </div>
            {topPlayer ? (
              <button
                type="button"
                onClick={() => openPlayerProfile(topPlayer)}
                className="z8-hr-hero__spotlight group relative min-w-0 overflow-hidden border border-white/10 bg-black/35 p-2.5 text-left transition hover:border-[#00ff94]/35 hover:bg-black/45"
                aria-label={`Research top signal ${topPlayer.playerName}`}
              >
                <div className="z8-hr-hero__scan" aria-hidden="true" />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-[7px] font-black uppercase tracking-[0.13em] text-[#75ffc5]"><Crosshair className="h-2.5 w-2.5" /> Today&apos;s top signal</span>
                  <span className={`font-mono text-[7px] font-black uppercase tracking-[0.09em] ${topPlayer.truthStatus === 'official' ? 'text-[#75ffc5]' : topPlayer.truthStatus === 'projected' ? 'text-amber-200' : 'text-white/35'}`}>
                    {topPlayer.truthStatus === 'official' ? 'Confirmed' : topPlayer.truthStatus === 'projected' ? 'Projected' : 'Unverified'}
                  </span>
                </div>

                <div className="relative mt-2 flex min-w-0 items-center gap-2.5">
                  <div className="z8-hr-hero__headshot relative flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full">
                    <PlayerHeadshot name={topPlayer.playerName} playerId={topPlayer.playerId} headshotUrl={topPlayer.headshotUrl} size={54} priority />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black leading-none tracking-[-0.025em] text-white sm:text-lg">{topPlayer.playerName}</p>
                    <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        <HeroTeamMark key={topPlayer.team} team={topPlayer.team} logoUrl={topPlayer.teamLogoUrl} />
                        <HeroTeamMark key={topPlayer.opponent} team={topPlayer.opponent} logoUrl={topPlayer.opponentLogoUrl} />
                      </div>
                      <p className="truncate font-mono text-[8px] font-bold uppercase tracking-[0.07em] text-white/42">{topPlayer.team} vs {topPlayer.opponent}</p>
                    </div>
                    <p className="mt-1 truncate text-[9px] text-white/38">vs {topPlayer.pitcherName || 'probable pitcher unavailable'}</p>
                  </div>
                  <div
                    className="z8-hr-hero__score-ring flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full"
                    style={{ '--hr-score': `${Math.max(0, Math.min(100, topPlayer.hrScore))}%` } as React.CSSProperties}
                  >
                    <span className="flex h-[46px] w-[46px] flex-col items-center justify-center rounded-full bg-[#07100f] font-mono">
                      <strong className="text-lg leading-none tabular-nums text-white">{Math.round(topPlayer.hrScore)}</strong>
                      <span className="mt-0.5 text-[6px] font-black uppercase tracking-[0.08em] text-white/35">Signal /100</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-2">
                  <div className="min-w-0 border-l-2 border-[#00ff94]/45 pl-2">
                    <p className="font-mono text-[7px] font-black uppercase tracking-[0.08em] text-[#75ffc5]">Why it matters</p>
                    <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-white/62">{topPlayer.reasons[0] || 'No model rationale was supplied.'}</p>
                  </div>
                  <div className="min-w-0 border-l-2 border-amber-300/35 pl-2">
                    <p className="font-mono text-[7px] font-black uppercase tracking-[0.08em] text-amber-200">What could change</p>
                    <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-white/52">{topPlayer.warnings[0] || 'Verify the lineup and market before saving.'}</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="z8-hr-hero__spotlight flex min-h-[132px] items-center justify-center border border-white/10 bg-black/30 p-4 text-center">
                <div><Crosshair className="mx-auto h-5 w-5 text-white/22" /><p className="mt-2 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-white/35">Scanning today&apos;s slate</p></div>
              </div>
            )}
          </div>

          {topPlayer ? (
            <div className="relative mt-2 grid grid-cols-3 border border-white/[0.08] bg-black/28 sm:grid-cols-6">
              {[
                ['Power', topPlayer.hitterPower == null ? '-' : Math.round(topPlayer.hitterPower), 'Batter profile'],
                ['Pitcher vulnerability', topPlayer.pitcherVulnerability == null ? '-' : Math.round(topPlayer.pitcherVulnerability), topPlayer.pitcherName || 'Pitcher unavailable'],
                ['Park factor', topPlayer.parkFactor == null ? '-' : Math.round(topPlayer.parkFactor), topPlayer.venue || 'Venue unavailable'],
                ['Lineup status', topPlayer.truthStatus === 'official' ? 'Confirmed' : topPlayer.truthStatus === 'projected' ? 'Projected' : 'Unverified', topPlayer.truthStatus === 'official' ? 'Official order' : 'Awaiting official order'],
                ['Data confidence', topPlayer.dataConfidence == null ? '-' : `${Math.round(topPlayer.dataConfidence)}%`, vm.slate.freshness],
                ['Updated', vm.slate.generatedAt ? formatRelativeTime(vm.slate.generatedAt) : 'Unknown', isToday ? 'Today' : vm.date],
              ].map(([label, value, detail], index) => (
                <div key={String(label)} className={`min-w-0 px-2 py-2.5 ${index > 0 ? 'border-l border-white/[0.07]' : ''} ${index > 2 ? 'border-t border-white/[0.07] sm:border-t-0' : ''}`}>
                  <p className="truncate font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white/35">{label}</p>
                  <p className="mt-1 truncate font-mono text-[11px] font-black tabular-nums text-white/85">{value}</p>
                  <p className="mt-0.5 truncate text-[7px] capitalize text-white/34">{detail}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
        <section hidden className="grid grid-cols-2 gap-1.5 xl:hidden" aria-label="Board status summary">
          <div className={`${Z8_PANEL_PREMIUM} min-w-0 border-white/10 bg-black/30 p-2.5`}>
            <div className="flex items-center justify-between gap-1.5">
              <p className="font-mono text-[7px] font-black uppercase tracking-[0.12em] text-white/40">Slate Status</p>
              <Activity className="h-2.5 w-2.5 shrink-0 text-vouch-cyan" />
            </div>
            <div className="mt-1 min-w-0">
                <p className="truncate text-[10px] font-black text-white sm:text-[11px]">
                  {noGamesToday ? 'No MLB games' : `${vm.slate.gameCount} game${vm.slate.gameCount === 1 ? '' : 's'} on board`}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[7px] leading-3 text-white/42 sm:text-[8px]">
                  {noGamesToday
                    ? 'No slate is backfilled.'
                    : vm.mode === 'confirmed'
                      ? 'Official board; previews stay labeled.'
                      : 'Preview active; lineups are pending.'}
                </p>
            </div>
          </div>

          <div className={`${Z8_PANEL_PREMIUM} min-w-0 border-white/10 bg-black/30 p-2.5`}>
            <div className="flex items-center justify-between gap-1.5">
              <p className="font-mono text-[7px] font-black uppercase tracking-[0.12em] text-white/40">Freshness</p>
              <span className={`inline-flex items-center gap-0.5 rounded-full border px-1 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] ${freshnessTone.className}`}>
                {freshnessTone.icon}
                {freshnessTone.label}
              </span>
            </div>
            <p className="mt-1 truncate text-[10px] font-black text-white sm:text-[11px]">
              Updated {vm.slate.generatedAt ? formatRelativeTime(vm.slate.generatedAt) : 'unknown'}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[7px] leading-3 text-white/42 sm:text-[8px]">
              {vm.slate.freshness === 'fresh'
                ? 'Board timing is healthy.'
                : vm.slate.freshness === 'delayed'
                  ? 'Verify context before saving.'
                  : 'Degraded until the next refresh.'}
            </p>
          </div>

          <div className={`${Z8_PANEL_PREMIUM} min-w-0 border-white/10 bg-black/30 p-2.5`}>
            <p className="font-mono text-[7px] font-black uppercase tracking-[0.12em] text-white/40">Confirmation</p>
            <p className="mt-1 line-clamp-2 text-[10px] font-black leading-[14px] text-white sm:text-[11px]">
              {(vm.modeCounts?.confirmed ?? 0) > 0 ? `${vm.modeCounts.confirmed} confirmed signals` : 'Waiting on official lineups'}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[7px] leading-3 text-white/42 sm:text-[8px]">
              {(vm.modeCounts?.confirmed ?? 0) > 0
                ? 'Official batting-order players only.'
                : `${vm.modeCounts?.curated ?? 0} preview signals remain unconfirmed.`}
            </p>
          </div>

          <div className={`${Z8_PANEL_PREMIUM} min-w-0 border-white/10 bg-black/30 p-2.5`}>
            <p className="font-mono text-[7px] font-black uppercase tracking-[0.12em] text-white/40">Next Step</p>
            <p className="mt-1 line-clamp-2 text-[10px] font-black leading-[14px] text-white sm:text-[11px]">
              {topPlayer ? `Start with ${topPlayer.playerName}` : 'Wait for a qualified signal'}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[7px] leading-3 text-white/42 sm:text-[8px]">
              {topPlayer
                ? `vs ${topPlayer.pitcherName ?? 'Pitcher TBD'} · ${topPlayer.truthStatus === 'official' ? 'official' : 'projected'}`
                : 'No signal is invented to fill the gap.'}
            </p>
          </div>
        </section>

        {(warningList.length > 0 || vm.slate.truthMessage || vm.slate.note) && (
          <section hidden className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
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
          activeTiers={(vm.selectedTiers ?? []).map(toToolbarTier)}
          onToggleTier={(tier) => vm.onToggleTier(toBoardTier(tier))}
          visibleCount={vm.rows?.length ?? totalCount}
          rows={(vm.rows ?? []) as unknown[]}
        />

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
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
            freshness={vm.slate.freshness}
            generatedAt={vm.slate.generatedAt}
            onAddToSlip={onSectionChange ? addPlayerToSlip : undefined}
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
              getHrResult={vm.getHrResult}
            />
          </div>
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

        <HrPlayerProfile
          player={vm.selectedPlayer}
          isOpen={isProfileOpen && Boolean(vm.selectedPlayer)}
          onClose={closePlayerProfile}
          onAddToSlip={addPlayerToSlip}
          boardFreshness={vm.slate.freshness}
          boardGeneratedAt={vm.slate.generatedAt}
          slipActionAvailable={Boolean(onSectionChange)}
        />
      </div>
    </div>
  );
};

export default HomeRunIntelligencePage;
