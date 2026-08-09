import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";

const VALID_KEY_B64 = randomBytes(32).toString("base64");

describe("discord token encryption (AES-256-GCM)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a plaintext token through encrypt/decrypt", async () => {
    vi.stubEnv("DISCORD_TOKEN_ENCRYPTION_KEY", VALID_KEY_B64);
    const { encryptDiscordSecret, decryptDiscordSecret } = await import("../server/services/discord/discordCrypto");

    const plaintext = "super-secret-discord-access-token";
    const encrypted = encryptDiscordSecret(plaintext);

    expect(encrypted).not.toContain(plaintext);
    expect(encrypted.startsWith("v1.")).toBe(true);
    expect(decryptDiscordSecret(encrypted)).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext each time (random IV)", async () => {
    vi.stubEnv("DISCORD_TOKEN_ENCRYPTION_KEY", VALID_KEY_B64);
    const { encryptDiscordSecret } = await import("../server/services/discord/discordCrypto");

    const a = encryptDiscordSecret("same-value");
    const b = encryptDiscordSecret("same-value");
    expect(a).not.toBe(b);
  });

  it("rejects a tampered ciphertext (auth tag mismatch)", async () => {
    vi.stubEnv("DISCORD_TOKEN_ENCRYPTION_KEY", VALID_KEY_B64);
    const { encryptDiscordSecret, decryptDiscordSecret } = await import("../server/services/discord/discordCrypto");

    const encrypted = encryptDiscordSecret("some-token");
    const [version, iv, tag, ciphertext] = encrypted.split(".");
    const tamperedCiphertext = Buffer.from(ciphertext, "base64");
    tamperedCiphertext[0] ^= 0xff;
    const tampered = [version, iv, tag, tamperedCiphertext.toString("base64")].join(".");

    expect(() => decryptDiscordSecret(tampered)).toThrow();
  });

  it("rejects a malformed payload", async () => {
    vi.stubEnv("DISCORD_TOKEN_ENCRYPTION_KEY", VALID_KEY_B64);
    const { decryptDiscordSecret } = await import("../server/services/discord/discordCrypto");

    expect(() => decryptDiscordSecret("not-a-valid-payload")).toThrow(/Malformed/);
  });

  it("throws a clear error when the encryption key is missing", async () => {
    vi.stubEnv("DISCORD_TOKEN_ENCRYPTION_KEY", "");
    const { encryptDiscordSecret } = await import("../server/services/discord/discordCrypto");

    expect(() => encryptDiscordSecret("x")).toThrow();
  });

  it("throws a clear error when the key does not decode to 32 bytes", async () => {
    vi.stubEnv("DISCORD_TOKEN_ENCRYPTION_KEY", Buffer.from("too-short").toString("base64"));
    const { encryptDiscordSecret } = await import("../server/services/discord/discordCrypto");

    expect(() => encryptDiscordSecret("x")).toThrow(/32 bytes/);
  });
});
