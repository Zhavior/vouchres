import { getMissingProductionConfig } from "../services/health/backendHealthService";

/**
 * Fail fast in production when required secrets are missing.
 * Development and test runs log warnings only so local boot stays frictionless.
 */
export function validateProductionEnvAtBoot(): void {
  const missing = getMissingProductionConfig();
  if (missing.length === 0) return;

  const message = `Missing required production config: ${missing.join(", ")}.`;
  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(`[boot] ${message}`);
}
