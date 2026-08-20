import React, { useRef, useEffect, memo } from 'react';
import { ChevronLeft, ChevronRight, Layers, Radio, Sparkles } from 'lucide-react';
import { logoByTeamName } from '../../../lib/teamLogos';

export interface HrNextMatchupItem {
  id: string;
  awayTeam: string;
  homeTeam: string;
  gameTime?: string | null;
  count: number;
}

export interface HrNextMatchupSliderProps {
  matchups: HrNextMatchupItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

function formatMatchupTime(gameTime?: string | null): string {
  if (!gameTime) return 'LIVE';
  const iso = Date.parse(gameTime);
  if (Number.isFinite(iso)) {
    const dt = new Date(iso);
    return dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return gameTime;
}

export const HrNextMatchupSlider = memo(function HrNextMatchupSlider({
  matchups,
  activeIndex,
  onSelectIndex,
  onPrev,
  onNext,
}: HrNextMatchupSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeBtnRef.current && scrollContainerRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeIndex]);

  if (matchups.length === 0) return null;

  const isAll = activeIndex === -1;

  return (
    <div
      className="w-full flex items-center gap-2 p-2 border-2 border-white/15 bg-black shadow-2xl select-none font-mono"
      role="region"
      aria-label="Live Matchups Slider"
    >
      {/* Left Prev Navigation */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous Matchup (←)"
          title="Previous Matchup (←)"
          className="h-9 px-3 border border-white/20 bg-zinc-900 text-zinc-300 hover:border-white hover:text-white flex items-center justify-center gap-1 transition-all text-xs font-bold cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden md:inline text-[10px]">PREV</span>
        </button>

        {/* All Matchups Button */}
        <button
          type="button"
          onClick={() => onSelectIndex(-1)}
          aria-pressed={isAll}
          className={`h-9 flex items-center gap-2 px-3 text-xs font-bold transition-all border cursor-pointer ${
            isAll
              ? 'border-2 border-cyan-400 bg-zinc-950 text-cyan-300 font-black'
              : 'border-white/15 bg-black text-zinc-400 hover:border-white/30 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="uppercase">All Games</span>
          <span className="px-1.5 py-0.2 border border-white/10 bg-zinc-900 text-[10px] text-zinc-300">
            {matchups.length}
          </span>
        </button>
      </div>

      {/* Center Carousel Track of Live Matchup Chips */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-2 overflow-x-auto py-1 px-1 tn-scrollbar-none scroll-smooth"
        role="tablist"
        aria-label="Live Team vs Team Matchups"
      >
        {matchups.map((m, idx) => {
          const isActive = activeIndex === idx;
          const awayLogo = logoByTeamName(m.awayTeam);
          const homeLogo = logoByTeamName(m.homeTeam);
          const timeLabel = formatMatchupTime(m.gameTime);

          return (
            <button
              key={m.id}
              ref={isActive ? activeBtnRef : null}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectIndex(idx)}
              className={`h-9 shrink-0 flex items-center gap-2.5 px-3 text-xs transition-all duration-150 cursor-pointer border ${
                isActive
                  ? 'border-2 border-cyan-400 bg-zinc-950 text-cyan-300 font-black shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                  : 'border-white/15 bg-black text-zinc-400 hover:border-white/30 hover:text-white'
              }`}
            >
              {/* Team Logos */}
              <div className="flex items-center -space-x-1">
                {awayLogo && (
                  <img
                    src={awayLogo}
                    alt={m.awayTeam}
                    className="w-4 h-4 object-contain"
                  />
                )}
                {homeLogo && (
                  <img
                    src={homeLogo}
                    alt={m.homeTeam}
                    className="w-4 h-4 object-contain"
                  />
                )}
              </div>

              {/* Team vs Team Label */}
              <div className="flex items-center gap-1 font-mono font-bold">
                <span className="text-white">{m.awayTeam}</span>
                <span className="text-zinc-500 font-normal text-[10px]">@</span>
                <span className="text-white">{m.homeTeam}</span>
              </div>

              {/* Time or Count Badge */}
              <span className="text-[10px] text-zinc-500 font-normal hidden sm:inline">
                {timeLabel}
              </span>
              <span className="px-1.5 py-0.2 border border-white/10 bg-zinc-900 text-[10px] font-bold text-zinc-300">
                {m.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Next Navigation & Keyboard Hint */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onNext}
          aria-label="Next Matchup (→)"
          title="Next Matchup (→)"
          className="h-9 px-3 border border-white/20 bg-zinc-900 text-zinc-300 hover:border-white hover:text-white flex items-center justify-center gap-1 transition-all text-xs font-bold cursor-pointer"
        >
          <span className="hidden md:inline text-[10px]">NEXT</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="hidden lg:flex items-center gap-1 px-2 py-1 border border-white/15 bg-zinc-950 text-[10px] text-zinc-500">
          <kbd className="border border-white/20 bg-zinc-900 px-1 text-zinc-300">[←]</kbd>
          <kbd className="border border-white/20 bg-zinc-900 px-1 text-zinc-300">[→]</kbd>
        </div>
      </div>
    </div>
  );
});

