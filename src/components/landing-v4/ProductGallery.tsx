import React from 'react';
import { motion } from 'motion/react';

/**
 * 02b / THE_SURFACES — photographs of the running product.
 *
 * These are real screenshots captured from the app by
 * scripts/media/capture_feature_shots.mjs, not mockups. A landing that argues
 * for sourced evidence cannot illustrate itself with drawings, and every
 * caption describes what the screen is actually doing — including the empty
 * states, which are the product refusing to promote a candidate whose feeds
 * are incomplete.
 *
 * Each frame reserves its 16:10 aspect ratio before the image loads, so no
 * shot can push the section around as it arrives.
 */

interface Shot {
  slug: string;
  eyebrow: string;
  title: string;
  caption: string;
  alt: string;
  /** Caveat printed under the caption when the surface is not a fixed artefact. */
  note?: string;
}

const SHOTS: Shot[] = [
  {
    slug: 'today-desk',
    eyebrow: 'Today',
    title: "The slate, before first pitch.",
    caption:
      'Matchups, live count, verified research rows, and the countdown to first-pitch lock — the point after which a hypothesis can no longer be edited.',
    alt: "VouchEdge Today command desk showing slate counts, the first-pitch lock countdown, and the curated MLB intel wire",
  },
  {
    slug: 'hr-intelligence',
    eyebrow: 'HR Intelligence',
    title: 'Every candidate, with its gaps named.',
    caption:
      'The HRPI board ranks the slate on power, pitcher vulnerability, and park. When a required feed is missing, the board says so and stays locked rather than promoting the row anyway.',
    alt: 'VouchEdge home run command desk showing HRPI rankings, tactical radar filters, and explicit missing-feed warnings',
    note: 'The HRPI board is subject to change. It re-ranks as lineups confirm and Statcast, park and pitcher feeds land, so this frame is one slate at one moment — not a fixed rating.',
  },
  {
    slug: 'live-games',
    eyebrow: 'Live Games',
    title: 'Official feed, in-game.',
    caption:
      'Every game on the slate with the official MLB line score, featured matchup, and the HR evidence signals attached to it.',
    alt: 'VouchEdge live games desk showing the featured BOS at MIA matchup, HR evidence signals, and the official line score',
  },
];

export default function ProductGallery() {
  return (
    <section className="relative overflow-hidden bg-obsidian-950 px-6 py-28 lg:py-32" id="surfaces">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <span className="terminal-text mb-4 block text-ve-emerald">02 / THE_SURFACES</span>
          <h2 className="text-5xl font-bold italic tracking-tighter text-white md:text-6xl">
            This is the actual product. <br />
            <span className="text-white/20">Not a rendering of one.</span>
          </h2>
        </div>

        <div className="space-y-24">
          {SHOTS.map((shot, index) => (
            <motion.figure
              key={shot.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-12 ${
                index % 2 === 1 ? 'lg:[&>figcaption]:order-2' : ''
              }`}
            >
              <figcaption className="lg:col-span-4">
                <span className="terminal-text text-ve-emerald">{shot.eyebrow}</span>
                <h3 className="mt-4 text-3xl font-bold italic tracking-tighter text-white">{shot.title}</h3>
                <p className="mt-5 text-base font-light leading-relaxed text-white/50">{shot.caption}</p>
                {shot.note ? (
                  <p className="mt-4 border-l border-ve-emerald/30 pl-4 font-mono text-[10px] uppercase leading-relaxed tracking-widest text-white/30">
                    {shot.note}
                  </p>
                ) : null}
              </figcaption>

              {/* Ratio is reserved per breakpoint, so neither frame resizes on load. */}
              <div className="relative lg:col-span-8">
                <div className="mx-auto aspect-[780/1688] max-w-[320px] overflow-hidden border border-white/10 bg-obsidian-900 shadow-[0_40px_120px_rgba(0,0,0,0.6)] lg:aspect-[1800/1125] lg:max-w-none">
                  <picture>
                    {/* Below lg the desktop capture would be an unreadable smear,
                        so the phone-viewport capture of the same surface is served. */}
                    <source
                      media="(min-width: 1024px)"
                      srcSet={`/media/features/${shot.slug}.webp`}
                      width={1800}
                      height={1125}
                    />
                    <img
                      src={`/media/features/${shot.slug}-mobile.webp`}
                      alt={shot.alt}
                      width={780}
                      height={1688}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top"
                    />
                  </picture>
                </div>
                <div
                  className="pointer-events-none absolute -inset-px border border-ve-emerald/10"
                  aria-hidden="true"
                />
              </div>
            </motion.figure>
          ))}
        </div>

        <p className="mt-16 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/20">
          Screenshots captured from the running app · real MLB feeds · no mockups
        </p>
      </div>
    </section>
  );
}
