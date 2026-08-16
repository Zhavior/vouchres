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
  activeIndex: number; // -1 for "All Games", 0..N-1 for specific game
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

  if (matchups.length === 0) return null;

  const isAll = activeIndex === -1;

  return (
    <div
      className="w-full flex items-center gap-2 p-2 rounded-2xl bg-ve-obsidian/90 backdrop-blur-xl border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)] select-none font-mono animate-in fade-in slide-in-from-top-2 duration-200"
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
          className="h-9 px-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white flex items-center justify-center gap-1 transition-all active:scale-95 text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden md:inline text-[10px]">PREV</span>
        </button>

        {/* All Matchups Button */}
        <button
          type="button"
          onClick={() => onSelectIndex(-1)}
          aria-pressed={isAll}
          className={`h-9 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
            isAll
              ? 'bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] border border-[var(--aurora-max-emerald)]/50 shadow-[0_0_12px_rgba(0,217,160,0.25)]'
              : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Games</span>
          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] text-white/60">
            {matchups.length}
          </span>
        </button>
      </div>

      {/* Center Carousel Track of Live Matchup Chips */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none scroll-smooth"
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
              className={`h-9 shrink-0 flex items-center gap-2.5 px-3 rounded-xl text-xs transition-all duration-200 focus:outline-none border ${
                isActive
                  ? 'bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] border-[var(--aurora-max-emerald)]/50 shadow-[0_0_15px_rgba(0,217,160,0.3)] font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
              }`}
            >
              {/* Team Logos */}
              <div className="flex items-center -space-x-1.5">
                {awayLogo && (
                  <img
                    src={awayLogo}
                    alt={m.awayTeam}
                    className="w-4 h-4 object-contain rounded-full bg-black/40 p-0.5 border border-white/10"
                  />
                )}
                {homeLogo && (
                  <img
                    src={homeLogo}
                    alt={m.homeTeam}
                    className="w-4 h-4 object-contain rounded-full bg-black/40 p-0.5 border border-white/10"
                  />
                )}
              </div>

              {/* Team vs Team Label */}
              <div className="flex items-center gap-1 font-mono font-bold">
                <span className="text-white">{m.awayTeam}</span>
                <span className="text-white/40 font-normal text-[10px]">@</span>
                <span className="text-white">{m.homeTeam}</span>
              </div>

              {/* Time or Count Badge */}
              <span className="text-[10px] text-white/40 font-normal hidden sm:inline">
                {timeLabel}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-black/50 text-[10px] font-bold text-white/60">
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
          className="h-9 px-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white flex items-center justify-center gap-1 transition-all active:scale-95 text-xs font-bold"
        >
          <span className="hidden md:inline text-[10px]">NEXT</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/40">
          <kbd className="px-1 py-0.2 bg-black/40 text-white/80 rounded border border-white/10">←</kbd>
          <kbd className="px-1 py-0.2 bg-black/40 text-white/80 rounded border border-white/10">→</kbd>
        </div>
      </div>
    </div>
  );
});
