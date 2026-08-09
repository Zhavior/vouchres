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
      className="relative scroll-mt-20 border-t border-white/[0.06] bg-black py-20 sm:py-24"
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
            Evidence
          </span>

          <h2
            id="evidence-title"
            className="mt-5 text-balance text-3xl font-black tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.08]"
          >
            Evidence you can inspect — including what is incomplete.
          </h2>

          <p className="mt-4 text-[15px] leading-7 text-white/65">
            Each evidence type has a plain-English role, a source, and a freshness rule. If the
            feed does not have it, the board does not pretend it does.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {evidenceTypes.map(({ icon: Icon, title, text, source }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04, duration: 0.32 }}
              className="flex h-full flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors hover:border-cyan-300/25"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/18 to-emerald-400/10">
                  <Icon aria-hidden="true" className="h-5 w-5 text-cyan-200" strokeWidth={1.9} />
                </div>
                <h3 className="text-[15px] font-bold tracking-tight text-white">{title}</h3>
              </div>

              <p className="mt-3.5 text-[13px] leading-6 text-white/65">{text}</p>

              <p className="mt-auto pt-4 text-[11px] leading-4 text-white/35">
                <span className="font-semibold uppercase tracking-[0.1em]">Source</span> {source}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
