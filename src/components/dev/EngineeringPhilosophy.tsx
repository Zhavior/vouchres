import React from 'react';
import { ACCENT_TEXT, OPERATOR, PHILOSOPHY } from './devData';
import { Reveal, ScanRule } from './DevPrimitives';

/**
 * The sparse chapter. One statement, one attributed quote, three principles.
 * No panels, no borders around the copy — the whitespace is the design.
 */
export default function EngineeringPhilosophy() {
  return (
    <section className="px-6 py-24 sm:py-32 lg:py-40" aria-labelledby="philosophy">
      <div className="mx-auto max-w-7xl">
        <Reveal className="flex items-baseline gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-ve-cyan">02</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
            Engineering Philosophy
          </span>
        </Reveal>

        <ScanRule className="mt-5" />

        <Reveal className="mt-16 sm:mt-24" delay={0.05}>
          <h2
            id="philosophy"
            className="max-w-4xl text-[clamp(2rem,6vw,4.25rem)] leading-[1.02] font-bold tracking-tighter text-white italic"
          >
            Tired of losses &amp; scams.
            <br />
            <span className="text-white/25">Built for decision intelligence.</span>
          </h2>
        </Reveal>

        <div className="mt-20 grid gap-16 sm:mt-28 lg:grid-cols-12 lg:gap-12">
          {/* Operator statement */}
          <Reveal className="min-w-0 lg:col-span-6" delay={0.05}>
            <blockquote className="border-l border-ve-cyan/40 pl-6 sm:pl-8">
              <p className="text-lg leading-[1.7] font-light text-white/70 sm:text-xl">
                {PHILOSOPHY.quote}
              </p>
              <footer className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-white/25">
                {OPERATOR.name} — {OPERATOR.title}
              </footer>
            </blockquote>
          </Reveal>

          {/* Principles */}
          <Reveal className="min-w-0 lg:col-span-5 lg:col-start-8" delay={0.1}>
            <p className="max-w-md text-base leading-relaxed font-light text-white/35">
              {PHILOSOPHY.thesisLead}
            </p>

            <ol className="mt-10">
              {PHILOSOPHY.principles.map((principle) => (
                <li
                  key={principle.id}
                  className="flex items-baseline gap-6 border-t border-white/[0.08] py-6 last:border-b"
                >
                  <span
                    className={`font-mono text-[10px] tracking-[0.2em] ${ACCENT_TEXT[principle.accent]}`}
                  >
                    {principle.id}
                  </span>
                  <span className="text-lg leading-snug font-medium text-white sm:text-xl">
                    {principle.title}
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
