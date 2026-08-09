import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Scale,
  XCircle,
} from "lucide-react";

const ledgerFields = [
  {
    icon: FileText,
    title: "Original research timestamp",
    description: "When the decision was recorded, so later results can be compared honestly.",
  },
  {
    icon: Scale,
    title: "Original conclusion and confidence",
    description: "What you tracked and how strong the evidence looked at the time — not rewritten after the game.",
  },
  {
    icon: CheckCircle2,
    title: "Final result",
    description: "Correct and incorrect outcomes both remain visible. Wins are not the only stories kept.",
  },
  {
    icon: XCircle,
    title: "Missing-data notes",
    description: "If key inputs were unavailable before the game, that limitation stays part of the record.",
  },
];

export interface CommunitySectionProps {
  onExploreCommunity?: () => void;
}

export default function CommunitySection({
  onExploreCommunity,
}: CommunitySectionProps) {
  return (
    <section
      id="trust-ledger"
      aria-labelledby="trust-ledger-title"
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
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            Public results
          </span>

          <h2
            id="trust-ledger-title"
            className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            Track decisions. Keep the record — wins and losses.
          </h2>

          <p className="mt-6 text-lg leading-8 text-white/60">
            VouchEdge does not publish fabricated win rates on this page. After you track a
            decision in the product, your results workspace is designed to keep the original
            conclusion, confidence, final result, and missing-data notes.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {ledgerFields.map(({ icon: Icon, title, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-7"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
                <Icon className="h-6 w-6 text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 leading-7 text-white/60">{description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-white/8 bg-black/20 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-white">Methodology</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
            Research conclusions are graded against post-game outcomes after a decision is saved.
            This landing page intentionally shows no curated highlight reel of only successful
            examples. Open a beta account to use the results workspace with your own tracked
            decisions.
          </p>
          <button
            type="button"
            onClick={onExploreCommunity}
            className="group mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
          >
            Open beta and track a decision
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
