import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getDiscordOAuthStateSecret } from "./discordConfig";
import { isUpstashEnabled, redisSet } from "../../lib/upstashRedis";

/**
 * Signed, stateless CSRF `state` param for the Discord OAuth2 flow.
 *
 * This app authenticates via a Supabase bearer token that the browser
 * cannot attach to a top-level navigation (Discord's authorize redirect),
 * and there is no cookie-session plumbing wired up yet (server/middleware
 * has no cookie-parser usage — see server/AGENTS.md conventions). So
 * instead of a cookie:
 *
 *   1. GET /api/discord/authorize runs behind requireAuth (Bearer token)
 *      and mints a signed state token binding req.user.id + a random
 *      nonce + a short expiry, then returns { url } for the client to
 *      `window.location.assign` — matching the existing Stripe/Google
 *      "JSON url, client navigates" convention in this codebase.
 *   2. GET /api/discord/callback (necessarily unauthenticated — Discord's
 *      redirect carries no Authorization header) verifies the HMAC
 *      signature + expiry to recover the VouchEdge user id, with no
 *      client-supplied user id ever trusted directly.
 *
 * Format: `<base64url(payload json)>.<base64url(hmac-sha256 signature)>`
 */

const STATE_TTL_SECONDS = 5 * 60;

interface StatePayload {
  uid: string;
  nonce: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function sign(payloadB64: string): string {
  const secret = getDiscordOAuthStateSecret();
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function createDiscordOAuthState(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: StatePayload = {
    uid: userId,
    nonce: randomUUID(),
    iat: now,
    exp: now + STATE_TTL_SECONDS,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export type VerifyStateResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "replayed" };

/**
 * Verifies signature + expiry synchronously, then (best-effort) checks the
 * nonce hasn't been consumed yet when Redis is configured. Replay
 * protection is best-effort by design — the short 5-minute expiry plus
 * Discord's own single-use authorization code are the primary defenses; a
 * missing Redis config degrades to signature+expiry checks only, never to
 * an open failure.
 */
export async function verifyDiscordOAuthState(state: string): Promise<VerifyStateResult> {
  const parts = state.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payloadB64, signature] = parts;

  let expectedSignature: string;
  try {
    expectedSignature = sign(payloadB64);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: StatePayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (
    typeof payload.uid !== "string" || !payload.uid ||
    typeof payload.nonce !== "string" || !payload.nonce ||
    typeof payload.exp !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > payload.exp) return { ok: false, reason: "expired" };

  if (isUpstashEnabled()) {
    try {
      const remainingTtl = Math.max(payload.exp - now, 1);
      const claimed = await redisSet(`discord:oauth:state-nonce:${payload.nonce}`, "1", {
        exSeconds: remainingTtl,
        nx: true,
      });
      if (!claimed) return { ok: false, reason: "replayed" };
    } catch (error) {
      console.warn("[discord] state nonce replay check failed, continuing without it:", (error as Error)?.message ?? error);
    }
  }

  return { ok: true, userId: payload.uid };
}
