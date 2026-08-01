export interface AppConfig {
  trustProxy: number;
}

export const appConfig: AppConfig = {
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
};

export default appConfig;
