import { GoogleGenAI } from "@google/genai";
import type { AiChatInput } from "../../validators/aiSchemas";

export interface AiChatResponse {
  status: "success" | "no-key";
  text: string;
}

const DEFAULT_SYSTEM_INSTRUCTION =
  "You are a master Silicon Valley Web Designer, UI Improver, and AI Studio Skill companion. Provide elegant, professional advice on colors, negative space, typography, and responsive Tailwind UI design, paired with code snippets.";

const NO_KEY_TEXT =
  "Welcome to the VouchEdge AI Design Studio.\n\nNo GEMINI_API_KEY was detected in the current server environment, so this endpoint is running in local guidance mode. Add GEMINI_API_KEY to enable live Gemini responses.";

export async function generateAiChatResponse(input: AiChatInput): Promise<AiChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: "no-key",
      text: NO_KEY_TEXT,
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "vouchedge-backend",
      },
    },
  });

  const contents = input.messages.map((message) => ({
    role: message.role === "assistant" ? "model" : message.role,
    parts: [{ text: message.content }],
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents,
    config: {
      systemInstruction: input.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
    },
  });

  return {
    status: "success",
    text: response.text || "No response received",
  };
}
