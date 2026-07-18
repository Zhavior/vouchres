import { getSupabaseAdmin } from "../../middleware/auth";
import { assertUuid } from "../../lib/uuid";
import {
  createFollowedActivityNotification,
  createNewFollowerNotification,
  ensureFollowAlertsEnabled,
} from "../notifications/notificationService";
import {
  cancelMembershipForFollower,
  ensureActiveMembershipForFollower,
} from "../business/creatorBusinessService";
import { socialOutboxRepository } from "../../repositories/socialOutboxRepository";

export type RelationshipType = "follow" | "tail" | "subscribe";
export type SocialGraphBucket = "all" | "following" | "followers" | "friends" | "subscribers" | "tailing";

type FollowRow = {
  follower_id: string;
  following_profile_id: string | null;
  following_capper_id: string | null;
  relationship_type: string;
  notify_enabled: boolean;
  created_at: string;
};

export interface SocialGraphEntry {
  profileId: string | null;
  capperId: string | null;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  relationshipType: RelationshipType;
  notifyEnabled: boolean;
  isFriend: boolean;
  followedAt: string;
}

export interface SocialGraphSummary {
  followers: number;
  following: number;
  friends: number;
  subscribers: number;
  tailing: number;
}

export interface SuggestedSocialProfile {
  profileId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  mutualCount: number;
  followerCount: number;
  postCount: number;
  reason: string;
}

const MISSING_COLUMN_CODES = new Set(["42703", "PGRST204"]);

function missingColumn(error: unknown): boolean {
  return MISSING_COLUMN_CODES.has(String((error as { code?: unknown })?.code ?? ""));
}

function normalizeRelationshipType(value: unknown): RelationshipType {
  const raw = String(value ?? "follow").trim().toLowerCase();
  if (raw === "tail" || raw === "subscribe") return raw;
  return "follow";
}

async function admin() {
  return getSupabaseAdmin();
}

async function loadFollowRowsForUser(userId: string): Promise<FollowRow[]> {
  const safeUserId = assertUuid(userId, "userId");
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("follows")
    .select("follower_id, following_profile_id, following_capper_id, relationship_type, notify_enabled, created_at")
    .or(`follower_id.eq.${safeUserId},following_profile_id.eq.${safeUserId}`);

  if (error) {
    if (missingColumn(error)) {
      const fallback = await supabaseAdmin
        .from("follows")
        .select("follower_id, following_profile_id, following_capper_id, created_at")
        .or(`follower_id.eq.${safeUserId},following_profile_id.eq.${safeUserId}`);
      if (fallback.error) throw fallback.error;
      return (fallback.data ?? []).map((row: Record<string, unknown>) => ({
        follower_id: String(row.follower_id),
        following_profile_id: row.following_profile_id ? String(row.following_profile_id) : null,
        following_capper_id: row.following_capper_id ? String(row.following_capper_id) : null,
        relationship_type: "follow",
        notify_enabled: true,
        created_at: String(row.created_at ?? new Date().toISOString()),
      }));
    }
    throw error;
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    follower_id: String(row.follower_id),
    following_profile_id: row.following_profile_id ? String(row.following_profile_id) : null,
    following_capper_id: row.following_capper_id ? String(row.following_capper_id) : null,
    relationship_type: String(row.relationship_type ?? "follow"),
    notify_enabled: row.notify_enabled !== false,
    created_at: String(row.created_at ?? new Date().toISOString()),
  }));
}

function profileIdsFollowingUser(rows: FollowRow[], userId: string): Set<string> {
  return new Set(
    rows
      .filter((row) => row.following_profile_id === userId)
      .map((row) => String(row.follower_id)),
  );
}

function profileIdsUserFollows(rows: FollowRow[], userId: string): Set<string> {
  return new Set(
    rows
      .filter((row) => row.follower_id === userId && row.following_profile_id)
      .map((row) => String(row.following_profile_id)),
  );
}

