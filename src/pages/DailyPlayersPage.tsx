import React, { useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { safeJsonFetch } from '../api/safeApiClient';

interface DailyPlayer {
  playerId: number;
  playerName: string;
  position: string;
  battingOrder: number;
  bats: string;
  team: string;
  teamId: number;
  teamAbbrev: string;
  headshot: string;
}

interface DailyPitcher {
  id: number;
  name: string;
  throws: string;
  headshot: string;
}

interface DailyGame {
  gamePk: number;
  gameDate: string;
  status: string;
  venue: string;
  awayTeam: { id: number; name: string; abbrev: string };
  homeTeam: { id: number; name: string; abbrev: string };
  awayPitcher: DailyPitcher | null;
  homePitcher: DailyPitcher | null;
  awayLineup: DailyPlayer[];
  homeLineup: DailyPlayer[];
  lineupConfirmed: boolean;
  totalPlayers: number;
}

interface LineupResponse {
  ok: boolean;
  date: string;
  games: DailyGame[];
  totalGames: number;
  totalPlayers: number;
  source: string;
  updatedAt: string;
  error?: string;
}

const POSITION_ORDER: Record<string, number> = {
  C: 1, '1B': 2, '2B': 3, '3B': 4, SS: 5, LF: 6, CF: 7, RF: 8,
  DH: 9, OF: 10, IF: 11, P: 12, RP: 13, SP: 14,
};

function positionColor(pos: string) {
  if (['SP', 'RP', 'P'].includes(pos)) return 'text-amber-400';
  if (['C'].includes(pos)) return 'text-cyan-400';
  if (['1B', '2B', '3B', 'SS'].includes(pos)) return 'text-emerald-400';
  if (['LF', 'CF', 'RF', 'OF'].includes(pos)) return 'text-violet-400';
  if (pos === 'DH') return 'text-orange-400';
  return 'text-slate-400';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function GameCard({ game, search }: { game: DailyGame; search: string }) {
  const [expanded, setExpanded] = useState(true);

  const filterPlayers = (players: DailyPlayer[]) => {
    if (!search) return players;
    const q = search.toLowerCase();
    return players.filter(
      p => p.playerName.toLowerCase().includes(q) || p.position.toLowerCase().includes(q)
    );
  };

  const awayFiltered = filterPlayers(game.awayLineup);
  const homeFiltered = filterPlayers(game.homeLineup);
  const noResults = search && awayFiltered.length === 0 && homeFiltered.length === 0;

  if (noResults) return null;

  const isLive = game.status.toLowerCase().includes('progress') || game.status.toLowerCase().includes('inning');
  const isFinal = game.status.toLowerCase() === 'final';
  const statusColor = isLive ? 'text-emerald-400' : isFinal ? 'text-slate-500' : 'text-cyan-300';

  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 overflow-hidden">
      {/* Game header */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-900/40 transition-colors"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-black text-slate-100">
              {game.awayTeam.abbrev} <span className="text-slate-500">@</span> {game.homeTeam.abbrev}
            </span>
            <span className={`text-xs font-semibold ${statusColor}`}>{game.status}</span>
            {game.lineupConfirmed && (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Lineup Posted
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{game.venue}</span>
            {game.awayPitcher && <span>{game.awayTeam.abbrev}: {game.awayPitcher.name} ({game.awayPitcher.throws}HP)</span>}
            {game.homePitcher && <span>{game.homeTeam.abbrev}: {game.homePitcher.name} ({game.homePitcher.throws}HP)</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-500">{game.totalPlayers} players</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="grid gap-0 sm:grid-cols-2 border-t border-slate-800/50">
          {[
            { team: game.awayTeam, players: awayFiltered, pitcher: game.awayPitcher },
            { team: game.homeTeam, players: homeFiltered, pitcher: game.homePitcher },
          ].map(({ team, players, pitcher }) => (
            <div key={team.id} className="border-b sm:border-b-0 sm:border-r border-slate-800/50 last:border-0">
              {/* Team header */}
              <div className="px-4 py-2 bg-slate-900/30 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">{team.name}</span>
                {pitcher && (
                  <span className="text-[10px] text-amber-400 font-semibold">
                    SP: {pitcher.name} ({pitcher.throws})
                  </span>
                )}
              </div>

              {players.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-600">
                  {search ? 'No matching players' : 'Lineup not yet posted'}
                </div>
              ) : (
                <div className="divide-y divide-slate-800/30">
                  {players.map((player) => (
                    <div key={player.playerId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-900/20 transition-colors">
                      <span className="w-5 text-right text-[10px] font-mono font-bold text-slate-600 flex-shrink-0">
                        {player.battingOrder || '—'}
                      </span>
                      <img
                        src={player.headshot}
                        alt={player.playerName}
                        loading="lazy"
                        className="h-7 w-7 rounded-lg border border-slate-700/60 bg-slate-900 object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span className="flex-1 min-w-0 text-sm font-semibold text-slate-200 truncate">
                        {player.playerName}
                      </span>
                      <span className={`text-xs font-black flex-shrink-0 w-8 text-right ${positionColor(player.position)}`}>
                        {player.position}
                      </span>
                      <span className="text-[10px] text-slate-600 flex-shrink-0">
                        {player.bats}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DailyPlayersPageProps {
  onAddLegToParlay?: (player: any, prop: any) => void;
}

export default function DailyPlayersPage(_props: DailyPlayersPageProps) {
  const [data, setData] = useState<LineupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'unconfirmed'>('all');

  const fetchLineups = async () => {
    setLoading(true);
    const result = await safeJsonFetch<LineupResponse>('/api/mlb/lineup/today', {
      fallbackData: { ok: false, date: todayISO(), games: [], totalGames: 0, totalPlayers: 0, source: 'fallback', updatedAt: new Date().toISOString() },
      timeoutMs: 14000,
    });
    if (result.ok) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error || 'Could not load lineup data');
      setData(result.data);
    }
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchLineups(); }, []);

  const filteredGames = useMemo(() => {
    if (!data?.games) return [];
    return data.games.filter(g => {
      if (filter === 'confirmed') return g.lineupConfirmed;
      if (filter === 'unconfirmed') return !g.lineupConfirmed;
      return true;
    });
  }, [data?.games, filter]);

  const date = todayISO();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/20 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                Daily Roster
              </span>
              <span className="text-xs text-slate-500">{date}</span>
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
                <Users className="h-4 w-4 text-cyan-300" />
              </span>
              Daily Players
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              All players confirmed or projected in today's MLB games. Lineups update as teams post them. Batting orders, positions, and pitchers from the official MLB Stats API.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-right text-xs">
            <div className="font-black text-slate-200">
              {loading ? 'Loading...' : `${data?.totalGames ?? 0} games · ${data?.totalPlayers ?? 0} players`}
            </div>
            {lastUpdated && (
              <div className="mt-1 text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search player or position..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'confirmed', 'unconfirmed'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
                  filter === f
                    ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                {f === 'all' ? 'All Games' : f === 'confirmed' ? 'Lineup Posted' : 'Pending'}
              </button>
            ))}
            <button
              type="button"
              onClick={fetchLineups}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-xs font-black text-slate-400 transition-colors hover:border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {error}. Showing available data below.
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-800/50 bg-slate-900/30" />
            ))}
          </div>
        )}

        {/* Game cards */}
        {!loading && (
          <div className="space-y-4">
            {filteredGames.length === 0 ? (
              <div className="rounded-2xl border border-slate-800/50 bg-slate-950/40 p-10 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-700" />
                <p className="mt-3 text-sm text-slate-500">
                  {data?.totalGames === 0
                    ? 'No games scheduled today or lineup data is unavailable.'
                    : 'No games match your current filter.'}
                </p>
              </div>
            ) : (
              filteredGames.map(game => (
                <React.Fragment key={game.gamePk}>
                  <GameCard game={game} search={search} />
                </React.Fragment>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
