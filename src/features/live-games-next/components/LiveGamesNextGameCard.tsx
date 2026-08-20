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
      className={`flex w-full flex-col justify-between gap-3 border-2 p-3.5 text-left font-mono transition-all duration-150 cursor-pointer ${
        isActive
          ? 'border-cyan-400 bg-zinc-950 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
          : game.isLive
            ? 'border-rose-500/50 bg-black hover:border-rose-500 hover:bg-zinc-950'
            : game.isFinal
              ? 'border-white/10 bg-black opacity-70 hover:opacity-100 hover:border-white/30'
              : 'border-white/10 bg-black hover:border-cyan-400/60 hover:bg-zinc-950'
      }`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 128px',
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
        <span className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          {game.venue.split(' ')[0] || 'MLB'}
        </span>
        <LiveGamesNextStatusBadge m={game} />
      </div>

      <div className="space-y-1.5">
        {[game.away, game.home].map((team, index) => (
          <div key={`${game.gamePk}-${index}`} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              {team.logo && <img src={team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />}
              <span className="truncate text-xs font-bold text-white">{team.abbreviation}</span>
            </span>
            <span className={`text-sm font-black tabular-nums font-mono ${showScore ? 'text-white' : 'text-zinc-600'}`}>
              {showScore ? (index === 0 ? game.score.away : game.score.home) : '–'}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
});

