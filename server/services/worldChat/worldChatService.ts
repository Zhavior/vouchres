/**
 * World Chat storage service.
 *
 * Prefers durable Supabase-backed persistence when the admin client and tables
 * are available. In-memory fallback is allowed only when durable-only mode is off
 * (non-production by default, or WORLD_CHAT_REQUIRE_DURABLE=0).
 */

import { getSupabaseAdmin } from "../../middleware/auth";
import {
  durableWorldChatStorageMeta,
  ephemeralWorldChatStorageMeta,
  requireDurableWorldChat,
  type WorldChatStorageMeta,
} from "./worldChatStorage";

const WORLD_CHAT_DURABLE_UNAVAILABLE = "world_chat_durable_unavailable";

function refuseMemoryWrite(operation: string): never {
  console.error(`[world-chat] refusing memory ${operation}; durable storage required`);
  throw new Error(WORLD_CHAT_DURABLE_UNAVAILABLE);
}

export type ChatProfileJson = {
  statusLine: string;
  accentColor: string;
  tag?: string;
};

export type WorldChatReaction = {
  emojiId: string;
  shortcode: string;
  imageUrl: string;
  altText: string;
  count: number;
  reactedByViewer: boolean;
};

export type WorldChatReplyRef = {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  text: string;
};

export type WorldChatMessage = {
  id: string;
  userId: string;
  username: string;
  /** @handle for profile link chip */
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  borderId: string | null;
  accentColor: string;
  statusLine: string;
  /** Honest win rate from graded picks — null when no decided picks */
  winRate: number | null;
  /** Client route hint: profile section + user id */
  profilePath: string;
  channelId: string;
  text: string;
  createdAt: string;
  replyTo: WorldChatReplyRef | null;
  reactions: WorldChatReaction[];
};

export type WorldChatChannel = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
};

export type WorldChatCustomEmoji = {
  id: string;
  shortcode: string;
  imageUrl: string;
  altText: string;
  isActive: boolean;
  sortOrder: number;
};

export type WorldChatEmojiInput = {
  id: string;
  shortcode: string;
  imageUrl: string;
  altText: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type WorldChatModerationFailure = {
  code: "blocked_term";
  term: string;
};

const DEFAULT_WORLD_CHAT_CHANNEL: WorldChatChannel = {
  id: "world:lounge",
  name: "World Lounge",
  description: "Global community lounge for honest sports research.",
  isDefault: true,
};

type MessageRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;
type ReactionRow = Record<string, unknown>;
type EmojiRow = Record<string, unknown>;
type ChannelRow = Record<string, unknown>;

/** Honest win rate — null when there are no decided picks. */
export function honestWinRate(
  wonPicks: number | null | undefined,
  totalPicks: number | null | undefined,
): number | null {
  const won = Number(wonPicks ?? 0);
  const total = Number(totalPicks ?? 0);
  if (!Number.isFinite(won) || !Number.isFinite(total) || total <= 0) return null;
  return Math.round((won / total) * 1000) / 10;
}

export function buildProfilePath(userId: string): string {
  return `profile:${userId}`;
}

const MAX_MESSAGES = 200;
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205", "PGRST204", "42703"]);
const DEFAULT_BLOCKED_WORLD_CHAT_TERMS = [
  "asshole",
  "bastard",
  "bitch",
  "damn",
  "dick",
  "fuck",
  "fucking",
  "motherfucker",
  "shit",
  "shitty",
] as const;

const messages: WorldChatMessage[] = [];
const chatProfiles = new Map<string, ChatProfileJson>();
const memoryChannels = new Map<string, WorldChatChannel>([[DEFAULT_WORLD_CHAT_CHANNEL.id, DEFAULT_WORLD_CHAT_CHANNEL]]);
const memoryCustomEmojis = new Map<string, WorldChatCustomEmoji>();
const memoryReactions = new Map<string, Map<string, Set<string>>>();

function missingTable(error: unknown): boolean {
  return MISSING_TABLE_CODES.has(String((error as { code?: unknown })?.code ?? ""));
}

function normalizeModerationText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function blockedWorldChatTerms(): string[] {
  const fromEnv = String(process.env.WORLD_CHAT_BLOCKED_TERMS ?? "")
    .split(",")
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set((fromEnv.length > 0 ? fromEnv : [...DEFAULT_BLOCKED_WORLD_CHAT_TERMS]).map((term) => term.trim()))];
}

export function getBlockedWorldChatTerms(): string[] {
  return blockedWorldChatTerms();
}

