import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';

/*
 * Open beta access.
 *
 * This section previously advertised two paid tiers — "Standard_Operator" at
 * $99 and "Alpha_Lead" at $249 — neither of which exists. The billing system's
 * canonical tiers are `pro` and `creator` (server/services/billing/tierConfig),
 * the dollar figures were literals unconnected to any Stripe price, and three
 * of the nine listed features ("Smart Money Flow Tracking", "Standard Market
 * Depth", "Voice Command Suite") appear nowhere in the codebase.
 *
 * VouchEdge is in open beta and sign-up is free, which is what the logo pill
 * and the footer already say. That is the claim this section makes now.
 */

const INCLUDED = [
  'Full HR command desk and daily slate board',
  'Live games desk with pitch-by-pitch tracking',
  'Evidence receipts on every hypothesis you lock',
  'News wire and player research workspace',
];

export default function AccessTiers() {
  return (
    <section className="py-40 px-6 bg-black/20">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter italic text-white mb-4 uppercase">
            Open_Beta_Access
          </h2>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            Free while VouchEdge is in beta. No card required.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative border border-ve-emerald/20 bg-[#0A0A0A]/40 p-10 backdrop-blur-xl ring-1 ring-ve-emerald/10"
        >
          <div className="absolute -top-3 left-10 border border-ve-emerald/30 bg-[#050505] px-3 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-ve-emerald">
            Open Beta
          </div>

          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-ve-emerald/25 bg-ve-emerald/10">
              <ShieldCheck className="h-5 w-5 text-ve-emerald" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tighter text-white">Free</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  during beta
                </span>
              </div>
              <p className="mt-1 text-sm text-white/55">
                Every desk, every receipt. Pricing arrives when beta ends.
              </p>
            </div>
          </div>

          <ul className="mb-10 space-y-3 border-t border-white/[0.06] pt-8">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ve-emerald" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a
            href="/join"
            className="inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-black no-underline transition-colors hover:bg-[#e4e4e7]"
          >
            Create free beta account <ArrowRight className="h-4 w-4" />
          </a>

          <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-widest text-white/30">
            Research &amp; evidence system · Not betting advice
          </p>
        </motion.div>
      </div>
    </section>
  );
}
