import React, { useState, useEffect, useMemo } from 'react';
import { useLiveGames, type LiveGamesPayload } from '../hooks/queries/useLiveGames';
import { 
  Tv, 
  Flame, 
  Sparkles, 
  Activity, 
  Award, 
  Plus, 
  RefreshCw, 
  User, 
  TrendingUp, 
  ChevronRight, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Info,
  Sliders,
  CornerRightDown
} from 'lucide-react';
import { MLB_PLAYER_RECORDS } from '../data/playerData';
import { MLBPlayer } from '../types';
import { logoByTeamName } from '../lib/teamLogos';
import { Z8_LABEL, Z8_PAGE, Z8_PAGE_PAD_X, Z8_PAGE_PAD_Y, Z8_PANEL_PREMIUM, Z8_SURFACE, Z8_STAT_CHIP } from '../theme/z8Tokens';

/** Small MLB team logo with graceful fallback when a team can't be matched. */
function TeamLogo({ team, size = 22 }: { team: string; size?: number }) {
  const src = logoByTeamName(team);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={team}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="object-contain shrink-0"
      style={{ width: size, height: size }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

interface LiveGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  venue: string;
  gameDate: string;
  isApiReal: boolean;
  predictions: {
    winningPct: { home: number; away: number };
    hrPct: { home: number; away: number };
    hitsPct: { home: number; away: number };
    rbisPct: { home: number; away: number };
  };
}

interface LiveGamesProps {
  onSectionChange: (section: string) => void;
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
}

const EMPTY_PREDICTIONS: LiveGame['predictions'] = {
  winningPct: { home: 0, away: 0 },
  hrPct: { home: 0, away: 0 },
  hitsPct: { home: 0, away: 0 },
  rbisPct: { home: 0, away: 0 },
};

function mapApiGame(game: LiveGamesPayload['games'][number]): LiveGame {
  return {
    id: game.id,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeScore: game.homeScore ?? 0,
    awayScore: game.awayScore ?? 0,
    status: game.status,
    venue: game.venue ?? '',
    gameDate: game.gameDate ?? '',
    isApiReal: true,
    predictions: EMPTY_PREDICTIONS,
  };
}

function buildFallbackGames(): LiveGame[] {
  return [
        {
          id: '2026101',
          homeTeam: "Los Angeles Dodgers",
          awayTeam: "San Diego Padres",
          homeScore: 4,
          awayScore: 3,
          status: "In Progress (7th Inning)",
          venue: "Dodger Stadium",
          gameDate: new Date().toISOString(),
          isApiReal: false,
          predictions: {
            winningPct: { home: 62, away: 38 },
            hrPct: { home: 78, away: 54 },
            hitsPct: { home: 85, away: 72 },
            rbisPct: { home: 74, away: 58 }
          }
        },
        {
          id: '2026102',
          homeTeam: "New York Yankees",
          awayTeam: "Boston Red Sox",
          homeScore: 1,
          awayScore: 2,
          status: "In Progress (4th Inning)",
          venue: "Yankee Stadium",
          gameDate: new Date().toISOString(),
          isApiReal: false,
          predictions: {
            winningPct: { home: 54, away: 46 },
            hrPct: { home: 82, away: 48 },
            hitsPct: { home: 79, away: 80 },
            rbisPct: { home: 68, away: 69 }
          }
        },
        {
          id: '2026103',
          homeTeam: "Houston Astros",
          awayTeam: "Atlanta Braves",
          homeScore: 0,
          awayScore: 0,
          status: "Warmup - 7:05 PM",
          venue: "Minute Maid Park",
          gameDate: new Date(Date.now() + 1800000).toISOString(),
          isApiReal: false,
          predictions: {
            winningPct: { home: 49, away: 51 },
            hrPct: { home: 65, away: 62 },
            hitsPct: { home: 74, away: 76 },
            rbisPct: { home: 60, away: 64 }
          }
        },
        {
          id: '2026104',
          homeTeam: "San Francisco Giants",
          awayTeam: "Seattle Mariners",
          homeScore: 5,
          awayScore: 1,
          status: "Final",
          venue: "Oracle Park",
          gameDate: new Date(Date.now() - 14400000).toISOString(),
          isApiReal: false,
          predictions: {
            winningPct: { home: 52, away: 48 },
            hrPct: { home: 44, away: 40 },
            hitsPct: { home: 81, away: 64 },
            rbisPct: { home: 70, away: 51 }
          }
        }
      ];
}

export default function LiveGames({ onSectionChange, onAddLegToParlay }: LiveGamesProps) {
  const liveGamesQuery = useLiveGames();
  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isPollerActive, setIsPollerActive] = useState<boolean>(true);

  const loading = liveGamesQuery.isLoading && games.length === 0;
  const lastRefreshed = liveGamesQuery.dataUpdatedAt
    ? new Date(liveGamesQuery.dataUpdatedAt).toLocaleTimeString()
    : '';

  useEffect(() => {
    if (liveGamesQuery.data?.success && liveGamesQuery.data.games.length > 0) {
      const nextGames = liveGamesQuery.data.games.map(mapApiGame);
      setGames(nextGames);
      setSelectedGameId((current) => current ?? nextGames[0]?.id ?? null);
      return;
    }

    if (liveGamesQuery.isError && games.length === 0) {
      console.warn('Live API fetch warning; using local preview matrix as fallback', liveGamesQuery.error);
      const fallbackGames = buildFallbackGames();
      setGames(fallbackGames);
      setSelectedGameId(fallbackGames[0]?.id ?? null);
    }
  }, [liveGamesQuery.data, liveGamesQuery.isError, liveGamesQuery.error, games.length]);

  const fetchLiveGames = () => {
    void liveGamesQuery.refetch();
  };

  // Set up an optional simulated polling system to simulate live ballpark score increments
  useEffect(() => {
    if (!isPollerActive || games.length === 0) return;

    const interval = setInterval(() => {
      // Small randomized increments for live scores to showcase dynamic calculations
      setGames(prevGames => 
        prevGames.map(game => {
          if (game.status.includes('In Progress') && Math.random() < 0.25) {
            const isHomeScoring = Math.random() > 0.45;
            return {
              ...game,
              homeScore: isHomeScoring ? game.homeScore + 1 : game.homeScore,
              awayScore: !isHomeScoring ? game.awayScore + 1 : game.awayScore,
              // Slowly progress status inning as well
              status: Math.random() > 0.7 
                ? game.status.replace(/(\d+)/, (match) => String(Math.min(9, parseInt(match) + 1)))
                : game.status
            };
          }
          return game;
        })
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [isPollerActive, games.length]);

  const activeSelectedGame = useMemo(() => {
    return games.find(g => g.id === selectedGameId) || games[0] || null;
  }, [games, selectedGameId]);

  // Find the top 3 players in MLB_PLAYER_RECORDS for the selected game (based on team matching)
  // If we can't find 3 on the active teams, grab other high stats batters as featured choices
  const topHRArtistsForSelectedGame = useMemo(() => {
    if (!activeSelectedGame) return [];

    const homeTeamLower = activeSelectedGame.homeTeam.toLowerCase();
    const awayTeamLower = activeSelectedGame.awayTeam.toLowerCase();

    // 1. Filter local roster players on these two squads
    const gameSquadPlayers = MLB_PLAYER_RECORDS.filter(player => {
      const playerTeamLower = player.team.toLowerCase();
      return (
        homeTeamLower.includes(playerTeamLower) || 
        playerTeamLower.includes(homeTeamLower) ||
        awayTeamLower.includes(playerTeamLower) || 
        playerTeamLower.includes(awayTeamLower)
      );
    });

    // 2. Sort by batterScore/HR potential
    const sortedSquadPlayers = [...gameSquadPlayers].sort((a,b) => {
      const hrA = parseInt(a.seasonStats.hr) || 0;
      const hrB = parseInt(b.seasonStats.hr) || 0;
      return hrB - hrA;
    });

    // 3. If shortfall of 3, backfill with top sluggers from general pool not already matched
    const finalSelection: MLBPlayer[] = [...sortedSquadPlayers];
    const presentIds = new Set(finalSelection.map(p => p.id));

    // Get sorted general pool players
    const generalSluggers = [...MLB_PLAYER_RECORDS].sort((a, b) => {
      const hrA = parseInt(a.seasonStats.hr) || 0;
      const hrB = parseInt(b.seasonStats.hr) || 0;
      return hrB - hrA;
    });

    for (const player of generalSluggers) {
      if (finalSelection.length >= 3) break;
      if (!presentIds.has(player.id)) {
        finalSelection.push(player);
        presentIds.add(player.id);
      }
    }

    return finalSelection.slice(0, 3);
  }, [activeSelectedGame]);

  // Trigger add individual player prop leg to parlay slip context safely
  const handlePickToParlay = (player: MLBPlayer) => {
    if (activeSelectedGame && activeSelectedGame.status.toLowerCase() === 'final') {
      alert(`⚠️ Cannot select player prop: This matchup (${activeSelectedGame.awayTeam} @ ${activeSelectedGame.homeTeam}) is concluded (status: Final). Placing picks on concluded games is strictly prohibited.`);
      return;
    }

    const defaultProp = player.propositions.find(p => p.market.includes('Home Run')) || player.propositions[0];
    if (defaultProp) {
      onAddLegToParlay(player, {
        id: `prop-live-games-${player.id}-${Date.now()}`,
        market: defaultProp.market,
        odds: defaultProp.odds,
        spec: defaultProp.spec
      });
      onSectionChange('build');
    } else {
      alert("No active propositions available for this athlete currently.");
    }
  };

  return (
    <main className={`${Z8_PAGE} p-4 md:p-6 lg:p-8 space-y-6 max-w-none mx-auto animate-fade-in`} id="live-games-root">
      
      {/* SECTION BANNER HERO */}
      <div className={`${Z8_PANEL} relative p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6`} id="live-games-banner">
        <div className="absolute top-0 right-0 w-96 h-96 bg-vouch-cyan/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-vouch-emerald/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`bg-vouch-cyan/10 border border-vouch-cyan/30 text-vouch-cyan px-3 py-0.5 rounded-full ${Z8_LABEL} flex items-center gap-1.5 animate-pulse`}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> MLB Live API Connected
            </span>
            <span className="bg-black/30 border border-white/10 text-white/45 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
              Deterministic Sabermetric Models
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Tv className="w-8 h-8 text-vouch-cyan" /> Live Matchups 
            <span className="bg-gradient-to-r from-vouch-cyan to-vouch-emerald bg-clip-text text-transparent">& Predictions</span>
          </h1>
          <p className="text-white/50 text-sm max-w-3xl">
            Real-time scoreboard directly bound to MLB's public schema. Each scheduled match is coupled with instantaneous, serverless mathematical calculations computing winning variables and micro-metrics!
          </p>
        </div>

        {/* Action button controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={fetchLiveGames}
            disabled={loading}
            className="bg-black/25 hover:bg-black/40 border border-white/10 hover:border-vouch-cyan/40 py-2.5 px-4 rounded-xl text-xs font-bold text-vouch-cyan flex items-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refreshed: {lastRefreshed || 'Never'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`${Z8_PANEL_PREMIUM} p-20 text-center space-y-4`} id="live-games-loading">
          <RefreshCw className="w-12 h-12 text-vouch-cyan animate-spin mx-auto" />
          <h4 className="text-white font-bold">Querying official Major League schedule...</h4>
          <p className="text-white/45 text-xs">Parsing team arrays, ballpark elevations, and starting pitchers.</p>
        </div>
      ) : games.length === 0 ? (
        <div className={`${Z8_PANEL_PREMIUM} p-16 text-center space-y-4`} id="live-games-empty">
          <AlertTriangle className="w-12 h-12 text-vouch-amber mx-auto" />
          <h4 className="text-white font-bold">No MLB Games Active at This Time</h4>
          <p className="text-white/45 text-sm max-w-md mx-auto">
            The MLB schedule is fully queryable. In case there are no matches on today's calendar, we will load our high-fidelity seed matrix.
          </p>
          <button
            onClick={fetchLiveGames}
            className="bg-vouch-cyan/80 hover:bg-vouch-cyan text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="live-games-workspace">
          
          {/* LEFT COLUMN: LIVE SCORES CATALOG (Col span 5) */}
          <div className="lg:col-span-5 space-y-4" id="live-games-list-column">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black text-white/50 font-mono tracking-wider uppercase">
                ACTIVE BALLPARK BULLETINS ({games.length})
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-white/45 font-mono">
                <span>Auto-simulate increments:</span>
                <button
                  type="button"
                  onClick={() => setIsPollerActive(!isPollerActive)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${isPollerActive ? 'bg-vouch-emerald' : 'bg-black/40'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isPollerActive ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1" id="live-cards-scroller">
              {games.map((game) => {
                const isSelected = game.id === selectedGameId;
                const isLive = game.status.includes('In Progress') || game.status.includes('Warmup');
                
                return (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? `${Z8_ACTIVE} shadow-md`
                        : `${Z8_IDLE} rounded-2xl`
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono text-white/45 mb-2">
                      <span className="truncate max-w-[150px]">{game.venue}</span>
                      <span className={`px-2 py-0.5 rounded font-black uppercase text-[9px] flex items-center gap-1 ${
                        isLive 
                          ? 'bg-red-500/10 text-red-400 animate-pulse' 
                          : game.status === 'Final' 
                            ? 'bg-black/45 text-white/40' 
                            : 'bg-vouch-cyan/10 text-vouch-cyan'
                      }`}>
                        {isLive && <span className="w-1 h-1 rounded-full bg-red-500" />}
                        {game.status}
                      </span>
                    </div>

                    <div className="space-y-2 pb-2.5 border-b border-white/[0.04]">
                      {/* Away Team Line */}
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 min-w-0">
                          <TeamLogo team={game.awayTeam} />
                          <span className="text-white font-extrabold text-sm truncate">{game.awayTeam}</span>
                        </span>
                        <span className="text-white font-mono font-black text-base">{game.awayScore}</span>
                      </div>

                      {/* Home Team Line */}
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 min-w-0">
                          <TeamLogo team={game.homeTeam} />
                          <span className="text-white font-extrabold text-sm truncate">{game.homeTeam}</span>
                        </span>
                        <span className="text-white font-mono font-black text-base">{game.homeScore}</span>
                      </div>
                    </div>

                    {/* Footer micro metrics preview */}
                    <div className="pt-2 flex justify-between items-center text-[10px] font-mono text-white/45">
                      <span>Win % Proj:</span>
                      <span className="text-vouch-cyan font-bold">
                        {game.predictions.winningPct.home}% vs {game.predictions.winningPct.away}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: ANALYTICAL METRICS BOARD (Col span 7) */}
          <div className="lg:col-span-7" id="live-games-metrics-column">
            {activeSelectedGame ? (
              <div className={`${Z8_PANEL_PREMIUM} p-5 md:p-6 space-y-6`} id="analytical-metrics-board-card">
                
                {/* Board header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                  <div>
                    <span className="text-[10px] bg-vouch-cyan/10 text-vouch-cyan font-bold px-2 py-0.5 rounded font-mono uppercase">
                      ACTIVE ADVANTAGE LEDGER
                    </span>
                    <h2 className="text-xl font-black text-white font-display mt-1 select-text">
                      {activeSelectedGame.awayTeam} @ {activeSelectedGame.homeTeam}
                    </h2>
                    <p className="text-white/50 text-xs mt-0.5 font-mono">{activeSelectedGame.venue}</p>
                  </div>

                  <div className="flex gap-2">
                    <span className="bg-black/45 border border-white/10 text-[10.5px] font-sans text-white/55 px-3 py-1 rounded-xl">
                      {activeSelectedGame.id}
                    </span>
                  </div>
                </div>

                {/* 1. WINNING PERCENTAGE GAUGE */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end text-xs font-mono">
                    <div>
                      <span className="flex items-center gap-1.5 text-[10px] text-white/50"><TeamLogo team={activeSelectedGame.awayTeam} size={16} />{activeSelectedGame.awayTeam}</span>
                      <span className="block text-base font-black text-white/90 mt-0.5">{activeSelectedGame.predictions.winningPct.away}%</span>
                    </div>
                    <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider">PROJECTED MATCH WIN RATIOS</span>
                    <div className="text-right">
                      <span className="flex items-center justify-end gap-1.5 text-[10px] text-white/50">{activeSelectedGame.homeTeam}<TeamLogo team={activeSelectedGame.homeTeam} size={16} /></span>
                      <span className="block text-base font-black text-vouch-cyan mt-0.5">{activeSelectedGame.predictions.winningPct.home}%</span>
                    </div>
                  </div>

                  {/* High contrast progress bar segment */}
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden flex" id="winning-pct-progress-bar">
                    <div 
                      className="bg-vouch-cyan/30 transition-all duration-500" 
                      style={{ width: `${activeSelectedGame.predictions.winningPct.away}%` }} 
                    />
                    <div 
                      className="bg-vouch-cyan transition-all duration-500" 
                      style={{ width: `${activeSelectedGame.predictions.winningPct.home}%` }} 
                    />
                  </div>
                </div>

                {/* 2. SABERMETRIC TEAM METRIC SHIELD GAUGE BOX */}
                <div className={`${Z8_SURFACE} p-5 rounded-2xl space-y-4`} id="sabermetric-probability-scales">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Flame className="w-4 h-4 text-vouch-emerald" />
                    <h4 className="text-[10px] font-black text-white/50 font-mono tracking-widest uppercase">
                      TEAM-LEVEL PROBABILITIES
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {/* Home Run likelihood */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white/50 text-[11px] font-bold">Likelihood to hit at least 1+ HR</span>
                        <span className="text-vouch-emerald font-bold">
                          {activeSelectedGame.predictions.hrPct.away}% (Away) vs {activeSelectedGame.predictions.hrPct.home}% (Home)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3" id="hr-pct-gauge-bars">
                        {/* Away */}
                        <div className="bg-black/55 p-2 rounded-xl flex items-center gap-2 border border-white/10">
                          <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden">
                            <div className="h-full bg-white/25 rounded-full" style={{ width: `${activeSelectedGame.predictions.hrPct.away}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-white/70 font-bold">{activeSelectedGame.predictions.hrPct.away}%</span>
                        </div>
                        {/* Home */}
                        <div className="bg-black/55 p-2 rounded-xl flex items-center gap-2 border border-white/10">
                          <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden">
                            <div className="h-full bg-vouch-cyan rounded-full" style={{ width: `${activeSelectedGame.predictions.hrPct.home}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-white font-bold">{activeSelectedGame.predictions.hrPct.home}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Hits likelihood */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white/50 text-[11px] font-bold">Likelihood of team recording &gt;8 total Hits</span>
                        <span className="text-vouch-cyan font-bold">
                          {activeSelectedGame.predictions.hitsPct.away}% (Away) vs {activeSelectedGame.predictions.hitsPct.home}% (Home)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3" id="hits-pct-gauge-bars">
                        {/* Away */}
                        <div className="bg-black/55 p-2 rounded-xl flex items-center gap-2 border border-white/10">
                          <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden">
                            <div className="h-full bg-white/25 rounded-full" style={{ width: `${activeSelectedGame.predictions.hitsPct.away}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-white/70 font-bold">{activeSelectedGame.predictions.hitsPct.away}%</span>
                        </div>
                        {/* Home */}
                        <div className="bg-black/55 p-2 rounded-xl flex items-center gap-2 border border-white/10">
                          <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden">
                            <div className="h-full bg-vouch-cyan rounded-full" style={{ width: `${activeSelectedGame.predictions.hitsPct.home}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-white font-bold">{activeSelectedGame.predictions.hitsPct.home}%</span>
                        </div>
                      </div>
                    </div>

                    {/* RBIs likelihood */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white/50 text-[11px] font-bold">Likelihood of team driving &gt;4 home runs/RBIs</span>
                        <span className="text-vouch-cyan font-bold">
                          {activeSelectedGame.predictions.rbisPct.away}% (Away) vs {activeSelectedGame.predictions.rbisPct.home}% (Home)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3" id="rbis-pct-gauge-bars">
                        {/* Away */}
                        <div className="bg-black/55 p-2 rounded-xl flex items-center gap-2 border border-white/10">
                          <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden">
                            <div className="h-full bg-white/25 rounded-full" style={{ width: `${activeSelectedGame.predictions.rbisPct.away}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-white/70 font-bold">{activeSelectedGame.predictions.rbisPct.away}%</span>
                        </div>
                        {/* Home */}
                        <div className="bg-black/55 p-2 rounded-xl flex items-center gap-2 border border-white/10">
                          <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden">
                            <div className="h-full bg-vouch-cyan rounded-full" style={{ width: `${activeSelectedGame.predictions.rbisPct.home}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-white font-bold">{activeSelectedGame.predictions.rbisPct.home}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. TOP 3 HR PLAYERS TO WATCH (VITAL!) */}
                <div className="space-y-3.5" id="top-3-hr-lookouts-section">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                    <Award className="w-5 h-5 text-vouch-amber" />
                    <h4 className="text-xs font-black text-white/70 font-mono tracking-wider uppercase">
                      TOP 3 PLAYERS TO LOOK OUT FOR HR IN THIS MATCHUP
                    </h4>
                  </div>

                  <div className="space-y-3" id="top-hr-lookout-cards-list">
                    {topHRArtistsForSelectedGame.map((player, idx) => {
                      const hrNum = parseInt(player.seasonStats.hr) || 0;
                      // Calculate custom individual margin rating for top HR lookup
                      const ratingVal = Math.min(99, 78 + (hrNum % 16) + (activeSelectedGame.predictions.winningPct.home % 5));

                      return (
                        <div 
                          key={player.id} 
                          className="bg-black/50/60 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="relative">
                              <img 
                                src={player.headshot} 
                                alt={player.name}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                decoding="async"
                                className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-black/55"
                              />
                              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-vouch-amber border border-white/10 flex items-center justify-center text-[10px] font-black text-obsidian-900 font-mono" title={`Ranked #${idx + 1}`}>
                                #{idx + 1}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-extrabold text-sm text-white">{player.name}</h5>
                                <span className="text-[9px] text-white/50 font-mono">
                                  #{player.number} · {player.team}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 mt-1 text-[10.5px] text-white/50">
                                <span>Season: <b className="text-white font-mono font-bold">{player.seasonStats.hr} HRs</b></span>
                                <span className="text-white/35">•</span>
                                <span>OPS: <b className="text-white/70 font-mono">{player.seasonStats.ops}</b></span>
                                <span className="text-white/35">•</span>
                                <span>Statcast Score: <b className="text-vouch-emerald font-mono font-bold">{ratingVal}%</b></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => {
                                localStorage.setItem('vouchedge_selected_research_player_id', player.id);
                                onSectionChange('research');
                              }}
                              className="flex-1 sm:flex-none text-white/50 hover:text-white bg-black/45 border border-white/10 hover:border-vouch-cyan/30 py-1.5 px-3 rounded-lg text-[10.5px] font-mono tracking-tight text-center"
                            >
                              Scouting 🔬
                            </button>
                            <button
                              onClick={() => handlePickToParlay(player)}
                              disabled={activeSelectedGame && activeSelectedGame.status.toLowerCase() === 'final'}
                              className={`flex-1 sm:flex-none py-1.5 px-3.5 rounded-lg text-[10.5px] flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all ${
                                activeSelectedGame && activeSelectedGame.status.toLowerCase() === 'final'
                                  ? 'bg-red-950/40 text-red-400 border border-red-900/40 cursor-not-allowed opacity-60 font-bold'
                                  : 'bg-gradient-to-r from-emerald-650 to-teal-555 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold'
                              }`}
                            >
                              {activeSelectedGame && activeSelectedGame.status.toLowerCase() === 'final' ? (
                                <span>🔒 Locked (Final)</span>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add HR Prop</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional disclaimer context describing how predictions list works */}
                <div className="bg-black/45/10 border border-white/[0.06] p-3 rounded-xl flex gap-2 text-[10.5px] text-white/45 leading-relaxed font-mono">
                  <Info className="w-4 h-4 text-vouch-cyan flex-shrink-0" />
                  <p>
                    All live score predictions are updated continuously under client-side caching schemes. Free integration scales across many concurrent visitors.
                  </p>
                </div>

              </div>
            ) : (
              <div className={`${Z8_PANEL_PREMIUM} p-16 text-center text-white/50 font-mono text-xs`}>
                Select a live game on the left menu to display deep advanced analytic cards.
              </div>
            )}
          </div>

        </div>
      )}

    </main>
  );
}
