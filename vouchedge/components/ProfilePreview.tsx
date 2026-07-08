import React from 'react';
export const ProfilePreview = () => (
  <div className="font-mono text-[10px] space-y-4">
    <div className="p-3 bg-emerald-400/10 border border-emerald-400/20 flex justify-between">
      <span className="text-white font-bold">@ALPHA_ZULU</span>
      <span className="text-emerald-400">TRUST: 98.4</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="p-2 border border-white/5">ROI: +14.2%</div>
      <div className="p-2 border border-white/5">WINS: 58%</div>
    </div>
  </div>
);
