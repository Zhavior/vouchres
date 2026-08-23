import React from 'react';
import { ACCENT_BG, REGISTRY } from './devData';
import { Reveal, ScanRule, SectionHeader } from './DevPrimitives';

/**
 * The technical architecture matrix as an engineering registry.
 *
 * Every entry is a system that is actually part of the stack — there is no
 * synthetic uptime column, because a framework does not have an uptime. What is
 * shown instead is what each system does, and which surface it serves (cyan =
 * engineering, emerald = VouchEdge evidence, amber = SEOlaQuest).
 *
 * Desktop renders a dense three-column ledger; below `sm` each row folds into a
 * two-line entry so nothing shrinks below legibility and nothing overflows.
 */
export default function ArchitectureRegistry() {
  return (
    <section className="px-6 py-24 sm:py-32" aria-labelledby="architecture">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="03"
          label="System Architecture"
          title={<span id="architecture">The registry.</span>}
          lede="The systems these platforms are built on, by layer."
        />

        {/* Column key — desktop only; on mobile each row is self-labelling */}
        <Reveal className="hidden grid-cols-2 gap-8 border-b border-white/[0.08] pb-3 font-mono text-[9px] uppercase tracking-[0.26em] text-white/20 sm:grid">
          <span>System</span>
          <span>Function</span>
        </Reveal>

        {REGISTRY.map((layer) => (
          <Reveal key={layer.id} className="mt-10 sm:mt-8">
            <h3 className="flex items-baseline gap-4 border-b border-white/[0.08] pb-3 sm:border-none sm:pb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
                {layer.category}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/20">
                {layer.code}
              </span>
            </h3>

            <dl className="mt-1">
              {layer.entries.map((entry) => (
                <div
                  key={entry.system}
                  className="group grid grid-cols-1 gap-x-8 gap-y-1 border-b border-white/[0.05] py-3.5 transition-colors hover:bg-white/[0.02] sm:grid-cols-2 sm:items-baseline"
                >
                  <dt className="flex items-baseline gap-3 font-mono text-[13px] tracking-tight text-white/85 transition-colors group-hover:text-white">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full ${ACCENT_BG[entry.accent]} opacity-60 transition-opacity group-hover:opacity-100`}
                      aria-hidden="true"
                    />
                    {entry.system}
                  </dt>

                  <dd className="pl-[calc(0.375rem+0.75rem)] font-mono text-[11px] tracking-[0.08em] text-white/30 uppercase transition-colors group-hover:text-white/55 sm:pl-0">
                    <span className="sr-only">Function: </span>
                    {entry.fn}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        ))}

        <ScanRule className="mt-12" />
      </div>
    </section>
  );
}
