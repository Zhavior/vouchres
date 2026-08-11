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
const heroSource = readFileSync(
  new URL('../src/components/landing/aurora/AuroraHero.tsx', import.meta.url),
  'utf8',
);
const pricingSource = readFileSync(
  new URL('../src/components/landing-v3/PricingSection.tsx', import.meta.url),
  'utf8',
);
const previewSource = readFileSync(
  new URL('../src/components/landing-v3/ResearchPreviewSection.tsx', import.meta.url),
  'utf8',
);
const faqSource = readFileSync(
  new URL('../src/components/landing-v3/FAQSection.tsx', import.meta.url),
  'utf8',
);
const liveHudSource = readFileSync(
  new URL('../src/components/landing/hero/LiveHud.tsx', import.meta.url),
  'utf8',
);
const heroCardSource = readFileSync(
  new URL('../src/components/landing-v3/HeroResearchCard.tsx', import.meta.url),
  'utf8',
);
const previewDataSource = readFileSync(
  new URL('../src/components/landing-v3/researchPreviewData.ts', import.meta.url),
  'utf8',
);

describe('public landing conversion contract', () => {
  it('states the MLB research promise and trust boundaries on the mounted landing', () => {
    expect(terminalSource).toContain('<VouchEdgeLandingV3');
    expect(landingSource).toContain('<ResearchPreviewSection');
    expect(landingSource).not.toContain('<LiveSportsIntelligence');
    expect(heroSource).toContain('Research every MLB matchup before first pitch.');
    expect(heroSource).toContain('official game data, matchup context, trends, and transparent');
    expect(heroSource).toContain("Explore Today&apos;s MLB Board");
    expect(heroSource).toContain('View a Real Research Example');
    expect(heroSource).not.toContain('pristine');
    expect(heroSource).not.toContain('LiveHud');
    expect(heroSource).not.toContain('Intel Engine v3.4');
  });

  it('anchors the hero with a data-backed product card instead of hardcoded metrics', () => {
    expect(heroSource).toContain('<HeroResearchCard');
    expect(heroCardSource).toContain('useResearchPreview');
    // Displayed scores must be derived from the feed payload, never literals.
    expect(heroCardSource).toContain('Math.round(primaryPlayer.hrScore)');
    for (const fabricated of ['84%', '1,480', 'Refreshed 2 sec ago', '+8.4 Edge', '74°F']) {
      expect(heroCardSource).not.toContain(fabricated);
    }
    expect(heroCardSource).toContain('Demo research view — sample data');
    expect(heroCardSource).toContain('schedule feed is unavailable');
  });

  it('reads preview data from one shared source so hero and section agree', () => {
    expect(previewSource).toContain('useResearchPreview');
    expect(previewDataSource).toContain('export function useResearchPreview');
    expect(previewDataSource).toContain('formatFeedTime');
  });

  it('offers the free MLB research beta without inventing paid-only defaults', () => {
    expect(heroSource).toContain('Join Beta');
    expect(heroSource).toContain('onJoinBeta');
    expect(heroSource).toContain('Log in');
    expect(pricingSource).toContain('Join the MLB Research Beta.');
    expect(pricingSource).toContain('No card required');
    expect(pricingSource).toMatch(/will not be charged without explicit consent/i);
    expect(terminalSource).toContain("vouchedge_after_auth_destination");
    expect(terminalSource).toContain('SIGNED_IN_HOME');
  });

  it('keeps research preview and FAQ grounded in non-guarantee language', () => {
    expect(previewSource).toContain('Demo research view — sample data');
    expect(previewSource).toContain('It is not a guarantee of the outcome.');
    expect(faqSource).toContain('Does VouchEdge guarantee results?');
    expect(faqSource).toContain('No. VouchEdge does not guarantee profits');
    expect(liveHudSource).toContain('Demo research view — sample data');
    expect(liveHudSource).not.toContain('1,480+ datapoints');
    expect(liveHudSource).not.toContain('Refreshed 2 sec ago');
  });

  it('uses touch-safe conversion controls', () => {
    expect(heroSource).toContain('min-h-11');
    expect(heroSource).toContain('min-h-14');
  });
});
