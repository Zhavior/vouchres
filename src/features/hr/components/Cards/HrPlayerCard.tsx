import React from 'react';
import type { HrWatchRow } from '../../types/hrWatch';
import { Wind, ChevronRight } from 'lucide-react';

interface HrPlayerCardProps {
  player: HrWatchRow;
  onClick: () => void;
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-amber-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 70) return 'text-blue-400';
  return 'text-zinc-400';
}

export const HrPlayerCard = ({ player, onClick }: HrPlayerCardProps) => {
  return (
    <button 
      onClick={onClick}
      className="group w-full text-left bg-[#0A0D14] hover:bg-[#11141D] border border-white/[0.05] hover:border-white/[0.15] rounded-xl p-4 transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 opacity-20 group-hover:opacity-100 transition-opacity ${getScoreColor(player.hrScore).replace('text', 'bg')}`} />

      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-zinc-100 font-bold text-lg tracking-tight">{player.playerName}</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">
            {player.team} <span className="mx-1 opacity-50">@</span> {player.opponent}
          </p>
        </div>
        <div className={`text-2xl font-black ${getScoreColor(player.hrScore)}`}>
          {player.hrScore}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-black/40 rounded-lg p-2 border border-white/[0.02]">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Pitcher</p>
          <p className="text-xs text-zinc-300 font-medium truncate">{player.pitcherName || 'TBD'}</p>
        </div>
        <div className="bg-black/40 rounded-lg p-2 border border-white/[0.02]">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Edge</p>
          <p className="text-xs text-zinc-300 font-medium">{player.vouchScore != null ? `${player.vouchScore}%` : '—'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-3">
          {player.oddsLabel && (
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-400 bg-white/5 px-2 py-1 rounded-md">
              <Wind className="w-3 h-3 text-emerald-400" /> {player.oddsLabel}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
};
