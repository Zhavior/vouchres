import React, { memo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      className="flex w-full select-none items-center gap-2 border border-white/[0.08] bg-white/[0.015] p-2 font-mono"
      role="region"
      aria-label="Team vs team matchup slider"
      data-testid="live-next-matchup-slider"
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous matchup (left arrow)"
        title="Previous matchup (←)"
        className="lg-control flex h-9 shrink-0 items-center justify-center gap-1 px-3 text-xs font-medium cursor-pointer"
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
              className={`flex h-9 shrink-0 items-center gap-2.5 border px-3 text-xs transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'border-white/30 bg-white/[0.08] font-semibold text-white'
                  : 'border-white/[0.06] bg-transparent text-white/55 hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-white'
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

              <span className="flex items-center gap-1 font-mono font-semibold">
                <span className="text-white">{game.away.abbreviation}</span>
                <span className="text-[10px] text-white/30">@</span>
                <span className="text-white">{game.home.abbreviation}</span>
              </span>

              {showScore ? (
                <span className="border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
                  {game.score.away}–{game.score.home}
                </span>
              ) : (
                <span className="hidden text-[10px] tabular-nums text-white/40 sm:inline">
                  {formatMatchupTime(game.gameTime)}
                </span>
              )}

              {game.isLive && <span className="lg-live-dot" aria-label="Live" />}
              {game.isFinal && (
                <span className="text-[8px] font-medium uppercase tracking-wider text-white/40 border border-white/[0.08] px-1">FINAL</span>
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
          className="lg-control flex h-9 items-center justify-center gap-1 px-3 text-xs font-medium cursor-pointer"
        >
          <span className="hidden text-[10px] md:inline">NEXT</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-1 px-2 py-1 text-[10px] text-white/30 lg:flex">
          <kbd className="border border-white/[0.08] bg-white/[0.04] px-1 text-white/55">[←]</kbd>
          <kbd className="border border-white/[0.08] bg-white/[0.04] px-1 text-white/55">[→]</kbd>
        </div>
      </div>
    </div>
  );
});

