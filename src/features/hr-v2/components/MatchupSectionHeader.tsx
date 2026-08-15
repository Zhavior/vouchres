import React from 'react';
import { ChevronDown, ChevronUp, Calendar, Radio, Sparkles } from 'lucide-react';
import { ChunkA } from '../api/contracts';
import { formatGameClock } from '../presentHrV10Metric';
import { STRINGS_EN } from '../stringsEn';

interface MatchupSectionHeaderProps {
  gameId: string;
  gameIndex: number;
  totalGames: number;
  awayTeam: string;
  homeTeam: string;
  gameTime: string;
  lifecycle: string;
  stadiumName?: string;
  items: ChunkA[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function MatchupSectionHeader({
  gameIndex,
  totalGames,
  awayTeam,
  homeTeam,
  gameTime,
  lifecycle,
  stadiumName,
  items,
  isCollapsed,
  onToggleCollapse,
}: MatchupSectionHeaderProps) {
  const formattedTime = formatGameClock(gameTime);
  const isFirstGame = gameIndex === 1;
  const isLive = lifecycle === 'live';

  // Find top HRPI player in this game
  const topPlayer = items.reduce<ChunkA | null>((max, curr) => {
    if (!max || (curr.score?.hrIndex ?? 0) > (max.score?.hrIndex ?? 0)) {
      return curr;
    }
    return max;
  }, null);

  // Extract starting pitchers if available
  const awayPitcherItem = items.find((i) => i.identity?.teamAbbreviation === awayTeam && i.opposingPitcherName);
  const homePitcherItem = items.find((i) => i.identity?.teamAbbreviation === homeTeam && i.opposingPitcherName);
  const homePitcherName = awayPitcherItem?.opposingPitcherName; // Away hitter faces Home pitcher
  const awayPitcherName = homePitcherItem?.opposingPitcherName; // Home hitter faces Away pitcher

  return (
    <div
      className={`w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 my-3 rounded-2xl bg-white/[0.02] backdrop-blur-2xl border ${
        isFirstGame
          ? 'border-cyan-500/40 shadow-[0_0_24px_rgba(6,182,212,0.15)]'
          : isLive
            ? 'border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.15)]'
            : 'border-white/10 hover:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]'
      } transition-all duration-300 select-none cursor-pointer hover:bg-white/[0.04]`}
      onClick={onToggleCollapse}
      role="button"
      tabIndex={0}
      aria-expanded={!isCollapsed}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleCollapse();
        }
      }}
    >
      {/* Left Block: Matchup Teams, Start Time, Pitchers */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex flex-col items-center justify-center min-w-[54px] p-2 rounded-xl bg-white/[0.04] border border-white/10 text-center">
          <Calendar className="w-3.5 h-3.5 text-cyan-400 mb-0.5" />
          <span className="text-[10px] font-mono text-white/70 font-bold whitespace-nowrap">
            {formattedTime}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {isFirstGame && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-mono font-bold">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {STRINGS_EN.grouping.matchup.earliestBadge}
              </span>
            )}
            {isLive && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold animate-pulse">
                <Radio className="w-3 h-3 text-emerald-400" />
                LIVE
              </span>
            )}
            <span className="text-[10px] font-mono text-white/40">
              {STRINGS_EN.grouping.matchup.gameOrderBadge(gameIndex, totalGames)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-sm sm:text-base font-black font-mono text-white tracking-wide">
              {awayTeam} <span className="text-white/40 font-normal">@</span> {homeTeam}
            </h3>
            {stadiumName && stadiumName !== 'unknown' && (
              <span className="hidden sm:inline-block text-[11px] font-mono text-white/40">
                · {stadiumName}
              </span>
            )}
          </div>
          {(awayPitcherName || homePitcherName) && (
            <p className="text-[11px] font-mono text-white/50 truncate mt-0.5">
              Pitchers: {awayPitcherName ? `${awayPitcherName} (${awayTeam})` : 'TBD'} vs{' '}
              {homePitcherName ? `${homePitcherName} (${homeTeam})` : 'TBD'}
            </p>
          )}
        </div>
      </div>

      {/* Right Block: Top HRPI Hitter, Props Count & Collapse Indicator */}
      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
        {topPlayer && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] font-mono">
            <span className="text-white/50">Top:</span>
            <span className="text-cyan-300 font-bold">{(topPlayer.score?.hrIndex ?? 0)} HRPI</span>
            <span className="text-white/80 font-medium truncate max-w-[110px]">
              ({topPlayer.identity?.name || 'Player'})
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 font-mono text-xs font-bold">
            {STRINGS_EN.grouping.matchup.propsCount(items.length)}
          </span>

          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </div>
  );
}
