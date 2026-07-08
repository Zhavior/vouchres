import React from 'react';
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

export const HrBoard = ({ buckets, onSelectPlayer, onViewProfile, getHrResult }: HrBoardProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 xl:h-[calc(100vh-220px)]">
      <HrColumn
        title="Elite" icon="🥇" colorClass="text-[#00E5FF]" borderClass="border-white/10"
        players={buckets.Elite} onSelect={onSelectPlayer} onViewProfile={onViewProfile} getHrResult={getHrResult}
      />
      <HrColumn
        title="Strong" icon="🟢" colorClass="text-[#00E5FF]" borderClass="border-white/10"
        players={buckets.Strong} onSelect={onSelectPlayer} onViewProfile={onViewProfile} getHrResult={getHrResult}
      />
      <HrColumn
        title="Watch" icon="🔵" colorClass="text-[#00E5FF]" borderClass="border-white/10"
        players={buckets.Watch} onSelect={onSelectPlayer} onViewProfile={onViewProfile} getHrResult={getHrResult}
      />
      <HrColumn
        title="Sleepers" icon="🟣" colorClass="text-[#00E5FF]" borderClass="border-white/10"
        players={buckets.Sleepers} onSelect={onSelectPlayer} onViewProfile={onViewProfile} getHrResult={getHrResult}
      />
    </div>
  );
};
