import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';
import Navbar from '../components/landing-v4/Navbar';
import PublicFooter from '../components/landing-v4/PublicFooter';

/**
 * /about — the institutional chapter of the V4 system.
 *
 * Landing is the cinematic product narrative, /dev the engineering dossier,
 * /contact the communications console, /blog the published record. This surface
 * is the manifesto: why the thing exists, what it refuses to do, and who stands
 * behind it. It progresses as numbered chapters with a different rhythm each —
 * statement, contrast, testimony, register, system, attribution, exit — rather
 * than a hero over a grid of value cards.
 *
 * Every claim on this page already existed in the previous implementation. The
 * founding quote is verbatim; the three principles are the previous three
 * pillars reframed from cards into a register; the operator block carries the
 * same name, role, location and outbound link. Nothing about traction,
 * customers, revenue, accuracy, partnerships, team size or company history is
 * asserted, because the source content never asserted it.
 */

const META = 'font-mono text-[10px] uppercase tracking-[0.24em] text-white/40';
const RULE = 'border-white/[0.08]';

const FRAME = 'mx-auto w-full max-w-7xl 2xl:max-w-[1440px]';
const GUTTER = 'px-6 lg:px-10';

/** Origin facts. All four appeared in the previous implementation. */
const ORIGIN = [
  { label: 'Origin', value: 'Dartmouth, NS, Canada' },
  { label: 'Operator', value: 'Boyd R. Santos' },
  { label: 'Discipline', value: 'MLB home run intelligence' },
];

/**
 * The three founding pillars, carried over intact and re-set as a numbered
 * register instead of a three-card grid.
 */
const PRINCIPLES = [
  {
    title: 'No synthetic certainty',
    body:
      'We reject the scam of synthetic 95% win-rates. We expose the true mathematical variance, weather impacts, and matchup realities instead of false hype.',
  },
  {
    title: 'Show the mechanism',
    body:
      'Deep-dive into Statcast velocity, batter barrel rates, pitcher vulnerability, and park factors so you actually know why a pick has mathematical value.',
  },
  {
    title: 'Lock the record',
    body:
      'Every decision is locked with SHA-256 cryptographic timestamps before first pitch. No deleted losses. No phantom edits. Transparent accountability.',
  },
];

/** Model inputs named in the previous copy. Nothing added to the list. */
const INPUTS = [
  'Statcast velocity',
  'Batter barrel rates',
  'Pitcher vulnerability',
  'Park factors',
];

/** Existing routes only. */
const NEXT_STEPS = [
  { label: 'Methodology', title: 'How the model reads a matchup', href: '/#methodology' },
  { label: 'The Record', title: 'Published research and release notes', href: '/blog' },
  { label: 'Contact', title: 'Open a channel', href: '/contact' },
];

