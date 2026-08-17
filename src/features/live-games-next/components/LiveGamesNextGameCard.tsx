import React from 'react';
import type { GameMatchup } from '../../../types/matchup';
import { LiveGamesNextStatusBadge } from './LiveGamesNextStatusBadge';

export interface LiveGamesNextGameCardProps {
  game: GameMatchup;
  isActive: boolean;
  onSelect: (gamePk: number) => void;
}

/** One matchup in the dense slate index. */
export const LiveGamesNextGameCard = React.memo(function LiveGamesNextGameCard({ game, isActive, onSelect }: LiveGamesNextGameCardProps) {
  const showScore = game.isLive || game.isFinal;

  return (
    <button
      type="button"
      onClick={() => onSelect(game.gamePk)}
      data-testid={`live-next-game-${game.gamePk}`}
      aria-pressed={isActive}
      className={`flex w-full flex-col gap-2 rounded-xl border p-3 text-left font-mono transition-all duration-150 ${
        isActive
          ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.12)] ring-1 ring-[var(--aurora-max-emerald)]/50 shadow-[0_0_15px_rgba(0,217,160,0.1)]'
          : game.isLive
            ? 'border-rose-500/40 bg-ve-obsidian hover:border-rose-500/60 hover:bg-ve-graphite'
            : game.isFinal
              ? 'border-white/5 bg-ve-obsidian opacity-60 hover:opacity-100'
              : 'border-white/5 bg-ve-obsidian hover:border-[var(--aurora-max-emerald)]/40 hover:bg-ve-graphite'
      }`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 128px',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[9px] font-bold uppercase tracking-wider text-white/35">
          {game.venue.split(' ')[0] || 'MLB'}
        </span>
        <LiveGamesNextStatusBadge m={game} />
      </div>

      {[game.away, game.home].map((team, index) => (
        <div key={`${game.gamePk}-${index}`} className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            {team.logo && <img src={team.logo} alt="" className="h-5 w-5 shrink-0 object-contain" loading="lazy" />}
            <span className="truncate text-xs font-black text-white">{team.abbreviation}</span>
          </span>
          <span className={`text-sm font-black tabular-nums ${showScore ? 'text-white' : 'text-white/25'}`}>
            {showScore ? (index === 0 ? game.score.away : game.score.home) : '–'}
          </span>
        </div>
      ))}
    </button>
  );
});
