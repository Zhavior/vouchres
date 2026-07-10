import { describe, expect, it } from 'vitest';
import { sliceHrBoardByPreviewLimit, HR_BOARD_CANONICAL_FETCH_LIMIT } from '../src/lib/hrBoardSlice';
import type { HrBoardResponse } from '../src/types/hrBoard';

function mockBoard(rowCount: number): HrBoardResponse {
  const rows = Array.from({ length: rowCount }, (_, i) => ({
    playerId: i + 1,
    playerName: `Player ${i + 1}`,
  }));
  return {
    date: '2026-07-10',
    gameCount: 1,
    generatedAt: new Date().toISOString(),
    dataQuality: 'partial',
    disclaimer: 'test',
    rows,
    confirmedCandidates: rows,
    counts: { rows: rowCount, confirmedCandidates: rowCount },
  };
}

describe('sliceHrBoardByPreviewLimit', () => {
  it('returns full board when limit is at or above canonical fetch limit', () => {
    const board = mockBoard(100);
    const full = sliceHrBoardByPreviewLimit(board, HR_BOARD_CANONICAL_FETCH_LIMIT);
    expect(full.rows).toHaveLength(100);
  });

  it('slices rows and candidates to the requested preview limit', () => {
    const board = mockBoard(50);
    const sliced = sliceHrBoardByPreviewLimit(board, 12);
    expect(sliced.rows).toHaveLength(12);
    expect(sliced.confirmedCandidates).toHaveLength(12);
    expect(sliced.previewMeta?.previewLimit).toBe(12);
  });
});
