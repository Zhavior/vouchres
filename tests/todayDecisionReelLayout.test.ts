import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/today/TodayDecisionReel.tsx', import.meta.url),
  'utf8',
);

describe('Today decision reel layout stability', () => {
  it('uses a horizontally scrollable snap rail instead of one oversized slide', () => {
    expect(source).toContain('snap-x snap-mandatory');
    expect(source).toContain('overflow-x-auto');
    expect(source).toContain('scrollBy({ left: direction * 328');
    expect(source).not.toContain('h-[760px]');
  });

  it('keeps every card and visual stage at a stable size', () => {
    expect(source).toContain("height: 468, width: 'min(304px, calc(100vw - 2rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)))'");
    expect(source).toContain('style={{ height: 180 }}');
    expect(source).toContain('max-w-[320px] shrink-0 snap-start');
  });

  it('clamps variable copy so it cannot resize the track', () => {
    expect(source).toContain('line-clamp-2 text-xl');
    expect(source).toContain('line-clamp-2 min-h-10');
    expect(source).toContain('line-clamp-2 text-[11px]');
  });

  it('centers player headshots inside their reserved frame', () => {
    expect(source).toContain('style={{ height: 140, width: 168 }}');
    expect(source).toContain('style={{ height: 92, width: 92 }}');
    expect(source).toContain('style={{ height: 150, width: 190 }}');
    expect(source).toContain('className="object-contain object-bottom"');
    expect(source).not.toContain('object-[center_18%]');
  });

  it('gives the top HR signal a dedicated evidence-first player card', () => {
    expect(source).toContain('function PlayerSignalCard');
    expect(source).toContain('Top HR signal');
    expect(source).toContain('Official lineup');
    expect(source).toContain('Lineup unconfirmed');
    expect(source).toContain('Add to Slip');
    expect(source).toContain("gridTemplateColumns: '0.9fr 1.1fr'");
  });

  it('keeps briefing filters functional and slip activity truthful', () => {
    expect(source).toContain("filter === 'signals'");
    expect(source).toContain("filter === 'activity'");
    expect(source).toContain('pendingSlip');
    expect(source).toContain('Odds unavailable');
  });
});
