import { createHash } from "node:crypto";
import type { ComposerOptionsResponse, PlayerOption } from "../../services/feed/composerOptionsService";

export const AI_PARLAY_SOURCE = "ai_parlay_engine";

export type AiParlayLegInput = {
  event_id?: string;
  eventId?: string;
  gamePk?: string;
  gameId?: string;
  market?: string;
  marketCode?: string;
  selection?: string;
  playerName?: string;
  playerId?: string | number;
  odds_decimal?: number | null;
  oddsDecimal?: number | null;
  odds?: number | string | null;
  team?: string;
  teamAbbr?: string;
  gameStartTime?: string;
  teamId?: string | number | null;
  statTarget?: string | number | null;
  comparator?: string | null;
  externalProvider?: string | null;
};

export function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ymdFromValue(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24);
}

function isAiPickRow(row: any): boolean {
  return row?.source === "ai_pick" || /source=AI|aiGenerated=true|aiSignature=/i.test(String(row?.explanation ?? ""));
}

export function enrichParlayRow(row: any, legs: any[]) {
  return {
    ...row,
    legs,
    title: row.title ?? String(row.explanation ?? row.market ?? "Saved Parlay").split("\n")[0],
    riskTier: row.risk_tier ?? "MEDIUM",
    source: isAiPickRow(row) ? "AI" : (row.source ?? "manual"),
    ai_generated: isAiPickRow(row),
    game_date: row.game_date ?? ymdFromValue(row.created_at),
  };
}

function aiLegFromPlayer(player: PlayerOption, game: ComposerOptionsResponse["games"][number], market = "HR"): AiParlayLegInput {
  return {
    event_id: game.gameId,
    gamePk: game.gameId,
    market,
    marketCode: market,
    selection: `${player.name} 1+ HR`,
    playerName: player.name,
    playerId: player.id,
    odds_decimal: null,
    teamAbbr: player.teamAbbr,
    gameStartTime: game.startTime ?? undefined,
  };
}

export function buildGeneratedAiParlays(options: ComposerOptionsResponse) {
  const warnings = [...options.warnings];
  const starterCandidates = options.games.flatMap((game) => {
    const players = [...game.awayTeam.players, ...game.homeTeam.players]
      .filter((player) => player.isStarter && player.position !== "P")
      .sort((a, b) => (a.battingOrder ?? 99) - (b.battingOrder ?? 99))
      .slice(0, 2);
    return players.map((player) => ({ player, game }));
  });

  if (options.games.length === 0) warnings.push("no games today");
  if (starterCandidates.length < 2) warnings.push("not enough confirmed starters for AI parlays");

  const recipes = [
    { legCount: 2, riskTier: "LOW", confidence: 62, label: "Safer" },
    { legCount: 3, riskTier: "MEDIUM", confidence: 48, label: "Balanced" },
    { legCount: 4, riskTier: "HIGH", confidence: 34, label: "Longshot" },
  ];

  const parlays = recipes.flatMap((recipe, recipeIndex) => {
    const picks = starterCandidates.slice(recipeIndex, recipeIndex + recipe.legCount);
    if (picks.length < recipe.legCount) return [];
    const legs = picks.map(({ player, game }) => aiLegFromPlayer(player, game));
    return [{
      id: `ai-${options.date}-${recipe.legCount}-${stableHash(legs)}`,
      title: `AI ${recipe.label} ${recipe.legCount}-Leg HR Parlay`,
      legs,
      riskTier: recipe.riskTier,
      confidence: recipe.confidence,
      source: "AI",
      status: "pending",
      created_at: new Date().toISOString(),
      game_date: options.date,
      warnings: legs.some((leg) => leg.odds_decimal == null) ? ["missing odds"] : [],
    }];
  });

  return { parlays, warnings: [...new Set(warnings)] };
}
