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
  onViewProfile: (player: HrWatchRow) => void;
}

export const HrColumn = ({ title, icon, colorClass, borderClass, players, onSelect, onViewProfile }: HrColumnProps) => {
  return (
    <section className={`min-h-0 overflow-hidden rounded-2xl border ${borderClass} bg-[rgba(10,13,20,.88)]`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#0A0D14]/95 px-3 py-2 backdrop-blur">
        <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] ${colorClass}`}>
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <span className="font-mono text-[11px] text-zinc-500">{players.length}</span>
      </div>

      <div className="flex max-h-[calc(100vh-270px)] flex-col gap-2 overflow-y-auto p-2">
        {players.map((player) => (
          <HrPlayerCard key={player.stableId} player={player} onClick={() => onSelect(player)} onViewProfile={onViewProfile} />
        ))}

        {players.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/[0.06] bg-black/20 p-6 text-center text-[11px] uppercase tracking-[0.18em] text-zinc-600">
            No active targets
          </div>
        )}
      </div>
    </section>
  );
};
