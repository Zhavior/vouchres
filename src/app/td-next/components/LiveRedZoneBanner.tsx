import React from 'react';
import { Radio, ChevronRight, Zap, ShieldAlert, X } from 'lucide-react';
import type { LiveThreatEvent } from '../../../types/touchdown';

interface LiveRedZoneBannerProps {
  threats: LiveThreatEvent[];
  onSelectGame?: (gameId: string) => void;
}

export const LiveRedZoneBanner: React.FC<LiveRedZoneBannerProps> = ({
  threats,
  onSelectGame,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (threats.length === 0 || dismissed) return null;

  const topThreat = threats[0];

  return (
    <div className="w-full border-b border-ve-red/30 bg-gradient-to-r from-ve-red/10 via-black to-[#13070A] px-4 py-2 text-xs font-mono text-white flex items-center justify-between gap-3 shadow-[0_2px_15px_rgba(244,63,94,0.15)] z-30 animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-2.5 w-2.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ve-red/10 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-ve-red/10"></span>
        </span>

        <span className="rounded bg-ve-red/10 px-1.5 py-0.5 text-[9px] font-bold text-black uppercase tracking-wider shrink-0">
          LIVE RZ THREAT
        </span>

        <span className="text-white/70 font-bold truncate">
          {topThreat.description}
        </span>

        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-ve-red bg-ve-red/10 px-2 py-0.5 rounded border border-ve-red/20 shrink-0">
          <Zap className="h-2.5 w-2.5" />
          Key: {topThreat.keyPlayers.join(', ')}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onSelectGame && (
          <button
            type="button"
            onClick={() => onSelectGame(topThreat.gameId)}
            className="flex items-center gap-1 rounded bg-ve-red/20 border border-ve-red/40 px-2 py-1 text-[10px] font-bold text-ve-red hover:bg-ve-red/10 hover:text-black transition-colors cursor-pointer"
          >
            <span>Focus Game</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-white/40 hover:text-white/70 transition-colors cursor-pointer"
          title="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
