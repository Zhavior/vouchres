import { describe, expect, it, vi } from "vitest";
import { generateAiChatResponse } from "../server/services/ai/chatService";
import { AiChatRequestSchema } from "../server/validators/aiSchemas";

describe("AiChatRequestSchema", () => {
  it("requires bounded messages", () => {
    expect(AiChatRequestSchema.safeParse({ messages: [] }).success).toBe(false);
    expect(
      AiChatRequestSchema.safeParse({
        messages: Array.from({ length: 31 }, () => ({ role: "user", content: "hello" })),
      }).success
    ).toBe(false);
  });

  it("rejects unknown message roles and empty content", () => {
    expect(AiChatRequestSchema.safeParse({ messages: [{ role: "system", content: "hello" }] }).success).toBe(false);
    expect(AiChatRequestSchema.safeParse({ messages: [{ role: "user", content: "" }] }).success).toBe(false);
  });
});

describe("generateAiChatResponse", () => {
  it("returns no-key local response without calling Gemini when no key is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const response = await generateAiChatResponse(
      AiChatRequestSchema.parse({
        messages: [{ role: "user", content: "What is VouchEdge?" }],
      })
    );

    expect(response.status).toBe("no-key");
    expect(response.text).toContain("GEMINI_API_KEY");

    vi.unstubAllEnvs();
  });
});
