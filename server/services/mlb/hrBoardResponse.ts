type AnyRecord = Record<string, any>;

export interface HrCandidateLike extends AnyRecord {
  playerName?: string;
  team?: string;
  playerId?: string | number;
  gameId?: string | number;
  source?: string;
  hrScore?: number;
  rank?: number;
  isConfirmed?: boolean;
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
    normalizePool(
      isRecord(input.candidateBuckets)
        ? input.confirmedCandidates ?? input.candidates ?? input.candidateBuckets.confirmed
        : input.confirmedCandidates ?? input.candidates
    )
  );
  const projectedCandidates = dedupeAndSort(
    normalizePool(
      isRecord(input.candidateBuckets)
        ? input.projectedCandidates ?? input.candidateBuckets.projected
        : input.projectedCandidates
    )
  );

  const allProjectedCandidates = dedupeAndSort(
    normalizePool(input.allProjectedCandidates).concat(projectedCandidates)
  );

  const fallbackPool = dedupeAndSort([
    ...confirmedCandidates,
    ...projectedCandidates,
    ...allProjectedCandidates,
    ...rawRows,
  ]);

  const rows =
    confirmedCandidates.length > 0
      ? confirmedCandidates
      : projectedCandidates.length > 0
        ? projectedCandidates
        : rawRows.length > 0
          ? rawRows
          : fallbackPool;

  return {
    ...(isRecord(input) ? input : {}),
    generatedAt: typeof input.generatedAt === "string" ? input.generatedAt : new Date().toISOString(),
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
      totalCandidates: fallbackPool.length,
    },
    debug: {
      ...(isRecord(input.debug) ? input.debug : {}),
      limit,
      rowCount: rows.length,
      confirmedCount: confirmedCandidates.length,
      projectedCount: projectedCandidates.length,
      allProjectedCount: allProjectedCandidates.length,
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
