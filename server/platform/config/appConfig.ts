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

export function parseTrustProxy(raw: string | undefined): number {
  const value = (raw ?? "1").trim();
  if (!/^\d+$/.test(value)) {
    throw new Error("TRUST_PROXY must be an integer string such as 0, 1, or 2.");
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 8) {
    throw new Error("TRUST_PROXY must be an integer between 0 and 8.");
  }

  return parsed;
}

export const appConfig: AppConfig = {
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),

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
