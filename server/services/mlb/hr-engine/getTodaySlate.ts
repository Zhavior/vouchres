import type { HrSlateGame } from "./hrEngineTypes";

const MLB_SCHEDULE_URL = "https://statsapi.mlb.com/api/v1/schedule";

const TEAM_ABBR: Record<string, string> = {
  "Arizona Diamondbacks": "ARI",
  "Atlanta Braves": "ATL",
  "Baltimore Orioles": "BAL",
  "Boston Red Sox": "BOS",
  "Chicago Cubs": "CHC",
  "Chicago White Sox": "CWS",
  "Cincinnati Reds": "CIN",
  "Cleveland Guardians": "CLE",
  "Colorado Rockies": "COL",
  "Detroit Tigers": "DET",
  "Houston Astros": "HOU",
  "Kansas City Royals": "KC",
  "Los Angeles Angels": "LAA",
  "Los Angeles Dodgers": "LAD",
  "Miami Marlins": "MIA",
  "Milwaukee Brewers": "MIL",
  "Minnesota Twins": "MIN",
  "New York Mets": "NYM",
  "New York Yankees": "NYY",
  "Oakland Athletics": "ATH",
  "Philadelphia Phillies": "PHI",
  "Pittsburgh Pirates": "PIT",
  "San Diego Padres": "SD",
  "San Francisco Giants": "SF",
  "Seattle Mariners": "SEA",
  "St. Louis Cardinals": "STL",
  "Tampa Bay Rays": "TB",
  "Texas Rangers": "TEX",
  "Toronto Blue Jays": "TOR",
  "Washington Nationals": "WSH",
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function teamAbbr(name: string, fallback?: string | null) {
  if (fallback) return fallback;
  return TEAM_ABBR[name] ?? name.split(" ").map((part) => part[0]).join("").slice(0, 3).toUpperCase();
}

async function fetchJson(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MLB fetch failed ${response.status}: ${url}`);
  }

  return response.json();
}

export async function getTodaySlate(date = todayISO()): Promise<HrSlateGame[]> {
  const url =
    `${MLB_SCHEDULE_URL}?sportId=1&date=${date}` +
    `&hydrate=team,probablePitcher,venue`;

  const data: any = await fetchJson(url);
  const games = data?.dates?.[0]?.games ?? [];

  return games
    .map((game: any): HrSlateGame | null => {
      const away = game?.teams?.away;
      const home = game?.teams?.home;

      const awayTeamId = away?.team?.id;
      const homeTeamId = home?.team?.id;

      if (!game?.gamePk || !awayTeamId || !homeTeamId) {
        return null;
      }

      const awayTeamName = away?.team?.name ?? "Away";
      const homeTeamName = home?.team?.name ?? "Home";

      return {
        gamePk: game.gamePk,
        gameId: String(game.gamePk),
        date,
        gameDate: game.gameDate,
        status: game?.status?.detailedState ?? "Unknown",
        venue: game?.venue?.name ?? "Unknown venue",

        awayTeamId,
        awayTeam: teamAbbr(awayTeamName, away?.team?.abbreviation),
        awayTeamName,

        homeTeamId,
        homeTeam: teamAbbr(homeTeamName, home?.team?.abbreviation),
        homeTeamName,

        awayProbablePitcherId: away?.probablePitcher?.id ?? null,
        awayProbablePitcherName: away?.probablePitcher?.fullName ?? null,

        homeProbablePitcherId: home?.probablePitcher?.id ?? null,
        homeProbablePitcherName: home?.probablePitcher?.fullName ?? null,
      };
    })
    .filter(Boolean) as HrSlateGame[];
}
