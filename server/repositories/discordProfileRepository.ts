import { supabaseAdmin } from "../middleware/auth";

/**
 * Durable Discord connection/verification state on `profiles`. This is the
 * single source of truth read by hasBetaAccess() — never a live Discord
 * API call. Writes here are service-role only, matching the existing
 * profiles write model (server/middleware/auth.ts supabaseAdmin).
 */

export interface DiscordProfileState {
  discordUserId: string | null;
  discordUsername: string | null;
  discordConnectedAt: string | null;
  discordGuildMember: boolean;
  betaAccess: boolean;
  betaAccessGrantedAt: string | null;
}

const DISCORD_PROFILE_COLUMNS =
  "discord_user_id, discord_username, discord_connected_at, discord_guild_member, discord_beta_access, discord_beta_access_granted_at";

interface DiscordProfileRow {
  discord_user_id: string | null;
  discord_username: string | null;
  discord_connected_at: string | null;
  discord_guild_member: boolean;
  discord_beta_access: boolean;
  discord_beta_access_granted_at: string | null;
}

function toDiscordProfileState(row: DiscordProfileRow): DiscordProfileState {
  return {
    discordUserId: row.discord_user_id,
    discordUsername: row.discord_username,
    discordConnectedAt: row.discord_connected_at,
    discordGuildMember: row.discord_guild_member,
    betaAccess: row.discord_beta_access,
    betaAccessGrantedAt: row.discord_beta_access_granted_at,
  };
}

/**
 * Preflight check so a duplicate Discord account link surfaces as a clean,
 * user-facing "already connected to another account" error instead of a
 * raw unique-constraint violation bubbling up from the update call.
 */
export async function findProfileIdByDiscordUserId(discordUserId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("discord_user_id", discordUserId)
    .maybeSingle();

  if (error) {
    console.error("[discord] failed to check discord_user_id uniqueness", { code: (error as { code?: string }).code });
    throw new Error("Failed to verify Discord account uniqueness.");
  }
  return (data as { id: string } | null)?.id ?? null;
}

export async function getDiscordProfileState(userId: string): Promise<DiscordProfileState | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(DISCORD_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[discord] failed to read profile discord state", { userId, code: (error as { code?: string }).code });
    throw new Error("Failed to read Discord connection state.");
  }
  if (!data) return null;
  return toDiscordProfileState(data as DiscordProfileRow);
}

/**
 * Records that the OAuth handshake + identity lookup succeeded, independent
 * of whether the guild join succeeded. Called first so a connected-but-not-
 * yet-a-guild-member state is durable and retryable — never silently
 * dropped if the guild join step fails right after this.
 */
export async function recordDiscordIdentity(userId: string, params: { discordUserId: string; discordUsername: string }): Promise<void> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      discord_user_id: params.discordUserId,
      discord_username: params.discordUsername,
      discord_connected_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("[discord] failed to record discord identity", { userId, code: (error as { code?: string }).code });
    throw new Error("Failed to save Discord connection.");
  }
}

/**
 * Records the outcome of the guild-join attempt. betaAccess is only ever
 * set true when guildMember is true — enforced here as well as by callers,
 * so a bug upstream can never silently grant access without a verified
 * guild membership + role assignment.
 */
export async function recordGuildJoinOutcome(userId: string, params: { guildMember: boolean }): Promise<void> {
  const betaAccess = params.guildMember;
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      discord_guild_member: params.guildMember,
      discord_beta_access: betaAccess,
      discord_beta_access_granted_at: betaAccess ? new Date().toISOString() : null,
    })
    .eq("id", userId);

  if (error) {
    console.error("[discord] failed to record guild join outcome", { userId, code: (error as { code?: string }).code });
    throw new Error("Failed to save Discord guild membership state.");
  }
}
