import React, { useMemo } from 'react';
import { ChevronRight, Plus, Star, TrendingUp, Wind, Zap } from 'lucide-react';
import {
  AuroraMaxFallback,
  AuroraMaxPanel,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';

export interface HrMaxGameStacksViewProps {
  rows: HrMaxDeskRow[];
  activeId: string | null;
  isSaved: (id: string) => boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrMaxDeskRow) => void;
}

interface GameGroup {
  key: string;
  matchupLabel: string;
  gameTimeLabel: string;
  venue: string | null;
  awayTeam: string;
  homeTeam: string;
  awayPitcher: string | null;
  homePitcher: string | null;
  awayRows: HrMaxDeskRow[];
  homeRows: HrMaxDeskRow[];
  maxHrpi: number;
}

export const HrMaxGameStacksView = React.memo(function HrMaxGameStacksView({
  rows,
  activeId,
  isSaved,
  onSelect,
  onToggleSaved,
  onAddToSlip,
}: HrMaxGameStacksViewProps) {
  // Group rows by game (matchupLabel + gameTimeLabel)
  const games: GameGroup[] = useMemo(() => {
    const map = new Map<string, GameGroup>();

    for (const row of rows) {
      // Key by matchup or gamePk
      const gameKey = row.raw.gamePk ? String(row.raw.gamePk) : `${row.team}-${row.opponent}-${row.gameTimeLabel}`;
      
      let group = map.get(gameKey);
      if (!group) {
        // Parse away & home from matchup "AWAY @ HOME"
        const parts = row.matchupLabel.split('@').map((s) => s.trim());
        const away = parts[0] || row.team;
        const home = parts[1] || row.opponent;

        group = {
          key: gameKey,
          matchupLabel: row.matchupLabel,
          gameTimeLabel: row.gameTimeLabel,
          venue: row.venue,
          awayTeam: away,
          homeTeam: home,
          awayPitcher: row.team === home ? row.pitcherName : null,
          homePitcher: row.team === away ? row.pitcherName : null,
          awayRows: [],
          homeRows: [],
          maxHrpi: 0,
        };
        map.set(gameKey, group);
      }

      if (row.team === group.awayTeam) {
        group.awayRows.push(row);
        if (!group.homePitcher && row.pitcherName) group.homePitcher = row.pitcherName;
      } else {
        group.homeRows.push(row);
        if (!group.awayPitcher && row.pitcherName) group.awayPitcher = row.pitcherName;
      }

      if (row.score > group.maxHrpi) {
        group.maxHrpi = row.score;
      }
    }

    // Sort games by max HRPI desc
    return Array.from(map.values()).sort((a, b) => b.maxHrpi - a.maxHrpi);
  }, [rows]);

  if (games.length === 0) {
    return (
      <AuroraMaxFallback
        compact
        title="No game matchups"
        detail="The active filter returned no eligible game stacks."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 font-mono">
      {games.map((game) => {
        const awayLogo = logoByTeamName(game.awayTeam);
        const homeLogo = logoByTeamName(game.homeTeam);

        return (
          <AuroraMaxPanel
            key={game.key}
            className="overflow-hidden border border-white/10 bg-black/40 shadow-lg transition hover:border-white/20"
          >
            {/* Game Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#09110c] px-3.5 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  {awayLogo && <img src={awayLogo} alt="" className="h-4 w-4 object-contain" />}
                  <span>{game.awayTeam}</span>
                  <span className="text-white/40 text-xs font-normal">@</span>
                  {homeLogo && <img src={homeLogo} alt="" className="h-4 w-4 object-contain" />}
                  <span>{game.homeTeam}</span>
                </div>
                <span className="text-white/40 text-[11px]">· {game.gameTimeLabel}</span>
              </div>

              <div className="flex items-center gap-3 text-[10px]">
                {game.venue && (
                  <span className="flex items-center gap-1 text-emerald-300/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Wind className="h-3 w-3" /> {game.venue}
                  </span>
                )}
                <span className="text-white/40">
                  Top Slate Signal: <strong className="text-[var(--aurora-max-emerald)]">{game.maxHrpi} HRPI</strong>
                </span>
              </div>
            </div>

            {/* Matchup Stacks Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] p-3 gap-3 md:gap-4">
              {/* Away Team Stack */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    {awayLogo && <img src={awayLogo} alt="" className="h-3.5 w-3.5 object-contain" />}
                    <span>{game.awayTeam} Hitters</span>
                  </div>
                  {game.homePitcher && (
                    <span className="text-[10px] text-white/50">
                      vs <strong className="text-white/80">{game.homePitcher}</strong>
                    </span>
                  )}
                </div>

                {game.awayRows.length === 0 ? (
                  <p className="text-[10px] text-white/30 italic py-2">No qualified batters on active slate.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {game.awayRows.map((row) => (
                      <GameStackPlayerRow
                        key={row.id}
                        row={row}
                        active={row.id === activeId}
                        saved={isSaved(row.id)}
                        onSelect={onSelect}
                        onToggleSaved={onToggleSaved}
                        onAddToSlip={onAddToSlip}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Home Team Stack */}
              <div className="flex flex-col gap-2 pt-3 md:pt-0">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    {homeLogo && <img src={homeLogo} alt="" className="h-3.5 w-3.5 object-contain" />}
                    <span>{game.homeTeam} Hitters</span>
                  </div>
                  {game.awayPitcher && (
                    <span className="text-[10px] text-white/50">
                      vs <strong className="text-white/80">{game.awayPitcher}</strong>
                    </span>
                  )}
                </div>

                {game.homeRows.length === 0 ? (
                  <p className="text-[10px] text-white/30 italic py-2">No qualified batters on active slate.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {game.homeRows.map((row) => (
                      <GameStackPlayerRow
                        key={row.id}
                        row={row}
                        active={row.id === activeId}
                        saved={isSaved(row.id)}
                        onSelect={onSelect}
                        onToggleSaved={onToggleSaved}
                        onAddToSlip={onAddToSlip}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AuroraMaxPanel>
        );
      })}
    </div>
  );
});

function GameStackPlayerRow({
  row,
  active,
  saved,
  onSelect,
  onToggleSaved,
  onAddToSlip,
}: {
  row: HrMaxDeskRow;
  active: boolean;
  saved: boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrMaxDeskRow) => void;
}) {
  return (
    <div
      onClick={() => onSelect(row.id)}
      className={`flex items-center justify-between gap-2 p-2 rounded border cursor-pointer transition ${
        active
          ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.1)]'
          : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
          <PlayerHeadshot name={row.playerName} playerId={row.player.id} size={28} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold truncate ${active ? 'text-[var(--aurora-max-emerald)]' : 'text-white'}`}>
              {row.playerName}
            </span>
            <AuroraMaxTruthBadge state={row.truthState}>
              {row.confirmed ? 'Confirmed' : 'Projected'}
            </AuroraMaxTruthBadge>
          </div>
          <p className="text-[9px] text-white/50 truncate">{row.signal}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex flex-col items-end">
          <AuroraMaxScoreBadge score={row.score} />
          {row.bookOddsLabel && (
            <span className="text-[8px] text-white/40 tabular-nums">{row.bookOddsLabel}</span>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onToggleSaved(row.id)}
            aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
            className={`grid h-6 w-6 place-items-center border ${
              saved
                ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]'
                : 'border-white/10 text-white/30 hover:text-white'
            }`}
          >
            <Star className={`h-3 w-3 ${saved ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onAddToSlip(row)}
            title="Add to parlay slip"
            className="inline-flex h-6 items-center gap-0.5 border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-1.5 font-mono text-[9px] font-bold uppercase text-[var(--aurora-max-emerald)] hover:bg-[var(--aurora-max-emerald)]/20"
          >
            <Plus className="h-2.5 w-2.5" /> Slip
          </button>
        </div>
      </div>
    </div>
  );
}
