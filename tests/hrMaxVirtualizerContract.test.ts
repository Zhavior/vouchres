import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HR Max virtualizer contract (L029)', () => {
  it('keeps measureElement on CardBoard and SlateQueue', () => {
    const board = readFileSync(
      'src/features/hr-max/components/HrMaxCardBoard.tsx',
      'utf8',
    );
    const queue = readFileSync(
      'src/features/hr-max/components/HrMaxSlateQueue.tsx',
      'utf8',
    );
    expect(board).toContain('virtualizer.measureElement');
    expect(queue).toContain('virtualizer.measureElement');
  });
});
