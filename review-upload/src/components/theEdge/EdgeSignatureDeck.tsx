import {
  Activity,
  Bell,
  Brain,
  CheckCircle2,
  Crown,
  FileCheck2,
  Flame,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

type EdgeSignatureDeckProps = {
  mode: 'public' | 'dashboard';
  onGo: (section: string) => void;
};

const proofCards = [
  {
    title: 'Proof Before Hype',
    body: 'Every pick should lead to a result, a record, and a trust trail.',
    icon: FileCheck2,
  },
  {
    title: 'Research Before Slip',
    body: 'Daily Players, HR logic, pitcher risk, and player context in one place.',
    icon: Brain,
  },
  {
    title: 'Community With Receipts',
    body: 'Follow people because of their proof, not because of loud claims.',
    icon: Users,
  },
];

const islandActions = [
  ['Open Upcoming Games', 'upcoming_games', Flame],
  ['Check Alerts', 'notifications', Bell],
  ['View Results', 'results', Activity],
];

export default function EdgeSignatureDeck({ mode, onGo }: EdgeSignatureDeckProps) {
  const isDashboard = mode === 'dashboard';

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border ve-theme-border bg-black/30 p-5 shadow-2xl shadow-black/30">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(circle at 12% 0%, var(--ve-welcome-hero-1), transparent 34%), radial-gradient(circle at 86% 12%, var(--ve-welcome-hero-2), transparent 34%)',
        }}
      />

      <div className="relative z-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border ve-theme-border bg-slate-950/65 p-5 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
            <Sparkles className="h-3.5 w-3.5" />
            {isDashboard ? 'The Island' : 'The Edge Difference'}
          </div>

          <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
            {isDashboard ? (
              <>
                Welcome back to your <span className="ve-theme-gradient-text">Island.</span>
              </>
            ) : (
              <>
                A betting research app that feels like a{' '}
                <span className="ve-theme-gradient-text">command world.</span>
              </>
            )}
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            {isDashboard
              ? 'This is the first place members land: next actions, alerts, saved work, results, and the doorway into the full VouchEdge site.'
              : 'Most apps throw users into charts. The Edge sells the product first, explains the value, then transforms into the member dashboard when the user is ready.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onGo(isDashboard ? 'feed' : 'signup')}
              className="ve-theme-gradient ve-theme-glow rounded-2xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5"
            >
              {isDashboard ? 'Enter VouchEdge Site' : 'Create Free Account'}
            </button>

            <button
              onClick={() => onGo('daily_players')}
              className="rounded-2xl border ve-theme-border ve-theme-soft-bg px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              Preview Upcoming Games
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {(isDashboard ? islandActions : proofCards).map((item) => {
            if (isDashboard) {
              const [title, section, Icon] = item as [string, string, typeof Flame];

              return (
                <button
                  key={title}
                  onClick={() => onGo(section)}
                  className="group rounded-[2rem] border border-slate-800 bg-slate-950/70 p-4 text-left backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{title}</div>
                      <div className="mt-1 text-xs text-slate-500">Continue your Edge.</div>
                    </div>
                  </div>
                </button>
              );
            }

            const card = item as (typeof proofCards)[number];
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-4 backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{card.title}</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{card.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ['Verified mindset', ShieldCheck],
          ['Premium member path', Crown],
          ['Clear next action', CheckCircle2],
        ].map(([label, Icon]) => (
          <div key={label as string} className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-300">
              <Icon className="h-4 w-4 ve-theme-accent-text" />
              {label as string}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
