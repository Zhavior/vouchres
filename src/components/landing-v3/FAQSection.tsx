import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const faqs = [
  {
    question: "What is VouchEdge?",
    answer:
      "VouchEdge is an MLB-first sports research platform. It helps you inspect matchup context, trends, official game data, confidence indicators, evidence, and post-game results in one workspace.",
  },
  {
    question: "Who is it for?",
    answer:
      "MLB bettors and serious sports researchers who want evidence before making a decision.",
  },
  {
    question: "Is it a sportsbook?",
    answer:
      "No. VouchEdge is not a sportsbook. It does not take bets and does not promise guaranteed betting success.",
  },
  {
    question: "What does confidence mean?",
    answer:
      "Confidence represents how strongly the available evidence supports the current research conclusion. It is not a guarantee of the outcome.",
  },
  {
    question: "What data sources are used?",
    answer:
      "Today’s public landing preview uses the VouchEdge MLB schedule feed and, when available, linked HR research board rows built from MLB Stats API-backed inputs. Individual evidence fields appear only when those payloads include them.",
  },
  {
    question: "What is available during beta?",
    answer:
      "During the open beta you can create a free account, open today’s MLB research board, inspect evidence, track decisions, and compare them with final results. No card is required while the free beta is active.",
  },
  {
    question: "What happens after beta?",
    answer:
      "Future pricing will be communicated clearly before the beta ends. You will not be charged without explicit consent.",
  },
  {
    question: "Does VouchEdge guarantee results?",
    answer:
      "No. VouchEdge does not guarantee profits, betting success, or prediction accuracy. Research can be wrong, evidence can be incomplete, and outcomes remain uncertain.",
  },
];

export default function FAQSection() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative scroll-mt-20 border-t border-white/[0.06] bg-ve-obsidian py-20 sm:py-24"
    >
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl"
        >
          <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
            FAQ
          </span>

          <h2
            id="faq-title"
            className="mt-5 text-3xl font-black tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.08]"
          >
            Questions skeptical visitors ask first
          </h2>

          <p className="mt-4 text-[15px] leading-7 text-white/65">
            Clear answers about what VouchEdge is — and what it is not.
          </p>
        </motion.div>

        <div className="mt-10 min-h-[36rem] divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] sm:min-h-[32rem]">
          {faqs.map((faq, index) => (
            <motion.details
              key={faq.question}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className="group px-5 py-4 transition-colors open:bg-white/[0.03] sm:px-6"
              open={openQuestion === faq.question}
              onMouseEnter={(event) => {
                const current = event.currentTarget;
                const accordion = current.parentElement;
                accordion?.querySelectorAll('details[open]').forEach((item) => {
                  if (item !== current) item.removeAttribute('open');
                });
                current.open = true;
                setOpenQuestion(faq.question);
              }}
            >
              <summary className="cursor-pointer list-none text-left text-[15px] font-semibold text-white marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="text-lg leading-none text-emerald-300 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <AnimatePresence initial={false}>
                {openQuestion === faq.question && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.75 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 max-w-3xl text-[14px] leading-7 text-white/65">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
