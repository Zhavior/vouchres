import {
  Bell,
  Check,
  Crown,
  Layers3,
  Lock,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

type EdgeValueDeckProps = {
  onGo: (section: string) => void;
};

const memberBenefits = [
  {
    title: 'Free Member',
    subtitle: 'Start tracking your edge.',
    benefits: [
      ['The Edge dashboard', true],
      ['Daily board preview', true],
      ['Limited saved picks', true],
      ['Basic results tracking', true],
      ['Pro research graphs', false],
    ],
  },
  {
    title: 'Edge Member',
    subtitle: 'For active slip builders.',
    benefits: [
      ['Full Daily Players', true],
      ['Parlay builder', true],
      ['Pick ledger', true],
      ['Notifications', true],
      ['More saved picks', true],
    ],
    highlighted: true,
  },
  {
    title: 'Pro Member',
    subtitle: 'For research-heavy users.',
    benefits: [
      ['Player Research Pro', true],
      ['HR trend graphs', true],
      ['Pitcher vulnerability', true],
      ['AI Seat Pro tools', true],
      ['Premium alerts', true],
    ],
  },
];

const featureZones = [
  {
    title: 'Vouch',
    eyebrow: 'Proof',
    body: 'Save picks, grade results, and build a public trust profile.',
    icon: ShieldCheck,
    section: 'results',
  },
  {
    title: 'Social',
    eyebrow: 'Community',
    body: 'Follow cappers, compare proof, and build your reputation.',
    icon: Users,
    section: 'feed',
  },
  {
    title: 'Research',
    eyebrow: 'Analysis',
    body: 'Daily players, HR board, matchup history, and AI support.',
    icon: Layers3,
    section: 'daily_players',
  },
];

export function EdgePublicSalesDeck({ onGo }: EdgeValueDeckProps) {
  return (
    <div className="space-y-5 p-5 pt-0">
      <section className="rounded-[2rem] border ve-theme-border bg-black/25 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
              Why members join
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
              Turn picks into proof, research, and alerts.
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              The Edge is not just a homepage. It is the product lobby: users see value first, then choose where to enter.
            </p>
          </div>

          <button
            onClick={() => onGo('feed')}
            className="ve-theme-gradient ve-theme-glow rounded-2xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5"
          >
            Enter Full Site
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {featureZones.map((zone) => {
            const Icon = zone.icon;

            return (
              <button
                key={zone.title}
                onClick={() => onGo(zone.section)}
                className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)]"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] ve-theme-accent-text">
                  {zone.eyebrow}
                </div>
                <div className="mt-1 text-lg font-black text-white">{zone.title}</div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{zone.body}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {memberBenefits.map((tier) => (
          <div
            key={tier.title}
            className={`rounded-[2rem] border p-5 ${
              tier.highlighted
                ? 'border-[var(--ve-current-border)] bg-[var(--ve-current-soft)]'
                : 'border-slate-800 bg-slate-900/60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-white">{tier.title}</div>
                <p className="mt-1 text-xs text-slate-500">{tier.subtitle}</p>
              </div>
              {tier.highlighted ? (
                <Crown className="h-5 w-5 text-amber-200" />
              ) : (
                <Sparkles className="h-5 w-5 ve-theme-accent-text" />
              )}
            </div>

            <div className="mt-4 grid gap-2">
              {tier.benefits.map(([label, included]) => (
                <div key={String(label)} className="flex items-center gap-2 text-xs font-bold">
                  {included ? (
                    <Check className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <Lock className="h-4 w-4 text-slate-700" />
                  )}
                  <span className={included ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function EdgeDashboardMemberDeck({ onGo }: EdgeValueDeckProps) {
  const actions = [
    ['Open Daily Players', 'daily_players', Zap],
    ['Review Notifications', 'notifications', Bell],
    ['Check Results', 'results', Trophy],
    ['Parlay OS', 'live_parlays', Layers3],
  ] as const;

  return (
    <div className="mt-5 rounded-[2rem] border ve-theme-border bg-black/25 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
        Continue your Edge
      </div>
      <h3 className="mt-1 text-xl font-black text-white">What should you do next?</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Members should not feel trapped in The Edge. They should see a clear next action and enter the right part of the site.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(([label, section, Icon]) => (
          <button
            key={label}
            onClick={() => onGo(section)}
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)]"
          >
            <Icon className="mb-2 h-4 w-4 ve-theme-accent-text" />
            <div className="text-sm font-black text-white">{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
