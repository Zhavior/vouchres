import { createHash } from "node:crypto";

export interface ProofHashLegInput {
  leg_index?: number | null;
  event_key?: string | null;
  market_code?: string | null;
  player_id?: string | number | null;
  stat_target?: number | null;
  comparator?: string | null;
  selection?: string | null;
  odds_decimal?: number | null;
}

export interface ProofHashPickInput {
  id: string;
  created_at?: string | null;
  locked_at?: string | null;
  odds_decimal?: number | null;
  stake_units?: number | null;
  legs: ProofHashLegInput[];
}

function stableLeg(leg: ProofHashLegInput, index: number) {
  return {
    leg_index: Number(leg.leg_index ?? index),
    event_key: String(leg.event_key ?? "").trim(),
    market_code: String(leg.market_code ?? "").trim(),
    player_id: String(leg.player_id ?? "").trim(),
    stat_target: leg.stat_target != null ? Number(leg.stat_target) : null,
    comparator: String(leg.comparator ?? "").trim(),
    selection: String(leg.selection ?? "").trim(),
    odds_decimal: leg.odds_decimal != null ? Number(leg.odds_decimal) : null,
  };
}

export function buildParlayProofPayload(input: ProofHashPickInput) {
  return {
    id: String(input.id),
    created_at: input.created_at ?? null,
    locked_at: input.locked_at ?? null,
    odds_decimal: input.odds_decimal != null ? Number(input.odds_decimal) : null,
    stake_units: input.stake_units != null ? Number(input.stake_units) : null,
    legs: input.legs.map((leg, index) => stableLeg(leg, index)),
  };
}

export function computeParlayProofHash(input: ProofHashPickInput): string {
  const canonical = JSON.stringify(buildParlayProofPayload(input));
  return createHash("sha256").update(canonical).digest("hex");
}
