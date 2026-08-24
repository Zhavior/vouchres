import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import HeroCommandCarousel from './HeroCommandCarousel';
import { useLandingTelemetry } from '../../hooks/public/useLandingTelemetry';

export default function Hero() {
  const telemetry = useLandingTelemetry();

  /*
   * A dash, never a stand-in number. These sit under a "LIVE MODEL" banner, so
   * printing a literal the feed did not return would be the exact failure the
   * product exists to call out.
   */
  const cells = [
    { val: telemetry.gamesActive, label: 'Games_Active' },
    { val: telemetry.lineupsSynced, label: 'Lineups_Synced' },
    { val: telemetry.eliteCandidates, label: 'Elite_Candidates' },
    { val: telemetry.modelStatus, label: 'Model_Status', color: 'text-ve-emerald' },
  ];

  return (
    <section className="relative min-h-[95vh] flex items-center pt-32 pb-20 px-6 overflow-hidden">
      <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        
        {/* Left Side: Editorial */}
        <div className="lg:col-span-7 space-y-10">
          {/* No opacity gate: the eyebrow and headline are the hero's meaning and
              must be legible on the first painted frame. Motion still enhances via
              the x-offset, which MotionConfig reducedMotion="user" neutralises. */}
          <motion.div
            initial={{ x: -14 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-ve-emerald animate-pulse" />
              <span className="terminal-text text-ve-emerald">LIVE MODEL // MLB HR INTELLIGENCE // COVERAGE AUDITED</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter italic leading-[0.85] text-white">
              The First MLB Model <br />
              {/* Ghost line keeps the two-tone treatment; white/10 measured ~1.2:1 and was
                  effectively invisible on mobile. white/25 holds the hierarchy and reads. */}
              <span className="text-white/25">That Refuses to Guess.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ y: 6 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="text-lg sm:text-xl text-white/55 max-w-xl leading-relaxed font-light"
          >
            Build and lock auditable home-run hypotheses from Statcast telemetry, 
            matchup vulnerabilities, park context, and explicit evidence coverage.
          </motion.p>

          <motion.div 
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.06, duration: 0.4, ease: 'easeOut' }}
            className="flex flex-wrap gap-4"
          >
            {/*
              Both of these were bare <button> elements with no onClick and no
              href — the hero's primary and secondary calls to action did
              nothing at all when clicked. They are anchors now.

              The primary points at the free beta sign-up rather than /hr-board:
              sending a first-time visitor straight into a gated desk skips the
              thing the page is actually offering.
            */}
            <a
              href="/join"
              className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-ve-emerald transition-all flex items-center gap-3 no-underline"
            >
              Create free account <ArrowRight size={16} />
            </a>
            <a
              href="/#methodology"
              className="px-8 py-4 border border-white/10 hover:bg-white/5 transition-all text-[10px] font-mono uppercase tracking-widest text-white/40 no-underline"
            >
              See the methodology
            </a>
          </motion.div>
          
          {/* Telemetry Strip */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.35 }}
            className="pt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/5 sm:flex sm:gap-12"
          >
            {cells.map((item) => (
              <div key={item.label} className="min-w-0">
                <p
                  className={`text-lg font-mono tabular-nums ${
                    item.val == null ? 'text-white/25' : item.color || 'text-white'
                  }`}
                >
                  {item.val ?? '—'}
                </p>
                <p className="text-[8px] font-mono text-white/35 uppercase tracking-tighter break-words">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Side: Command HUD */}
        <div className="lg:col-span-5 relative">
          <div className="absolute -inset-4 bg-ve-emerald/5 blur-3xl rounded-full pointer-events-none" />
          <HeroCommandCarousel />
        </div>
      </div>
    </section>
  );
}
