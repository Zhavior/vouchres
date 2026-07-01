import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "../_utils/auth.js";
import { getStripePriceMatrix, getTierEntitlements, normalizeSubscriptionTier } from "../../server/services/billing/tierConfig.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, client, error } = await requireUser(req);
  if (!user || !client) {
    return res.status(401).json({ error, warnings: [error ?? "unauthorized"] });
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed", warnings: ["Use GET for this endpoint."] });
  }

  const profileResult = await client
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();
  const profileTier = profileResult.data?.tier ?? "free";

  const { data: sub, error: subError } = await client
    .from("subscriptions")
    .select("tier, status, current_period_start, current_period_end, cancel_at_period_end, stripe_price_id")
    .eq("profile_id", user.id)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const entitlements = getTierEntitlements(profileTier);
  const normalized = normalizeSubscriptionTier(profileTier);
  const warnings = [
    ...entitlements.warnings,
    profileResult.error ? `profile lookup failed: ${profileResult.error.message}` : null,
    subError ? `subscription lookup failed: ${subError.message}` : null,
  ].filter(Boolean);

  return res.status(200).json({
    tier: entitlements.tier,
    legacyTier: normalized.sourceTier !== entitlements.tier ? normalized.sourceTier : null,
    monthlyCustomizationPoints: entitlements.monthlyCustomizationPoints,
    canUseProGraphs: entitlements.canUseProGraphs,
    canUseTeamMatchupLab: entitlements.canUseTeamMatchupLab,
    canUsePlayerEdgeLab: entitlements.canUsePlayerEdgeLab,
    canAccessNotifications: entitlements.canAccessNotifications,
    status: sub?.status ?? (profileTier === "free" ? "free" : "active"),
    currentPeriodStart: sub?.current_period_start ?? null,
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    subscription: sub ?? null,
    prices: getStripePriceMatrix(),
    warnings,
  });
}
