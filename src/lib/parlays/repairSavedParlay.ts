import type { Leg, Parlay } from "../../types";
import type { DraftParlayLeg } from "../../stores/parlayCommandStore";
import type { LiveGameRef } from "./parlayLegValidator";
import { repairDraftLegIdentity, repairDraftLegsIdentity } from "./repairDraftLegIdentity";

function legToDraftShape(leg: Leg): DraftParlayLeg {
  const extended = leg as Leg & {
    teamLabel?: string | null;
    team?: string | null;
    playerName?: string | null;
    marketLabel?: string | null;
  };

  return {
    id: leg.id,
    source: "manual",
    sport: leg.sport,
    selection: leg.selection,
    playerName: extended.playerName ?? leg.selection.split(" ")[0],
    playerId: leg.playerId ?? leg.mlbPlayerId ?? undefined,
    teamId: leg.teamId ?? undefined,
    teamLabel: extended.teamLabel ?? extended.team ?? undefined,
    gameId: leg.gameId ?? leg.gamePk ?? undefined,
    game: leg.game,
    gamePk: leg.gamePk,
    marketCode: leg.marketCode,
    marketLabel: extended.marketLabel ?? leg.market,
    statTarget: leg.statTarget ?? leg.threshold,
    comparator: leg.comparator,
    odds: leg.odds ?? undefined,
    eventKey: leg.eventKey,
    externalProvider: leg.externalProvider,
  };
}

function draftToLeg(base: Leg, draft: DraftParlayLeg): Leg {
  return {
    ...base,
    gamePk: draft.gamePk ?? base.gamePk,
    gameId: draft.gameId != null ? String(draft.gameId) : base.gameId,
    playerId: draft.playerId ?? base.playerId,
    teamId: draft.teamId ?? base.teamId,
    marketCode: draft.marketCode ?? base.marketCode,
    market: draft.marketLabel ?? base.market,
    statTarget: typeof draft.statTarget === "number" ? draft.statTarget : Number(draft.statTarget) || base.statTarget,
    threshold: typeof draft.statTarget === "number" ? draft.statTarget : Number(draft.statTarget) || base.threshold,
    comparator: (draft.comparator as Leg["comparator"]) ?? base.comparator,
    eventKey: draft.eventKey ?? base.eventKey,
    game: typeof draft.game === "string" ? draft.game : base.game,
  };
}

export function repairSavedParlayLeg(leg: Leg, liveGames: LiveGameRef[] = []): { leg: Leg; changed: boolean } {
  const { leg: draft, changed } = repairDraftLegIdentity(legToDraftShape(leg), liveGames);
  return { leg: draftToLeg(leg, draft), changed };
}

export function repairSavedParlay(parlay: Parlay, liveGames: LiveGameRef[] = []): { parlay: Parlay; changed: boolean } {
  let changed = false;
  const legs = (parlay.legs || []).map((leg) => {
    const result = repairSavedParlayLeg(leg, liveGames);
    if (result.changed) changed = true;
    return result.leg;
  });
  return { parlay: { ...parlay, legs }, changed };
}

export function repairAllSavedParlays(
  parlays: Parlay[],
  liveGames: LiveGameRef[] = [],
): { parlays: Parlay[]; changed: boolean } {
  let changed = false;
  const next = parlays.map((parlay) => {
    const result = repairSavedParlay(parlay, liveGames);
    if (result.changed) changed = true;
    return result.parlay;
  });
  return { parlays: next, changed };
}

export function repairDraftLikeLegRecords(
  legs: Record<string, unknown>[],
  liveGames: LiveGameRef[] = [],
): { legs: Record<string, unknown>[]; changed: boolean } {
  const drafts = legs.map((leg) => ({
    id: String(leg.id ?? "leg"),
    source: "manual" as const,
    sport: String(leg.sport ?? "MLB"),
    selection: String(leg.selection ?? leg.playerName ?? "Player prop"),
    playerName: leg.playerName != null ? String(leg.playerName) : undefined,
    playerId: leg.playerId ?? leg.player_id,
    teamId: leg.teamId ?? leg.team_id,
    teamLabel: leg.teamLabel ?? leg.team ?? undefined,
    gameId: leg.gameId ?? leg.game_id,
    game: leg.game,
    gamePk: leg.gamePk ?? leg.game_pk,
    marketCode: leg.marketCode ?? leg.market_code,
    marketLabel: leg.marketLabel ?? leg.market,
    statTarget: leg.statTarget ?? leg.stat_target ?? leg.threshold,
    comparator: leg.comparator,
    odds: leg.odds,
    eventKey: leg.eventKey ?? leg.event_key,
  })) as DraftParlayLeg[];

  const { legs: repaired, changed } = repairDraftLegsIdentity(drafts, liveGames);
  return {
    legs: repaired.map((leg) => ({ ...leg } as Record<string, unknown>)),
    changed,
  };
}
