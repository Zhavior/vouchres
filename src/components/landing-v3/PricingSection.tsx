import { motion, useReducedMotion } from 'framer-motion';
import { Check, Zap, Sparkles } from 'lucide-react';

export interface PricingSectionProps {
  onJoinBeta?: () => void;
}

export default function PricingSection({ onJoinBeta }: PricingSectionProps) {
  const reduceMotion = useReducedMotion();

  const tiers = [
    {
      name: 'BETA ACCESS',
      badge: 'CURRENTLY FREE',
      price: '$0',
      period: 'during open beta',
      description: 'Create a free account and use the research tools currently available in the open beta.',
      features: [
        'Today’s MLB schedule and linked research evidence',
        'Explicit available, partial, and unavailable states',
        'Pre-game decision tracking where supported',
        'Post-game comparison when results are available',
        'Community and account tools included in beta',
      ],
      cta: 'OPEN FREE BETA',
      highlighted: true,
      futurePrice: 'Future pricing will be communicated before the beta ends. No card is required for the current free beta.',
    },
  ];

  return (
    <section id="pricing" className="relative scroll-mt-20 border-t border-white/20 bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="text-center">
          <motion.span
            initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-400/10 px-3.5 py-1 text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase"
          >
            <Zap aria-hidden="true" className="h-4 w-4" />
            TRANSPARENT PRICING
          </motion.span>

          <motion.h2
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-balance text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]"
          >
            No hidden tiers. Full access.
          </motion.h2>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-5 max-w-3xl text-balance text-base sm:text-lg lg:text-xl leading-relaxed text-zinc-200"
          >
            Free beta access is active now. Future pricing will be communicated before any paid plan is offered.
          </motion.p>
        </div>

        <div className="mx-auto mt-14 max-w-xl">
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              initial={reduceMotion ? undefined : { opacity: 0, y: 24, scale: 0.98 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-none border-2 border-white/30 bg-zinc-950 p-8 sm:p-12 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-black uppercase tracking-widest text-zinc-300">
                  {tier.name}
                </span>
                <span className="inline-flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-950/40 px-3 py-1 font-mono text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                  {tier.badge}
                </span>
              </div>

              <div className="mt-8 flex items-baseline gap-3">
                <span className="font-mono text-6xl sm:text-8xl font-black tracking-tight text-white">
                  {tier.price}
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-zinc-400">
                  / {tier.period}
                </span>
              </div>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-300">
                {tier.description}
              </p>

              <ul className="mt-8 space-y-4 border-t border-white/15 pt-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3.5 text-sm sm:text-base font-semibold text-zinc-200">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-none border border-emerald-400/40 bg-emerald-950/50">
                      <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-300" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <button
                  type="button"
                  onClick={onJoinBeta}
                  className="w-full border-2 border-white bg-white py-4 sm:py-5 px-8 font-mono text-sm sm:text-base font-black uppercase tracking-wider text-black transition hover:bg-zinc-200 cursor-pointer rounded-none"
                >
                  {tier.cta}
                </button>
              </div>

              <p className="mt-5 text-center font-mono text-xs text-zinc-400 leading-normal">
                {tier.futurePrice}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
