import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFeedComposerOptions } from "../../server/services/feed/composerOptionsService.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sport = typeof req.query.sport === "string" ? req.query.sport : "MLB";
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  try {
    const options = await getFeedComposerOptions({ sport, date });
    return res.status(200).json(options);
  } catch (error: any) {
    return res.status(200).json({
      sport: "MLB",
      date: date ?? new Date().toISOString().slice(0, 10),
      games: [],
      markets: [
        { id: "HR", label: "Home Run" },
        { id: "HIT", label: "Hit" },
        { id: "RBI", label: "RBI" },
        { id: "RUN", label: "Run" },
        { id: "TB", label: "Total Bases" },
        { id: "K", label: "Strikeouts" },
        { id: "CUSTOM", label: "Custom Read" },
      ],
      warnings: [error?.message ?? "Composer options unavailable"],
    });
  }
}
