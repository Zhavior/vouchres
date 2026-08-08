import { motion } from "framer-motion";
import {
  Brain,
  ShieldCheck,
  Target,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

const pillars = [
  {
    icon: Brain,
    title: "Research",
    description:
      "Player history, matchup context, trends and situational analysis are combined into one structured research flow.",
  },
  {
    icon: Target,
    title: "Confidence",
    description:
      "Every insight is accompanied by confidence indicators so you understand conviction, not just conclusions.",
  },
  {
    icon: TrendingUp,
    title: "Evidence",
    description:
      "Historical performance and contextual signals remain visible throughout the decision process.",
  },
  {
    icon: ShieldCheck,
    title: "Trust",
    description:
      "Transparency is built into every recommendation, helping you understand why—not just what.",
  },
];

export default function DecisionIntelligence() {
  return (
    <section className="relative border-t border-white/6 bg-ve-obsidian py-32">
      <div className="mx-auto max-w-7xl px-6">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">
            Aurora Intelligence
          </span>

          <h2 className="mt-6 text-5xl font-semibold tracking-tight text-white">
            Better decisions
            <br />
            begin with better evidence.
          </h2>

          <p className="mt-8 text-lg leading-8 text-white/60">
            Aurora organizes research into a transparent decision workflow,
            allowing you to understand confidence, context and historical
            evidence before making a prediction.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-8 lg:grid-cols-[1.15fr_.85fr]">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .45 }}
            className="rounded-[32px] border border-white/8 bg-white/[0.03] p-10 backdrop-blur-xl"
          >

            <div className="mb-10 flex items-center gap-4">
              <div className="rounded-2xl bg-blue-500/10 p-4">
                <Brain className="h-8 w-8 text-blue-400" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Aurora Decision Engine
                </h3>

                <p className="text-white/55">
                  Every recommendation follows the same trusted workflow.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                "Collect live sports data",
                "Analyze matchup context",
                "Evaluate historical performance",
                "Generate confidence score",
                "Present transparent recommendation",
              ].map((step) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-5"
                >
                  <CheckCircle2
                    className="h-6 w-6 text-emerald-400"
                    strokeWidth={2}
                  />

                  <span className="text-white/80">
                    {step}
                  </span>
                </div>
              ))}
            </div>

          </motion.div>

          <div className="grid gap-6">
            {pillars.map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * .08,
                  duration: .4,
                }}
                className="rounded-3xl border border-white/8 bg-white/[0.03] p-7 backdrop-blur-xl"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>

                <h4 className="mb-3 text-xl font-semibold text-white">
                  {title}
                </h4>

                <p className="leading-7 text-white/60">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
