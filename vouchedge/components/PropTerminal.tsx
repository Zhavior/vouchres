import React from 'react';
import { VouchButton } from './VouchButton';
export const PropTerminal = () => (
  <div className="font-mono text-[10px] space-y-2">
    {[ {p:'A. JUDGE', e:'+4.2%'}, {p:'S. OHTANI', e:'+2.8%'} ].map((item, i) => (
      <div key={i} className="flex justify-between items-center p-2 border-b border-white/5">
        <span className="text-white">{item.p}</span>
        <span className="text-emerald-400 font-bold">{item.e}</span>
        <VouchButton />
      </div>
    ))}
  </div>
);
