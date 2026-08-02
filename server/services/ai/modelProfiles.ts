export type AIModelProfile =
  | "fast"
  | "balanced"
  | "reasoning"
  | "creative";

export interface ModelProfile {
  provider: string;
  model: string;
}

export const MODEL_PROFILES: Record<AIModelProfile, ModelProfile> = {
  fast: {
    provider: "openrouter",
    model: "openai/gpt-4.1-mini",
  },

  balanced: {
    provider: "openrouter",
    model: "openai/gpt-5.5",
  },

  reasoning: {
    provider: "openrouter",
    model: "anthropic/claude-sonnet-4",
  },

  creative: {
    provider: "openrouter",
    model: "google/gemini-2.5-flash",
  },
};

export function getModelProfile(profile: AIModelProfile): ModelProfile {
  return MODEL_PROFILES[profile];
}
