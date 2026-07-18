import { getSupabaseAdmin } from "../../middleware/auth";

const NOTE_TTL_MS = 24 * 60 * 60 * 1000;
const STORY_TTL_MS = 24 * 60 * 60 * 1000;

async function admin() {
  return getSupabaseAdmin();
}

function noteExpiresAt(): string {
  return new Date(Date.now() + NOTE_TTL_MS).toISOString();
}

function storyExpiresAt(): string {
  return new Date(Date.now() + STORY_TTL_MS).toISOString();
}

export async function listFollowedProfileIds(userId: string): Promise<string[]> {
  const supabaseAdmin = await admin();
  const { data } = await supabaseAdmin
    .from("follows")
    .select("following_profile_id")
    .eq("follower_id", userId)
    .not("following_profile_id", "is", null);
  return [...new Set((data ?? []).map((row) => String(row.following_profile_id)).filter(Boolean))];
}

async function hydrateProfiles(profileIds: string[]) {
  if (profileIds.length === 0) return new Map<string, Record<string, unknown>>();
  const supabaseAdmin = await admin();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, username, handle, display_name, avatar_url, tier")
    .in("id", profileIds);
  return new Map((data ?? []).map((row: Record<string, unknown>) => [String(row.id), row]));
}

export async function upsertStatusNote(input: {
  userId: string;
  body: string;
  emoji?: string | null;
}) {
  const supabaseAdmin = await admin();
  const payload = {
    user_id: input.userId,
    body: input.body.trim().slice(0, 120),
    emoji: input.emoji?.trim().slice(0, 8) ?? null,
    expires_at: noteExpiresAt(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin
    .from("user_status_notes")
    .upsert(payload)
    .select("user_id, body, emoji, expires_at, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function clearStatusNote(userId: string) {
  const supabaseAdmin = await admin();
  await supabaseAdmin.from("user_status_notes").delete().eq("user_id", userId);
}

export async function createStory(input: {
  userId: string;
  kind?: "text" | "image";
  body?: string | null;
  mediaUrl?: string | null;
  background?: string | null;
}) {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("user_stories")
    .insert({
      user_id: input.userId,
      kind: input.kind ?? "text",
      body: input.body?.trim().slice(0, 280) ?? null,
      media_url: input.mediaUrl ?? null,
      background: input.background?.trim().slice(0, 32) ?? "#0f172a",
      expires_at: storyExpiresAt(),
    })
    .select("id, user_id, kind, body, media_url, background, expires_at, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function markStoryViewed(input: { storyId: string; viewerId: string }) {
  const supabaseAdmin = await admin();
  await supabaseAdmin.from("story_views").upsert(
    {
      story_id: input.storyId,
      viewer_id: input.viewerId,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "story_id,viewer_id" },
  );
}

export async function buildFollowingHub(userId: string) {
  const supabaseAdmin = await admin();
  const followedIds = await listFollowedProfileIds(userId);
  const profileIds = [...new Set([userId, ...followedIds])];
  const profileMap = await hydrateProfiles(profileIds);
  const nowIso = new Date().toISOString();

  const [notesRes, storiesRes, viewsRes] = await Promise.all([
    supabaseAdmin
      .from("user_status_notes")
      .select("user_id, body, emoji, expires_at, updated_at")
      .in("user_id", profileIds)
      .gt("expires_at", nowIso),
    supabaseAdmin
      .from("user_stories")
      .select("id, user_id, kind, body, media_url, background, expires_at, created_at")
      .in("user_id", profileIds)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", userId),
  ]);

  const viewedStoryIds = new Set((viewsRes.data ?? []).map((row) => String(row.story_id)));
  const notesByUser = new Map((notesRes.data ?? []).map((row) => [String(row.user_id), row]));
  const storiesByUser = new Map<string, Record<string, unknown>[]>();

  for (const story of storiesRes.data ?? []) {
    const key = String(story.user_id);
    const bucket = storiesByUser.get(key) ?? [];
    bucket.push({
      ...story,
      viewed: viewedStoryIds.has(String(story.id)),
    });
    storiesByUser.set(key, bucket);
  }

  const people = profileIds.map((id) => {
    const profile = profileMap.get(id) ?? {};
    const stories = storiesByUser.get(id) ?? [];
    const hasUnseen = id !== userId && stories.some((story) => !story.viewed);
    return {
      userId: id,
      isSelf: id === userId,
      username: String(profile.handle ?? profile.username ?? id),
      displayName: String(profile.display_name ?? profile.username ?? "Creator"),
      avatarUrl: (profile.avatar_url as string | null) ?? null,
      note: notesByUser.get(id) ?? null,
      stories,
      hasUnseenStories: hasUnseen,
    };
  });

  people.sort((a, b) => {
    if (a.isSelf) return -1;
    if (b.isSelf) return 1;
    if (a.hasUnseenStories !== b.hasUnseenStories) return a.hasUnseenStories ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return {
    people,
    notes: people.filter((person) => person.note).map((person) => ({
      userId: person.userId,
      username: person.username,
      displayName: person.displayName,
      avatarUrl: person.avatarUrl,
      body: (person.note as { body?: string }).body ?? "",
      emoji: (person.note as { emoji?: string | null }).emoji ?? null,
      expiresAt: (person.note as { expires_at?: string }).expires_at ?? null,
      updatedAt: (person.note as { updated_at?: string }).updated_at ?? null,
      isSelf: person.isSelf,
    })),
  };
}

export async function listConversations(userId: string) {
  const supabaseAdmin = await admin();
  const { data: memberships } = await supabaseAdmin
    .from("dm_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  const conversationIds = (memberships ?? []).map((row) => String(row.conversation_id));
  if (conversationIds.length === 0) return [];

  const [{ data: allParticipants }, { data: latestMessages }] = await Promise.all([
    supabaseAdmin
      .from("dm_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds),
    supabaseAdmin
      .from("dm_messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  const otherUserIds = [
    ...new Set(
      (allParticipants ?? [])
        .filter((row) => String(row.user_id) !== userId)
        .map((row) => String(row.user_id)),
    ),
  ];
  const profileMap = await hydrateProfiles(otherUserIds);
  const lastByConversation = new Map<string, Record<string, unknown>>();
  for (const message of latestMessages ?? []) {
    const key = String(message.conversation_id);
    if (!lastByConversation.has(key)) lastByConversation.set(key, message);
  }

  return conversationIds.map((conversationId) => {
    const otherId = (allParticipants ?? []).find(
      (row) => String(row.conversation_id) === conversationId && String(row.user_id) !== userId,
    );
    const profile = otherId ? profileMap.get(String(otherId.user_id)) ?? {} : {};
    const lastMessage = lastByConversation.get(conversationId);
    const membership = (memberships ?? []).find((row) => String(row.conversation_id) === conversationId);
    const unread =
      lastMessage
      && membership?.last_read_at
      && new Date(String(lastMessage.created_at)).getTime() > new Date(String(membership.last_read_at)).getTime();

    return {
      id: conversationId,
      otherUserId: otherId ? String(otherId.user_id) : null,
      username: String(profile.handle ?? profile.username ?? "member"),
      displayName: String(profile.display_name ?? profile.username ?? "Member"),
      avatarUrl: (profile.avatar_url as string | null) ?? null,
      lastMessage: lastMessage ?? null,
      unread: Boolean(unread),
    };
  }).sort((a, b) => {
    const aTime = a.lastMessage ? new Date(String(a.lastMessage.created_at)).getTime() : 0;
    const bTime = b.lastMessage ? new Date(String(b.lastMessage.created_at)).getTime() : 0;
    return bTime - aTime;
  });
}

export async function findOrCreateDirectConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) throw new Error("Cannot message yourself.");

  // Anti-harassment: only mutual followers may start a DM thread.
  const { getRelationshipForTarget } = await import("./followService");
  const relationship = await getRelationshipForTarget({
    viewerId: userId,
    profileId: otherUserId,
  });
  if (!relationship.isFriend) {
    const err = new Error("You can only message mutual followers.");
    (err as Error & { code?: string }).code = "dm_requires_mutual_follow";
    throw err;
  }

  const supabaseAdmin = await admin();
  const { data: myMemberships } = await supabaseAdmin
    .from("dm_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  const myConversationIds = (myMemberships ?? []).map((row) => String(row.conversation_id));
  if (myConversationIds.length > 0) {
    const { data: shared } = await supabaseAdmin
      .from("dm_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConversationIds)
      .limit(1)
      .maybeSingle();
    if (shared?.conversation_id) return String(shared.conversation_id);
  }

  const { data: conversation, error } = await supabaseAdmin
    .from("dm_conversations")
    .insert({})
    .select("id")
    .single();
  if (error || !conversation) throw error ?? new Error("Failed to create conversation.");

  const conversationId = String(conversation.id);
  await supabaseAdmin.from("dm_participants").insert([
    { conversation_id: conversationId, user_id: userId },
    { conversation_id: conversationId, user_id: otherUserId },
  ]);
  return conversationId;
}

export async function listConversationMessages(conversationId: string, userId: string, limit = 50) {
  const supabaseAdmin = await admin();
  const { data: membership } = await supabaseAdmin
    .from("dm_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) return [];

  const { data } = await supabaseAdmin
    .from("dm_messages")
    .select(`
      id, body, created_at, sender_id,
      sender:profiles!dm_messages_sender_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(Math.min(limit, 100));

  await supabaseAdmin
    .from("dm_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  return data ?? [];
}

export async function sendDirectMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
}) {
  const supabaseAdmin = await admin();
  const { data: membership } = await supabaseAdmin
    .from("dm_participants")
    .select("conversation_id")
    .eq("conversation_id", input.conversationId)
    .eq("user_id", input.senderId)
    .maybeSingle();
  if (!membership) throw new Error("Not a participant in this conversation.");

  const trimmed = input.body.trim().slice(0, 2000);
  const { data, error } = await supabaseAdmin
    .from("dm_messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      body: trimmed,
    })
    .select(`
      id, body, created_at, sender_id,
      sender:profiles!dm_messages_sender_id_fkey(id, username, display_name, avatar_url)
    `)
    .single();

  if (error) throw error;

  await supabaseAdmin
    .from("dm_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversationId);

  return data;
}
