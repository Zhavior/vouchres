"use client";
import { motion } from 'framer-motion';
export const Ticker = () => (
  <div className="fixed bottom-0 left-0 w-full bg-black border-t border-white/10 py-2 z-50 overflow-hidden">
    <motion.div animate={{ x: "-50%" }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="flex whitespace-nowrap gap-12">
      {[1,2].map(i => (
        <span key={i} className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
          MLB_LIVE: NYY (-122) @ LAD (+110) // VOUCH_ALERT: @ALPHA_QUANT VOUCHED PHI ML // SYSTEM_STABLE //
        </span>
      ))}
    </motion.div>
  </div>
);
