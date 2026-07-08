import React from 'react';
import { VouchButton } from './VouchButton';
export const VouchLedger = () => (
  <div className="w-full font-mono text-[10px] space-y-2">
    {['ALPHA_QUANT', 'SHARP_BETTOR', 'DATA_MINER'].map((u, i) => (
      <div key={i} className="flex justify-between items-center p-2 border-b border-white/5">
        <span className="text-white/80">@{u}</span>
        <span className="text-[#00E5FF] font-bold">NYY ML</span>
        <VouchButton />
      </div>
    ))}
  </div>
);
