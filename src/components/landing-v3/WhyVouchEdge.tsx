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
      className="relative scroll-mt-20 border-t border-white/[0.06] bg-ve-obsidian py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl"
        >
          <span className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            How it works
          </span>

          <h2
            id="how-it-works-title"
            className="mt-5 text-3xl font-black tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.08]"
          >
            A simple MLB research workflow.
          </h2>

          <p className="mt-4 text-[15px] leading-7 text-white/65">
            Built for people who want context before they decide — not a sportsbook tip sheet and
            not a guarantee.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07, duration: 0.35 }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition-colors hover:border-cyan-300/25"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-5 font-mono text-[5rem] font-black leading-none text-white/[0.045]"
              >
                {step}
              </span>

              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/10">
                <Icon aria-hidden="true" className="h-5 w-5 text-cyan-200" strokeWidth={1.9} />
              </div>

              <h3 className="relative mt-5 text-lg font-bold text-white">{title}</h3>
              <p className="relative mt-2 text-[14px] leading-6 text-white/65">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
