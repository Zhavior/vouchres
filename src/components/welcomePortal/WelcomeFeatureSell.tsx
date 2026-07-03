import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from '../../lib/motion';
import {
  Check, ArrowRight, Flame, Layers3, Swords, Bot, LineChart,
  ChevronLeft, ChevronRight, ShieldCheck, Sparkles,
  Lock, Trophy,
} from 'lucide-react';

/**
 * Welcome portal sell section — auto-advancing feature slideshow + packages.
 * Fully self-contained and portal-scoped: Tailwind utilities + framer-motion
 * only, no global theme CSS touched. Respects prefers-reduced-motion.
 */

type PlanId = 'free' | 'pro_trial' | 'pro_elite';
type Accent = 'cyan' | 'emerald' | 'violet';

interface Plan {
  name: string;
  price: string;
  sub: string;
  perks: string[];
  accent: Accent;
  badge?: string;
  paid: boolean;
}

interface Props {
  plans: Record<PlanId, Plan>;
  onSelectPlan: (plan: PlanId) => void;
  onExplore?: () => void;
}

const ACCENT: Record<Accent, { text: string; ring: string; soft: string; grad: string; dot: string; glow: string }> = {
  cyan: { text: 'text-cyan-300', ring: 'border-cyan-300/35', soft: 'bg-cyan-300/10', grad: 'from-cyan-400 to-sky-500', dot: 'bg-cyan-400', glow: 'shadow-cyan-500/20' },
  emerald: { text: 'text-emerald-300', ring: 'border-emerald-300/40', soft: 'bg-emerald-300/10', grad: 'from-emerald-400 to-teal-500', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/25' },
  violet: { text: 'text-violet-300', ring: 'border-violet-300/35', soft: 'bg-violet-300/10', grad: 'from-violet-400 to-fuchsia-500', dot: 'bg-violet-400', glow: 'shadow-violet-500/20' },
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------- Feature mini-visuals (pure CSS/SVG, no assets) ----------

function VisualHrBoard() {
  const rows = [
    { p: 'Judge', g: 'A+', w: '92%' },
    { p: 'Ohtani', g: 'A', w: '84%' },
    { p: 'Schwarber', g: 'A', w: '79%' },
    { p: 'Soto', g: 'B', w: '63%' },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.p} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="w-5 text-center font-mono text-[10px] text-slate-500">{i + 1}</span>
          <span className="w-8 rounded-md bg-orange-400/15 text-center text-[10px] font-black text-orange-300">{r.g}</span>
          <span className="flex-1 truncate text-xs font-bold text-slate-200">{r.p}</span>
          <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-700/60 sm:block">
            <span className="block h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500" style={{ width: r.w }} />
          </span>
          <span className="w-9 text-right font-mono text-[10px] text-orange-300">{r.w}</span>
        </div>
      ))}
    </div>
  );
}

function VisualParlay() {
  const legs = [
    { s: 'Schwarber Anytime HR', o: '+450' },
    { s: 'Ohtani 1+ TB', o: '-180' },
    { s: 'Skenes 6+ K', o: '+120' },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
        <span>3-Leg Parlay</span><span className="text-emerald-300">+1180</span>
      </div>
      <div className="divide-y divide-white/10">
        {legs.map((l) => (
          <div key={l.s} className="flex items-center gap-2 py-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/15"><Check className="h-2.5 w-2.5 text-emerald-300" /></span>
            <span className="flex-1 truncate text-xs text-slate-200">{l.s}</span>
            <span className="font-mono text-[11px] text-cyan-300">{l.o}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2 text-[11px]">
        <span className="text-slate-400">1u → potential</span><span className="font-mono font-black text-emerald-300">12.8u</span>
      </div>
    </div>
  );
}

function VisualMatchup() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full border border-violet-300/30 bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20" />
        <div className="min-w-0">
          <div className="text-xs font-black text-white">Probable SP · LHP</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">vs Opponent lineup</div>
        </div>
        <span className="ml-auto rounded-md bg-violet-400/15 px-2 py-0.5 text-[10px] font-black text-violet-200">Score 78</span>
      </div>
      {['R · 2B', 'L · CF', 'S · 1B'].map((b, i) => (
        <div key={b} className="flex items-center gap-2 border-t border-white/10 py-1.5">
          <span className="h-5 w-5 rounded-full bg-slate-700/60" />
          <span className="flex-1 text-[11px] text-slate-200">Batter {i + 1}</span>
          <span className="font-mono text-[10px] text-slate-400">{b}</span>
          <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-300">Edge</span>
        </div>
      ))}
    </div>
  );
}

function VisualAi() {
  return (
    <div className="space-y-2">
      <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-50">
        Best HR spots tonight?
      </div>
      <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200">
        3 A-grade bats vs vulnerable RHP — Judge, Schwarber, Soto. Park + form back all three.
        <span className="mt-1 block text-[10px] text-slate-500">Derived from live MLB data · research only</span>
      </div>
    </div>
  );
}

function VisualResults() {
  const bars = [60, 35, 80, 50, 95, 70, 88];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tracked record</span>
        <span className="font-mono text-xs font-black text-emerald-300">W 41 · L 22</span>
      </div>
      <div className="flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-300" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
        <ShieldCheck className="h-3 w-3 text-emerald-300" /> Every result graded from final box scores
      </div>
    </div>
  );
}

