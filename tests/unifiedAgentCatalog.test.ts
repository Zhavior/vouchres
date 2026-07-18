import { describe, expect, it } from "vitest";
import { buildUnifiedAgentCatalog } from "../server/services/agents/unifiedAgentCatalog";

describe("unified agent catalog", () => {
  it("installs all in-repo agent lanes", () => {
    const catalog = buildUnifiedAgentCatalog();

    // 4 AI judges + 4 panel judges + 5 cappers + 2 brand agents
    expect(catalog.total).toBe(15);
    expect(catalog.lanes.ai_judge).toBe(4);
    expect(catalog.lanes.panel_judge).toBe(4);
    expect(catalog.lanes.capper).toBe(5);
    expect(catalog.lanes.brand).toBe(2);

    expect(catalog.agents.some((a) => a.id === "data_scout")).toBe(true);
    expect(catalog.agents.some((a) => a.id === "professor")).toBe(true);
    expect(catalog.agents.some((a) => a.id === "brand_mark")).toBe(true);
    expect(catalog.agents.some((a) => a.id === "brand_craft_market")).toBe(true);
    expect(catalog.agents.some((a) => a.id === "pick-judge" || a.name.toLowerCase().includes("pick"))).toBe(true);
  });
});
