export type PublicSlipStatus =
  | "PENDING"
  | "LIVE"
  | "UPCOMING"
  | "WON"
  | "LOST"
  | "PUSH"
  | "VOID";

export type PublicParlayLeg = {
  publicId: string;
  playerName: string;
  marketLabel: string;
  teamLabel: string;
  oddsLabel: string;
  status: PublicSlipStatus;
  headshotUrl: string | null;
  resultLabel: string;
  /** Grading identity — preserved for honest live tracking and repair badges. */
  selection?: string;
  game?: string;
  gamePk?: string;
  gameId?: string | number | null;
  playerId?: string | number | null;
  marketCode?: string | null;
  statTarget?: string | number | null;
  comparator?: string | null;
  eventKey?: string | null;
};

export type PublicParlaySlip = {
  publicId: string;
  sourceId: string;
  title: string;
  status: PublicSlipStatus;
  statusLabel: string;
  summary: string;
  oddsLabel: string;
  syncedLabel: string;
  createdAt: string | null;
  isLiveLike: boolean;
  legs: PublicParlayLeg[];
  trustCommittedAt?: string | null;
  trustLockAt?: string | null;
  feedLockedAt?: string | null;
  trustAudience?: "private" | "public" | "subscriber" | null;
  trustLockWarningNotified?: boolean;
  trustLockedNotified?: boolean;
  lockReason?: "trust_ledger" | "feed_share" | null;
  backendPickId?: string | null;
  backendSyncState?: string | null;
};

export const cleanCustomerText = (value?: string | number | null): string =>
  String(value ?? "")
    .replace(/\|\|meta:.*$/i, "")
    .replace(/\\n/g, " ")
    .replace(/source=manual_builder\s*/gi, "")
    .replace(/source=manual\s*/gi, "")
    .replace(/clientRef=[^\s]+/gi, "")
    .replace(/Legacy pick saved before canonical grading identity existed; cannot be honestly graded\.?/gi, "Legacy unverified pick")
    .replace(/\bleg-\d+-[a-z0-9-]+\b/gi, "")
    .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

export const compactPublicTicketId = (id?: string | number | null): string => {
  const raw = String(id ?? "").trim().replace(/[^a-z0-9]/gi, "");
  return raw ? `VOUCH-${raw.slice(-6).toUpperCase()}` : "VOUCH";
};

export const normalizeSlipStatus = (status?: string | null): PublicSlipStatus => {
  const normalized = String(status ?? "PENDING").trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (normalized.includes("WON") || normalized === "WIN") return "WON";
  if (normalized.includes("LOST") || normalized === "LOSS") return "LOST";
  if (normalized.includes("PUSH")) return "PUSH";
  if (normalized.includes("VOID")) return "VOID";
  if (normalized.includes("LIVE")) return "LIVE";
  if (normalized.includes("UPCOMING") || normalized.includes("PRE_GAME")) return "UPCOMING";
  return "PENDING";
};

export const isLiveLikeStatus = (status?: string | null): boolean => {
  const normalized = normalizeSlipStatus(status);
  return normalized === "PENDING" || normalized === "LIVE" || normalized === "UPCOMING";
};

export const getPublicParlayTitle = (title?: string | null, status?: string | null): string => {
  const cleaned = cleanCustomerText(title);
  if (!cleaned || cleaned.toLowerCase() === "legacy unverified pick") {
    return normalizeSlipStatus(status) === "VOID" ? "Legacy Unverified Parlay" : "VouchEdge Parlay";
  }
  return cleaned;
};

export const getPublicLegSelection = (selection?: string | number | null): string =>
  cleanCustomerText(selection) || "Player prop";

