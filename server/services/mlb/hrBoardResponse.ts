import { TEAM_MISMATCH_REASON } from "./teamAssignmentSafety";

type AnyRecord = Record<string, any>;

export const OFFICIAL_LINEUP_PREVIEW_WARNING = "Official lineup not posted yet";

export interface HrCandidateLike extends AnyRecord {
  playerName?: string;
  team?: string;
  playerId?: string | number;
  gameId?: string | number;
  source?: string;
  hrScore?: number;
  rank?: number;
  isConfirmed?: boolean;
  warnings?: unknown;
  lineupStatus?: string;
  dataQuality?: string;
  status?: string;
  blockedReasons?: unknown;
  reasons?: unknown;
}

export interface HrBoardLike extends AnyRecord {
  generatedAt?: string;
  safeLimit?: number;
  limit?: number;
  rows?: unknown;
  candidates?: unknown;
  confirmedCandidates?: unknown;
  projectedCandidates?: unknown;
  allProjectedCandidates?: unknown;
  candidateBuckets?: unknown;
  counts?: AnyRecord;
  debug?: AnyRecord;
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function clampLimit(value: unknown, fallback = 20): number {
  return Math.max(1, Math.min(50, Math.floor(num(value, fallback) || fallback)));
}

function candidateKey(c: HrCandidateLike): string {
  return [
    c.playerId != null ? String(c.playerId) : "",
    text(c.playerName).toLowerCase(),
    text(c.team).toLowerCase(),
    c.gameId != null ? String(c.gameId) : "",
    text(c.source).toLowerCase(),
  ]
    .filter(Boolean)
    .join("|");
}

function reasonsIncludeTeamMismatch(raw: HrCandidateLike): boolean {
  const pools = [raw.blockedReasons, raw.reasons, raw.warnings];
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    for (const item of pool) {
      if (typeof item === "string" && item.includes(TEAM_MISMATCH_REASON)) return true;
    }
  }
  return false;
}

function isProjectedLike(raw: HrCandidateLike): boolean {
  const lineup = text(raw.lineupStatus).toLowerCase();
  const quality = text(raw.dataQuality).toLowerCase();
  const status = text(raw.status).toLowerCase();
  const source = text(raw.source).toLowerCase();
  return (
    lineup.includes("project")
    || quality.includes("projection")
    || quality.includes("preview")
    || status === "preview"
    || source.includes("projected")
    || source.includes("preview")
  );
}

function withPreviewWarning(candidate: HrCandidateLike): HrCandidateLike {
  const warnings = Array.isArray(candidate.warnings)
    ? candidate.warnings.filter((w): w is string => typeof w === "string")
    : [];
  if (!warnings.some((w) => w.includes(OFFICIAL_LINEUP_PREVIEW_WARNING))) {
    warnings.unshift(`${OFFICIAL_LINEUP_PREVIEW_WARNING}. Do not treat as confirmed.`);
  }
  return { ...candidate, warnings };
}

function normalizeCandidate(raw: unknown): HrCandidateLike | null {
  if (!isRecord(raw)) return null;

  return {
    ...raw,
    playerName: text(raw.playerName ?? raw.name ?? raw.player),
    team: text(raw.team ?? raw.abbr ?? raw.club),
    source: text(raw.source ?? raw.bucket ?? raw.origin),
    playerId: raw.playerId ?? raw.id ?? raw.mlbId ?? raw.personId,
    gameId: raw.gameId ?? raw.game_id ?? raw.matchupId,
    hrScore: num(raw.hrScore ?? raw.score ?? raw.projectionScore ?? raw.expectedHr, 0),
    rank: num(raw.rank ?? raw.sortRank ?? raw.order, Number.POSITIVE_INFINITY),
    isConfirmed: Boolean(raw.isConfirmed ?? raw.confirmed ?? raw.locked),
  };
}

function normalizePool(raw: unknown): HrCandidateLike[] {
  return asArray(raw)
    .map(normalizeCandidate)
    .filter((x): x is HrCandidateLike => Boolean(x));
}

/** Confirmed batting-order candidates only — never projected or team-mismatch rows. */
function sanitizeConfirmed(candidates: HrCandidateLike[]): HrCandidateLike[] {
  return candidates.filter((c) => {
    if (reasonsIncludeTeamMismatch(c)) return false;
    // isConfirmed cannot override projected-like evidence — honesty first.
    if (isProjectedLike(c)) return false;
    return true;
  });
}

