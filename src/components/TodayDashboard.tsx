import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Flame,
  Gamepad2,
  Radio,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  UserRoundSearch,
  Users,
} from 'lucide-react';
import type { CreatorProofProfile, Parlay } from '../types';
import { useDailyHrBoard } from '../features/hr/hooks/useDailyHrBoard';
import { MostVouchedPlayersPanel } from '../features/hr/components/Social/MostVouchedPlayersPanel';
import { buildBoard } from '../features/hr/utils/normalizeHrWatch';
import { useDailyReport } from '../hooks/queries/useDailyReport';
import { todayISO } from '../hooks/queries/hrBoardQuery';
import { usePlayerVouchLeaderboard } from '../hooks/queries/usePlayerVouchLayer';
import { Z8_LABEL, Z8_PAGE, Z8_PANEL } from '../theme/z8Tokens';
import { buildTodayDecision, type TodayAttentionItem } from './today/todayDecisionModel';
import TodayDecisionReel, { type BriefingFilter } from './today/TodayDecisionReel';
import { buildTodayReelSlides } from './today/todayDecisionReelModel';
import { toHrParlayPickerPlayer } from '../features/hr/utils/hrDecisionBrief';
import { openParlayAdd } from '../lib/parlays/parlayAddContract';

const FollowingHubPage = React.lazy(() => import('../pages/FollowingHubPage'));

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
  detail: string;
};

const QUICK_ROUTES: QuickRoute[] = [
  { icon: Flame, section: 'hr_board', label: 'HR Intelligence', detail: 'View all signals' },
  { icon: Swords, section: 'team_matchup_lab', label: 'Matchups', detail: 'Study today\'s games' },
  { icon: Users, section: 'daily_players', label: 'Lineups', detail: 'Projected and confirmed' },
  { icon: UserRoundSearch, section: 'research', label: 'Player Research', detail: 'Deep player insights' },
  { icon: Trophy, section: 'results', label: 'Results', detail: 'Track outcomes' },
  { icon: Radio, section: 'live_games', label: 'Live Games', detail: 'Follow the slate' },
];

const BRIEFING_FILTERS: Array<{ id: BriefingFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'signals', label: 'Signals' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'activity', label: 'My Activity' },
];

