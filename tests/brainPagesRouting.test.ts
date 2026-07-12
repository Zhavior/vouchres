import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const router = readFileSync('src/components/routing/MainViewRouter.tsx', 'utf8');
const features = readFileSync('src/lib/featureConfig.ts', 'utf8');

describe('Brain Pro page routing', () => {
  it('gates both Brain pages with the existing Pro access boundary', () => {
    expect(router).toContain('<ProGateShell featureName="Brain Picks"');
    expect(router).toContain('<ProGateShell featureName="Brain Performance"');
  });

  it('registers both pages as MLB-only features', () => {
    expect(features).toContain('{ id: "brain_picks", label: "Brain Picks"');
    expect(features).toContain('{ id: "brain_performance", label: "Brain Performance"');
    expect(features.match(/sports: \["mlb"\]/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
