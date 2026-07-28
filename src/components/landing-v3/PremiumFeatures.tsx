import { motion } from "framer-motion";
import {
  Brain,
  Activity,
  Shield,
  BarChart3,
  Zap,
  Layers3,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Research Engine",
    text: "Player trends, matchup intelligence and contextual insights organized into one premium research workflow.",
  },
  {
    icon: Activity,
    title: "Live Intelligence",
    text: "Monitor momentum, line movement and game flow with continuously updating intelligence.",
  },
  {
    icon: Shield,
    title: "Trust Ledger",
    text: "Transparent results and historical performance create accountability instead of hype.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    text: "Visualize trends, probabilities and confidence through clean, readable dashboards.",
  },
  {
    icon: Zap,
    title: "Aurora AI",
    text: "AI quietly accelerates research without replacing your judgment or overwhelming the interface.",
  },
  {
    icon: Layers3,
    title: "Premium Workspace",
    text: "Everything is designed around clarity, speed and focus so serious sports fans stay in flow.",
  },
];

export default function PremiumFeatures() {
  return (
    <section id="features" className="relative scroll-mt-20 border-t border-white/6 bg-[#05080f] py-32">
      <div className="mx-auto max-w-7xl px-6">

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .45 }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
            Platform Features
          </span>

          <h2 className="mt-6 text-5xl font-semibold tracking-tight text-white">
            Built for people who
            <br />
            take sports seriously.
          </h2>

          <p className="mt-8 text-lg leading-8 text-white/60">
            Every feature exists to improve decision quality, reduce noise,
            and create a premium research experience.
          </p>
        </motion.div>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ icon: Icon, title, text }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.06,
                duration: .35,
              }}
              className="group rounded-3xl border border-white/8 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/30 hover:bg-white/[0.05]"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10">
                <Icon
                  className="h-7 w-7 text-sky-400"
                  strokeWidth={1.8}
                />
              </div>

              <h3 className="mb-4 text-xl font-semibold text-white">
                {title}
              </h3>

              <p className="leading-7 text-white/60">
                {text}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
