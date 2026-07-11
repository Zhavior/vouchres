import {
  cleanCustomerText,
  compactPublicTicketId,
  getFallbackHeadshot,
  getLegResultLabel,
  getMlbHeadshotUrl,
  getOddsLabel,
  getPublicLegSelection,
  getPublicParlayTitle,
  isLiveLikeStatus,
  normalizeSlipStatus,
  publicStatusLabel,
  type PublicParlaySlip,
} from "../../lib/parlayDisplay";
import { assessClientParlayIdentity } from "../../lib/parlayIdentity";
import { deriveLegProgress, deriveSlipProgress } from "../../lib/parlayLegProgress";
import { resolveLocalSlipId, resolvePublicProofPickId } from "../../lib/parlays/parlayProofLinks";
import { repairDraftLikeLegRecords } from "../../lib/parlays/repairSavedParlay";
import type { LiveGameRef } from "../../lib/parlays/parlayLegValidator";
import type { DraftParlayLeg } from "../../stores/parlayCommandStore";
import type { Leg, Parlay } from "../../types";
import type { SmartParlayLeg, SmartParlaySlip, SmartParlayStatus } from "./smartParlayTypes";

function toSmartStatus(raw?: string | null): SmartParlayStatus {
  const normalized = normalizeSlipStatus(raw);
  if (normalized === "WON") return "won";
  if (normalized === "LOST") return "lost";
  if (normalized === "PUSH") return "push";
  if (normalized === "VOID") return "void";
  if (normalized === "LIVE") return "live";
  if (normalized === "UPCOMING") return "upcoming";
  return "pending";
}

function legRecord(leg: Record<string, unknown>): Record<string, unknown> {
  return leg;
}

function projectLegFromRecord(raw: Record<string, unknown>, index: number): SmartParlayLeg {
  const playerName =
    cleanCustomerText(raw.playerName as string) ||
    cleanCustomerText(raw.player_name as string) ||
    getPublicLegSelection(raw.selection as string).replace(/\s+Anytime\s+HR$/i, "") ||
    "Unknown Player";

  const marketLabel =
    cleanCustomerText(raw.marketLabel as string) ||
    cleanCustomerText(raw.market_name as string) ||
    cleanCustomerText(raw.market as string) ||
    (String(raw.selection ?? "").toLowerCase().includes("hr") ? "Anytime HR" : "Player prop");

  const selection =
    getPublicLegSelection(raw.selection as string) || `${playerName} ${marketLabel}`.trim();

  const status = toSmartStatus(String(raw.status ?? "pending"));
  const playerId = raw.playerId ?? raw.player_id ?? raw.mlbPlayerId ?? null;
  const marketCode = raw.marketCode ?? raw.market_code ?? null;
  const statTarget = raw.statTarget ?? raw.stat_target ?? raw.threshold ?? null;
  const comparator = raw.comparator ?? ">=";
  const gamePk =
    raw.gamePk != null
      ? String(raw.gamePk)
      : raw.game_pk != null
        ? String(raw.game_pk)
        : raw.eventId != null
          ? String(raw.eventId)
          : raw.event_id != null
            ? String(raw.event_id)
            : undefined;

  const identityRecord = {
    ...raw,
    playerId,
    marketCode,
    statTarget,
    comparator,
    gamePk,
    game_pk: gamePk,
    eventId: gamePk,
    event_id: gamePk,
  };

  const identityComplete = assessClientParlayIdentity([identityRecord]).complete;

  const progress = deriveLegProgress({
    status: String(raw.status ?? "PENDING"),
    marketCode: marketCode != null ? String(marketCode) : undefined,
    market: String(raw.market ?? marketLabel),
    selection,
    statTarget: statTarget != null ? Number(statTarget) : undefined,
    threshold: statTarget != null ? Number(statTarget) : undefined,
    actual: raw.actual != null ? Number(raw.actual) : null,
  });

  return {
    id: String(raw.id ?? `leg-${index}`),
    playerName,
    marketLabel,
    selection,
    teamLabel: cleanCustomerText(raw.teamLabel as string) || cleanCustomerText(raw.team as string) || undefined,
    gameLabel: cleanCustomerText(raw.game as string) || cleanCustomerText(raw.gameLabel as string) || undefined,
    oddsLabel: getOddsLabel(raw.odds as string | number | null),
    headshotUrl:
      (raw.headshotUrl as string | null) ??
      (raw.headshot as string | null) ??
      getMlbHeadshotUrl(playerId) ??
      getFallbackHeadshot(playerName),
    status,
    statusLabel: publicStatusLabel(status),
    resultLabel: getLegResultLabel(status),
    sport: String(raw.sport ?? "MLB"),
    gamePk,
    gameId: raw.gameId != null ? String(raw.gameId) : gamePk,
    playerId: playerId as string | number | null,
    marketCode: marketCode != null ? String(marketCode) : null,
    statTarget,
    comparator: comparator != null ? String(comparator) : null,
    eventKey: raw.eventKey != null ? String(raw.eventKey) : raw.event_key != null ? String(raw.event_key) : null,
    actual: raw.actual != null ? Number(raw.actual) : null,
    identityComplete,
    progress,
  };
}

