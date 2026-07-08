import React from 'react';

export const ProfilePreview = ({ handle }: { handle: string }) => (
  <div className="font-mono text-[10px] space-y-4">
    <div className="p-4 bg-emerald-400/10 border border-emerald-400/20 flex justify-between items-center">
      <div>
        <div className="text-white font-bold text-sm uppercase">@{handle || 'ANONYMOUS_USER'}</div>
        <div className="text-emerald-400 text-[8px] uppercase tracking-widest">Identity_Verified</div>
      </div>
      <div className="text-right">
        <div className="text-white/20 uppercase text-[8px]">Trust_Score</div>
        <div className="text-emerald-400 text-lg font-bold">--.-</div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 border border-white/5 bg-white/5 flex flex-col">
        <span className="text-white/20 uppercase text-[8px]">ROI</span>
        <span className="text-white font-bold">0.0%</span>
      </div>
      <div className="p-3 border border-white/5 bg-white/5 flex flex-col">
        <span className="text-white/20 uppercase text-[8px]">Vouches</span>
        <span className="text-white font-bold">0</span>
      </div>
    </div>
    <div className="p-4 border border-white/5 text-center text-white/20 uppercase text-[9px] tracking-widest">
      No_Verification_History_Found
    </div>
  </div>
);
