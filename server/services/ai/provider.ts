import type { z } from "zod";

export type AIProviderName =
  | "gemini"
  | "openrouter"
  | "groq"
  | "cerebras";

export type AIStatus =
  | "live"
  | "cached"
  | "fallback"
  | "no-key";

export interface GenerateTextOptions {
  cacheKey: string;
  prompt: string;
  systemInstruction?: string;
  fallback: string;
  ttlMs?: number;
}

export interface GenerateStructuredOptions<TSchema extends z.ZodTypeAny> {
  cacheKey: string;
  prompt: string;
  schema: TSchema;
  fallback: z.infer<TSchema>;
  systemInstruction?: string;
  model?: string;
}

export interface TextResult {
  text: string;
  status: AIStatus;
}

export interface StructuredResult<T> {
  data: T;
  status: AIStatus;
  model: string;
}

export interface AIProvider {
  readonly name: AIProviderName;

  generateText(
    options: GenerateTextOptions,
  ): Promise<TextResult>;

  generateStructured<TSchema extends z.ZodTypeAny>(
    options: GenerateStructuredOptions<TSchema>,
  ): Promise<StructuredResult<z.infer<TSchema>>>;
}