function buildSlipSummary(status: SmartParlayStatus, legs: SmartParlayLeg[]): string {
  const hitCount = legs.filter((leg) => leg.status === "won").length;
  const missCount = legs.filter((leg) => leg.status === "lost").length;
  if (status === "lost") {
    return `${hitCount}/${legs.length} legs hit${missCount ? ` • ${missCount} missed` : ""}`;
  }
  if (status === "won") return `${hitCount}/${legs.length} legs hit`;
  return `${legs.length} leg${legs.length === 1 ? "" : "s"}`;
}

function projectSlipShell(input: {
  id: string;
  sourceId: string;
  title: string;
  status: SmartParlayStatus;
  oddsLabel: string;
  legs: SmartParlayLeg[];
  trustCommittedAt?: string | null;
  trustLockAt?: string | null;
  feedLockedAt?: string | null;
  trustAudience?: "private" | "public" | "subscriber" | null;
  lockReason?: "trust_ledger" | "feed_share" | null;
  backendPickId?: string | null;
  backendSyncState?: string | null;
  createdAt?: string | null;
}): SmartParlaySlip {
  const identity = assessClientParlayIdentity(
    input.legs.map((leg) => ({
      playerId: leg.playerId,
      marketCode: leg.marketCode,
      statTarget: leg.statTarget,
      comparator: leg.comparator,
      gamePk: leg.gamePk,
      gameId: leg.gameId,
      eventKey: leg.eventKey,
    })),
  );

  const slipProgress = deriveSlipProgress(
    input.legs.map((leg) => ({
      status: leg.status,
      marketCode: leg.marketCode,
      market: leg.marketLabel,
      selection: leg.selection,
      statTarget: leg.statTarget,
      actual: leg.actual,
    })),
  );

  const proofPickId =
    resolvePublicProofPickId({
      backendPickId: input.backendPickId,
      sourceId: input.sourceId,
      id: input.id,
    }) ?? resolveLocalSlipId({ sourceId: input.sourceId, id: input.id });

  return {
    id: input.id,
    sourceId: input.sourceId,
    publicId: compactPublicTicketId(input.id),
    title: getPublicParlayTitle(input.title, input.status),
    status: input.status,
    statusLabel: publicStatusLabel(input.status),
    summary: buildSlipSummary(input.status, input.legs),
    oddsLabel: input.oddsLabel,
    legCount: input.legs.length,
    legs: input.legs,
    trustCommittedAt: input.trustCommittedAt,
    trustLockAt: input.trustLockAt,
    feedLockedAt: input.feedLockedAt,
    trustAudience: input.trustAudience,
    lockReason: input.lockReason,
    backendPickId: input.backendPickId,
    backendSyncState: input.backendSyncState,
    createdAt: input.createdAt,
    isLiveLike: isLiveLikeStatus(input.status),
    identity,
    slipProgress,
    proofPickId,
  };
}

