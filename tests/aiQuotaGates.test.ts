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
});
