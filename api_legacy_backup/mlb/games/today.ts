import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSchedule, normalizeGame, validDate } from "../../_utils/mlb.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const date = validDate(req.query.date);
  try {
    const games = await getSchedule(date);
    return res.status(200).json({
      ok: true,
      date,
      games: games.map((game: any) => normalizeGame(game, date)),
      warnings: [],
      source: "official_mlb_statsapi_vercel",
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(200).json({
      ok: false,
      date,
      games: [],
      warnings: [error?.message ?? "MLB games unavailable"],
      source: "official_mlb_statsapi_vercel",
      updatedAt: new Date().toISOString(),
    });
  }
}
