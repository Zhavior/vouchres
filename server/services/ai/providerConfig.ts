import { appConfig } from "../../platform/config/appConfig";
import type { AIProviderName } from "./provider";

export interface AIProviderConfig {
  provider: AIProviderName;

  gemini: {
    apiKey?: string;
    model: string;
  };

  openRouter: {
    apiKey?: string;
    model: string;
    baseUrl: string;
  };

  groq: {
    apiKey?: string;
    model: string;
    baseUrl: string;
  };

  cerebras: {
    apiKey?: string;
    model: string;
    baseUrl: string;
  };
}

export const providerConfig: AIProviderConfig = {
  provider: (process.env.AI_PROVIDER as AIProviderName) ?? "gemini",

  gemini: {
    apiKey: appConfig.gemini.apiKey,
    model: appConfig.gemini.model,
  },

  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL ?? "openai/gpt-5",
    baseUrl: "https://openrouter.ai/api/v1",
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
    baseUrl: "https://api.groq.com/openai/v1",
  },

  cerebras: {
    apiKey: process.env.CEREBRAS_API_KEY,
    model: process.env.CEREBRAS_MODEL ?? "llama-4-scout-17b-16e-instruct",
    baseUrl: "https://api.cerebras.ai/v1",
  },
};
