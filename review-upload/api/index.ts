import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let appPromise: Promise<any> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!appPromise) {
      const server = require("../dist/server.cjs");
      appPromise = Promise.resolve(server.createApp());
    }

    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error("[VERCEL_API] Express boot failed:", err?.stack || err?.message || err);
    return res.status(500).json({
      error: "vercel_api_boot_failed",
      message: err?.message || "Unknown Express boot error",
      // Booleans only — helps diagnose env visibility without leaking secrets.
      diagnostics: {
        vercel: process.env.VERCEL === "1",
        nodeEnv: process.env.NODE_ENV || null,
        sentryDsnPresent: Boolean(process.env.SENTRY_DSN?.trim()),
        viteSentryDsnPresent: Boolean(process.env.VITE_SENTRY_DSN?.trim()),
        sentryRelatedKeys: Object.keys(process.env)
          .filter((key) => /sentry/i.test(key))
          .sort(),
        supabaseUrlPresent: Boolean(
          process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim(),
        ),
        cronSecretPresent: Boolean(process.env.CRON_SECRET?.trim()),
        upstashPresent: Boolean(
          process.env.UPSTASH_REDIS_REST_URL?.trim()
          && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
        ),
      },
    });
  }
}
