/** Typed wrappers for the Discord connect API. */
import { apiClient } from "./apiClient";

interface AuthorizeResponse {
  url: string;
}

interface RetryJoinResponse {
  guildMember: boolean;
  reason?: string;
}

/**
 * Starts the Discord OAuth2 handshake. Fetches a freshly signed authorize
 * URL from the backend (auth required — the URL embeds a signed state tied
 * to the current user) then navigates the whole page to Discord, matching
 * the existing Stripe/Google "JSON url, client navigates" pattern used
 * elsewhere in this app (see billingClient.ts).
 */
export async function startDiscordConnect(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const data = await apiClient.get<AuthorizeResponse>("/api/discord/authorize");
    if (!data.url) return { ok: false, error: "No Discord authorize URL returned." };
    window.location.assign(data.url);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || err?.error || "Network error" };
  }
}

/**
 * Retries the guild-join + @Open Beta role step using previously stored
 * tokens — no re-authorization required. Use this when a user is left in
 * the "connected, not yet a verified guild member" state.
 */
export async function retryDiscordGuildJoin(): Promise<
  { ok: true; guildMember: boolean; reason?: string } | { ok: false; error: string }
> {
  try {
    const data = await apiClient.post<RetryJoinResponse>("/api/discord/retry-join");
    return { ok: true, guildMember: data.guildMember, reason: data.reason };
  } catch (err: any) {
    return { ok: false, error: err?.message || err?.error || "Network error" };
  }
}
