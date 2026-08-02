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

  async generateStructured(options: GenerateStructuredOptions<any>) {
    return generateStructured(options);
  },
};
