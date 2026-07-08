"use client";
import React from 'react';
export const MatchupIntelligence = () => (
  <div className="grid grid-cols-2 gap-4">
    <div className="p-4 bg-white/5 border border-white/10">
      <div className="text-[8px] text-emerald-400 mb-2 uppercase">Zone_Matrix</div>
      <div className="grid grid-cols-3 gap-1">
        {[...Array(9)].map((_, i) => <div key={i} className={`aspect-square border border-white/5 ${i===4?'bg-emerald-400/20':''}`} />)}
      </div>
    </div>
    <div className="p-4 bg-white/5 border border-white/10 flex items-end gap-1 h-24">
      {[40, 70, 45, 90, 65].map((h, i) => <div key={i} className="flex-1 bg-emerald-400/40" style={{height: `${h}%` }} />)}
    </div>
  </div>
);
