import React, { useRef, useEffect, memo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Radio, Keyboard, Layers } from 'lucide-react';
import { STRINGS_EN } from '../stringsEn';
import { formatGameClock } from '../presentHrV10Metric';

export interface GameSliderItem {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  gameTime: string;
  lifecycle: string;
  count: number;
}

interface GameMatchupSliderNavProps {
  games: GameSliderItem[];
  activeIndex: number; // -1 for "All Slate", 0..N-1 for specific game slide
  onSelectIndex: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const GameMatchupSliderNav = memo(function GameMatchupSliderNav({
  games,
  activeIndex,
  onSelectIndex,
  onPrev,
  onNext,
}: GameMatchupSliderNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the active pill into view when activeIndex changes
  useEffect(() => {
    if (activeBtnRef.current && scrollContainerRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeIndex]);

  if (games.length === 0) return null;

  const isAll = activeIndex === -1;

  return (
    <div
      className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 mb-4 rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] select-none"
      role="region"
      aria-label={STRINGS_EN.grouping.slider.navAriaLabel}
    >
      {/* Left / Prev Game Button */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="prev-game-btn"
          type="button"
          onClick={onPrev}
          aria-label={STRINGS_EN.grouping.slider.prevGame}
          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white flex items-center justify-center gap-1 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          title={STRINGS_EN.grouping.slider.prevGame}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-mono font-bold hidden md:inline">PREV</span>
        </button>

        {/* Quick "All Slate" Button */}
        <button
          id="all-games-slider-btn"
          type="button"
          onClick={() => onSelectIndex(-1)}
          aria-pressed={isAll}
          className={`min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
            isAll
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{STRINGS_EN.grouping.slider.allGames}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] text-white/60">
            {games.length}
          </span>
        </button>
      </div>

      {/* Horizontal Scrollable Matchup Pills Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none scroll-smooth"
        role="tablist"
        aria-label="MLB Games"
      >
        {games.map((g, idx) => {
          const isActive = activeIndex === idx;
          const isLive = g.lifecycle === 'live';
          const formattedClock = formatGameClock(g.gameTime);

          return (
            <button
              key={g.gameId}
              ref={isActive ? activeBtnRef : null}
              id={`game-slide-btn-${idx}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={STRINGS_EN.grouping.slider.jumpToGame(`${g.awayTeam} @ ${g.homeTeam}`)}
              onClick={() => onSelectIndex(idx)}
              className={`min-h-[38px] shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/5'
              }`}
            >
              {isLive ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold animate-pulse">
                  <Radio className="w-3 h-3" />
                  LIVE
                </span>
              ) : (
                <span className="text-[10px] text-white/40 font-normal">{formattedClock}</span>
              )}

              <span className="font-black tracking-wide text-white">
                {g.awayTeam} <span className="text-white/40 font-normal">@</span> {g.homeTeam}
              </span>

              <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-bold text-white/60">
                {g.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Next Game Button + Keyboard Shortcut Badge */}
      <div className="flex items-center gap-2 shrink-0 justify-end">
        <button
          id="next-game-btn"
          type="button"
          onClick={onNext}
          aria-label={STRINGS_EN.grouping.slider.nextGame}
          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white flex items-center justify-center gap-1 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          title={STRINGS_EN.grouping.slider.nextGame}
        >
          <span className="text-xs font-mono font-bold hidden md:inline">NEXT</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Keyboard Binding Indicator Badge */}
        <div
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 text-[11px] font-mono"
          title={STRINGS_EN.grouping.slider.keyboardHint}
        >
          <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/90 font-bold text-[10px] shadow-sm">
              ←
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/90 font-bold text-[10px] shadow-sm">
              →
            </kbd>
          </div>
          <span className="text-[10px] text-white/40">to slide</span>
        </div>
      </div>
    </div>
  );
});
