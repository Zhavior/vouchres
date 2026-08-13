import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isAuroraHqFamilySection, isBetaDestinationActive, isFocusedBetaCommandSection, isFocusedBetaSidebarFeature } from '../src/app/betaNavigation';
import { getDefaultLayout, getSidebarFeatures } from '../src/lib/featureConfig';

describe('Aurora Daily Slate page', () => {
  it('is a header page in the Aurora family, not a second sidebar item', () => {
    expect(isAuroraHqFamilySection('aurora_hr_hq')).toBe(true);
    expect(isAuroraHqFamilySection('aurora_daily_slate')).toBe(true);
    expect(isAuroraHqFamilySection('hr_max')).toBe(false);
    expect(isBetaDestinationActive('aurora_daily_slate', 'research')).toBe(true);
    expect(isFocusedBetaCommandSection('aurora_daily_slate')).toBe(true);
    expect(isFocusedBetaSidebarFeature('aurora_daily_slate')).toBe(false);
    expect(getSidebarFeatures(getDefaultLayout()).map((feature) => feature.id)).toContain('aurora_hr_hq');
    expect(getSidebarFeatures(getDefaultLayout()).map((feature) => feature.id)).not.toContain('aurora_daily_slate');
  });

  it('keeps Daily Slate off the Aurora HQ desk and on its own route', () => {
    const desk = readFileSync('src/features/aurora-hr-hq/components/AuroraHqDesk.tsx', 'utf8');
    const nav = readFileSync('src/features/aurora-hr-hq/components/AuroraHqHeaderNav.tsx', 'utf8');
    const router = readFileSync('src/components/routing/MainViewRouter.tsx', 'utf8');
    const preload = readFileSync('src/lib/routePreload.ts', 'utf8');

    expect(nav).toContain("label: 'Daily Slate'");
    expect(nav).toContain("id: 'aurora_daily_slate'");
    expect(desk).toContain('AuroraHqHeaderNav');
    expect(desk).toContain("surface === 'slate'");
    expect(desk).toContain("!isSlatePage && visibleRows.length > 0");
    expect(desk).toContain("isSlatePage && visibleRows.length > 0");
    expect(desk).not.toContain('lazyWithRetry');
    expect(desk).not.toMatch(/React\.lazy\(/);
    expect(desk).not.toMatch(/from ['"].*HomeRunIntelligencePageZ8/);
    expect(router).toContain("case 'aurora_daily_slate':");
    expect(router).toContain("surface={activeSection === 'aurora_daily_slate' ? 'slate' : 'desk'}");
    expect(preload).toContain('aurora_daily_slate');
    expect(preload).toMatch(/EAGER_HR_SECTIONS = new Set\(\[[^\]]*aurora_daily_slate/);
  });

  it('keeps Cognitive-Safe desk motion: no pulse loops and blur at or under 16px', () => {
    const css = readFileSync('src/features/aurora-hr-hq/aurora-hq.css', 'utf8');
    const desk = readFileSync('src/features/aurora-hr-hq/components/AuroraHqDesk.tsx', 'utf8');
    expect(css).not.toContain('aurora-hq-pulse-dot');
    expect(css).toContain('--hq-blur:            16px');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('animation-duration: 0.01ms !important');
    expect(desk).toContain('data-apex-mode="cognitive-safe"');
    expect(desk).not.toContain('Ambient glow');
  });
});
