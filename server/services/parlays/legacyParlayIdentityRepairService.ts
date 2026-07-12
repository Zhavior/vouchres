const REQUIRED_IDENTITY_FIELDS = [
  "event_key",
  "market_code",
  "player_id",
  "stat_target",
  "comparator",
] as const;

export type IdentityRepairReason =
  | "missing_game_id"
  | "missing_player_id"
  | "unsupported_market"
  | "missing_stat_target"
  | "unsupported_comparator";

function cleanKey(value: unknown): string {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

function comparatorKey(comparator: string): "GTE" | "LTE" | "EQ" | null {
  if (comparator === ">=") return "GTE";
  if (comparator === "<=") return "LTE";
  if (comparator === "=" || comparator === "==") return "EQ";
  return null;
}

function playerIdFromSelectionMetadata(selection: unknown): string {
  const match = String(selection ?? "").match(/\|\|meta:\s*(\{.*\})\s*$/);
  if (!match) return "";
  try {
    const metadata = JSON.parse(match[1]);
    return cleanKey(metadata.p ?? metadata.playerId ?? metadata.player_id);
  } catch {
    return "";
  }
}

function numericGameId(row: Record<string, any>): string {
  const candidates = [
    row.game_id,
    row.event_id,
    row.picks?.event_id,
    row.picks?.metadata?.game_id,
    row.picks?.metadata?.gameId,
    row.picks?.metadata?.gamePk,
  ];
  return candidates.map((value) => String(value ?? "").trim()).find((value) => /^\d{5,10}$/.test(value)) ?? "";
}

function canonicalMarketCode(row: Record<string, any>): string | null {
  const existing = cleanKey(row.market_code);
  if (existing) return existing;

  const raw = String(row.market ?? row.selection ?? "").trim().toUpperCase();
  const compact = raw.replace(/[^A-Z0-9]/g, "");
  if (
    raw === "HR" ||
    raw.includes("HOME RUN") ||
    raw.includes("HOMER") ||
    raw.includes("ANYTIME HR") ||
    raw.includes("1+ HR") ||
    compact.includes("ANYTIMEHR") ||
    compact.includes("HOMERUN")
  ) {
    return "ANYTIME_HR";
  }
  return null;
}

export function missingCanonicalIdentityFields(row: Record<string, unknown>): string[] {
  return REQUIRED_IDENTITY_FIELDS.filter((field) => {
    if (field === "stat_target") return !Number.isFinite(Number(row[field]));
    return String(row[field] ?? "").trim() === "";
  });
}

export function singleCanonicalGameId(legs: Array<Record<string, unknown>>): string | null {
  if (legs.length === 0) return null;
  const gameIds = new Set(
    legs.map((leg) => String(leg.game_id ?? "").trim()).filter((value) => /^\d{5,10}$/.test(value)),
  );
  return gameIds.size === 1 && legs.every((leg) => gameIds.has(String(leg.game_id ?? "").trim()))
    ? [...gameIds][0]
    : null;
}

export function planLegacyLegIdentityRepair(
  row: Record<string, any>,
  externalProvider: string,
): { repairable: true; patch: Record<string, unknown> } | { repairable: false; reasons: IdentityRepairReason[] } {
  const sport = cleanKey(row.sport || "MLB") || "MLB";
  const gameId = numericGameId(row);
  const playerId = cleanKey(row.player_id) || playerIdFromSelectionMetadata(row.selection);
  const marketCode = canonicalMarketCode(row);
  const rawTarget = row.stat_target ?? row.threshold ?? row.target ?? row.line;
  const parsedTarget = Number(rawTarget);
  const statTarget = Number.isFinite(parsedTarget) && parsedTarget > 0
    ? parsedTarget
    : marketCode === "ANYTIME_HR" ? 1 : null;
  const comparator = String(row.comparator || (statTarget != null ? ">=" : "")).trim();
  const normalizedComparator = comparatorKey(comparator);

  const reasons: IdentityRepairReason[] = [];
  if (!gameId) reasons.push("missing_game_id");
  if (!playerId) reasons.push("missing_player_id");
  if (!marketCode) reasons.push("unsupported_market");
  if (statTarget == null) reasons.push("missing_stat_target");
  if (!normalizedComparator) reasons.push("unsupported_comparator");
  if (reasons.length > 0) return { repairable: false, reasons };

  const teamId = cleanKey(row.team_id);
  const eventKey = [sport, gameId, ...(teamId ? [teamId] : []), playerId, marketCode, statTarget, normalizedComparator].join("_");
  const popularityKey = [sport, playerId, marketCode, statTarget, normalizedComparator].join("_");

  return {
    repairable: true,
    patch: {
      sport,
      game_id: gameId,
      ...(teamId ? { team_id: teamId } : {}),
      player_id: playerId,
      market_code: marketCode,
      stat_target: statTarget,
      comparator,
      event_key: eventKey,
      popularity_key: popularityKey,
      external_provider: row.external_provider || externalProvider,
    },
  };
}
