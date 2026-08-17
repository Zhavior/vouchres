import { motion } from "framer-motion";
import { Info, ShieldCheck, XOctagon } from "lucide-react";

export default function DecisionIntelligence() {
  return (
    <section
      id="confidence"
      aria-labelledby="confidence-title"
      className="relative scroll-mt-20 border-t border-white/[0.06] bg-ve-obsidian py-20 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-emerald-500/[0.07] via-white/[0.02] to-transparent p-7 sm:p-10"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
            <Info aria-hidden="true" className="h-3.5 w-3.5" />
            Confidence
          </span>

          <h2
            id="confidence-title"
            className="mt-5 text-balance text-3xl font-black tracking-tight text-white sm:text-[2.4rem] sm:leading-[1.1]"
          >
            Confidence is a strength-of-evidence label — not a promise.
          </h2>

          <p className="mt-5 max-w-3xl border-l-2 border-emerald-300/40 pl-4 text-[15px] leading-7 text-white/75 sm:text-base">
            Confidence represents how strongly the available evidence supports the current
            research conclusion. It is not a guarantee of the outcome.
          </p>

          <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/12">
                  <ShieldCheck aria-hidden="true" className="h-4.5 w-4.5 text-emerald-300" />
                </div>
                <h3 className="text-base font-bold text-white">What it means</h3>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-white/70">
                Higher confidence means more of the relevant inputs are present and aligned. Lower
                confidence means the conclusion rests on thinner or incomplete evidence.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/12">
                  <XOctagon aria-hidden="true" className="h-4.5 w-4.5 text-amber-200" />
                </div>
                <h3 className="text-base font-bold text-white">What it does not mean</h3>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-white/70">
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