/** Display fallback rows: drop team mismatches; label anything projected-like. */
function sanitizeDisplayRows(candidates: HrCandidateLike[]): HrCandidateLike[] {
  return candidates
    .filter((c) => !reasonsIncludeTeamMismatch(c))
    .map((row) => (isProjectedLike(row) || !row.isConfirmed ? withPreviewWarning({ ...row, isConfirmed: false }) : row));
}

function dedupeAndSort(candidates: HrCandidateLike[]): HrCandidateLike[] {
  const map = new Map<string, HrCandidateLike>();

  for (const c of candidates) {
    const key = candidateKey(c);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, c);
      continue;
    }

    const existingScore = num(existing.hrScore, Number.NEGATIVE_INFINITY);
    const nextScore = num(c.hrScore, Number.NEGATIVE_INFINITY);
    if (nextScore > existingScore) {
      map.set(key, c);
      continue;
    }

    if (nextScore === existingScore) {
      const existingRank = num(existing.rank, Number.POSITIVE_INFINITY);
      const nextRank = num(c.rank, Number.POSITIVE_INFINITY);
      if (nextRank < existingRank) map.set(key, c);
    }
  }

  return [...map.values()].sort((a, b) => {
    const scoreDiff = num(b.hrScore, 0) - num(a.hrScore, 0);
    if (scoreDiff !== 0) return scoreDiff;

    const rankDiff = num(a.rank, Number.POSITIVE_INFINITY) - num(b.rank, Number.POSITIVE_INFINITY);
    if (rankDiff !== 0) return rankDiff;

    return text(a.playerName).localeCompare(text(b.playerName));
  });
}

export function buildFutureProofHrBoardResponse(input: HrBoardLike, requestedLimit?: number) {
  const limit = clampLimit(requestedLimit ?? input.limit ?? input.safeLimit ?? 50);

  const rawRows = normalizePool(input.rows);
  const confirmedCandidates = dedupeAndSort(
    sanitizeConfirmed(
      normalizePool(
        isRecord(input.candidateBuckets)
          ? input.confirmedCandidates ?? input.candidates ?? input.candidateBuckets.confirmed
          : input.confirmedCandidates ?? input.candidates
      ),
    ),
  );
  const projectedCandidates = dedupeAndSort(
    normalizePool(
      isRecord(input.candidateBuckets)
        ? input.projectedCandidates ?? input.candidateBuckets.projected
        : input.projectedCandidates
    ),
  ).map(withPreviewWarning);

  const allProjectedCandidates = dedupeAndSort(
    normalizePool(input.allProjectedCandidates).concat(projectedCandidates),
  ).map(withPreviewWarning);

  // Display fallback may show projected rows, but candidates[] stays confirmed-only.
  // Never put unsanitized rawRows into the board — mismatch/preview rules still apply.
  const rows =
    confirmedCandidates.length > 0
      ? confirmedCandidates
      : projectedCandidates.length > 0
        ? projectedCandidates
        : allProjectedCandidates.length > 0
          ? allProjectedCandidates
          : rawRows.length > 0
            ? sanitizeDisplayRows(rawRows)
            : [];

  const { candidates: _ignoredCandidates, ...inputWithoutCandidates } = isRecord(input) ? input : {};
  void _ignoredCandidates;

  return {
    ...inputWithoutCandidates,
    generatedAt: typeof input.generatedAt === "string" ? input.generatedAt : new Date().toISOString(),
    // Honesty contract: candidates[] === official confirmed batting-order only
    candidates: confirmedCandidates,
    rows,
    confirmedCandidates,
    projectedCandidates,
    allProjectedCandidates,
    candidateBuckets: {
      confirmed: confirmedCandidates,
      projected: projectedCandidates,
    },
    counts: {
      ...(isRecord(input.counts) ? input.counts : {}),
      rows: rows.length,
      confirmedCandidates: confirmedCandidates.length,
      projectedCandidates: projectedCandidates.length,
      allProjectedCandidates: allProjectedCandidates.length,
      totalCandidates: confirmedCandidates.length + allProjectedCandidates.length,
    },
    debug: {
      ...(isRecord(input.debug) ? input.debug : {}),
      limit,
      rowCount: rows.length,
      confirmedCount: confirmedCandidates.length,
      projectedCount: projectedCandidates.length,
      allProjectedCount: allProjectedCandidates.length,
      confirmedSource: "validated_hr_pipeline",
    },
    dataQuality:
      confirmedCandidates.length > 0
        ? "confirmed"
        : projectedCandidates.length > 0
          ? "projection_preview"
          : rows.length > 0
            ? "fallback"
            : "limited",
  };
}

export const buildHrBoardApiPayload = buildFutureProofHrBoardResponse;
export const buildHrBoardResponse = buildFutureProofHrBoardResponse;
