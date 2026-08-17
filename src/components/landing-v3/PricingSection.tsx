import { motion } from "framer-motion";
import { ArrowRight, Check, CreditCard, Sparkles } from "lucide-react";
import { FREE_BETA_ALL_ACCESS, FREE_BETA_ENDS_AT } from "../../lib/betaAccess";

const betaFeatures = [
  "Today’s MLB research board",
  "Matchup context and evidence inspection",
  "Confidence labels with plain-language limits",
  "Decision tracking and post-game comparison",
];

const betaEndsCopy = FREE_BETA_ENDS_AT
  ? `Currently free through ${new Date(FREE_BETA_ENDS_AT).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.`
  : "Beta access is currently free.";

export interface PricingSectionProps {
  onJoinBeta?: () => void;
}

export default function PricingSection({ onJoinBeta }: PricingSectionProps) {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-20 overflow-hidden border-t border-white/[0.06] bg-ve-obsidian py-20 sm:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 h-72 w-[min(90vw,52rem)] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
            MLB Research Beta
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.08]">
            Join the MLB Research Beta.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-white/65">
            {FREE_BETA_ALL_ACCESS
              ? `${betaEndsCopy} Create an account, open today’s board, and help shape the research workflow.`
              : "Try the research tools free for 7 days. After your trial, continue for $7.99 per month until you cancel."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-10 overflow-hidden rounded-[26px] border border-emerald-300/20 bg-gradient-to-b from-emerald-400/[0.09] to-ve-obsidian/95 shadow-[0_28px_80px_-24px_rgba(0,0,0,0.8)]"
        >
          <div className="grid gap-8 p-7 sm:p-9 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-emerald-300" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                  {FREE_BETA_ALL_ACCESS ? "Free open beta" : "VouchEdge Beta"}
                </span>
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-6xl font-black tracking-tight text-white">
                  {FREE_BETA_ALL_ACCESS ? "$0" : "$7.99"}
                </span>
                <span className="pb-2 text-[13px] text-white/55">
                  {FREE_BETA_ALL_ACCESS ? "no card required" : "/month after trial"}
                </span>
              </div>

              <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-2 text-[12px] font-semibold text-emerald-100">
                <CreditCard aria-hidden="true" className="h-3.5 w-3.5" />
                No card required to join
              </p>

              <button
                type="button"
                onClick={onJoinBeta}
                className="group mt-6 flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-300 to-emerald-300 px-6 text-base font-black text-[#03131a] shadow-[0_0_32px_-8px_rgba(0,217,160,0.6)] transition hover:brightness-110"
              >
                {FREE_BETA_ALL_ACCESS ? "Join the MLB Research Beta" : "Start 7-day free trial"}
                <ArrowRight
                  aria-hidden="true"
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                />
              </button>

              <p className="mt-3 text-center text-[12px] leading-5 text-white/45">
                {FREE_BETA_ALL_ACCESS
                  ? "You will not be charged without explicit consent."
                  : "Then $7.99/month. Cancel anytime."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Available now
              </p>
              <div className="mt-4 space-y-3">
                {betaFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                      strokeWidth={2.6}
                    />
                    <span className="text-[13px] leading-6 text-white/75">{feature}</span>
                  </div>
                ))}
              </div>

              <p className="mt-5 border-t border-white/[0.07] pt-4 text-[12px] leading-6 text-white/50">
                Beta users help prioritize evidence coverage, clarity, and the first-session
                workflow. We will announce pricing before the beta ends.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