interface Slide {
  id: string;
  accent: Accent;
  icon: typeof Flame;
  eyebrow: string;
  title: string;
  bullets: string[];
  Visual: () => JSX.Element;
}

const SLIDES: Slide[] = [
  { id: 'hr', accent: 'cyan', icon: Flame, eyebrow: 'Daily Home Run Board', title: 'See the best HR spots, ranked', bullets: ['A–F grades from live MLB data', 'Pitcher vulnerability + park factors', 'Premium player headshots & form'], Visual: VisualHrBoard },
  { id: 'parlay', accent: 'emerald', icon: Layers3, eyebrow: 'Parlay Studio', title: 'Build, save & track every parlay', bullets: ['Multi-leg builder with real odds', 'Saved to your account, synced everywhere', 'Auto-graded — never guessed'], Visual: VisualParlay },
  { id: 'matchup', accent: 'violet', icon: Swords, eyebrow: 'Pitcher Matchup Lab', title: 'Pitcher vs the whole lineup', bullets: ['Batter-vs-pitcher history & splits', 'Handedness + platoon edges', 'Lineup headshots and tags'], Visual: VisualMatchup },
  { id: 'ai', accent: 'cyan', icon: Bot, eyebrow: 'AI Research Engine', title: 'Ask. Get a grounded read.', bullets: ['Smart picks from live data', 'Plain-English matchup breakdowns', 'Context, not promises'], Visual: VisualAi },
  { id: 'results', accent: 'emerald', icon: LineChart, eyebrow: 'Proof, not promises', title: 'Results you can actually verify', bullets: ['Win/loss ledger & trust score', 'Graded from final box scores', 'Build a track record that sticks'], Visual: VisualResults },
];

const ROTATE_MS = 4800;

// Trust pillars — every claim is TRUE & verifiable about the product
// (no fabricated metrics, no invented testimonials).
const TRUST_PILLARS: { icon: typeof ShieldCheck; accent: Accent; title: string; body: string }[] = [
  { icon: ShieldCheck, accent: 'cyan', title: 'Official MLB data', body: 'Grades, stats, and box scores come straight from the official MLB Stats API.' },
  { icon: LineChart, accent: 'emerald', title: 'Every result tracked', body: 'Picks auto-grade from final box scores — wins and losses both logged.' },
  { icon: Trophy, accent: 'violet', title: 'No cherry-picking', body: 'Your full record builds a trust score anyone can verify. Nothing hidden.' },
  { icon: Lock, accent: 'cyan', title: 'Safe & flexible', body: 'We never store card numbers. 21+. Cancel anytime, no lock-in.' },
];

const PROOF_STATS: { value: string; label: string }[] = [
  { value: '100%', label: 'of results tracked' },
  { value: 'MLB', label: 'official data source' },
  { value: '0', label: 'card numbers stored' },
  { value: '21+', label: 'responsible use' },
];

