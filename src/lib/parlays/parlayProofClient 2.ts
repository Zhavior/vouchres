import type { Parlay } from "../../types";
import { isBackendProofPickId } from "./parlayProofLinks";

export type ClientParlayProof = {
  id: string;
  sport: string;
  selection: string;
  explanation?: string | null;
  odds_decimal?: number | null;
  status: string;
  created_at: string;
  locked_at?: string | null;
  proof_hash?: string | null;
  ots_stamped_at?: string | null;
  has_ots_proof?: boolean;
  lock_reason?: string | null;
  committed_at?: string | null;
  legs: Array<Record<string, unknown>>;
  author?: { display_name?: string; handle?: string; username?: string } | null;
  trust_events?: Array<{ label: string; created_at: string }>;
  proof_url?: string;
  proofScope: "public" | "owner" | "local";
  proofNote?: string | null;
};

function mapLegRecord(leg: Record<string, unknown>, index: number): Record<string, unknown> {
  return {
    id: leg.id ?? `leg-${index}`,
    sport: leg.sport ?? "MLB",
    selection: leg.selection ?? leg.player_name ?? leg.playerName ?? "Prop",
    market: leg.market ?? leg.market_label ?? leg.marketLabel ?? "Prop",
    market_label: leg.market_label ?? leg.marketLabel ?? leg.market,
    game_label: leg.game_label ?? leg.game ?? "",
    game_id: leg.game_id ?? leg.gamePk ?? leg.game_pk,
    game_pk: leg.game_pk ?? leg.gamePk ?? leg.game_id,
    player_id: leg.player_id ?? leg.playerId,
    market_code: leg.market_code ?? leg.marketCode,
    stat_target: leg.stat_target ?? leg.statTarget ?? leg.threshold,
    comparator: leg.comparator ?? ">=",
    odds_decimal: leg.odds_decimal ?? leg.odds,
    status: leg.status ?? "PENDING",
    actual_value: leg.actual_value ?? leg.actual,
  };
}

export function buildLocalParlayProof(slip: Parlay): ClientParlayProof {
  const synced = slip.backendSyncState === "synced" && isBackendProofPickId(slip.backendPickId);
  return {
    id: slip.backendPickId ?? slip.id,
    sport: "mlb",
    selection: slip.title,
    explanation: slip.title,
    odds_decimal: Number.isFinite(slip.oddsValue) ? slip.oddsValue : null,
    status: String(slip.status ?? "PENDING").toLowerCase(),
    created_at: slip.createdAt,
    locked_at: slip.feedLockedAt ?? null,
    lock_reason: slip.lockReason ?? null,
    committed_at: slip.trustCommittedAt ?? null,
    proof_hash: null,
    has_ots_proof: false,
    legs: (slip.legs ?? []).map((leg, index) => mapLegRecord(leg as unknown as Record<string, unknown>, index)),
    proofScope: synced ? "owner" : "local",
    proofNote: synced
      ? "Saved to your account. Public permalink is only available after a public ledger lock."
      : "Local slip record on this device. Sign in and save to anchor proof to your account.",
  };
}

export function mapOwnedParlayToProof(parlay: Record<string, unknown>): ClientParlayProof {
  const legs = Array.isArray(parlay.legs) ? parlay.legs : [];
  return {
    id: String(parlay.id ?? ""),
    sport: String(parlay.sport ?? "mlb"),
    selection: String(parlay.explanation ?? parlay.title ?? parlay.market ?? "Saved parlay"),
    explanation: parlay.explanation != null ? String(parlay.explanation) : null,
    odds_decimal: parlay.odds_decimal != null ? Number(parlay.odds_decimal) : null,
    status: String(parlay.status ?? "pending"),
    created_at: String(parlay.created_at ?? new Date().toISOString()),
    locked_at: parlay.locked_at != null ? String(parlay.locked_at) : null,
    proof_hash: parlay.proof_hash != null ? String(parlay.proof_hash) : null,
    ots_stamped_at: parlay.ots_stamped_at != null ? String(parlay.ots_stamped_at) : null,
    has_ots_proof: Boolean(parlay.ots_proof),
    lock_reason: parlay.lock_reason != null ? String(parlay.lock_reason) : null,
    committed_at: parlay.committed_at != null ? String(parlay.committed_at) : null,
    legs: legs.map((leg, index) => mapLegRecord(leg as Record<string, unknown>, index)),
    proofScope: "owner",
    proofNote: parlay.visibility === "public"
      ? null
      : "Private account record. Share to public ledger for a public proof permalink.",
  };
}
