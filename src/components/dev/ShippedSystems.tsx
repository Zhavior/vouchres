import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ACCENT_BG, ACCENT_TEXT, VENTURES, type Venture } from './devData';
import { FOCUS_RING, Reveal, ScanRule, SectionHeader } from './DevPrimitives';

function CaseStudy({ venture }: { venture: Venture }) {
  const accentText = ACCENT_TEXT[venture.accent];
  const accentBg = ACCENT_BG[venture.accent];

  return (
    <section className="relative py-14 sm:py-20" aria-labelledby={`venture-${venture.id}`}>
      {/* Accent spine — the only chrome either product gets */}
      <span
        className={`absolute top-14 left-0 hidden h-16 w-px sm:top-20 lg:block ${accentBg} opacity-60`}
        aria-hidden="true"
      />

      <Reveal className="grid gap-10 lg:grid-cols-12 lg:gap-10 lg:pl-10">
        {/* Identity */}
        <div className="min-w-0 lg:col-span-4">
          <div className={`font-mono text-[10px] uppercase tracking-[0.26em] ${accentText}`}>
            {venture.tag}
          </div>

          <h3
            id={`venture-${venture.id}`}
            className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.02]"
          >
            {venture.name}
          </h3>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            {venture.role}
          </p>

          <a
            href={venture.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-white/25 no-underline transition-colors hover:text-white/60 ${FOCUS_RING}`}
          >
            {venture.displayUrl}
          </a>
        </div>

        {/* Dossier */}
        <div className="min-w-0 lg:col-span-7 lg:col-start-6">
          <p className="max-w-2xl text-lg leading-relaxed font-light text-white/45 sm:text-xl">
            {venture.description}
          </p>

          <div className="mt-10">
            <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/20">
              Key Capabilities
            </span>

            <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
              {venture.highlights.map((h) => (
                <li
                  key={h}
                  className="flex items-center gap-3 border-b border-white/[0.06] py-3 font-mono text-[11px] tracking-wide text-white/60"
                >
                  <span className={`h-1 w-1 shrink-0 rounded-full ${accentBg}`} aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <a
            href={venture.url}
            target="_blank"
            rel="noreferrer"
            className={`group mt-8 inline-flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] no-underline transition-colors ${accentText} hover:text-white ${FOCUS_RING}`}
          >
            Launch Platform
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </Reveal>
    </section>
  );
}

export default function ShippedSystems() {
  return (
    <section className="px-6 py-24 sm:py-32" aria-labelledby="shipped-systems">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="01"
          label="Shipped Systems"
          title={
            <span id="shipped-systems">
              Systems designed, built,
              <br className="hidden sm:block" /> and operating.
            </span>
          }
          lede="Two platforms in production. Both refuse to present a conclusion without the evidence that produced it."
        />

        <div className="divide-y divide-white/[0.06]">
          {VENTURES.map((venture) => (
            <CaseStudy key={venture.id} venture={venture} />
          ))}
        </div>

        <ScanRule />
      </div>
    </section>
  );
}
