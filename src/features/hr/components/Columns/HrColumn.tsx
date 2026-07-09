import React from 'react';
import type { HrWatchRow } from '../../types/hrWatch';
import { HrPlayerCard, type HrCardResult } from '../Cards/HrPlayerCard';

interface HrColumnProps {
  title: string;
  icon: string;
  colorClass: string;
  borderClass: string;
  players: HrWatchRow[];
  onSelect: (player: HrWatchRow) => void;
  onViewProfile: (player: HrWatchRow) => void;
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}

export const HrColumn = React.memo(function HrColumn({ title, icon, colorClass, borderClass, players, onSelect, onViewProfile, getHrResult }: HrColumnProps) {
  return (
    <section className={`flex h-full min-h-0 flex-col overflow-hidden border ${borderClass} bg-black/25`}>
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0A0A0A]/95 px-3 py-2 font-mono">
        <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] ${colorClass}`}>
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <span className="border border-white/10 bg-black/30 px-2 py-0.5 font-mono text-[11px] text-zinc-500">{players.length}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {players.map((player) => (
          <HrPlayerCard
            key={player.stableId}
            player={player}
            onClick={() => onSelect(player)}
            onViewProfile={onViewProfile}
            hrResult={getHrResult?.(player.playerId) ?? null}
          />
        ))}

        {players.length === 0 && (
          <div className="border border-dashed border-white/10 bg-black/30 p-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
            No active targets
          </div>
        )}
      </div>
    </section>
  );
});
