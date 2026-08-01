export interface AppConfig {
  trustProxy: number;

  gemini: {
    apiKey?: string;
    model: string;
    brainModel: string;
    dailyStructuredLimit: number;
  };
}

export const appConfig: AppConfig = {
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
    brainModel:
      process.env.GEMINI_BRAIN_MODEL ?? "gemini-3.1-flash-lite",
    dailyStructuredLimit: Number(
      process.env.GEMINI_BRAIN_DAILY_LIMIT ?? 12
    ),
  },
};

export default appConfig;
