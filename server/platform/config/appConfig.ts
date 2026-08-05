export interface AppConfig {
  trustProxy: number;

  gemini: {
    apiKey?: string;
    model: string;
    brainModel: string;
    dailyStructuredLimit: number;
  };

  openRouter: {
    apiKey?: string;
    model: string;
    brainModel: string;
    dailyStructuredLimit: number;
    baseUrl: string;
    siteUrl?: string;
    siteName?: string;
  };
}

export const appConfig: AppConfig = {
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    brainModel:
      process.env.GEMINI_BRAIN_MODEL ?? "gemini-2.0-flash",
    dailyStructuredLimit: Number(
      process.env.GEMINI_BRAIN_DAILY_LIMIT ?? 12,
    ),
  },

  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model:
      process.env.OPENROUTER_MODEL ??
      "google/gemini-2.5-flash",
    brainModel:
      process.env.OPENROUTER_BRAIN_MODEL ??
      "google/gemini-2.5-flash",
    dailyStructuredLimit: Number(
      process.env.OPENROUTER_DAILY_LIMIT ?? 12,
    ),
    baseUrl:
      process.env.OPENROUTER_BASE_URL ??
      "https://openrouter.ai/api/v1",
    siteUrl: process.env.OPENROUTER_SITE_URL,
    siteName: process.env.OPENROUTER_SITE_NAME,
  },
};

export default appConfig;
