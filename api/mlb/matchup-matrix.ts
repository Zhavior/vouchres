import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSchedule, normalizeGame, validDate } from "../_utils/mlb.js";
import { getPitcherMatchup } from "../../../server/services/mlb/pitcherMatchupService";

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
  const drawer = String(req.query.drawer ?? "") === "1";
  const drawerGamePk = Number.parseInt(String(req.query.gamePk ?? ""), 10);
  const drawerPitcherId = Number.parseInt(String(req.query.pitcherId ?? ""), 10);

  if (drawer) {
    const drawerDate = validDate(req.query.date);

    if (!Number.isFinite(drawerGamePk) || !Number.isFinite(drawerPitcherId)) {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid gamePk/pitcherId",
        warnings: ["Expected gamePk and pitcherId from matchup drawer route."],
      });
    }

    try {
      const payload = await getPitcherMatchup(drawerGamePk, drawerPitcherId, drawerDate);

      return res.status(200).json({
        ...(payload ?? {
          gamePk: drawerGamePk,
          pitcher: null,
          opponent: {
            team: "",
            projectedLineup: [],
          },
        }),
        warnings: Array.isArray((payload as any)?.warnings)
          ? (payload as any).warnings
          : payload
            ? []
            : ["Pitcher matchup was not available for this game/date."],
      });
    } catch (error) {
      console.error("[api/mlb/matchup-matrix drawer]", error);

      return res.status(200).json({
        gamePk: drawerGamePk,
        pitcher: null,
        opponent: {
          team: "",
          projectedLineup: [],
        },
        warnings: [
          error instanceof Error ? error.message : "Pitcher matchup request failed.",
        ],
      });
    }
  }
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
