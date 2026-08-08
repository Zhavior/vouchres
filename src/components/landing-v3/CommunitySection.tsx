import { motion } from "framer-motion";
import {
  Users,
  Trophy,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const pillars = [
  {
    icon: Users,
    title: "Follow Great Analysts",
    description:
      "Build a personalized feed of trusted sports researchers and discover new perspectives backed by evidence.",
  },
  {
    icon: Trophy,
    title: "Earn Your Reputation",
    description:
      "Every decision contributes to a transparent track record, helping establish credibility over time.",
  },
  {
    icon: ShieldCheck,
    title: "Trust Through Transparency",
    description:
      "Research, confidence and outcomes stay visible so every recommendation can be understood—not just followed.",
  },
];

export interface CommunitySectionProps {
  onExploreCommunity?: () => void;
}

export default function CommunitySection({
  onExploreCommunity,
}: CommunitySectionProps) {
  return (
    <section id="community" className="relative scroll-mt-20 border-t border-white/6 bg-ve-obsidian py-32">
      <div className="mx-auto max-w-7xl px-6">

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">
            Community
          </span>

          <h2 className="mt-6 text-5xl font-semibold tracking-tight text-white">
            Learn from every decision.
            <br />
            Build your reputation.
          </h2>

          <p className="mt-8 text-lg leading-8 text-white/60">
            VouchEdge isn't just another feed. It's a community built around
            evidence, accountability and continuous improvement.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.08,
                duration: 0.4,
              }}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/30"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                <Icon className="h-7 w-7 text-blue-400" />
              </div>

              <h3 className="mb-4 text-xl font-semibold text-white">
                {title}
              </h3>

              <p className="leading-7 text-white/60">
                {description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-20 flex justify-center"
        >
          <button
            type="button"
            onClick={onExploreCommunity}
            className="group inline-flex items-center gap-3 rounded-full border border-blue-500/20 bg-blue-500/10 px-8 py-4 text-sm font-semibold text-blue-300 transition-all hover:border-blue-400/40 hover:bg-blue-500/20"
          >
            Explore the Community
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>

      </div>
    </section>
  );
}
