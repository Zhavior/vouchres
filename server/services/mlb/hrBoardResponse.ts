export function parsePreviewLimit(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(10, Math.min(350, parsed));
}

export function buildHrBoardApiPayload(result: any, previewLimitInput?: unknown) {
  const previewLimit = parsePreviewLimit(previewLimitInput);
  const eligiblePreviewPoolCount =
    result?.debug?.eligiblePreviewPoolCount ?? result?.projectedCandidates?.length ?? 0;
  const scoredPreviewPoolCount =
    result?.debug?.scoredPreviewPoolCount ?? result?.projectedCandidates?.length ?? 0;
  const confirmedCandidates = Array.isArray(result?.candidates) ? result.candidates : [];
  const fullProjectedCandidates = Array.isArray(result?.projectedCandidates)
    ? result.projectedCandidates
    : [];
  const projectedCandidates = fullProjectedCandidates.slice(0, previewLimit);
  const blockedPlayers = Array.isArray(result?.debug?.blockedPlayers) ? result.debug.blockedPlayers : [];
  const blockedReasons = result?.debug?.blockedReasons ?? {};

  const counts = {
    confirmedCandidates: confirmedCandidates.length,
    projectedCandidates: projectedCandidates.length,
    hiddenProjectedCandidates: Math.max(0, fullProjectedCandidates.length - projectedCandidates.length),
    eligiblePreviewPoolCount,
    scoredPreviewPoolCount,
    blockedPlayers: blockedPlayers.length,
    totalVisiblePool: confirmedCandidates.length + projectedCandidates.length,
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
    date: result.date,
    gameCount: result.gameCount,
    generatedAt: new Date().toISOString(),
    dataQuality: truthMode,
    disclaimer:
      result.disclaimer ??
      "Probability-based research using real MLB season stats. For entertainment only — not betting advice. No guaranteed outcomes.",
    rosterAudit: result.rosterAudit,
    candidates: confirmedCandidates,
    rows: confirmedCandidates,
    projectedCandidates,
    candidateBuckets: {
      confirmed: confirmedCandidates,
      projected: projectedCandidates,
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
      totalPlayersChecked: result.pool.totalPlayersChecked,
      confirmedStarters: result.pool.confirmedStarters,
      projectedStarters: result.pool.projectedStarters,
      benchOrUnknown: result.pool.benchOrUnknown,
      injuredScratchedBlocked: result.pool.injuredScratchedBlocked,
      hrCandidatesScored: result.pool.hrCandidatesScored,
    },
    debug: {
      ...result.debug,
      eligiblePreviewPoolCount,
      scoredPreviewPoolCount,
      projectedPreviewCount: projectedCandidates.length,
      hiddenProjectedCount: counts.hiddenProjectedCandidates,
    },
    note: truthMessage,
  };
}
