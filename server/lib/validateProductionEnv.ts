import { getMissingProductionConfig } from "../services/health/backendHealthService";

/**
 * Fail fast in production when required secrets are missing.
 * Development and test runs log warnings only so local boot stays frictionless.
 *
 * Production hard-requires: Supabase, CRON_SECRET, Upstash Redis, SENTRY_DSN.
 */
export function validateProductionEnvAtBoot(): void {
  const missing = getMissingProductionConfig();
  const env = process.env.NODE_ENV || "development";

  const optionalProductionWarnings: string[] = [];
  if (env === "production") {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      optionalProductionWarnings.push("STRIPE_SECRET_KEY (billing disabled)");
    } else if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
      optionalProductionWarnings.push("STRIPE_WEBHOOK_SECRET (required when Stripe billing is enabled)");
    }
    if (!process.env.VITE_SENTRY_DSN?.trim() && !process.env.SENTRY_DSN?.trim()) {
      optionalProductionWarnings.push("VITE_SENTRY_DSN for client error capture");
    }
  }

  if (missing.length === 0) {
    if (optionalProductionWarnings.length > 0 && env === "production") {
      console.warn(
        `[boot] Production running degraded — optional env missing: ${optionalProductionWarnings.join("; ")}. ` +
          "See GET /api/health/backend productionProof checklist (staff-only).",
      );
    }
    return;
  }

  let message = `Missing required production config: ${missing.join(", ")}.`;
  if (missing.includes("SENTRY_DSN")) {
    message +=
      " Set SENTRY_DSN on the API host (Vercel → Project → Settings → Environment Variables → Production), then Redeploy." +
      " Do not use VITE_SENTRY_DSN for the server boot check.";
    if (process.env.VITE_SENTRY_DSN?.trim()) {
      message += " (VITE_SENTRY_DSN is set, but server requires SENTRY_DSN.)";
    }
  }
  if (env === "production") {
    throw new Error(message);
  }

  console.warn(`[boot] ${message}`);
  if (optionalProductionWarnings.length > 0) {
    console.warn(`[boot] Optional production env also missing: ${optionalProductionWarnings.join("; ")}`);
  }
}
