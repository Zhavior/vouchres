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
const appSource = readFileSync(
  new URL('../src/App.tsx', import.meta.url),
  'utf8',
);
const publicLandingStyles = readFileSync(
  new URL('../src/styles/public-landing.css', import.meta.url),
  'utf8',
);
const integrityJourneySource = readFileSync(
  new URL('../src/components/landing-v3/EvidenceIntegrityJourney.tsx', import.meta.url),
  'utf8',
);
const integrityJourneyStyles = readFileSync(
  new URL('../src/components/landing-v3/evidence-integrity-journey.css', import.meta.url),
  'utf8',
);

describe('public landing conversion contract', () => {
  it('mounts the one-record landing from the public terminal page', () => {
    expect(terminalSource).toContain('<VouchEdgeLandingV3');
    expect(terminalSource).toContain("scrollToSection('record')");
    expect(landingSource).toContain('<TruthFlow');
    expect(landingSource).toContain('TacticalHUDTelemetry');
    expect(landingSource).toContain("useResearchPreview()");
    expect(landingSource).toContain("tag: '07 / RESULT'");
    expect(landingSource).toContain("tag: '08 / LEARN'");
    expect(landingSource).not.toContain('ResearchRecordBridge');
    expect(landingSource).not.toContain('CinematicEditorialStory');
    expect(landingSource).not.toContain('LiveSportsIntelligence');
  });

  it('anchors the hero on the live research preview instead of a fixture matchup', () => {
    expect(landingSource).toContain('TacticalHUDTelemetry preview={preview}');
    expect(landingSource).toContain('preview.featuredGame');
    expect(previewDataSource).toContain('export function useResearchPreview');
    for (const fabricated of ['NYY @ BAL', 'NEW YORK YANKEES', 'BALTIMORE ORIOLES']) {
      expect(landingSource).not.toContain(fabricated);
    }
  });

  it('keeps VouchEdge as the wordmark and identifies the VouchRes engine', () => {
    expect(landingSource).toContain('VOUCHEDGE');
    expect(integrityJourneySource).toContain('VouchRes');
  });

  it('does not invent confidence, sparklines, or refresh theater', () => {
    expect(telemetrySource).not.toContain('<b>68</b>');
    expect(telemetrySource).not.toContain('[32, 69, 45, 88, 52, 74, 38, 91]');
    expect(landingSource).not.toContain('Refreshed 2 sec ago');
    expect(integrityJourneySource).toContain('not a promise of an outcome');
    expect(telemetrySource).toContain('not a fabricated demo');
  });

  it('turns the public-record integrity section into a four-phase evidence story', () => {
    expect(landingSource).toContain('<EvidenceIntegrityJourney');
    expect(integrityJourneySource).toContain('RESEARCH LIMITS / PUBLIC RECORD');
    expect(integrityJourneySource).toContain("label: 'RESEARCHED'");
    expect(integrityJourneySource).toContain("label: 'TIME STAMPED'");
    expect(integrityJourneySource).toContain("label: 'COMPARED TO RESULT'");
    expect(integrityJourneySource).toContain("label: 'RETAINED'");
    expect(integrityJourneySource).toContain('not a prediction oracle');
    expect(integrityJourneySource).toContain('does not invent a saved record');
    expect(integrityJourneyStyles).toContain('.ve-integrityJourney__pin {');
    expect(integrityJourneyStyles).toContain('position: sticky;');
    expect(integrityJourneyStyles).toContain('height: 100dvh;');
    expect(integrityJourneyStyles).toContain('animation: ve-integrity-earth-turn');
    expect(integrityJourneyStyles).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('wires conversion to access and the live record', () => {
    expect(landingSource).toContain('GET BETA ACCESS');
    expect(landingSource).toContain('id="how-it-works"');
    expect(landingSource).toContain('id="record"');
    expect(landingSource).toContain('<EvidenceIntegrityJourney');
    expect(landingSource).toContain('<CommunitySection');
    expect(landingSource).toContain('<PricingSection');
    expect(landingSource).toContain('<FAQSection');
    expect(landingSource).toContain('<CTASection');
    expect(terminalSource).toContain("vouchedge_after_auth_destination");
    expect(terminalSource).toContain('SIGNED_IN_HOME');
  });

  it('forces the public landing on /landing as well as preview paths', () => {
    expect(sectionNavSource).toContain('FORCE_PUBLIC_LANDING_PATHS');
    expect(sectionNavSource).toContain("'/landing'");
    expect(sectionNavSource).toContain("'/vouchedge-preview'");
    expect(sectionNavSource).toContain("'/preview/vouchedge'");
  });

  it('keeps the public landing on one native document scroll owner', () => {
    expect(appSource).toContain('className={`ve-public-landing-root');
    expect(appSource).toContain('data-scroll-owner="document"');
    expect(appSource).not.toContain('className="ve-layout-frame ve-layout-welcome"');
    expect(terminalSource).toContain("classList.add('ve-public-landing-scroll')");
    expect(terminalSource).toContain("classList.remove('ve-public-landing-scroll')");
    expect(publicLandingStyles).toContain('html.ve-public-landing-scroll {');
    expect(publicLandingStyles).toContain('overflow-y: auto !important;');
    expect(publicLandingStyles).toContain('overflow-x: clip !important;');
    expect(publicLandingStyles).toContain('body[style*="overflow: hidden"]');
    expect(publicLandingStyles).not.toContain('html.ve-public-landing-scroll {\n  overflow: hidden');
  });
});
