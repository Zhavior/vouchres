import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HR Intelligence Aurora Max V2 contract', () => {
  it('makes V2 the canonical hr_board module without V1 presentation imports', () => {
    const routes = readFileSync('src/lib/routeModules.ts', 'utf8');
    const page = readFileSync('src/features/hr-intelligence-v2/HrIntelligenceV2Page.tsx', 'utf8');
    const css = readFileSync('src/features/hr-intelligence-v2/hr-intelligence-v2.css', 'utf8');

    expect(routes).toContain("import('../features/hr-intelligence-v2/HrIntelligenceV2Page')");
    expect(routes).not.toContain("import('../features/hr/pages/HomeRunIntelligencePageZ8')");
    const router = readFileSync('src/components/routing/MainViewRouter.tsx', 'utf8');
    expect(router).toContain("import HrIntelligenceV2Page from '../../features/hr-intelligence-v2/HrIntelligenceV2Page'");
    expect(router).not.toContain('lazyWithRetry(routeModules.hrBoard)');
    expect(page).toContain('from \'../../components/aurora-max/AuroraMaxPrimitives\'');
    expect(page).not.toContain('hr-aurora-max');
    expect(page).not.toContain('z8-hr-lens');
    expect(page).not.toContain("from '../components/Columns/HrBoard'");
    expect(page).not.toContain("from '../components/Spotlight/HrSpotlightDeck'");
    expect(page).toContain('openParlayAdd({');
    expect(page).toContain('confirmedCount');
    expect(page).toContain('previewCount');
    expect(css).toContain('Primary vertical scroll');
    expect(css).toContain('overflow-y: visible');
    expect(css).not.toContain('max-h-[');
  });

  it('keeps V1 files available for rollback until deletion phase', () => {
    const v1 = readFileSync('src/features/hr/pages/HomeRunIntelligencePageZ8.tsx', 'utf8');
    expect(v1).toContain('HomeRunIntelligencePageZ8');
  });
});
