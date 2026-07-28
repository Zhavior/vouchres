import { ArrowRight, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import VouchEdgeLogo from '../../brand/VouchEdgeLogo';
import AuroraBackground from './AuroraBackground';

type AuroraHeroProps = {
  onJoinBeta: () => void;
  onLogin: () => void;
  onViewDemo: () => void;
};

const trustPoints = [
  'Official game context',
  'Transparent reasoning',
  'Results stay visible',
] as const;

export default function AuroraHero({ onJoinBeta, onLogin, onViewDemo }: AuroraHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate min-h-[760px] overflow-hidden border-b border-white/[0.07] bg-[#04070b]">
      <AuroraBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(32,199,244,0.13),transparent_34%),linear-gradient(to_bottom,transparent_55%,#04070b_100%)]" />

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
          <a href="#live-intelligence" className="transition hover:text-white">Live research</a>
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
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

      <div id="top" className="relative z-10 mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:pb-32 lg:pt-28">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
            <Sparkles className="h-4 w-4" />
            VouchEdge is entering Open Beta
          </div>

          <h1 className="mt-8 max-w-3xl text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
            Research the game.
            <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
              Keep the evidence.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-white/58 sm:text-xl">
            Live sports context, transparent research, and a record that keeps every result visible—built for fans who want evidence before confidence.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onJoinBeta}
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-7 text-base font-black text-[#031017] transition hover:bg-cyan-300 hover:shadow-[0_0_48px_rgba(34,211,238,0.22)]"
            >
              Join Open Beta
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={onViewDemo}
              className="min-h-14 rounded-2xl border border-white/12 bg-white/[0.04] px-7 text-base font-semibold text-white/80 transition hover:border-white/22 hover:bg-white/[0.07] hover:text-white"
            >
              See the live research preview
            </button>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {trustPoints.map((point) => (
              <span key={point} className="inline-flex items-center gap-2 text-sm text-white/48">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                {point}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.14, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="absolute inset-10 rounded-full bg-cyan-400/15 blur-[90px]" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07101b]/90 p-7 shadow-[0_32px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
              <VouchEdgeLogo showBeta markClassName="h-12 w-12" />
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)] motion-reduce:animate-none" />
            </div>
            <div className="mt-7 space-y-4">
              {[
                ['01', 'Collect verified context', 'Lineups, status, and matchup conditions'],
                ['02', 'Make the reasoning visible', 'Signals stay attached to their evidence'],
                ['03', 'Keep the result', 'Wins and losses remain part of the record'],
              ].map(([step, title, detail]) => (
                <div key={step} className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <span className="font-mono text-xs font-bold text-cyan-300">{step}</span>
                  <span>
                    <span className="block font-semibold text-white">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-white/42">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
