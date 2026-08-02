import type {
  AIProvider,
  GenerateStructuredOptions,
  GenerateTextOptions,
} from "../provider";

import {
  generateStructured,
  generateText,
} from "../geminiClient";

export const geminiProvider: AIProvider = {
  name: "gemini",

  async generateText(options: GenerateTextOptions) {
    return generateText(options);
  },

  async generateStructured<TSchema extends import("zod").ZodTypeAny>(
    options: GenerateStructuredOptions<TSchema>,
  ) {
    return generateStructured(options);
  },
};
