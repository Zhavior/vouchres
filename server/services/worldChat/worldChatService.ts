import { getSupabaseAdmin } from "../../middleware/auth";

/** Durable World Chat store. Messages and profile preferences are only accessed
 * through authenticated server routes; no client has direct table access. */

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

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  won_picks: number | null;
  total_picks: number | null;
};

type MessageRow = {
  id: string;
  user_id: string;
  text: string;
  accent_color: string;
  status_line: string;
  border_id: string | null;
  created_at: string;
};

function toMessage(row: MessageRow, profile: ProfileRow): WorldChatMessage {
  const username = profile.username;
  return {
    id: row.id,
    userId: row.user_id,
    username,
    handle: username.startsWith("@") ? username.slice(1) : username,
    displayName: profile.display_name || username,
    avatarUrl: profile.avatar_url,
    borderId: row.border_id,
    accentColor: row.accent_color,
    statusLine: row.status_line,
    winRate: honestWinRate(profile.won_picks, profile.total_picks),
    profilePath: buildProfilePath(row.user_id),
    text: row.text,
    createdAt: row.created_at,
  };
}

export async function listWorldChatMessages(limit = 50): Promise<WorldChatMessage[]> {
  const cap = Math.min(Math.max(limit, 1), 100);
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("world_chat_messages")
    .select("id, user_id, text, accent_color, status_line, border_id, created_at")
    .order("created_at", { ascending: false })
    .limit(cap);
  if (error) throw error;

  const rows = (data ?? []) as MessageRow[];
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url, won_picks, total_picks")
    .in("id", userIds);
  if (profileError) throw profileError;

  const profileById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );
  return rows
    .reverse()
    .flatMap((row) => {
      const profile = profileById.get(row.user_id);
      return profile ? [toMessage(row, profile)] : [];
    });
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
  text: string;
}): Promise<WorldChatMessage> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("world_chat_messages")
    .insert({
      user_id: input.userId,
      text: input.text.trim(),
      accent_color: input.accentColor,
      status_line: input.statusLine,
      border_id: input.borderId ?? null,
    })
    .select("id, user_id, text, accent_color, status_line, border_id, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Could not save chat message.");

  const row = data as MessageRow;
  const username = input.username;
  return {
    id: row.id,
    userId: row.user_id,
    username,
    handle: username.startsWith("@") ? username.slice(1) : username,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl ?? null,
    borderId: row.border_id,
    accentColor: row.accent_color,
    statusLine: row.status_line,
    winRate: input.winRate ?? null,
    profilePath: buildProfilePath(row.user_id),
    text: row.text,
    createdAt: row.created_at,
  };
}

export async function getChatProfile(userId: string): Promise<ChatProfileJson | null> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("world_chat_profiles")
    .select("status_line, accent_color, tag")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    statusLine: String(data.status_line),
    accentColor: String(data.accent_color),
    tag: data.tag ? String(data.tag) : undefined,
  };
}

export async function putChatProfile(userId: string, profile: ChatProfileJson): Promise<ChatProfileJson> {
  const safe: ChatProfileJson = {
    statusLine: String(profile.statusLine ?? '').slice(0, 80),
    accentColor: String(profile.accentColor ?? 'cyan').slice(0, 24),
    tag: profile.tag ? String(profile.tag).slice(0, 32) : undefined,
  };
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("world_chat_profiles").upsert(
    {
      user_id: userId,
      status_line: safe.statusLine,
      accent_color: safe.accentColor,
      tag: safe.tag ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  return safe;
}
