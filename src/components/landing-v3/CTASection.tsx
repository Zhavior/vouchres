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
    <section
      id="join-beta"
      className="relative scroll-mt-20 overflow-hidden border-t border-white/[0.06] bg-black py-24"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[min(92vw,44rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.09] blur-[130px]" />
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/90">
            Next step
          </p>

          <h2 className="mt-4 text-balance text-3xl font-black tracking-tight text-white sm:text-[2.8rem] sm:leading-[1.08]">
            Open today&apos;s MLB research board.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-white/65">
            Create a free beta account, land on today&apos;s board, inspect a matchup, and track a
            decision you can review after the final result.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.38 }}
          className="mt-9 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center"
        >
          <button
            type="button"
            onClick={onJoinBeta}
            className="group inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-300 to-emerald-300 px-7 text-base font-black text-[#03131a] shadow-[0_0_36px_-8px_rgba(0,217,160,0.6)] transition hover:brightness-110 sm:w-auto"
          >
            Open today&apos;s MLB research board
            <ArrowRight
              aria-hidden="true"
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
            />
          </button>

          <button
            type="button"
            onClick={onViewDemo}
            className="min-h-14 w-full rounded-2xl border border-white/15 px-7 text-base font-semibold text-white/85 transition hover:border-emerald-300/45 hover:bg-white/[0.05] hover:text-white sm:w-auto"
          >
            View a research example
          </button>
        </motion.div>
      </div>
    </section>
  );
}
