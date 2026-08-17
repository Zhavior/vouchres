import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Scale,
  XCircle,
} from "lucide-react";

const ledgerFields = [
  {
    icon: Clock,
    title: "Original research timestamp",
    description: "When the decision was recorded, so later results can be compared honestly.",
  },
  {
    icon: Scale,
    title: "Original conclusion and confidence",
    description:
      "What you tracked and how strong the evidence looked at the time — not rewritten after the game.",
  },
  {
    icon: CheckCircle2,
    title: "Final result",
    description:
      "Correct and incorrect outcomes both remain visible. Wins are not the only stories kept.",
  },
  {
    icon: XCircle,
    title: "Missing-data notes",
    description:
      "If key inputs were unavailable before the game, that limitation stays part of the record.",
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
      className="relative scroll-mt-20 border-t border-white/[0.06] bg-black py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              Public results
            </span>

            <h2
              id="trust-ledger-title"
              className="mt-5 text-balance text-3xl font-black tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.08]"
            >
              Track decisions. Keep the record — wins and losses.
            </h2>

            <p className="mt-4 text-[15px] leading-7 text-white/65">
              VouchEdge does not publish fabricated win rates on this page. After you track a
              decision in the product, your results workspace keeps the original conclusion,
              confidence, final result, and missing-data notes.
            </p>

            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-center gap-2.5">
                <FileText aria-hidden="true" className="h-4 w-4 text-emerald-200" />
                <h3 className="text-[15px] font-bold text-white">Methodology</h3>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-white/60">
                Research conclusions are graded against post-game outcomes after a decision is
                saved. This page intentionally shows no curated highlight reel of only successful
                examples.
              </p>
              <button
                type="button"
                onClick={onExploreCommunity}
                className="group mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/15"
              >
                Open beta and track a decision
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </motion.div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute left-[19px] top-3 bottom-3 hidden w-px bg-gradient-to-b from-emerald-300/30 via-white/10 to-transparent sm:block"
            />
            <div className="space-y-3">
              {ledgerFields.map(({ icon: Icon, title, description }, index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                  className="relative flex gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors hover:border-emerald-300/25"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ve-graphite">
                    <Icon aria-hidden="true" className="h-4.5 w-4.5 text-emerald-200" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-white">{title}</h3>
                    <p className="mt-1.5 text-[13px] leading-6 text-white/65">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
