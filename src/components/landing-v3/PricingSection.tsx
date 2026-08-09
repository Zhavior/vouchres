import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { FREE_BETA_ALL_ACCESS, FREE_BETA_ENDS_AT } from "../../lib/betaAccess";

const betaFeatures = [
  "Today’s MLB research board",
  "Matchup context and evidence inspection",
  "Confidence labels with plain-language limits",
  "Decision tracking and post-game comparison",
  "No card required to join",
];

const betaEndsCopy = FREE_BETA_ENDS_AT
  ? `Currently free through ${new Date(FREE_BETA_ENDS_AT).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.`
  : "Beta access is currently free.";

export interface PricingSectionProps {
  onJoinBeta?: () => void;
}

export default function PricingSection({ onJoinBeta }: PricingSectionProps) {
  return (
    <section id="pricing" className="relative scroll-mt-20 border-t border-white/6 bg-ve-obsidian py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            MLB Research Beta
          </span>

          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Join the MLB Research Beta.
          </h2>

          <p className="mt-6 text-lg leading-8 text-white/60">
            {FREE_BETA_ALL_ACCESS
              ? `${betaEndsCopy} Create an account, open today’s board, and help shape the research workflow. Future pricing will be communicated clearly, and you will not be charged without explicit consent.`
              : "Try the research tools free for 7 days. After your trial, continue for $7.99 per month until you cancel."}
          </p>
        </motion.div>

        <div className="mx-auto mt-14 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-[2rem] border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-white/[0.03] p-8 sm:p-10"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <span className="font-semibold text-cyan-200">
                {FREE_BETA_ALL_ACCESS ? "Free open beta" : "VouchEdge Beta"}
              </span>
            </div>

            <div className="mt-8 flex items-end gap-2">
              <span className="text-6xl font-bold text-white">
                {FREE_BETA_ALL_ACCESS ? "$0" : "$7.99"}
              </span>
              <span className="pb-2 text-white/50">
                {FREE_BETA_ALL_ACCESS ? "no card required" : "/month after trial"}
              </span>
            </div>

            <div className="mt-8 space-y-4">
              {betaFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" strokeWidth={2.5} />
                  <span className="text-white/75">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/55">
              Available now: MLB schedule context, research board inspection, confidence labels, and
              decision tracking. Beta users help prioritize evidence coverage, clarity, and the
              first-session workflow. We will announce pricing before the beta ends.
            </div>

            <button
              type="button"
              onClick={onJoinBeta}
              className="group mt-8 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-6 text-base font-semibold text-[#031017] transition hover:bg-cyan-300"
            >
              {FREE_BETA_ALL_ACCESS ? "Join the MLB Research Beta" : "Start 7-day free trial"}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="mt-4 text-center text-sm text-white/45">
              {FREE_BETA_ALL_ACCESS
                ? "No card required. You will not be charged without explicit consent."
                : "Then $7.99/month. Cancel anytime."}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
