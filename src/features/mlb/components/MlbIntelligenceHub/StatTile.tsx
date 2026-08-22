import React from 'react';
import { AURORA_STAT_CHIP, AURORA_SURFACE, AURORA_LABEL } from '../../../../theme/auroraTokens';

export const StatTile = React.memo(function StatTile({ label, value, tone = 'slate' }: { label: string; value: React.ReactNode; tone?: 'slate' | 'sky' | 'emerald' | 'amber' }) {
  const toneClass =
    tone === 'sky' ? 'text-vouch-cyan border border-vouch-cyan/20 bg-vouch-cyan/5' :
    tone === 'emerald' ? 'text-vouch-emerald border border-vouch-emerald/20 bg-vouch-emerald/5' :
    tone === 'amber' ? 'text-amber-300 border border-amber-400/20 bg-amber-400/5' :
    `text-white/80 ${AURORA_SURFACE}`;

  return (
    <div className={`rounded-2xl p-3 ${AURORA_STAT_CHIP} ${toneClass}`}>
      <p className={`${AURORA_LABEL} opacity-70`}>{label}</p>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
});
