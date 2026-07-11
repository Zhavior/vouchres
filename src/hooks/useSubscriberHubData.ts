import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient";
import type { Parlay } from "../types";

export interface SubscriberAnnouncement {
  id: string;
  body: string;
  createdAt: string;
  viewCount: number;
  authorName: string;
  authorHandle: string;
}

export interface SubscriberChatMessage {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorHandle: string;
  authorId: string;
}

export type SubscriberChannelKind = "owner" | "capper" | "profile";

export interface SubscriberChannel {
  id: string;
  kind: SubscriberChannelKind;
  targetId: string;
  name: string;
  username: string;
  bio: string;
  winRate: number;
  totalPicks: number;
  subscriberCount: number;
  badge: string;
  isFollowing: boolean;
}

function channelKey(kind: SubscriberChannelKind, targetId: string): string {
  return `${kind}:${targetId}`;
}

function winRateFromStats(won: number, lost: number): number {
  const decisions = won + lost;
  return decisions > 0 ? Number(((won / decisions) * 100).toFixed(1)) : 0;
}

function mapApiPickToParlay(pick: Record<string, any>): Parlay {
  const legs = Array.isArray(pick.legs) ? pick.legs : [];
  const oddsValue = pick.odds_decimal != null ? Number(pick.odds_decimal) : 1;
  return {
    id: String(pick.id),
    title: String(pick.explanation || pick.selection || "Shared parlay"),
    legs: legs.map((leg: Record<string, any>, index: number) => ({
      id: String(leg.id ?? `${pick.id}-leg-${index}`),
      sport: String(leg.sport ?? pick.sport ?? "MLB").toUpperCase(),
      game: String(leg.event_id ?? leg.game_id ?? ""),
      market: String(leg.market ?? "prop"),
      selection: String(leg.selection ?? ""),
      odds: leg.odds_decimal != null ? Number(leg.odds_decimal) : 1,
      status: String(leg.status ?? "PENDING").toUpperCase(),
    })),
    totalOdds: oddsValue >= 2 ? `+${Math.round((oddsValue - 1) * 100)}` : String(oddsValue),
    oddsValue,
    riskTier: "MEDIUM",
    status: String(pick.status ?? "pending").toUpperCase(),
    bookie: "VouchEdge",
    wagerAmount: pick.stake_units != null ? Number(pick.stake_units) : 1,
    payoutAmount: pick.stake_units != null && oddsValue ? Number(pick.stake_units) * oddsValue : undefined,
    createdAt: String(pick.created_at ?? new Date().toISOString()),
  };
}

function mapApiPostToAnnouncement(post: Record<string, any>): SubscriberAnnouncement {
  const author = post.author ?? {};
  return {
    id: String(post.id),
    body: String(post.body ?? "").trim(),
    createdAt: String(post.created_at ?? new Date().toISOString()),
    viewCount: Number(post.view_count ?? 0),
    authorName: String(author.display_name ?? author.username ?? "Creator"),
    authorHandle: String(author.handle ?? author.username ?? author.id ?? "creator"),
  };
}

function mapApiMessage(row: Record<string, any>): SubscriberChatMessage {
  const author = row.author ?? {};
  return {
    id: String(row.id),
    body: String(row.body ?? "").trim(),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    authorName: String(author.display_name ?? author.username ?? "Member"),
    authorHandle: String(author.handle ?? author.username ?? author.id ?? "member"),
    authorId: String(author.id ?? row.author_id ?? ""),
  };
}

function channelApiPath(channel: SubscriberChannel): { kind: string; targetId: string } {
  return {
    kind: channel.kind,
    targetId: channel.targetId,
  };
}