export function validateWorldChatMessage(text: string): WorldChatModerationFailure | null {
  const normalized = ` ${normalizeModerationText(text)} `;
  for (const term of blockedWorldChatTerms()) {
    const needle = ` ${term} `;
    if (normalized.includes(needle)) {
      return {
        code: "blocked_term",
        term,
      };
    }
  }
  return null;
}

function safeChatProfile(profile: ChatProfileJson): ChatProfileJson {
  return {
    statusLine: String(profile.statusLine ?? "").slice(0, 80),
    accentColor: String(profile.accentColor ?? "cyan").slice(0, 24),
    tag: profile.tag ? String(profile.tag).slice(0, 32) : undefined,
  };
}

function sanitizeChannelId(channelId: string | null | undefined): string {
  const raw = String(channelId ?? DEFAULT_WORLD_CHAT_CHANNEL.id).trim();
  return raw.length > 0 ? raw.slice(0, 80) : DEFAULT_WORLD_CHAT_CHANNEL.id;
}

function safeEmoji(input: WorldChatEmojiInput): WorldChatCustomEmoji {
  return {
    id: String(input.id ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9:_-]/g, "_")
      .slice(0, 64),
    shortcode: String(input.shortcode ?? "")
      .trim()
      .replace(/^:+|:+$/g, "")
      .slice(0, 32),
    imageUrl: String(input.imageUrl ?? "").trim().slice(0, 500),
    altText: String(input.altText ?? "").trim().slice(0, 80),
    isActive: input.isActive !== false,
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
  };
}

function buildMemoryProfile(userId: string, profile: ChatProfileJson): ChatProfileJson {
  const safe = safeChatProfile(profile);
  chatProfiles.set(userId, safe);
  return safe;
}

function sortEmojiList(items: WorldChatCustomEmoji[]): WorldChatCustomEmoji[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.shortcode.localeCompare(b.shortcode));
}

function sortChannelList(items: WorldChatChannel[]): WorldChatChannel[] {
  return [...items].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
}

function ensureMemoryChannel(channelId: string): WorldChatChannel {
  const safeId = sanitizeChannelId(channelId);
  const existing = memoryChannels.get(safeId);
  if (existing) return existing;
  const channel: WorldChatChannel = {
    id: safeId,
    name: safeId === DEFAULT_WORLD_CHAT_CHANNEL.id ? DEFAULT_WORLD_CHAT_CHANNEL.name : safeId,
    description:
      safeId === DEFAULT_WORLD_CHAT_CHANNEL.id
        ? DEFAULT_WORLD_CHAT_CHANNEL.description
        : "World Chat room.",
    isDefault: safeId === DEFAULT_WORLD_CHAT_CHANNEL.id,
  };
  memoryChannels.set(safeId, channel);
  return channel;
}

function summarizeReactionsForMessage(
  messageId: string,
  emojis: WorldChatCustomEmoji[],
  viewerId?: string | null,
): WorldChatReaction[] {
  const emojiById = new Map(emojis.map((emoji) => [emoji.id, emoji]));
  const reactionsForMessage = memoryReactions.get(messageId);
  if (!reactionsForMessage) return [];

  const summary: WorldChatReaction[] = [];
  for (const [emojiId, userIds] of reactionsForMessage.entries()) {
    const emoji = emojiById.get(emojiId);
    if (!emoji || !emoji.isActive || userIds.size === 0) continue;
    summary.push({
      emojiId,
      shortcode: emoji.shortcode,
      imageUrl: emoji.imageUrl,
      altText: emoji.altText,
      count: userIds.size,
      reactedByViewer: Boolean(viewerId && userIds.has(viewerId)),
    });
  }

  return summary.sort((a, b) => a.shortcode.localeCompare(b.shortcode));
}

function attachMemoryReactions(message: WorldChatMessage, viewerId?: string | null): WorldChatMessage {
  return {
    ...message,
    reactions: summarizeReactionsForMessage(
      message.id,
      sortEmojiList([...memoryCustomEmojis.values()]).filter((emoji) => emoji.isActive),
      viewerId,
    ),
  };
}

function buildReplyRef(input: {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  text: string;
}): WorldChatReplyRef {
  return {
    id: input.id,
    userId: input.userId,
    displayName: input.displayName,
    handle: input.handle,
    text: String(input.text ?? "").trim().slice(0, 180),
  };
}

