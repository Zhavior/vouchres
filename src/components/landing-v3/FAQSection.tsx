import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const reduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How is VouchEdge different from pick sellers or projection sites?',
      answer:
        'VouchEdge is an MLB-first research workspace, not a sportsbook. It organizes available matchup evidence, confidence context, and missing-data notes without promising guaranteed outcomes.',
    },
    {
      question: 'What happens to missing or unverified data?',
      answer:
        'Missing inputs stay visibly missing. If lineup status is unconfirmed, bullpen availability is unknown, or weather data is unavailable, the system flags the gap with yellow or gray indicators rather than filling it with guesses or synthetic values.',
    },
    {
      question: 'What is the "pre-game thesis lock"?',
      answer:
        'When you save a supported pre-game decision, VouchEdge retains the original conclusion and evidence snapshot so it can be reviewed beside the result later. The landing preview does not claim that a record exists until one is actually saved.',
    },
    {
      question: 'Is VouchEdge free during the beta?',
      answer:
        'The current open beta is free and requires no card. Future pricing will be communicated clearly before the beta ends, and you will not be charged without explicit consent.',
    },
    {
      question: 'Where does the data come from?',
      answer:
        'The public landing preview uses the VouchEdge MLB schedule feed and, when available, linked research-board rows built from MLB Stats API-backed inputs. Fields remain unavailable when the returned payload does not include them.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="relative scroll-mt-20 border-t border-white/20 bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center">
          <motion.span
            initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-400/10 px-3.5 py-1 text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase"
          >
            <HelpCircle aria-hidden="true" className="h-4 w-4" />
            FREQUENTLY ASKED QUESTIONS
          </motion.span>

          <motion.h2
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-balance text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]"
          >
            Everything you need to know.
          </motion.h2>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-5 max-w-3xl text-balance text-base sm:text-lg lg:text-xl leading-relaxed text-zinc-200"
          >
            Honest answers about our methodology, data sources, and beta program.
          </motion.p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={reduceMotion ? undefined : { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
          className="mt-14 divide-y divide-white/10 rounded-none border-2 border-white/20 bg-zinc-950"
        >
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={faq.question}
                variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } }}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-6 sm:p-8 text-left transition hover:bg-white/5 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-lg sm:text-xl font-bold text-white tracking-wide pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 sm:px-8 sm:pb-8 text-base sm:text-lg leading-relaxed text-zinc-300">
                        {faq.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