export async function upsertFollow(input: {
  followerId: string;
  followingProfileId?: string | null;
  followingCapperId?: string | null;
  relationshipType?: RelationshipType;
  notifyEnabled?: boolean;
}): Promise<{ ok: true; relationshipType: RelationshipType; notifyEnabled: boolean }> {
  const relationshipType = normalizeRelationshipType(input.relationshipType);
  const notifyEnabled = input.notifyEnabled ?? true;
  const supabaseAdmin = await admin();

  const payload: Record<string, unknown> = {
    follower_id: input.followerId,
    following_profile_id: input.followingProfileId ?? null,
    following_capper_id: input.followingCapperId ?? null,
    relationship_type: relationshipType,
    notify_enabled: notifyEnabled,
  };

  let { error } = await supabaseAdmin.from("follows").upsert(payload, {
    onConflict: "follower_id,following_profile_id,following_capper_id",
  });

  if (error && missingColumn(error)) {
    ({ error } = await supabaseAdmin.from("follows").upsert(
      {
        follower_id: input.followerId,
        following_profile_id: input.followingProfileId ?? null,
        following_capper_id: input.followingCapperId ?? null,
      },
      { onConflict: "follower_id,following_profile_id,following_capper_id" },
    ));
  }

  if (error) throw error;

  await ensureFollowAlertsEnabled(input.followerId).catch((err) => {
    console.warn("[follow] ensure alerts failed", (err as Error)?.message);
  });

  if (input.followingProfileId && input.followingProfileId !== input.followerId) {
    if (relationshipType === "subscribe") {
      await ensureActiveMembershipForFollower({
        ownerProfileId: input.followingProfileId,
        followerProfileId: input.followerId,
        source: "follow_subscribe",
      }).catch((err) => {
        console.warn("[follow] membership activate failed", (err as Error)?.message);
      });
    }

    const queued = await socialOutboxRepository.queueEvent({
      user_id: input.followingProfileId,
      event_type: "FOLLOW",
      payload: {
        followerId: input.followerId,
        followingProfileId: input.followingProfileId,
        relationshipType,
      },
    });

    // If outbox table is missing / queue fails, keep sync notification so follows still alert.
    if (!queued) {
      await createNewFollowerNotification({
        followerId: input.followerId,
        followingProfileId: input.followingProfileId,
        relationshipType,
      }).catch((err) => {
        console.warn("[follow] new follower notification failed", (err as Error)?.message);
      });
    }
  }

  return { ok: true, relationshipType, notifyEnabled };
}

export async function removeFollow(input: {
  followerId: string;
  followingProfileId?: string | null;
  followingCapperId?: string | null;
}): Promise<void> {
  const supabaseAdmin = await admin();
  const { error } = await supabaseAdmin
    .from("follows")
    .delete()
    .match({
      follower_id: input.followerId,
      following_profile_id: input.followingProfileId ?? null,
      following_capper_id: input.followingCapperId ?? null,
    });

  if (error) throw error;

  if (input.followingProfileId && input.followingProfileId !== input.followerId) {
    await cancelMembershipForFollower({
      ownerProfileId: input.followingProfileId,
      followerProfileId: input.followerId,
      source: "follow_unsubscribe",
    }).catch((err) => {
      console.warn("[follow] membership cancel failed", (err as Error)?.message);
    });
  }
}

export async function getProfileSocialStats(profileId: string): Promise<SocialGraphSummary & { posts: number }> {
  const supabaseAdmin = await admin();
  const rows = await loadFollowRowsForUser(profileId);
  const followerIds = profileIdsFollowingUser(rows, profileId);
  const followingIds = profileIdsUserFollows(rows, profileId);

  let friends = 0;
  for (const id of followerIds) {
    if (followingIds.has(id)) friends += 1;
  }

  const followers = rows.filter((row) => row.following_profile_id === profileId).length;
  const following = rows.filter((row) => row.follower_id === profileId && row.following_profile_id).length;
  const subscribers = rows.filter(
    (row) => row.following_profile_id === profileId && normalizeRelationshipType(row.relationship_type) === "subscribe",
  ).length;
  const tailing = rows.filter(
    (row) => row.follower_id === profileId && normalizeRelationshipType(row.relationship_type) === "tail",
  ).length;

  const { count: postsCount } = await supabaseAdmin
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", profileId);

  return {
    followers,
    following,
    friends,
    subscribers,
    tailing,
    posts: postsCount ?? 0,
  };
}

