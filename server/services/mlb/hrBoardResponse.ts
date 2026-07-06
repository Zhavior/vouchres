import { withCanonicalHrScore } from './hr-engine/hrScoreAdapter';
import { parseHrBoardResult } from './hr-engine/hrBoardSchema';

export function resolveVisibleHrRows({
  confirmedCandidates,
  projectedCandidates,
  fullProjectedCandidates,
  previewLimit,
}: {
  confirmedCandidates: Array<Record<string, unknown>>;
  projectedCandidates: Array<Record<string, unknown>>;
  fullProjectedCandidates: Array<Record<string, unknown>>;
  previewLimit: number;
}) {
  if (confirmedCandidates.length > 0) {
    return confirmedCandidates;
  }

  if (projectedCandidates.length > 0) {
    return projectedCandidates;
  }

  const fallbackLimit = Math.max(1, Math.min(20, previewLimit));
  return fullProjectedCandidates.slice(0, fallbackLimit);
}

export function parsePreviewLimit(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(10, Math.min(350, parsed));
}

export function buildHrBoardApiPayload(result: unknown, previewLimitInput?: unknown) {
  const parsedResult = parseHrBoardResult(result);
  const previewLimit = parsePreviewLimit(previewLimitInput);
  const eligiblePreviewPoolCount =
    parsedResult?.debug?.eligiblePreviewPoolCount ?? parsedResult?.projectedCandidates?.length ?? 0;
  const scoredPreviewPoolCount =
    parsedResult?.debug?.scoredPreviewPoolCount ?? parsedResult?.projectedCandidates?.length ?? 0;
  const confirmedCandidates = (Array.isArray(parsedResult?.candidates) ? parsedResult.candidates : []).map(withCanonicalHrScore);
  const fullProjectedCandidates = (Array.isArray(parsedResult?.projectedCandidates)
    ? parsedResult.projectedCandidates
    : []
  ).map(withCanonicalHrScore);
  const projectedCandidates = fullProjectedCandidates.slice(0, previewLimit);
  const blockedPlayers = (Array.isArray(parsedResult?.debug?.blockedPlayers) ? parsedResult.debug.blockedPlayers : []).map(withCanonicalHrScore);
  const blockedReasons = parsedResult?.debug?.blockedReasons ?? {};

  const visibleRows = resolveVisibleHrRows({
    confirmedCandidates,
    projectedCandidates,
    fullProjectedCandidates,
    previewLimit,
  });

  const counts = {
    confirmedCandidates: confirmedCandidates.length,
    projectedCandidates: projectedCandidates.length,
    hiddenProjectedCandidates: Math.max(0, fullProjectedCandidates.length - projectedCandidates.length),
    eligiblePreviewPoolCount,
    scoredPreviewPoolCount,
    blockedPlayers: blockedPlayers.length,
    totalVisiblePool: confirmedCandidates.length + visibleRows.length,
    totalTruthPool: confirmedCandidates.length + fullProjectedCandidates.length + blockedPlayers.length,
  };

  const truthMode =
    confirmedCandidates.length > 0
      ? "confirmed"
      : projectedCandidates.length > 0
        ? "projection_preview"
        : blockedPlayers.length > 0
          ? "blocked_waiting"
          : "limited";

  const truthMessage =
    confirmedCandidates.length > 0
      ? "Confirmed HR Board — every candidate passed team/game/injury/lineup/pitcher checks."
      : projectedCandidates.length > 0
        ? "Projection Preview — official lineups are not posted yet. Preview rows are roster/currentTeam verified only."
        : blockedPlayers.length > 0
          ? "HR Watch is waiting on official lineups, pitchers, stats, or safe roster verification."
          : "Waiting for official lineups or safe preview candidates.";

  return {
    date: parsedResult.date,
    gameCount: parsedResult.gameCount,
    generatedAt: new Date().toISOString(),
    dataQuality: truthMode,
    disclaimer:
      parsedResult.disclaimer ??
      "Probability-based research using real MLB season stats. For entertainment only — not betting advice. No guaranteed outcomes.",
    rosterAudit: parsedResult.rosterAudit,
    candidates: confirmedCandidates,
    // rows = what the board renders. Before official lineups post there are no
    // confirmed candidates, so fall back to the projected preview pool and then
    // to the full projected pool if both candidate slices are empty.
    rows: visibleRows,
    projectedCandidates,
    allProjectedCandidates: fullProjectedCandidates,
    candidateBuckets: {
      confirmed: confirmedCandidates,
      projected: projectedCandidates,
      allProjected: fullProjectedCandidates,
      blocked: blockedPlayers,
    },
    counts,
    truthSummary: {
      mode: truthMode,
      dataQuality: truthMode,
      message: truthMessage,
      blockedReasons,
    },
    previewMeta: {
      previewLimit,
      eligiblePreviewPoolCount,
      scoredPreviewPoolCount,
      projectedPreviewCount: projectedCandidates.length,
      hiddenProjectedCount: counts.hiddenProjectedCandidates,
    },
    pool: {
      totalPlayersChecked: parsedResult.pool.totalPlayersChecked,
      confirmedStarters: parsedResult.pool.confirmedStarters,
      projectedStarters: parsedResult.pool.projectedStarters,
      benchOrUnknown: parsedResult.pool.benchOrUnknown,
      injuredScratchedBlocked: parsedResult.pool.injuredScratchedBlocked,
      hrCandidatesScored: parsedResult.pool.hrCandidatesScored,
    },
    debug: {
      ...parsedResult.debug,
      eligiblePreviewPoolCount,
      scoredPreviewPoolCount,
      projectedPreviewCount: projectedCandidates.length,
      hiddenProjectedCount: counts.hiddenProjectedCandidates,
    },
    note: truthMessage,
  };
}
