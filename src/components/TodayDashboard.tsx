import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Flame,
  LayoutDashboard,
  Radar,
  Search,
  ShieldCheck,
  Sliders,
  Trophy,
  Users,
} from 'lucide-react';
import type { CreatorProofProfile, Parlay } from '../types';
import { useDailyHrBoard } from '../features/hr/hooks/useDailyHrBoard';
import { buildBoard } from '../features/hr/utils/normalizeHrWatch';
import { useDailyReport } from '../hooks/queries/useDailyReport';
import { todayISO } from '../hooks/queries/hrBoardQuery';
import { motion } from '../lib/motion';
import { Z8_LABEL, Z8_PAGE, Z8_PANEL } from '../theme/z8Tokens';
import {
  buildTodayDecision,
  type TodayAttentionItem,
  type TodayDecisionTone,
} from './today/todayDecisionModel';
import TodayDecisionReel from './today/TodayDecisionReel';
import { buildTodayReelSlides } from './today/todayDecisionReelModel';

const FollowingHubPage = React.lazy(() => import('../pages/FollowingHubPage'));

const TODAY_PANELS = ['overview', 'following'] as const;
type TodayPanel = (typeof TODAY_PANELS)[number];
const SWIPE_THRESHOLD = 56;

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
  { icon: Flame, section: 'hr_board', label: 'HR Intelligence', detail: 'Compare today\'s signals' },
  { icon: Search, section: 'research', label: 'Player Research', detail: 'Study one player deeply' },
  { icon: Sliders, section: 'live_parlays', label: 'ParlayOS', detail: 'Build and monitor slips' },
  { icon: Activity, section: 'live_games', label: 'Live Games', detail: 'Follow the current slate' },
  { icon: Trophy, section: 'results', label: 'Results', detail: 'See the verified record' },
];

const TONE_STYLES: Record<TodayDecisionTone, { text: string; border: string; bg: string; glow: string }> = {
  cyan: {
    text: 'text-vouch-cyan',
    border: 'border-vouch-cyan/35',
    bg: 'bg-vouch-cyan/10',
    glow: 'via-vouch-cyan/70',
  },
  emerald: {
    text: 'text-vouch-emerald',
    border: 'border-vouch-emerald/35',
    bg: 'bg-vouch-emerald/10',
    glow: 'via-vouch-emerald/70',
  },
  amber: {
    text: 'text-amber-300',
    border: 'border-amber-300/30',
    bg: 'bg-amber-300/10',
    glow: 'via-amber-300/60',
  },
};