export function useSubscriberHubData(input: {
  userId: string | null;
  displayName: string;
  username: string;
  bio: string;
  winRate: number;
  totalPicks: number;
}) {
  const [channels, setChannels] = useState<SubscriberChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [premiumParlays, setPremiumParlays] = useState<Parlay[]>([]);
  const [parlaysLoading, setParlaysLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<SubscriberAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<SubscriberChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const ownerChannelId = input.userId ? channelKey("owner", input.userId) : null;

  const refreshChannels = useCallback(async () => {
    if (!input.userId) {
      setChannels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<{
        cappers?: Array<Record<string, any>>;
        profiles?: Array<Record<string, any>>;
        following?: { capperIds?: string[]; profileIds?: string[] };
        owner_profile_id?: string;
      }>("/api/subscriber/channels");

      const followingCapperIds = new Set(data.following?.capperIds ?? []);
      const next: SubscriberChannel[] = [];

      next.push({
        id: channelKey("owner", input.userId),
        kind: "owner",
        targetId: input.userId,
        name: input.displayName || "Your Club",
        username: input.username || "you",
        bio: input.bio || "Your subscriber club channel.",
        winRate: input.winRate,
        totalPicks: input.totalPicks,
        subscriberCount: 0,
        badge: "👑 OWNER",
        isFollowing: true,
      });

      for (const capper of data.cappers ?? []) {
        const won = Number(capper.won_picks ?? 0);
        const lost = Number(capper.lost_picks ?? 0);
        next.push({
          id: channelKey("capper", String(capper.id)),
          kind: "capper",
          targetId: String(capper.id),
          name: String(capper.display_name ?? capper.id),
          username: String(capper.id),
          bio: String(capper.tagline || capper.persona || ""),
          winRate: winRateFromStats(won, lost),
          totalPicks: Number(capper.total_picks ?? 0),
          subscriberCount: Number(capper.follower_count ?? 0),
          badge: capper.is_demo ? "AI CAPPER" : "VERIFIED",
          isFollowing: followingCapperIds.has(String(capper.id)),
        });
      }

      for (const profile of data.profiles ?? []) {
        if (String(profile.id) === input.userId) continue;
        next.push({
          id: channelKey("profile", String(profile.id)),
          kind: "profile",
          targetId: String(profile.id),
          name: String(profile.display_name ?? profile.username ?? "Creator"),
          username: String(profile.handle ?? profile.username ?? profile.id),
          bio: String(profile.bio ?? ""),
          winRate: winRateFromStats(Number(profile.won_picks ?? 0), Number(profile.lost_picks ?? 0)),
          totalPicks: Number(profile.total_picks ?? 0),
          subscriberCount: 0,
          badge: "CREATOR",
          isFollowing: true,
        });
      }

      setChannels(next);
    } catch (err: any) {
      console.error("[SubscriberHub] channels load failed", err);
      setError(err?.message ?? "Failed to load subscriber channels.");
      setChannels(input.userId ? [{
        id: channelKey("owner", input.userId),
        kind: "owner",
        targetId: input.userId,
        name: input.displayName || "Your Club",
        username: input.username || "you",
        bio: input.bio || "Your subscriber club channel.",
        winRate: input.winRate,
        totalPicks: input.totalPicks,
        subscriberCount: 0,
        badge: "👑 OWNER",
        isFollowing: true,
      }] : []);
    } finally {
      setLoading(false);
    }
  }, [input.userId, input.displayName, input.username, input.bio, input.winRate, input.totalPicks]);

  useEffect(() => {
    void refreshChannels();
  }, [refreshChannels]);

  const loadChannelParlays = useCallback(async (channel: SubscriberChannel | undefined) => {
    if (!channel || !input.userId) {
      setPremiumParlays([]);
      return;
    }
    if (channel.kind === "owner") {
      setPremiumParlays([]);
      return;
    }
    if (!channel.isFollowing) {
      setPremiumParlays([]);
      return;
    }

    setParlaysLoading(true);
    try {
      const path = channel.kind === "capper"
        ? `/api/subscriber/cappers/${encodeURIComponent(channel.targetId)}/picks`
        : `/api/subscriber/profiles/${encodeURIComponent(channel.targetId)}/picks`;
      const data = await apiClient.get<{ picks?: Record<string, any>[] }>(path);
      setPremiumParlays((data.picks ?? []).map(mapApiPickToParlay));
    } catch (err) {
      console.error("[SubscriberHub] parlays load failed", err);
      setPremiumParlays([]);
    } finally {
      setParlaysLoading(false);
    }
  }, [input.userId]);

  const loadChannelAnnouncements = useCallback(async (channel: SubscriberChannel | undefined) => {
    if (!channel || !input.userId) {
      setAnnouncements([]);
      return;
    }
    if (channel.kind === "profile" && !channel.isFollowing) {
      setAnnouncements([]);
      return;
    }
    if (channel.kind === "capper" && !channel.isFollowing) {
      setAnnouncements([]);
      return;
    }

    setAnnouncementsLoading(true);
    try {
      const path = channel.kind === "owner"
        ? "/api/subscriber/me/posts"
        : channel.kind === "capper"
          ? `/api/subscriber/cappers/${encodeURIComponent(channel.targetId)}/posts`
          : `/api/subscriber/profiles/${encodeURIComponent(channel.targetId)}/posts`;
      const data = await apiClient.get<{ posts?: Record<string, any>[] }>(path);
      setAnnouncements((data.posts ?? []).map(mapApiPostToAnnouncement).filter((row) => row.body));
    } catch (err) {
      console.error("[SubscriberHub] announcements load failed", err);
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [input.userId]);

  const loadChannelMessages = useCallback(async (channel: SubscriberChannel | undefined) => {
    if (!channel || !input.userId) {
      setChatMessages([]);
      return;
    }
    if (channel.kind === "profile" && !channel.isFollowing) {
      setChatMessages([]);
      return;
    }
    if (channel.kind === "capper" && !channel.isFollowing) {
      setChatMessages([]);
      return;
    }

    setChatLoading(true);
    try {
      const { kind, targetId } = channelApiPath(channel);
      const data = await apiClient.get<{ messages?: Record<string, any>[] }>(
        `/api/subscriber/channels/${encodeURIComponent(kind)}/${encodeURIComponent(targetId)}/messages`,
      );
      setChatMessages((data.messages ?? []).map(mapApiMessage).filter((row) => row.body));
    } catch (err) {
      console.error("[SubscriberHub] chat load failed", err);
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  }, [input.userId]);

  const sendChannelMessage = useCallback(async (channel: SubscriberChannel | undefined, body: string) => {
    if (!channel || !input.userId) {
      throw new Error("Select a channel to chat.");
    }
    const trimmed = body.trim();
    if (!trimmed) {
      throw new Error("Message cannot be empty.");
    }
    const { kind, targetId } = channelApiPath(channel);
    await apiClient.post(
      `/api/subscriber/channels/${encodeURIComponent(kind)}/${encodeURIComponent(targetId)}/messages`,
      { body: trimmed },
    );
    await loadChannelMessages(channel);
  }, [input.userId, loadChannelMessages]);

  const publishAnnouncement = useCallback(async (body: string) => {
    if (!input.userId) {
      throw new Error("Sign in to publish announcements.");
    }
    const trimmed = body.trim();
    if (!trimmed) {
      throw new Error("Announcement text is required.");
    }
    await apiClient.post("/api/posts", { body: trimmed });
  }, [input.userId]);

  const followChannel = useCallback(async (channel: SubscriberChannel) => {
    if (!input.userId || channel.kind === "owner") return;
    const body = channel.kind === "capper"
      ? { following_capper_id: channel.targetId }
      : { following_profile_id: channel.targetId };
    await apiClient.post("/api/follow", body);
    await refreshChannels();
  }, [input.userId, refreshChannels]);

  const unfollowChannel = useCallback(async (channel: SubscriberChannel) => {
    if (!input.userId || channel.kind === "owner") return;
    const body = channel.kind === "capper"
      ? { following_capper_id: channel.targetId }
      : { following_profile_id: channel.targetId };
    await apiClient.delete("/api/follow", body);
    await refreshChannels();
  }, [input.userId, refreshChannels]);

  const subscribedChannelIds = useMemo(
    () => channels.filter((channel) => channel.isFollowing).map((channel) => channel.id),
    [channels],
  );

  return {
    channels,
    loading,
    error,
    ownerChannelId,
    subscribedChannelIds,
    premiumParlays,
    parlaysLoading,
    announcements,
    announcementsLoading,
    chatMessages,
    chatLoading,
    loadChannelParlays,
    loadChannelAnnouncements,
    loadChannelMessages,
    sendChannelMessage,
    publishAnnouncement,
    followChannel,
    unfollowChannel,
    refreshChannels,
  };
}
