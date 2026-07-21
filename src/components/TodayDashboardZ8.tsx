import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Flame,
  Gamepad2,
  Radio,
  RefreshCw,
  Sparkles,
  Swords,
  Trophy,
  UserRoundSearch,
  Users,
  ChevronRight,
  BarChart3,
  Zap,
  Target,
} from 'lucide-react';
import type { CreatorProofProfile, Parlay } from '../types';
import { useDailyHrBoard } from '../features/hr/hooks/useDailyHrBoard';
import { MostVouchedPlayersPanel } from '../features/hr/components/Social/MostVouchedPlayersPanel';
import { buildBoard } from '../features/hr/utils/normalizeHrWatch';
import { useDailyReport } from '../hooks/queries/useDailyReport';
import { todayISO } from '../hooks/queries/hrBoardQuery';
import { usePlayerVouchLeaderboard } from '../hooks/queries/usePlayerVouchLayer';
import { Z8_LABEL, Z8_PAGE, Z8_PANEL_PREMIUM, Z8_PANEL } from '../theme/z8Tokens';
import { buildTodayDecision } from './today/todayDecisionModel';
import TodayDecisionReel, { type BriefingFilter } from './today/TodayDecisionReel';
import { buildTodayReelSlides } from './today/todayDecisionReelModel';
import { toHrParlayPickerPlayer } from '../features/hr/utils/hrDecisionBrief';
import { openParlayAdd } from '../lib/parlays/parlayAddContract';

const SocialHubZ8 = React.lazy(() => import('../pages/SocialHubZ8'));

interface Props {
  onSectionChange: (section: string) => void;
  savedSlips?: Parlay[];
  profile?: CreatorProofProfile;
  isLoggedIn?: boolean;
}

type QuickRoute = {
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  label: string;
  color: string;
  bg: string;
};

const QUICK_ROUTES: QuickRoute[] = [
  { icon: Flame,          section: 'hr_board',           label: 'HR Intel',      color: 'text-vouch-emerald', bg: 'bg-vouch-emerald/10 border-vouch-emerald/20' },
  { icon: Swords,         section: 'team_matchup_lab',   label: 'Matchups',      color: 'text-vouch-cyan',    bg: 'bg-vouch-cyan/10 border-vouch-cyan/20' },
  { icon: Users,          section: 'daily_players',      label: 'Lineups',       color: 'text-sky-400',       bg: 'bg-sky-400/10 border-sky-400/20' },
  { icon: UserRoundSearch,section: 'research',           label: 'Research',      color: 'text-violet-400',    bg: 'bg-violet-400/10 border-violet-400/20' },
  { icon: Trophy,         section: 'results',            label: 'Results',       color: 'text-amber-400',     bg: 'bg-amber-400/10 border-amber-400/20' },
  { icon: Radio,          section: 'live_games',         label: 'Live',          color: 'text-rose-400',      bg: 'bg-rose-400/10 border-rose-400/20' },
  { icon: BarChart3,      section: 'intel',              label: 'Intel Hub',     color: 'text-vouch-emerald', bg: 'bg-vouch-emerald/10 border-vouch-emerald/20' },
  { icon: Target,         section: 'build',              label: 'Build Slip',    color: 'text-vouch-cyan',    bg: 'bg-vouch-cyan/10 border-vouch-cyan/20' },
];

const BRIEFING_FILTERS: Array<{ id: BriefingFilter; label: string }> = [
  { id: 'all',      label: 'All' },
  { id: 'signals',  label: 'Signals' },
  { id: 'alerts',   label: 'Alerts' },
  { id: 'activity', label: 'Activity' },
];

