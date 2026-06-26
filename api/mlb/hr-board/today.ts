import type { VercelRequest, VercelResponse } from "@vercel/node";

const todayISO = () => new Date().toISOString().slice(0, 10);

const TEAM_ABBR: Record<string, string> = {
  "Kansas City Royals": "KC",
  "Chicago White Sox": "CWS",
  "New York Yankees": "NYY",
  "Boston Red Sox": "BOS",
  "Los Angeles Dodgers": "LAD",
  "San Diego Padres": "SD",
  "Philadelphia Phillies": "PHI",
  "New York Mets": "NYM",
  "Toronto Blue Jays": "TOR",
  "Seattle Mariners": "SEA",
};

function abbr(name: string) {
  return TEAM_ABBR[name] ?? name.split(" ").map((x) => x[0]).join("").slice(0, 3).toUpperCase();
}

function parkFactor(venue: string) {
  const table: Record<string, number> = {
    "Rate Field": 121,
    "Guaranteed Rate Field": 121,
    "Kauffman Stadium": 99,
    "Yankee Stadium": 112,
    "Dodger Stadium": 104,
    "Citi Field": 99,
    "Rogers Centre": 101,
    "T-Mobile Park": 94,
    "Wrigley Field": 105,
    "Coors Field": 118,
    "Citizens Bank Park": 110,
    "Target Field": 102,
  };

  return table[venue] ?? 100;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : todayISO();

    const url =
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}` +
      `&hydrate=team,probablePitcher,venue`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`MLB StatsAPI failed ${response.status}`);
    }

    const data: any = await response.json();
    const games = data?.dates?.[0]?.games ?? [];

    const candidates: any[] = [];

    for (const game of games) {
      const away = game?.teams?.away;
      const home = game?.teams?.home;

      const awayTeam = away?.team?.name ?? "Away";
      const homeTeam = home?.team?.name ?? "Home";
      const awayAbbr = away?.team?.abbreviation ?? abbr(awayTeam);
      const homeAbbr = home?.team?.abbreviation ?? abbr(homeTeam);

      const venue = game?.venue?.name ?? "Unknown venue";
      const pf = parkFactor(venue);
      const hrMultiplier = Number((pf / 100).toFixed(2));

      const awayPitcher = away?.probablePitcher?.fullName ?? "TBD";
      const homePitcher = home?.probablePitcher?.fullName ?? "TBD";

      const baseRows = [
        {
          playerName: `${awayAbbr} HR Watch`,
          team: awayAbbr,
          opponent: homeAbbr,
          opponentPitcher: homePitcher,
        },
        {
          playerName: `${homeAbbr} HR Watch`,
          team: homeAbbr,
          opponent: awayAbbr,
          opponentPitcher: awayPitcher,
        },
      ];

      for (const row of baseRows) {
        candidates.push({
          playerId: Number(`${game.gamePk}${candidates.length}`.slice(0, 9)),
          playerName: row.playerName,
          team: row.team,
          opponent: row.opponent,
          opponentPitcher: row.opponentPitcher,
          opposingPitcher: row.opponentPitcher,
          pitcherTeam: row.opponent,
          opposingPitcherTeam: row.opponent,
          gamePk: game.gamePk,
          gameId: String(game.gamePk),
          venue,
          parkFactor: pf,
          hrMultiplier,
          parkSource: "vercel_static_park_table",
          weatherBoost: 0,
          weatherSource: "unavailable",
          bestOdds: null,
          lineMovement: null,
          lineupStatus: "projected",
          battingOrder: null,
          hrScore: 50,
          dataConfidence: 50,
          riskTier: "watchlist",
          status: "watchlist",
          reasons: [
            "Production-safe HR watch row from official MLB schedule. Full player registry scoring is local/backend mode only right now."
          ],
          warnings: [
            "Weather, odds, and confirmed lineups are unavailable in this Vercel-safe route."
          ],
        });
      }
    }

    return res.status(200).json({
      status: "ready",
      date,
      season: String(new Date(date).getFullYear()),
      candidates,
      count: candidates.length,
      games,
      dataQuality: "vercel_safe_partial",
      source: "official_mlb_statsapi_vercel_safe",
      runtime: "vercel_standalone_no_server_imports",
      updatedAt: new Date().toISOString(),
      warning:
        "Vercel-safe route is active. Full local HR pipeline cannot be imported by Vercel serverless yet.",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to load Vercel-safe HR board",
      message: error?.message ?? "Unknown error",
      runtime: "vercel_standalone_no_server_imports",
    });
  }
}
