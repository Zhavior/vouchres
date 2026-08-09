import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getDiscordTokenEncryptionKeyB64 } from "./discordConfig";

/**
 * AES-256-GCM helpers for encrypting Discord OAuth tokens at rest.
 *
 * The key is a base64-encoded 32-byte value from DISCORD_TOKEN_ENCRYPTION_KEY.
 * Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
 *
 * Output format is a single self-contained string so the database column
 * never needs separate iv/tag columns:
 *   v1.<ivBase64>.<authTagBase64>.<ciphertextBase64>
 *
 * Never log the plaintext or the encrypted payload — both are treated as
 * secrets. Callers should only ever pass the decrypted value directly into
 * an Authorization header, never into a log line or error message.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const FORMAT_VERSION = "v1";

let cachedKey: Buffer | null = null;

function getKeyBuffer(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = getDiscordTokenEncryptionKeyB64();
  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new Error("DISCORD_TOKEN_ENCRYPTION_KEY is not valid base64.");
  }

  if (key.length !== 32) {
    throw new Error(
      `DISCORD_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM (got ${key.length}).`,
    );
  }

  cachedKey = key;
  return key;
}

/** Test-only: force the next getKeyBuffer() call to re-read the env var. */
export function resetDiscordCryptoKeyCacheForTests(): void {
  cachedKey = null;
}

export function encryptDiscordSecret(plaintext: string): string {
  const key = getKeyBuffer();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    FORMAT_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptDiscordSecret(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== FORMAT_VERSION) {
    throw new Error("Malformed encrypted Discord token payload.");
  }
  const [, ivB64, tagB64, cipherB64] = parts;

  const key = getKeyBuffer();
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(cipherB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
