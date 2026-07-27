import type { CreatorProofProfile } from "../types";

export async function syncAnalyticsProfile(
  userId: string,
  profile: CreatorProofProfile
) {
  const { identifyUser } = await import("./analytics");

  identifyUser(userId, {
    username: profile.username,
    handle: profile.handle,
    verified: profile.verified,

    win_rate: profile.winRate,
    total_picks: profile.totalPicks,
    won_picks: profile.wonPicks,
    units_tracked: profile.unitsTracked,
    units_net_profit: profile.unitsNetProfit,

    subscription_tier: profile.subscriptionTier ?? "BASIC",

    onboarding_complete:
      localStorage.getItem("vouchedge_onboarding_complete") === "true",

    role: profile.role ?? profile.userRole ?? null,
    is_admin: profile.isAdmin ?? profile.admin ?? false,
  });
}
