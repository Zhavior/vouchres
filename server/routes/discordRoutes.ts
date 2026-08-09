import { Router } from "express";
import type { Response } from "express";
import type { AuthedRequest } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import { requireAuth } from "../middleware/auth";
import { discordLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { AppError } from "../errors/AppError";
import { getSafePublicOrigin } from "../lib/publicOrigin";
import { assertDiscordConfigured, DISCORD_OAUTH_SCOPES } from "../services/discord/discordConfig";
import { createDiscordOAuthState, verifyDiscordOAuthState } from "../services/discord/discordOAuthState";
import { completeDiscordConnection, retryDiscordGuildJoin } from "../services/discord/discordConnectionService";

/**
 * Discord "Connect" OAuth2 routes.
 *
 *   GET  /api/discord/authorize  — auth required. Returns { url } for the
 *                                  client to navigate to (this app has no
 *                                  cookie-session plumbing, so a raw 302
 *                                  redirect from an authenticated fetch
 *                                  can't carry the user's identity across a
 *                                  top-level navigation — see
 *                                  discordOAuthState.ts for the full
 *                                  rationale). Matches the existing
 *                                  Stripe/Google "JSON url, client
 *                                  navigates" convention in this codebase.
 *   GET  /api/discord/callback   — public (Discord's redirect carries no
 *                                  Authorization header). Recovers the
 *                                  VouchEdge user id from the signed state
 *                                  param, completes the handshake, and
 *                                  redirects back into the SPA.
 *   POST /api/discord/retry-join — auth required. Retries the guild-join +
 *                                  role-assignment step using previously
 *                                  stored tokens, without re-running OAuth.
 */
export const discordRoutes = Router();

type AuthedRequestWithContext = AuthedRequest & RequestWithContext;

function frontendRedirectUrl(pathAndQuery: string): string {
  return new URL(pathAndQuery, getSafePublicOrigin()).toString();
}

discordRoutes.get(
  "/authorize",
  discordLimiter,
  requireAuth,
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    const config = assertDiscordConfigured();
    const state = createDiscordOAuthState(req.user!.id);

    const url = new URL("https://discord.com/api/oauth2/authorize");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", DISCORD_OAUTH_SCOPES);
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "consent");

    return res.json(apiOkFlat(req, { url: url.toString() }));
  }),
);

discordRoutes.get(
  "/callback",
  discordLimiter,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const { code, state, error: discordError } = req.query as Record<string, string | undefined>;

    if (discordError) {
      console.warn("[discord] user denied or Discord returned an error on callback", { discordError });
      return res.redirect(frontendRedirectUrl("/settings?discord=denied"));
    }

    if (!code || !state) {
      return res.redirect(frontendRedirectUrl("/settings?discord=error&reason=missing_params"));
    }

    const verified = await verifyDiscordOAuthState(state);
    if (verified.ok === false) {
      console.warn("[discord] callback rejected — invalid state", { reason: verified.reason });
      return res.redirect(frontendRedirectUrl(`/settings?discord=error&reason=state_${verified.reason}`));
    }

    const outcome = await completeDiscordConnection({ userId: verified.userId, code });

    if (outcome.ok === false) {
      return res.redirect(frontendRedirectUrl(`/settings?discord=error&reason=${outcome.reason}`));
    }
    if (outcome.guildMember === true) {
      return res.redirect(frontendRedirectUrl("/settings?discord=connected"));
    }
    // Connected + identity verified, but the guild join didn't succeed —
    // durable retry state, not a broken half-connected one. Surface the
    // reason so the UI can offer a retry action instead of erroring out.
    return res.redirect(frontendRedirectUrl(`/settings?discord=retry&reason=${outcome.reason}`));
  }),
);

discordRoutes.post(
  "/retry-join",
  discordLimiter,
  requireAuth,
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    const outcome = await retryDiscordGuildJoin(req.user!.id);

    if (outcome.ok === false) {
      throw new AppError({
        status: 409,
        code: "conflict",
        message: "Connect your Discord account first.",
        details: { reason: outcome.reason },
      });
    }

    return res.json(apiOkFlat(req, {
      guildMember: outcome.guildMember,
      reason: outcome.guildMember === false ? outcome.reason : undefined,
    }));
  }),
);
