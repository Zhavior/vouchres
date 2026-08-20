import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { useAuthSession } from '../../lib/authSessionStore';

type Props = {
  onComplete?: () => void;
  username?: string | null;
};

export default function VouchEdgeLoginIntro({ onComplete, username: explicitUsername }: Props) {
  const [phase, setPhase] = useState<'logging_in' | 'welcome' | 'done'>('logging_in');
  
  // Resolve specialized username from store, session, or explicit prop
  const profile = useProfileStore((s) => s.profile);
  const authSession = useAuthSession();
  
  const resolvedUsername = 
    explicitUsername ||
    profile?.username ||
    profile?.handle ||
    profile?.displayName ||
    authSession.session?.user?.user_metadata?.username ||
    authSession.session?.user?.user_metadata?.display_name ||
    authSession.session?.user?.email?.split('@')[0] ||
    'OPERATOR';

  useEffect(() => {
    // 0.0s -> 0.9s: "LOGGING IN..."
    const t1 = setTimeout(() => {
      setPhase('welcome');
    }, 900);

    // 0.9s -> 2.4s: "WELCOME, @USERNAME" -> Complete
    const t2 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="vouchedge-login-intro"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-4 select-none"
      >
        {/* Ambient Obsidian & Aurora Telemetry Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12)_0%,rgba(0,0,0,0.98)_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0px,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_4px)]" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-md w-full">
          {/* Amplified Aurora Emblem with Specular Flare */}
          <div className="relative mb-5">
            <div className="absolute -inset-10 rounded-full bg-cyan-400/25 blur-3xl animate-pulse" />
            <img
              src="/vouchedge-mark-aurora.svg"
              alt="VouchEdge Emblem"
              className="relative h-24 w-24 sm:h-28 sm:w-28 drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]"
            />
            <div className="absolute -inset-2 border border-cyan-400/40 animate-ping opacity-20" />
          </div>

          {/* Heavy Metallic Chrome Wordmark */}
          <h1 className="font-mono text-3xl sm:text-4xl font-black tracking-[0.25em] text-white uppercase drop-shadow-2xl">
            VOUCH<span className="text-cyan-400">EDGE</span>
          </h1>

          {/* Dynamic Status: LOGGING IN -> WELCOME @USERNAME */}
          <div className="mt-5 min-h-[76px] flex flex-col items-center justify-center w-full">
            <AnimatePresence mode="wait">
              {phase === 'logging_in' ? (
                <motion.div
                  key="logging-in"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-1.5 font-mono"
                >
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold tracking-[0.25em] text-cyan-300 uppercase">
                    <span className="h-2 w-2 bg-cyan-400 rounded-full animate-ping" />
                    <span>LOGGING IN...</span>
                  </div>
                  <span className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                    AUTHENTICATING TELEMETRY SESSION
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-2 font-mono w-full"
                >
                  <div className="flex items-center gap-2 text-sm sm:text-base font-black tracking-[0.2em] text-emerald-400 uppercase">
                    <span className="h-2.5 w-2.5 bg-emerald-400 rounded-none animate-pulse" />
                    <span>WELCOME, <strong className="text-white">@{resolvedUsername}</strong></span>
                  </div>

                  {/* Operator Clearance Badge */}
                  <div className="inline-flex items-center gap-2 border border-emerald-400/40 bg-emerald-950/40 px-3 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span>ACCESS GRANTED // CLEARANCE: OPERATOR</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── MULTI-SPORT PROTOCOL RADAR (WITHOUT VIDEO) ────────────────────── */}
          <div className="w-full grid grid-cols-3 gap-2 mt-5 font-mono">
            {/* MLB: Active Live Beta */}
            <div className="border border-emerald-400/50 bg-emerald-950/40 p-2.5 flex flex-col justify-between text-left shadow-[0_0_20px_rgba(52,211,153,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white font-bold flex items-center gap-1">
                  ⚾ MLB
                </span>
                <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[8px]">
                <span className="text-emerald-300 font-bold uppercase tracking-wider">RESEARCH</span>
                <span className="border border-emerald-400/60 px-1 py-0.5 text-emerald-300 font-black bg-emerald-950">
                  LIVE BETA
                </span>
              </div>
            </div>

            {/* NHL: Coming Soon */}
            <div className="border border-zinc-800 bg-zinc-950/90 p-2.5 flex flex-col justify-between text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-300 font-bold flex items-center gap-1">
                  🏒 NHL
                </span>
                <span className="text-[10px] text-zinc-600 font-mono">🔒</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[8px]">
                <span className="text-zinc-500 uppercase tracking-wider">PUCK PROPS</span>
                <span className="border border-zinc-700 px-1 py-0.5 text-zinc-400 font-bold bg-zinc-900">
                  SOON
                </span>
              </div>
            </div>

            {/* NFL: Coming Soon */}
            <div className="border border-zinc-800 bg-zinc-950/90 p-2.5 flex flex-col justify-between text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-300 font-bold flex items-center gap-1">
                  🏈 NFL
                </span>
                <span className="text-[10px] text-zinc-600 font-mono">🔒</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[8px]">
                <span className="text-zinc-500 uppercase tracking-wider">GRIDIRON</span>
                <span className="border border-zinc-700 px-1 py-0.5 text-zinc-400 font-bold bg-zinc-900">
                  SOON
                </span>
              </div>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full h-1 bg-zinc-900 overflow-hidden mt-5 border border-white/10">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.2, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
