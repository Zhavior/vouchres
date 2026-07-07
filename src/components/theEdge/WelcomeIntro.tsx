import { motion } from '../../lib/motion';
import { ArrowRight, Check, Lock, Radio, ShieldCheck, Sparkles, TrendingUp, Layers3 } from 'lucide-react';
import { GradingDemo } from './GradingDemo';

const ease = [0.22, 1, 0.36, 1] as const;

interface SlateGame {
  away: string;
  home: string;
  time: string;
  live: boolean;
}

interface Stats {
  gamesToday: number;
  liveNow: number;
  saved: number;
}

const TRUST_POINTS = [
  'Official MLB data only',
  'No fake confirmed lineups',
  'Every saved pick stays visible',
  'Research & entertainment only',
];

const WORKSPACE_MODULES = [
  { title: 'Daily Board', body: 'Official slate context, with lineup status shown honestly before lock.', section: 'daily_players', icon: Radio },
  { title: 'Build', body: 'Save parlays and keep the reasoning attached to the slip.', section: 'build', icon: Layers3 },
  { title: 'Ledger', body: 'Track pending, won, and lost results without hiding misses.', section: 'results', icon: ShieldCheck },
  { title: 'Pro Labs', body: 'Move into deeper player, matchup, and graph research when data exists.', section: 'player_edge_lab', icon: TrendingUp },
] as const;

const GRADING_STEPS = [
  { icon: Lock, step: '1', title: 'Pick locks', body: 'Your pick is timestamped and frozen the moment the game starts. No edits after lock.' },
  { icon: Radio, step: '2', title: 'Game plays out', body: 'We track the live box score from the official MLB feed while the game is in progress.' },
  { icon: ShieldCheck, step: '3', title: 'Graded automatically', body: 'Final score decides won or lost. Published to your public ledger either way, same day.' },
] as const;

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.5, ease, delay },
  };
}

