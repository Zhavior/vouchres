import React from 'react';
import type { GameMatchup } from '../../../types/matchup';

/** Terminal status badge — live (rose pulse) / final (slate) / first pitch (sky). */
export const LiveGamesNextStatusBadge = React.memo(function LiveGamesNextStatusBadge({ m }: { m: GameMatchup }) {
  if (m.isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span className="absolute h-2 w-2 animate-ping rounded-full bg-rose-500" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-rose-400" />
        </span>
        Live
      </span>
    );
  }
  if (m.isFinal) {
    return (
      <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white/40">
        Final
      </span>
    );
  }
  const t = m.gameTime ? new Date(m.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Scheduled';
  return (
    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
      {t}
    </span>
  );
});
