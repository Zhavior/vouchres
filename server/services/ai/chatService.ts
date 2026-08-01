import type { AiChatInput } from "../../validators/aiSchemas";
import { generateText, hasGeminiKey } from "./geminiClient";

export interface AiChatResponse {
  status: "success" | "no-key";
  text: string;
}

const DEFAULT_SYSTEM_INSTRUCTION =
  "You are a master Silicon Valley Web Designer, UI Improver, and AI Studio Skill companion. Provide elegant, professional advice on colors, negative space, typography, and responsive Tailwind UI design, paired with code snippets.";

const NO_KEY_TEXT =
  "Welcome to the VouchEdge AI Design Studio.\n\nNo GEMINI_API_KEY was detected in the current server environment, so this endpoint is running in local guidance mode. Add GEMINI_API_KEY to enable live Gemini responses.";

export async function generateAiChatResponse(
  input: AiChatInput,
): Promise<AiChatResponse> {
  if (!hasGeminiKey()) {
    return {
      status: "no-key",
      text: NO_KEY_TEXT,
    };
  }

  const prompt = input.messages
    .map((message) => {
      const role = message.role === "assistant" ? "Assistant" : "User";
      return `${role}: ${message.content}`;
    })
    .join("\n\n");

  const result = await generateText({
    cacheKey: `chat:${JSON.stringify(input.messages)}`,
    prompt,
    systemInstruction:
      input.systemInstruction ?? DEFAULT_SYSTEM_INSTRUCTION,
    fallback: "No response received",
  });

  return {
    status: "success",
    text: result.text,
  };
}
