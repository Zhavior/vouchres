import { ArrowRight, LogIn, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import VouchEdgeLogo from '../../brand/VouchEdgeLogo';
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
    <section className="relative isolate min-h-[85vh] overflow-hidden border-b border-white/[0.05] bg-black">
      <AuroraBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(32,199,244,0.14),transparent_42%),linear-gradient(to_bottom,transparent_45%,#000_100%)]" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <motion.a
          href="#top"
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          aria-label="VouchEdge home"
        >
          <VouchEdgeLogo showBeta />
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:text-white sm:px-4"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Log in</span>
          </button>
          <button
            type="button"
            onClick={onJoinBeta}
            className="min-h-11 rounded-xl bg-cyan-400 px-4 text-sm font-black text-[#031017] transition hover:bg-cyan-300"
          >
            Join Beta
          </button>
        </div>
      </nav>

      <div
        id="top"
        className="relative z-10 mx-auto flex max-w-[1400px] flex-col items-center px-5 pb-24 pt-24 text-center sm:px-6 lg:px-8 lg:pb-32 lg:pt-32"
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/90">
            VouchEdge
          </p>

          <h1 className="mt-6 text-balance text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Research every MLB matchup before first pitch.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/70 sm:text-xl sm:leading-8">
            VouchEdge combines official game data, matchup context, trends, and transparent
            reasoning in one research workspace.
          </p>

          <div className="mx-auto mt-9 flex w-full max-w-xl flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={onJoinBeta}
              className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-8 text-base font-black text-[#031017] transition hover:bg-cyan-300 sm:w-auto"
            >
              Explore Today&apos;s MLB Board
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={onViewDemo}
              className="min-h-14 w-full rounded-2xl border border-white/15 bg-white/[0.05] px-7 text-base font-semibold text-white transition hover:border-cyan-400/40 hover:bg-white/[0.09] sm:w-auto"
            >
              View a Real Research Example
            </button>
          </div>

          <div className="mx-auto mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
            {trustPoints.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-2 text-xs font-medium text-white/60 sm:text-sm"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                {point}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-14 w-full max-w-3xl"
        >
          <div className="absolute inset-6 rounded-full bg-cyan-500/10 blur-[70px]" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#070b12]/80 px-6 py-8 text-left shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
              What you can do before signup
            </p>
            <p className="mt-3 text-lg font-semibold text-white sm:text-xl">
              Inspect today&apos;s slate, open a research example, and see how evidence and
              confidence are labeled.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base sm:leading-7">
              After you create a free beta account, you land on today&apos;s research board — not
              an empty dashboard — so you can open a matchup, review evidence, and track a
              decision.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
