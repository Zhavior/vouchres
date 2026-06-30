import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSchedule, normalizeGame, validDate } from "../_utils/mlb.js";

function row(game: any, side: "away" | "home") {
  const team = side === "away" ? game.awayTeam : game.homeTeam;
  const opponent = side === "away" ? game.homeTeam : game.awayTeam;
  const pitcher = team.probablePitcher;
  return {
    pitcherId: pitcher?.id ?? null,
    pitcherName: pitcher?.name ?? "TBD",
    team: team.abbr || team.name,
    opponent: opponent.abbr || opponent.name,
    gameId: game.gamePk,
    gameTime: game.gameDate,
    pitcherHand: pitcher?.throws ?? "U",
    score: null,
    label: "NEUTRAL",
    metrics: {
      k9: null,
      kPerGame: null,
      era: null,
      whip: null,
      ip: null,
      gs: null,
      whiffPct: null,
      kPct: null,
      xera: null,
      oppKPct: null,
      opponentVsHand: null,
      parkFactor: null,
      weather: null,
    },
    dataQuality: {
      probablePitcher: pitcher ? "official" : "unknown",
      statcast: "missing",
      weather: "missing",
    },
    confidence: "Low",
    scoring: {
      pitcherStrikeoutSkill: null,
      opponentStrikeoutWeakness: null,
      workloadSafety: null,
      runPreventionControl: null,
      recentForm: null,
      context: null,
      availableWeight: 0,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const date = validDate(req.query.date);
  try {
    const games = (await getSchedule(date)).map((game: any) => normalizeGame(game, date));
    const rows = games.flatMap((game: any) => [row(game, "away"), row(game, "home")]);
    return res.status(200).json({
      ok: true,
      date,
      generatedAt: new Date().toISOString(),
      rows,
      mode: "vercel_schedule_only",
      warnings: ["Pitcher Statcast, opponent split, and weather enrichments are unavailable in this Vercel fallback route."],
    });
  } catch (error: any) {
    return res.status(200).json({
      ok: false,
      date,
      generatedAt: new Date().toISOString(),
      rows: [],
      mode: "vercel_schedule_only",
      warnings: [error?.message ?? "Matchup matrix unavailable"],
    });
  }
}
