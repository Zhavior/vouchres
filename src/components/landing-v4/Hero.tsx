import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import HeroCommandCarousel from './HeroCommandCarousel';

export default function Hero() {
  return (
    <section className="relative min-h-[95vh] flex items-center pt-32 pb-20 px-6 overflow-hidden">
      <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        
        {/* Left Side: Editorial */}
        <div className="lg:col-span-7 space-y-10">
          {/* No opacity gate: the eyebrow and headline are the hero's meaning and
              must be legible on the first painted frame. Motion still enhances via
              the x-offset, which MotionConfig reducedMotion="user" neutralises. */}
          <motion.div
            initial={{ x: -14 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-ve-emerald animate-pulse" />
              <span className="terminal-text text-ve-emerald">LIVE MODEL // MLB HR INTELLIGENCE // COVERAGE AUDITED</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter italic leading-[0.85] text-white">
              The First MLB Model <br />
              {/* Ghost line keeps the two-tone treatment; white/10 measured ~1.2:1 and was
                  effectively invisible on mobile. white/25 holds the hierarchy and reads. */}
              <span className="text-white/25">That Refuses to Guess.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ y: 6 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="text-lg sm:text-xl text-white/55 max-w-xl leading-relaxed font-light"
          >
            Build and lock auditable home-run hypotheses from Statcast telemetry, 
            matchup vulnerabilities, park context, and explicit evidence coverage.
          </motion.p>

          <motion.div 
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.06, duration: 0.4, ease: 'easeOut' }}
            className="flex flex-wrap gap-4"
          >
            <button className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-ve-emerald transition-all flex items-center gap-3">
              Launch HR Command Desk <ArrowRight size={16} />
            </button>
            <button className="px-8 py-4 border border-white/10 hover:bg-white/5 transition-all text-[10px] font-mono uppercase tracking-widest text-white/40">
              Inspect Audit Ledger
            </button>
          </motion.div>
          
          {/* Telemetry Strip */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.35 }}
            className="pt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/5 sm:flex sm:gap-12"
          >
            {[
              { val: '15', label: 'Games_Active' },
              { val: '270/270', label: 'Lineups_Synced' },
              { val: '14', label: 'Elite_Candidates' },
              { val: 'LIVE', label: 'Model_Status', color: 'text-ve-emerald' }
            ].map((item) => (
              <div key={item.label} className="min-w-0">
                <p className={`text-lg font-mono ${item.color || 'text-white'}`}>{item.val}</p>
                <p className="text-[8px] font-mono text-white/35 uppercase tracking-tighter break-words">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Side: Command HUD */}
        <div className="lg:col-span-5 relative">
          <div className="absolute -inset-4 bg-ve-emerald/5 blur-3xl rounded-full pointer-events-none" />
          <HeroCommandCarousel />
        </div>
      </div>
    </section>
  );
}
