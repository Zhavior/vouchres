import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, LineChart, Lock, Eye, ArrowRight, HeartHandshake } from 'lucide-react';
import { FooterSection } from '../components/landing-v3';
import PublicNav from '../components/landing-v3/PublicNav';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';

export default function AboutPage() {
  return (
    <div className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 ${AURORA_MAX_SHELL}`} data-scroll-owner="document">
      <PublicNav />
      <div className="flex flex-col min-h-screen bg-black text-white pt-16 relative">
        
        {/* Background Grid */}
        <div 
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} 
        />

        <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full max-w-5xl mx-auto relative z-10">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-6 max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-950/40 px-3.5 py-1 font-mono font-black uppercase text-xs text-cyan-300">
              <HeartHandshake className="w-3.5 h-3.5 text-cyan-400" />
              <span>THE FOUNDING MISSION</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono uppercase leading-tight">
              TIRED OF <span className="text-red-400 line-through decoration-red-500/80">SCAMS</span>.<br />
              BUILT FOR <span className="text-cyan-400">TRUTH</span>.
            </h1>
            
            <p className="text-base sm:text-xl text-zinc-300 font-mono leading-relaxed">
              "I created VouchEdge because I was tired of seeing people lose money blindly and tired of watching people get scammed by fake locks. I built this so you can truly understand what you are betting on and make informed decisions with verifiable proof."
            </p>

            <div className="flex items-center justify-center gap-2 pt-4 text-zinc-500 font-mono text-xs tracking-widest uppercase">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>Created in Dartmouth, NS, Canada <span className="text-sm">🇨🇦</span></span>
            </div>
          </motion.div>

          {/* Three Core Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          >
            {/* Pillar 1 */}
            <div className="border border-white/10 bg-zinc-950/80 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-10 w-10 border border-red-500/40 bg-red-950/40 flex items-center justify-center text-red-400 font-mono font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-mono uppercase tracking-wider text-white">No Fake "Locks"</h3>
                <p className="text-zinc-400 text-xs sm:text-sm font-mono leading-relaxed">
                  We reject the scam of synthetic 95% win-rates. We expose the true mathematical variance, weather impacts, and matchup realities instead of false hype.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="border border-white/10 bg-zinc-950/80 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-10 w-10 border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center text-cyan-300 font-mono font-bold">
                  <LineChart className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-mono uppercase tracking-wider text-white">Understand Your Bets</h3>
                <p className="text-zinc-400 text-xs sm:text-sm font-mono leading-relaxed">
                  Deep-dive into Statcast velocity, batter barrel rates, pitcher vulnerability, and park factors so you actually know why a pick has mathematical value.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="border border-white/10 bg-zinc-950/80 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-10 w-10 border border-emerald-500/40 bg-emerald-950/40 flex items-center justify-center text-emerald-400 font-mono font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-mono uppercase tracking-wider text-white">Immutable Ledger</h3>
                <p className="text-zinc-400 text-xs sm:text-sm font-mono leading-relaxed">
                  Every decision is locked with SHA-256 cryptographic timestamps before first pitch. Zero deleted losses. Zero phantom edits. 100% transparent accountability.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Founder & Lead Developer Spotlight */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 w-full border border-cyan-500/40 bg-gradient-to-r from-zinc-950 via-black to-cyan-950/40 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-2xl"
          >
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 border-2 border-cyan-400 bg-cyan-950/80 flex items-center justify-center font-mono font-black text-cyan-300 text-xl shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                BRS
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">
                  FOUNDER & PRINCIPAL SYSTEMS ARCHITECT
                </div>
                <div className="font-mono text-2xl font-black text-white">
                  Boyd R. Santos
                </div>
                <div className="font-mono text-xs text-zinc-400">
                  Dartmouth, NS, Canada 🇨🇦 · Building for the analyst community
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <a
                href="/dev"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 border border-cyan-400 bg-cyan-400 hover:bg-cyan-300 text-black px-6 py-3 font-mono text-xs font-black uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(34,211,238,0.25)] no-underline shrink-0"
              >
                <span>Read Full Dev Profile</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </main>

        <FooterSection />
      </div>
    </div>
  );
}
