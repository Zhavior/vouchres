import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Brush,
  ClipboardList,
  Flame,
  LineChart,
  MessageSquare,
  Radar,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trophy,
  UserCircle,
  Users,
} from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import type { DailyMlbReport } from '../types/mlb';
import type { Parlay } from '../types';
import { useMode } from '../lib/useMode';

interface Props {
  onSectionChange: (section: string) => void;
  savedSlips?: Parlay[];
}

type DashboardCard = {
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  title: string;
  eyebrow: string;
  description: string;
  accent: 'cyan' | 'gold' | 'indigo';
  meta?: string;
};

const TODAY_TOOLS: DashboardCard[] = [
  {
    icon: Users,
    section: 'daily_players',
    title: 'Daily Players',
    eyebrow: 'Lineups',
    description: 'Scan every MLB matchup, projected starters, and hitter availability.',
    accent: 'cyan',
  },
  {
    icon: Flame,
    section: 'hr_board',
    title: 'Daily HR Board',
    eyebrow: 'Power',
    description: 'Ranked home run research with pitcher, park, form, and data status.',
    accent: 'gold',
  },
  {
    icon: ShieldCheck,
    section: 'board',
    title: 'VouchBoard',
    eyebrow: 'Proof',
    description: 'Review saved vouches, proof cards, and posted research receipts.',
    accent: 'indigo',
  },
  {
    icon: Sliders,
    section: 'build',
    title: 'Parlay Hub',
    eyebrow: 'Builder',
    description: 'Build slips from research legs and track them into the ledger.',
    accent: 'cyan',
  },
];

const INTELLIGENCE_TOOLS: DashboardCard[] = [
  {
    icon: Bot,
    section: 'ai_engine',
    title: 'AI Research',
    eyebrow: 'Engine',
    description: 'Generate research-backed parlays and compare model rationale.',
    accent: 'indigo',
  },
  {
    icon: Search,
    section: 'research',
    title: 'Player Research',
    eyebrow: 'Profiles',
    description: 'Deep dive on players, props, splits, and add legs from one screen.',
    accent: 'cyan',
  },
  {
    icon: Radar,
    section: 'team_matchup_lab',
    title: 'Matchup Lab',
    eyebrow: 'Pitchers',
    description: 'Professional pitcher and team matchup research for today’s slate.',
    accent: 'gold',
  },
];

const PROOF_TOOLS: DashboardCard[] = [
  {
    icon: MessageSquare,
    section: 'feed',
    title: 'Home Feed',
    eyebrow: 'Social',
    description: 'Post research, follow vouches, and keep the public proof loop moving.',
    accent: 'cyan',
  },
  {
    icon: Trophy,
    section: 'results',
    title: 'Results Ledger',
    eyebrow: 'Grading',
    description: 'Track pending, won, lost, push, and void outcomes without hiding misses.',
    accent: 'gold',
  },
  {
    icon: Bell,
    section: 'notifications',
    title: 'Notifications',
    eyebrow: 'Alerts',
    description: 'Review home run alerts, parlay updates, and unread activity.',
    accent: 'indigo',
  },
];

const ACCOUNT_TOOLS: DashboardCard[] = [
  {
    icon: Brush,
    section: 'themestore',
    title: 'Theme Store',
    eyebrow: 'Customize',
    description: 'Open cosmetic customization and theme options for your account.',
    accent: 'indigo',
  },
  {
    icon: UserCircle,
    section: 'profile',
    title: 'Profile',
    eyebrow: 'Account',
    description: 'Manage your capper identity, history, and visible profile details.',
    accent: 'cyan',
  },
];

