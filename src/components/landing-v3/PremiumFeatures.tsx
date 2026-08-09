import { motion } from "framer-motion";
import {
  CloudSun,
  HeartPulse,
  History,
  Plane,
  TrendingUp,
  Users,
} from "lucide-react";

const evidenceTypes = [
  {
    icon: Users,
    title: "Bullpen information",
    text: "When the research row includes bullpen context, you can see whether late-inning leverage may be affected. If that layer is missing, we leave it blank.",
    source: "HR research pipeline when published",
  },
  {
    icon: CloudSun,
    title: "Weather",
    text: "Park environment can change fly-ball carry. Weather appears only when the game feed returns a forecast — never as invented detail.",
    source: "Game environment feed when available",
  },
  {
    icon: Plane,
    title: "Travel and rest",
    text: "Schedule and venue context help frame short rest or travel pressure. Dedicated rest scores are shown only when the product provides them.",
    source: "Schedule and venue context",
  },
  {
    icon: TrendingUp,
    title: "Player or team trends",
    text: "Recent form, pitcher vulnerability, and reason text help explain why a matchup is worth inspecting.",
    source: "MLB research board rows",
  },
  {
    icon: HeartPulse,
    title: "Injury and lineup status",
    text: "Confirmed lineups are labeled differently from projected previews so you know what is official versus provisional.",
    source: "Lineup truth status",
  },
  {
    icon: History,
    title: "Historical matchup context",
    text: "Park factors, pitcher notes, and historical reason codes appear when enough inputs exist for that player-game row.",
    source: "MLB Stats API-backed research rows",
  },
];

export default function PremiumFeatures() {
  return (
    <section
      id="evidence"
      aria-labelledby="evidence-title"
      className="relative scroll-mt-20 border-t border-white/[0.05] bg-black py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            Evidence
          </span>

          <h2
            id="evidence-title"
            className="mt-8 text-balance text-4xl font-black tracking-tight text-white sm:text-5xl"
          >
            Evidence you can inspect — including what is incomplete.
          </h2>

          <p className="mt-6 text-lg leading-8 text-white/60">
            Each evidence type has a plain-English role, a source, and a freshness rule. If the
            feed does not have it, the board does not pretend it does.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {evidenceTypes.map(({ icon: Icon, title, text, source }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              className="rounded-[1.75rem] border border-white/[0.06] bg-ve-obsidian/80 p-7"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10">
                <Icon className="h-6 w-6 text-cyan-300" strokeWidth={1.8} />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/60">{text}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/35">
                Source: {source}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
