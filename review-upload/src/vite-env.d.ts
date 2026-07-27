/// <reference types="vite/client" />

declare const __APP_BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENV?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
