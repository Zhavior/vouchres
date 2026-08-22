import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const HR_FEATURE_DIRS = [
  'src/features/hr-max',
  'src/features/aurora-hr-hq',
  'src/features/hr-v2',
  'src/features/hr',
];

const LAZY_RE = /lazyWithRetry|React\.lazy\s*\(/;

function collectTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsx(path));
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) out.push(path);
  }
  return out;
}

describe('HR pages production chunk contract', () => {
  it('keeps every HR feature folder free of inner lazy splits', () => {
    const hits: string[] = [];
    for (const dir of HR_FEATURE_DIRS) {
      for (const file of collectTsx(dir)) {
        const source = readFileSync(file, 'utf8');
        if (LAZY_RE.test(source)) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });

  it('keeps each HR desk behind its own route-level lazy boundary', () => {
    const router = readFileSync('src/components/routing/MainViewRouter.tsx', 'utf8');
    const modules = readFileSync('src/lib/routeModules.ts', 'utf8');

    expect(router).toContain("const HrAuroraMaxPage = lazyPage(");
    expect(router).toContain("import('../../features/hr-max/pages/HrAuroraMaxPage')");
    expect(router).toContain("const AuroraHqPage = lazyPage(");
    expect(router).toContain("import('../../features/aurora-hr-hq/pages/AuroraHqPage')");
    expect(router).toContain("const HrIntelligencePageV10 = lazyPage(");
    expect(router).toContain("import('../../features/hr-v2/pages/HrIntelligencePageV10')");
    expect(router).toContain("const HomeRunIntelligencePageLegacy = lazyPage(");
    expect(router).toContain("import('../../features/hr/pages/HomeRunIntelligencePageLegacy')");
    expect(router).toContain("case 'hr_max':");
    expect(router).toContain("case 'aurora_hr_hq':");
    expect(router).toContain("case 'aurora_daily_slate':");
    expect(router).toContain("case 'hr_v10':");
    expect(router).toContain("case 'hr_board':");
    expect(modules).not.toContain('hrV10');
    expect(modules).not.toContain('HrAuroraMaxPage');
  });

  it('keeps MainViewRouter available while avoiding neighbor-warming heavy HR desks', () => {
    const shell = readFileSync('src/app/AppShell.tsx', 'utf8');
    const preload = readFileSync('src/lib/routePreload.ts', 'utf8');
    const layout = readFileSync('src/social/feed/HomeFeedLayout.tsx', 'utf8');

    expect(shell).toContain("import MainViewRouter from '../components/routing/MainViewRouter'");
    expect(shell).not.toMatch(/lazyWithRetry\(\(\)\s*=>\s*import\([^)]*MainViewRouter/);
    expect(shell).toContain('isEagerHrSection');
    expect(shell).toContain('OptionalChromeBoundary');
    expect(shell).toContain('allowParlayOsLayer');
    expect(preload).toMatch(/EAGER_HR_SECTIONS = new Set\(\[[^\]]*hr_max/);
    expect(preload).toMatch(/EAGER_HR_SECTIONS = new Set\(\[[^\]]*aurora_hr_hq/);
    expect(preload).toMatch(/EAGER_HR_SECTIONS = new Set\(\[[^\]]*aurora_daily_slate/);
    expect(preload).toMatch(/EAGER_HR_SECTIONS = new Set\(\[[^\]]*hr_v10/);
    expect(layout).toContain('DeferredWorldChat');
    expect(shell).toContain('const isHrRoute = isEagerHrSection(activeSection)');
  });
});
