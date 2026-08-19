import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const terminalSource = readFileSync(
  new URL('../src/pages/VouchEdgeTerminalPage.tsx', import.meta.url),
  'utf8',
);
const landingSource = readFileSync(
  new URL('../src/pages/VouchEdgeLandingV3.tsx', import.meta.url),
  'utf8',
);
const telemetrySource = readFileSync(
  new URL('../src/components/landing/ResearchTelemetryStory.tsx', import.meta.url),
  'utf8',
);
const previewDataSource = readFileSync(
  new URL('../src/components/landing-v3/researchPreviewData.ts', import.meta.url),
  'utf8',
);
const sectionNavSource = readFileSync(
  new URL('../src/app/sectionNavigation.ts', import.meta.url),
  'utf8',
);

describe('public landing conversion contract', () => {
  it('mounts the one-record landing from the public terminal page', () => {
    expect(terminalSource).toContain('<VouchEdgeLandingV3');
    expect(terminalSource).toContain("scrollToSection('record')");
    expect(landingSource).toContain('<ResearchTelemetryStory');
    expect(landingSource).not.toContain('CinematicEditorialStory');
    expect(landingSource).not.toContain('LiveSportsIntelligence');
  });

  it('anchors the hero on the live research preview instead of a fixture matchup', () => {
    expect(landingSource).toContain('useResearchPreview');
    expect(landingSource).toContain('<LiveRecord');
    expect(previewDataSource).toContain('export function useResearchPreview');
    for (const fabricated of ['NYY @ BAL', 'NEW YORK YANKEES', 'BALTIMORE ORIOLES']) {
      expect(landingSource).not.toContain(fabricated);
    }
  });

  it('keeps a single VouchRes mention and VouchEdge as the wordmark', () => {
    expect(landingSource).toContain('VouchEdge');
    expect(landingSource).toContain('a VouchRes record');
    expect(landingSource).not.toContain('VOUCHRES //');
    expect(landingSource.match(/VouchRes/g)?.length).toBe(1);
  });

  it('does not invent confidence, sparklines, or refresh theater', () => {
    expect(telemetrySource).not.toContain('<b>68</b>');
    expect(telemetrySource).not.toContain('[32, 69, 45, 88, 52, 74, 38, 91]');
    expect(landingSource).not.toContain('Refreshed 2 sec ago');
    expect(landingSource).toContain('not a promise of an outcome');
    expect(telemetrySource).toContain('not a fabricated demo');
  });

  it('wires conversion to access and the live record', () => {
    expect(landingSource).toContain('Get access');
    expect(landingSource).toContain('Inspect this record');
    expect(landingSource).toContain('id="how-it-works"');
    expect(landingSource).toContain('id="record"');
    expect(landingSource).toContain('id="access"');
    expect(landingSource).toContain('id="integrate"');
    expect(landingSource).toContain('id="simulate"');
    expect(landingSource).toContain('HR Next');
    expect(landingSource).toContain('Live Games');
    expect(landingSource).toContain('My List');
    expect(landingSource).toContain('Track Record');
    expect(landingSource).toContain('replaces none of your sportsbook');
    expect(terminalSource).toContain("vouchedge_after_auth_destination");
    expect(terminalSource).toContain('SIGNED_IN_HOME');
  });

  it('forces the public landing on /landing as well as preview paths', () => {
    expect(sectionNavSource).toContain('FORCE_PUBLIC_LANDING_PATHS');
    expect(sectionNavSource).toContain("'/landing'");
    expect(sectionNavSource).toContain("'/vouchedge-preview'");
    expect(sectionNavSource).toContain("'/preview/vouchedge'");
  });
});
