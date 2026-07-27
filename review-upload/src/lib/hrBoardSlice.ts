import type { HrBoardResponse } from '../types/hrBoard';

/** Server max previewLimit — single canonical fetch size for React Query dedupe. */
export const HR_BOARD_CANONICAL_FETCH_LIMIT = 350;

function sliceArray<T>(rows: T[] | undefined, limit: number): T[] | undefined {
  if (!rows) return rows;
  return rows.slice(0, limit);
}

/** Client-side slice after one shared HR board fetch. */
export function sliceHrBoardByPreviewLimit(
  board: HrBoardResponse,
  previewLimit?: number,
): HrBoardResponse {
  if (!previewLimit || previewLimit >= HR_BOARD_CANONICAL_FETCH_LIMIT) return board;

  const limit = Math.max(1, previewLimit);

  return {
    ...board,
    rows: sliceArray(board.rows, limit),
    candidates: sliceArray(board.candidates, limit),
    confirmedCandidates: sliceArray(board.confirmedCandidates, limit),
    projectedCandidates: sliceArray(board.projectedCandidates, limit),
    allProjectedCandidates: sliceArray(board.allProjectedCandidates, limit),
    candidateBuckets: board.candidateBuckets
      ? {
          ...board.candidateBuckets,
          confirmed: sliceArray(board.candidateBuckets.confirmed, limit),
          projected: sliceArray(board.candidateBuckets.projected, limit),
          allProjected: sliceArray(board.candidateBuckets.allProjected, limit),
          blocked: sliceArray(board.candidateBuckets.blocked, limit),
        }
      : board.candidateBuckets,
    counts: board.counts
      ? {
          ...board.counts,
          rows: Math.min(board.counts.rows ?? limit, limit),
          confirmedCandidates: Math.min(board.counts.confirmedCandidates ?? limit, limit),
          projectedCandidates: Math.min(board.counts.projectedCandidates ?? limit, limit),
          allProjectedCandidates: Math.min(board.counts.allProjectedCandidates ?? limit, limit),
          totalCandidates: Math.min(board.counts.totalCandidates ?? limit, limit),
        }
      : board.counts,
    previewMeta: board.previewMeta
      ? { ...board.previewMeta, previewLimit: limit }
      : { previewLimit: limit, eligiblePreviewPoolCount: 0, scoredPreviewPoolCount: 0, projectedPreviewCount: 0 },
  };
}