async function hydrateProfiles(profileIds: string[]): Promise<Map<string, Record<string, unknown>>> {
  if (profileIds.length === 0) return new Map();
  const supabaseAdmin = await admin();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, username, handle, display_name, avatar_url")
    .in("id", profileIds);
  return new Map((data ?? []).map((row: Record<string, unknown>) => [String(row.id), row]));
}

async function hydrateCappers(capperIds: string[]): Promise<Map<string, Record<string, unknown>>> {
  if (capperIds.length === 0) return new Map();
  const supabaseAdmin = await admin();
  const { data } = await supabaseAdmin
    .from("cappers")
    .select("id, display_name, tagline")
    .in("id", capperIds);
  return new Map((data ?? []).map((row: Record<string, unknown>) => [String(row.id), row]));
}

export async function getSocialGraph(input: {
  userId: string;
  bucket?: SocialGraphBucket;
}): Promise<{ summary: SocialGraphSummary; entries: SocialGraphEntry[] }> {
  const bucket = input.bucket ?? "all";
  const rows = await loadFollowRowsForUser(input.userId);
  const mutualFollowerIds = profileIdsFollowingUser(rows, input.userId);

  const outgoing = rows.filter((row) => row.follower_id === input.userId);
  const incomingProfiles = rows.filter((row) => row.following_profile_id === input.userId);

  const profileIds = [
    ...new Set([
      ...outgoing.map((row) => row.following_profile_id).filter(Boolean).map(String),
      ...incomingProfiles.map((row) => row.follower_id).filter(Boolean).map(String),
    ]),
  ] as string[];
  const capperIds = [
    ...new Set(outgoing.map((row) => row.following_capper_id).filter(Boolean).map(String)),
  ] as string[];

  const [profileMap, capperMap] = await Promise.all([
    hydrateProfiles(profileIds),
    hydrateCappers(capperIds),
  ]);

  const entries: SocialGraphEntry[] = [];
  const outgoingEntries: SocialGraphEntry[] = [];
  const incomingEntries: SocialGraphEntry[] = [];

  for (const row of outgoing) {
    const relationshipType = normalizeRelationshipType(row.relationship_type);
    if (row.following_profile_id) {
      const profile = profileMap.get(String(row.following_profile_id));
      const isFriend = mutualFollowerIds.has(String(row.following_profile_id));
      const entry: SocialGraphEntry = {
        profileId: String(row.following_profile_id),
        capperId: null,
        username: String(profile?.handle ?? profile?.username ?? row.following_profile_id),
        displayName: String(profile?.display_name ?? profile?.username ?? "Creator"),
        avatarUrl: (profile?.avatar_url as string | null) ?? null,
        relationshipType,
        notifyEnabled: Boolean(row.notify_enabled ?? true),
        isFriend,
        followedAt: String(row.created_at ?? new Date().toISOString()),
      };
      outgoingEntries.push(entry);
      entries.push(entry);
      continue;
    }

    if (row.following_capper_id) {
      const capper = capperMap.get(String(row.following_capper_id));
      const entry: SocialGraphEntry = {
        profileId: null,
        capperId: String(row.following_capper_id),
        username: String(row.following_capper_id),
        displayName: String(capper?.display_name ?? row.following_capper_id),
        avatarUrl: null,
        relationshipType,
        notifyEnabled: Boolean(row.notify_enabled ?? true),
        isFriend: false,
        followedAt: String(row.created_at ?? new Date().toISOString()),
      };
      outgoingEntries.push(entry);
      entries.push(entry);
    }
  }

  for (const row of incomingProfiles) {
    const profile = profileMap.get(String(row.follower_id));
    const relationshipType = normalizeRelationshipType(row.relationship_type);
    const entry: SocialGraphEntry = {
      profileId: String(row.follower_id),
      capperId: null,
      username: String(profile?.handle ?? profile?.username ?? row.follower_id),
      displayName: String(profile?.display_name ?? profile?.username ?? "Member"),
      avatarUrl: (profile?.avatar_url as string | null) ?? null,
      relationshipType,
      notifyEnabled: Boolean(row.notify_enabled ?? true),
      isFriend: profileIdsUserFollows(rows, input.userId).has(String(row.follower_id)),
      followedAt: String(row.created_at ?? new Date().toISOString()),
    };
    incomingEntries.push(entry);
    entries.push(entry);
  }

  let filtered: SocialGraphEntry[] = [];
  if (bucket === "following") {
    filtered = outgoingEntries;
  } else if (bucket === "followers") {
    filtered = incomingEntries;
  } else if (bucket === "friends") {
    filtered = outgoingEntries.filter((entry) => entry.isFriend);
  } else if (bucket === "subscribers") {
    filtered = incomingEntries.filter((entry) => entry.relationshipType === "subscribe");
  } else if (bucket === "tailing") {
    filtered = outgoingEntries.filter((entry) => entry.relationshipType === "tail");
  } else {
    const deduped = new Map<string, SocialGraphEntry>();
    for (const entry of entries) {
      const key = entry.profileId ? `p:${entry.profileId}` : `c:${entry.capperId}`;
      if (!deduped.has(key)) deduped.set(key, entry);
    }
    filtered = [...deduped.values()];
  }

  const summary = await getProfileSocialStats(input.userId);
  return { summary, entries: filtered };
}