async function tryLoadDurableReplyRef(messageId: string): Promise<WorldChatReplyRef | null | undefined> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: messageRow, error: messageError } = await supabaseAdmin
      .from("world_chat_messages")
      .select("id, author_id, body")
      .eq("id", messageId)
      .maybeSingle();

    if (messageError) {
      if (missingTable(messageError)) return undefined;
      throw messageError;
    }
    if (!messageRow) return null;

    const authorId = String(messageRow.author_id ?? "");
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, handle, display_name")
      .eq("id", authorId)
      .maybeSingle();

    if (profileError) throw profileError;
    const username = String(profileRow?.handle ?? profileRow?.username ?? authorId);

    return buildReplyRef({
      id: String(messageRow.id ?? messageId),
      userId: authorId,
      displayName: String(profileRow?.display_name ?? profileRow?.username ?? "Member"),
      handle: username.startsWith("@") ? username.slice(1) : username,
      text: String(messageRow.body ?? ""),
    });
  } catch (error) {
    console.warn("[world-chat] durable reply lookup failed; falling back to memory:", (error as Error)?.message ?? error);
    return undefined;
  }
}

async function tryDurableListChannels(): Promise<WorldChatChannel[] | null> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("world_chat_channels")
      .select("id, name, description, is_default")
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      if (missingTable(error)) return null;
      throw error;
    }

    const rows = (data ?? []).map((row: ChannelRow) => ({
      id: String(row.id),
      name: String(row.name ?? row.id ?? DEFAULT_WORLD_CHAT_CHANNEL.name),
      description: String(row.description ?? ""),
      isDefault: Boolean(row.is_default),
    }));

    if (rows.length === 0) return [DEFAULT_WORLD_CHAT_CHANNEL];
    return sortChannelList(rows);
  } catch (error) {
    console.warn("[world-chat] durable channel list failed; falling back to memory:", (error as Error)?.message ?? error);
    return null;
  }
}

async function tryDurableListEmojis(): Promise<WorldChatCustomEmoji[] | null> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("world_chat_custom_emojis")
      .select("id, shortcode, image_url, alt_text, is_active, sort_order")
      .order("sort_order", { ascending: true })
      .order("shortcode", { ascending: true });

    if (error) {
      if (missingTable(error)) return null;
      throw error;
    }

    return sortEmojiList(
      (data ?? []).map((row: EmojiRow) => ({
        id: String(row.id),
        shortcode: String(row.shortcode ?? row.id ?? ""),
        imageUrl: String(row.image_url ?? ""),
        altText: String(row.alt_text ?? row.shortcode ?? row.id ?? ""),
        isActive: Boolean(row.is_active),
        sortOrder: Number(row.sort_order ?? 0),
      })),
    );
  } catch (error) {
    console.warn("[world-chat] durable emoji list failed; falling back to memory:", (error as Error)?.message ?? error);
    return null;
  }
}

