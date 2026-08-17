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

/**
 * Team-vs-team carousel over the filtered slate — the Live Games version of the
 * HR Next matchup slider. ← / → cycle the featured game; the active chip
 * self-centers inside its own track without moving the page.
 */
export const LiveGamesNextMatchupSlider = memo(function LiveGamesNextMatchupSlider({
  games,
  activeGamePk,
  onSelect,
  onPrev,
  onNext,
}: LiveGamesNextMatchupSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);

  // Center the active chip in the track. scrollBy on the track only — never
  // scrollIntoView, which would drag the sticky header's page scroll with it.
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
      className="flex w-full select-none items-center gap-2 rounded-2xl border border-white/10 bg-ve-obsidian/90 p-2 font-mono shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl"
      role="region"
      aria-label="Team vs team matchup slider"
      data-testid="live-next-matchup-slider"
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous matchup (left arrow)"
        title="Previous matchup (←)"
        className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 text-xs font-bold text-white/80 transition-all hover:bg-white/15 hover:text-white active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden text-[10px] md:inline">PREV</span>
      </button>

      <div
        ref={trackRef}
        className="flex flex-1 items-center gap-2 overflow-x-auto scroll-smooth px-1 py-1 scrollbar-none"
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
              className={`flex h-9 shrink-0 items-center gap-2.5 rounded-xl border px-3 text-xs transition-all duration-200 focus:outline-none ${
                isActive
                  ? 'border-[var(--aurora-max-emerald)]/50 bg-[var(--aurora-max-emerald)]/20 font-bold text-[var(--aurora-max-emerald)] shadow-[0_0_15px_rgba(0,217,160,0.3)]'
                  : 'border-white/5 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center -space-x-1.5">
                {game.away.logo && (
                  <img
                    src={game.away.logo}
                    alt=""
                    loading="lazy"
                    className="h-4 w-4 rounded-full border border-white/10 bg-black/40 object-contain p-0.5"
                  />
                )}
                {game.home.logo && (
                  <img
                    src={game.home.logo}
                    alt=""
                    loading="lazy"
                    className="h-4 w-4 rounded-full border border-white/10 bg-black/40 object-contain p-0.5"
                  />
                )}
              </span>

              <span className="flex items-center gap-1 font-mono font-bold">
                <span className="text-white">{game.away.abbreviation}</span>
                <span className="text-[10px] font-normal text-white/40">@</span>
                <span className="text-white">{game.home.abbreviation}</span>
              </span>

              {showScore ? (
                <span className="rounded bg-black/50 px-1.5 py-0.2 text-[10px] font-bold tabular-nums text-white/80">
                  {game.score.away}–{game.score.home}
                </span>
              ) : (
                <span className="hidden text-[10px] font-normal text-white/40 sm:inline">
                  {formatMatchupTime(game.gameTime)}
                </span>
              )}

              {game.isLive && (
                <Radio className="h-3 w-3 animate-pulse text-rose-400" aria-label="Live" />
              )}
              {game.isFinal && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">Final</span>
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
          className="flex h-9 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 text-xs font-bold text-white/80 transition-all hover:bg-white/15 hover:text-white active:scale-95"
        >
          <span className="hidden text-[10px] md:inline">NEXT</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/40 lg:flex">
          <kbd className="rounded border border-white/10 bg-black/40 px-1 py-0.2 text-white/80">←</kbd>
          <kbd className="rounded border border-white/10 bg-black/40 px-1 py-0.2 text-white/80">→</kbd>
        </div>
      </div>
    </div>
  );
});
