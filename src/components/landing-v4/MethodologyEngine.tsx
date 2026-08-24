import React from 'react';
import { motion } from 'motion/react';
import { Database, Zap, CheckCircle2 } from 'lucide-react';
import { useLandingTelemetry } from '../../hooks/public/useLandingTelemetry';

export default function MethodologyEngine() {
  const { coverage, isLoading } = useLandingTelemetry();

  /*
   * The headline used to read "1.2 Million Data Points", summing a hardcoded
   * table. Nothing the API exposes can substantiate a figure at that scale, so
   * the claim is now the sum of what the feeds actually reported — or nothing
   * at all while they are silent.
   */
  const total = coverage.reduce<number | null>(
    (acc, layer) => (layer.count == null ? acc : (acc ?? 0) + layer.count),
    null,
  );

  return (
    <section id="methodology" className="scroll-mt-20 border-y border-white/5 bg-obsidian-900 px-6 py-28 lg:py-32">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          
          {/* Left: Technical Thesis */}
          <div className="lg:col-span-5 sticky top-40">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <span className="terminal-text text-ve-emerald">03 / COMPUTATIONAL_METHODOLOGY</span>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter italic text-white leading-[0.9]">
                {total != null ? total.toLocaleString() : 'Off-slate'} <br />
                <span className="text-white/20">Evidence Records.</span> <br />
                Zero Guesses.
              </h2>
              <p className="text-xl text-white/55 font-light leading-relaxed pt-6">
                Most models look at the outcome. VouchEdge looks at the evidence.
                Every figure below is the count its own feed returned for today&apos;s
                slate — not an estimate, and blank when the feed is silent.
              </p>
              
              <div className="pt-10 flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex -space-x-2 shrink-0">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-obsidian-900 bg-obsidian-800 flex items-center justify-center">
                      <Database size={14} className="text-white/20" />
                    </div>
                  ))}
                </div>
                <span className="min-w-0 break-all text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Distributed_Node_Processing_Active
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right: The Data Stack */}
          <div className="lg:col-span-7 space-y-4">
            {coverage.map((layer, i) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 border-white/5 hover:border-ve-emerald/20 transition-all group"
              >
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="text-xs font-mono text-ve-emerald/40">{layer.id}</span>
                    <h4 className="text-lg font-bold italic tracking-tight text-white group-hover:text-ve-emerald transition-colors">
                      {layer.label}
                    </h4>
                  </div>
                  {/* Was a hardcoded 'SYNCED' on every row; now it reflects
                      whether that feed actually answered this load. */}
                  <div
                    className={`flex shrink-0 items-center gap-2 px-2 py-1 border ${
                      layer.count != null
                        ? 'bg-ve-emerald/5 border-ve-emerald/20'
                        : 'bg-white/[0.03] border-white/10'
                    }`}
                  >
                    <CheckCircle2 size={10} className={layer.count != null ? 'text-ve-emerald' : 'text-white/25'} />
                    <span
                      className={`text-[8px] font-bold uppercase tracking-widest ${
                        layer.count != null ? 'text-ve-emerald' : 'text-white/25'
                      }`}
                    >
                      {layer.count != null ? 'SYNCED' : isLoading ? 'SYNCING' : 'UNAVAILABLE'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                  <div className="md:col-span-1">
                    <span className="terminal-text block mb-1">{layer.unit}</span>
                    <span className={`text-2xl font-mono tabular-nums ${layer.count != null ? 'text-white' : 'text-white/25'}`}>
                      {layer.count != null ? layer.count.toLocaleString() : 'NO FEED'}
                    </span>
                    {layer.source && (
                      <span className="mt-1 block truncate text-[9px] font-mono uppercase tracking-wider text-white/30">
                        {layer.source}
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-3 space-y-3">
                    <p className="text-sm text-white/40 leading-relaxed">
                      {layer.description}
                    </p>
                    {/* Jargon translation. The label is what the system calls
                        it; this is what it does for the person reading. */}
                    <p className="border-l border-ve-emerald/30 pl-4 text-sm font-light leading-relaxed text-white/55">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ve-emerald">
                        {layer.label.replace(/_/g, ' ')} →{' '}
                      </span>
                      {layer.outcome}
                    </p>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="mt-6 w-full h-[1px] bg-white/5 relative overflow-hidden">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    whileInView={{ x: "100%" }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-ve-emerald/40 to-transparent"
                  />
                </div>
              </motion.div>
            ))}

            {/* Final Output Node */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-12 border border-dashed border-ve-emerald/30 bg-ve-emerald/5 flex flex-col items-center text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-ve-emerald flex items-center justify-center shadow-[0_0_30px_rgba(49,181,131,0.4)]">
                <Zap size={32} className="text-black" />
              </div>
              <div>
                <h3 className="text-2xl font-bold italic text-white tracking-tighter">HYPOTHESIS_GENERATED</h3>
                <p className="terminal-text mt-2">Confidence_Threshold: 92nd_Percentile</p>
              </div>
              <button className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-[10px] hover:bg-ve-emerald transition-all">
                View_Live_Projections
              </button>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
