"use client";
import React from 'react';

const tickerItems = [
  { label: 'NYY @ LAD', value: 'LINE_SHIFT: -145 → -152', type: 'alert' },
  { label: 'A. JUDGE', value: 'VOUCH_VOL_SPIKE: +124%', type: 'vouch' },
  { label: 'PHI @ ATL', value: 'AI_EDGE: +4.2% (O8.5)', type: 'edge' },
  { label: 'S. OHTANI', value: 'PROP_LOCKED: HR > 0.5', type: 'vouch' },
  { label: 'HOU @ TEX', value: 'SHARP_MONEY_INFLOW: LAD ML', type: 'alert' },
];

export const LiveTicker = () => (
  <div className="fixed bottom-0 left-0 w-full bg-obsidian border-t border-white/10 h-10 flex items-center overflow-hidden z-[100] backdrop-blur-md bg-obsidian/80">
    <div className="flex items-center gap-4 px-4 border-r border-white/10 h-full bg-emerald-400/10">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest whitespace-nowrap">Live_Feed</span>
    </div>
    
    <div className="flex whitespace-nowrap animate-ticker">
      {[...tickerItems, ...tickerItems].map((item, i) => (
        <div key={i} className="flex items-center px-8 border-r border-white/5 h-full">
          <span className="text-[9px] font-mono text-white/40 uppercase mr-2">{item.label}</span>
          <span className={`text-[9px] font-mono font-bold uppercase ${
            item.type === 'edge' ? 'text-emerald-400' : 
            item.type === 'vouch' ? 'text-white' : 'text-white/60'
          }`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>

    <style jsx global>{`
      @keyframes ticker {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-ticker {
        animation: ticker 30s linear infinite;
      }
    `}</style>
  </div>
);
