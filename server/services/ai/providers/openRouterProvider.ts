import OpenAI from "openai";

import type {
  AIProvider,
  GenerateStructuredOptions,
  GenerateTextOptions,
  StructuredResult,
  TextResult,
} from "../provider";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ??
  "openai/gpt-4.1-mini";

export const openRouterProvider: AIProvider = {
  name: "openrouter",

  async generateText(
    options: GenerateTextOptions,
  ): Promise<TextResult> {
    if (!process.env.OPENROUTER_API_KEY) {
      return {
        text: options.fallback,
        status: "no-key",
      };
    }

    try {
      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: 0.2,
        messages: [
          ...(options.systemInstruction
            ? [{
                role: "system" as const,
                content: options.systemInstruction,
              }]
            : []),
          {
            role: "user" as const,
            content: options.prompt,
          },
        ],
      });

      return {
        text: response.choices[0]?.message?.content ?? options.fallback,
        status: "live",
      };
    } catch {
      return {
        text: options.fallback,
        status: "fallback",
      };
    }
  },

  async generateStructured<TSchema extends import("zod").ZodTypeAny>(
    options: GenerateStructuredOptions<TSchema>,
  ): Promise<StructuredResult<import("zod").infer<TSchema>>> {
    return {
      data: options.fallback,
      status: "fallback",
      model: DEFAULT_MODEL,
    };
  },
};
