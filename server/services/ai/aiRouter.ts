import type {
  AIProvider,
  GenerateStructuredOptions,
  GenerateTextOptions,
} from "./provider";

import { getProvider } from "./providers";

const DEFAULT_PROVIDER = process.env.AI_PROVIDER ?? "gemini";

export function getActiveProvider(): AIProvider {
  return getProvider(DEFAULT_PROVIDER);
}

export async function generateText(
  options: GenerateTextOptions,
) {
  return getActiveProvider().generateText(options);
}

export async function generateStructured<TSchema extends import("zod").ZodTypeAny>(
  options: GenerateStructuredOptions<TSchema>,
) {
  return getActiveProvider().generateStructured(options);
}
