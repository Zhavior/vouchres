import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
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

  const included = [
    'Ranked HR board',
    'Lineup + park context',
    'Parlay risk math',
    'Automatic result review',
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
    <section className="relative flex min-h-[auto] items-center overflow-hidden border-b border-white/[0.06] px-5 pb-14 pt-24 sm:px-6 lg:min-h-[calc(100vh-4rem)] lg:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,255,163,0.12),transparent_34%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-14 h-px bg-gradient-to-r from-transparent via-ve-emerald/30 to-transparent" />
      <div className="container relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">

        {/* Left Side: Editorial */}
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {/* No opacity gate: the eyebrow and headline are the hero's meaning and
              must be legible on the first painted frame. Motion still enhances via
              the x-offset, which MotionConfig reducedMotion="user" neutralises. */}
          <motion.div
            initial={{ x: -14 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 border border-ve-emerald/30 bg-ve-emerald/10 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ve-emerald">
                <ShieldCheck size={13} /> Open beta · Free access
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Built for the MLB slate</span>
            </div>
            <TelemetryStatusBadge telemetry={telemetry} />
            <h1 className="max-w-4xl text-[clamp(2.75rem,8vw,6.8rem)] font-black uppercase italic leading-[0.79] tracking-[-0.065em] text-white">
              Your HR parlay
              <span className="mt-2 block text-white/28">doesn&apos;t need more picks.</span>
              <span className="mt-2 block text-ve-emerald">It needs better reasons.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ y: 6 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="max-w-2xl text-base font-normal leading-relaxed text-white/65 sm:text-lg"
          >
            VouchEdge turns today&apos;s MLB slate into an evidence-backed shortlist, shows what is missing before you commit, and keeps the receipt through the final result.
          </motion.p>

          <motion.div 
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.06, duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          >
            <a
              href="/join"
              className="group inline-flex min-h-12 w-full items-center justify-center gap-3 bg-ve-emerald px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-black no-underline shadow-[0_0_40px_rgba(0,255,163,0.18)] transition-all hover:-translate-y-0.5 hover:bg-white sm:w-auto"
            >
              Build today&apos;s card free <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="/#methodology"
              className="px-1 py-3 font-mono text-[10px] uppercase tracking-widest text-white/45 no-underline transition-colors hover:text-white"
            >
              See exactly how it works →
            </a>
          </motion.div>

          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            No card required · No fake locks · Research tool, not betting advice
          </p>

          <motion.ul
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.04, duration: 0.4, ease: 'easeOut' }}
            className="grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {included.map((item) => (
              <li key={item} className="flex min-w-0 items-center gap-2 border-l border-ve-emerald/30 pl-3 text-sm font-medium text-white/75">
                <Check size={14} className="shrink-0 text-ve-emerald" />
                <span>{item}</span>
              </li>
            ))}
          </motion.ul>
          
          {/* Telemetry Strip */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.35 }}
            className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-4 sm:gap-8"
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
        <div className="relative min-w-0 lg:col-span-5">
          <div className="absolute -inset-4 rounded-full bg-ve-emerald/10 blur-3xl pointer-events-none" />
          <div className="relative border border-white/10 bg-black/30 p-2 shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
            <div className="mb-2 flex items-center justify-between gap-3 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">
              <span>What you get today</span>
              <span className="text-ve-emerald">Live product preview</span>
            </div>
            <HeroCommandCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
