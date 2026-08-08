import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";

const features = [
  "All Pro research labs",
  "Live game research",
  "Player Edge and Team Matchup tools",
  "Signal graphs and confidence meters",
  "Verified badge",
];

export interface PricingSectionProps {
  onJoinBeta?: () => void;
}

export default function PricingSection({ onJoinBeta }: PricingSectionProps) {
  return (
    <section id="pricing" className="relative scroll-mt-20 border-t border-white/6 bg-ve-obsidian py-32">
      <div className="mx-auto max-w-7xl px-6">

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">
            Pricing
          </span>

          <h2 className="mt-6 text-5xl font-semibold tracking-tight text-white">
            Premium intelligence.
            <br />
            Simple pricing.
          </h2>

          <p className="mt-8 text-lg leading-8 text-white/60">
            Try every Beta research tool free for 7 days. After your trial,
            continue for $7.99 per month until you cancel.
          </p>
        </motion.div>

        <div className="mx-auto mt-20 max-w-2xl">

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .45 }}
            className="rounded-[36px] border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-white/[0.03] p-10 backdrop-blur-xl"
          >

            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-400" />

              <span className="font-semibold text-blue-300">
                VouchEdge Beta
              </span>
            </div>

            <div className="mt-8 flex items-end gap-2">
              <span className="text-6xl font-bold text-white">
                $7.99
              </span>

              <span className="pb-2 text-white/50">
                /month
              </span>
            </div>

            <div className="mt-10 space-y-5">
              {features.map(feature => (
                <div
                  key={feature}
                  className="flex items-center gap-4"
                >
                  <Check
                    className="h-5 w-5 text-emerald-400"
                    strokeWidth={2.5}
                  />

                  <span className="text-white/75">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onJoinBeta}
              className="group mt-12 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-500 px-6 py-4 text-base font-semibold text-white transition-all hover:bg-blue-400"
            >
              Start 7-day free trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="mt-5 text-center text-sm text-white/45">
              Then $7.99/month. Cancel anytime.
            </p>

          </motion.div>

        </div>

      </div>
    </section>
  );
}
