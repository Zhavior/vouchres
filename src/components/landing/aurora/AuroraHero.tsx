import { ArrowRight, LogIn, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import VouchEdgeLogo from '../../brand/VouchEdgeLogo';
import HeroResearchCard from '../../landing-v3/HeroResearchCard';
import AuroraBackground from './AuroraBackground';

type AuroraHeroProps = {
  onJoinBeta: () => void;
  onLogin: () => void;
  onViewDemo: () => void;
};

const trustPoints = [
  'For MLB bettors and serious researchers',
  'Evidence before the decision',
  'Free during open beta',
] as const;

export default function AuroraHero({ onJoinBeta, onLogin, onViewDemo }: AuroraHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.05] bg-black">
      <AuroraBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(32,199,244,0.14),transparent_42%),linear-gradient(to_bottom,transparent_45%,#000_100%)]" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <motion.a
          href="#top"
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="min-w-0"
          aria-label="VouchEdge home"
        >
          <VouchEdgeLogo
            showBeta
            markClassName="h-9 w-9 sm:h-10 sm:w-10"
            betaClassName="hidden sm:inline-block"
          />
        </motion.a>

        <div className="hidden items-center gap-7 text-sm font-medium text-white/55 md:flex">
          <a href="#research-preview" className="transition hover:text-white">
            Research preview
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <a href="#pricing" className="transition hover:text-white">
            Beta
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onLogin}
            aria-label="Log in"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:text-white sm:px-4"
          >
            <LogIn aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Log in</span>
          </button>
          <button
            type="button"
            onClick={onJoinBeta}
            className="min-h-11 whitespace-nowrap rounded-xl bg-emerald-400 px-3.5 text-sm font-black text-[#031017] transition hover:bg-emerald-300 sm:px-4"
          >
            Join Beta
          </button>
        </div>
      </nav>

      <div
        id="top"
        className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-12 px-5 pb-20 pt-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-20"
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-col text-center lg:text-left"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/90">
            MLB research workspace
          </p>

          <h1 className="mt-5 text-balance text-[2.6rem] font-black leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-[4.1rem]">
            Research every MLB matchup before first pitch.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-white/75 sm:text-lg sm:leading-8 lg:mx-0">
            VouchEdge combines official game data, matchup context, trends, and transparent
            reasoning in one research workspace.
          </p>

          <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center lg:mx-0 lg:max-w-none">
            <button
              type="button"
              onClick={onJoinBeta}
              className="group inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-300 to-emerald-300 px-7 text-base font-black text-[#03131a] shadow-[0_0_32px_-6px_rgba(0,217,160,0.55)] transition hover:brightness-110 sm:w-auto"
            >
              Explore Today&apos;s MLB Board
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={onViewDemo}
              className="min-h-14 w-full rounded-2xl border border-white/15 px-6 text-base font-semibold text-white/90 transition hover:border-emerald-300/50 hover:bg-white/[0.05] hover:text-white sm:w-auto"
            >
              View a Real Research Example
            </button>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 lg:justify-start">
            {trustPoints.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/65"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                {point}
              </span>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-white/45 lg:mx-0">
            After you create a free beta account you land on today&apos;s research board — not an
            empty dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <HeroResearchCard onOpenPreview={onViewDemo} />
        </motion.div>
      </div>
    </section>
  );
}
