import type { VercelRequest, VercelResponse } from "@vercel/node";

const todayISO = () => new Date().toISOString().slice(0, 10);

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

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

function abbr(name: string) {
  return TEAM_ABBR[name] ?? name.split(" ").map((x) => x[0]).join("").slice(0, 3).toUpperCase();
}

function parkFactor(venue: string) {
  const table: Record<string, number> = {
    "Rate Field": 121,
    "Guaranteed Rate Field": 121,
    "Yankee Stadium": 112,
    "Dodger Stadium": 104,
    "Citi Field": 99,
    "Rogers Centre": 101,
    "T-Mobile Park": 94,
    "Wrigley Field": 105,
    "Coors Field": 118,
    "Citizens Bank Park": 110,
    "Target Field": 102,
    "Great American Ball Park": 116,
    "Fenway Park": 105,
    "Camden Yards": 102,
    "Minute Maid Park": 101,
  };

  return table[venue] ?? 100;
}

function positionBoost(position: string) {
  const p = position.toLowerCase();
  if (p.includes("designated")) return 9;
  if (p.includes("first base")) return 8;
  if (p.includes("third base")) return 7;
  if (p.includes("outfield")) return 6;
  if (p.includes("catcher")) return 4;
  if (p.includes("second base")) return 2;
  if (p.includes("shortstop")) return 2;
  return 1;
}

