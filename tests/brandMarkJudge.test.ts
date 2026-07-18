import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  judgeBrandLetters,
  judgeRepoBrandMark,
  runBrandMarkJudgePanel,
} from "../server/services/judging/brandMarkJudgeService";

describe("Brand Mark Judge", () => {
  it("requires VE letterforms for a strong letter score", () => {
    const weak = judgeBrandLetters(`<svg viewBox="0 0 1024 1024"><path d="M0 0"/></svg>`);
    expect(weak.score).toBeLessThan(50);
    expect(weak.flags.length).toBeGreaterThan(0);

    const strong = judgeBrandLetters(`
      <svg><!-- VE monogram -->
        <g class="ve-mark-letters">
          <path class="letter-v" d="M0 0"/>
          <path class="letter-e" d="M1 1"/>
        </g>
      </svg>`);
    expect(strong.score).toBeGreaterThanOrEqual(70);
  });

  it("approves the shipping master mark with letters + 4K assets", () => {
    const verdict = judgeRepoBrandMark();
    expect(verdict.finalScore).toBeGreaterThanOrEqual(75);
    expect(["Approved", "Playable but risky"]).toContain(verdict.approvalStatus);

    const letters = verdict.judges.find((j) => j.judge === "LetterJudge");
    expect(letters?.score).toBeGreaterThanOrEqual(70);

    const svg = readFileSync(resolve(process.cwd(), "public/brand/vouchedge-mark.svg"), "utf8");
    expect(svg).toContain("ve-mark-letters");
    expect(svg).toContain("letter-v");
    expect(svg).toContain("letter-e");
    expect(svg).toMatch(/VE monogram|VouchEdge VE/i);
  });

  it("flags sportsbook clichés", () => {
    const verdict = runBrandMarkJudgePanel({
      svg: `<svg class="ve-mark-letters"><path class="letter-v"/><path class="letter-e"/> sportsbook $ dice</svg>`,
    });
    const trust = verdict.judges.find((j) => j.judge === "TrustCueJudge");
    expect(trust?.score).toBeLessThan(60);
  });
});
