import React from 'react';
import { motion } from 'framer-motion';
import { FooterSection } from '../components/landing-v3';
import PublicNav from '../components/landing-v3/PublicNav';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';

export default function AboutPage() {
  return (
    <div className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 ${AURORA_MAX_SHELL}`} data-scroll-owner="document">
      <PublicNav />
      <div className="flex flex-col min-h-screen bg-black text-white pt-16">
        <main className="flex-grow flex flex-col items-center justify-center px-6 py-24 sm:py-32 w-full max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-8"
          >
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-2xl font-mono">
              TRUTH IN <span className="text-cyan-400">EVIDENCE</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-400 leading-relaxed">
              VouchEdge is built to provide MLB research tools for analysts who demand sourced evidence, explicit coverage gaps, and honest post-game review. We do not synthesize confidence; we expose reality.
            </p>
            <div className="flex items-center justify-center gap-2 mt-8 text-zinc-500 font-mono text-[11px] tracking-widest uppercase">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              Created in Dartmouth, NS, Canada <span className="text-sm">🇨🇦</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
          >
            {/* Value Prop 1 */}
            <div className="border border-white/10 bg-white/5 backdrop-blur-md p-8 sm:p-12 hover:border-white/20 transition-colors">
              <div className="h-12 w-12 border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center mb-6">
                <span className="text-cyan-400 font-mono font-bold">01</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 font-mono uppercase tracking-widest text-zinc-100">Immutable Ledger</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Every piece of evidence is timestamped and cryptographically logged. When a game ends, the ledger remains untouched. No phantom edits, no erased bad picks.
              </p>
            </div>

            {/* Value Prop 2 */}
            <div className="border border-white/10 bg-white/5 backdrop-blur-md p-8 sm:p-12 hover:border-white/20 transition-colors">
              <div className="h-12 w-12 border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mb-6">
                <span className="text-emerald-400 font-mono font-bold">02</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 font-mono uppercase tracking-widest text-zinc-100">Explicit Coverage</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                If the data isn't there, we don't guess. Unavailable signals are labeled explicitly, so your confidence is never built on a hallucinated foundation.
              </p>
            </div>
          </motion.div>
        </main>
        <FooterSection />
      </div>
    </div>
  );
}
