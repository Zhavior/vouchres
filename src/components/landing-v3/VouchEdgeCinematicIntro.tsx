import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

type IntroStage = 'amplify' | 'cinema' | 'complete';

type Props = {
  onComplete?: () => void;
};

export default function VouchEdgeCinematicIntro({ onComplete }: Props) {
  const [stage, setStage] = useState<IntroStage>('amplify');
  const [isDismissed, setIsDismissed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const dismiss = () => {
    setIsDismissed(true);
    setStage('complete');
    onComplete?.();
  };

  useEffect(() => {
    // Stage 1: Brand Amplify (0 to 1.6s)
    const t1 = setTimeout(() => {
      setStage((curr) => (curr === 'amplify' ? 'cinema' : curr));
    }, 1600);

    // Stage 2: Big Square Video with Sport Matrix (1.6s to 5.6s = 4.0s)
    const t2 = setTimeout(() => {
      dismiss();
    }, 5600);

    // Immediate dismissal on natural user scroll (zero scroll interference)
    const onScroll = () => {
      if (window.scrollY > 30) {
        dismiss();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {stage !== 'complete' && (
        <motion.div
          key="cinematic-intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)', transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl px-4 select-none"
        >
          {/* Ambient Obsidian & Aurora Glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08)_0%,rgba(0,0,0,0.95)_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_4px)]" />

          {/* ── STAGE 1: AMPLIFIED BRAND LOGO & WORDMARK ────────────────────────── */}
          <AnimatePresence mode="wait">
            {stage === 'amplify' && (
              <motion.div
                key="stage-amplify"
                initial={{ opacity: 0, scale: 0.88, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.12, filter: 'blur(10px)', transition: { duration: 0.45 } }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center justify-center text-center max-w-xl"
              >
                {/* Amplified Aurora Emblem with Pulse */}
                <div className="relative mb-6">
                  <div className="absolute -inset-10 rounded-full bg-cyan-400/25 blur-3xl animate-pulse" />
                  <img
                    src="/vouchedge-mark-aurora.svg"
                    alt="VouchEdge Logo"
                    className="relative h-28 w-28 sm:h-36 sm:w-36 drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]"
                  />
                  <div className="absolute -inset-2 border border-cyan-400/30 animate-ping opacity-25" />
                </div>

                {/* Heavy Wordmark in Obsidian & Silver Finish */}
                <h1 className="font-mono text-4xl sm:text-6xl font-black tracking-[0.25em] text-white uppercase drop-shadow-2xl">
                  VOUCH<span className="text-cyan-400">EDGE</span>
                </h1>

                <div className="mt-4 flex items-center gap-3 font-mono text-[10px] sm:text-xs text-zinc-400 tracking-[0.25em] uppercase">
                  <span className="h-1.5 w-1.5 bg-emerald-400 animate-pulse" />
                  <span>DECISION INTELLIGENCE PROTOCOL</span>
                  <span className="h-1.5 w-1.5 bg-cyan-400 animate-pulse" />
                </div>
              </motion.div>
            )}

            {/* ── STAGE 2: 4-SECOND BIG SQUARE VIDEO & MULTI-SPORT RADAR ───────── */}
            {stage === 'cinema' && (
              <motion.div
                key="stage-cinema"
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.4 } }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center w-full max-w-xl"
              >
                {/* Header Status Strip */}
                <div className="w-full flex items-center justify-between border-t border-x border-cyan-400/40 bg-zinc-950/90 px-3.5 py-2 font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
                    <span className="text-white font-bold tracking-widest">VOUCHEDGE // LIVE FEED</span>
                  </div>
                  <span className="text-cyan-300 font-bold">OPTICAL 60FPS</span>
                </div>

                {/* Big Square Video Cinema Viewport */}
                <div className="relative aspect-square w-full max-h-[50vh] sm:max-h-[56vh] bg-black border border-cyan-400/50 overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.25)]">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/media/optimized/vouchedge-landing-poster.jpg"
                  >
                    <source src="/media/vouchedge-landing-60fps.mp4" type="video/mp4" />
                    <source src="/media/optimized/vouchedge-landing-desktop.mp4" type="video/mp4" />
                  </video>

                  {/* Optical Reticle Overlays */}
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
                    <span className="absolute inset-x-0 top-1/2 border-t border-cyan-400/25" />
                    <span className="absolute inset-y-0 left-1/2 border-l border-cyan-400/25" />
                    <span className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-cyan-400" />
                    <span className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-cyan-400" />
                    <span className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-cyan-400" />
                    <span className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-cyan-400" />
                    <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 border border-cyan-400/70" />
                  </div>

                  {/* 4-Second Progress Bar */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-800 z-20">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 4.0, ease: 'linear' }}
                      className="h-full bg-cyan-400"
                    />
                  </div>
                </div>

                {/* ── MULTI-SPORT PROTOCOL RADAR ───────────────────────────── */}
                <div className="w-full grid grid-cols-3 gap-2 mt-3 font-mono">
                  {/* MLB: Active Live Beta */}
                  <div className="border border-emerald-400/50 bg-emerald-950/30 p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white font-bold flex items-center gap-1.5">
                        ⚾ MLB
                      </span>
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[9px]">
                      <span className="text-emerald-300 font-bold uppercase tracking-wider">RESEARCH</span>
                      <span className="border border-emerald-400/50 px-1 py-0.5 text-emerald-300 font-black text-[8px] bg-emerald-950">
                        LIVE BETA
                      </span>
                    </div>
                  </div>

                  {/* NHL: Coming Soon */}
                  <div className="border border-zinc-800 bg-zinc-950/80 p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-300 font-bold flex items-center gap-1.5">
                        🏒 NHL
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono">🔒</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[9px]">
                      <span className="text-zinc-500 uppercase tracking-wider">PUCK PROPS</span>
                      <span className="border border-zinc-700 px-1 py-0.5 text-zinc-400 font-bold text-[8px] bg-zinc-900">
                        SOON
                      </span>
                    </div>
                  </div>

                  {/* NFL: Coming Soon */}
                  <div className="border border-zinc-800 bg-zinc-950/80 p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-300 font-bold flex items-center gap-1.5">
                        🏈 NFL
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono">🔒</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[9px]">
                      <span className="text-zinc-500 uppercase tracking-wider">GRIDIRON</span>
                      <span className="border border-zinc-700 px-1 py-0.5 text-zinc-400 font-bold text-[8px] bg-zinc-900">
                        SOON
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skip / Enter Action Strip */}
                <div className="w-full flex items-center justify-between mt-3 font-mono text-[10px]">
                  <span className="text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="animate-pulse text-cyan-400">↓</span> Scroll to explore
                  </span>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="border border-white/30 bg-white/10 hover:bg-white hover:text-black text-white px-3.5 py-1.5 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    ENTER HUD →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