export default function TodayDashboard({ onSectionChange, savedSlips = [] }: Props) {
  const [activePanel, setActivePanel] = useState<TodayPanel>('overview');
  const touchStartX = useRef<number | null>(null);
  const dailyReportQuery = useDailyReport();
  const hrBoardQuery = useDailyHrBoard(todayISO());
  const report = dailyReportQuery.data ?? null;
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

  const pendingSlips = useMemo(
    () => savedSlips.filter((slip) => String(slip.status || 'PENDING').toUpperCase() === 'PENDING').length,
    [savedSlips],
  );

  const decision = useMemo(
    () => buildTodayDecision({
      report,
      loading: dailyReportQuery.isLoading,
      hasError: dailyReportQuery.isError,
      savedSlips: savedSlips.length,
      pendingSlips,
      hrSignalCount: hrBoard ? visibleHrRows.length : null,
      hrSignalsLoading: hrBoardQuery.loading,
    }),
    [dailyReportQuery.isError, dailyReportQuery.isLoading, hrBoard, hrBoardQuery.loading, pendingSlips, report, savedSlips.length, visibleHrRows.length],
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

  const activeIndex = TODAY_PANELS.indexOf(activePanel);
  const tone = TONE_STYLES[decision.tone];

  const onTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) return;
    const delta = clientX - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD && activeIndex < TODAY_PANELS.length - 1) {
      setActivePanel(TODAY_PANELS[activeIndex + 1]);
    } else if (delta > SWIPE_THRESHOLD && activeIndex > 0) {
      setActivePanel(TODAY_PANELS[activeIndex - 1]);
    }
    touchStartX.current = null;
  };

  return (
    <main className={`${Z8_PAGE} ve-page-shell min-h-0 bg-ve-obsidian px-3 py-4 text-ve-flash sm:px-4 lg:py-5`}>
      <div className="mx-auto max-w-[1240px] space-y-4">
        <TodayNavigation activePanel={activePanel} setActivePanel={setActivePanel} activeIndex={activeIndex} />

        <div
          className="overflow-x-hidden touch-pan-y"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => onTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        >
          <motion.div
            className="flex items-start"
            style={{ width: `${TODAY_PANELS.length * 100}%` }}
            animate={{ x: `-${(activeIndex * 100) / TODAY_PANELS.length}%` }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            onDragEnd={(_, info) => {
              if (info.offset.x < -SWIPE_THRESHOLD && activeIndex < TODAY_PANELS.length - 1) {
                setActivePanel(TODAY_PANELS[activeIndex + 1]);
              } else if (info.offset.x > SWIPE_THRESHOLD && activeIndex > 0) {
                setActivePanel(TODAY_PANELS[activeIndex - 1]);
              }
            }}
          >
            <div className="shrink-0 space-y-4" style={{ width: `${100 / TODAY_PANELS.length}%` }}>
              <section className={`${Z8_PANEL} glass-command ve-premium-panel relative overflow-hidden`}>
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${tone.glow} to-transparent`} />

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 ${Z8_LABEL} ${tone.border} ${tone.bg} ${tone.text}`}>
                      <CircleDot className="h-3 w-3" />
                      {decision.statusLabel}
                    </span>
                    <span className={`${Z8_LABEL} text-white/35`}>
                      {report
                        ? `${report.gameCount} games · ${decision.liveGames} live · ${decision.finalGames} final`
                        : 'Slate status unavailable'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/30">
                    {formatUpdatedAt(report?.generatedAt)}
                  </span>
                </div>

                <TodayDecisionReel slides={reelSlides} onSectionChange={onSectionChange} />

                <aside className="border-t border-white/[0.07] bg-black/20 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className={`${Z8_LABEL} text-white/35`}>Needs attention</p>
                      <h2 className="mt-1 text-lg font-black text-white">Three things, maximum</h2>
                    </div>
                    <ShieldCheck className={`h-5 w-5 ${tone.text}`} />
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    {decision.attention.map((item, index) => (
                      <AttentionRow
                        key={item.id}
                        item={item}
                        index={index + 1}
                        onSectionChange={onSectionChange}
                      />
                    ))}
                  </div>
                </aside>
              </section>

              <section className="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                <button
                  type="button"
                  onClick={() => onSectionChange(decision.resumeSection)}
                  className={`${Z8_PANEL} ve-premium-panel group relative overflow-hidden p-5 text-left sm:p-6`}
                >
                  <div className="pointer-events-none absolute bottom-0 left-0 h-px w-2/3 bg-gradient-to-r from-vouch-cyan/80 to-transparent" />
                  <p className={`${Z8_LABEL} text-vouch-cyan`}>{decision.resumeLabel}</p>
                  <h2 className="mt-3 text-xl font-black text-white">{decision.resumeTitle}</h2>
                  <p className="mt-2 max-w-lg text-xs leading-5 text-white/45">{decision.resumeDetail}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-white/70 transition group-hover:text-vouch-cyan">
                    Continue
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </button>

                <section className={`${Z8_PANEL} ve-premium-panel p-4 sm:p-5`} aria-labelledby="today-tools-heading">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <p className={`${Z8_LABEL} text-white/35`}>Open a tool</p>
                      <h2 id="today-tools-heading" className="mt-1 text-lg font-black text-white">Go deeper when you choose</h2>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    {QUICK_ROUTES.map((route) => (
                      <QuickRouteButton key={route.section} route={route} onSectionChange={onSectionChange} />
                    ))}
                  </div>
                </section>
              </section>

              <p className="pb-2 text-center text-[10px] font-medium text-white/30">
                Probability-based sports research. No guaranteed outcomes.
              </p>
            </div>

            <div className="shrink-0 px-0.5" style={{ width: `${100 / TODAY_PANELS.length}%` }}>
              {activePanel === 'following' && (
                <React.Suspense fallback={<FollowingPanelSkeleton />}>
                  <FollowingHubPage />
                </React.Suspense>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function TodayNavigation({
  activePanel,
  setActivePanel,
  activeIndex,
}: {
  activePanel: TodayPanel;
  setActivePanel: (panel: TodayPanel) => void;
  activeIndex: number;
}) {
  return (
    <div className={`${Z8_PANEL} glass-command ve-premium-panel relative px-2 py-1.5`}>
      <span
        className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center border border-vouch-emerald/35 bg-vouch-emerald/10 font-mono text-[10px] font-black tracking-[-0.08em] text-vouch-emerald sm:hidden"
        aria-label="VouchEdge"
      >
        VE
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Today pages">
        <TodayTab active={activePanel === 'overview'} onClick={() => setActivePanel('overview')} icon={LayoutDashboard}>
          Today
        </TodayTab>
        <TodayTab active={activePanel === 'following'} onClick={() => setActivePanel('following')} icon={Users} emerald>
          Following
        </TodayTab>
      </div>
      <div className="mt-1 flex justify-center gap-1" aria-hidden="true">
        {TODAY_PANELS.map((panel, index) => (
          <span key={panel} className={`h-0.5 rounded-full transition-all ${index === activeIndex ? 'w-4 bg-vouch-cyan' : 'w-1 bg-white/15'}`} />
        ))}
      </div>
    </div>
  );
}

function TodayTab({
  active,
  onClick,
  icon: Icon,
  emerald = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  emerald?: boolean;
  children: React.ReactNode;
}) {
  const activeClasses = emerald
    ? 'border-vouch-emerald/40 bg-vouch-emerald/10 text-vouch-emerald'
    : 'border-vouch-cyan/40 bg-vouch-cyan/10 text-vouch-cyan';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`z8-control inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
        active ? activeClasses : 'border-white/10 bg-white/[0.02] text-white/40 hover:text-white/70'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function AttentionRow({
  item,
  index,
  onSectionChange,
}: {
  item: TodayAttentionItem;
  index: number;
  onSectionChange: (section: string) => void;
}) {
  const icons = { data: CheckCircle2, slate: Clock3, action: Radar };
  const Icon = icons[item.kind];
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.03] text-white/50">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-mono text-[9px] font-black text-white/25">0{index}</span>
          <span className={`${Z8_LABEL} text-white/35`}>{item.label}</span>
        </span>
        <span className="mt-1 block text-sm font-black text-white">{item.value}</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-white/40">{item.detail}</span>
      </span>
      {item.section ? <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-vouch-cyan" /> : null}
    </>
  );

  if (!item.section) {
    return <div className="flex items-center gap-3 border border-white/[0.07] bg-black/20 p-3">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onSectionChange(item.section as string)}
      className="group flex items-center gap-3 border border-white/[0.07] bg-black/20 p-3 text-left transition hover:border-vouch-cyan/30 hover:bg-vouch-cyan/[0.04]"
    >
      {content}
    </button>
  );
}

function QuickRouteButton({ route, onSectionChange }: { route: QuickRoute; onSectionChange: (section: string) => void }) {
  const Icon = route.icon;
  return (
    <button
      type="button"
      onClick={() => onSectionChange(route.section)}
      className="group flex min-h-[96px] flex-col justify-between border border-white/[0.08] bg-black/20 p-3 text-left transition hover:-translate-y-0.5 hover:border-vouch-cyan/30 hover:bg-vouch-cyan/[0.04]"
    >
      <span className="flex items-start justify-between gap-2">
        <Icon className="h-4 w-4 text-vouch-cyan/80" />
        <ArrowRight className="h-3.5 w-3.5 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-vouch-cyan" />
      </span>
      <span>
        <span className="block text-xs font-black text-white">{route.label}</span>
        <span className="mt-1 block text-[10px] leading-4 text-white/35">{route.detail}</span>
      </span>
    </button>
  );
}

function FollowingPanelSkeleton() {
  return (
    <div className={`${Z8_PANEL} min-h-[360px] animate-pulse p-5`} role="status" aria-label="Loading followed accounts">
      <div className="h-4 w-40 rounded bg-white/10" />
      <div className="mt-5 h-56 rounded-2xl bg-white/5" />
    </div>
  );
}

function formatUpdatedAt(value?: string) {
  if (!value) return 'Update time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Update time unavailable';
  return `Updated ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}
