import { motion } from 'framer-motion';
import {
  Z8_INTERACTIVE,
  Z8_LABEL,
  Z8_PANEL_PREMIUM,
} from '../../theme/z8Tokens';

/** Canonical AI judges — mirrors server/services/aiJudges/aiJudgeLeaderboardService.ts */
export const LANDING_JUDGES = [
  {
    id: 'data_scout',
    code: 'DS',
    displayName: 'Data Scout',
    handle: 'ai-data-scout',
    tagline: 'Clean math. Low hype. Safer profiles.',
    persona: 'Finds cleaner HR profiles with better data quality and fewer red flags.',
    specialty: 'Math-first slate screening',
    useCase: 'Screen the full slate before first pitch — rank data quality, score logic, and weak spots without hype.',
    quote: 'I only surface hitters when the math is clean and the board agrees.',
    color: 'cyan',
  },
  {
    id: 'power_hunter',
    code: 'PH',
    displayName: 'Power Hunter',
    handle: 'ai-power-hunter',
    tagline: 'Home-run upside hunter.',
    persona: 'Chases raw HR upside using hitter power, pitcher vulnerability, and park context.',
    specialty: 'HR threat radar',
    useCase: 'Hunt raw home-run upside — power paths, pitcher mistake zones, and park leverage on game day.',
    quote: 'When the barrel meets a mistake pitch, I want you there first.',
    color: 'orange',
  },
  {
    id: 'momentum_reader',
    code: 'MR',
    displayName: 'Momentum Reader',
    handle: 'ai-momentum-reader',
    tagline: 'Recent form and rhythm reader.',
    persona: 'Reads recent form, lineup volume, and short-term momentum signals.',
    specialty: 'Game rhythm & form',
    useCase: 'Read who is hot right now — recent form, lineup volume, and late-game pressure windows.',
    quote: 'Form is fleeting, but rhythm tells you who is swinging with intent.',
    color: 'purple',
  },
  {
    id: 'risk_auditor',
    code: 'RA',
    displayName: 'Risk Auditor',
    handle: 'ai-risk-auditor',
    tagline: 'Finds traps before they cost you.',
    persona: 'Flags thin data, risky profiles, projection problems, and low-confidence picks.',
    specialty: 'Skeptical filter',
    useCase: 'Audit every pick for traps — projected lineups, missing data, and fake confidence before you stake.',
    quote: 'If the board cannot verify it, I will not let it through.',
    color: 'amber',
  },
  {
    id: 'pro_edge_agent',
    code: 'PE',
    displayName: 'Pro Edge Agent',
    handle: 'ai-pro-edge',
    tagline: 'Premium blended model.',
    persona: 'Blends power, matchup, form, confidence, and risk into one premium read.',
    specialty: 'Premium blended edge',
    useCase: 'One premium read that blends power, matchup, form, and risk for serious edge hunters.',
    quote: 'The best edge is never one signal — it is the blend that survives scrutiny.',
    color: 'emerald',
  },
] as const;

const PIXEL_THEME: Record<string, { main: string; glow: string; accent: string; active: number[] }> = {
  DS: { main: 'bg-sky-300', glow: 'bg-sky-500/25', accent: 'bg-cyan-300/80', active: [1, 2, 5, 6, 9, 10, 13, 14] },
  PH: { main: 'bg-red-300', glow: 'bg-red-500/25', accent: 'bg-orange-300/80', active: [0, 3, 5, 6, 9, 10, 12, 15] },
  MR: { main: 'bg-violet-300', glow: 'bg-violet-500/25', accent: 'bg-fuchsia-300/80', active: [1, 4, 6, 9, 11, 13, 14] },
  RA: { main: 'bg-amber-300', glow: 'bg-amber-500/25', accent: 'bg-yellow-200/80', active: [0, 1, 2, 4, 8, 12, 13, 14] },
  PE: { main: 'bg-emerald-300', glow: 'bg-emerald-500/25', accent: 'bg-lime-300/80', active: [2, 5, 6, 7, 8, 9, 10, 13] },
};

const COLOR_RING: Record<string, string> = {
  cyan: 'border-vouch-cyan/30 shadow-[0_0_32px_rgba(0,240,255,0.12)]',
  orange: 'border-orange-400/30 shadow-[0_0_32px_rgba(251,146,60,0.1)]',
  purple: 'border-violet-400/30 shadow-[0_0_32px_rgba(167,139,250,0.1)]',
  amber: 'border-amber-400/30 shadow-[0_0_32px_rgba(251,191,36,0.1)]',
  emerald: 'border-vouch-emerald/30 shadow-[0_0_32px_rgba(0,255,148,0.1)]',
};

function PixelAgentIcon({ code }: { code: string }) {
  const t = PIXEL_THEME[code] ?? PIXEL_THEME.DS;

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-inner">
      <div className={`absolute inset-0 ${t.glow} blur-xl`} />
      <div className="absolute inset-1 grid grid-cols-4 grid-rows-4 gap-[2px]">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className={`rounded-[2px] ${
              t.active.includes(i)
                ? t.main
                : [0, 5, 10, 15].includes(i)
                  ? t.accent
                  : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-black text-white shadow">
          {code}
        </span>
      </div>
    </div>
  );
}

function JudgeCard({ judge, index }: { judge: (typeof LANDING_JUDGES)[number]; index: number }) {
  const ring = COLOR_RING[judge.color] ?? COLOR_RING.cyan;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`group relative overflow-hidden rounded-2xl ${Z8_PANEL_PREMIUM} ${Z8_INTERACTIVE} ${ring} p-5`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-vouch-cyan/5 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start gap-4">
        <PixelAgentIcon code={judge.code} />
        <div className="min-w-0 flex-1">
          <p className={`${Z8_LABEL} text-vouch-cyan/70`}>{judge.specialty}</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">{judge.displayName}</h3>
          <p className="mt-1 text-sm font-medium text-vouch-cyan/80">{judge.tagline}</p>
        </div>
      </div>

      <p className="relative mt-4 text-sm leading-relaxed text-white/55">{judge.useCase}</p>

      <blockquote className="relative mt-4 border-l-2 border-vouch-cyan/40 pl-3 text-sm italic leading-relaxed text-white/70">
        &ldquo;{judge.quote}&rdquo;
      </blockquote>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-white/40">
          @{judge.handle}
        </span>
        <span className="rounded-full border border-vouch-emerald/25 bg-vouch-emerald/8 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-vouch-emerald/80">
          Live when signed in
        </span>
      </div>
    </motion.article>
  );
}

export default function LandingJudgesDeck() {
  return (
    <section aria-labelledby="judges-heading" className="space-y-6">
      <div className="text-center">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>AI Judge Council</p>
        <h2 id="judges-heading" className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Five judges. Five real-world edges.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Each AI judge in VouchEdge maps to how serious researchers actually work the slate — from
          math-first screening to trap detection. Picks and trust scores populate live after sign-in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LANDING_JUDGES.map((judge, i) => (
          <JudgeCard key={judge.id} judge={judge} index={i} />
        ))}
      </div>

      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-white/30">
        Judge IDs: data_scout · power_hunter · momentum_reader · risk_auditor · pro_edge_agent
      </p>
    </section>
  );
}