async function tryDurableList(
  limit: number,
  channelId?: string | null,
  viewerId?: string | null,
): Promise<WorldChatMessage[] | null> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const safeChannelId = sanitizeChannelId(channelId);
    const messageQuery = supabaseAdmin
      .from("world_chat_messages")
      .select("id, author_id, channel_id, body, border_id, accent_color, status_line, created_at, reply_to_message_id")
      .order("created_at", { ascending: true })
      .limit(limit);

    const { data: rows, error } =
      safeChannelId === DEFAULT_WORLD_CHAT_CHANNEL.id
        ? await messageQuery.eq("channel_id", safeChannelId)
        : await messageQuery.eq("channel_id", safeChannelId);

    if (error) {
      if (missingTable(error)) return null;
      throw error;
    }

    const replyTargetIds = [...new Set((rows ?? []).map((row) => String(row.reply_to_message_id ?? "")).filter(Boolean))];
    const parentRows = new Map<string, MessageRow>();
    if (replyTargetIds.length > 0) {
      const { data: parentData, error: parentError } = await supabaseAdmin
        .from("world_chat_messages")
        .select("id, author_id, channel_id, body")
        .in("id", replyTargetIds);

      if (parentError) {
        if (missingTable(parentError)) return null;
        throw parentError;
      }

      for (const parent of parentData ?? []) {
        parentRows.set(String((parent as MessageRow).id), parent as MessageRow);
      }
    }

    const authorIds = [
      ...new Set(
        [
          ...(rows ?? []).map((row) => String(row.author_id)).filter(Boolean),
          ...[...parentRows.values()].map((row) => String(row.author_id)).filter(Boolean),
        ],
      ),
    ];
    const messageIds = [...new Set((rows ?? []).map((row) => String(row.id)).filter(Boolean))];
    let profileMap = new Map<string, ProfileRow>();

    if (authorIds.length > 0) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, username, handle, display_name, avatar_url, won_picks, total_picks")
        .in("id", authorIds);

      if (profileError) throw profileError;
      profileMap = new Map((profiles ?? []).map((profile: ProfileRow) => [String(profile.id), profile]));
    }

    const reactionsByMessage = new Map<string, WorldChatReaction[]>();
    if (messageIds.length > 0) {
      const { data: reactionRows, error: reactionError } = await supabaseAdmin
        .from("world_chat_message_reactions")
        .select("message_id, emoji_id, user_id")
        .in("message_id", messageIds);

      if (reactionError && !missingTable(reactionError)) throw reactionError;

      const emojiIds = [...new Set((reactionRows ?? []).map((row) => String((row as ReactionRow).emoji_id)).filter(Boolean))];
      let emojiMap = new Map<string, WorldChatCustomEmoji>();
      if (emojiIds.length > 0) {
        const { data: emojiRows, error: emojiError } = await supabaseAdmin
          .from("world_chat_custom_emojis")
          .select("id, shortcode, image_url, alt_text, is_active, sort_order")
          .in("id", emojiIds);

        if (emojiError && !missingTable(emojiError)) throw emojiError;

        emojiMap = new Map(
          (emojiRows ?? []).map((row: EmojiRow) => [
            String(row.id),
            {
              id: String(row.id),
              shortcode: String(row.shortcode ?? row.id ?? ""),
              imageUrl: String(row.image_url ?? ""),
              altText: String(row.alt_text ?? row.shortcode ?? row.id ?? ""),
              isActive: Boolean(row.is_active),
              sortOrder: Number(row.sort_order ?? 0),
            },
          ]),
        );
      }

      const bucket = new Map<string, Map<string, { count: number; reactedByViewer: boolean }>>();
      for (const row of reactionRows ?? []) {
        const messageId = String((row as ReactionRow).message_id ?? "");
        const emojiId = String((row as ReactionRow).emoji_id ?? "");
        const userId = String((row as ReactionRow).user_id ?? "");
        if (!messageId || !emojiId) continue;

        const byEmoji = bucket.get(messageId) ?? new Map<string, { count: number; reactedByViewer: boolean }>();
        const current = byEmoji.get(emojiId) ?? { count: 0, reactedByViewer: false };
        current.count += 1;
        if (viewerId && userId === viewerId) current.reactedByViewer = true;
        byEmoji.set(emojiId, current);
        bucket.set(messageId, byEmoji);
      }

      for (const [messageId, byEmoji] of bucket.entries()) {
        const reactions: WorldChatReaction[] = [];
        for (const [emojiId, summary] of byEmoji.entries()) {
          const emoji = emojiMap.get(emojiId);
          if (!emoji || !emoji.isActive) continue;
          reactions.push({
            emojiId,
            shortcode: emoji.shortcode,
            imageUrl: emoji.imageUrl,
            altText: emoji.altText,
            count: summary.count,
            reactedByViewer: summary.reactedByViewer,
          });
        }
        reactionsByMessage.set(
          messageId,
          reactions.sort((a, b) => a.shortcode.localeCompare(b.shortcode)),
        );
      }
    }

    return (rows ?? []).map((row: MessageRow) => {
      const authorId = String(row.author_id);
      const profile = profileMap.get(authorId) ?? {};
      const username = String(profile.handle ?? profile.username ?? authorId);
      const displayName = String(profile.display_name ?? profile.username ?? "Member");

      return {
        id: String(row.id),
        userId: authorId,
        username,
        handle: username.startsWith("@") ? username.slice(1) : username,
        displayName,
        avatarUrl: (profile.avatar_url as string | null) ?? null,
        borderId: (row.border_id as string | null) ?? null,
        accentColor: String(row.accent_color ?? "cyan"),
        statusLine: String(row.status_line ?? "Researching edges"),
        winRate: honestWinRate(profile.won_picks as number | null, profile.total_picks as number | null),
        profilePath: buildProfilePath(authorId),
        channelId: sanitizeChannelId(row.channel_id as string | null | undefined),
        text: String(row.body ?? ""),
        createdAt: String(row.created_at),
        replyTo: (() => {
          const parentId = String(row.reply_to_message_id ?? "");
          if (!parentId) return null;
          const parentRow = parentRows.get(parentId);
          if (!parentRow) return null;
          const parentAuthorId = String(parentRow.author_id ?? "");
          const parentProfile = profileMap.get(parentAuthorId) ?? {};
          const parentUsername = String(parentProfile.handle ?? parentProfile.username ?? parentAuthorId);
          return buildReplyRef({
            id: parentId,
            userId: parentAuthorId,
            displayName: String(parentProfile.display_name ?? parentProfile.username ?? "Member"),
            handle: parentUsername.startsWith("@") ? parentUsername.slice(1) : parentUsername,
            text: String(parentRow.body ?? ""),
          });
        })(),
        reactions: reactionsByMessage.get(String(row.id)) ?? [],
      };
    });
  } catch (error) {
    console.warn("[world-chat] durable list failed; falling back to memory:", (error as Error)?.message ?? error);
    return null;
  }
}

