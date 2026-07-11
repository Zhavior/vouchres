import { normalizePlayerId } from "../mlbHeadshot";
import type { Leg, MLBPlayer } from "../../types";
import type { ResearchProp } from "../../stores/appCommandStore";
import {
  flattenTierLegs,
  type ParlayMarketTier,
} from "./parlayMarketCatalog";
import type { DraftParlayLeg } from "../../stores/parlayCommandStore";

export type ParlayLegBuildContext = {
  player: MLBPlayer;
  propHint?: ResearchProp;
  liveGames: Array<{ homeTeam: string; awayTeam: string; status: string; gamePk?: string | number }>;
};

function buildEventKey(parts: {
  sport: string;
  gamePk?: string;
  playerId?: string | number | null;
  marketCode?: string | null;
  statTarget?: string | number | null;
  comparator?: string | null;
}) {
  const gamePart = parts.gamePk ?? "GAME_TBD";
  const playerPart = parts.playerId ?? "PLAYER_TBD";
  const marketPart = parts.marketCode ?? "MARKET_TBD";
  const targetPart = parts.statTarget ?? "TARGET_TBD";
  const comparatorPart = String(parts.comparator ?? ">=").replace(/[^a-zA-Z0-9]+/g, "");
  return `${parts.sport}_${gamePart}_${playerPart}_${marketPart}_${targetPart}_${comparatorPart}`;
}

export function buildLegsFromTier(
  tier: ParlayMarketTier,
  ctx: ParlayLegBuildContext,
): { leg: Leg; draft: DraftParlayLeg }[] {
  const tiers = flattenTierLegs(tier);
  const player = ctx.player;
  const playerTeam = player.team ? player.team.toLowerCase() : "";
  const matchedGame = ctx.liveGames.find(
    (g) =>
      g.homeTeam.toLowerCase() === playerTeam ||
      g.awayTeam.toLowerCase() === playerTeam,
  );

  const gamePk =
    ctx.propHint?.gamePk != null
      ? String(ctx.propHint.gamePk)
      : matchedGame?.gamePk != null
        ? String(matchedGame.gamePk)
        : undefined;

  const playerId = normalizePlayerId(ctx.propHint?.playerId ?? player.id);
  const playerName = player.name ?? "Player";
  const teamId = (player as { teamId?: string | number | null }).teamId ?? null;

  return tiers.map((t, index) => {
    const selection = t.selection(playerName);
    const eventKey = buildEventKey({
      sport: "MLB",
      gamePk,
      playerId,
      marketCode: t.marketCode,
      statTarget: t.statTarget,
      comparator: t.comparator,
    });
    const id = `leg-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;

    const leg: Leg = {
      id,
      sport: "MLB",
      game: matchedGame
        ? `${matchedGame.awayTeam} @ ${matchedGame.homeTeam}`
        : `${player.team ?? "MLB"} Live Target`,
      market: t.marketLabel,
      selection,
      odds: ctx.propHint?.odds ?? null,
      status: "PENDING",
      gamePk,
      marketCode: t.marketCode,
      statTarget: t.statTarget,
      threshold: t.statTarget,
      comparator: t.comparator,
      eventKey,
      popularityKey: `MLB_${playerId ?? "PLAYER"}_${t.marketCode}_${t.statTarget}`,
      externalProvider: "parlayos_picker",
      playerId,
      teamId,
    };

    const draft: DraftParlayLeg = {
      id,
      source: "manual",
      sport: leg.sport,
      game: leg.game,
      selection: leg.selection,
      playerName,
      playerId: leg.playerId,
      teamId,
      teamLabel: player.team ?? null,
      gamePk: leg.gamePk,
      marketCode: leg.marketCode,
      marketLabel: leg.market,
      statTarget: leg.statTarget,
      comparator: leg.comparator,
      odds: leg.odds ?? undefined,
      externalProvider: leg.externalProvider,
      eventKey: leg.eventKey,
      tags: ["#ParlayOS", `#${t.shortLabel.replace(/\s+/g, "")}`],
    };

    return { leg, draft };
  });
}

export function vouchToPlayer(vouch: {
  playerOrTeam?: string;
  sport?: string;
  gameName?: string;
}): MLBPlayer {
  return {
    id: "0",
    name: vouch.playerOrTeam ?? "Player",
    team: vouch.gameName?.split("@")[0]?.trim() ?? "MLB",
    position: "",
    number: "",
    headshot: "",
    injuryStatus: "",
    injurySeverity: "NONE" as const,
    injuryNotes: "",
    batterScore: 0,
    seasonStats: { avg: "0", hr: "0", rbi: "0", ops: "0" },
    gameLogs: [],
    propositions: [],
    bats: "R" as const,
    throws: "R" as const,
    height: "",
    weight: "",
    birthdate: "",
    advanced: {} as MLBPlayer["advanced"],
    splits: {
      vLHP: { avg: "0", obp: "0", slg: "0", ops: "0" },
      vRHP: { avg: "0", obp: "0", slg: "0", ops: "0" },
      home: { avg: "0", obp: "0", slg: "0", ops: "0" },
      away: { avg: "0", obp: "0", slg: "0", ops: "0" },
      last10: { avg: "0", obp: "0", slg: "0", ops: "0" },
    },
    scoutingReport: {
      powerText: "",
      contactText: "",
      disciplineText: "",
      overallScouting: "",
      hotZones: [],
      riskFactor: "LOW" as const,
    },
  };
}