export async function notifyFollowersOfAuthorPost(input: {
  authorId: string;
  postId: string;
  body: string;
  pickId?: string | null;
}): Promise<void> {
  const supabaseAdmin = await admin();
  const { data: followers, error } = await supabaseAdmin
    .from("follows")
    .select("follower_id, relationship_type, notify_enabled")
    .eq("following_profile_id", input.authorId);

  if (error) {
    if (missingColumn(error)) return;
    throw error;
  }

  const { data: author } = await supabaseAdmin
    .from("profiles")
    .select("username, display_name")
    .eq("id", input.authorId)
    .maybeSingle();

  const authorName = String(author?.display_name ?? author?.username ?? "Someone you follow");
  const snippet = input.body.trim().slice(0, 120) || "Shared a new update.";

  for (const row of followers ?? []) {
    if (row.notify_enabled === false) continue;
    await createFollowedActivityNotification({
      userId: String(row.follower_id),
      authorId: input.authorId,
      authorName,
      postId: input.postId,
      pickId: input.pickId ?? null,
      relationshipType: normalizeRelationshipType(row.relationship_type),
      message: `${authorName} posted: ${snippet}`,
    }).catch((err) => {
      console.warn("[follow] follower post notification failed", (err as Error)?.message);
    });
  }
}

export async function getRelationshipForTarget(input: {
  viewerId: string;
  profileId?: string | null;
  capperId?: string | null;
}): Promise<{
  isFollowing: boolean;
  relationshipType: RelationshipType | null;
  notifyEnabled: boolean;
  isFriend: boolean;
}> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("follows")
    .select("relationship_type, notify_enabled")
    .eq("follower_id", input.viewerId)
    .match({
      following_profile_id: input.profileId ?? null,
      following_capper_id: input.capperId ?? null,
    })
    .maybeSingle();

  if (error && !missingColumn(error)) throw error;
  if (!data) {
    return { isFollowing: false, relationshipType: null, notifyEnabled: false, isFriend: false };
  }

  let isFriend = false;
  if (input.profileId) {
    const { data: reverse } = await supabaseAdmin
      .from("follows")
      .select("follower_id")
      .eq("follower_id", input.profileId)
      .eq("following_profile_id", input.viewerId)
      .maybeSingle();
    isFriend = Boolean(reverse);
  }

  return {
    isFollowing: true,
    relationshipType: normalizeRelationshipType(data.relationship_type),
    notifyEnabled: Boolean(data.notify_enabled ?? true),
    isFriend,
  };
}

