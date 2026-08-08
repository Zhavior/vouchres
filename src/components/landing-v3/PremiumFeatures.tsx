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
    <section id="features" className="relative scroll-mt-20 border-t border-white/[0.05] bg-black py-40 sm:py-48">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

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

          <h2 className="mt-8 text-balance text-[9vw] font-black leading-[0.9] tracking-tight text-white sm:text-[6vw] lg:text-[72px]">
            Built for people who
            <br className="hidden sm:block" />
            take sports seriously.
          </h2>

          <p className="mt-8 text-lg leading-8 text-white/60 sm:text-xl sm:leading-9">
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
              className="group rounded-[2rem] border border-white/[0.04] bg-ve-obsidian/80 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-sky-400/30 hover:bg-ve-obsidian/90 hover:shadow-2xl hover:shadow-sky-400/10"
            >
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-400/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-sky-400/20">
                <Icon
                  className="h-8 w-8 text-sky-400"
                  strokeWidth={2}
                />
              </div>

              <h3 className="mb-4 text-2xl font-semibold tracking-tight text-white">
                {title}
              </h3>

              <p className="text-base leading-7 text-white/60">
                {text}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
