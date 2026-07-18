import { describe, expect, it } from "vitest";
import {
  judgeAntiCliche,
  judgeLetterConstruction,
  judgeMarketSilhouette,
  judgeRepoBrandCraftMarket,
  runBrandCraftMarketPanel,
} from "../server/services/judging/brandCraftMarketAgent";

const AI_STACK = `
<svg viewBox="0 0 1024 1024" data-material="night-city" data-palette="socialize-ref">
  <defs>
    <radialGradient id="ve-glow">
      <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.28"/>
    </radialGradient>
    <filter id="bloom"><feDropShadow stdDeviation="6" flood-color="#22D3EE"/></filter>
  </defs>
  <rect fill="#2B1F54"/>
  <rect fill="#1A1035"/>
  <circle fill="url(#ve-glow)"/>
  <path class="ve-mark-shield" stroke-width="30"/>
  <g class="ve-mark-letters" filter="url(#bloom)">
    <path class="letter-v" fill="#22D3EE"/>
    <path class="letter-e" fill="#C026D3"/>
  </g>
</svg>`;

const CLEANER = `
<svg viewBox="0 0 1024 1024"
  data-craft-level="2" data-no-gimmick="1"
  data-mark-core="ve" data-material="enamel" data-palette="ink-desk"
  data-optical-margin="96" data-optical-gap="14" data-optical-letter-height="180"
  data-optical-max-x="680" data-letter-style="filled-type">
  <path class="ve-mark-shield" stroke-width="30"/>
  <g class="ve-mark-letters ve-mark-optical">
    <path class="letter-v" fill="#FFFFFF"/>
    <path class="letter-e" fill="#FFFFFF"/>
  </g>
</svg>`;

describe("Brand Craft Market Agent", () => {
  it("flags night-city AI stack and never auto-ships", () => {
    const v = runBrandCraftMarketPanel(AI_STACK);
    expect(v.marketReady).toBe(false);
    expect(v.humanVetoRequired).toBe(true);
    expect(v.marketShipStatus === "AI-cliché" || v.marketShipStatus === "Reject" || v.marketShipStatus === "Workshop").toBe(
      true,
    );
    expect(judgeAntiCliche(AI_STACK).score).toBeLessThan(70);
  });

  it("rewards mono-safe white letters + optical gap", () => {
    expect(judgeMarketSilhouette(CLEANER).score).toBeGreaterThanOrEqual(70);
    expect(judgeLetterConstruction(CLEANER).score).toBeGreaterThanOrEqual(70);
  });

  it("shipping repo mark always requires human veto", () => {
    const v = judgeRepoBrandCraftMarket();
    expect(v.marketReady).toBe(false);
    expect(v.humanVetoRequired).toBe(true);
    expect(v.researchNotes.length).toBeGreaterThan(0);
    expect(v.marketBar.length).toBeGreaterThanOrEqual(5);
  });
});
