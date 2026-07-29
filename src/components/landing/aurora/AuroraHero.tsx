import { ArrowRight, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import VouchEdgeLogo from '../../brand/VouchEdgeLogo';
import LiveHud from '../hero/LiveHud';
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
    <section className="relative isolate min-h-[85vh] overflow-hidden border-b border-white/[0.05] bg-black">
      <AuroraBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(32,199,244,0.15),transparent_40%),linear-gradient(to_bottom,transparent_40%,#000_100%)]" />

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

      <div id="top" className="relative z-10 mx-auto flex max-w-[1400px] flex-col items-center px-5 pb-32 pt-28 text-center sm:px-6 lg:px-8 lg:pb-40 lg:pt-36">
        {/* Main Hero Header Stack - PERFECTLY CENTERED */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-4xl flex-col items-center justify-center text-center mx-auto"
        >
          {/* High-Tech Status Pill */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-950/60 via-black/80 to-emerald-950/60 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-300 shadow-[0_0_24px_rgba(0,240,255,0.25)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span>VouchEdge Intel Engine v3.4 • Open Beta</span>
          </div>

          {/* Eye-catching Responsive Headline */}
          <h1 className="mt-8 text-balance text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-[104px]">
            The game begins.
            <span className="mt-3 block bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(34,211,238,0.4)]">
              Before the first pitch.
            </span>
          </h1>

          {/* Subtitle - Explicitly Centered */}
          <p className="mt-7 max-w-2xl text-pretty text-base leading-relaxed text-white/70 sm:text-xl sm:leading-8 mx-auto">
            Live sports intelligence that reveals every signal, every reason, and every result before the game unfolds.
          </p>

          {/* CTA Buttons - Explicitly Centered */}
          <div className="mt-9 flex w-full max-w-md flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row mx-auto">
            <button
              type="button"
              onClick={onJoinBeta}
              className="group inline-flex min-h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-300 px-8 text-base font-black text-[#031017] shadow-[0_0_36px_rgba(34,211,238,0.35)] transition-all hover:scale-[1.02] hover:bg-cyan-300 hover:shadow-[0_0_54px_rgba(34,211,238,0.5)] active:scale-[0.98]"
            >
              Join Open Beta
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={onViewDemo}
              className="min-h-14 w-full sm:w-auto rounded-2xl border border-white/15 bg-white/[0.05] px-7 text-base font-semibold text-white transition-all hover:border-cyan-400/40 hover:bg-white/[0.09] hover:shadow-[0_0_24px_rgba(255,255,255,0.08)] active:scale-[0.98]"
            >
              See live research preview
            </button>
          </div>

          {/* Trust points - Explicitly Centered */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mx-auto text-center">
            {trustPoints.map((point) => (
              <span key={point} className="inline-flex items-center gap-2 text-xs font-medium text-white/60 sm:text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                {point}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Hero Interactive Terminal Showcase - CENTERED */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 36 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.15, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-14 w-full max-w-3xl"
        >
          {/* Background Ambient Glow */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-emerald-500/20 blur-[80px]" />
          
          {/* Console Container */}
          <div className="relative">
            <LiveHud />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
