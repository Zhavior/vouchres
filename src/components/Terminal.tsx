import React from 'react';

export const TerminalCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-sm relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
    {children}
  </div>
);

export const DataPoint = ({ label, value, active = false }: { label: string, value: string, active?: boolean }) => (
  <div className="flex flex-col gap-1 p-4 border-r border-white/5">
    <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{label}</span>
    <span className={`text-xl font-mono font-bold ${active ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
  </div>
);
