import { useEffect, useMemo, useState } from 'react';

type Pitcher = {
  id?: number | string;
  name?: string;
  fullName?: string;
  throws?: string;
  hand?: string;
};

type Player = {
  playerId?: number | string;
  id?: number | string;
  playerName?: string;
  name?: string;
  team?: string;
  opponent?: string;
  position?: string;
  bats?: string;
  throws?: string;
  battingOrder?: number | string;
  source?: string;
  confidence?: number;
  headshot?: string;
};

type Game = {
  gamePk?: number | string;
  id?: number | string;
  awayTeam?: string;
  homeTeam?: string;
  away?: string;
  home?: string;
  gameTime?: string;
  startTime?: string;
  venue?: string;
  status?: string;
  lineupConfirmed?: boolean;
  awayPitcher?: Pitcher | null;
  homePitcher?: Pitcher | null;
  awayLineup?: Player[];
  homeLineup?: Player[];
  players?: Player[];
  totalPlayers?: number;
};

type DailyBoardResponse = {
  ok?: boolean;
  date?: string;
  games?: Game[];
  totalGames?: number;
  totalPlayers?: number;
  source?: string;
  updatedAt?: string;
};

interface DailyPlayersPageProps {
  onAddLegToParlay?: (player: any, prop: any) => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function playerName(player: Player) {
  return player.playerName || player.name || 'Unknown Player';
}

function pitcherName(pitcher?: Pitcher | null) {
  if (!pitcher) return 'TBD';
  return pitcher.name || pitcher.fullName || 'TBD';
}

function teamName(value?: string) {
  return value || 'TBD';
}

function getGamePlayers(game: Game): Player[] {
  const away = Array.isArray(game.awayLineup) ? game.awayLineup : [];
  const home = Array.isArray(game.homeLineup) ? game.homeLineup : [];
  const players = Array.isArray(game.players) ? game.players : [];
  return [...away, ...home, ...players];
}

function normalizeResponse(raw: any): DailyBoardResponse {
  const data = raw?.payload || raw?.data || raw || {};
  const games = Array.isArray(data.games) ? data.games : [];

  return {
    ok: data.ok ?? raw?.ok ?? true,
    date: data.date || todayISO(),
    games,
    totalGames: data.totalGames ?? games.length,
    totalPlayers:
      data.totalPlayers ??
      games.reduce((sum: number, game: Game) => sum + getGamePlayers(game).length, 0),
    source: data.source || 'daily-player-board',
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

function dataQuality(game: Game) {
  const total = getGamePlayers(game).length;
  if (game.lineupConfirmed && total > 0) return 'CONFIRMED';
  if (total > 0) return 'PROJECTED';
  if (game.awayPitcher || game.homePitcher) return 'PITCHERS';
  return 'GAME SHELL';
}

function qualityClass(label: string) {
  if (label === 'CONFIRMED') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (label === 'PROJECTED') return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
  if (label === 'PITCHERS') return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
}

function positionClass(pos?: string) {
  const p = String(pos || '').toUpperCase();
  if (p === 'P') return 'text-cyan-300';
  if (['C', '1B', '2B', '3B', 'SS'].includes(p)) return 'text-emerald-300';
  if (['LF', 'CF', 'RF', 'OF'].includes(p)) return 'text-amber-300';
  return 'text-slate-400';
}

function GameCard({ game, search }: { game: Game; search: string }) {
  const allPlayers = getGamePlayers(game);
  const filteredPlayers = allPlayers.filter((player) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [
      playerName(player),
      player.team,
      player.opponent,
      player.position,
      player.source,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const awayTeam = teamName(game.awayTeam || game.away);
  const homeTeam = teamName(game.homeTeam || game.home);
  const quality = dataQuality(game);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl shadow-cyan-950/20">
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.18em] ${qualityClass(quality)}`}>
            {quality}
          </span>
          <span className="text-xs text-slate-500">
            {game.status || 'Scheduled'}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <div className="text-lg font-black text-slate-100">{awayTeam}</div>
            <div className="mt-1 text-xs text-slate-500">
              SP: <span className="text-cyan-200">{pitcherName(game.awayPitcher)}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">at</div>
            <div className="text-xs text-slate-400">{game.gameTime || game.startTime || 'Time TBD'}</div>
          </div>

          <div className="md:text-right">
            <div className="text-lg font-black text-slate-100">{homeTeam}</div>
            <div className="mt-1 text-xs text-slate-500">
              SP: <span className="text-cyan-200">{pitcherName(game.homePitcher)}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{game.venue || 'Venue TBD'}</span>
          <span>•</span>
          <span>
            {allPlayers.length > 0
              ? `${allPlayers.length} player${allPlayers.length === 1 ? '' : 's'} loaded`
              : 'Lineup pending from MLB'}
          </span>
        </div>
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="p-6 text-center">
          <div className="text-sm font-bold text-slate-300">
            {search ? 'No matching players' : 'No confirmed batting order yet'}
          </div>
          <div className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
            This game is loaded. Probable pitchers and matchup shell are visible, but MLB has not posted a usable player lineup for this game yet.
          </div>
        </div>
      ) : (
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player, index) => (
            <div
              key={`${player.playerId || player.id || playerName(player)}-${index}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 hover:border-cyan-400/30 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-100">
                    {playerName(player)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {player.team || 'Team TBD'} vs {player.opponent || 'Opponent TBD'}
                  </div>
                </div>
                <div className={`text-xs font-black ${positionClass(player.position)}`}>
                  {player.position || '—'}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                {player.bats && (
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-slate-300">
                    Bats {player.bats}
                  </span>
                )}
                {player.battingOrder && (
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-slate-300">
                    Order {player.battingOrder}
                  </span>
                )}
                <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-cyan-200">
                  {player.source || (game.lineupConfirmed ? 'confirmed_lineup' : 'projected')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}




async function fetchTeamRosterPlayers(
  teamId: number | string,
  teamName: string,
  opponent: string
): Promise<Player[]> {
  try {
    const rosterUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active`;
    const response = await fetch(rosterUrl, {
      headers: { accept: 'application/json' },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const roster = Array.isArray(data?.roster) ? data.roster : [];

    return roster
      .filter((item: any) => {
        const pos =
          item?.position?.abbreviation ||
          item?.person?.primaryPosition?.abbreviation ||
          '';
        return pos && pos !== 'P';
      })
      .slice(0, 14)
      .map((item: any) => {
        const pos =
          item?.position?.abbreviation ||
          item?.person?.primaryPosition?.abbreviation ||
          '—';

        return {
          playerId: item?.person?.id,
          playerName: item?.person?.fullName || item?.person?.name || 'Unknown Player',
          team: teamName,
          opponent,
          position: pos,
          bats: undefined,
          throws: undefined,
          battingOrder: undefined,
          source: 'active_roster_fallback',
          confidence: 0.45,
        };
      });
  } catch {
    return [];
  }
}

async function fetchDirectMlbScheduleBoard(): Promise<DailyBoardResponse> {
  const date = todayISO();
  const scheduleUrl =
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=probablePitcher,team,venue`;

  const response = await fetch(scheduleUrl, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MLB direct schedule failed: ${response.status}`);
  }

  const schedule = await response.json();
  const rawGames = schedule?.dates?.flatMap((d: any) => d?.games || []) || [];

  const games: Game[] = await Promise.all(
    rawGames.map(async (game: any) => {
      const awayTeam = game?.teams?.away?.team?.name || 'Away';
      const homeTeam = game?.teams?.home?.team?.name || 'Home';
      const awayTeamId = game?.teams?.away?.team?.id;
      const homeTeamId = game?.teams?.home?.team?.id;

      const awayPitcherRaw = game?.teams?.away?.probablePitcher;
      const homePitcherRaw = game?.teams?.home?.probablePitcher;

      const awayLineup = awayTeamId
        ? await fetchTeamRosterPlayers(awayTeamId, awayTeam, homeTeam)
        : [];

      const homeLineup = homeTeamId
        ? await fetchTeamRosterPlayers(homeTeamId, homeTeam, awayTeam)
        : [];

      const players = [...awayLineup, ...homeLineup];

      return {
        gamePk: game?.gamePk,
        awayTeam,
        homeTeam,
        gameTime: game?.gameDate || '',
        venue: game?.venue?.name || '',
        status: game?.status?.detailedState || game?.status?.abstractGameState || 'Scheduled',
        awayPitcher: awayPitcherRaw
          ? {
              id: awayPitcherRaw.id,
              name: awayPitcherRaw.fullName || awayPitcherRaw.name || 'TBD',
              throws: awayPitcherRaw?.pitchHand?.code || '',
            }
          : null,
        homePitcher: homePitcherRaw
          ? {
              id: homePitcherRaw.id,
              name: homePitcherRaw.fullName || homePitcherRaw.name || 'TBD',
              throws: homePitcherRaw?.pitchHand?.code || '',
            }
          : null,
        lineupConfirmed: false,
        awayLineup,
        homeLineup,
        players,
        totalPlayers: players.length,
      };
    })
  );

  const totalPlayers = games.reduce((sum, game) => sum + getGamePlayers(game).length, 0);

  return {
    ok: true,
    date,
    games,
    totalGames: games.length,
    totalPlayers,
    source: 'direct_mlb_statsapi_browser_roster_fallback',
    updatedAt: new Date().toISOString(),
  };
}

export default function DailyPlayersPage(_props: DailyPlayersPageProps) {
  const [data, setData] = useState<DailyBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'pitchers'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchBoard() {
    setLoading(true);
    setError(null);

    const endpoints = [
      '/api/mlb/daily-player-board',
      '/api/mlb/lineup/today',
      '/api/daily-players',
    ];

    let finalData: DailyBoardResponse | null = null;
    let finalError = '';

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          finalError = `${endpoint} returned ${response.status}`;
          continue;
        }
        const json = await response.json();
        const normalized = normalizeResponse(json);
        finalData = normalized;
        break;
      } catch (err: any) {
        finalError = err?.message || String(err);
      }
    }

    if (!finalData) {
      try {
        finalData = await fetchDirectMlbScheduleBoard();
        finalError = '';
      } catch (directErr: any) {
        finalData = {
          ok: false,
          date: todayISO(),
          games: [],
          totalGames: 0,
          totalPlayers: 0,
          source: 'empty-fallback',
          updatedAt: new Date().toISOString(),
        };
        setError(finalError || directErr?.message || 'Could not load Daily Player Board.');
      }
    }

    setData(finalData);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    fetchBoard();
  }, []);

  const games = useMemo(() => {
    const list = data?.games || [];

    return list.filter((game) => {
      const quality = dataQuality(game);
      if (filter === 'confirmed') return quality === 'CONFIRMED';
      if (filter === 'pending') return quality !== 'CONFIRMED';
      if (filter === 'pitchers') return Boolean(game.awayPitcher || game.homePitcher);
      return true;
    });
  }, [data?.games, filter]);

  const totalPlayers = useMemo(
    () => (data?.games || []).reduce((sum, game) => sum + getGamePlayers(game).length, 0),
    [data?.games]
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/20 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                  Daily Player Board
                </span>
                <span className="text-xs text-slate-500">{data?.date || todayISO()}</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Today’s MLB Players
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Games, probable pitchers, confirmed lineups when available, and fallback states when MLB has not posted batting orders yet.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchBoard}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-300/20"
            >
              Refresh Board
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-500">Games Loaded</div>
              <div className="mt-1 text-2xl font-black text-white">{data?.totalGames ?? games.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-500">Players Loaded</div>
              <div className="mt-1 text-2xl font-black text-white">{totalPlayers}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-500">Last Updated</div>
              <div className="mt-1 text-sm font-bold text-white">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not yet'}
              </div>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search player, team, position..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40 md:max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            {(['all', 'confirmed', 'pending', 'pitchers'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wide ${
                  filter === item
                    ? 'border-cyan-300/40 bg-cyan-300/15 text-cyan-100'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
            Loading Daily Player Board...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-950/20 p-5 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center">
            <div className="text-lg font-black text-white">No games found for this filter.</div>
            <div className="mt-2 text-sm text-slate-500">
              Try All or Refresh Board. If it still shows empty, the backend endpoint is not returning today’s MLB schedule.
            </div>
          </div>
        )}

        {!loading && games.length > 0 && (
          <div className="grid gap-5">
            {games.map((game, index) => (
              <GameCard
                key={`${game.gamePk || game.id || index}`}
                game={game}
                search={search}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
