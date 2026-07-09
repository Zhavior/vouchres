import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from '../../lib/motion';
import { LANDING_JUDGES } from '../../constants/aiJudges';
import JudgePixelIcon from '../judges/JudgePixelIcon';
import { Z8_LABEL, Z8_PANEL_PREMIUM } from '../../theme/z8Tokens';

interface AuthJudgeWelcomeProps {
  /** Compact strip only — for narrow layouts or wizard steps */
  compact?: boolean;
  className?: string;
}

const ROTATE_MS = 5200;

export default function AuthJudgeWelcome({ compact = false, className = '' }: AuthJudgeWelcomeProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const judge = LANDING_JUDGES[activeIndex];

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % LANDING_JUDGES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-center gap-1.5">
          {LANDING_JUDGES.map((j, i) => (
            <button
              key={j.id}
              type="button"
              aria-label={`${j.displayName} — ${j.specialty}`}
              onClick={() => setActiveIndex(i)}
              className={`rounded-lg p-0.5 transition-all ${
                i === activeIndex
                  ? 'ring-1 ring-vouch-cyan/50 bg-vouch-cyan/10'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <JudgePixelIcon code={j.code} size="sm" />
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={judge.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-center text-[11px] leading-relaxed text-white/50"
          >
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-vouch-cyan/70">
              {judge.code}
            </span>
            {' — '}
            <span className="italic text-white/60">&ldquo;{judge.authTip}&rdquo;</span>
          </motion.p>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <aside
      className={`relative flex flex-col justify-between overflow-hidden p-6 ${Z8_PANEL_PREMIUM} border-r border-vouch-cyan/15 ${className}`}
      aria-label="AI Judge Council welcome"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-vouch-cyan/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-vouch-emerald/6 blur-3xl" />

      <div className="relative">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>AI Judge Council</p>
        <h3 className="mt-2 text-lg font-black tracking-tight text-white sm:text-xl">
          Five judges vet your edge.
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-white/45">
          Probability research for entertainment — not betting advice. Every score is an estimate, never a guarantee.
        </p>
      </div>

      <div className="relative my-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={judge.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3"
          >
            <JudgePixelIcon code={judge.code} />
            <div className="min-w-0">
              <p className={`${Z8_LABEL} text-vouch-cyan/60`}>{judge.specialty}</p>
              <p className="mt-1 text-base font-black text-white">{judge.displayName}</p>
              <p className="mt-0.5 text-xs font-medium text-vouch-cyan/75">{judge.tagline}</p>
              <blockquote className="mt-3 border-l-2 border-vouch-cyan/35 pl-3 text-sm italic leading-relaxed text-white/65">
                &ldquo;{judge.authTip}&rdquo;
              </blockquote>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          {LANDING_JUDGES.map((j, i) => (
            <button
              key={j.id}
              type="button"
              aria-label={`Show ${j.displayName}`}
              aria-pressed={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              className={`flex-1 rounded-lg py-1.5 text-center font-mono text-[9px] font-bold uppercase tracking-widest transition-all ${
                i === activeIndex
                  ? 'bg-vouch-cyan/15 text-vouch-cyan ring-1 ring-vouch-cyan/40'
                  : 'bg-black/30 text-white/30 hover:bg-vouch-cyan/8 hover:text-white/55'
              }`}
            >
              {j.code}
            </button>
          ))}
        </div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-white/25">
          Live picks populate after sign-in · No fake credentials
        </p>
      </div>
    </aside>
  );
}
