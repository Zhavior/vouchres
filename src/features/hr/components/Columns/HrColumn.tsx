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
  /** Mobile tab view already shows tier label — skip duplicate header */
  hideHeader?: boolean;
}

export const HrColumn = React.memo(function HrColumn({ title, icon, colorClass, borderClass, players, onSelect, onViewProfile, getHrResult, hideHeader = false }: HrColumnProps) {
  return (
    <section className={`flex min-w-0 flex-col border ${borderClass} bg-black/25 md:h-full md:min-h-0 md:overflow-hidden`}>
      {!hideHeader && (
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-ve-obsidian/95 px-2 py-1.5 font-mono md:px-3 md:py-2">
          <div className={`flex min-w-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] md:gap-2 md:text-xs md:tracking-[0.18em] ${colorClass}`}>
            <span className="shrink-0">{icon}</span>
            <span className="truncate">{title}</span>
          </div>
          <span className="shrink-0 border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 md:px-2 md:text-[11px]">{players.length}</span>
        </div>
      )}

      <div className="flex flex-col gap-2 p-2 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-2">
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
