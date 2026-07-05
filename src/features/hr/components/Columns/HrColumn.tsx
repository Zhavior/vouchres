import React from 'react';
import type { HrWatchRow } from '../../types/hrWatch';
import { HrPlayerCard } from '../Cards/HrPlayerCard';

interface HrColumnProps {
  title: string;
  icon: string;
  colorClass: string;
  borderClass: string;
  players: HrWatchRow[];
  onSelect: (player: HrWatchRow) => void;
}

export const HrColumn = ({ title, icon, colorClass, borderClass, players, onSelect }: HrColumnProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className={`flex items-center justify-between pb-2 border-b ${borderClass}`}>
        <div className={`flex items-center gap-2 font-bold tracking-widest text-sm uppercase ${colorClass}`}>
          <span>{icon}</span> {title}
        </div>
        <span className="text-xs text-zinc-500 font-mono">{players.length}</span>
      </div>
      
      <div className="flex flex-col gap-3">
        {players.map(player => (
          <HrPlayerCard key={player.stableId} player={player} onClick={() => onSelect(player)} />
        ))}
        {players.length === 0 && (
          <div className="p-8 text-center text-zinc-600 text-xs uppercase tracking-widest border border-dashed border-white/[0.05] rounded-xl bg-[#0A0D14]/50">
            No active targets
          </div>
        )}
      </div>
    </div>
  );
};