export async function listWorldChatChannels(): Promise<WorldChatChannel[]> {
  const durable = await tryDurableListChannels();
  if (durable) return durable;
  if (requireDurableWorldChat()) return [DEFAULT_WORLD_CHAT_CHANNEL];
  return sortChannelList([...memoryChannels.values()]);
}

export async function listWorldChatEmojis(): Promise<WorldChatCustomEmoji[]> {
  const durable = await tryDurableListEmojis();
  if (durable) return durable;
  if (requireDurableWorldChat()) return [];
  return sortEmojiList([...memoryCustomEmojis.values()]);
}

export async function listWorldChatMessages(
  limit = 50,
  opts: { channelId?: string | null; viewerId?: string | null } = {},
): Promise<WorldChatMessage[]> {
  const cap = Math.min(Math.max(limit, 1), 100);
  const safeChannelId = sanitizeChannelId(opts.channelId);
  const durable = await tryDurableList(cap, safeChannelId, opts.viewerId);
  if (durable) return durable;
  if (requireDurableWorldChat()) return [];
  return messages
    .filter((message) => message.channelId === safeChannelId)
    .slice(-cap)
    .map((message) => attachMemoryReactions(message, opts.viewerId));
}

async function tryDurablePost(input: {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  borderId?: string | null;
  accentColor: string;
  statusLine: string;
  winRate?: number | null;
  channelId?: string | null;
  replyToMessageId?: string | null;
  replyTo?: WorldChatReplyRef | null;
  text: string;
}): Promise<WorldChatMessage | null> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const safeChannelId = sanitizeChannelId(input.channelId);
    const safeReplyToMessageId = String(input.replyToMessageId ?? "").trim() || null;
    if (safeReplyToMessageId) {
      const { data: parent, error: parentError } = await supabaseAdmin
        .from("world_chat_messages")
        .select("id, channel_id")
        .eq("id", safeReplyToMessageId)
        .maybeSingle();

      if (parentError) {
        if (missingTable(parentError)) return null;
        throw parentError;
      }
      if (!parent || sanitizeChannelId(parent.channel_id as string | null | undefined) !== safeChannelId) {
        throw new Error("invalid_world_chat_reply_target");
      }
    }

    const { data, error } = await supabaseAdmin
      .from("world_chat_messages")
      .insert({
        author_id: input.userId,
        channel_id: safeChannelId,
        reply_to_message_id: safeReplyToMessageId,
        body: input.text.trim().slice(0, 500),
        border_id: input.borderId ?? null,
        accent_color: String(input.accentColor ?? "cyan").slice(0, 24),
        status_line: String(input.statusLine ?? "Researching edges").slice(0, 80),
      })
      .select("id, created_at, channel_id, reply_to_message_id")
      .single();

    if (error) {
      if (missingTable(error)) return null;
      throw error;
    }

    const handle = input.username.startsWith("@") ? input.username.slice(1) : input.username;
    return {
      id: String(data.id),
      userId: input.userId,
      username: input.username,
      handle,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl ?? null,
      borderId: input.borderId ?? null,
      accentColor: String(input.accentColor ?? "cyan").slice(0, 24),
      statusLine: String(input.statusLine ?? "Researching edges").slice(0, 80),
      winRate: input.winRate ?? null,
      profilePath: buildProfilePath(input.userId),
      channelId: sanitizeChannelId(data.channel_id as string | null | undefined),
      text: input.text.trim().slice(0, 500),
      createdAt: String(data.created_at),
      replyTo:
        safeReplyToMessageId && input.replyTo && input.replyTo.id === safeReplyToMessageId ? input.replyTo : null,
      reactions: [],
    };
  } catch (error) {
    if ((error as Error)?.message === "invalid_world_chat_reply_target") {
      throw error;
    }
    console.warn("[world-chat] durable post failed; falling back to memory:", (error as Error)?.message ?? error);
    return null;
  }
}

