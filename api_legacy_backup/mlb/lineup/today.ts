import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSchedule, normalizeGame, normalizePlayer, validDate } from "../../_utils/mlb.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const date = validDate(req.query.date);
  try {
    const rawGames = await getSchedule(date);
    const games = rawGames.map((raw: any) => {
      const game = normalizeGame(raw, date);
      const awayTeam = { ...game.awayTeam };
      const homeTeam = { ...game.homeTeam };
      const awayPlayers = raw?.lineups?.awayPlayers ?? [];
      const homePlayers = raw?.lineups?.homePlayers ?? [];
      return {
        ...game,
        awayLineup: awayPlayers.map((player: any, index: number) => normalizePlayer(player, awayTeam, index)),
        homeLineup: homePlayers.map((player: any, index: number) => normalizePlayer(player, homeTeam, index)),
        lineupConfirmed: awayPlayers.length > 0 || homePlayers.length > 0,
        totalPlayers: awayPlayers.length + homePlayers.length,
      };
    });
    const totalPlayers = games.reduce((sum: number, game: any) => sum + game.totalPlayers, 0);
    return res.status(200).json({
      ok: true,
      date,
      games,
      totalGames: games.length,
      totalPlayers,
      warnings: totalPlayers === 0 ? ["Official MLB lineups are not posted yet."] : [],
      source: "official_mlb_statsapi_vercel",
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(200).json({
      ok: false,
      date,
      games: [],
      totalGames: 0,
      totalPlayers: 0,
      warnings: [error?.message ?? "Lineup data unavailable"],
      source: "official_mlb_statsapi_vercel",
      updatedAt: new Date().toISOString(),
    });
  }
}
