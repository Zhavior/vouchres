import { getDiscordProfileState } from "../../repositories/discordProfileRepository";

/**
 * hasBetaAccess(userId) — the single source of truth for gating any Open
 * Beta route/page. Reads the durable `profiles.discord_beta_access` /
 * `profiles.discord_guild_member` columns via supabaseAdmin. Deliberately
 * NEVER makes a live Discord API call — access is derived entirely from
 * what was verified and persisted at connect/retry time, per task
 * constraint: "without relying on the OAuth access token as long-term
 * proof of eligibility."
 *
 * Not to be confused with isFreeBetaActive() in server/lib/betaAccess.ts,
 * an unrelated env-var switch that temporarily unlocks paid tiers for
 * every account during the promotional free beta. This function is the
 * Discord-verified Open Beta gate specifically.
 */
export async function hasBetaAccess(userId: string): Promise<boolean> {
  const state = await getDiscordProfileState(userId);
  if (!state) return false;
  return state.betaAccess && state.discordGuildMember;
}