export function projectSmartParlayFromRecords(
  raw: Record<string, unknown>,
  liveGames: LiveGameRef[] = [],
): SmartParlaySlip {
  const rawLegs = Array.isArray(raw.legs) ? raw.legs : [];
  const legRecords = rawLegs.map((leg) => legRecord(leg as Record<string, unknown>));
  const { legs: repairedRecords } = repairDraftLikeLegRecords(legRecords, liveGames);
  const legs = repairedRecords.map((leg, index) => projectLegFromRecord(leg, index));

  const id = String(raw.id ?? raw.sourceId ?? "");
  const status = toSmartStatus(String(raw.status ?? "pending"));

  return projectSlipShell({
    id,
    sourceId: String(raw.sourceId ?? raw.id ?? id),
    title: String(raw.title ?? "Saved Parlay"),
    status,
    oddsLabel: getOddsLabel(raw.totalOdds as string | number | null ?? raw.odds as string | number | null),
    legs,
    trustCommittedAt: (raw.trustCommittedAt ?? raw.committed_at) as string | null | undefined,
    trustLockAt: (raw.trustLockAt ?? raw.trust_lock_at) as string | null | undefined,
    feedLockedAt: (raw.feedLockedAt ?? raw.locked_at) as string | null | undefined,
    trustAudience: (raw.trustAudience ?? raw.visibility) as SmartParlaySlip["trustAudience"],
    lockReason: raw.lockReason as SmartParlaySlip["lockReason"],
    backendPickId: (raw.backendPickId ?? raw.backend_pick_id) as string | null | undefined,
    backendSyncState: (raw.backendSyncState ?? raw.backend_sync_state) as string | null | undefined,
    createdAt: String(raw.createdAt ?? raw.created_at ?? "") || null,
  });
}

export function projectSmartParlayFromParlay(parlay: Parlay, liveGames: LiveGameRef[] = []): SmartParlaySlip {
  return projectSmartParlayFromRecords(parlay as unknown as Record<string, unknown>, liveGames);
}

export function projectSmartParlayFromPublic(
  slip: PublicParlaySlip,
  liveGames: LiveGameRef[] = [],
): SmartParlaySlip {
  return projectSmartParlayFromRecords(slip as unknown as Record<string, unknown>, liveGames);
}

export function projectSmartParlayFromDraft(
  draftLegs: DraftParlayLeg[],
  meta: { title?: string; id?: string } = {},
): SmartParlaySlip {
  const legs = draftLegs.map((leg, index) =>
    projectLegFromRecord(leg as unknown as Record<string, unknown>, index),
  );

  const id = meta.id ?? `draft-${Date.now()}`;
  return projectSlipShell({
    id,
    sourceId: id,
    title: meta.title ?? `${legs.length}-Leg Parlay`,
    status: "pending",
    oddsLabel: "—",
    legs,
  });
}

export function smartParlayLegToLeg(leg: SmartParlayLeg): Leg {
  return {
    id: leg.id,
    sport: leg.sport,
    game: leg.gameLabel ?? "",
    market: leg.marketLabel,
    selection: leg.selection,
    odds: null,
    status: leg.status === "won" ? "WON" : leg.status === "lost" ? "LOST" : leg.status === "void" ? "VOID" : "PENDING",
    gamePk: leg.gamePk,
    gameId: leg.gameId,
    playerId: leg.playerId,
    marketCode: leg.marketCode ?? undefined,
    statTarget: leg.statTarget != null ? Number(leg.statTarget) : undefined,
    comparator: leg.comparator ?? undefined,
    eventKey: leg.eventKey ?? undefined,
    actual: leg.actual,
    headshotUrl: leg.headshotUrl,
  };
}
