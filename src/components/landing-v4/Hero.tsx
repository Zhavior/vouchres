import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import HeroCommandCarousel from './HeroCommandCarousel';
import { useLandingTelemetry } from '../../hooks/public/useLandingTelemetry';
import { TelemetryStatusBadge } from './TelemetryStatus';
import { MODE_COPY } from './telemetryStatusCopy';

export default function Hero() {
  const telemetry = useLandingTelemetry();
  const modeCopy = MODE_COPY[telemetry.mode];

  /*
   * Still never a stand-in number — but no longer a row of dashes either. The
   * hook degrades from confirmed rows to the board's projected pool to the last
   * published slate, and the banner above these cells says which one they came
   * from, so the numbers are real in every state the visitor can land in.
   *
   * `sub` is the plain-English translation of the label above it. The telemetry
   * names are the product's own vocabulary and stay; the sub-line is what they
   * mean to someone who has never seen the desk.
   */
  const cells = [
    { val: telemetry.gamesActive, label: 'Games_Active', sub: 'Games on the card' },
    {
      /*
       * Before lineups post this is `0/260`, which reads as a broken counter
       * rather than as a stage of the day. The zero is real, so it is not
       * hidden — it is stated as the thing it means, with the pool size kept in
       * the sub-line so the scale is still visible.
       */
      val:
        telemetry.lineupProgress && telemetry.lineupProgress.confirmed === 0
          ? 'PENDING'
          : telemetry.lineupsSynced,
      label: 'Lineups_Synced',
      sub:
        telemetry.lineupProgress && telemetry.lineupProgress.confirmed === 0
          ? `Official cards not posted · ${telemetry.lineupProgress.checked} batters in pool`
          : 'Batters with an official lineup',
    },
    { val: telemetry.eliteCandidates, label: 'Elite_Candidates', sub: 'Cleared the top evidence tier' },
    { val: telemetry.modelStatus, label: 'Model_Status', color: 'text-ve-emerald', sub: 'Evidence coverage grade' },
  ];

  /*
   * Fold rebalance: the hero was `min-h-[95vh] pt-32 pb-20` with `gap-16` and
   * `space-y-10` inside it, which pushed the command deck below the fold on a
   * 900px-tall desktop viewport — the one panel showing live telemetry was the
   * one nobody saw without scrolling. The height below is capped rather than
   * minimum and the internal rhythm is condensed, which lifts the deck into the
   * first screen without touching the type scale.
   */
  return (
    <section className="relative flex min-h-[auto] items-center overflow-hidden px-6 pb-12 pt-24 lg:min-h-[calc(100vh-4rem)] lg:py-16">
      <div className="container relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">

        {/* Left Side: Editorial */}
        <div className="space-y-6 lg:col-span-7">
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
            <TelemetryStatusBadge telemetry={telemetry} />
            <h1 className="text-5xl font-bold italic leading-[0.85] tracking-tighter text-white sm:text-6xl md:text-7xl xl:text-8xl">
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
            className="max-w-xl text-base font-light leading-relaxed text-white/55 sm:text-lg"
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
            className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/5 pt-6 sm:grid-cols-4 sm:gap-8"
          >
            {cells.map((item) => (
              <div key={item.label} className="min-w-0">
                <p
                  className={`font-mono text-lg tabular-nums ${
                    item.val == null ? 'text-white/40' : item.color || 'text-white'
                  }`}
                >
                  {/* Off-slate is a state, not a blank. The badge above already
                      names which population these came from. */}
                  {item.val ?? modeCopy.chip}
                </p>
                <p className="break-words font-mono text-[8px] uppercase tracking-tighter text-white/35">{item.label}</p>
                <p className="mt-1 text-[10px] font-light leading-snug text-white/30">{item.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Side: Command HUD */}
        <div className="relative lg:col-span-5">
          <div className="absolute -inset-4 bg-ve-emerald/5 blur-3xl rounded-full pointer-events-none" />
          <HeroCommandCarousel />
        </div>
      </div>
    </section>
  );
}