export async function getSuggestedProfiles(input: {
  userId: string;
  limit?: number;
}): Promise<SuggestedSocialProfile[]> {
  const supabaseAdmin = await admin();
  const limit = Math.min(Math.max(Number(input.limit ?? 8), 1), 24);

  const rows = await loadFollowRowsForUser(input.userId);
  const myFollowingIds = profileIdsUserFollows(rows, input.userId);
  const followerIds = profileIdsFollowingUser(rows, input.userId);

  const seedIds = [...new Set([...myFollowingIds, ...followerIds])];
  if (seedIds.length === 0) return [];

  const { data: secondDegreeRows, error: secondDegreeError } = await supabaseAdmin
    .from("follows")
    .select("follower_id, following_profile_id")
    .in("follower_id", seedIds)
    .not("following_profile_id", "is", null);

  if (secondDegreeError) throw secondDegreeError;

  const candidateMutualCounts = new Map<string, number>();
  for (const row of secondDegreeRows ?? []) {
    const candidateId = row.following_profile_id ? String(row.following_profile_id) : "";
    if (!candidateId) continue;
    if (candidateId === input.userId) continue;
    if (myFollowingIds.has(candidateId)) continue;
    candidateMutualCounts.set(candidateId, (candidateMutualCounts.get(candidateId) ?? 0) + 1);
  }

  const candidateIds = [...candidateMutualCounts.keys()];
  if (candidateIds.length === 0) return [];

  const [{ data: profiles, error: profileError }, { data: followerRows, error: followerError }, { data: postRows, error: postError }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, username, handle, display_name, avatar_url, bio")
      .in("id", candidateIds),
    supabaseAdmin
      .from("follows")
      .select("following_profile_id")
      .in("following_profile_id", candidateIds),
    supabaseAdmin
      .from("posts")
      .select("author_id")
      .in("author_id", candidateIds),
  ]);

  if (profileError) throw profileError;
  if (followerError) throw followerError;
  if (postError) throw postError;

  const followerCountByProfile = new Map<string, number>();
  for (const row of followerRows ?? []) {
    const profileId = row.following_profile_id ? String(row.following_profile_id) : "";
    if (!profileId) continue;
    followerCountByProfile.set(profileId, (followerCountByProfile.get(profileId) ?? 0) + 1);
  }

  const postCountByProfile = new Map<string, number>();
  for (const row of postRows ?? []) {
    const profileId = row.author_id ? String(row.author_id) : "";
    if (!profileId) continue;
    postCountByProfile.set(profileId, (postCountByProfile.get(profileId) ?? 0) + 1);
  }

  return (profiles ?? [])
    .map((profile: Record<string, unknown>) => {
      const profileId = String(profile.id);
      const mutualCount = candidateMutualCounts.get(profileId) ?? 0;
      const followerCount = followerCountByProfile.get(profileId) ?? 0;
      const postCount = postCountByProfile.get(profileId) ?? 0;
      const reason = mutualCount > 1
        ? `${mutualCount} mutual connections`
        : mutualCount === 1
          ? "1 mutual connection"
          : followerCount > 0
            ? `${followerCount} followers in network`
            : "Active creator";

      return {
        profileId,
        username: String(profile.handle ?? profile.username ?? profileId),
        displayName: String(profile.display_name ?? profile.username ?? "Creator"),
        avatarUrl: (profile.avatar_url as string | null) ?? null,
        bio: String(profile.bio ?? ""),
        mutualCount,
        followerCount,
        postCount,
        reason,
      } satisfies SuggestedSocialProfile;
    })
    .sort((a, b) => {
      const aScore = a.mutualCount * 100 + a.followerCount * 3 + a.postCount;
      const bScore = b.mutualCount * 100 + b.followerCount * 3 + b.postCount;
      return bScore - aScore || a.displayName.localeCompare(b.displayName);
    })
    .slice(0, limit);
}
