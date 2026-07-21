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
  { icon: Flame,          section: 'hr_board',           label: 'HR Intel',      color: 'text-vouch-emerald', bg: 'bg-vouch-emerald/10 border-vouch-emerald/30 hover:border-vouch-emerald/60 shadow-[0_0_12px_rgba(0,255,148,0.15)]' },
  { icon: Swords,         section: 'team_matchup_lab',   label: 'Matchups',      color: 'text-vouch-cyan',    bg: 'bg-vouch-cyan/10 border-vouch-cyan/30 hover:border-vouch-cyan/60 shadow-[0_0_12px_rgba(0,240,255,0.15)]' },
  { icon: Users,          section: 'daily_players',      label: 'Lineups',       color: 'text-sky-400',       bg: 'bg-sky-400/10 border-sky-400/30 hover:border-sky-400/60 shadow-[0_0_12px_rgba(56,189,248,0.15)]' },
  { icon: UserRoundSearch,section: 'research',           label: 'Research',      color: 'text-violet-400',    bg: 'bg-violet-400/10 border-violet-400/30 hover:border-violet-400/60 shadow-[0_0_12px_rgba(167,139,250,0.15)]' },
  { icon: Trophy,         section: 'results',            label: 'Results',       color: 'text-amber-400',     bg: 'bg-amber-400/10 border-amber-400/30 hover:border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.15)]' },
  { icon: Radio,          section: 'live_games',         label: 'Live',          color: 'text-rose-400',      bg: 'bg-rose-400/10 border-rose-400/30 hover:border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.15)]' },
  { icon: BarChart3,      section: 'intel',              label: 'Intel Hub',     color: 'text-vouch-emerald', bg: 'bg-vouch-emerald/10 border-vouch-emerald/30 hover:border-vouch-emerald/60 shadow-[0_0_12px_rgba(0,255,148,0.15)]' },
  { icon: Target,         section: 'build',              label: 'Build Slip',    color: 'text-vouch-cyan',    bg: 'bg-vouch-cyan/10 border-vouch-cyan/30 hover:border-vouch-cyan/60 shadow-[0_0_12px_rgba(0,240,255,0.15)]' },
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

  const reelSlides = useMemo(
    () => buildTodayReelSlides({
      decision,
      report,
      topPlayer: visibleHrRows[0] ?? null,
    }),
    [decision, report, visibleHrRows],
  );

  const featuredPlayer = visibleHrRows[0] ?? null;

  const addFeaturedPlayerToSlip = useMemo(() => {
    if (!featuredPlayer) return undefined;
    if (featuredPlayer.truthStatus === 'blocked') return undefined;
    return () => {
      onSectionChange('hr_board');
      return;
    };
  }, [featuredPlayer, onSectionChange]);

  const activeSlip = pendingSlipList[0] ?? null;
  const isLoading = dailyReportQuery.isLoading || hrBoardQuery.loading;
  const isDegraded = dailyReportQuery.isError || hrBoardQuery.error || report?.dataQuality === 'limited';
  const statusTone = isLoading ? 'text-vouch-cyan' : isDegraded ? 'text-amber-300' : 'text-vouch-emerald';
  const statusDot = isLoading ? 'bg-vouch-cyan animate-pulse' : isDegraded ? 'bg-amber-300' : 'bg-vouch-emerald';
  const statusLabel = isLoading ? 'Syncing' : isDegraded ? 'Partial data' : 'Live Sync Active';

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
    <main className={`${Z8_PAGE} min-h-screen w-full max-w-full overflow-x-hidden min-w-0 pb-24`} id="today-dashboard">

      {/* ── Sticky top bar with Glassmorphism ─────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-white/12 bg-[#060c14]/90 backdrop-blur-2xl px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-vouch-emerald/20 border border-vouch-emerald/40 font-mono text-[10px] font-black text-vouch-emerald shadow-[0_0_10px_rgba(0,255,148,0.25)]">
            VE
          </span>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none uppercase">Today&apos;s Intel</h1>
            <p className="text-[10px] text-slate-400 font-bold leading-none mt-1">{formatReportDate(report?.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Live Pill */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-black/40 px-3 py-1 font-mono text-[11px]">
            <span className={`h-2 w-2 rounded-full ${statusDot}`} />
            <span className={`font-bold uppercase tracking-wider ${statusTone}`}>{statusLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowFollowing(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/12 bg-black/40 text-slate-300 hover:text-white hover:border-vouch-cyan transition"
            title="Following Hub"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => dailyReportQuery.refetch?.()}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/12 bg-black/40 text-slate-300 hover:text-vouch-cyan transition"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-vouch-cyan' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-3 sm:px-6 lg:px-8 pt-4 pb-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* ── Compact 4-Stat Ticker Strip (SINGLE ROW ON MOBILE) ───────── */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3" id="today-stat-chips">
          <StatChip icon={Gamepad2} value={report?.gameCount ?? '—'} label="MLB Games Today" color="text-vouch-emerald" glow="hover:border-vouch-emerald/40 shadow-[0_0_10px_rgba(0,255,148,0.1)]" />
          <StatChip icon={Radio}    value={decision.liveGames}        label="In-Progress"     color="text-rose-400" glow="hover:border-rose-400/40 shadow-[0_0_10px_rgba(244,63,94,0.1)]" />
          <StatChip icon={CheckCircle2} value={decision.finalGames}   label="Completed"       color="text-slate-300" glow="hover:border-white/30" />
          <StatChip icon={Activity} value={hrBoard ? visibleHrRows.length : '—'} label="Active Signals" color="text-vouch-cyan" glow="hover:border-vouch-cyan/40 shadow-[0_0_10px_rgba(0,240,255,0.1)]" />
        </div>

        {/* ── Platform Systems Quick Access ───────────────────────────── */}
        <section id="today-quick-access" className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625]/90 via-[#07111e]/90 to-[#040810]/90 p-3.5 sm:p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-vouch-cyan/20 border border-vouch-cyan/40 text-vouch-cyan">
                <Target className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white">Platform OS Engines</h2>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-vouch-cyan font-black bg-vouch-cyan/10 border border-vouch-cyan/30 px-2 py-0.5 rounded-full">
              8 Core Systems
            </span>
          </div>

          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            {QUICK_ROUTES.map((route) => (
              <button
                key={route.section}
                type="button"
                onClick={() => onSectionChange(route.section)}
                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 gap-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${route.bg}`}
              >
                <route.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${route.color}`} />
                <span className={`text-[10px] font-black text-center leading-tight tracking-tight ${route.color}`}>{route.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Main Dashboard 2-column grid ─────────────────── */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
          <div className="space-y-6">
            {/* ── Today's Briefing ───────────────────────────── */}
            <section id="today-briefing-section" className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625]/90 via-[#07111e]/90 to-[#040810]/90 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-vouch-emerald" />
                  <h2 className="text-xs font-black uppercase tracking-[0.16em] text-white">Daily Intelligence Briefing</h2>
                </div>
                <span className={`${Z8_LABEL} text-white/35`}>{reelSlides.length + (activeSlip ? 1 : 0)} decision cards</span>
              </div>
              <TodayDecisionReel
                slides={reelSlides}
                pendingSlip={activeSlip}
                filter={briefingFilter}
                onSectionChange={onSectionChange}
                onAddFeaturedPlayer={addFeaturedPlayerToSlip}
              />
              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 mt-3.5 no-scrollbar">
                {BRIEFING_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBriefingFilter(f.id)}
                    aria-pressed={briefingFilter === f.id}
                    className={`inline-flex min-h-8 shrink-0 items-center rounded-full border px-4 text-[11px] font-bold tracking-wide transition ${
                      briefingFilter === f.id
                        ? 'border-vouch-emerald/45 bg-vouch-emerald/15 text-vouch-emerald shadow-[0_0_12px_rgba(49,181,131,0.15)]'
                        : 'border-white/10 bg-white/[0.03] text-white/45 hover:text-white/80'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Most Vouched Players ───────────────────────── */}
            <section id="today-most-vouched">
              <MostVouchedPlayersPanel
                players={playerVouchLeaderboard.data ?? []}
                subtitle="The players the community is backing most today."
                limit={4}
                onSelectPlayer={() => onSectionChange('hr_board')}
                onOpenBoard={() => onSectionChange('hr_board')}
                onViewFullPage={() => onSectionChange('most_vouched_today')}
              />
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-20">
            {/* ── Active Slip card ───────────────────────────── */}
            <section id="today-active-slip">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-vouch-cyan" />
                  <h2 className="text-xs font-black uppercase tracking-[0.16em] text-white">My Active Slip</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onSectionChange('live_parlays')}
                  className="text-[11px] font-bold text-vouch-cyan hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              {activeSlip ? (
                <div className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625] to-[#050a12] overflow-hidden shadow-xl">
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
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-vouch-emerald py-2.5 text-xs font-black text-black transition hover:bg-vouch-emerald/90 shadow-[0_0_15px_rgba(0,255,148,0.3)]"
                    >
                      Open Slip <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625] to-[#050a12] flex flex-col items-center justify-center py-10 px-6 text-center">
                  <ClipboardList className="h-8 w-8 text-white/20" />
                  <p className="mt-3 text-sm font-bold text-white/60">No active slip</p>
                  <p className="mt-1 text-xs text-white/35 leading-relaxed max-w-[220px]">Research a signal and add it to start building.</p>
                  <button
                    type="button"
                    onClick={() => onSectionChange('hr_board')}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-vouch-emerald/35 bg-vouch-emerald/10 px-4 py-2 text-xs font-black text-vouch-emerald hover:bg-vouch-emerald/20 transition shadow-[0_0_10px_rgba(0,255,148,0.15)]"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Explore signals
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <p className="pb-4 pt-4 text-center text-[10px] font-mono uppercase tracking-widest text-white/25">
          Probability-based research. No guaranteed outcomes.
        </p>
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ icon: Icon, value, label, color, glow }: { icon: React.ComponentType<{ className?: string }>; value: React.ReactNode; label: string; color: string; glow?: string }) {
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 rounded-xl border border-white/10 bg-black/40 px-2 py-2 sm:px-3 sm:py-2.5 transition ${glow ?? ''}`}>
      <div className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-black/60 border border-white/10 ${color}`}>
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs sm:text-sm font-black leading-none text-white truncate">{value}</p>
        <p className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate mt-0.5">{label}</p>
      </div>
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
