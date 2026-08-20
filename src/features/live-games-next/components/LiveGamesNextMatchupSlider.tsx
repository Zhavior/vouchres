import React, { memo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import type { GameMatchup } from '../../../types/matchup';

export interface LiveGamesNextMatchupSliderProps {
  games: GameMatchup[];
  activeGamePk: number | null;
  onSelect: (gamePk: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

function formatMatchupTime(gameTime: string): string {
  const iso = Date.parse(gameTime);
  if (Number.isFinite(iso)) {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return gameTime || 'TBD';
}

export const LiveGamesNextMatchupSlider = memo(function LiveGamesNextMatchupSlider({
  games,
  activeGamePk,
  onSelect,
  onPrev,
  onNext,
}: LiveGamesNextMatchupSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const chip = activeChipRef.current;
    if (!track || !chip) return;
    const trackRect = track.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const delta = (chipRect.left + chipRect.width / 2) - (trackRect.left + trackRect.width / 2);
    if (Math.abs(delta) < 1) return;
    track.scrollBy({ left: delta, behavior: 'smooth' });
  }, [activeGamePk]);

  if (games.length === 0) return null;

  return (
    <div
      className="flex w-full select-none items-center gap-2 border-2 border-white/15 bg-black p-2 font-mono shadow-2xl"
      role="region"
      aria-label="Team vs team matchup slider"
      data-testid="live-next-matchup-slider"
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous matchup (left arrow)"
        title="Previous matchup (←)"
        className="flex h-9 shrink-0 items-center justify-center gap-1 border border-white/20 bg-zinc-900 px-3 text-xs font-bold text-zinc-300 transition-all hover:border-white hover:text-white cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden text-[10px] md:inline">PREV</span>
      </button>

      <div
        ref={trackRef}
        className="flex flex-1 items-center gap-2 overflow-x-auto scroll-smooth px-1 py-1 tn-scrollbar-none"
        role="tablist"
        aria-label="Live team vs team matchups"
      >
        {games.map((game) => {
          const isActive = activeGamePk === game.gamePk;
          const showScore = game.isLive || game.isFinal;

          return (
            <button
              key={game.gamePk}
              ref={isActive ? activeChipRef : null}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(game.gamePk)}
              data-testid={`live-next-matchup-chip-${game.gamePk}`}
              className={`flex h-9 shrink-0 items-center gap-2.5 border px-3 text-xs transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'border-2 border-cyan-400 bg-zinc-950 font-black text-cyan-300'
                  : 'border-white/10 bg-black text-zinc-400 hover:border-white/30 hover:text-white'
              }`}
            >
              <span className="flex items-center -space-x-1">
                {game.away.logo && (
                  <img
                    src={game.away.logo}
                    alt=""
                    loading="lazy"
                    className="h-4 w-4 shrink-0 object-contain"
                  />
                )}
                {game.home.logo && (
                  <img
                    src={game.home.logo}
                    alt=""
                    loading="lazy"
                    className="h-4 w-4 shrink-0 object-contain"
                  />
                )}
              </span>

              <span className="flex items-center gap-1 font-mono font-bold">
                <span className="text-white">{game.away.abbreviation}</span>
                <span className="text-[10px] text-zinc-500">@</span>
                <span className="text-white">{game.home.abbreviation}</span>
              </span>

              {showScore ? (
                <span className="border border-white/10 bg-zinc-900 px-1.5 py-0.2 text-[10px] font-bold tabular-nums text-white">
                  {game.score.away}–{game.score.home}
                </span>
              ) : (
                <span className="hidden text-[10px] text-zinc-500 sm:inline">
                  {formatMatchupTime(game.gameTime)}
                </span>
              )}

              {game.isLive && (
                <Radio className="h-3 w-3 animate-pulse text-rose-400" aria-label="Live" />
              )}
              {game.isFinal && (
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 border border-white/10 px-1">FINAL</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onNext}
          aria-label="Next matchup (right arrow)"
          title="Next matchup (→)"
          className="flex h-9 items-center justify-center gap-1 border border-white/20 bg-zinc-900 px-3 text-xs font-bold text-zinc-300 transition-all hover:border-white hover:text-white cursor-pointer"
        >
          <span className="hidden text-[10px] md:inline">NEXT</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-1 border border-white/10 bg-black px-2 py-1 text-[10px] text-zinc-500 lg:flex">
          <kbd className="border border-white/20 bg-zinc-900 px-1 text-zinc-300">[←]</kbd>
          <kbd className="border border-white/20 bg-zinc-900 px-1 text-zinc-300">[→]</kbd>
        </div>
      </div>
    </div>
  );
});

