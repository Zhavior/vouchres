import React from 'react';
import type { GameMatchup } from '../../../types/matchup';
import { LiveGamesNextStatusBadge } from './LiveGamesNextStatusBadge';

export interface LiveGamesNextGameCardProps {
  game: GameMatchup;
  isActive: boolean;
  onSelect: (gamePk: number) => void;
}

/** One matchup card in the dense slate index. */
export const LiveGamesNextGameCard = React.memo(function LiveGamesNextGameCard({ game, isActive, onSelect }: LiveGamesNextGameCardProps) {
  const showScore = game.isLive || game.isFinal;

  return (
    <button
      type="button"
      onClick={() => onSelect(game.gamePk)}
      data-testid={`live-next-game-${game.gamePk}`}
      aria-pressed={isActive}
      className={`flex w-full flex-col justify-between gap-3 border p-3.5 text-left font-mono transition-colors duration-150 cursor-pointer ${
        isActive
          ? 'border-white/30 bg-white/[0.06]'
          : game.isLive
            ? 'border-ve-red/25 bg-ve-red/[0.04] hover:border-ve-red/40 hover:bg-ve-red/[0.07]'
            : game.isFinal
              ? 'border-white/[0.06] bg-white/[0.015] opacity-70 hover:opacity-100 hover:border-white/[0.16]'
              : 'border-white/[0.08] bg-white/[0.015] hover:border-white/[0.16] hover:bg-white/[0.04]'
      }`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 128px',
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-1.5">
        <span className="truncate text-[9px] font-medium uppercase tracking-wider text-white/40">
          {game.venue.split(' ')[0] || 'MLB'}
        </span>
        <LiveGamesNextStatusBadge m={game} />
      </div>

      <div className="space-y-1.5">
        {[game.away, game.home].map((team, index) => (
          <div key={`${game.gamePk}-${index}`} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              {team.logo && <img src={team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />}
              <span className="truncate text-xs font-semibold text-white">{team.abbreviation}</span>
            </span>
            <span className={`text-sm font-bold tabular-nums font-mono ${showScore ? 'text-white' : 'text-white/25'}`}>
              {showScore ? (index === 0 ? game.score.away : game.score.home) : '–'}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
});
