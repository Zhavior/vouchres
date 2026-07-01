import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseConfigured = Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)
  );
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  const stripePricesConfigured = Boolean(
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID &&
      process.env.STRIPE_PRO_YEARLY_PRICE_ID &&
      process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID &&
      process.env.STRIPE_CREATOR_YEARLY_PRICE_ID
  );
  const warnings = [
    !supabaseConfigured ? "Supabase public environment is not fully configured." : null,
    process.env.SUPABASE_SERVICE_ROLE_KEY ? null : "SUPABASE_SERVICE_ROLE_KEY is missing; authenticated serverless routes will reject requests.",
    !stripeConfigured ? "Stripe secret or webhook secret is not fully configured." : null,
    !stripePricesConfigured ? "One or more Stripe price IDs are missing." : null,
  ].filter(Boolean);

  res.status(200).json({
    ok: true,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "local",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || process.env.npm_package_version || "0.0.0",
    checks: {
      supabaseConfigured,
      stripeConfigured,
      stripePricesConfigured,
      mlbRoutesAvailable: true,
    },
    warnings,
    service: "VouchEdge API",
    source: "vercel-serverless",
    time: new Date().toISOString(),
  });
}
