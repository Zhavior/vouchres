import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, XOctagon, Info } from 'lucide-react';

export default function DecisionIntelligence() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="decision-intelligence"
      className="relative scroll-mt-20 border-t border-white/20 bg-black py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="overflow-hidden rounded-none border border-white/20 bg-black p-8 sm:p-12">
          <motion.span
            initial={reduceMotion ? undefined : { opacity: 0, x: -12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase"
          >
            <Info aria-hidden="true" className="h-4 w-4" />
            METHODOLOGY / INTEGRITY PRINCIPLE
          </motion.span>

          <motion.h2
            initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-balance text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]"
          >
            Decision intelligence, not a prediction oracle.
          </motion.h2>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-3xl text-balance text-base sm:text-lg lg:text-xl leading-relaxed text-zinc-200"
          >
            VouchEdge evaluates signal coverage, historical baselines, and matchup context to surface where evidence exists—and explicitly flags where data is absent or inconclusive.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={reduceMotion ? undefined : { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.14 } } }}
            className="mt-12 grid gap-6 sm:grid-cols-2"
          >
            <motion.div
              variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 22, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
              className="rounded-none border border-white/20 bg-zinc-950 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-none border border-emerald-400/40 bg-emerald-950/40">
                  <ShieldCheck aria-hidden="true" className="h-6 w-6 text-emerald-300" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">What it means</h3>
              </div>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-zinc-300">
                Available matchup metrics, source notes, missing-data states, and confidence context are organized into a repeatable pre-game workflow.
              </p>
            </motion.div>

            <motion.div
              variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 22, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
              className="rounded-none border border-white/20 bg-zinc-950 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-none border border-amber-400/40 bg-amber-950/40">
                  <XOctagon aria-hidden="true" className="h-6 w-6 text-amber-200" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">What it does not mean</h3>
              </div>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-zinc-300">
                We never claim guaranteed hits, guaranteed home runs, or lock-of-the-night guarantees. Baseball is inherently stochastic; high confidence measures evidence depth, not certainty.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
