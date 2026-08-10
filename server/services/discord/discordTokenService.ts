import { refreshDiscordAccessToken } from "./discordApiClient";
import { DiscordApiError } from "./discordTypes";
import {
  deleteDiscordAuthTokens,
  getDiscordAuthTokens,
  upsertDiscordAuthTokens,
  type DiscordAuthTokens,
} from "../../repositories/discordAuthRepository";

/** Refresh proactively once we're within this window of expiry. */
const REFRESH_BUFFER_MS = 5 * 60_000;

export type LiveAccessTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: "not_connected" }
  | { ok: false; reason: "refresh_failed" };

/**
 * Performs the refresh_token grant unconditionally and persists the result.
 * Shared by getLiveDiscordAccessToken (proactive, buffer-based refresh) and
 * discordGuildService (reactive refresh after an unexpected 401 from the
 * guild-join call, e.g. the user revoked authorization on Discord's side
 * between our last refresh and now).
 *
 * If Discord rejects the refresh (revoked/expired refresh token), the
 * stored token row is purged so a stale, permanently-invalid token can
 * never be retried again — the caller must have the user reconnect.
 */
export async function refreshAndPersistDiscordTokens(userId: string, refreshToken: string): Promise<LiveAccessTokenResult> {
  try {
    const refreshed = await refreshDiscordAccessToken(refreshToken);
    const next: DiscordAuthTokens = {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      scope: refreshed.scope,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    };
    await upsertDiscordAuthTokens(userId, next);
    return { ok: true, accessToken: next.accessToken };
  } catch (error) {
    const status = error instanceof DiscordApiError ? error.status : null;
    console.error("[discord] token refresh failed", { userId, status });

    // 400/401 on a refresh grant means the refresh token itself is dead
    // (revoked by the user, or Discord invalidated it) — no amount of
    // retrying will fix this without the user reconnecting.
    if (status === 400 || status === 401) {
      await deleteDiscordAuthTokens(userId).catch((cleanupError) => {
        console.warn("[discord] failed to purge dead tokens after refresh failure", { userId, cleanupError });
      });
    }

    return { ok: false, reason: "refresh_failed" };
  }
}

/**
 * Returns a live (non-expired) Discord access token for userId, refreshing
 * it first if it's within REFRESH_BUFFER_MS of expiring. Call this before
 * any operation that needs to call the Discord API with the user's token
 * (e.g. the guild-join retry path) — never read discord_oauth_tokens
 * directly and assume the stored access_token is still valid.
 */
export async function getLiveDiscordAccessToken(userId: string): Promise<LiveAccessTokenResult> {
  const tokens = await getDiscordAuthTokens(userId);
  if (!tokens) return { ok: false, reason: "not_connected" };

  const msUntilExpiry = tokens.expiresAt.getTime() - Date.now();
  if (msUntilExpiry > REFRESH_BUFFER_MS) {
    return { ok: true, accessToken: tokens.accessToken };
  }

  return refreshAndPersistDiscordTokens(userId, tokens.refreshToken);
}
