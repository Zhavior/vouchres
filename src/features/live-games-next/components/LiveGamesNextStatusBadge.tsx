import React from 'react';
import type { GameMatchup } from '../../../types/matchup';

/** Status chip — live (rose LED) / final (quiet) / first pitch (emerald). */
export const LiveGamesNextStatusBadge = React.memo(function LiveGamesNextStatusBadge({ m }: { m: GameMatchup }) {
  if (m.isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 border border-ve-red/25 bg-ve-red/10 px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-ve-red">
        <span className="lg-live-dot" />
        Live
      </span>
    );
  }
  if (m.isFinal) {
    return (
      <span className="border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-white/40">
        Final
      </span>
    );
  }
  const t = m.gameTime ? new Date(m.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Scheduled';
  return (
    <span className="border border-ve-emerald/25 bg-ve-emerald/10 px-2 py-0.5 font-mono text-[9px] font-medium tabular-nums text-ve-emerald">
      {t}
    </span>
  );
});
