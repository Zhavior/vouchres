import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Github, Linkedin, Mail } from 'lucide-react';
import { OPERATOR } from './devData';
import { FOCUS_RING, Reveal, ScanRule, StatusDot } from './DevPrimitives';

/** One row of the operator dossier. */
function NodeRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
      <dt className="font-mono text-[9px] uppercase tracking-[0.22em] whitespace-nowrap text-white/30">
        {label}
      </dt>
      <dd className="min-w-0 grow text-right font-mono text-[11px] text-white/70">{children}</dd>
    </div>
  );
}

export default function OperatorHero() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /**
   * The async Clipboard API is unavailable on insecure origins and can be
   * denied by permission policy, so fall back to a selection-based copy before
   * giving up. The key stays visible and selectable either way.
   */
  const writeKey = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(OPERATOR.key);
        return true;
      }
    } catch {
      /* fall through to the legacy path */
    }

    try {
      const field = document.createElement('textarea');
      field.value = OPERATOR.key;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(field);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyKey = async () => {
    if (!(await writeKey())) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className="relative border-b border-white/[0.06] px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-36"
      aria-labelledby="operator-name"
    >
      <div className="mx-auto max-w-7xl">
        {/* Masthead strip */}
        <Reveal
          onMount
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.28em]"
        >
          <div className="flex items-center gap-3">
            <span className="text-ve-cyan">DEV SYSTEMS</span>
            <span className="text-white/15">/</span>
            <span className="text-white/35">{OPERATOR.designation}</span>
          </div>

          <div className="flex items-center gap-2.5 text-ve-emerald">
            <StatusDot pulse />
            {OPERATOR.status}
          </div>
        </Reveal>

        <Reveal onMount delay={0.04}>
          <ScanRule className="mt-6" />
        </Reveal>

        <div className="mt-14 grid gap-16 sm:mt-20 lg:grid-cols-12 lg:gap-12">
          {/* ── Editorial column ─────────────────────────────────────── */}
          <div className="min-w-0 lg:col-span-7 xl:col-span-7">
            <Reveal onMount delay={0.08}>
              <h1
                id="operator-name"
                className="text-[clamp(3.25rem,10vw,7rem)] leading-[0.86] font-bold tracking-tighter text-white italic"
              >
                {OPERATOR.givenName}
                <br />
                <span className="text-white/25">{OPERATOR.familyName}</span>
              </h1>
            </Reveal>

            <Reveal onMount delay={0.14} className="mt-8 sm:mt-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/50 sm:text-xs">
                {OPERATOR.title}
              </p>

              <p className="mt-6 max-w-xl text-lg leading-relaxed font-light text-white/40 sm:text-xl">
                Building{' '}
                <a
                  href="https://vouchedge.xyz"
                  target="_blank"
                  rel="noreferrer"
                  className={`text-ve-cyan no-underline transition-colors hover:text-white ${FOCUS_RING}`}
                >
                  VouchEdge
                </a>{' '}
                and{' '}
                <a
                  href="https://seolaquest.com"
                  target="_blank"
                  rel="noreferrer"
                  className={`text-ve-amber no-underline transition-colors hover:text-white ${FOCUS_RING}`}
                >
                  SEOlaQuest
                </a>{' '}
                — decision systems that record what they knew, before the outcome
                is known.
              </p>
            </Reveal>

            <Reveal onMount delay={0.2} className="mt-10 flex flex-wrap items-center gap-3 sm:mt-12">
              <a
                href={OPERATOR.contact}
                className={`group inline-flex items-center gap-2.5 bg-white px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black no-underline transition-colors hover:bg-ve-cyan ${FOCUS_RING}`}
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                Transmit Comms
                <ArrowUpRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </a>

              <a
                href={OPERATOR.github}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2.5 border border-white/10 px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 no-underline transition-colors hover:border-ve-cyan/50 hover:text-white ${FOCUS_RING}`}
              >
                <Github className="h-3.5 w-3.5" aria-hidden="true" />
                GitHub
              </a>

              <a
                href={OPERATOR.linkedin}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2.5 border border-white/10 px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 no-underline transition-colors hover:border-ve-cyan/50 hover:text-white ${FOCUS_RING}`}
              >
                <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                LinkedIn
              </a>
            </Reveal>
          </div>

          {/* ── Operator dossier ─────────────────────────────────────── */}
          <Reveal
            onMount
            delay={0.26}
            className="min-w-0 lg:col-span-5 lg:col-start-9 lg:self-end xl:col-span-4"
          >
            <div className="border border-white/10 bg-white/[0.015] sm:max-w-md lg:max-w-none">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/30">
                  Operator Node
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-ve-emerald">
                  001
                </span>
              </div>

              <div className="flex items-center justify-center border-b border-white/[0.08] px-5 py-10">
                <span
                  className="font-mono text-4xl font-bold tracking-[0.14em] text-ve-cyan sm:text-5xl"
                  aria-hidden="true"
                >
                  {OPERATOR.monogram}
                </span>
              </div>

              <dl className="divide-y divide-white/[0.06] px-5 pb-2">
                <NodeRow label="Location">
                  {OPERATOR.locationShort} <span aria-hidden="true">{OPERATOR.flag}</span>
                  <span className="sr-only">{OPERATOR.location}</span>
                </NodeRow>

                <NodeRow label="Attestation">
                  <span className="inline-flex items-center gap-2 text-ve-emerald">
                    <StatusDot />
                    VERIFIED NODE
                  </span>
                  <span className="sr-only">{OPERATOR.attestation}</span>
                </NodeRow>

                <NodeRow label="Node ID">
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    aria-label={`Copy operator node identifier ${OPERATOR.key}`}
                    className={`inline-flex max-w-full items-center gap-2 text-left transition-colors ${
                      copied ? 'text-ve-emerald' : 'text-white/70 hover:text-ve-cyan'
                    } ${FOCUS_RING}`}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3 w-3 shrink-0 opacity-50" aria-hidden="true" />
                    )}
                    <span className="break-all">{copied ? 'KEY COPIED' : OPERATOR.key}</span>
                  </button>
                </NodeRow>
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
