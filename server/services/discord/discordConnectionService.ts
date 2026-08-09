import { exchangeAuthorizationCode, fetchCurrentDiscordUser } from "./discordApiClient";
import { joinGuildAndAssignOpenBetaRole } from "./discordGuildService";
import { upsertDiscordAuthTokens } from "../../repositories/discordAuthRepository";
import {
  findProfileIdByDiscordUserId,
  getDiscordProfileState,
  recordDiscordIdentity,
  recordGuildJoinOutcome,
} from "../../repositories/discordProfileRepository";
import type { GuildJoinOutcome } from "./discordTypes";

export type DiscordConnectionOutcome =
  | { ok: true; guildMember: true; discordUsername: string }
  | { ok: true; guildMember: false; discordUsername: string; retryable: true; reason: string }
  | { ok: false; reason: "already_linked_to_another_account" }
  | { ok: false; reason: "exchange_failed" }
  | { ok: false; reason: "identity_lookup_failed" };

function guildJoinSucceeded(outcome: GuildJoinOutcome): boolean {
  return outcome.kind === "joined_new_member" || outcome.kind === "already_member_role_assigned";
}

function guildJoinFailureReason(outcome: GuildJoinOutcome): string {
  if (outcome.kind === "forbidden") return outcome.reason;
  if (outcome.kind === "token_expired") return "token_expired";
  if (outcome.kind === "error") return outcome.reason;
  return "unknown";
}

/**
 * Full "user just completed the Discord OAuth redirect" flow, called by
 * GET /api/discord/callback.
 *
 * Ordering is deliberate for the "no broken half-connected state" contract:
 * identity (discord_user_id/username/connected_at) is persisted BEFORE the
 * guild-join attempt, and encrypted tokens are always stored regardless of
 * guild-join outcome. If the guild join then fails, the user is left in a
 * clearly-modeled "connected, not yet a verified guild member" state with
 * everything needed to retry (retryDiscordGuildJoin) WITHOUT re-doing OAuth
 * — never a state where discord_connected_at is set but tokens vanished,
 * or vice versa.
 */
export async function completeDiscordConnection(params: { userId: string; code: string }): Promise<DiscordConnectionOutcome> {
  const { userId, code } = params;

  let tokenResponse;
  try {
    tokenResponse = await exchangeAuthorizationCode(code);
  } catch (error) {
    console.error("[discord] code exchange failed during callback", { userId, message: (error as Error)?.message });
    return { ok: false, reason: "exchange_failed" };
  }

  let discordUser;
  try {
    discordUser = await fetchCurrentDiscordUser(tokenResponse.access_token);
  } catch (error) {
    console.error("[discord] GET /users/@me failed during callback", { userId, message: (error as Error)?.message });
    return { ok: false, reason: "identity_lookup_failed" };
  }

  const existingOwnerId = await findProfileIdByDiscordUserId(discordUser.id);
  if (existingOwnerId && existingOwnerId !== userId) {
    console.warn("[discord] rejected connect — discord account already linked to a different VouchEdge account", {
      userId,
      discordUserId: discordUser.id,
    });
    return { ok: false, reason: "already_linked_to_another_account" };
  }

  // Tokens are stored regardless of what happens next — the retry path
  // depends on them being present even if the guild join below fails.
  await upsertDiscordAuthTokens(userId, {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    scope: tokenResponse.scope,
    expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
  });

  const discordUsername = discordUser.global_name || discordUser.username;
  await recordDiscordIdentity(userId, { discordUserId: discordUser.id, discordUsername });

  const outcome = await joinGuildAndAssignOpenBetaRole(userId, discordUser.id);
  const guildMember = guildJoinSucceeded(outcome);
  await recordGuildJoinOutcome(userId, { guildMember });

  if (guildMember) {
    return { ok: true, guildMember: true, discordUsername };
  }
  return { ok: true, guildMember: false, discordUsername, retryable: true, reason: guildJoinFailureReason(outcome) };
}

export type RetryGuildJoinOutcome =
  | { ok: true; guildMember: true }
  | { ok: true; guildMember: false; reason: string }
  | { ok: false; reason: "not_connected" };

/**
 * Retries the guild-join + role-assignment step using the Discord identity
 * and stored (auto-refreshed) tokens from a prior completeDiscordConnection
 * call — no re-authorization required. This is the "retry path" for a user
 * left in the connected-but-not-a-guild-member state (e.g. a transient
 * Discord outage, or an ops permission fix after a 403).
 */
export async function retryDiscordGuildJoin(userId: string): Promise<RetryGuildJoinOutcome> {
  const profileState = await getDiscordProfileState(userId);
  if (!profileState?.discordUserId) {
    return { ok: false, reason: "not_connected" };
  }

  const outcome = await joinGuildAndAssignOpenBetaRole(userId, profileState.discordUserId);
  const guildMember = guildJoinSucceeded(outcome);
  await recordGuildJoinOutcome(userId, { guildMember });

  if (guildMember) return { ok: true, guildMember: true };
  return { ok: true, guildMember: false, reason: guildJoinFailureReason(outcome) };
}
