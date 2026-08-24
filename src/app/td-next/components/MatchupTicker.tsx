import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import type { NflTickerGame } from '../../../types/touchdown';

interface MatchupTickerProps {
  games: NflTickerGame[];
  selectedGameId?: string | null;
  onSelectGame: (gameId: string | null) => void;
}

export const MatchupTicker: React.FC<MatchupTickerProps> = ({
  games,
  selectedGameId,
  onSelectGame,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full border-b border-white/10 bg-[#090A0F]/95 backdrop-blur-md z-20">
      <div className="flex items-center">
        {/* Left Scroll Trigger */}
        <button
          type="button"
          onClick={scrollLeft}
          className="hidden md:flex h-12 w-8 shrink-0 items-center justify-center border-r border-white/10 bg-black/40 text-white/55 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Horizontal Ticker Carousel */}
        <div
          ref={scrollerRef}
          className="flex flex-1 items-center gap-2 overflow-x-auto py-2 px-3 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All Games Pill */}
          <button
            type="button"
            onClick={() => onSelectGame(null)}
            className={`shrink-0 rounded border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              !selectedGameId
                ? 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'border-white/10 bg-black/50 text-white/55 hover:border-white/25 hover:text-white/70'
            }`}
          >
            All Slate ({games.length})
          </button>

          {games.map((game) => {
            const isSelected = selectedGameId === game.id;
            const isLive = game.status === 'LIVE';
            const isFinal = game.status === 'FINAL';
            const hasRedZone = game.isRedZoneActive;

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                className={`group relative flex shrink-0 items-center gap-3 rounded border px-3 py-1.5 font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'border-ve-cyan/25 bg-ve-cyan/10 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-ve-cyan/50'
                    : hasRedZone
                      ? 'border-ve-red/60 bg-ve-red/10 text-white hover:border-ve-red/25 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                      : 'border-white/10 bg-[#12131A] text-white/70 hover:border-white/30 hover:bg-[#181922]'
                }`}
              >
                {/* Status Indicator */}
                <div className="flex flex-col items-start min-w-[54px]">
                  {isLive ? (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-ve-emerald">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ve-emerald/10 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ve-emerald/10"></span>
                      </span>
                      <span>{game.clock}</span>
                    </div>
                  ) : isFinal ? (
                    <span className="text-[9px] font-bold text-white/40">FINAL</span>
                  ) : (
                    <span className="text-[9px] text-white/55">
                      {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <span className="text-[8.5px] text-white/40 mt-0.5 tracking-tight">
                    {game.spread ?? 'LINES LOCKED'}
                  </span>
                </div>

                {/* Matchup Teams & Score */}
                <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                  {/* Away Team */}
                  <div className="flex items-center gap-1.5">
                    <img
                      src={game.awayTeam.logo}
                      alt={game.awayTeam.abbreviation}
                      className="h-4 w-4 object-contain"
                      loading="lazy"
                    />
                    <span className="text-xs font-bold text-white">{game.awayTeam.abbreviation}</span>
                    {(isLive || isFinal) && (
                      <span className="text-xs font-bold font-mono text-white/70">
                        {game.awayTeam.score ?? '—'}
                      </span>
                    )}
                    {game.awayTeam.hasPossession && isLive && (
                      <span className="text-[10px] text-ve-amber">◀</span>
                    )}
                  </div>

                  <span className="text-[10px] text-white/25">@</span>

                  {/* Home Team */}
                  <div className="flex items-center gap-1.5">
                    <img
                      src={game.homeTeam.logo}
                      alt={game.homeTeam.abbreviation}
                      className="h-4 w-4 object-contain"
                      loading="lazy"
                    />
                    <span className="text-xs font-bold text-white">{game.homeTeam.abbreviation}</span>
                    {(isLive || isFinal) && (
                      <span className="text-xs font-bold font-mono text-white/70">
                        {game.homeTeam.score ?? '—'}
                      </span>
                    )}
                    {game.homeTeam.hasPossession && isLive && (
                      <span className="text-[10px] text-ve-amber">◀</span>
                    )}
                  </div>
                </div>

                {/* Red Zone Callout Badge */}
                {hasRedZone && (
                  <div className="flex items-center gap-1 rounded bg-ve-red/20 px-1.5 py-0.5 border border-ve-red/40 text-[8.5px] font-bold text-ve-red animate-pulse">
                    <Radio className="h-2.5 w-2.5 text-ve-red" />
                    <span>RZ: {game.redZoneTeam} {game.redZoneYardLine}yd</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Scroll Trigger */}
        <button
          type="button"
          onClick={scrollRight}
          className="hidden md:flex h-12 w-8 shrink-0 items-center justify-center border-l border-white/10 bg-black/40 text-white/55 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
