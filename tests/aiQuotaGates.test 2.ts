import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("AI quota gates (static audit)", () => {
  it("gates expensive agent pick generation", () => {
    const source = readFileSync(path.join(process.cwd(), "server/routes/agentRoutes.ts"), "utf8");
    const start = source.indexOf('"/api/agents/:id/generate-picks"');
    const end = source.indexOf("POST /api/agents/generate-all-picks", start);
    const block = source.slice(start, end > start ? end : start + 1200);
    expect(block).toContain("requireTierOrQuota");
    expect(block).toContain("incrementQuota");
  });

  it("gates parlay AI generation", () => {
    const source = readFileSync(path.join(process.cwd(), "server/routes/parlay/parlayUserRoutes.ts"), "utf8");
    const start = source.indexOf('"/parlays/ai-generate"');
    const end = source.indexOf('parlayUserRoutes.post(', start + 1);
    const block = source.slice(start, end > start ? end : start + 1200);
    expect(block).toContain("requireTierOrQuota");
    expect(block).toContain("parlay_lab_saves");
    expect(block).toContain("incrementQuota");
  });

  it("caps the expensive Gemini endpoints for PAID tiers too (4-arg requireTierOrQuota)", () => {
    // Cost-protection regression guard: paid tiers must NOT be uncapped on the
    // expensive image/theme generation endpoints, or a paid/leaked token can
    // run thousands of Gemini calls/day for a flat fee. The 4th arg to
    // requireTierOrQuota is the paid daily ceiling.
    const source = readFileSync(path.join(process.cwd(), "server/routes/aiRoutes.ts"), "utf8");
    for (const quotaKey of ["ai_image", "ai_theme", "ai_chat", "research_lookups"]) {
      const re = new RegExp(`requireTierOrQuota\\(\\s*"gold"\\s*,\\s*\\d+\\s*,\\s*"${quotaKey}"\\s*,\\s*\\d+\\s*\\)`);
      expect(re.test(source), `${quotaKey} must have a paid daily ceiling`).toBe(true);
    }
  });
});
