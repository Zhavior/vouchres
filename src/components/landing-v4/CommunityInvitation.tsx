import React from 'react';
import { motion } from 'motion/react';
import { Search, Send, Lock, ShieldCheck, Award, ArrowRight } from 'lucide-react';

const STEPS = [
  { label: 'RESEARCH', icon: Search, desc: 'Analyze the slate using neural telemetry.' },
  { label: 'PUBLISH', icon: Send, desc: 'Document your reasoning and evidence.' },
  { label: 'LOCK', icon: Lock, desc: 'Commit to the hypothesis before first pitch.' },
  { label: 'VERIFY', icon: ShieldCheck, desc: 'System audits the outcome automatically.' },
  { label: 'REPUTATION', icon: Award, desc: 'Build a permanent, unshakeable record.' },
];

export default function CommunityInvitation() {
  return (
    <section className="py-40 px-6 bg-obsidian-900 relative overflow-hidden border-t border-white/5">
      {/* Background Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[radial-gradient(circle_at_50%_100%,rgba(49,181,131,0.03),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="max-w-3xl mb-20">
          <span className="terminal-text text-ve-emerald mb-4 block">05 / OPERATOR_NETWORK</span>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter italic text-white leading-tight mb-8">
            Don’t follow another pick. <br />
            <span className="text-ve-emerald">Build a record.</span>
          </h2>
          <p className="text-xl text-white/55 font-light leading-relaxed">
            VouchEdge is more than a model—it is an accountability network. 
            Research the slate. Publish your reasoning. Lock your hypotheses. 
            Let the outcomes build your reputation in a market that never forgets.
          </p>
        </div>

        {/* Progression Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative mb-20">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -translate-y-1/2 z-0" />
          
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-full bg-obsidian-800 border border-white/10 flex items-center justify-center mb-6 group-hover:border-ve-emerald/50 transition-all duration-500 shadow-xl">
                <step.icon size={24} className="text-white/20 group-hover:text-ve-emerald transition-colors" />
              </div>
              <h4 className="text-xs font-bold tracking-[0.2em] text-white mb-2">{step.label}</h4>
              <p className="text-[10px] text-white/30 uppercase leading-relaxed px-4">
                {step.desc}
              </p>
              
              {/* Mobile Arrow */}
              {i < STEPS.length - 1 && (
                <div className="md:hidden my-4 text-white/10">
                  <ArrowRight size={16} className="rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-10 border-t border-white/5">
          <button className="w-full sm:w-auto px-12 py-6 bg-white text-black font-bold uppercase tracking-[0.3em] text-xs hover:bg-ve-emerald transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            Enter VouchEdge <ArrowRight size={16} />
          </button>
          <button className="w-full sm:w-auto px-12 py-6 border border-white/10 hover:bg-white/5 transition-all terminal-text flex items-center justify-center gap-3">
            Explore Public Ledger
          </button>
        </div>
      </div>
    </section>
  );
}
