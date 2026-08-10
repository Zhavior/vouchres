import { AppError } from "../../errors/AppError";

/**
 * Discord OAuth2 + bot configuration.
 *
 * Server-only. DISCORD_CLIENT_SECRET, DISCORD_BOT_TOKEN, and
 * DISCORD_TOKEN_ENCRYPTION_KEY must never be read from client code or
 * logged. Every getter here throws a clear AppError instead of letting a
 * missing env var surface as a confusing downstream fetch failure.
 */

export interface DiscordConfig {
  clientId: string;
  clientSecret: string;
  botToken: string;
  guildId: string;
  openBetaRoleId: string;
  vouchEdgeRoleId: string;
  redirectUri: string;
}

function readRequiredEnv(name: string): string | null {
  const raw = process.env[name]?.trim();
  return raw ? raw : null;
}

/** True once every var Discord connect needs is present. Cheap, no network call. */
export function isDiscordConfigured(): boolean {
  return Boolean(
    readRequiredEnv("DISCORD_CLIENT_ID") &&
    readRequiredEnv("DISCORD_CLIENT_SECRET") &&
    readRequiredEnv("DISCORD_BOT_TOKEN") &&
    readRequiredEnv("DISCORD_GUILD_ID") &&
    readRequiredEnv("DISCORD_OPEN_BETA_ROLE_ID") &&
    readRequiredEnv("DISCORD_VOUCHEDGE_ROLE_ID") &&
    readRequiredEnv("DISCORD_REDIRECT_URI"),
  );
}

export function assertDiscordConfigured(): DiscordConfig {
  const clientId = readRequiredEnv("DISCORD_CLIENT_ID");
  const clientSecret = readRequiredEnv("DISCORD_CLIENT_SECRET");
  const botToken = readRequiredEnv("DISCORD_BOT_TOKEN");
  const guildId = readRequiredEnv("DISCORD_GUILD_ID");
  const openBetaRoleId = readRequiredEnv("DISCORD_OPEN_BETA_ROLE_ID");
  const vouchEdgeRoleId = readRequiredEnv("DISCORD_VOUCHEDGE_ROLE_ID");
  const redirectUri = readRequiredEnv("DISCORD_REDIRECT_URI");

  if (!clientId || !clientSecret || !botToken || !guildId || !openBetaRoleId || !vouchEdgeRoleId || !redirectUri) {
    console.error("[discord] missing configuration — connect flow disabled", {
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
      hasBotToken: Boolean(botToken),
      hasGuildId: Boolean(guildId),
      hasOpenBetaRoleId: Boolean(openBetaRoleId),
      hasVouchEdgeRoleId: Boolean(vouchEdgeRoleId),
      hasRedirectUri: Boolean(redirectUri),
    });
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Discord connect is not configured on this server yet.",
      details: { reason: "discord_not_configured" },
      expose: true,
    });
  }

  return { clientId, clientSecret, botToken, guildId, openBetaRoleId, vouchEdgeRoleId, redirectUri };
}

/**
 * Key material for AES-256-GCM token encryption and HMAC state signing.
 * Falls back state signing to clientSecret so a fresh setup needs one
 * fewer secret, but a dedicated DISCORD_OAUTH_STATE_SECRET is preferred.
 */
export function getDiscordTokenEncryptionKeyB64(): string {
  const raw = readRequiredEnv("DISCORD_TOKEN_ENCRYPTION_KEY");
  if (!raw) {
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Discord connect is not configured on this server yet.",
      details: { reason: "discord_encryption_key_missing" },
      expose: true,
    });
  }
  return raw;
}

export function getDiscordOAuthStateSecret(): string {
  const dedicated = readRequiredEnv("DISCORD_OAUTH_STATE_SECRET");
  if (dedicated) return dedicated;

  const fallback = readRequiredEnv("DISCORD_CLIENT_SECRET");
  if (fallback) {
    console.warn(
      "[discord] DISCORD_OAUTH_STATE_SECRET is not set — falling back to DISCORD_CLIENT_SECRET " +
      "for state signing. Set a dedicated DISCORD_OAUTH_STATE_SECRET before production traffic.",
    );
    return fallback;
  }

  throw new AppError({
    status: 503,
    code: "external_service_error",
    message: "Discord connect is not configured on this server yet.",
    details: { reason: "discord_state_secret_missing" },
    expose: true,
  });
}

export const DISCORD_OAUTH_SCOPES = "identify guilds.join";
export const DISCORD_API_BASE = "https://discord.com/api/v10";
