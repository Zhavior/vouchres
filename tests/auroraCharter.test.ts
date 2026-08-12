import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  AURORA_ACCENT,
  AURORA_LABEL,
  AURORA_SURFACE,
} from '../src/theme/auroraTokens';

const canonicalDocuments = [
  'CONSTITUTION.md',
  'ARCHITECTURE.md',
  'DESIGN.md',
  'COMPONENTS.md',
  'MOTION.md',
  'TOKENS.md',
  'QUALITY.md',
] as const;

function readProjectFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('Aurora Master Charter', () => {
  it('keeps every canonical Aurora document substantive', () => {
    for (const file of canonicalDocuments) {
      const contents = readProjectFile(`aurora/${file}`);
      expect(contents.trim().length, file).toBeGreaterThan(400);
    }
  });

  it('defines Aurora as product language rather than a prediction engine', () => {
    const constitution = readProjectFile('aurora/CONSTITUTION.md');

    expect(constitution).toContain("Aurora is VouchEdge's product language");
    expect(constitution).toContain('Prediction Models');
    expect(constitution).toContain('Trust Ledger');
    expect(constitution).toContain('Resolution Engine');
    expect(constitution).not.toContain('replaceable reasoning engine');
  });

  it('requires progressive answers, reasons, evidence, and deep research', () => {
    const design = readProjectFile('aurora/DESIGN.md');

    expect(design).toContain('Layer 1 — Answer');
    expect(design).toContain('Layer 2 — Reasons');
    expect(design).toContain('Layer 3 — Evidence');
    expect(design).toContain('Layer 4 — Deep Research');
  });

  it('makes Aurora tokens canonical and removes the legacy Z8 token shim', () => {
    expect(AURORA_ACCENT).toBe('text-vouch-emerald');
    expect(AURORA_LABEL).toContain('text-[11px]');
    expect(AURORA_SURFACE).toContain('border');

    const primitives = readProjectFile('src/components/ui/primitives.tsx');
    expect(primitives).toContain("from '../../theme/auroraTokens'");
    expect(primitives).not.toContain("from '../../theme/z8Tokens'");
    expect(existsSync(new URL('../src/theme/z8Tokens.ts', import.meta.url))).toBe(false);
  });

  it('identifies Aurora as the runtime product system without breaking legacy themes', () => {
    const provider = readProjectFile('src/components/theme/ThemeProvider.tsx');

    expect(provider).toContain("setAttribute('data-vouchedge-system', 'aurora')");
    expect(provider).toContain("setAttribute('data-aurora-generation', 'max')");
    expect(provider).toContain("setAttribute('data-theme', 'z8-premium')");
  });

  it('applies Aurora Max through the shared app shell', () => {
    const shell = readProjectFile('src/app/AppShell.tsx');
    const publicApp = readProjectFile('src/App.tsx');
    const css = readProjectFile('src/styles/aurora-max.css');
    const layout = readProjectFile('src/social/feed/HomeFeedLayout.tsx');
    const routeFrame = readProjectFile('src/components/layout/AuroraMaxRouteFrame.tsx');

    expect(shell).toContain('AURORA_MAX_SHELL');
    expect(shell).toContain('data-aurora-generation="max"');
    expect(publicApp).toContain('AURORA_MAX_SHELL');
    expect(css).toContain('.aurora-max-shell');
    expect(css).toContain('.aurora-max-panel');
    expect(css).toContain('.aurora-max-control');
    expect(layout).toContain('<AuroraMaxRouteFrame section={activeSection}>');
    expect(routeFrame).toContain('data-aurora-route={section}');
    expect(routeFrame).toContain("'dense'");
    expect(routeFrame).toContain("'focused'");
  });

  it('keeps Aurora Max primitives shared by the canonical desk and Today', () => {
    const primitives = readProjectFile('src/components/aurora-max/AuroraMaxPrimitives.tsx');
    const canonicalDesk = readProjectFile('src/components/admin/AuroraMax.tsx');
    const todayDesk = readProjectFile('src/components/today/TodayFieldDesk.tsx');

    for (const primitive of ['AuroraMaxCommandHeader', 'AuroraMaxEvidenceLadder', 'AuroraMaxRankedWorkspace', 'AuroraMaxTruthBadge', 'AuroraMaxFallback']) {
      expect(primitives).toContain(`export function ${primitive}`);
    }
    expect(canonicalDesk).toContain("from '../aurora-max/AuroraMaxPrimitives'");
    expect(canonicalDesk).toContain('<AuroraMaxCommandHeader');
    expect(canonicalDesk).toContain('<AuroraMaxRankedWorkspace');
    expect(todayDesk).toContain("from '../aurora-max/AuroraMaxPrimitives'");
    expect(todayDesk).toContain('<AuroraMaxEvidenceLadder');
    expect(todayDesk).toContain('<AuroraMaxFallback');
  });
});
