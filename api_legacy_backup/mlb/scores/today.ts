import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSchedule, normalizeGame, validDate } from "../../_utils/mlb.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const date = validDate(req.query.date);
  try {
    const games = (await getSchedule(date)).map((game: any) => normalizeGame(game, date));
    const scores = games.map((game: any) => ({
      gamePk: game.gamePk,
      status: game.status,
      isLive: /progress|live|in play|warmup/i.test(game.status),
      isFinal: /final|game over|completed/i.test(game.status),
      inning: game.linescore?.currentInning ?? null,
      inningState: game.linescore?.inningState ?? null,
      score: { away: game.awayTeam.score, home: game.homeTeam.score },
    }));
    return res.status(200).json({ ok: true, date, scores, warnings: [], updatedAt: new Date().toISOString() });
  } catch (error: any) {
    return res.status(200).json({ ok: false, date, scores: [], warnings: [error?.message ?? "Scores unavailable"], updatedAt: new Date().toISOString() });
  }
}
