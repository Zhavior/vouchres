import type { CreatorProofProfile } from "../types";
import { normalizeCapperSettings } from "./capperSettings";
import type { SubscriptionTier, UserProfile } from "./useAuth";
import { tierToSubscriptionTier } from "./subscriptionTier";

type AuthMePayload = Partial<UserProfile> & Record<string, unknown>;

/** Map /api/auth/me snake_case payload into the frontend CreatorProofProfile shape. */
export function mapAuthMeToCreatorProof(
  data: AuthMePayload,
  current?: CreatorProofProfile,
): CreatorProofProfile {
  const handle = String(data.handle ?? data.username ?? current?.handle ?? current?.username ?? "");
  const username = String(data.username ?? handle);
  const totalPicks = Number(data.total_picks ?? current?.totalPicks ?? 0);
  const wonPicks = Number(data.won_picks ?? current?.wonPicks ?? 0);

  return {
    displayName: String(data.display_name ?? current?.displayName ?? handle),
    username,
    handle,
    avatarUrl: String(data.avatar_url ?? current?.avatarUrl ?? ""),
    headerUrl: String(data.header_url ?? current?.headerUrl ?? ""),
    bio: String(data.bio ?? current?.bio ?? ""),
    verified: Boolean(data.is_staff ?? current?.verified ?? false),
    winRate: totalPicks > 0 ? (wonPicks / totalPicks) * 100 : (current?.winRate ?? 0),
    totalPicks,
    wonPicks,
    unitsTracked: Number(data.net_units ?? current?.unitsTracked ?? 0),
    unitsNetProfit: Number(data.net_units ?? current?.unitsNetProfit ?? 0),
    subscriptionTier: tierToSubscriptionTier(data.tier),
    activeTheme: current?.activeTheme,
    boughtThemes: current?.boughtThemes,
    appThemeId: current?.appThemeId,
    profileThemeId: current?.profileThemeId,
    profileBorderId: current?.profileBorderId,
    unlockedThemeIds: current?.unlockedThemeIds,
    unlockedBorderIds: current?.unlockedBorderIds,
    reduceMotion: current?.reduceMotion,
    equippedAt: current?.equippedAt,
    role: data.is_staff ? "staff" : current?.role,
    userRole: data.is_staff ? "staff" : current?.userRole,
    isAdmin: Boolean(data.is_staff ?? current?.isAdmin),
    admin: Boolean(data.is_staff ?? current?.admin),
    isStaff: Boolean(data.is_staff ?? current?.isStaff),
    staff: Boolean(data.is_staff ?? current?.isStaff),
    isDeveloper: current?.isDeveloper,
    discordUsername: (data.discord_username as string | null | undefined) ?? null,
    discordConnectedAt: (data.discord_connected_at as string | null | undefined) ?? null,
    discordGuildMember: Boolean(data.discord_guild_member ?? current?.discordGuildMember),
    discordBetaAccess: Boolean(data.discord_beta_access ?? current?.discordBetaAccess),
    capperSettings: normalizeCapperSettings(data.capper_settings ?? current?.capperSettings),
  };
}

export function mapAuthMeToUserProfile(data: AuthMePayload): UserProfile {
  const handle = String(data.handle ?? data.username ?? "");
  return {
    id: String(data.id ?? ""),
    email: (data.email as string | null | undefined) ?? null,
    username: String(data.username ?? handle),
    handle,
    display_name: String(data.display_name ?? handle),
    avatar_url: (data.avatar_url as string | null | undefined) ?? null,
    header_url: (data.header_url as string | null | undefined) ?? null,
    bio: String(data.bio ?? ""),
    tier: (data.tier as SubscriptionTier) ?? "free",
    trust_score: Number(data.trust_score ?? 0),
    total_picks: Number(data.total_picks ?? 0),
    won_picks: Number(data.won_picks ?? 0),
    lost_picks: Number(data.lost_picks ?? 0),
    pushed_picks: Number(data.pushed_picks ?? 0),
    net_units: Number(data.net_units ?? 0),
    age_confirmed_at: (data.age_confirmed_at as string | null | undefined) ?? null,
    jurisdiction_confirmed_at: (data.jurisdiction_confirmed_at as string | null | undefined) ?? null,
    jurisdiction: (data.jurisdiction as string | null | undefined) ?? null,
    is_staff: Boolean(data.is_staff),
    is_demo: Boolean(data.is_demo),
    discord_username: (data.discord_username as string | null | undefined) ?? null,
    discord_connected_at: (data.discord_connected_at as string | null | undefined) ?? null,
    discord_guild_member: Boolean(data.discord_guild_member),
    discord_beta_access: Boolean(data.discord_beta_access),
  };
}
