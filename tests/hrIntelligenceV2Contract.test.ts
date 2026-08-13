import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readV2Sources(): string {
  const dir = 'src/features/hr-intelligence-v2';
  return readdirSync(dir)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
    .map((file) => readFileSync(join(dir, file), 'utf8'))
    .join('\n');
}

describe('HR Aurora Max page contract', () => {
  it('is a separate eager route and does not replace Home Run Intelligence', () => {
    const routes = readFileSync('src/lib/routeModules.ts', 'utf8');
    const router = readFileSync('src/components/routing/MainViewRouter.tsx', 'utf8');
    const preload = readFileSync('src/lib/routePreload.ts', 'utf8');
    const page = readFileSync('src/features/hr-intelligence-v2/HrIntelligenceV2Page.tsx', 'utf8');
    const v2 = readV2Sources();

    expect(routes).toContain("import('../features/hr/pages/HomeRunIntelligencePageZ8')");
    expect(router).toContain('lazyWithRetry(routeModules.hrBoard)');
    expect(router).toContain("import HrIntelligenceV2Page from '../../features/hr-intelligence-v2/HrIntelligenceV2Page'");
    expect(router).toContain("case 'hr_aurora_max':");
    expect(router).toContain('return <HrIntelligenceV2Page onSectionChange={navigateSection} />');
    expect(preload).toContain('hr_board: routeModules.hrBoard');
    expect(preload).toContain("hr_aurora_max: () => Promise.resolve()");
    expect(page).toContain("from '../../components/aurora-max/AuroraMaxPrimitives'");
    expect(page).not.toContain('hr-aurora-max.css');
    expect(page).not.toContain("from '../components/Columns/HrBoard'");
    expect(v2).not.toContain('lazyWithRetry');
    expect(v2).not.toMatch(/\blazy\(/);
    expect(v2).not.toMatch(/import\(/);
  });
});
