import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient";

export type RelationshipType = "follow" | "tail" | "subscribe";
export type SocialGraphBucket = "all" | "following" | "followers" | "friends" | "subscribers" | "tailing";

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
  posts?: number;
}

interface SocialGraphResponse {
  summary: SocialGraphSummary;
  entries: SocialGraphEntry[];
}

interface FollowResponse {
  relationship_type: RelationshipType;
  notify_enabled: boolean;
  notifications_enabled: boolean;
}

function entryKey(entry: Pick<SocialGraphEntry, "profileId" | "capperId" | "username">): string {
  if (entry.profileId) return `profile:${entry.profileId}`;
  if (entry.capperId) return `capper:${entry.capperId}`;
  return `username:${entry.username}`;
}

export function useSocialGraph(userId: string | null) {
  const [summary, setSummary] = useState<SocialGraphSummary>({
    followers: 0,
    following: 0,
    friends: 0,
    subscribers: 0,
    tailing: 0,
  });
  const [entries, setEntries] = useState<SocialGraphEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (bucket: SocialGraphBucket = "all") => {
    if (!userId) {
      setEntries([]);
      setSummary({ followers: 0, following: 0, friends: 0, subscribers: 0, tailing: 0 });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [graphData, followingData] = await Promise.all([
        apiClient.get<SocialGraphResponse>("/api/social/graph", { query: { bucket } }),
        apiClient.get<{
          follows?: Array<{
            following_profile_id?: string | null;
            following_capper_id?: string | null;
            relationship_type?: RelationshipType;
            notify_enabled?: boolean;
            is_friend?: boolean;
            created_at?: string;
          }>;
          summary?: SocialGraphSummary;
        }>("/api/following"),
      ]);

      setSummary(graphData.summary ?? followingData.summary ?? {
        followers: 0,
        following: 0,
        friends: 0,
        subscribers: 0,
        tailing: 0,
      });

      if (bucket === "all") {
        const outgoing = (followingData.follows ?? []).map((row) => ({
          profileId: row.following_profile_id ?? null,
          capperId: row.following_capper_id ?? null,
          username: String((row as { username?: string }).username ?? row.following_profile_id ?? row.following_capper_id ?? "creator"),
          displayName: String((row as { display_name?: string }).display_name ?? (row as { username?: string }).username ?? "Creator"),
          avatarUrl: null,
          relationshipType: (row.relationship_type ?? "follow") as RelationshipType,
          notifyEnabled: row.notify_enabled !== false,
          isFriend: Boolean(row.is_friend),
          followedAt: String(row.created_at ?? new Date().toISOString()),
        }));
        setEntries(outgoing.length > 0 ? outgoing : (graphData.entries ?? []));
      } else {
        setEntries(graphData.entries ?? []);
      }
    } catch (err: any) {
      console.error("[useSocialGraph] load failed", err);
      setError(err?.message ?? "Failed to load social graph.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh("all");
  }, [refresh]);

  const entryMap = useMemo(() => {
    const map = new Map<string, SocialGraphEntry>();
    for (const entry of entries) {
      map.set(entryKey(entry), entry);
    }
    return map;
  }, [entries]);

  const findEntry = useCallback((input: { profileId?: string | null; username?: string | null }) => {
    if (input.profileId) {
      const hit = entryMap.get(`profile:${input.profileId}`);
      if (hit) return hit;
    }
    if (input.username) {
      return entries.find((entry) => entry.username === input.username) ?? null;
    }
    return null;
  }, [entries, entryMap]);

  const isFollowingUser = useCallback((input: { profileId?: string | null; username?: string | null }) => {
    const entry = findEntry(input);
    return Boolean(entry);
  }, [findEntry]);

  const isTailingUser = useCallback((input: { profileId?: string | null; username?: string | null }) => {
    const entry = findEntry(input);
    return entry?.relationshipType === "tail";
  }, [findEntry]);

  const isFriendWith = useCallback((input: { profileId?: string | null; username?: string | null }) => {
    const entry = findEntry(input);
    return Boolean(entry?.isFriend);
  }, [findEntry]);

  const followProfile = useCallback(async (input: {
    profileId: string;
    relationshipType?: RelationshipType;
  }) => {
    const data = await apiClient.post<FollowResponse>("/api/follow", {
      following_profile_id: input.profileId,
      relationship_type: input.relationshipType ?? "follow",
      notify_enabled: true,
    });
    await refresh("all");
    return data;
  }, [refresh]);

  const followCapper = useCallback(async (input: {
    capperId: string;
    relationshipType?: RelationshipType;
  }) => {
    const data = await apiClient.post<FollowResponse>("/api/follow", {
      following_capper_id: input.capperId,
      relationship_type: input.relationshipType ?? "follow",
      notify_enabled: true,
    });
    await refresh("all");
    return data;
  }, [refresh]);

  const unfollowProfile = useCallback(async (profileId: string) => {
    await apiClient.delete("/api/follow", { following_profile_id: profileId });
    await refresh("all");
  }, [refresh]);

  const unfollowCapper = useCallback(async (capperId: string) => {
    await apiClient.delete("/api/follow", { following_capper_id: capperId });
    await refresh("all");
  }, [refresh]);

  const tailParlay = useCallback(async (input: { pickId: string; sourcePostId?: string | null }) => {
    const data = await apiClient.post<{ parlay: Record<string, unknown>; tailedPickId: string }>(
      `/api/parlays/${encodeURIComponent(input.pickId)}/tail`,
      { source_post_id: input.sourcePostId ?? null },
    );
    await refresh("all");
    return data;
  }, [refresh]);

  const followingUsernames = useMemo(
    () => entries.filter((entry) => entry.profileId || entry.capperId).map((entry) => entry.username),
    [entries],
  );

  const tailingUsernames = useMemo(
    () => entries.filter((entry) => entry.relationshipType === "tail").map((entry) => entry.username),
    [entries],
  );

  const friendUsernames = useMemo(
    () => entries.filter((entry) => entry.isFriend).map((entry) => entry.username),
    [entries],
  );

  const subscriberUsernames = useMemo(
    () => entries.filter((entry) => entry.relationshipType === "subscribe").map((entry) => entry.username),
    [entries],
  );

  return {
    summary,
    entries,
    loading,
    error,
    refresh,
    findEntry,
    isFollowingUser,
    isTailingUser,
    isFriendWith,
    followProfile,
    followCapper,
    unfollowProfile,
    unfollowCapper,
    tailParlay,
    followingUsernames,
    tailingUsernames,
    friendUsernames,
    subscriberUsernames,
  };
}

export function useProfileSocialStats(profileId: string | null | undefined) {
  const [stats, setStats] = useState<SocialGraphSummary & { posts: number }>({
    followers: 0,
    following: 0,
    friends: 0,
    subscribers: 0,
    tailing: 0,
    posts: 0,
  });

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    void apiClient
      .get<SocialGraphSummary & { posts: number }>(`/api/profile/${encodeURIComponent(profileId)}/stats`)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        console.warn("[useProfileSocialStats] load failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  return stats;
}
