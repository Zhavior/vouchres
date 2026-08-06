import { describe, expect, it } from 'vitest';
import {
  SIGNAL_TIER_STYLES,
  signalTierFor,
  signalTierStyle,
} from '../src/components/today/todaySignalTier';

describe('Today signal tier scale', () => {
  it.each([
    [100, 'elite'],
    [88, 'elite'],
    [80, 'elite'],
    [79, 'moderate'],
    [71, 'moderate'],
    [65, 'moderate'],
    [64, 'caution'],
    [22, 'caution'],
    [1, 'caution'],
  ] as const)('places %i in the %s band', (score, id) => {
    expect(signalTierFor(score).id).toBe(id);
  });

  it('treats an absent or zero score as unknown rather than weak', () => {
    // The reel renders these as an em dash — painting them red would invent a
    // finding the data does not support.
    for (const score of [0, -1, Number.NaN, null, undefined]) {
      expect(signalTierFor(score).id).toBe('unknown');
    }
  });

  it('gives every band a distinct colour so adjacent scores never read alike', () => {
    const colors = Object.values(SIGNAL_TIER_STYLES).map((style) => style.text);
    expect(new Set(colors).size).toBe(colors.length);
    expect(signalTierStyle(94).text).not.toBe(signalTierStyle(71).text);
    expect(signalTierStyle(71).text).not.toBe(signalTierStyle(58).text);
  });

  it('carries a written band label so tier does not depend on colour alone', () => {
    expect(signalTierFor(94).label).toBe('Elite');
    expect(signalTierFor(71).label).toBe('Moderate');
    expect(signalTierFor(58).label).toBe('Caution');
    expect(signalTierFor(0).label).toBe('No score');
  });

  it('only uses approved semantic tokens, never raw neon hex', () => {
    const every = Object.values(SIGNAL_TIER_STYLES);
    for (const style of every) {
      expect(style.text).toMatch(/^text-(vouch-emerald|vouch-amber|ve-negative|white\/\d+)$/);
    }
    // #00FF87 / #FFB800 / #FF4D4D are off-palette and must not creep back in.
    const serialized = JSON.stringify(every);
    expect(serialized).not.toMatch(/00ff87|ffb800|ff4d4d/i);
    expect(serialized).not.toMatch(/rgba\(0,\s*255,\s*148/);
  });
});
