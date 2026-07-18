import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CRAFT_APPROVE_MIN,
  FINAL_APPROVE_MIN,
  judgeBrandCraft,
  judgeBrandLetters,
  judgeRepoBrandMark,
  runBrandMarkJudgePanel,
} from "../server/services/judging/brandMarkJudgeService";

/** Prior low-craft mark that the old panel wrongly Approved. */
const TERRIBLE_MARK = `
<svg viewBox="0 0 1024 1024" aria-label="VouchEdge VE">
  <defs>
    <radialGradient id="ve-glow">
      <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.34"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="#020617"/>
  <path class="ve-mark-shield" d="M512 148" stroke-width="40" stroke="#00E5FF"/>
  <g class="ve-mark-letters">
    <path class="letter-v" d="M0 0"/>
    <g class="letter-e">
      <path d="M1 1"/>
      <path class="letter-e-edge ve-mark-facet" d="M2 2"/>
    </g>
  </g>
</svg>`;

describe("Brand Mark Judge — raised craft bar", () => {
  it("rejects the old low-craft / gimmick mark", () => {
    const verdict = runBrandMarkJudgePanel({ svg: TERRIBLE_MARK });
    expect(verdict.craftScore).toBeLessThan(CRAFT_APPROVE_MIN);
    expect(verdict.approvalStatus).not.toBe("Approved");
    expect(verdict.whatCouldGoWrong.length).toBeGreaterThan(0);

    const letters = judgeBrandLetters(TERRIBLE_MARK);
    expect(letters.flags.some((f) => /gimmick/i.test(f))).toBe(true);
  });

  it("requires craft level 2 + optical meta for a strong craft score", () => {
    const weak = judgeBrandCraft(`<svg><g class="ve-mark-letters"/></svg>`);
    expect(weak.score).toBeLessThan(70);

    const strong = judgeBrandCraft(`
      <svg data-craft-level="2" data-no-gimmick="1">
        <!-- craft:level=2 Optical lockup -->
        <g class="ve-mark-letters ve-mark-optical">
          <path class="letter-v" fill="url(#ve-letter)"/>
          <path class="letter-e" fill="url(#ve-letter)"/>
          <path fill="url(#ve-letter)"/>
        </g>
      </svg>`);
    expect(strong.score).toBeGreaterThanOrEqual(75);
  });

  it("shipping master clears the raised approve bar", () => {
    const verdict = judgeRepoBrandMark();
    expect(verdict.craftScore).toBeGreaterThanOrEqual(CRAFT_APPROVE_MIN);
    expect(verdict.finalScore).toBeGreaterThanOrEqual(FINAL_APPROVE_MIN);
    expect(verdict.approvalStatus).toBe("Approved");

    const svg = readFileSync(resolve(process.cwd(), "public/brand/vouchedge-mark.svg"), "utf8");
    expect(svg).toContain('data-craft-level="2"');
    expect(svg).toContain("ve-mark-optical");
    expect(svg).toContain("ve-mark-starwars");
    expect(svg).not.toContain("letter-e-edge");
    expect(svg).toMatch(/stroke-width="30"/);
    // Letters must be painted before the shield (behind)
    expect(svg.search(/ve-mark-letters/)).toBeLessThan(svg.search(/ve-mark-shield/));
  });
});
