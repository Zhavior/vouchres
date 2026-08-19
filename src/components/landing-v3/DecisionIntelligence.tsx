import { motion, useReducedMotion } from "framer-motion";
import { Info, ShieldCheck, XOctagon } from "lucide-react";

export default function DecisionIntelligence() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 26, scale: 0.985 }, whileInView: { opacity: 1, y: 0, scale: 1 }, viewport: { once: true, amount: 0.5, margin: "0px 0px -80px 0px" }, transition: { type: "spring" as const, stiffness: 120, damping: 20, mass: 0.8 } };
  return (
    <section
      id="confidence"
      aria-labelledby="confidence-title"
      className="relative scroll-mt-20 border-t border-white/[0.06] bg-ve-obsidian py-20 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          {...reveal}
          className="overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-emerald-500/[0.07] via-white/[0.02] to-transparent p-7 sm:p-10"
        >
          <motion.span initial={reduceMotion ? undefined : { opacity: 0, x: -12 }} whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: .12, duration: .38 }} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
            <Info aria-hidden="true" className="h-3.5 w-3.5" />
            Confidence
          </motion.span>

          <motion.h2 initial={reduceMotion ? undefined : { opacity: 0, y: 18 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .18, type: "spring", stiffness: 150, damping: 22 }}
            id="confidence-title"
            className="mt-5 text-balance text-3xl font-black tracking-tight text-white sm:text-[2.4rem] sm:leading-[1.1]"
          >
            Confidence is a strength-of-evidence label — not a promise.
          </motion.h2>

          <motion.p initial={reduceMotion ? undefined : { opacity: 0, y: 14 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .27, duration: .42 }} className="mt-5 max-w-3xl border-l-2 border-emerald-300/40 pl-4 text-[15px] leading-7 text-white/75 sm:text-base">
            Confidence represents how strongly the available evidence supports the current
            research conclusion. It is not a guarantee of the outcome.
          </motion.p>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: .25 }} variants={reduceMotion ? undefined : { hidden: {}, show: { transition: { staggerChildren: .13, delayChildren: .32 } } }} className="mt-8 grid gap-3.5 sm:grid-cols-2">
            <motion.div variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 22, scale: .97 }, show: { opacity: 1, y: 0, scale: 1 } }} transition={{ type: "spring", stiffness: 180, damping: 20 }} whileHover={reduceMotion ? undefined : { y: -5, scale: 1.012 }} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-5">
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
            </motion.div>

            <motion.div variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 22, scale: .97 }, show: { opacity: 1, y: 0, scale: 1 } }} transition={{ type: "spring", stiffness: 180, damping: 20 }} whileHover={reduceMotion ? undefined : { y: -5, scale: 1.012 }} className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-5">
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
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