export default function WelcomeFeatureSell({ plans, onSelectPlan, onExplore }: Props) {
  const reduced = prefersReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (reduced || paused) return;
    timer.current = window.setTimeout(() => setI((n) => (n + 1) % SLIDES.length), ROTATE_MS);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [i, paused, reduced]);

  const slide = SLIDES[i];
  const a = ACCENT[slide.accent];
  const go = (n: number) => setI((n + SLIDES.length) % SLIDES.length);

  const order: PlanId[] = ['free', 'pro_trial', 'pro_elite'];

  return (
    <section className="mx-auto mt-12 max-w-6xl">
      {/* ---------- Feature slideshow ---------- */}
      <div className="mb-3 flex items-center justify-center gap-2 text-center">
        <Sparkles className="h-4 w-4 text-cyan-300" />
        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Everything in one workspace</span>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-2xl shadow-black/40 sm:p-7"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ambient glow */}
        <div aria-hidden className={`pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full ${a.soft} blur-3xl transition-colors duration-700`} />

        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative grid gap-6 md:grid-cols-2 md:items-center"
          >
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full border ${a.ring} ${a.soft} px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${a.text}`}>
                <slide.icon className="h-3.5 w-3.5" /> {slide.eyebrow}
              </div>
              <h3 className="mt-4 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">{slide.title}</h3>
              <ul className="mt-4 space-y-2">
                {slide.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${a.soft}`}>
                      <Check className={`h-2.5 w-2.5 ${a.text}`} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3 sm:p-4">
              <slide.Visual />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                aria-label={`Show ${s.eyebrow}`}
                onClick={() => setI(idx)}
                className={`h-2 rounded-full transition-all ${idx === i ? `w-6 ${ACCENT[s.accent].dot}` : 'w-2 bg-slate-600 hover:bg-slate-500'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Previous" onClick={() => go(i - 1)} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button aria-label="Next" onClick={() => go(i + 1)} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Coming soon: NBA & NFL ---------- */}
      <div className="relative mt-14 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 px-6 py-10 text-center shadow-2xl shadow-black/40">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> MLB live now
          </div>
          <h2 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
            NBA &amp; NFL{' '}
            <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">coming soon</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            The same clean research, parlays, and tracked results — built next for the hardwood and the gridiron.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3.5 py-1.5 text-xs font-black text-emerald-200">
              <Check className="h-3.5 w-3.5" /> MLB · Live
            </span>
            <span className="rounded-full border border-orange-300/25 bg-orange-300/10 px-3.5 py-1.5 text-xs font-black text-orange-200">NBA · Soon</span>
            <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3.5 py-1.5 text-xs font-black text-violet-200">NFL · Soon</span>
          </div>
        </div>
      </div>

      {/* ---------- Facts band — no hype, just what it is ---------- */}
      <div className="mt-16 text-center">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">See it for yourself</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
          No hype, no guarantees. Open the live board and check the data yourself.
        </p>
        {onExplore && (
          <button
            onClick={onExplore}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            Open the live board <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_PILLARS.map((p) => {
          const ac = ACCENT[p.accent];
          return (
            <div key={p.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${ac.ring} ${ac.soft}`}>
                <p.icon className={`h-5 w-5 ${ac.text}`} />
              </div>
              <div className="mt-3 text-sm font-black text-white">{p.title}</div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{p.body}</p>
            </div>
          );
        })}
      </div>

      {/* True-fact proof strip */}
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
        {PROOF_STATS.map((s) => (
          <div key={s.label} className="bg-slate-950/70 px-4 py-5 text-center">
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ---------- Packages with checkmarks ---------- */}
      <div className="mt-16 text-center">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Pick your edge</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
          Start free, forever. Go Pro for the labs, AI picks, and pitcher profiles — cancel anytime.
        </p>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3 md:items-stretch">
        {order.map((id) => {
          const p = plans[id];
          const ac = ACCENT[p.accent];
          const featured = id === 'pro_trial';
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-3xl border bg-slate-950/60 p-6 transition ${
                featured ? `${ac.ring} shadow-2xl ${ac.glow} md:-translate-y-2` : 'border-white/10'
              }`}
            >
              {p.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r ${ac.grad} px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-lg`}>
                  {p.badge}
                </span>
              )}
              <div className={`text-xs font-black uppercase tracking-[0.18em] ${ac.text}`}>{p.name}</div>
              <div className="mt-2 text-3xl font-black text-white">{p.price}</div>
              <div className="mt-1 text-xs text-slate-400">{p.sub}</div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${ac.soft}`}>
                      <Check className={`h-2.5 w-2.5 ${ac.text}`} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSelectPlan(id)}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${
                  featured
                    ? `bg-gradient-to-r ${ac.grad} text-slate-950 shadow-lg ${ac.glow}`
                    : `border ${ac.ring} ${ac.soft} text-white`
                }`}
              >
                {id === 'free' ? 'Start free' : id === 'pro_trial' ? 'Start free trial' : 'Go Pro Elite'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11px] font-bold text-slate-500">
        Research &amp; entertainment only · No guaranteed outcomes · Cancel anytime
      </p>
    </section>
  );
}
