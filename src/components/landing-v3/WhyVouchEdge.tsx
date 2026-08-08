import { motion } from "framer-motion";
import {
  Brain,
  ShieldCheck,
  Activity,
  Sparkles,
} from "lucide-react";

const items = [
  {
    icon: Brain,
    title: "Evidence Before Emotion",
    description:
      "Every recommendation is backed by data, trends, context and transparent reasoning instead of hype.",
  },
  {
    icon: ShieldCheck,
    title: "Built For Trust",
    description:
      "Your decisions are organized through an intelligence platform designed around confidence and accountability.",
  },
  {
    icon: Activity,
    title: "Live Intelligence",
    description:
      "Monitor games, player trends and momentum in real time with continuously updating insights.",
  },
  {
    icon: Sparkles,
    title: "Premium Experience",
    description:
      "Designed with the polish, speed and clarity expected from modern premium software.",
  },
];

export default function WhyVouchEdge() {
  return (
    <section className="relative border-t border-white/6 bg-ve-obsidian py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl text-center"
        >
          <div className="mb-5 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">
            Why VouchEdge
          </div>

          <h2 className="text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            Every prediction
            <br />
            begins with evidence.
          </h2>

          <p className="mx-auto mt-10 max-w-3xl text-xl leading-9 text-white/60">
            The best sports decisions aren't driven by instinct alone. VouchEdge brings together research, live context, and transparent evidence so every matchup can be understood before the game begins.
          </p>
        </motion.div>

        <div className="mt-24 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {items.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.08,
                duration: 0.45,
              }}
              className="group rounded-3xl border border-white/8 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.05]"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                <Icon
                  className="h-7 w-7 text-blue-400"
                  strokeWidth={1.8}
                />
              </div>

              <h3 className="mb-3 text-xl font-semibold text-white">
                {title}
              </h3>

              <p className="leading-7 text-white/60">
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
