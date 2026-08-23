import React from 'react';
import { motion } from 'motion/react';

export default function FinalStatement() {
  return (
    <section className="py-60 px-6 text-center bg-obsidian-950 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(49,181,131,0.03),transparent_70%)] pointer-events-none" />
      
      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "circOut" }}
          className="space-y-12"
        >
          <h2 className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter italic text-white leading-none">
            Anyone can predict. <br />
            <span className="text-ve-emerald">VouchEdge remembers.</span>
          </h2>
          
          <div className="flex flex-col items-center gap-8">
            <p className="terminal-text text-lg tracking-[0.5em] opacity-40">
              Evidence over hindsight.
            </p>
            
            <div className="h-20 w-[1px] bg-gradient-to-b from-ve-emerald to-transparent" />
            
            <button className="px-16 py-8 bg-ve-emerald text-black font-bold uppercase tracking-[0.4em] text-sm hover:bg-white transition-all shadow-[0_0_50px_rgba(49,181,131,0.2)]">
              Initialize Connection
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Metadata */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-7xl px-6 flex justify-between items-center opacity-10">
        <span className="terminal-text">System_v2.4.0_Stable</span>
        <span className="terminal-text">Node_Proxima_01</span>
      </div>
    </section>
  );
}
