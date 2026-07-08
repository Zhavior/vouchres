"use client";
import React, { useState } from 'react';
export const VouchButton = () => {
  const [v, setV] = useState(false);
  return (
    <button onClick={() => setV(true)} className={`px-3 py-1 font-mono text-[9px] font-bold uppercase border transition-all ${v ? 'bg-[#00E5FF] text-black border-[#00E5FF]' : 'border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black'}`}>
      {v ? '✓ Vouched' : '+ Vouch'}
    </button>
  );
};
