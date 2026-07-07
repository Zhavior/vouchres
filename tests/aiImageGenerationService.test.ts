import { describe, expect, it, vi } from "vitest";
import { generateAiImage } from "../server/services/ai/imageGenerationService";
import { AiImageRequestSchema } from "../server/validators/aiSchemas";

describe("AiImageRequestSchema", () => {
  it("requires a bounded prompt and supported aspect ratio", () => {
    expect(AiImageRequestSchema.safeParse({ prompt: "", aspectRatio: "1:1" }).success).toBe(false);
    expect(AiImageRequestSchema.safeParse({ prompt: "x".repeat(1001), aspectRatio: "1:1" }).success).toBe(false);
    expect(AiImageRequestSchema.safeParse({ prompt: "sports card", aspectRatio: "2:1" }).success).toBe(false);
    expect(AiImageRequestSchema.safeParse({ prompt: "sports card", aspectRatio: "16:9" }).success).toBe(true);
  });

  it("defaults prompt and aspect ratio when fields are omitted", () => {
    const parsed = AiImageRequestSchema.parse({});
    expect(parsed.prompt).toContain("sports UI");
    expect(parsed.aspectRatio).toBe("1:1");
  });
});

describe("generateAiImage", () => {
  it("returns no-key response without calling Gemini when no key is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const response = await generateAiImage(AiImageRequestSchema.parse({ prompt: "sports poster" }));

    expect(response.status).toBe("no-key");
    expect(response.error).toContain("GEMINI_API_KEY");

    vi.unstubAllEnvs();
  });
});
