import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPitcherMatchup } from "../../../../../server/services/mlb/pitcherMatchupService";

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  return res.json(body);
}

function parsePositiveInt(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseDate(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const text = String(raw ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startedAt = Date.now();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, {
      ok: false,
      error: "Method not allowed",
      warnings: ["Only GET is supported for pitcher matchup research."],
    });
  }

  const gamePk = parsePositiveInt(req.query.gamePk);
  const pitcherId = parsePositiveInt(req.query.pitcherId);
  const date = parseDate(req.query.date);

  if (!gamePk || !pitcherId) {
    return json(res, 400, {
      ok: false,
      error: "Missing or invalid gamePk/pitcherId",
      warnings: ["Expected /api/mlb/matchup-matrix/{gamePk}/pitcher/{pitcherId}?date=YYYY-MM-DD"],
    });
  }

  try {
    const payload = await getPitcherMatchup(gamePk, pitcherId, date);

    if (!payload) {
      return json(res, 200, {
        gamePk,
        pitcher: null,
        opponent: {
          team: "",
          projectedLineup: [],
        },
        warnings: ["Pitcher matchup was not available for this game/date."],
        diagnostics: {
          durationMs: Date.now() - startedAt,
          source: "vercel_pitcher_matchup_handler",
        },
      });
    }

    return json(res, 200, {
      ...payload,
      warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
      diagnostics: {
        durationMs: Date.now() - startedAt,
        source: "vercel_pitcher_matchup_handler",
      },
    });
  } catch (error) {
    console.error("[api/mlb/matchup-matrix/:gamePk/pitcher/:pitcherId]", error);

    return json(res, 200, {
      gamePk,
      pitcher: null,
      opponent: {
        team: "",
        projectedLineup: [],
      },
      warnings: [
        error instanceof Error ? error.message : "Pitcher matchup request failed.",
      ],
      diagnostics: {
        durationMs: Date.now() - startedAt,
        source: "vercel_pitcher_matchup_handler",
        recovered: true,
      },
    });
  }
}