export default function TodayDashboard({ onSectionChange, savedSlips = [] }: Props) {
  const [mode, , toggleMode] = useMode();
  const [report, setReport] = useState<DailyMlbReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vouchedgeApi
      .dailyReport()
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, []);

  const pendingSlips = useMemo(
    () => savedSlips.filter((slip) => String(slip.status || 'PENDING').toUpperCase() === 'PENDING').length,
    [savedSlips],
  );

  const topHr = report?.hrTargets?.[0];
  const topEnvironment = report?.runEnvironments?.[0];
  const vulnerablePitcher = report?.vulnerablePitchers?.[0];
  const reportStatus = loading ? 'Syncing' : report ? report.dataQuality || 'Projected' : 'Limited';

  return (
    <main className="ve-page-shell px-3 py-4 sm:px-4 lg:py-5">
      <div className="mx-auto max-w-[1320px] space-y-4">
        <section className="ve-premium-panel relative overflow-hidden rounded-3xl p-4 sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--ve-accent-cyan)/0.65),hsl(var(--ve-accent-gold)/0.38),transparent)]" />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-stretch">
            <div className="flex flex-col justify-between gap-5">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ve-accent-cyan)/0.34)] bg-[hsl(var(--ve-accent-cyan)/0.10)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-accent-cyan))]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Today’s Research Command Center
                  </span>
                  <span className="rounded-full border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface-raised)/0.42)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">
                    {reportStatus}
                  </span>
                </div>

                <h1 className="max-w-4xl text-3xl font-black tracking-tight text-[hsl(var(--ve-text-primary))] sm:text-4xl lg:text-5xl">
                  VouchEdge Research Command Center
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[hsl(var(--ve-text-secondary))] sm:text-base">
                  Start with the live MLB board, move into player and matchup research, then publish or track every vouch from one professional workspace.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CommandButton label="Open Daily Players" section="daily_players" onSectionChange={onSectionChange} primary />
                <CommandButton label="Review HR Board" section="daily_hr_watch_new" onSectionChange={onSectionChange} />
                <CommandButton label="Build Parlay" section="build" onSectionChange={onSectionChange} />
              </div>
            </div>

            <div className="ve-surface-card rounded-2xl p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">Live Brief</p>
                  <h2 className="mt-0.5 text-sm font-black text-[hsl(var(--ve-text-primary))]">MLB slate signals</h2>
                </div>
                <ModeToggle mode={mode} toggleMode={toggleMode} />
              </div>

              <div className="grid gap-2">
                <SignalRow
                  icon={Flame}
                  label="Top HR Target"
                  value={topHr ? `${topHr.team} vs ${topHr.opposingPitcher}` : 'No HR target loaded'}
                  detail={topHr ? `HR score ${topHr.hrScore}` : 'Open the board when live data is available.'}
                  accent="gold"
                  loading={loading}
                  onClick={() => onSectionChange('daily_hr_watch_new')}
                />
                <SignalRow
                  icon={LineChart}
                  label="Best Environment"
                  value={topEnvironment ? topEnvironment.matchup : 'No run environment loaded'}
                  detail={topEnvironment ? `Run environment ${topEnvironment.runEnvironmentScore}/100` : 'Check live games for current slate context.'}
                  accent="cyan"
                  loading={loading}
                  onClick={() => onSectionChange('live_games')}
                />
                <SignalRow
                  icon={BarChart3}
                  label="Vulnerable Pitcher"
                  value={vulnerablePitcher ? vulnerablePitcher.pitcherName : 'No probable pitcher loaded'}
                  detail={vulnerablePitcher ? `${vulnerablePitcher.team} · vulnerability ${vulnerablePitcher.vulnerabilityScore}/100` : 'Probables may post closer to first pitch.'}
                  accent="indigo"
                  loading={loading}
                  onClick={() => onSectionChange('team_matchup_lab')}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <MetricTile label="Saved Parlays" value={savedSlips.length} detail={`${pendingSlips} pending`} />
          <MetricTile label="Research Mode" value={mode === 'beginner' ? 'Beginner' : 'Advanced'} detail="Toggle in command header" />
          <MetricTile label="Daily Report" value={loading ? 'Syncing' : report ? 'Ready' : 'Limited'} detail="MLB data powered" />
        </section>

        <DashboardSection
          title="Today’s MLB Tools"
          subtitle="Start here for the core research flow."
          cards={TODAY_TOOLS.map((card) =>
            card.section === 'build'
              ? { ...card, meta: savedSlips.length ? `${savedSlips.length} saved slips` : 'No saved slips yet' }
              : card,
          )}
          onSectionChange={onSectionChange}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.45fr)]">
          <div className="space-y-4">
            <DashboardSection
              title="Intelligence And AI"
              subtitle="Move from board-level signals into deeper player and matchup analysis."
              cards={INTELLIGENCE_TOOLS}
              onSectionChange={onSectionChange}
              columns="md:grid-cols-3"
            />

            <DashboardSection
              title="Social Proof And Results"
              subtitle="Publish research, save receipts, and check graded outcomes."
              cards={PROOF_TOOLS}
              onSectionChange={onSectionChange}
              columns="md:grid-cols-3"
            />
          </div>

          <aside className="ve-premium-panel rounded-3xl p-4">
            <div className="mb-3">
              <p className="ve-section-kicker">Account Status</p>
              <h2 className="mt-1 text-lg font-black">Workspace Controls</h2>
              <p className="mt-1 text-xs leading-5 text-[hsl(var(--ve-text-muted))]">
                Personalize the research surface, check alerts, and manage profile details.
              </p>
            </div>

            <div className="grid gap-2">
              {ACCOUNT_TOOLS.map((card) => (
                <MiniLinkCard key={card.section} card={card} onSectionChange={onSectionChange} />
              ))}
              <MiniLinkCard
                card={{
                  icon: Bell,
                  section: 'notifications',
                  title: 'Alerts Inbox',
                  eyebrow: 'Unread',
                  description: 'Open notification center.',
                  accent: 'gold',
                }}
                onSectionChange={onSectionChange}
              />
            </div>
          </aside>
        </div>

        <p className="pb-2 text-center text-[10px] font-medium text-[hsl(var(--ve-text-muted))]">
          Probability-based sports research. No guaranteed outcomes.
        </p>
      </div>
    </main>
  );
}

