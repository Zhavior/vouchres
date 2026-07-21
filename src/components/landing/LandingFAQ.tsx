import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Z8_INTERACTIVE, Z8_PANEL_PREMIUM, Z8_LABEL } from '../../theme/z8Tokens';

const FAQS = [
  {
    question: 'Is VouchEdge a sportsbook?',
    answer:
      'No. VouchEdge is an intelligence and research platform. You cannot place bets or deposit funds here. We exist to provide transparent probability research and immutable record keeping.',
  },
  {
    question: 'How do the AI Judges work?',
    answer:
      'Our AI Judges (DS, PH, MR, RA) run specialized Monte Carlo simulations over thousands of data points daily—including park factors, weather, and batter vs. pitcher splits—to output a confident edge probability for each matchup.',
  },
  {
    question: 'Do you guarantee winning picks?',
    answer:
      'No. We provide probability research for entertainment purposes only. Sports are inherently unpredictable, and any platform claiming a "guaranteed lock" is lying. We publish wins and losses transparently so you always see the real record.',
  },
  {
    question: 'Can I cancel my Pro or Capper plan anytime?',
    answer:
      'Yes, absolutely. There are no long-term contracts. You can downgrade or cancel directly from your settings page with one click—no need to email support or call anyone.',
  },
  {
    question: 'Why do you ask for my experience level on signup?',
    answer:
      'We tailor your onboarding experience so you don\'t get overwhelmed. If you\'re new, we highlight basic probability tools. If you\'re a pro, we fast-track you to advanced edge signals and audience-building tools.',
  },
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-24 sm:px-6">
      <div className="text-center mb-12">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>Answers</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Frequently asked questions
        </h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`overflow-hidden rounded-2xl border transition-colors ${
                isOpen ? 'border-vouch-cyan/30 bg-vouch-cyan/5' : 'border-white/10 bg-black/40 hover:border-white/20'
              } ${Z8_PANEL_PREMIUM}`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className={`flex w-full items-center justify-between px-6 py-5 text-left ${Z8_INTERACTIVE}`}
              >
                <span className={`text-base font-bold ${isOpen ? 'text-white' : 'text-white/80'}`}>
                  {faq.question}
                </span>
                <ChevronDown
                  className={`ml-4 h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-vouch-cyan' : ''
                  }`}
                />
              </button>
              
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-5 pt-0 text-sm leading-relaxed text-white/60">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
