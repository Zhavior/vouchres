/**
 * In-memory World Chat store — honest MVP with no seeded/fake messages.
 * Messages and chat profiles reset on server restart until a DB table exists.
 */

export type ChatProfileJson = {
  statusLine: string;
  accentColor: string;
  tag?: string;
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
  text: string;
  createdAt: string;
};

/** Honest win rate — null when there are no decided picks. */
export function honestWinRate(wonPicks: number | null | undefined, totalPicks: number | null | undefined): number | null {
  const won = Number(wonPicks ?? 0);
  const total = Number(totalPicks ?? 0);
  if (!Number.isFinite(won) || !Number.isFinite(total) || total <= 0) return null;
  return Math.round((won / total) * 1000) / 10;
}

export function buildProfilePath(userId: string): string {
  return `profile:${userId}`;
}

const MAX_MESSAGES = 200;

const messages: WorldChatMessage[] = [];
const chatProfiles = new Map<string, ChatProfileJson>();

export function listWorldChatMessages(limit = 50): WorldChatMessage[] {
  const cap = Math.min(Math.max(limit, 1), 100);
  return messages.slice(-cap);
}

export function postWorldChatMessage(input: {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  borderId?: string | null;
  accentColor: string;
  statusLine: string;
  winRate?: number | null;
  text: string;
}): WorldChatMessage {
  const handle = input.username.startsWith('@') ? input.username.slice(1) : input.username;
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
    text: input.text.trim(),
    createdAt: new Date().toISOString(),
  };

  messages.push(msg);
  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
  return msg;
}

export function getChatProfile(userId: string): ChatProfileJson | null {
  return chatProfiles.get(userId) ?? null;
}

export function putChatProfile(userId: string, profile: ChatProfileJson): ChatProfileJson {
  const safe: ChatProfileJson = {
    statusLine: String(profile.statusLine ?? '').slice(0, 80),
    accentColor: String(profile.accentColor ?? 'cyan').slice(0, 24),
    tag: profile.tag ? String(profile.tag).slice(0, 32) : undefined,
  };
  chatProfiles.set(userId, safe);
  return safe;
}

/** Test helper — clears in-memory state between tests. */
export function resetWorldChatStore(): void {
  messages.length = 0;
  chatProfiles.clear();
}
