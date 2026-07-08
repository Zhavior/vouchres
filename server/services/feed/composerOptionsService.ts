import { TTLCache, limitConcurrency } from "../../lib/cache";
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { getScheduleByDate, getBoxscore, todayISO } from "../mlb/mlbClient";
import { headshotUrl, type NormalizedGame } from "../mlb/mlbTypes";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");

const composerCache = new TTLCache<ComposerOptionsResponse>(3 * 60_000, "feed:composerOptions");
const rosterCache = new TTLCache<PlayerOption[]>(5 * 60_000, "feed:teamRoster");

export interface PlayerOption {
  id: string;
  name: string;
  teamId: string;
  teamAbbr: string;
  position: string | null;
  bats: string | null;
  throws: string | null;
  isStarter: boolean;
  battingOrder: number | null;
  headshotUrl: string | null;
}

interface TeamOption {
  id: string;
  name: string;
  abbr: string;
  players: PlayerOption[];
}

interface GameOption {
  gameId: string;
  label: string;
  startTime: string | null;
  status: string;
  awayTeam: TeamOption;
  homeTeam: TeamOption;
}

export interface ComposerOptionsResponse {
  sport: "MLB";
  date: string;
  games: GameOption[];
  markets: Array<{ id: string; label: string }>;
  warnings: string[];
}

const MARKETS: ComposerOptionsResponse["markets"] = [
  { id: "HR", label: "Home Run" },
  { id: "HIT", label: "Hit" },
  { id: "RBI", label: "RBI" },
  { id: "RUN", label: "Run" },
  { id: "TB", label: "Total Bases" },
  { id: "K", label: "Strikeouts" },
  { id: "CUSTOM", label: "Custom Read" },
];

function normalizeDate(value?: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? value! : todayISO();
}

function battingOrderSpot(value: unknown): number | null {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n >= 100 ? Math.floor(n / 100) : n;
}

function cleanHand(value: unknown): string | null {
  const code = String(value ?? "").trim();
  return ["L", "R", "S"].includes(code) ? code : null;
}

function playerFromRoster(entry: any, teamId: string, teamAbbr: string): PlayerOption | null {
  const id = entry?.person?.id;
  const name = entry?.person?.fullName;
  if (!id || !name) return null;
  return {
    id: String(id),
    name,
    teamId,
    teamAbbr,
    position: entry?.position?.abbreviation ?? null,
    bats: cleanHand(entry?.person?.batSide?.code),
    throws: cleanHand(entry?.person?.pitchHand?.code),
    isStarter: false,
    battingOrder: null,
    headshotUrl: headshotUrl(Number(id)),
  };
}

async function getTeamRoster(teamId: string, teamAbbr: string): Promise<PlayerOption[]> {
  return rosterCache.getOrSet(`roster:${teamId}`, async () => {
    const url = `${BASE}/v1/teams/${teamId}/roster?rosterType=active&hydrate=person`;
    const data = await sportsFetchJson<any>(url, {
      cacheKey: `feedComposer:roster:${teamId}`,
      ttlMs: 5 * 60_000,
      timeoutMs: 8_000,
      retries: 1,
      debugLabel: "feedComposer",
    });
    const rows = Array.isArray(data?.roster) ? data.roster : [];
    return rows
      .map((entry: any) => playerFromRoster(entry, teamId, teamAbbr))
      .filter(Boolean)
      .sort((a: PlayerOption, b: PlayerOption) => {
        const posA = a.position === "P" ? 1 : 0;
        const posB = b.position === "P" ? 1 : 0;
        return posA - posB || a.name.localeCompare(b.name);
      });
  }) as Promise<PlayerOption[]>;
}

function lineupFromBoxscore(boxscore: any, side: "away" | "home", teamId: string, teamAbbr: string): PlayerOption[] {
  const players = boxscore?.teams?.[side]?.players;
  if (!players || typeof players !== "object") return [];

  return Object.values(players)
    .map((entry: any) => {
      const id = entry?.person?.id;
      const name = entry?.person?.fullName;
      const order = battingOrderSpot(entry?.battingOrder);
      if (!id || !name || order == null) return null;
      return {
        id: String(id),
        name,
        teamId,
        teamAbbr,
        position: entry?.position?.abbreviation ?? null,
        bats: cleanHand(entry?.batSide?.code),
        throws: cleanHand(entry?.pitchHand?.code),
        isStarter: true,
        battingOrder: order,
        headshotUrl: headshotUrl(Number(id)),
      } satisfies PlayerOption;
    })
    .filter(Boolean)
    .sort((a: PlayerOption, b: PlayerOption) => (a.battingOrder ?? 99) - (b.battingOrder ?? 99));
}

