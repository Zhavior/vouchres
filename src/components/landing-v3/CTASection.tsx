import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';

export interface CTASectionProps {
  onJoinBeta?: () => void;
  onViewDemo?: () => void;
}

export default function CTASection({ onJoinBeta, onViewDemo }: CTASectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="cta" className="relative scroll-mt-20 border-t border-white/20 bg-black py-28 sm:py-36">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
        <motion.span
          initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-400/10 px-3.5 py-1 text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase"
        >
          <Shield aria-hidden="true" className="h-4 w-4" />
          START RESEARCHING NOW
        </motion.span>

        <motion.h2
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-balance text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[0.96]"
        >
          See the evidence before you make the call.
        </motion.h2>

        <motion.p
          initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-2xl text-balance text-lg sm:text-xl lg:text-2xl leading-relaxed text-zinc-200"
        >
          Create a free beta account, inspect today&apos;s available MLB evidence, and save decisions you can review after the result.
        </motion.p>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.45, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={onJoinBeta}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 border-2 border-white bg-white px-10 py-5 font-mono text-base sm:text-lg font-black uppercase tracking-wider text-black transition hover:bg-zinc-200 cursor-pointer rounded-none"
          >
            Get Beta Access Free
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </button>
          {onViewDemo ? (
            <button
              type="button"
              onClick={onViewDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 border-2 border-white/30 bg-black px-10 py-5 font-mono text-base sm:text-lg font-bold uppercase tracking-wider text-white transition hover:border-white hover:bg-white/10 cursor-pointer rounded-none"
            >
              View a Research Example
            </button>
          ) : null}
        </motion.div>

        <p className="mt-6 font-mono text-xs text-zinc-400">
          No credit card required while the free beta is active
        </p>
      </div>
    </section>
  );
}
