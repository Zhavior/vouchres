import { getSupabaseAdmin } from "../../middleware/auth";
import { AppError } from "../../errors/AppError";

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ConversationParticipant {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ConversationSummary {
  id: string;
  otherParticipant: ConversationParticipant;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
}

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

function toParticipant(row: ProfileRow): ConversationParticipant {
  return {
    userId: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    avatarUrl: row.avatar_url,
  };
}

async function loadProfiles(userIds: string[]): Promise<Map<string, ProfileRow>> {
  if (!userIds.length) return new Map();
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);
  if (error) throw error;
  return new Map((data ?? []).map((row: ProfileRow) => [row.id, row]));
}

/** Throws if userId is not a participant in conversationId. */
async function assertParticipant(conversationId: string, userId: string): Promise<void> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("message_conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new AppError({ status: 403, code: "forbidden", message: "You are not a participant in this conversation." });
  }
}

/** Get the existing 1:1 conversation between two users, or create one. Idempotent. */
export async function getOrCreateConversation(userId: string, otherUserId: string): Promise<ConversationSummary> {
  if (userId === otherUserId) {
    throw new AppError({ status: 400, code: "validation_error", message: "Cannot start a conversation with yourself." });
  }
  const supabase = await getSupabaseAdmin();

  const { data: existingRows, error: existingError } = await supabase
    .from("message_conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  if (existingError) throw existingError;

  const candidateIds = (existingRows ?? []).map((row) => row.conversation_id);
  if (candidateIds.length) {
    const { data: otherRows, error: otherError } = await supabase
      .from("message_conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", candidateIds);
    if (otherError) throw otherError;
    const existingConversationId = otherRows?.[0]?.conversation_id;
    if (existingConversationId) {
      const summaries = await listConversationsForUser(userId, { onlyId: existingConversationId });
      if (summaries[0]) return summaries[0];
    }
  }

  const { data: conversation, error: insertError } = await supabase
    .from("message_conversations")
    .insert({})
    .select("id, created_at, last_message_at, last_message_preview")
    .single();
  if (insertError) throw insertError;

  const { error: participantsError } = await supabase
    .from("message_conversation_participants")
    .insert([
      { conversation_id: conversation.id, user_id: userId },
      { conversation_id: conversation.id, user_id: otherUserId },
    ]);
  if (participantsError) throw participantsError;

  const profiles = await loadProfiles([otherUserId]);
  const otherProfile = profiles.get(otherUserId);
  if (!otherProfile) {
    throw new AppError({ status: 404, code: "not_found", message: "That user could not be found." });
  }

  return {
    id: conversation.id,
    otherParticipant: toParticipant(otherProfile),
    lastMessageAt: conversation.last_message_at,
    lastMessagePreview: conversation.last_message_preview,
    unreadCount: 0,
  };
}

export async function listConversationsForUser(
  userId: string,
  options: { onlyId?: string } = {},
): Promise<ConversationSummary[]> {
  const supabase = await getSupabaseAdmin();

  const { data: mine, error: mineError } = await supabase
    .from("message_conversation_participants")
    .select("conversation_id, unread_count")
    .eq("user_id", userId);
  if (mineError) throw mineError;

  const rows = options.onlyId
    ? (mine ?? []).filter((row) => row.conversation_id === options.onlyId)
    : (mine ?? []);
  if (!rows.length) return [];

  const conversationIds = rows.map((row) => row.conversation_id);
  const unreadByConversation = new Map(rows.map((row) => [row.conversation_id, row.unread_count]));

  const { data: conversations, error: conversationsError } = await supabase
    .from("message_conversations")
    .select("id, last_message_at, last_message_preview")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false });
  if (conversationsError) throw conversationsError;

  const { data: otherParticipants, error: otherError } = await supabase
    .from("message_conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds)
    .neq("user_id", userId);
  if (otherError) throw otherError;

  const otherUserIdByConversation = new Map(
    (otherParticipants ?? []).map((row) => [row.conversation_id, row.user_id]),
  );
  const profiles = await loadProfiles([...new Set(otherUserIdByConversation.values())]);

  return (conversations ?? []).flatMap((conversation) => {
    const otherUserId = otherUserIdByConversation.get(conversation.id);
    const otherProfile = otherUserId ? profiles.get(otherUserId) : undefined;
    if (!otherProfile) return [];
    return [{
      id: conversation.id,
      otherParticipant: toParticipant(otherProfile),
      lastMessageAt: conversation.last_message_at,
      lastMessagePreview: conversation.last_message_preview,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
    }];
  });
}

export async function listMessages(
  conversationId: string,
  userId: string,
  limit = 100,
): Promise<DirectMessage[]> {
  await assertParticipant(conversationId, userId);
  const supabase = await getSupabaseAdmin();
  const cap = Math.min(Math.max(limit, 1), 200);
  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, conversation_id, sender_id, text, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(cap);
  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      text: row.text,
      createdAt: row.created_at,
    }))
    .reverse();
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
): Promise<DirectMessage> {
  await assertParticipant(conversationId, senderId);
  const supabase = await getSupabaseAdmin();

  const { data: message, error: insertError } = await supabase
    .from("direct_messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, text })
    .select("id, conversation_id, sender_id, text, created_at")
    .single();
  if (insertError) throw insertError;

  const preview = text.length > 140 ? `${text.slice(0, 140)}…` : text;
  const { error: updateError } = await supabase
    .from("message_conversations")
    .update({ last_message_at: message.created_at, last_message_preview: preview })
    .eq("id", conversationId);
  if (updateError) throw updateError;

  const { error: unreadError } = await supabase.rpc("increment_message_unread_count", {
    p_conversation_id: conversationId,
    p_exclude_user_id: senderId,
  });
  if (unreadError) throw unreadError;

  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    text: message.text,
    createdAt: message.created_at,
  };
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await assertParticipant(conversationId, userId);
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase
    .from("message_conversation_participants")
    .update({ unread_count: 0, last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (error) throw error;
}
