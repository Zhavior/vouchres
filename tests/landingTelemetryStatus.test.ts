import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MODE_COPY, slateLabel, utcClock } from '../src/components/landing-v4/telemetryStatusCopy';

describe('landing telemetry status', () => {
  it('has copy for every mode the hook can return', () => {
    for (const mode of ['live', 'preview', 'replay', 'offline'] as const) {
      const copy = MODE_COPY[mode];
      expect(copy.status.length, `${mode} status`).toBeGreaterThan(0);
      expect(copy.chip.length, `${mode} chip`).toBeGreaterThan(0);
      expect(copy.detail.length, `${mode} detail`).toBeGreaterThan(0);
    }
  });

  it('states the clock it is quoting', () => {
    expect(utcClock('2026-08-24T22:40:00Z')).toBe('22:40 UTC');
    expect(utcClock('2026-08-24T07:05:00Z')).toBe('07:05 UTC');
    // A malformed timestamp yields nothing rather than a plausible-looking time.
    expect(utcClock('not-a-date')).toBeNull();
    expect(utcClock(null)).toBeNull();
  });

  it('attributes a replay to its own slate', () => {
    expect(slateLabel('2026-08-23')).toBe('AUG 23');
    expect(slateLabel(null)).toBeNull();
  });

  it('never falls back to a bare dash under the live banner', () => {
    // The hero degrades through real populations (confirmed → projected →
    // replay) and labels the mode. A dash reappearing here would mean a panel
    // went back to rendering an empty cell under a "LIVE MODEL" heading.
    for (const path of [
      'src/components/landing-v4/Hero.tsx',
      'src/components/landing-v4/HeroCommandCarousel.tsx',
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source, path).not.toContain("?? '—'");
      expect(source, path).not.toContain('>—<');
    }
  });

  it('keeps the mode visible wherever numbers are shown', () => {
    const hero = readFileSync('src/components/landing-v4/Hero.tsx', 'utf8');
    const carousel = readFileSync('src/components/landing-v4/HeroCommandCarousel.tsx', 'utf8');
    expect(hero).toContain('TelemetryStatusBadge');
    expect(carousel).toContain('TelemetryModeChip');
  });
});
