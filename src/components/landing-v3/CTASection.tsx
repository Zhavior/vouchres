import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export interface CTASectionProps {
  onJoinBeta?: () => void;
  onViewDemo?: () => void;
}

export default function CTASection({
  onJoinBeta,
  onViewDemo,
}: CTASectionProps) {
  return (
    <section id="join-beta" className="relative scroll-mt-20 overflow-hidden border-t border-white/6 bg-ve-obsidian py-28">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/8 blur-[160px]" />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/90">
            Next step
          </p>

          <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Open today&apos;s MLB research board.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">
            Create a free beta account, land on today&apos;s board, inspect a matchup, and track a
            decision you can review after the final result.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="mt-10 flex w-full max-w-lg flex-col items-center gap-4 sm:max-w-none sm:flex-row sm:justify-center"
        >
          <button
            type="button"
            onClick={onJoinBeta}
            className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-8 text-base font-semibold text-[#031017] transition hover:bg-cyan-300 sm:w-auto"
          >
            Open today&apos;s MLB research board
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={onViewDemo}
            className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-8 text-base font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.06] sm:w-auto"
          >
            View a research example
          </button>
        </motion.div>
      </div>
    </section>
  );
}
