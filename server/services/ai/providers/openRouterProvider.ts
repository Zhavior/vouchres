import type {
  AIProvider,
  GenerateStructuredOptions,
  GenerateTextOptions,
} from "../provider";

export const openRouterProvider: AIProvider = {
  name: "openrouter",

  async generateText(
    _options: GenerateTextOptions,
  ) {
    throw new Error(
      "OpenRouter provider not implemented yet.",
    );
  },

  async generateStructured<
    TSchema extends import("zod").ZodTypeAny,
  >(
    _options: GenerateStructuredOptions<TSchema>,
  ) {
    throw new Error(
      "OpenRouter provider not implemented yet.",
    );
  },
};