/** Numbered chapter opener. One grammar, reused; each chapter body differs. */
function ChapterLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b ${RULE} pb-5`}>
      <span className={`${META} tabular-nums`}>{index}</span>
      <span className={`${META} text-ve-emerald`}>{title}</span>
    </div>
  );
}

/**
 * Chapter reveal. Offset only, never an opacity gate — the narrative must be
 * legible even if a frame never runs, and reduced motion neutralises it.
 */
function Chapter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { y: 14 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function AboutPage() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.title = 'Why VouchEdge Exists | VouchEdge';
  }, []);

  return (
    <div
      className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 selection:bg-ve-emerald/30 ${AURORA_MAX_SHELL}`}
      data-scroll-owner="document"
    >
      <Navbar />

      <div className="flex min-h-screen flex-col bg-black pt-16 text-white">
        <main id="main" className="flex-grow">
          {/* ============================================================ */}
          {/* OPENING STATEMENT                                            */}
          {/* ============================================================ */}
          <section className={`${GUTTER} pb-20 pt-20 sm:pb-24 sm:pt-28 lg:pb-32 lg:pt-32`}>
            <div className={FRAME}>
              <motion.div
                initial={reduceMotion ? false : { y: 10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b ${RULE} pb-5 lg:pb-10`}>
                  <span className={`${META} text-ve-emerald`}>07 / Origin</span>
                  <span className={META}>Institutional Record</span>
                </div>

                <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
                  {/* Fitted to the string, not guessed. "Built for" is nine
                      characters: at the previous 96px it measured 293px inside an
                      832px region and read as a caption in a void. The clamp caps
                      at 9rem (the /dev hero's register) and the region drops to
                      six columns, which puts the line at ~72% of its measure. */}
                  <h1 className="text-[clamp(3rem,10vw,9rem)] font-bold italic leading-[0.86] tracking-tighter text-white lg:col-span-6">
                    Built for
                    <br />
                    <span className="text-white/25">Truth.</span>
                  </h1>

                  <dl className={`border-t ${RULE} lg:col-span-4 lg:col-start-9`}>
                    {ORIGIN.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-baseline justify-between gap-6 border-b ${RULE} py-3`}
                      >
                        <dt className={META}>{item.label}</dt>
                        <dd className="min-w-0 text-right font-mono text-xs text-white/70">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <p className="mt-12 max-w-2xl font-sans text-lg font-light leading-relaxed text-white/55 xl:text-xl">
                  VouchEdge was built so a wager can be understood before it is placed and
                  checked after it settles — not sold as a certainty by someone with no record
                  to show.
                </p>
              </motion.div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 01 — THE STATUS QUO                                          */}
          {/* ============================================================ */}
          <Chapter className={`${GUTTER} border-t ${RULE} py-24 sm:py-32 lg:py-40`}>
            <div className={FRAME}>
              <ChapterLabel index="01" title="The status quo" />

              <div className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-5">
                  <h2 className="text-4xl font-bold italic leading-[0.95] tracking-tighter text-white sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl">
                    Certainty is
                    <br />
                    <span className="text-white/25">the product</span>
                    <br />
                    being sold.
                  </h2>
                </div>

                <div className="lg:col-span-6 lg:col-start-7 lg:pt-2">
                  {/* The rejected claim, set as struck type rather than coloured.
                      Red stays reserved for genuine failure states. */}
                  <div className={`border-y ${RULE} py-6`}>
                    <span className={META}>The claim</span>
                    <p className="mt-3 font-mono text-2xl text-white/25 line-through decoration-white/25 sm:text-3xl">
                      95% WIN RATE
                    </p>
                    <p className={`mt-3 ${META}`}>Synthetic</p>
                  </div>

                  <p className="mt-8 max-w-xl font-sans text-lg font-light leading-relaxed text-white/55">
                    We reject the scam of synthetic 95% win-rates. We expose the true
                    mathematical variance, weather impacts, and matchup realities instead of
                    false hype.
                  </p>
                </div>
              </div>
            </div>
          </Chapter>

          {/* ============================================================ */}
          {/* 02 — TESTIMONY                                               */}
          {/* ============================================================ */}
          <Chapter className={`${GUTTER} border-t ${RULE} bg-obsidian-950 py-24 sm:py-32 lg:py-40`}>
            <div className={FRAME}>
              <ChapterLabel index="02" title="In the founder's words" />

              <figure className="mt-14 lg:mt-24">
                <blockquote className="max-w-5xl border-l-2 border-ve-emerald pl-6 sm:pl-10">
                  <p className="font-sans text-2xl font-light leading-[1.45] text-white/80 sm:text-3xl sm:leading-[1.35] lg:text-[2.75rem] lg:leading-[1.28] lg:text-white/85 2xl:text-5xl">
                    I created VouchEdge because I was tired of seeing people lose money blindly
                    and tired of watching people get scammed by fake locks. I built this so you
                    can truly understand what you are betting on and make informed decisions
                    with verifiable proof.
                  </p>
                </blockquote>

                <figcaption className={`mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t ${RULE} pt-5 sm:pl-10`}>
                  <span className="font-sans text-sm font-medium text-white">Boyd R. Santos</span>
                  <span className={META}>Founder &amp; Principal Systems Architect</span>
                </figcaption>
              </figure>
            </div>
          </Chapter>

          {/* ============================================================ */}
          {/* 03 — OPERATING PRINCIPLES                                    */}
          {/* ============================================================ */}
          <Chapter className={`${GUTTER} border-t ${RULE} py-24 sm:py-32 lg:py-40`}>
            <div className={FRAME}>
              <ChapterLabel index="03" title="Operating principles" />

              <ol className={`mt-14 border-t ${RULE}`}>
                {PRINCIPLES.map((principle, i) => (
                  <li key={principle.title} className={`border-b ${RULE}`}>
                    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-4 py-10 sm:gap-x-10 lg:grid-cols-[auto_minmax(0,5fr)_minmax(0,6fr)] lg:gap-x-16">
                      <span className={`${META} tabular-nums`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-2xl font-bold italic leading-[1.1] tracking-tighter text-white sm:text-3xl">
                        {principle.title}
                      </h3>
                      <p className="col-start-2 max-w-xl font-sans text-base font-light leading-relaxed text-white/55 lg:col-start-3">
                        {principle.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Chapter>

          {/* ============================================================ */}
          {/* 04 — WHAT THE SYSTEM READS                                   */}
          {/* ============================================================ */}
          <Chapter className={`${GUTTER} border-t ${RULE} bg-obsidian-950 py-24 sm:py-32 lg:py-40`}>
            <div className={FRAME}>
              <ChapterLabel index="04" title="What the system reads" />

              <div className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-20">
                <div className="lg:col-span-5">
                  <h2 className="text-4xl font-bold italic leading-[0.95] tracking-tighter text-white sm:text-5xl">
                    Evidence,
                    <br />
                    <span className="text-white/25">not results.</span>
                  </h2>

                  <p className="mt-8 max-w-md font-sans text-lg font-light leading-relaxed text-white/55">
                    The inputs are physical and measurable. A pick is only worth showing once
                    the mechanism behind it can be read.
                  </p>

                  <a
                    href="/#methodology"
                    className="group mt-10 inline-flex min-h-11 items-center gap-3 border border-white/15 px-6 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 no-underline transition-colors hover:border-ve-emerald hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-emerald"
                  >
                    Methodology
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </a>
                </div>

                <div className="lg:col-span-7">
                  <dl className={`border-t ${RULE}`}>
                    {INPUTS.map((input, i) => (
                      <div
                        key={input}
                        className={`flex items-baseline gap-6 border-b ${RULE} py-5 sm:gap-10`}
                      >
                        <dt className={`${META} tabular-nums shrink-0`}>
                          {String(i + 1).padStart(2, '0')}
                        </dt>
                        <dd className="min-w-0 font-mono text-sm text-white/70">{input}</dd>
                      </div>
                    ))}
                  </dl>

                  <p className={`mt-6 ${META}`}>
                    Locked with SHA-256 timestamps before first pitch
                  </p>
                </div>
              </div>
            </div>
          </Chapter>

          {/* ============================================================ */}
          {/* 05 — THE OPERATOR                                            */}
          {/* ============================================================ */}
          <Chapter className={`${GUTTER} border-t ${RULE} py-24 sm:py-32 lg:py-40`}>
            <div className={FRAME}>
              <ChapterLabel index="05" title="The operator" />

              <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-20">
                <div className="lg:col-span-7">
                  <h2 className="text-4xl font-bold italic leading-[0.95] tracking-tighter text-white sm:text-5xl lg:text-6xl">
                    Boyd R. Santos
                  </h2>
                  <p className={`mt-5 ${META} text-ve-emerald`}>
                    Founder &amp; Principal Systems Architect
                  </p>
                  <p className="mt-8 max-w-md font-sans text-lg font-light leading-relaxed text-white/55">
                    Dartmouth, NS, Canada. Building for the analyst community.
                  </p>
                </div>

                <div className="lg:col-span-5">
                  <a
                    href="/dev"
                    className={`group flex items-center justify-between gap-6 border-t ${RULE} py-6 no-underline transition-colors hover:border-ve-emerald focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-emerald`}
                  >
                    <span>
                      <span className={`${META} block`}>Developer profile</span>
                      <span className="mt-2 block text-xl font-bold italic tracking-tighter text-white transition-colors group-hover:text-ve-emerald">
                        The full technical dossier
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ve-emerald"
                    />
                  </a>
                </div>
              </div>
            </div>
          </Chapter>

          {/* ============================================================ */}
          {/* 06 — WHERE TO GO NEXT                                        */}
          {/* ============================================================ */}
          <Chapter className={`${GUTTER} border-t ${RULE} pb-32 pt-24 sm:pb-40 sm:pt-32 lg:pt-40`}>
            <div className={FRAME}>
              <ChapterLabel index="06" title="Where to go next" />

              <ul className={`mt-14 border-t ${RULE}`}>
                {NEXT_STEPS.map((step) => (
                  <li key={step.href} className={`border-b ${RULE}`}>
                    <a
                      href={step.href}
                      className="group flex items-center justify-between gap-6 py-8 no-underline transition-colors hover:bg-white/[0.02] focus-visible:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-emerald sm:py-10"
                    >
                      <span className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-baseline sm:gap-10">
                        <span className={`${META} text-ve-emerald`}>{step.label}</span>
                        <span className="text-2xl font-bold italic leading-[1.15] tracking-tighter text-white transition-colors group-hover:text-ve-emerald sm:text-3xl">
                          {step.title}
                        </span>
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ve-emerald"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Chapter>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
