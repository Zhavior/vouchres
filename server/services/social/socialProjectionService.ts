import { getSupabaseAdmin, supabaseAdmin } from "../../middleware/auth";
import { hasActiveMembershipForFollower, loadCreatorBusinessBrandSettingsByProfileIds } from "../business/creatorBusinessService";
import { getProfileSocialStats } from "./followService";

export interface SubscriberChannelProjection {
  following: {
    profileIds: string[];
    capperIds: string[];
  };
  cappers: Array<Record<string, unknown>>;
  profiles: Array<Record<string, unknown>>;
  owner_profile_id: string;
}

export interface ProfileSocialProjection {
  profileId: string;
  summary: Awaited<ReturnType<typeof getProfileSocialStats>>;
}

export async function loadFollowingTargetIds(userId: string): Promise<{ profileIds: string[]; capperIds: string[] }> {
  const { data, error } = await supabaseAdmin
    .from("follows")
    .select("following_profile_id, following_capper_id")
    .eq("follower_id", userId);

  if (error) throw error;

  const profileIds = (data ?? [])
    .map((row: { following_profile_id?: string | null }) => row.following_profile_id)
    .filter(Boolean) as string[];
  const capperIds = (data ?? [])
    .map((row: { following_capper_id?: string | null }) => row.following_capper_id)
    .filter(Boolean) as string[];

  return { profileIds, capperIds };
}

export async function buildSubscriberChannelsProjection(userId: string): Promise<SubscriberChannelProjection> {
  const following = await loadFollowingTargetIds(userId);

  const [cappersRes, profilesRes] = await Promise.all([
    supabaseAdmin
      .from("cappers")
      .select("id, display_name, tagline, persona, is_demo, is_active, created_at")
      .eq("is_active", true)
      .order("display_name", { ascending: true }),
    following.profileIds.length > 0
      ? supabaseAdmin
          .from("profiles")
          .select("id, handle, username, display_name, avatar_url, bio, trust_score, total_picks, won_picks, lost_picks")
          .in("id", following.profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (cappersRes.error) throw cappersRes.error;
  if (profilesRes.error) throw profilesRes.error;

  const profileIds = (profilesRes.data ?? []).map((profile: { id: string }) => String(profile.id));
  const businessBrandSettingsByProfileId = await loadCreatorBusinessBrandSettingsByProfileIds(
    profileIds,
  );
  const { data: profileBusinessRows, error: profileBusinessError } = profileIds.length > 0
    ? await supabaseAdmin
        .from("creator_businesses")
        .select("id, owner_profile_id")
        .in("owner_profile_id", profileIds)
    : { data: [], error: null };

  if (profileBusinessError) throw profileBusinessError;

  const businessIds = (profileBusinessRows ?? []).map((row: { id: string }) => String(row.id));
  const { data: membershipRows, error: membershipError } = businessIds.length > 0
    ? await supabaseAdmin
        .from("creator_business_memberships")
        .select("business_id, status")
        .in("business_id", businessIds)
        .in("status", ["active", "trialing"])
    : { data: [], error: null };

  if (membershipError) throw membershipError;

  const businessIdByProfileId = new Map<string, string>(
    (profileBusinessRows ?? []).map((row: { owner_profile_id: string; id: string }) => [String(row.owner_profile_id), String(row.id)]),
  );
  const membershipCountByBusinessId = (membershipRows ?? []).reduce((acc: Record<string, number>, row: { business_id?: string | null }) => {
    const key = String(row.business_id ?? "");
    if (!key) return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const capperIds = (cappersRes.data ?? []).map((capper: { id: string }) => capper.id);
  const { data: capperFollowCounts, error: capperFollowCountsError } = capperIds.length > 0
    ? await supabaseAdmin
        .from("follows")
        .select("following_capper_id")
        .in("following_capper_id", capperIds)
    : { data: [], error: null };

  if (capperFollowCountsError) throw capperFollowCountsError;

  const followerCountByCapper = (capperFollowCounts ?? []).reduce((acc: Record<string, number>, row: { following_capper_id?: string | null }) => {
    const key = String(row.following_capper_id ?? "");
    if (!key) return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    following,
    cappers: (cappersRes.data ?? []).map((capper: Record<string, unknown>) => ({
      ...capper,
      follower_count: followerCountByCapper[String(capper.id)] ?? 0,
      is_following: following.capperIds.includes(String(capper.id)),
    })),
    profiles: (profilesRes.data ?? []).map((profile: Record<string, unknown>) => ({
      ...profile,
      capper_settings: businessBrandSettingsByProfileId.get(String(profile.id)) ?? null,
      subscriber_count: membershipCountByBusinessId[businessIdByProfileId.get(String(profile.id)) ?? ""] ?? 0,
    })),
    owner_profile_id: userId,
  };
}

export async function buildProfileSocialProjection(profileId: string): Promise<ProfileSocialProjection> {
  const summary = await getProfileSocialStats(profileId);
  return {
    profileId,
    summary,
  };
}

export async function canViewerAccessProfileSubscriberContent(viewerId: string, profileId: string): Promise<boolean> {
  if (viewerId === profileId) return true;
  const hasMembership = await hasActiveMembershipForFollower({
    ownerProfileId: profileId,
    followerProfileId: viewerId,
  }).catch(() => false);
  if (hasMembership) return true;
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("following_profile_id", profileId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function canViewerAccessCapperSubscriberContent(viewerId: string, capperId: string): Promise<boolean> {
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("following_capper_id", capperId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