function riskTier(score: number) {
  if (score >= 72) return "Strong";
  if (score >= 64) return "Playable";
  if (score >= 57) return "Sneaky";
  return "Longshot";
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${url}`);
  }
  return response.json();
}

async function fetchActiveHitters(teamId: number) {
  const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active`;
  const data: any = await fetchJson(url);
  const roster = data?.roster ?? [];

  return roster
    .filter((r: any) => {
      const type = String(r?.position?.type ?? "").toLowerCase();
      const name = String(r?.position?.name ?? "").toLowerCase();
      return type !== "pitcher" && !name.includes("pitcher");
    })
    .map((r: any) => ({
      playerId: r?.person?.id,
      playerName: r?.person?.fullName,
      position: r?.position?.name ?? "Hitter",
    }))
    .filter((p: any) => p.playerId && p.playerName);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : todayISO();

    const rawLimit =
      typeof req.query.previewLimit === "string"
        ? Number.parseInt(req.query.previewLimit, 10)
        : 50;

    const previewLimit = clamp(Number.isFinite(rawLimit) ? rawLimit : 50, 10, 350);

    const scheduleUrl =
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}` +
      `&hydrate=team,probablePitcher,venue`;

    const data: any = await fetchJson(scheduleUrl);
    const games = data?.dates?.[0]?.games ?? [];

    const projectedPool: any[] = [];
    const rosterWarnings: string[] = [];

    await Promise.all(
      games.map(async (game: any) => {
        const away = game?.teams?.away;
        const home = game?.teams?.home;

        const awayTeam = away?.team?.name ?? "Away";
        const homeTeam = home?.team?.name ?? "Home";
        const awayTeamId = away?.team?.id;
        const homeTeamId = home?.team?.id;

        const awayAbbr = away?.team?.abbreviation ?? abbr(awayTeam);
        const homeAbbr = home?.team?.abbreviation ?? abbr(homeTeam);

        const venue = game?.venue?.name ?? "Unknown venue";
        const pf = parkFactor(venue);
        const hrMultiplier = Number((pf / 100).toFixed(2));

        const awayPitcher = away?.probablePitcher?.fullName ?? "TBD";
        const homePitcher = home?.probablePitcher?.fullName ?? "TBD";
        const awayPitcherId = away?.probablePitcher?.id ?? null;
        const homePitcherId = home?.probablePitcher?.id ?? null;

        const sides = [
          {
            teamId: awayTeamId,
            team: awayAbbr,
            teamName: awayTeam,
            opponentTeamId: homeTeamId,
            opponent: homeAbbr,
            opponentName: homeTeam,
            opponentPitcherName: homePitcher,
            opponentPitcherId: homePitcherId,
          },
          {
            teamId: homeTeamId,
            team: homeAbbr,
            teamName: homeTeam,
            opponentTeamId: awayTeamId,
            opponent: awayAbbr,
            opponentName: awayTeam,
            opponentPitcherName: awayPitcher,
            opponentPitcherId: awayPitcherId,
          },
        ];

        for (const side of sides) {
          if (!side.teamId) continue;

          let hitters: any[] = [];
          try {
            hitters = await fetchActiveHitters(side.teamId);
          } catch (error: any) {
            rosterWarnings.push(`${side.team}: ${error?.message ?? "active roster unavailable"}`);
            continue;
          }

          for (const hitter of hitters) {
            const pBoost = positionBoost(hitter.position);
            const parkBoost = Math.round((pf - 100) / 3);
            const pitcherBoost = side.opponentPitcherName === "TBD" ? -4 : 4;
            const score = clamp(52 + pBoost + parkBoost + pitcherBoost, 45, 78);

            projectedPool.push({
              playerId: hitter.playerId,
              playerName: hitter.playerName,
              team: side.team,
              teamId: side.teamId,
              opponent: side.opponent,
              opponentTeam: side.opponent,
              opponentTeamId: side.opponentTeamId,
              opponentPitcherName: side.opponentPitcherName,
              opponentPitcherId: side.opponentPitcherId,
              opposingPitcher: side.opponentPitcherName,
              pitcherTeam: side.opponent,
              opposingPitcherTeam: side.opponent,
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
              lineupStatus: "projected_unconfirmed",
              battingOrder: null,
              hrScore: score,
              dataConfidence: side.opponentPitcherName === "TBD" ? 62 : 72,
              riskTier: riskTier(score),
              status: "preview",
              dataQuality: "projection_preview",
              reasons: [
                `Active MLB roster hitter for ${side.team}.`,
                `Projected matchup vs ${side.opponentPitcherName}.`,
                `Park factor ${pf} at ${venue}.`,
                "Production-safe Vercel preview route. Full HR Engine Pro scoring is pending.",
              ],
              warnings: [
                "Official lineup not posted yet. Do not treat as confirmed.",
                "Weather, odds, Statcast, and full local HR scoring are unavailable in this standalone Vercel route.",
              ],
            });
          }
        }
      })
    );

    projectedPool.sort((a, b) => b.hrScore - a.hrScore || a.playerName.localeCompare(b.playerName));

    const projectedCandidates = projectedPool.slice(0, previewLimit);

    return res.status(200).json({
      status: "ready",
      date,
      season: String(new Date(date).getFullYear()),
      candidates: [],
      projectedCandidates,
      count: 0,
      rankedCount: projectedCandidates.length,
      games,
      gameCount: games.length,
      previewMeta: {
        previewLimit,
        eligiblePreviewPoolCount: projectedPool.length,
        scoredPreviewPoolCount: projectedPool.length,
        projectedPreviewCount: projectedCandidates.length,
      },
      debug: {
        runtime: "vercel_standalone_active_roster_preview",
        projectedPreviewCount: projectedCandidates.length,
        eligiblePreviewPoolCount: projectedPool.length,
        scoredPreviewPoolCount: projectedPool.length,
        rosterWarnings,
      },
      dataQuality: "vercel_safe_projection_preview",
      source: "official_mlb_statsapi_vercel_active_rosters",
      runtime: "vercel_standalone_no_server_imports",
      updatedAt: new Date().toISOString(),
      warning:
        "Vercel-safe standalone preview route is active. Full HR Engine Pro scoring should replace this later.",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to load Vercel-safe HR board",
      message: error?.message ?? "Unknown error",
      runtime: "vercel_standalone_no_server_imports",
    });
  }
}
