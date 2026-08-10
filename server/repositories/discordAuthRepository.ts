import { supabaseAdmin } from "../middleware/auth";
import { decryptDiscordSecret, encryptDiscordSecret } from "../services/discord/discordCrypto";

/**
 * Isolated encrypted-token store for Discord OAuth — table `discord_oauth_tokens`.
 * Never expose decrypted values outside server/services/discord/*.
 * Never log the return value of getDiscordAuthTokens.
 */

export interface DiscordAuthTokens {
  accessToken: string;
  refreshToken: string;
  scope: string;
  expiresAt: Date;
}

interface DiscordOauthTokensRow {
  user_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  token_scope: string;
  expires_at: string;
}

export async function upsertDiscordAuthTokens(userId: string, tokens: DiscordAuthTokens): Promise<void> {
  const row = {
    user_id: userId,
    encrypted_access_token: encryptDiscordSecret(tokens.accessToken),
    encrypted_refresh_token: encryptDiscordSecret(tokens.refreshToken),
    token_scope: tokens.scope,
    expires_at: tokens.expiresAt.toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("discord_oauth_tokens")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    console.error("[discord] failed to persist encrypted tokens", { userId, code: (error as { code?: string }).code });
    throw new Error("Failed to store Discord tokens.");
  }
}

export async function getDiscordAuthTokens(userId: string): Promise<DiscordAuthTokens | null> {
  const { data, error } = await supabaseAdmin
    .from("discord_oauth_tokens")
    .select("user_id, encrypted_access_token, encrypted_refresh_token, token_scope, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[discord] failed to read encrypted tokens", { userId, code: (error as { code?: string }).code });
    throw new Error("Failed to read Discord tokens.");
  }
  if (!data) return null;

  const row = data as DiscordOauthTokensRow;
  return {
    accessToken: decryptDiscordSecret(row.encrypted_access_token),
    refreshToken: decryptDiscordSecret(row.encrypted_refresh_token),
    scope: row.token_scope,
    expiresAt: new Date(row.expires_at),
  };
}

export async function deleteDiscordAuthTokens(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("discord_oauth_tokens")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("[discord] failed to delete tokens", { userId, code: (error as { code?: string }).code });
    throw new Error("Failed to delete Discord tokens.");
  }
}
