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
  const projectedCandidates = Array.isArray(result?.projectedCandidates)
    ? result.projectedCandidates.slice(0, previewLimit)
    : [];

  return {
    date: result.date,
    gameCount: result.gameCount,
    generatedAt: new Date().toISOString(),
    dataQuality:
      result.candidates.length > 0
        ? "partial"
        : projectedCandidates.length > 0
          ? "projection_preview"
          : "limited",
    disclaimer:
      result.disclaimer ??
      "Probability-based research using real MLB season stats. For entertainment only — not betting advice. No guaranteed outcomes.",
    rosterAudit: result.rosterAudit,
    candidates: result.candidates,
    projectedCandidates,
    previewMeta: {
      previewLimit,
      eligiblePreviewPoolCount,
      scoredPreviewPoolCount,
      projectedPreviewCount: projectedCandidates.length,
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
    },
    note:
      result.candidates.length > 0
        ? "Confirmed HR Board — every candidate passed team/game/injury/lineup/pitcher checks."
        : projectedCandidates.length > 0
          ? "Projection Preview — official lineups are not posted yet. Preview rows are roster/currentTeam verified only."
          : "Waiting for official lineups or safe preview candidates.",
  };
}