export default function TodayDashboard({ onSectionChange, savedSlips = [] }: Props) {
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
  const statusLabel = isLoading ? 'Syncing today\'s data' : isDegraded ? 'Partial data available' : 'All systems operational';
  const statusTone = isLoading ? 'text-vouch-cyan' : isDegraded ? 'text-amber-300' : 'text-vouch-emerald';

  if (showFollowing) {
    return (
      <main className={`${Z8_PAGE} ve-page-shell min-h-0 bg-ve-obsidian px-3 py-4 text-ve-flash sm:px-4 lg:py-5`}>
        <div className="mx-auto max-w-[1280px]">
          <button
            type="button"
            onClick={() => setShowFollowing(false)}
            className="z8-control mb-4 inline-flex min-h-9 items-center gap-2 rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-4 text-xs font-bold text-vouch-cyan"
          >
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Today
          </button>
          <React.Suspense fallback={<PanelSkeleton />}><FollowingHubPage /></React.Suspense>
        </div>
      </main>
    );
  }

  return (
    <main className={`${Z8_PAGE} ve-page-shell min-h-0 overflow-hidden bg-ve-obsidian px-3 pb-8 pt-4 text-ve-flash sm:px-5 lg:px-6 lg:pt-6`}>
      <div className="mx-auto max-w-[1280px] space-y-5">
        <header className="relative">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vouch-emerald/35 bg-vouch-emerald/10 font-mono text-[10px] font-black tracking-[-0.08em] text-vouch-emerald sm:hidden"
                aria-label="VouchEdge"
              >
                VE
              </span>
              <CalendarDays className="mt-1 hidden h-7 w-7 text-white/85 sm:block" />
              <div>
                <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Today</h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-white/55 sm:text-base">
                  <CalendarDays className="h-4 w-4 sm:hidden" />
                  {formatReportDate(report?.date)}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-[11px] text-white/48">
                <span>{formatUpdatedAt(report?.generatedAt)}</span>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-vouch-cyan' : 'text-vouch-cyan'}`} />
              </div>
              <button
                type="button"
                onClick={() => setShowFollowing(true)}
                className="z8-control inline-flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 text-[11px] font-bold text-white/55 hover:text-white"
              >
                <Users className="h-3.5 w-3.5" /> Following
              </button>
            </div>
          </div>

          <section className={`${Z8_PANEL} ve-premium-panel grid gap-0 overflow-hidden rounded-xl border-white/[0.09] sm:grid-cols-[1fr_auto]`} aria-label="Today slate status">
            <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.07] sm:grid-cols-4 sm:divide-y-0">
              <SummaryMetric icon={Gamepad2} value={report?.gameCount ?? '—'} label="Games Today" tone="text-vouch-emerald" />
              <SummaryMetric icon={Radio} value={decision.liveGames} label="Live Now" tone="text-rose-400" />
              <SummaryMetric icon={CheckCircle2} value={decision.finalGames} label="Final" tone="text-white/60" />
              <SummaryMetric icon={Activity} value={hrBoard ? visibleHrRows.length : '—'} label="HR Signals" tone="text-vouch-cyan" />
            </div>
            <div className="flex min-w-[210px] items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3 sm:border-l sm:border-t-0">
              <span className={`inline-flex items-center gap-2 text-[11px] font-bold ${statusTone}`}>
                <CircleDot className="h-3.5 w-3.5" /> {statusLabel}
              </span>
              <button
                type="button"
                onClick={() => onSectionChange('results')}
                className="z8-control inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-white/20 px-3 text-[11px] font-bold text-white/80 hover:border-vouch-cyan/40 hover:text-vouch-cyan"
              >
                <ClipboardList className="h-4 w-4" /> Recap
              </button>
            </div>
          </section>
        </header>

        <section aria-labelledby="today-briefing-heading">
          <div className="mb-3 flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2 pr-24 sm:pr-20">
            <h2 id="today-briefing-heading" className="flex items-center gap-2 text-base font-black uppercase tracking-[0.02em] text-white sm:text-lg">
              <span className="h-6 w-0.5 bg-vouch-emerald" /> Today&apos;s Briefing
            </h2>
            <p className="text-xs text-white/48">Your edge in 60 seconds.</p>
            <span className={`${Z8_LABEL} ml-auto hidden text-white/30 md:inline`}>{reelSlides.length + (activeSlip ? 1 : 0)} verified cards</span>
          </div>
          <TodayDecisionReel
            slides={reelSlides}
            pendingSlip={activeSlip}
            filter={briefingFilter}
            onSectionChange={onSectionChange}
            onAddFeaturedPlayer={addFeaturedPlayerToSlip}
          />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Briefing filters">
            {BRIEFING_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setBriefingFilter(filter.id)}
                aria-pressed={briefingFilter === filter.id}
                className={`z8-control inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 text-xs font-bold transition ${
                  briefingFilter === filter.id
                    ? 'border-vouch-emerald/45 bg-vouch-emerald/12 text-vouch-emerald'
                    : 'border-white/10 bg-white/[0.02] text-white/45 hover:text-white/75'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <MySlipsPanel slip={activeSlip} onSectionChange={onSectionChange} />
          <ImpactPanel attention={decision.attention} report={report} onSectionChange={onSectionChange} />
        </section>

        <MostVouchedPlayersPanel
          players={playerVouchLeaderboard.data ?? []}
          subtitle="The players the community is backing most across today’s slate."
          onOpenBoard={() => onSectionChange('hr_board')}
        />

        <section className={`${Z8_PANEL} ve-premium-panel rounded-xl p-4 sm:p-5`} aria-labelledby="quick-access-heading">
          <h2 id="quick-access-heading" className="text-base font-black uppercase tracking-[0.03em] text-white">Quick Access</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {QUICK_ROUTES.map((route) => <QuickRouteButton key={route.section} route={route} onSectionChange={onSectionChange} />)}
          </div>
        </section>

        <p className="pb-2 text-center text-[10px] font-medium text-white/30">Probability-based sports research. No guaranteed outcomes.</p>
      </div>
    </main>
  );
}

function SummaryMetric({ icon: Icon, value, label, tone }: { icon: React.ComponentType<{ className?: string }>; value: React.ReactNode; label: string; tone: string }) {
  return (
    <div className="flex min-h-[72px] items-center gap-3 px-4 py-3">
      <Icon className={`h-5 w-5 shrink-0 ${tone}`} />
      <div><strong className="block font-mono text-xl font-black text-white">{value}</strong><span className="text-[10px] font-medium text-white/45">{label}</span></div>
    </div>
  );
}

function MySlipsPanel({ slip, onSectionChange }: { slip: Parlay | null; onSectionChange: (section: string) => void }) {
  return (
    <section className={`${Z8_PANEL} ve-premium-panel min-h-[290px] rounded-xl p-4 sm:p-5`} aria-labelledby="my-slips-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="my-slips-heading" className="text-base font-black uppercase tracking-[0.03em] text-white">My Slips</h2>
        <button type="button" onClick={() => onSectionChange('live_parlays')} className="z8-control min-h-9 text-xs font-bold text-vouch-cyan">View all</button>
      </div>
      {slip ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
            <div><p className="text-sm font-black text-white">{slip.title || 'Active Slip'}</p><p className="mt-0.5 text-[11px] text-white/40">{slip.legs.length} legs · {slip.mode === 'REAL' ? 'Tracked' : 'Practice'}</p></div>
            <span className="font-mono text-sm font-black text-vouch-emerald">{slip.totalOdds || 'Odds TBD'}</span>
          </div>
          <div className="divide-y divide-white/[0.07]">
            {slip.legs.slice(0, 3).map((leg) => (
              <div key={leg.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0"><p className="truncate text-xs font-bold text-white/80">{leg.selection}</p><p className="mt-0.5 truncate text-[10px] text-white/40">{leg.market} · {leg.game}</p></div>
                <span className="shrink-0 font-mono text-xs font-bold text-vouch-cyan">{formatOdds(leg.odds)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-white/[0.07] px-3 py-2">
            <button type="button" onClick={() => onSectionChange('live_parlays')} className="z8-control inline-flex min-h-9 items-center gap-2 rounded-lg bg-vouch-emerald px-4 text-xs font-black text-black">View Slip <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex min-h-[205px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
          <ClipboardList className="h-9 w-9 text-white/20" />
          <p className="mt-3 text-sm font-bold text-white/70">No active slip yet</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-white/40">Add a researched signal when you are ready. VouchEdge will keep the saved context visible here.</p>
          <button type="button" onClick={() => onSectionChange('hr_board')} className="z8-control mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-vouch-emerald/35 bg-vouch-emerald/10 px-4 text-xs font-black text-vouch-emerald"><Sparkles className="h-4 w-4" /> Explore signals</button>
        </div>
      )}
    </section>
  );
}

function ImpactPanel({ attention, report, onSectionChange }: { attention: TodayAttentionItem[]; report: ReturnType<typeof useDailyReport>['data'] | null; onSectionChange: (section: string) => void }) {
  const pitcher = report?.vulnerablePitchers?.[0] ?? null;
  return (
    <section className={`${Z8_PANEL} ve-premium-panel min-h-[290px] rounded-xl p-4 sm:p-5`} aria-labelledby="impact-heading">
      <div className="flex items-center justify-between gap-3"><h2 id="impact-heading" className="text-base font-black uppercase tracking-[0.03em] text-white">Updates &amp; Impact</h2><span className={`${Z8_LABEL} text-white/32`}>Verified inputs only</span></div>
      <div className="mt-3 divide-y divide-white/[0.07] border-y border-white/[0.07]">
        {attention.slice(0, 3).map((item) => <ImpactRow key={item.id} item={item} onSectionChange={onSectionChange} />)}
        {pitcher ? (
          <button type="button" onClick={() => onSectionChange('team_matchup_lab')} className="group flex w-full items-center gap-3 py-3 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/8 text-amber-300"><ShieldAlert className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-white/80">{pitcher.pitcherName} matchup flagged</span><span className="mt-0.5 block truncate text-[10px] text-white/42">{pitcher.attackReasons[0] || `${pitcher.riskTier.toLowerCase()} vulnerability context available`}</span></span>
            <span className="rounded border border-amber-300/20 bg-amber-300/8 px-2 py-1 text-[9px] font-black uppercase text-amber-300">{pitcher.riskTier}</span>
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-[10px] leading-4 text-white/35">No fabricated headlines or timestamps. This panel reflects only the current VouchEdge slate and saved activity.</p>
    </section>
  );
}

function ImpactRow({ item, onSectionChange }: { item: TodayAttentionItem; onSectionChange: (section: string) => void }) {
  const Icon = item.kind === 'data' ? CheckCircle2 : item.kind === 'slate' ? CalendarDays : Activity;
  const body = <><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vouch-cyan/20 bg-vouch-cyan/8 text-vouch-cyan"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-white/80">{item.value}</span><span className="mt-0.5 block truncate text-[10px] text-white/42">{item.detail}</span></span>{item.section ? <ArrowRight className="h-4 w-4 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-vouch-cyan" /> : null}</>;
  if (!item.section) return <div className="flex items-center gap-3 py-3">{body}</div>;
  return <button type="button" onClick={() => onSectionChange(item.section!)} className="group flex w-full items-center gap-3 py-3 text-left">{body}</button>;
}

function QuickRouteButton({ route, onSectionChange }: { route: QuickRoute; onSectionChange: (section: string) => void }) {
  const Icon = route.icon;
  return (
    <button type="button" onClick={() => onSectionChange(route.section)} className="z8-control group flex min-h-[116px] flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-transparent px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-vouch-emerald/35 hover:bg-vouch-emerald/[0.04]">
      <Icon className="h-7 w-7 text-vouch-emerald transition group-hover:scale-105" />
      <span className="mt-3 text-xs font-black text-white/80">{route.label}</span>
      <span className="mt-1 text-[10px] leading-4 text-white/38">{route.detail}</span>
    </button>
  );
}

function PanelSkeleton() {
  return <div className={`${Z8_PANEL} h-96 animate-pulse rounded-xl bg-white/[0.025]`} />;
}

function formatReportDate(value?: string) {
  const parsed = value ? new Date(`${value}T12:00:00`) : new Date();
  return parsed.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatUpdatedAt(value?: string) {
  if (!value) return 'Update pending';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Update time unavailable';
  return `Updated ${parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function formatOdds(odds: number | null) {
  if (odds === null || !Number.isFinite(odds)) return 'TBD';
  return odds > 0 ? `+${odds}` : String(odds);
}
