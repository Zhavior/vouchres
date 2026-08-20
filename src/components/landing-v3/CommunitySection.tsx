import { motion, useReducedMotion } from 'framer-motion';
import { Users, Trophy, MessageSquare, ArrowRight } from 'lucide-react';

export interface CommunitySectionProps {
  onExploreCommunity?: () => void;
}

export default function CommunitySection({ onExploreCommunity }: CommunitySectionProps) {
  const reduceMotion = useReducedMotion();

  const features = [
    {
      icon: Users,
      title: 'Shared Research Rationale',
      description: 'Review the evidence and reasoning other members choose to share before game time.',
    },
    {
      icon: Trophy,
      title: 'Decision History',
      description: 'Saved decisions can retain their original context and be compared with results when those results are available.',
    },
    {
      icon: MessageSquare,
      title: 'Signal Discussion',
      description: 'Debate matchups, pitcher changes, and weather impacts with researchers focused on empirical data.',
    },
  ];

  return (
    <section id="community" className="relative scroll-mt-20 border-t border-white/20 bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="text-center">
          <motion.span
            initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-400/10 px-3.5 py-1 text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase"
          >
            <Users aria-hidden="true" className="h-4 w-4" />
            COMMUNITY & CONSENSUS
          </motion.span>

          <motion.h2
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-balance text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]"
          >
            Research is stronger together.
          </motion.h2>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-5 max-w-3xl text-balance text-base sm:text-lg lg:text-xl leading-relaxed text-zinc-200"
          >
            Join sports researchers who value sourced evidence, candid missing-data states, and repeatable methodology over hype.
          </motion.p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={reduceMotion ? undefined : { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } } }}
          className="mt-14 grid gap-6 sm:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 22, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                className="rounded-none border border-white/20 bg-zinc-950 p-6 sm:p-8"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-none border border-white/20 bg-black">
                  <Icon aria-hidden="true" className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg sm:text-xl font-bold text-white tracking-wide">{feature.title}</h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-300">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {onExploreCommunity ? (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={onExploreCommunity}
              className="inline-flex items-center gap-3 border-2 border-white bg-white px-8 py-4 font-mono text-sm sm:text-base font-black uppercase tracking-wider text-black transition hover:bg-zinc-200 cursor-pointer rounded-none"
            >
              Explore the Community
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
