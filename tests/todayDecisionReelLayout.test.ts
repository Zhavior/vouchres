import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/today/TodayDecisionReel.tsx', import.meta.url),
  'utf8',
);

describe('Today decision reel layout stability', () => {
  it('uses one fixed responsive carousel track', () => {
    expect(source).toContain('h-[760px] overflow-hidden sm:h-[720px] lg:h-[520px]');
    expect(source).toContain('grid-rows-[260px_500px]');
    expect(source).toContain('sm:grid-rows-[300px_420px]');
  });

  it('gives every visual type the same reserved mobile height and places it first', () => {
    const matches = source.match(/order-1 flex h-\[260px\] min-h-0/g) ?? [];
    expect(matches).toHaveLength(3);
    expect(source).toContain('order-2 flex h-full');
    expect(source).toContain('lg:order-1');
    expect(source).toContain('lg:order-2');
  });

  it('clamps variable copy so it cannot resize the track', () => {
    expect(source).toContain('line-clamp-2 max-w-3xl');
    expect(source).toContain('line-clamp-3 max-w-xl');
  });

  it('centers player headshots inside their reserved frame', () => {
    expect(source).toContain('h-full w-full object-contain object-center');
    expect(source).toContain('h-[260px] min-h-0 items-center justify-center');
    expect(source).not.toContain('object-[center_18%]');
    expect(source).not.toContain('h-[260px] min-h-0 items-end justify-center');
  });
});
