import { describe, expect, it } from 'vitest';
import { sliceHrBoardByPreviewLimit } from '../src/lib/hrBoardSlice';

describe('core flow helpers', () => {
  it('slices preview rows for unified HR cache consumers', () => {
    const board = sliceHrBoardByPreviewLimit(
      {
        date: '2026-07-10',
        gameCount: 1,
        generatedAt: new Date().toISOString(),
        dataQuality: 'partial',
        disclaimer: 'test',
        rows: [{ playerId: 1 }, { playerId: 2 }],
      },
      1,
    );
    expect(board.rows).toHaveLength(1);
  });
});
