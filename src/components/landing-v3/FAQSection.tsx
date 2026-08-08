import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const faqs = [
  {
    question: "What is VouchEdge?",
    answer:
      "VouchEdge is a premium sports intelligence platform designed to help you research games, players and trends through transparent, evidence-based insights.",
  },
  {
    question: "Is this a sportsbook?",
    answer:
      "No. VouchEdge is focused on sports intelligence, research and decision support. It does not operate as a sportsbook.",
  },
  {
    question: "Which sports are supported?",
    answer:
      "The platform begins with MLB and expands to additional leagues including NBA, NFL and more as the platform evolves.",
  },
  {
    question: "What does Aurora do?",
    answer:
      "Aurora organizes research into a structured workflow that highlights confidence, historical context and supporting evidence.",
  },
];

export default function FAQSection() {
  return (
    <section className="relative border-t border-white/6 bg-ve-obsidian py-32">
      <div className="mx-auto max-w-5xl px-6">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .45 }}
          className="text-center"
        >
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">
            FAQ
          </span>

          <h2 className="mt-6 text-5xl font-semibold tracking-tight text-white">
            Frequently asked questions
          </h2>

          <p className="mt-8 text-lg text-white/60">
            Everything you need to know before joining VouchEdge.
          </p>
        </motion.div>

        <div className="mt-20 space-y-5">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * .06,
                duration: .35,
              }}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-7 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {faq.question}
                </h3>

                <ChevronRight className="h-5 w-5 text-blue-400" />
              </div>

              <p className="mt-5 leading-7 text-white/60">
                {faq.answer}
              </p>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
