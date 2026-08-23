import React from 'react';
import { motion } from 'motion/react';
import { XCircle, ShieldCheck, Clock, Database, Trash2, Lock } from 'lucide-react';

export default function AuditContrast() {
  return (
    <section className="py-40 px-6 bg-obsidian-950 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-24">
          <span className="terminal-text text-ve-red mb-4 block">04 / MARKET_ACCOUNTABILITY</span>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter italic text-white">
            Predictions are cheap. <br />
            <span className="text-white/20">Accountability is rare.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left: The Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative p-10 border border-white/5 bg-white/[0.02] flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="terminal-text text-ve-red">THE_OLD_WAY</span>
              <Trash2 size={16} className="text-ve-red/40" />
            </div>

            <div className="space-y-8 flex-1">
              <div className="p-6 bg-ve-red/5 border border-ve-red/20 rounded opacity-60 grayscale">
                <p className="text-lg font-bold italic text-white mb-2">"MAX LOCK 🔥 Trust me. He's due."</p>
                <div className="flex items-center gap-2 text-ve-red text-[10px] font-bold uppercase">
                  <XCircle size={12} /> Post_Deleted_By_Author
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                {[
                  "No evidence record",
                  "No confidence history",
                  "No missing-data disclosure",
                  "No permanent timestamp"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/20">
                    <XCircle size={12} className="text-ve-red/40" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-white/5 text-center">
              <span className="text-[10px] font-mono text-white/10 uppercase tracking-[0.4em]">
                Result: Selective_Memory
              </span>
            </div>
          </motion.div>

          {/* Right: The VouchEdge Way */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative p-10 border border-ve-emerald/20 bg-ve-emerald/[0.02] flex flex-col shadow-[0_0_50px_rgba(49,181,131,0.05)]"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="terminal-text text-ve-emerald">THE_VOUCHEDGE_WAY</span>
              <ShieldCheck size={16} className="text-ve-emerald" />
            </div>

            <div className="space-y-6 flex-1">
              <div className="glass-panel p-6 border-ve-emerald/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-mono text-ve-emerald mb-1">HYPOTHESIS_LOCKED</p>
                    <h4 className="text-xl font-bold italic text-white">AARON JUDGE</h4>
                  </div>
                  <Lock size={16} className="text-ve-emerald" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-2 bg-white/5 border border-white/5">
                    <p className="text-[8px] text-white/40 uppercase mb-1">HRPI_At_Lock</p>
                    <p className="text-sm font-mono text-white">98.4</p>
                  </div>
                  <div className="p-2 bg-white/5 border border-white/5">
                    <p className="text-[8px] text-white/40 uppercase mb-1">Coverage</p>
                    <p className="text-sm font-mono text-white">94%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-ve-emerald text-[10px] font-bold uppercase tracking-widest">
                  <Clock size={12} /> 2024.08.22_19:05_UTC
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {[
                  "Immutable evidence hash",
                  "Full confidence transparency",
                  "Explicit data gap disclosure",
                  "Permanent audit receipt"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60">
                    <ShieldCheck size={12} className="text-ve-emerald" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-white/5 text-center">
              <span className="text-[10px] font-mono text-ve-emerald uppercase tracking-[0.4em]">
                Result: Permanent_Audit_Record
              </span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