export const getMlbHeadshotUrl = (playerId?: string | number | null): string | null => {
  const cleaned = String(playerId ?? "").replace(/\D/g, "");
  if (!cleaned) return null;
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best/v1/people/${cleaned}/headshot/67/current`;
};

export const getFallbackHeadshot = (name?: string | null): string =>
  `https://ui-avatars.com/api/?background=0f172a&color=94a3b8&name=${encodeURIComponent(cleanCustomerText(name) || "Player")}`;

export const publicStatusLabel = (status?: string | null): string => {
  const normalized = normalizeSlipStatus(status);
  if (normalized === "WON") return "Won";
  if (normalized === "LOST") return "Lost";
  if (normalized === "PUSH") return "Push";
  if (normalized === "VOID") return "Void";
  if (normalized === "LIVE") return "Live";
  if (normalized === "UPCOMING") return "Upcoming";
  return "Pending";
};

export const getLegResultLabel = (status?: string | null): string => {
  const normalized = normalizeSlipStatus(status);
  if (normalized === "WON") return "Hit";
  if (normalized === "LOST") return "Miss";
  if (normalized === "PUSH") return "Push";
  if (normalized === "VOID") return "Void";
  if (normalized === "LIVE") return "Live";
  return "Pending";
};

export const getOddsLabel = (odds?: string | number | null): string => {
  if (typeof odds === "number" && Number.isFinite(odds)) {
    return odds > 0 ? `+${odds}` : `${odds}`;
  }

  const cleaned = cleanCustomerText(odds);
  return cleaned || "—";
};

export const normalizePublicSlip = (raw: any): PublicParlaySlip => {
  const status = normalizeSlipStatus(raw?.status);
  const rawLegs = Array.isArray(raw?.legs) ? raw.legs : [];

  const legs = rawLegs.map((leg: any, index: number): PublicParlayLeg => {
    const playerName =
      cleanCustomerText(leg?.playerName) ||
      cleanCustomerText(leg?.player_name) ||
      getPublicLegSelection(leg?.selection).replace(/\s+Anytime\s+HR$/i, "") ||
      "Unknown Player";

    const marketLabel =
      cleanCustomerText(leg?.marketLabel) ||
      cleanCustomerText(leg?.market_name) ||
      cleanCustomerText(leg?.market) ||
      (String(leg?.selection ?? "").toLowerCase().includes("hr") ? "Anytime HR" : "Player prop");

    const legStatus = normalizeSlipStatus(leg?.status);
    const selection = getPublicLegSelection(leg?.selection) || `${playerName} ${marketLabel}`.trim();

    return {
      publicId: compactPublicTicketId(leg?.id ?? `${raw?.id ?? "leg"}-${index}`),
      playerName,
      marketLabel,
      teamLabel: cleanCustomerText(leg?.team || leg?.teamLabel) || "MLB",
      oddsLabel: getOddsLabel(leg?.odds),
      status: legStatus,
      headshotUrl: leg?.headshot || leg?.headshotUrl || getMlbHeadshotUrl(leg?.player_id || leg?.playerId),
      resultLabel: getLegResultLabel(legStatus),
      selection,
      game: cleanCustomerText(leg?.game) || undefined,
      gamePk: leg?.gamePk != null ? String(leg.gamePk) : leg?.game_pk != null ? String(leg.game_pk) : undefined,
      gameId: leg?.gameId ?? leg?.game_id ?? leg?.gamePk ?? leg?.game_pk ?? null,
      playerId: leg?.playerId ?? leg?.player_id ?? leg?.mlbPlayerId ?? null,
      marketCode: leg?.marketCode ?? leg?.market_code ?? null,
      statTarget: leg?.statTarget ?? leg?.stat_target ?? leg?.threshold ?? null,
      comparator: leg?.comparator ?? ">=",
      eventKey: leg?.eventKey ?? leg?.event_key ?? null,
    };
  });

  const hitCount = legs.filter((leg) => leg.status === "WON").length;
  const missCount = legs.filter((leg) => leg.status === "LOST").length;
  const summary =
    status === "LOST"
      ? `${hitCount}/${legs.length} legs hit${missCount ? ` • ${missCount} missed` : ""}`
      : status === "WON"
        ? `${hitCount}/${legs.length} legs hit`
        : `${legs.length} legs`;

  return {
    publicId: compactPublicTicketId(raw?.id),
    sourceId: String(raw?.id ?? raw?.sourceId ?? ""),
    title: getPublicParlayTitle(raw?.title || raw?.selection, status),
    status,
    statusLabel: publicStatusLabel(status),
    summary,
    oddsLabel: getOddsLabel(raw?.odds || raw?.totalOdds || raw?.decimalOdds),
    syncedLabel: raw?.synced ? "Synced" : raw?.syncStatus ? cleanCustomerText(raw.syncStatus) : "Local",
    createdAt: String(raw?.created_at ?? raw?.createdAt ?? raw?.savedAt ?? raw?.updated_at ?? raw?.updatedAt ?? "") || null,
    isLiveLike: isLiveLikeStatus(status),
    trustCommittedAt: raw?.trustCommittedAt ?? raw?.committed_at ?? null,
    trustLockAt: raw?.trustLockAt ?? raw?.trust_lock_at ?? null,
    feedLockedAt: raw?.feedLockedAt ?? raw?.locked_at ?? null,
    trustAudience: raw?.trustAudience ?? raw?.visibility ?? "private",
    trustLockWarningNotified: Boolean(raw?.trustLockWarningNotified),
    trustLockedNotified: Boolean(raw?.trustLockedNotified),
    lockReason: raw?.lockReason ?? raw?.lock_reason ?? null,
    backendPickId: raw?.backendPickId ?? raw?.backend_pick_id ?? null,
    backendSyncState: raw?.backendSyncState ?? raw?.backend_sync_state ?? null,
    legs,
  };
};
