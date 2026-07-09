import React, { useState } from 'react';
import type { HrBuckets } from '../../hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../types/hrWatch';
import { HrColumn } from './HrColumn';
import type { HrCardResult } from '../Cards/HrPlayerCard';

interface HrBoardProps {
  buckets: HrBuckets;
  onSelectPlayer: (player: HrWatchRow) => void;
  onViewProfile: (player: HrWatchRow) => void;
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}

type TierKey = keyof HrBuckets;

const TIER_COLUMNS: Array<{
  key: TierKey;
  title: string;
  icon: string;
  colorClass: string;
  borderClass: string;
}> = [
  { key: 'Elite', title: 'Elite', icon: '🥇', colorClass: 'text-vouch-cyan', borderClass: 'border-white/10' },
  { key: 'Strong', title: 'Strong', icon: '🟢', colorClass: 'text-vouch-cyan', borderClass: 'border-white/10' },
  { key: 'Watch', title: 'Watch', icon: '🔵', colorClass: 'text-vouch-cyan', borderClass: 'border-white/10' },
  { key: 'Sleepers', title: 'Sleepers', icon: '🟣', colorClass: 'text-vouch-cyan', borderClass: 'border-white/10' },
];

export const HrBoard = ({ buckets, onSelectPlayer, onViewProfile, getHrResult }: HrBoardProps) => {
  const [mobileTier, setMobileTier] = useState<TierKey>('Elite');
  const activeTier = TIER_COLUMNS.find((t) => t.key === mobileTier) ?? TIER_COLUMNS[0];

  return (
    <div className="flex flex-col gap-2 md:gap-3">
      {/* Mobile: one tier at a time — avoids crushed 2×2 columns */}
      <div
        className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Tier columns"
      >
        {TIER_COLUMNS.map((tier) => {
          const count = buckets[tier.key].length;
          const active = mobileTier === tier.key;
          return (
            <button
              key={tier.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMobileTier(tier.key)}
              className={[
                'flex min-h-11 shrink-0 snap-start items-center gap-1.5 border px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide transition duration-200 touch-manipulation',
                active
                  ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                  : 'border-white/10 bg-black/25 text-zinc-500',
              ].join(' ')}
            >
              <span aria-hidden>{tier.icon}</span>
              <span>{tier.title}</span>
              <span className={[
                'min-w-[1.25rem] border px-1.5 py-0.5 text-center text-[10px] font-black',
                active ? 'border-vouch-cyan/30 bg-black/30 text-vouch-cyan' : 'border-white/10 bg-black/30 text-zinc-500',
              ].join(' ')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="md:hidden" role="tabpanel" aria-label={`${activeTier.title} tier`}>
        <HrColumn
          title={activeTier.title}
          icon={activeTier.icon}
          colorClass={activeTier.colorClass}
          borderClass={activeTier.borderClass}
          players={buckets[activeTier.key]}
          onSelect={onSelectPlayer}
          onViewProfile={onViewProfile}
          getHrResult={getHrResult}
          hideHeader
        />
      </div>

      <div className="hidden items-start gap-3 md:grid md:min-h-0 md:h-[calc(100vh-220px)] md:grid-cols-2 md:items-stretch xl:grid-cols-4">
        {TIER_COLUMNS.map((tier) => (
          <HrColumn
            key={tier.key}
            title={tier.title}
            icon={tier.icon}
            colorClass={tier.colorClass}
            borderClass={tier.borderClass}
            players={buckets[tier.key]}
            onSelect={onSelectPlayer}
            onViewProfile={onViewProfile}
            getHrResult={getHrResult}
          />
        ))}
      </div>
    </div>
  );
};