export default function WelcomeIntro({
  slate,
  stats,
  onStartTrial,
  onOpenDailyBoard,
  onLogin,
  onOpenModule,
}: {
  slate: SlateGame[];
  stats: Stats;
  onStartTrial: () => void;
  onOpenDailyBoard: () => void;
  onLogin: () => void;
  onOpenModule: (section: string) => void;
}) {
  return (
    <div className="mx-auto max-w-6xl font-z8">
      {/* ── HERO ── */}
      <section className="grid gap-10 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <div>
          <div className="glass-panel glass-border inline-flex items-center gap-2 rounded-full px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-vouch-emerald" />
            <span className="terminal-text">No hype. Just research.</span>
          </div>

          <h1 className="mt-7 text-[2.75rem] font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
            Every MLB pick,{' '}
            <span className="bg-gradient-to-r from-vouch-cyan to-vouch-emerald bg-clip-text text-transparent">
              graded and published.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-white/60">
            VouchEdge grades every MLB pick to the final box score and publishes the result — wins and losses
            both. Research the slate, build your slip, see the record.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <button
              onClick={onStartTrial}
              className="rounded-xl bg-vouch-emerald px-7 py-3.5 text-sm font-bold text-black transition hover:-translate-y-0.5"
            >
              <span className="inline-flex items-center gap-2">Start researching <ArrowRight className="h-4 w-4" /></span>
            </button>
            <button onClick={onOpenDailyBoard} className="terminal-text transition hover:text-vouch-cyan">
              Open Daily Board
            </button>
            <button onClick={onLogin} className="terminal-text transition hover:text-vouch-cyan">
              Login
            </button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {TRUST_POINTS.map((point) => (
              <div key={point} className="flex items-center gap-2.5 text-sm text-white/50">
                <Check className="h-4 w-4 shrink-0 text-vouch-emerald" />
                {point}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          className="glass-panel glass-border rounded-2xl p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="terminal-text">Today</div>
              <div className="mt-1 text-lg font-bold text-white">MLB slate monitor</div>
            </div>
            <span className="glass-panel glass-border rounded-full px-3 py-1 text-[10px] font-bold text-vouch-emerald">
              {slate.length ? `${slate.length} games` : 'Loading'}
            </span>
          </div>

          <div className="max-h-[300px] divide-y divide-white/5 overflow-y-auto rounded-xl border border-white/5 bg-black/25">
            {slate.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-white/40">Loading today's official slate...</div>
            ) : (
              slate.map((g, i) => (
                <div key={`${g.away}-${g.home}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2 font-mono text-sm font-bold text-white/90">
                    <span className="w-10 truncate">{g.away}</span>
                    <span className="text-white/30">@</span>
                    <span className="w-10 truncate">{g.home}</span>
                  </div>
                  {g.live ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-rose-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> Live
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-white/30">{g.time || 'TBD'}</span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Games today', value: stats.gamesToday || '—' },
              { label: 'Live now', value: stats.liveNow },
              { label: 'Saved slips', value: stats.saved },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3">
                <div className="text-xl font-black text-white">{s.value}</div>
                <div className="mt-0.5 terminal-text">{s.label}</div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-white/30">
            Official lineups are treated as confirmed only when the source says they are. Preview rows stay
            clearly marked until then.
          </p>
        </motion.div>
      </section>

      {/* ── THE PROBLEM ── */}
      <motion.section {...fadeUp()} className="glass-panel glass-border mt-24 rounded-2xl p-8 text-center sm:p-12">
        <div className="mx-auto max-w-xl">
          <div className="terminal-text text-rose-300">Why we grade everything</div>
          <p className="mt-4 text-2xl font-bold leading-9 text-white">
            Most pick trackers only show the wins. Ours publishes every graded result, losses included.
          </p>
          <p className="mt-4 text-sm leading-7 text-white/40">
            Every pick is timestamped before lock and checked against the official box score — no hand-picked
            highlights, just the research and the record.
          </p>
        </div>
      </motion.section>

      {/* ── HOW GRADING WORKS ── */}
      <motion.section {...fadeUp(0.05)} className="mt-6">
        <div className="mb-6 max-w-lg">
          <div className="terminal-text text-vouch-cyan">How grading works</div>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Three steps. No human can edit step three.</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {GRADING_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="glass-panel glass-border rounded-2xl p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-vouch-cyan/10 text-vouch-cyan">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="terminal-text">Step {item.step}</span>
                </div>
                <h3 className="mt-3 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/40">{item.body}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <GradingDemo />
        </div>
      </motion.section>

      {/* ── PROOF LEDGER ── */}
      <motion.section {...fadeUp(0.1)} className="glass-panel glass-border mt-6 rounded-2xl p-8 sm:p-10">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="terminal-text text-vouch-emerald">Example ledger</div>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Wins and losses both stay visible.</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5">
          <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-black/20 px-5 py-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">Aaron Judge — Over 0.5 HR</div>
              <div className="mt-0.5 font-mono text-[11px] text-white/30">+150 · locked before first pitch · graded final</div>
            </div>
            <span className="shrink-0 rounded-full bg-vouch-emerald/10 px-3 py-1 text-[10px] font-bold uppercase text-vouch-emerald">Won</span>
          </div>
          <div className="flex items-center justify-between gap-3 bg-black/10 px-5 py-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">Corbin Burnes — Under 5.5 K</div>
              <div className="mt-0.5 font-mono text-[11px] text-white/30">-110 · locked before first pitch · graded final</div>
            </div>
            <span className="shrink-0 rounded-full bg-rose-400/10 px-3 py-1 text-[10px] font-bold uppercase text-rose-300">Lost</span>
          </div>
        </div>
      </motion.section>

      {/* ── WORKSPACE MODULES ── */}
      <motion.section {...fadeUp(0.15)} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WORKSPACE_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.title}
              type="button"
              onClick={() => onOpenModule(module.section)}
              className="glass-panel glass-border group rounded-2xl p-5 text-left transition hover:-translate-y-0.5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-vouch-emerald/10 text-vouch-emerald">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/40">{module.body}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-vouch-cyan opacity-60 transition group-hover:opacity-100">
                <span className="terminal-text">Open</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          );
        })}
      </motion.section>

      {/* ── CLOSING CTA ── */}
      <motion.section {...fadeUp(0.2)} className="glass-panel glass-border mt-6 mb-16 rounded-2xl p-10 text-center sm:p-14">
        <Sparkles className="mx-auto h-6 w-6 text-vouch-emerald" />
        <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">Start researching the slate.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/40">Free to start. No card required.</p>
        <button
          onClick={onStartTrial}
          className="mt-7 rounded-xl bg-vouch-emerald px-8 py-3.5 text-sm font-bold text-black transition hover:-translate-y-0.5"
        >
          <span className="inline-flex items-center gap-2">Start researching <ArrowRight className="h-4 w-4" /></span>
        </button>
        <p className="mx-auto mt-6 max-w-md text-[10px] leading-5 text-white/25">
          You must be of legal age in your jurisdiction and located somewhere this is legal. Probability-based
          research for entertainment — not betting advice.
        </p>
      </motion.section>
    </div>
  );
}