export async function postWorldChatMessage(input: {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  borderId?: string | null;
  accentColor: string;
  statusLine: string;
  winRate?: number | null;
  channelId?: string | null;
  replyToMessageId?: string | null;
  text: string;
}): Promise<WorldChatMessage> {
  const safeReplyToMessageId = String(input.replyToMessageId ?? "").trim() || null;
  const replyTo =
    safeReplyToMessageId
      ? (await tryLoadDurableReplyRef(safeReplyToMessageId)) ??
        (() => {
          const memoryReply = messages.find((message) => message.id === safeReplyToMessageId) ?? null;
          return memoryReply
            ? buildReplyRef({
                id: memoryReply.id,
                userId: memoryReply.userId,
                displayName: memoryReply.displayName,
                handle: memoryReply.handle,
                text: memoryReply.text,
              })
            : null;
        })()
      : null;

  const durable = await tryDurablePost({
    ...input,
    replyToMessageId: safeReplyToMessageId,
    replyTo,
  });
  if (durable) return durable;
  if (requireDurableWorldChat()) refuseMemoryWrite("post");

  const safeChannelId = sanitizeChannelId(input.channelId);
  ensureMemoryChannel(safeChannelId);
  const replyTarget = safeReplyToMessageId
    ? messages.find((message) => message.id === safeReplyToMessageId && message.channelId === safeChannelId) ?? null
    : null;
  if (safeReplyToMessageId && !replyTarget) {
    throw new Error("invalid_world_chat_reply_target");
  }
  const handle = input.username.startsWith("@") ? input.username.slice(1) : input.username;
  const msg: WorldChatMessage = {
    id: `wc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    username: input.username,
    handle,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl ?? null,
    borderId: input.borderId ?? null,
    accentColor: input.accentColor,
    statusLine: input.statusLine,
    winRate: input.winRate ?? null,
    profilePath: buildProfilePath(input.userId),
    channelId: safeChannelId,
    text: input.text.trim(),
    createdAt: new Date().toISOString(),
    replyTo: replyTarget
      ? buildReplyRef({
          id: replyTarget.id,
          userId: replyTarget.userId,
          displayName: replyTarget.displayName,
          handle: replyTarget.handle,
          text: replyTarget.text,
        })
      : null,
    reactions: [],
  };

  messages.push(msg);
  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
  return msg;
}

async function tryDurableGetProfile(userId: string): Promise<ChatProfileJson | null | undefined> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("world_chat_profiles")
      .select("status_line, accent_color, tag")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (missingTable(error)) return undefined;
      throw error;
    }
    if (!data) return null;

    return {
      statusLine: String(data.status_line ?? "Researching edges"),
      accentColor: String(data.accent_color ?? "cyan"),
      tag: data.tag ? String(data.tag) : undefined,
    };
  } catch (error) {
    console.warn("[world-chat] durable profile read failed; falling back to memory:", (error as Error)?.message ?? error);
    return undefined;
  }
}

export async function getChatProfile(userId: string): Promise<ChatProfileJson | null> {
  const durable = await tryDurableGetProfile(userId);
  if (durable !== undefined) return durable;
  if (requireDurableWorldChat()) return null;
  return chatProfiles.get(userId) ?? null;
}

async function tryDurablePutProfile(userId: string, profile: ChatProfileJson): Promise<ChatProfileJson | null> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const safe = safeChatProfile(profile);
    const { data, error } = await supabaseAdmin
      .from("world_chat_profiles")
      .upsert({
        user_id: userId,
        status_line: safe.statusLine,
        accent_color: safe.accentColor,
        tag: safe.tag ?? null,
        updated_at: new Date().toISOString(),
      })
      .select("status_line, accent_color, tag")
      .single();

    if (error) {
      if (missingTable(error)) return null;
      throw error;
    }

    return {
      statusLine: String(data.status_line ?? "Researching edges"),
      accentColor: String(data.accent_color ?? "cyan"),
      tag: data.tag ? String(data.tag) : undefined,
    };
  } catch (error) {
    console.warn("[world-chat] durable profile write failed; falling back to memory:", (error as Error)?.message ?? error);
    return null;
  }
}

export async function putChatProfile(userId: string, profile: ChatProfileJson): Promise<ChatProfileJson> {
  const durable = await tryDurablePutProfile(userId, profile);
  if (durable) return durable;
  if (requireDurableWorldChat()) refuseMemoryWrite("profile");
  return buildMemoryProfile(userId, profile);
}

async function tryDurableUpsertEmoji(input: WorldChatEmojiInput): Promise<WorldChatCustomEmoji | null> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const safe = safeEmoji(input);
    const { data, error } = await supabaseAdmin
      .from("world_chat_custom_emojis")
      .upsert({
        id: safe.id,
        shortcode: safe.shortcode,
        image_url: safe.imageUrl,
        alt_text: safe.altText,
        is_active: safe.isActive,
        sort_order: safe.sortOrder,
      })
      .select("id, shortcode, image_url, alt_text, is_active, sort_order")
      .single();

    if (error) {
      if (missingTable(error)) return null;
      throw error;
    }

    return {
      id: String(data.id),
      shortcode: String(data.shortcode ?? data.id ?? ""),
      imageUrl: String(data.image_url ?? ""),
      altText: String(data.alt_text ?? data.shortcode ?? data.id ?? ""),
      isActive: Boolean(data.is_active),
      sortOrder: Number(data.sort_order ?? 0),
    };
  } catch (error) {
    console.warn("[world-chat] durable emoji upsert failed; falling back to memory:", (error as Error)?.message ?? error);
    return null;
  }
}

export async function upsertWorldChatEmoji(input: WorldChatEmojiInput): Promise<WorldChatCustomEmoji> {
  const durable = await tryDurableUpsertEmoji(input);
  if (durable) return durable;
  if (requireDurableWorldChat()) refuseMemoryWrite("emoji");

  const safe = safeEmoji(input);
  memoryCustomEmojis.set(safe.id, safe);
  return safe;
}

function findMemoryMessage(messageId: string): WorldChatMessage | null {
  return messages.find((message) => message.id === messageId) ?? null;
}

function findMemoryEmoji(emojiId: string): WorldChatCustomEmoji | null {
  const emoji = memoryCustomEmojis.get(emojiId);
  if (!emoji || !emoji.isActive) return null;
  return emoji;
}

async function tryDurableToggleReaction(input: {
  messageId: string;
  emojiId: string;
  userId: string;
}): Promise<WorldChatReaction[] | null> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: emoji, error: emojiError } = await supabaseAdmin
      .from("world_chat_custom_emojis")
      .select("id, shortcode, image_url, alt_text, is_active, sort_order")
      .eq("id", input.emojiId)
      .maybeSingle();

    if (emojiError) {
      if (missingTable(emojiError)) return null;
      throw emojiError;
    }
    if (!emoji || !emoji.is_active) {
      throw new Error("inactive_world_chat_emoji");
    }

    const { data: messageRow, error: messageError } = await supabaseAdmin
      .from("world_chat_messages")
      .select("id")
      .eq("id", input.messageId)
      .maybeSingle();

    if (messageError) {
      if (missingTable(messageError)) return null;
      throw messageError;
    }
    if (!messageRow) {
      throw new Error("world_chat_message_not_found");
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("world_chat_message_reactions")
      .select("message_id")
      .eq("message_id", input.messageId)
      .eq("emoji_id", input.emojiId)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (existingError) {
      if (missingTable(existingError)) return null;
      throw existingError;
    }

    if (existing) {
      const { error: deleteError } = await supabaseAdmin
        .from("world_chat_message_reactions")
        .delete()
        .eq("message_id", input.messageId)
        .eq("emoji_id", input.emojiId)
        .eq("user_id", input.userId);
      if (deleteError) throw deleteError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("world_chat_message_reactions")
        .insert({
          message_id: input.messageId,
          emoji_id: input.emojiId,
          user_id: input.userId,
        });
      if (insertError) throw insertError;
    }

    const { data: reactionRows, error: reactionError } = await supabaseAdmin
      .from("world_chat_message_reactions")
      .select("emoji_id, user_id")
      .eq("message_id", input.messageId);

    if (reactionError) throw reactionError;

    const emojiIds = [...new Set((reactionRows ?? []).map((row) => String((row as ReactionRow).emoji_id)).filter(Boolean))];
    let emojiMap = new Map<string, WorldChatCustomEmoji>();
    if (emojiIds.length > 0) {
      const { data: emojiRows, error: emojiListError } = await supabaseAdmin
        .from("world_chat_custom_emojis")
        .select("id, shortcode, image_url, alt_text, is_active, sort_order")
        .in("id", emojiIds);

      if (emojiListError) throw emojiListError;
      emojiMap = new Map(
        (emojiRows ?? []).map((row: EmojiRow) => [
          String(row.id),
          {
            id: String(row.id),
            shortcode: String(row.shortcode ?? row.id ?? ""),
            imageUrl: String(row.image_url ?? ""),
            altText: String(row.alt_text ?? row.shortcode ?? row.id ?? ""),
            isActive: Boolean(row.is_active),
            sortOrder: Number(row.sort_order ?? 0),
          },
        ]),
      );
    }

    const counts = new Map<string, { count: number; reactedByViewer: boolean }>();
    for (const row of reactionRows ?? []) {
      const emojiId = String((row as ReactionRow).emoji_id ?? "");
      const userId = String((row as ReactionRow).user_id ?? "");
      if (!emojiId) continue;
      const current = counts.get(emojiId) ?? { count: 0, reactedByViewer: false };
      current.count += 1;
      if (userId === input.userId) current.reactedByViewer = true;
      counts.set(emojiId, current);
    }

    return [...counts.entries()]
      .map(([emojiId, summary]) => {
        const emojiRecord = emojiMap.get(emojiId);
        if (!emojiRecord || !emojiRecord.isActive) return null;
        return {
          emojiId,
          shortcode: emojiRecord.shortcode,
          imageUrl: emojiRecord.imageUrl,
          altText: emojiRecord.altText,
          count: summary.count,
          reactedByViewer: summary.reactedByViewer,
        } satisfies WorldChatReaction;
      })
      .filter((item): item is WorldChatReaction => Boolean(item))
      .sort((a, b) => a.shortcode.localeCompare(b.shortcode));
  } catch (error) {
    if (
      (error as Error)?.message === "inactive_world_chat_emoji" ||
      (error as Error)?.message === "world_chat_message_not_found"
    ) {
      throw error;
    }
    console.warn("[world-chat] durable reaction toggle failed; falling back to memory:", (error as Error)?.message ?? error);
    return null;
  }
}

export async function toggleWorldChatReaction(input: {
  messageId: string;
  emojiId: string;
  userId: string;
}): Promise<WorldChatReaction[]> {
  const durable = await tryDurableToggleReaction(input);
  if (durable) return durable;
  if (requireDurableWorldChat()) refuseMemoryWrite("reaction");

  const message = findMemoryMessage(input.messageId);
  if (!message) {
    throw new Error("world_chat_message_not_found");
  }

  const emoji = findMemoryEmoji(input.emojiId);
  if (!emoji) {
    throw new Error("inactive_world_chat_emoji");
  }

  const byEmoji = memoryReactions.get(input.messageId) ?? new Map<string, Set<string>>();
  const userIds = byEmoji.get(input.emojiId) ?? new Set<string>();
  if (userIds.has(input.userId)) {
    userIds.delete(input.userId);
  } else {
    userIds.add(input.userId);
  }

  if (userIds.size > 0) {
    byEmoji.set(input.emojiId, userIds);
    memoryReactions.set(input.messageId, byEmoji);
  } else {
    byEmoji.delete(input.emojiId);
    if (byEmoji.size > 0) {
      memoryReactions.set(input.messageId, byEmoji);
    } else {
      memoryReactions.delete(input.messageId);
    }
  }

  return summarizeReactionsForMessage(input.messageId, sortEmojiList([...memoryCustomEmojis.values()]), input.userId);
}

export async function getResolvedWorldChatStorageMeta(): Promise<WorldChatStorageMeta> {
  const durableMessages = await tryDurableList(1, DEFAULT_WORLD_CHAT_CHANNEL.id);
  if (durableMessages) return durableWorldChatStorageMeta();
  if (requireDurableWorldChat()) {
    return ephemeralWorldChatStorageMeta("durable_required_but_unavailable");
  }
  return ephemeralWorldChatStorageMeta("supabase_world_chat_tables_unavailable");
}

/** Test helper — clears in-memory state between tests. */
export function resetWorldChatStore(): void {
  messages.length = 0;
  chatProfiles.clear();
  memoryChannels.clear();
  memoryChannels.set(DEFAULT_WORLD_CHAT_CHANNEL.id, DEFAULT_WORLD_CHAT_CHANNEL);
  memoryCustomEmojis.clear();
  memoryReactions.clear();
}