function accentClasses(accent: DashboardCard['accent']) {
  if (accent === 'gold') {
    return {
      text: 'text-[hsl(var(--ve-accent-gold))]',
      bg: 'bg-[hsl(var(--ve-accent-gold)/0.10)]',
      border: 'border-[hsl(var(--ve-accent-gold)/0.30)]',
      hover: 'hover:border-[hsl(var(--ve-accent-gold)/0.44)]',
    };
  }

  if (accent === 'indigo') {
    return {
      text: 'text-[hsl(var(--ve-accent-pink))]',
      bg: 'bg-[hsl(var(--ve-accent-pink)/0.10)]',
      border: 'border-[hsl(var(--ve-accent-pink)/0.30)]',
      hover: 'hover:border-[hsl(var(--ve-accent-pink)/0.44)]',
    };
  }

  return {
    text: 'text-[hsl(var(--ve-accent-cyan))]',
    bg: 'bg-[hsl(var(--ve-accent-cyan)/0.10)]',
    border: 'border-[hsl(var(--ve-accent-cyan)/0.30)]',
    hover: 'hover:border-[hsl(var(--ve-accent-cyan)/0.44)]',
  };
}

function CommandButton({
  label,
  section,
  primary,
  onSectionChange,
}: {
  label: string;
  section: string;
  primary?: boolean;
  onSectionChange: (section: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSectionChange(section)}
      className={
        primary
          ? 'inline-flex items-center justify-center gap-2 rounded-xl border border-[hsl(var(--ve-accent-cyan)/0.42)] bg-[hsl(var(--ve-accent-cyan))] px-4 py-2.5 text-sm font-black text-[hsl(var(--ve-bg))] shadow-lg shadow-[hsl(var(--ve-accent-cyan)/0.18)] transition hover:brightness-110'
          : 'inline-flex items-center justify-center gap-2 rounded-xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-surface-raised)/0.42)] px-4 py-2.5 text-sm font-black text-[hsl(var(--ve-text-secondary))] transition hover:border-[hsl(var(--ve-accent-cyan)/0.40)] hover:text-[hsl(var(--ve-text-primary))]'
      }
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function ModeToggle({ mode, toggleMode }: { mode: string; toggleMode: () => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-bg-deep)/0.36)] p-1 text-[10px] font-black">
      {(['beginner', 'advanced'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => item !== mode && toggleMode()}
          className={`rounded-lg px-2.5 py-1 capitalize transition ${
            mode === item
              ? 'bg-[hsl(var(--ve-accent-cyan)/0.16)] text-[hsl(var(--ve-accent-cyan))]'
              : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-secondary))]'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SignalRow({
  icon: Icon,
  label,
  value,
  detail,
  accent,
  loading,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  accent: DashboardCard['accent'];
  loading: boolean;
  onClick: () => void;
}) {
  const tone = accentClasses(accent);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface)/0.52)] p-3 text-left transition ${tone.hover}`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone.border} ${tone.bg}`}>
        <Icon className={`h-4 w-4 ${tone.text}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[hsl(var(--ve-text-muted))]">{label}</span>
        <span className={`mt-0.5 block truncate text-sm font-black ${loading ? 'animate-pulse text-[hsl(var(--ve-text-muted))]' : 'text-[hsl(var(--ve-text-primary))]'}`}>
          {loading ? 'Loading live signal' : value}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[hsl(var(--ve-text-muted))]">{detail}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-[hsl(var(--ve-text-muted))] transition group-hover:translate-x-0.5 group-hover:text-[hsl(var(--ve-text-secondary))]" />
    </button>
  );
}

function MetricTile({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="ve-stat-card rounded-2xl px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(var(--ve-text-muted))]">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <strong className="text-2xl font-black text-[hsl(var(--ve-text-primary))]">{value}</strong>
        <span className="text-xs font-semibold text-[hsl(var(--ve-text-muted))]">{detail}</span>
      </div>
    </div>
  );
}

function DashboardSection({
  title,
  subtitle,
  cards,
  onSectionChange,
  columns = 'sm:grid-cols-2 xl:grid-cols-4',
}: {
  title: string;
  subtitle: string;
  cards: DashboardCard[];
  onSectionChange: (section: string) => void;
  columns?: string;
}) {
  return (
    <section className="ve-premium-panel rounded-3xl p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[hsl(var(--ve-text-primary))]">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-[hsl(var(--ve-text-muted))]">{subtitle}</p>
        </div>
      </div>
      <div className={`grid gap-3 ${columns}`}>
        {cards.map((card) => (
          <FeatureCard key={card.section} card={card} onSectionChange={onSectionChange} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  card,
  onSectionChange,
}: {
  card: DashboardCard;
  onSectionChange: (section: string) => void;
}) {
  const Icon = card.icon;
  const tone = accentClasses(card.accent);

  return (
    <button
      type="button"
      onClick={() => onSectionChange(card.section)}
      className={`ve-tool-card group flex min-h-[154px] flex-col justify-between rounded-2xl p-3.5 text-left ${tone.hover}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tone.border} ${tone.bg}`}>
          <Icon className={`h-5 w-5 ${tone.text}`} />
        </span>
        <span className={`rounded-full border ${tone.border} ${tone.bg} px-2 py-1 text-[9px] font-black uppercase tracking-wide ${tone.text}`}>
          {card.eyebrow}
        </span>
      </span>

      <span>
        <span className="mt-4 flex items-center justify-between gap-2 text-base font-black text-[hsl(var(--ve-text-primary))]">
          {card.title}
          <ArrowRight className="h-4 w-4 text-[hsl(var(--ve-text-muted))] transition group-hover:translate-x-0.5 group-hover:text-[hsl(var(--ve-text-secondary))]" />
        </span>
        <span className="mt-1 block text-xs leading-5 text-[hsl(var(--ve-text-muted))]">{card.description}</span>
        {card.meta && <span className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--ve-text-secondary))]">{card.meta}</span>}
      </span>
    </button>
  );
}

function MiniLinkCard({
  card,
  onSectionChange,
}: {
  card: DashboardCard;
  onSectionChange: (section: string) => void;
}) {
  const Icon = card.icon;
  const tone = accentClasses(card.accent);

  return (
    <button
      type="button"
      onClick={() => onSectionChange(card.section)}
      className={`ve-tool-card group grid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-3 text-left ${tone.hover}`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tone.border} ${tone.bg}`}>
        <Icon className={`h-4 w-4 ${tone.text}`} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-[hsl(var(--ve-text-primary))]">{card.title}</span>
        <span className="block truncate text-[11px] text-[hsl(var(--ve-text-muted))]">{card.description}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-[hsl(var(--ve-text-muted))] transition group-hover:translate-x-0.5 group-hover:text-[hsl(var(--ve-text-secondary))]" />
    </button>
  );
}
