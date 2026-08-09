import { motion } from "framer-motion";
import { ClipboardCheck, Search, Shuffle } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Choose a game",
    description:
      "Open today’s MLB board and pick the matchup you want to research before first pitch.",
  },
  {
    icon: Shuffle,
    step: "02",
    title: "Review the evidence",
    description:
      "Inspect matchup context, trends, and supporting signals. Missing data stays labeled as missing.",
  },
  {
    icon: ClipboardCheck,
    step: "03",
    title: "Track the decision",
    description:
      "Save what you decided, then compare it with the final result after the game.",
  },
];

export default function WhyVouchEdge() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="relative scroll-mt-20 border-t border-white/6 bg-ve-obsidian py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            How it works
          </div>

          <h2
            id="how-it-works-title"
            className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            A simple MLB research workflow.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">
            VouchEdge is built for people who want context before they decide — not a sportsbook
            tip sheet and not a guarantee.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-8"
            >
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
                  <Icon className="h-6 w-6 text-cyan-300" strokeWidth={1.8} />
                </div>
                <span className="font-mono text-sm font-semibold text-white/30">{step}</span>
              </div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 leading-7 text-white/60">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
