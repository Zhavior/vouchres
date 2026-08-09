import { motion } from "framer-motion";
import { Info, ShieldCheck } from "lucide-react";

export default function DecisionIntelligence() {
  return (
    <section
      id="confidence"
      aria-labelledby="confidence-title"
      className="relative scroll-mt-20 border-t border-white/6 bg-ve-obsidian py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-8 sm:p-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            <Info className="h-3.5 w-3.5" />
            Confidence
          </div>

          <h2
            id="confidence-title"
            className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            Confidence is a strength-of-evidence label — not a promise.
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Confidence represents how strongly the available evidence supports the current
            research conclusion. It is not a guarantee of the outcome.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">What it means</h3>
              <p className="mt-2 text-sm leading-7 text-white/60">
                Higher confidence means more of the relevant inputs are present and aligned. Lower
                confidence means the conclusion rests on thinner or incomplete evidence.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
                <Info className="h-5 w-5 text-amber-200" />
              </div>
              <h3 className="text-lg font-semibold text-white">What it does not mean</h3>
              <p className="mt-2 text-sm leading-7 text-white/60">
                Confidence is not betting advice, not implied profit, and not a claim that a player
                or side will cover. Always inspect the underlying evidence.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
