import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export interface CTASectionProps {
  onJoinBeta?: () => void;
  onViewDemo?: () => void;
}

export default function CTASection({
  onJoinBeta,
  onViewDemo,
}: CTASectionProps) {
  return (
    <section id="join-beta" className="relative scroll-mt-20 overflow-hidden border-t border-white/6 bg-ve-obsidian py-40">

      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[180px]" />
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/10" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 text-center">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .5 }}
        >

          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-blue-500/20 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-300">
            <Sparkles className="h-4 w-4" />
            Open Beta Available
          </div>

          <h2 className="max-w-4xl text-6xl font-semibold tracking-tight text-white">
            The next era of
            <br />
            sports intelligence
            <br />
            starts with one decision.
          </h2>

          <p className="mx-auto mt-10 max-w-3xl text-xl leading-9 text-white/60">
            Join the VouchEdge Open Beta and experience a platform built
            around evidence, transparency and confidence—not noise.
          </p>

        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: .15,
            duration: .45,
          }}
          className="mt-14 flex flex-col items-center gap-5 sm:flex-row"
        >

          <button
            type="button"
            onClick={onJoinBeta}
            className="group rounded-2xl bg-blue-500 px-9 py-5 text-lg font-semibold text-white transition-all duration-300 hover:bg-blue-400 hover:shadow-[0_0_60px_rgba(59,130,246,.35)]"
          >
            <span className="flex items-center gap-3">
              Join Open Beta
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          <button
            type="button"
            onClick={onViewDemo}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-9 py-5 text-lg font-semibold text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
          >
            View Live Demo
          </button>

        </motion.div>

      </div>

    </section>
  );
}
