import { motion } from "framer-motion";

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
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative scroll-mt-20 border-t border-white/6 bg-ve-obsidian py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            FAQ
          </span>

          <h2 id="faq-title" className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Questions skeptical visitors ask first
          </h2>

          <p className="mt-6 text-lg text-white/60">
            Clear answers about what VouchEdge is — and what it is not.
          </p>
        </motion.div>

        <div className="mt-14 space-y-4">
          {faqs.map((faq, index) => (
            <motion.details
              key={faq.question}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
              className="group rounded-3xl border border-white/8 bg-white/[0.03] p-6 open:bg-white/[0.04]"
            >
              <summary className="cursor-pointer list-none text-left text-lg font-semibold text-white marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {faq.question}
                  <span className="text-cyan-300 transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-4 leading-7 text-white/60">{faq.answer}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
