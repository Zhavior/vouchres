import React from 'react';
import type { HrBuckets } from '../../hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../types/hrWatch';
import { HrColumn } from './HrColumn';

interface HrBoardProps {
  buckets: HrBuckets;
  onSelectPlayer: (player: HrWatchRow) => void;
}

export const HrBoard = ({ buckets, onSelectPlayer }: HrBoardProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 xl:h-[calc(100vh-220px)]">
      <HrColumn 
        title="Elite" icon="🥇" colorClass="text-amber-400" borderClass="border-amber-500/20" 
        players={buckets.Elite} onSelect={onSelectPlayer} 
      />
      <HrColumn 
        title="Strong" icon="🟢" colorClass="text-emerald-400" borderClass="border-emerald-500/20" 
        players={buckets.Strong} onSelect={onSelectPlayer} 
      />
      <HrColumn 
        title="Watch" icon="🔵" colorClass="text-blue-400" borderClass="border-blue-500/20" 
        players={buckets.Watch} onSelect={onSelectPlayer} 
      />
      <HrColumn 
        title="Sleepers" icon="🟣" colorClass="text-purple-400" borderClass="border-purple-500/20" 
        players={buckets.Sleepers} onSelect={onSelectPlayer} 
      />
    </div>
  );
};
