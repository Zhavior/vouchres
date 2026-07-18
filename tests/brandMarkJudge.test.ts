import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CRAFT_APPROVE_MIN,
  FINAL_APPROVE_MIN,
  judgeBrandCore,
  judgeBrandCraft,
  judgeRepoBrandMark,
  runBrandMarkJudgePanel,
} from "../server/services/judging/brandMarkJudgeService";

const TERRIBLE_MARK = `
<svg viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="ve-glow">
      <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.34"/>
    </radialGradient>
  </defs>
  <path class="ve-mark-shield" d="M512 148" stroke-width="40" stroke="#00E5FF"/>
  <g class="ve-mark-letters"><path class="letter-v"/><path class="letter-e-edge ve-mark-facet"/></g>
</svg>`;

describe("Brand Mark Judge — shield + check", () => {
  it("rejects marks without a verification check", () => {
    const verdict = runBrandMarkJudgePanel({ svg: TERRIBLE_MARK });
    expect(verdict.approvalStatus).not.toBe("Approved");
    expect(judgeBrandCore(TERRIBLE_MARK).score).toBeLessThan(70);
  });

  it("rewards craft level 2 + check core", () => {
    const strong = judgeBrandCraft(`
      <svg data-craft-level="2" data-no-gimmick="1" data-mark-core="check">
        <!-- craft:level=2 markCore=check -->
        <path class="ve-mark-shield"/>
        <g class="ve-mark-check"/>
      </svg>`);
    expect(strong.score).toBeGreaterThanOrEqual(75);
  });

  it("shipping master is shield + check (no VE letters)", () => {
    const verdict = judgeRepoBrandMark();
    expect(verdict.craftScore).toBeGreaterThanOrEqual(CRAFT_APPROVE_MIN);
    expect(verdict.finalScore).toBeGreaterThanOrEqual(FINAL_APPROVE_MIN);
    expect(verdict.approvalStatus).toBe("Approved");

    const svg = readFileSync(resolve(process.cwd(), "public/brand/vouchedge-mark.svg"), "utf8");
    expect(svg).toContain('data-mark-core="check"');
    expect(svg).toContain("ve-mark-check");
    expect(svg).toContain("mark-check");
    expect(svg).not.toContain("ve-mark-letters");
    expect(svg).not.toContain("letter-v");
  });
});
