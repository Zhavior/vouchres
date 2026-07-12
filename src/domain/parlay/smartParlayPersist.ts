import {
  buildSaveParlayPayload,
  normalizeParlaySlip,
  type CanonicalParlaySlip,
  type ParlaySource,
} from "../../lib/parlays/parlayBridge";
import type { DraftParlayLeg } from "../../stores/parlayCommandStore";
import type { Leg, Parlay } from "../../types";

function legStatusToUi(status?: string | null): Parlay["status"] {
  const normalized = String(status ?? "pending").toLowerCase();
  if (normalized === "won" || normalized === "win") return "WON";
  if (normalized === "lost" || normalized === "loss") return "LOST";
  if (normalized === "void" || normalized === "push") return "VOID";
  return "PENDING";
}

export function canonicalToParlay(slip: CanonicalParlaySlip): Parlay {
  const meta = slip.metadata ?? {};
  const legs: Leg[] = slip.legs.map((leg) => ({
    id: leg.id,
    sport: leg.sport,
    game: leg.gameLabel ?? "",
    market: leg.market,
    selection: leg.selection,
    odds: typeof leg.odds === "number" ? leg.odds : leg.odds != null ? Number(leg.odds) || null : null,
    status: legStatusToUi(leg.status),
    gamePk: leg.gamePk ?? leg.gameId,
    gameId: leg.gameId ?? leg.gamePk,
    teamId: leg.teamId,
    playerId: leg.playerId,
    marketCode: leg.marketCode,
    statTarget: leg.statTarget != null ? Number(leg.statTarget) : undefined,
    threshold: leg.statTarget != null ? Number(leg.statTarget) : undefined,
    comparator: leg.comparator,
    eventKey: leg.eventKey,
    popularityKey: leg.popularityKey,
    externalProvider: leg.externalProvider,
    actual: leg.actual != null ? Number(leg.actual) : null,
    gameStartTime: leg.gameStartTime,
  }));

  return {
    id: slip.id,
    clientRef: slip.clientRef,
    title: slip.title,
    legs,
    status: legStatusToUi(slip.status),
    mode: slip.mode,
    createdAt: slip.createdAt,
    totalOdds: String(meta.totalOdds ?? ""),
    oddsValue: Number(meta.oddsValue ?? 0),
    riskTier: (meta.riskTier as Parlay["riskTier"]) ?? "LOW",
    aiGenerated: Boolean(meta.aiGenerated),
    backendPickId: slip.backendPickId,
    wagerAmount: slip.wagerAmount,
  };
}

export function parlayToCanonical(
  parlay: Parlay | Record<string, unknown>,
  source: ParlaySource = "manual_builder",
): CanonicalParlaySlip {
  return normalizeParlaySlip(
    {
      ...parlay,
      clientRef: (parlay as Parlay).clientRef ?? (parlay as Parlay).id,
      source: (parlay as Parlay).aiGenerated ? "ai_pick" : source,
    },
    (parlay as Parlay).aiGenerated ? "ai_pick" : source,
  );
}

export function draftLegsToParlay(
  input: {
    id?: string;
    title: string;
    legs: DraftParlayLeg[];
    mode?: "PRACTICE" | "REAL";
    totalOdds?: string;
    oddsValue?: number;
    riskTier?: Parlay["riskTier"];
    aiGenerated?: boolean;
    status?: Parlay["status"];
    createdAt?: string;
  },
): Parlay {
  const canonical = normalizeParlaySlip(
    {
      id: input.id ?? `parlay-${Date.now()}`,
      title: input.title,
      mode: input.mode ?? "PRACTICE",
      status: input.status ?? "PENDING",
      createdAt: input.createdAt ?? new Date().toISOString(),
      aiGenerated: input.aiGenerated,
      totalOdds: input.totalOdds,
      oddsValue: input.oddsValue,
      riskTier: input.riskTier,
      legs: input.legs,
    },
    input.aiGenerated ? "ai_pick" : "manual_builder",
  );
  return canonicalToParlay(canonical);
}

export function buildBackendSavePayloadFromParlay(parlay: Parlay) {
  return buildSaveParlayPayload(parlayToCanonical(parlay));
}
