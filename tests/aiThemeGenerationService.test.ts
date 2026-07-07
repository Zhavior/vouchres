import { describe, expect, it, vi } from "vitest";
import { generateAiTheme } from "../server/services/ai/themeGenerationService";
import { AiThemeRequestSchema } from "../server/validators/aiSchemas";

describe("AiThemeRequestSchema", () => {
  it("requires a bounded prompt", () => {
    expect(AiThemeRequestSchema.safeParse({ prompt: "" }).success).toBe(false);
    expect(AiThemeRequestSchema.safeParse({ prompt: "x".repeat(501) }).success).toBe(false);
    expect(AiThemeRequestSchema.safeParse({ prompt: "neon cyber" }).success).toBe(true);
  });
});

describe("generateAiTheme", () => {
  it("returns a simulated cyber theme without a Gemini key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await generateAiTheme(AiThemeRequestSchema.parse({ prompt: "neon cyber grid" }));

    expect(result.status).toBe("simulated");
    expect(result.theme.id).toMatch(/^ai_theme_/);
    expect(result.theme.name).toBe("Synthwave Matrix Grid");
    expect(result.theme.category).toBe("Vaporwave");
    expect(result.theme.cost).toBe(150);
    expect(result.theme.particleDemo.length).toBeGreaterThan(0);

    vi.unstubAllEnvs();
  });

  it("returns a generic simulated theme for arbitrary prompts", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await generateAiTheme(AiThemeRequestSchema.parse({ prompt: "midnight baseball lab" }));

    expect(result.status).toBe("simulated");
    expect(result.theme.name).toContain("Quantum");
    expect(result.theme.description).toContain("midnight baseball lab");
    expect(result.theme.customAIPhrase.length).toBeLessThanOrEqual(100);

    vi.unstubAllEnvs();
  });
});