function mergePlayers(roster: PlayerOption[], starters: PlayerOption[]): PlayerOption[] {
  const byId = new Map<string, PlayerOption>();
  for (const p of roster) byId.set(p.id, p);
  for (const starter of starters) {
    const existing = byId.get(starter.id);
    byId.set(starter.id, {
      ...(existing ?? starter),
      ...starter,
      position: starter.position ?? existing?.position ?? null,
      bats: starter.bats ?? existing?.bats ?? null,
      throws: starter.throws ?? existing?.throws ?? null,
    });
  }
  return [...byId.values()].sort((a, b) => {
    if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
    if (a.isStarter && b.isStarter) return (a.battingOrder ?? 99) - (b.battingOrder ?? 99);
    const posA = a.position === "P" ? 1 : 0;
    const posB = b.position === "P" ? 1 : 0;
    return posA - posB || a.name.localeCompare(b.name);
  });
}

function teamShell(game: NormalizedGame, side: "away" | "home", players: PlayerOption[]): TeamOption {
  const team = side === "away" ? game.awayTeam : game.homeTeam;
  return {
    id: String(team.teamId),
    name: team.name,
    abbr: team.abbreviation,
    players,
  };
}

export async function getFeedComposerOptions(input: {
  sport?: string;
  date?: string;
} = {}): Promise<ComposerOptionsResponse> {
  const sport = String(input.sport ?? "MLB").toUpperCase();
  if (sport !== "MLB") {
    return {
      sport: "MLB",
      date: normalizeDate(input.date),
      games: [],
      markets: MARKETS,
      warnings: [`Unsupported sport "${sport}". Only MLB composer options are available.`],
    };
  }

  const date = normalizeDate(input.date);
  const startedAt = Date.now();
  return composerCache.getOrSet(`composer:MLB:${date}`, async () => {
    const warnings: string[] = [];
    const games = await getScheduleByDate(date);
    if (games.length === 0) {
      warnings.push(`No MLB games found for ${date}.`);
    }

    const teamIds = [...new Set(games.flatMap((game) => [game.awayTeam.teamId, game.homeTeam.teamId]))];
    const rosterResults = await limitConcurrency(teamIds, 4, async (teamId) => {
      const game = games.find((g) => g.awayTeam.teamId === teamId || g.homeTeam.teamId === teamId);
      const team = game?.awayTeam.teamId === teamId ? game.awayTeam : game?.homeTeam;
      if (!team) return { teamId, roster: [] as PlayerOption[], error: "team_not_found" };
      try {
        const roster = await getTeamRoster(String(team.teamId), team.abbreviation);
        if (roster.length === 0) warnings.push(`Roster unavailable for ${team.abbreviation}.`);
        return { teamId, roster, error: null };
      } catch (err) {
        warnings.push(`Roster unavailable for ${team.abbreviation}: ${(err as Error).message}`);
        return { teamId, roster: [] as PlayerOption[], error: (err as Error).message };
      }
    });
    const rostersByTeam = new Map(rosterResults.map((r) => [r.teamId, r.roster]));

    const boxscoreResults = await limitConcurrency(games, 4, async (game) => {
      const boxscore = await getBoxscore(game.gamePk);
      if (!boxscore) warnings.push(`Lineup unavailable for ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}.`);
      return { gamePk: game.gamePk, boxscore };
    });
    const boxscoresByGame = new Map(boxscoreResults.map((r) => [r.gamePk, r.boxscore]));

    const responseGames = games.map((game) => {
      const boxscore = boxscoresByGame.get(game.gamePk);
      const awayStarters = lineupFromBoxscore(boxscore, "away", String(game.awayTeam.teamId), game.awayTeam.abbreviation);
      const homeStarters = lineupFromBoxscore(boxscore, "home", String(game.homeTeam.teamId), game.homeTeam.abbreviation);
      if (awayStarters.length === 0 || homeStarters.length === 0) {
        warnings.push(`Official lineup not posted yet for ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}.`);
      }

      const awayPlayers = mergePlayers(rostersByTeam.get(game.awayTeam.teamId) ?? [], awayStarters);
      const homePlayers = mergePlayers(rostersByTeam.get(game.homeTeam.teamId) ?? [], homeStarters);
      if (awayPlayers.length === 0) warnings.push(`No player options available for ${game.awayTeam.abbreviation}.`);
      if (homePlayers.length === 0) warnings.push(`No player options available for ${game.homeTeam.abbreviation}.`);

      return {
        gameId: String(game.gamePk),
        label: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
        startTime: game.gameDate ?? null,
        status: game.status,
        awayTeam: teamShell(game, "away", awayPlayers),
        homeTeam: teamShell(game, "home", homePlayers),
      } satisfies GameOption;
    });

    const playerCount = responseGames.reduce(
      (sum, game) => sum + game.awayTeam.players.length + game.homeTeam.players.length,
      0
    );
    console.log(
      `[feedComposer] built MLB ${date}: games=${responseGames.length} players=${playerCount} ${Date.now() - startedAt}ms`
    );

    return {
      sport: "MLB",
      date,
      games: responseGames,
      markets: MARKETS,
      warnings: [...new Set(warnings)],
    };
  }) as Promise<ComposerOptionsResponse>;
}

export function clearFeedComposerCache(): void {
  composerCache.clear();
}

export function resetFeedComposerDiagnostics(): void {
  composerCache.resetStats();
}

export function getFeedComposerDiagnostics() {
  return composerCache.getStats();
}
