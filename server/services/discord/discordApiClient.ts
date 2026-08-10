import { DISCORD_API_BASE, assertDiscordConfigured } from "./discordConfig";
import { DiscordApiError, type DiscordApiErrorBody, type DiscordGuildMember, type DiscordTokenResponse, type DiscordUser } from "./discordTypes";

/**
 * Low-level Discord REST calls. No business logic here — callers
 * (discordGuildService, discordConnectionService) interpret status codes.
 *
 * Every request has a hard timeout so a slow/hanging Discord response can
 * never stall a Vercel serverless invocation indefinitely.
 */

const REQUEST_TIMEOUT_MS = 8000;

async function parseErrorBody(res: Response): Promise<DiscordApiErrorBody | null> {
  try {
    return (await res.json()) as DiscordApiErrorBody;
  } catch {
    return null;
  }
}

/** POST /oauth2/token — authorization_code grant. Never logs the code or resulting tokens. */
export async function exchangeAuthorizationCode(code: string): Promise<DiscordTokenResponse> {
  const config = assertDiscordConfigured();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });

  const res = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errorBody = await parseErrorBody(res);
    console.error("[discord] authorization_code exchange failed", { status: res.status, code: errorBody?.code, message: errorBody?.message });
    throw new DiscordApiError({ status: res.status, body: errorBody, endpoint: "POST /oauth2/token (authorization_code)" });
  }

  return (await res.json()) as DiscordTokenResponse;
}

/** POST /oauth2/token — refresh_token grant. Never logs the refresh/access tokens. */
export async function refreshDiscordAccessToken(refreshToken: string): Promise<DiscordTokenResponse> {
  const config = assertDiscordConfigured();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errorBody = await parseErrorBody(res);
    console.error("[discord] refresh_token exchange failed", { status: res.status, code: errorBody?.code, message: errorBody?.message });
    throw new DiscordApiError({ status: res.status, body: errorBody, endpoint: "POST /oauth2/token (refresh_token)" });
  }

  return (await res.json()) as DiscordTokenResponse;
}

/** GET /users/@me with the *user's* OAuth access token (identify scope). */
export async function fetchCurrentDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errorBody = await parseErrorBody(res);
    console.error("[discord] GET /users/@me failed", { status: res.status, code: errorBody?.code, message: errorBody?.message });
    throw new DiscordApiError({ status: res.status, body: errorBody, endpoint: "GET /users/@me" });
  }

  return (await res.json()) as DiscordUser;
}

export interface PutGuildMemberResult {
  status: number;
  member: DiscordGuildMember | null;
  errorBody: DiscordApiErrorBody | null;
}

/**
 * PUT /guilds/{guild.id}/members/{user.id} — bot-authenticated, with the
 * user's OAuth access_token in the body (guilds.join scope required).
 *
 * Per Discord's docs: 201 = newly added (roles in the body ARE applied on
 * creation); 204 = already a member (roles in the body are NOT applied —
 * callers must follow up with putGuildMemberRole for that case).
 */
export async function putGuildMember(discordUserId: string, userAccessToken: string): Promise<PutGuildMemberResult> {
  const config = assertDiscordConfigured();

  const res = await fetch(`${DISCORD_API_BASE}/guilds/${config.guildId}/members/${discordUserId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${config.botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_token: userAccessToken,
      roles: [config.openBetaRoleId, config.vouchEdgeRoleId],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (res.status === 201) {
    return { status: res.status, member: (await res.json()) as DiscordGuildMember, errorBody: null };
  }
  if (res.status === 204) {
    return { status: res.status, member: null, errorBody: null };
  }

  const errorBody = await parseErrorBody(res);
  return { status: res.status, member: null, errorBody };
}

/**
 * PUT /guilds/{guild.id}/members/{user.id}/roles/{role.id} — bot-authenticated.
 * Idempotent: 204 whether or not the member already held the role.
 * Required follow-up when putGuildMember returns 204 (already a member),
 * since Discord does not apply the `roles` body param in that case.
 */
export async function putGuildMemberRole(discordUserId: string): Promise<{ status: number; errorBody: DiscordApiErrorBody | null }> {
  const config = assertDiscordConfigured();

  for (const roleId of [config.openBetaRoleId, config.vouchEdgeRoleId]) {
    const res = await fetch(
      `${DISCORD_API_BASE}/guilds/${config.guildId}/members/${discordUserId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bot ${config.botToken}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (res.status !== 204) {
      const errorBody = await parseErrorBody(res);
      return { status: res.status, errorBody };
    }
  }

  return { status: 204, errorBody: null };
}
