"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalCard } from './Terminal';

export const OnboardingModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [handle, setHandle] = useState('');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-obsidian/80 backdrop-blur-xl"
          />

          {/* Modal Card */}
          <TerminalCard className="w-full max-w-md p-8 relative z-10 border-emerald-400/30 shadow-[0_0_50px_rgba(0,229,255,0.1)]">
            <div className="mb-8">
              <div className="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.3em] mb-2">
                System_Access // Step_0{step}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter">
                {step === 1 ? 'Initialize Identity' : 'Verify Credentials'}
              </h2>
            </div>

            {step === 1 ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Claim_Handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-mono">@</span>
                    <input 
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toUpperCase())}
                      placeholder="ANALYST_NAME"
                      className="w-full bg-obsidian border border-white/10 p-4 pl-8 font-mono text-sm focus:border-emerald-400 outline-none transition-all text-white"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  disabled={!handle}
                  className="w-full bg-emerald-400 text-obsidian py-4 font-bold uppercase text-xs tracking-widest hover:bg-white disabled:opacity-20 transition-all"
                >
                  Check Availability
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Email_Address</label>
                  <input 
                    type="email"
                    placeholder="name@intelligence.com"
                    className="w-full bg-obsidian border border-white/10 p-4 font-mono text-sm focus:border-emerald-400 outline-none transition-all text-white"
                  />
                </div>
                <button 
                  className="w-full bg-emerald-400 text-obsidian py-4 font-bold uppercase text-xs tracking-widest hover:bg-white transition-all"
                >
                  Establish Connection
                </button>
              </div>
            )}

            <button 
              onClick={onClose}
              className="mt-6 w-full text-[9px] font-mono text-white/20 uppercase tracking-widest hover:text-white transition-colors"
            >
              [ Cancel_Request ]
            </button>
          </TerminalCard>
        </div>
      )}
    </AnimatePresence>
  );
};
