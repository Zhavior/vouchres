import { putGuildMember, putGuildMemberRole, type PutGuildMemberResult } from "./discordApiClient";
import { getDiscordAuthTokens } from "../../repositories/discordAuthRepository";
import { getLiveDiscordAccessToken, refreshAndPersistDiscordTokens } from "./discordTokenService";
import type { GuildJoinOutcome } from "./discordTypes";
import { captureException } from "../../lib/sentry";

/**
 * Server-only. Adds a user to the VouchEdge Discord guild (via their OAuth
 * access_token + guilds.join scope) and assigns the @Open Beta role (via
 * the bot token). NEVER call this from client code and NEVER expose
 * DISCORD_BOT_TOKEN — everything here runs behind requireAuth routes only.
 *
 * Explicit status handling (per Discord's Add Guild Member docs):
 *   201 = newly added — `roles` in the PUT body IS applied at creation time.
 *   204 = already a member — `roles` in the body is NOT applied by Discord
 *         in this case, so we must follow up with a dedicated
 *         PUT .../roles/{role_id} call to guarantee the role is present.
 *   403 = bot lacks "Manage Roles"/"Create Instant Invite" (guilds.join)
 *         permission, or the bot's highest role sits below @Open Beta in
 *         the guild's role hierarchy — Discord refuses role grants above a
 *         bot's own position regardless of permissions. This is an ops
 *         misconfiguration, not a user-fixable error: log loudly, surface
 *         it, and never mark betaAccess true.
 *   401  = the user's access_token was rejected. We already proactively
 *         refresh tokens within a 5-minute buffer (discordTokenService),
 *         so a live 401 here means Discord invalidated the grant since our
 *         last refresh (e.g. the user revoked app access) — refresh once
 *         more and retry exactly once before giving up.
 */
export async function joinGuildAndAssignOpenBetaRole(userId: string, discordUserId: string): Promise<GuildJoinOutcome> {
  const liveToken = await getLiveDiscordAccessToken(userId);
  if (liveToken.ok === false) {
    return liveToken.reason === "not_connected"
      ? { kind: "error", roleAssigned: false, reason: "not_connected" }
      : { kind: "token_expired", roleAssigned: false };
  }

  let result = await putGuildMember(discordUserId, liveToken.accessToken);

  if (result.status === 401) {
    console.warn("[discord] guild join got 401 on a token we believed was live — forcing one refresh + retry", { userId });
    const tokens = await getDiscordAuthTokens(userId);
    if (!tokens) return { kind: "error", roleAssigned: false, reason: "not_connected" };

    const refreshed = await refreshAndPersistDiscordTokens(userId, tokens.refreshToken);
    if (refreshed.ok === false) return { kind: "token_expired", roleAssigned: false };

    result = await putGuildMember(discordUserId, refreshed.accessToken);
  }

  return interpretGuildMemberResult(result, discordUserId);
}

/**
 * Pure interpretation of a putGuildMember response, split out from
 * joinGuildAndAssignOpenBetaRole so it's directly unit-testable without
 * mocking fetch/network calls.
 */
export async function interpretGuildMemberResult(result: PutGuildMemberResult, discordUserId: string): Promise<GuildJoinOutcome> {
  if (result.status === 201) {
    return { kind: "joined_new_member", roleAssigned: true };
  }

  if (result.status === 204) {
    const roleResult = await putGuildMemberRole(discordUserId);
    if (roleResult.status === 204) {
      return { kind: "already_member_role_assigned", roleAssigned: true };
    }
    if (roleResult.status === 403) {
      console.error("[discord] role assignment forbidden — check bot role hierarchy / Manage Roles permission", {
        discordUserId,
        errorCode: roleResult.errorBody?.code,
        errorMessage: roleResult.errorBody?.message,
      });
      // Ops misconfiguration (bot role sits below @Open Beta, or lacks Manage
      // Roles) — this is never a user-fixable error, so it needs to page
      // someone rather than sit quietly in stdout. betaAccess is still never
      // marked true (see guildJoinSucceeded() in discordConnectionService.ts).
      captureException(new Error("[discord] role assignment forbidden — bot role hierarchy or Manage Roles misconfiguration"), {
        tags: { service: "discord", discord_failure: "role_assignment_forbidden" },
        extra: {
          discordUserId,
          errorCode: roleResult.errorBody?.code,
          errorMessage: roleResult.errorBody?.message,
        },
      });
      return { kind: "forbidden", roleAssigned: false, reason: "role_assignment_forbidden" };
    }
    console.error("[discord] role assignment failed with unexpected status", {
      discordUserId,
      status: roleResult.status,
      errorCode: roleResult.errorBody?.code,
      errorMessage: roleResult.errorBody?.message,
    });
    return { kind: "error", roleAssigned: false, reason: `role_assignment_status_${roleResult.status}` };
  }

  if (result.status === 403) {
    console.error("[discord] guild join forbidden — bot lacks permission or role hierarchy issue", {
      discordUserId,
      errorCode: result.errorBody?.code,
      errorMessage: result.errorBody?.message,
    });
    // Same rationale as the role-assignment 403 above: an ops
    // misconfiguration (bot lacks guilds.join-relevant permissions, or its
    // role sits below @Open Beta), never marked as betaAccess success.
    captureException(new Error("[discord] guild join forbidden — bot permission or role hierarchy misconfiguration"), {
      tags: { service: "discord", discord_failure: "guild_join_forbidden" },
      extra: {
        discordUserId,
        errorCode: result.errorBody?.code,
        errorMessage: result.errorBody?.message,
      },
    });
    return { kind: "forbidden", roleAssigned: false, reason: "guild_join_forbidden" };
  }

  console.error("[discord] guild join failed with unexpected status", {
    discordUserId,
    status: result.status,
    errorCode: result.errorBody?.code,
    errorMessage: result.errorBody?.message,
  });
  return { kind: "error", roleAssigned: false, reason: `guild_join_status_${result.status}` };
}