export default function TodayDashboardZ8({ onSectionChange, savedSlips = [] }: Props) {
  const [showFollowing, setShowFollowing] = useState(false);
  const [briefingFilter, setBriefingFilter] = useState<BriefingFilter>('all');
  const dailyReportQuery = useDailyReport();
  const hrBoardQuery = useDailyHrBoard(todayISO());
  const report = dailyReportQuery.data ?? null;
  const playerVouchLeaderboard = usePlayerVouchLeaderboard(todayISO(), 5);
  const hrBoard = useMemo(
    () => hrBoardQuery.data ? buildBoard(hrBoardQuery.data) : null,
    [hrBoardQuery.data],
  );
  const visibleHrRows = useMemo(() => {
    if (!hrBoard) return [];
    if (hrBoard.confirmed.length > 0) return hrBoard.confirmed;
    if (hrBoard.curated.length > 0) return hrBoard.curated;
    return hrBoard.all;
  }, [hrBoard]);
  const pendingSlipList = useMemo(
    () => savedSlips.filter((slip) => String(slip.status || 'PENDING').toUpperCase() === 'PENDING'),
    [savedSlips],
  );

  const decision = useMemo(
    () => buildTodayDecision({
      report,
      loading: dailyReportQuery.isLoading,
      hasError: dailyReportQuery.isError,
      savedSlips: savedSlips.length,
      pendingSlips: pendingSlipList.length,
      hrSignalCount: hrBoard ? visibleHrRows.length : null,
      hrSignalsLoading: hrBoardQuery.loading,
    }),
    [dailyReportQuery.isError, dailyReportQuery.isLoading, hrBoard, hrBoardQuery.loading, pendingSlipList.length, report, savedSlips.length, visibleHrRows.length],
  );

  const featuredPlayer = useMemo(() => {
    const hasOfficialLineup = Boolean(hrBoard?.confirmed.length);
    const row = visibleHrRows[0] ?? null;
    if (!row || hasOfficialLineup || row.truthStatus !== 'official') return row;
    return { ...row, truthStatus: 'projected' as const };
  }, [hrBoard?.confirmed.length, visibleHrRows]);

  const reelSlides = useMemo(
    () => buildTodayReelSlides({ decision, report, topPlayer: featuredPlayer }),
    [decision, featuredPlayer, report],
  );

  const addFeaturedPlayerToSlip = React.useCallback(() => {
    if (!featuredPlayer || featuredPlayer.playerId == null || featuredPlayer.truthStatus === 'blocked') {
      onSectionChange('hr_board');
      return;
    }
    openParlayAdd({
      player: toHrParlayPickerPlayer(featuredPlayer),
      propHint: {
        id: `today-hr-${featuredPlayer.stableId}`,
        market: 'Home Runs',
        odds: featuredPlayer.bookOdds ?? null,
        spec: `${featuredPlayer.playerName} 1+ Home Run`,
        gamePk: featuredPlayer.gamePk ?? undefined,
        playerId: featuredPlayer.playerId,
      },
      initialFamily: 'home_runs',
      isPitcher: false,
      source: 'today',
      dataStatus: featuredPlayer.truthStatus === 'official' ? 'official' : 'projected',
      reasoningSnapshot: featuredPlayer.reasons[0] ?? null,
      riskSnapshot: featuredPlayer.warnings[0] ?? null,
    });
  }, [featuredPlayer, onSectionChange]);

  const activeSlip = pendingSlipList[0] ?? null;
  const isLoading = dailyReportQuery.isLoading || hrBoardQuery.loading;
  const isDegraded = dailyReportQuery.isError || hrBoardQuery.error || report?.dataQuality === 'limited';
  const statusTone = isLoading ? 'text-vouch-cyan' : isDegraded ? 'text-amber-300' : 'text-vouch-emerald';
  const statusDot = isLoading ? 'bg-vouch-cyan animate-pulse' : isDegraded ? 'bg-amber-300' : 'bg-vouch-emerald';
  const statusLabel = isLoading ? 'Syncing' : isDegraded ? 'Partial data' : 'All clear';

  if (showFollowing) {
    return (
      <main className={`${Z8_PAGE} min-h-screen px-3 py-4`}>
        <button
          type="button"
          onClick={() => setShowFollowing(false)}
          className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-4 text-xs font-bold text-vouch-cyan"
        >
          <ArrowRight className="h-4 w-4 rotate-180" /> Back
        </button>
        <React.Suspense fallback={<PanelSkeleton />}><SocialHubZ8 /></React.Suspense>
      </main>
    );
  }

  return (
    <main className={`${Z8_PAGE} min-h-screen overflow-x-hidden pb-24`} id="today-dashboard">

      {/* ── Sticky top bar ─────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-white/[0.07] bg-[hsl(var(--ve-bg-deep)/0.90)] backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-vouch-emerald/15 border border-vouch-emerald/30 font-mono text-[9px] font-black text-vouch-emerald tracking-tight">VE</span>
          <div>
            <h1 className="text-[15px] font-black text-white tracking-tight leading-none">Today</h1>
            <p className="text-[10px] text-white/40 font-medium leading-none mt-0.5">{formatReportDate(report?.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
            <span className={`text-[10px] font-bold ${statusTone}`}>{statusLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowFollowing(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 hover:text-white transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => dailyReportQuery.refetch?.()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-vouch-cyan' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 max-w-2xl lg:max-w-6xl mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start">

        <div className="space-y-5">
          {/* ── Today's Briefing ───────────────────────────── */}
          <section id="today-briefing-section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-vouch-emerald" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Briefing</h2>
              </div>
              <span className={`${Z8_LABEL} text-white/30`}>{reelSlides.length + (activeSlip ? 1 : 0)} cards</span>
            </div>
            <TodayDecisionReel
              slides={reelSlides}
              pendingSlip={activeSlip}
              filter={briefingFilter}
              onSectionChange={onSectionChange}
              onAddFeaturedPlayer={addFeaturedPlayerToSlip}
            />
            {/* Filter pills — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 mt-3 no-scrollbar">
              {BRIEFING_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBriefingFilter(f.id)}
                  aria-pressed={briefingFilter === f.id}
                  className={`inline-flex min-h-8 shrink-0 items-center rounded-full border px-3.5 text-[11px] font-bold transition ${
                    briefingFilter === f.id
                      ? 'border-vouch-emerald/45 bg-vouch-emerald/12 text-vouch-emerald'
                      : 'border-white/10 bg-white/[0.02] text-white/40 hover:text-white/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Quick Access icon grid ─────────────────────── */}
          <section id="today-quick-access">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-vouch-cyan" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Quick Access</h2>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {QUICK_ROUTES.map((route) => (
                <button
                  key={route.section}
                  type="button"
                  onClick={() => onSectionChange(route.section)}
                  className={`flex flex-col items-center justify-center rounded-2xl border py-4 gap-2 transition active:scale-95 ${route.bg}`}
                >
                  <route.icon className={`h-6 w-6 ${route.color}`} />
                  <span className={`text-[10px] font-black text-center leading-tight ${route.color}`}>{route.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Most Vouched Players ───────────────────────── */}
          <section id="today-most-vouched">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Top Backed</h2>
            </div>
            <MostVouchedPlayersPanel
              players={playerVouchLeaderboard.data ?? []}
              subtitle="The players the community is backing most today."
              onSelectPlayer={() => onSectionChange('hr_board')}
              onOpenBoard={() => onSectionChange('hr_board')}
            />
          </section>
        </div>

        <div className="mt-5 lg:mt-0 space-y-5 lg:sticky lg:top-20">
          {/* ── Stat chips row ─────────────────────────────── */}
          <div className="grid grid-cols-4 gap-2" id="today-stat-chips">
            <StatChip icon={Gamepad2} value={report?.gameCount ?? '—'} label="Games"   color="text-vouch-emerald" />
            <StatChip icon={Radio}    value={decision.liveGames}        label="Live"    color="text-rose-400" />
            <StatChip icon={CheckCircle2} value={decision.finalGames}   label="Final"   color="text-white/50" />
            <StatChip icon={Activity} value={hrBoard ? visibleHrRows.length : '—'} label="Signals" color="text-vouch-cyan" />
          </div>

          {/* ── Active Slip card ───────────────────────────── */}
          <section id="today-active-slip">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-vouch-cyan" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">My Slip</h2>
              </div>
              <button
                type="button"
                onClick={() => onSectionChange('live_parlays')}
                className="text-[11px] font-bold text-vouch-cyan flex items-center gap-1"
              >
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {activeSlip ? (
              <div className={`${Z8_PANEL_PREMIUM} rounded-2xl overflow-hidden`}>
                <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/[0.07]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">{activeSlip.title || 'Active Slip'}</p>
                    <p className="mt-0.5 text-[11px] text-white/40">{activeSlip.legs.length} legs · {activeSlip.mode === 'REAL' ? 'Tracked' : 'Practice'}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-black text-vouch-emerald">{activeSlip.totalOdds || 'TBD'}</span>
                </div>
                <div className="divide-y divide-white/[0.07]">
                  {activeSlip.legs.slice(0, 3).map((leg) => (
                    <div key={leg.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white/80">{leg.selection}</p>
                        <p className="mt-0.5 truncate text-[10px] text-white/40">{leg.market}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-vouch-cyan">{formatOdds(leg.odds)}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onSectionChange('live_parlays')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-vouch-emerald py-2.5 text-xs font-black text-black"
                  >
                    Open Slip <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className={`${Z8_PANEL_PREMIUM} rounded-2xl flex flex-col items-center justify-center py-10 px-6 text-center`}>
                <ClipboardList className="h-8 w-8 text-white/20" />
                <p className="mt-3 text-sm font-bold text-white/60">No active slip</p>
                <p className="mt-1 text-xs text-white/35 leading-relaxed max-w-[220px]">Research a signal and add it to start building.</p>
                <button
                  type="button"
                  onClick={() => onSectionChange('hr_board')}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-vouch-emerald/35 bg-vouch-emerald/10 px-4 py-2 text-xs font-black text-vouch-emerald"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Explore signals
                </button>
              </div>
            )}
          </section>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <p className="pb-4 pt-2 text-center text-[10px] font-medium text-white/25 lg:col-span-2">
          Probability-based research. No guaranteed outcomes.
        </p>
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ icon: Icon, value, label, color }: { icon: React.ComponentType<{ className?: string }>; value: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] py-3 px-1 gap-1">
      <Icon className={`h-4 w-4 ${color}`} />
      <strong className={`font-mono text-base font-black leading-none ${color}`}>{value}</strong>
      <span className="text-[9px] font-bold uppercase tracking-wider text-white/35 leading-none">{label}</span>
    </div>
  );
}

function PanelSkeleton() {
  return <div className={`${Z8_PANEL} h-64 animate-pulse rounded-2xl bg-white/[0.025]`} />;
}

function formatReportDate(value?: string) {
  const parsed = value ? new Date(`${value}T12:00:00`) : new Date();
  return parsed.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatOdds(odds: number | null) {
  if (odds === null || !Number.isFinite(odds)) return 'TBD';
  return odds > 0 ? `+${odds}` : String(odds);
}
