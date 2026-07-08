"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const OnboardingModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: (handle: string) => void }) => {
  const [handle, setHandle] = useState('');

  const handleSubmit = () => {
    if (!handle) return;
    localStorage.setItem('vouchedge_handle', handle);
    onSuccess(handle);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-obsidian/90 backdrop-blur-xl" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-950 border border-emerald-400/30 p-8 w-full max-w-md relative z-10 shadow-[0_0_50px_rgba(0,229,255,0.1)]">
            <div className="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.3em] mb-2">Identity_Initialization</div>
            <h2 className="text-3xl font-bold tracking-tighter mb-6 text-white">Claim Handle</h2>
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-mono">@</span>
                <input 
                  autoFocus
                  type="text" 
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                  placeholder="ANALYST_NAME"
                  className="w-full bg-obsidian border border-white/10 p-4 pl-8 font-mono text-sm focus:border-emerald-400 outline-none text-white"
                />
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-emerald-400 text-black py-4 font-bold uppercase text-xs tracking-widest hover:bg-white transition-all"
              >
                Establish Connection
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
