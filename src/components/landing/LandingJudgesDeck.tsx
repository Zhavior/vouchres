import { motion } from 'framer-motion';
import {
  Z8_INTERACTIVE,
  Z8_LABEL,
  Z8_PANEL_PREMIUM,
} from '../../theme/z8Tokens';
import { JUDGE_COLOR_RING, LANDING_JUDGES } from '../../constants/aiJudges';
import JudgePixelIcon from '../judges/JudgePixelIcon';

function JudgeCard({ judge, index }: { judge: (typeof LANDING_JUDGES)[number]; index: number }) {
  const ring = JUDGE_COLOR_RING[judge.color] ?? JUDGE_COLOR_RING.cyan;

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
        <JudgePixelIcon code={judge.code} />
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

export { LANDING_JUDGES };
