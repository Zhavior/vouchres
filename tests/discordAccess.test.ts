import { beforeEach, describe, expect, it, vi } from "vitest";

const getDiscordProfileStateMock = vi.fn();

vi.mock("../server/repositories/discordProfileRepository", () => ({
  getDiscordProfileState: (...args: unknown[]) => getDiscordProfileStateMock(...args),
}));

import { hasBetaAccess } from "../server/services/discord/discordAccess";

/**
 * hasBetaAccess() is the single source of truth gate — these tests pin
 * that it is derived ENTIRELY from the two durable profile columns and
 * never makes any live Discord API call (there is nothing here to mock
 * for a Discord fetch, by construction).
 */
describe("hasBetaAccess — durable Open Beta gate", () => {
  beforeEach(() => {
    getDiscordProfileStateMock.mockReset();
  });

  it("returns true only when both discord_beta_access and discord_guild_member are true", async () => {
    getDiscordProfileStateMock.mockResolvedValue({
      discordUserId: "123",
      discordUsername: "alice",
      discordConnectedAt: "2026-01-01T00:00:00Z",
      discordGuildMember: true,
      betaAccess: true,
      betaAccessGrantedAt: "2026-01-01T00:00:00Z",
    });

    await expect(hasBetaAccess("user-1")).resolves.toBe(true);
  });

  it("returns false when betaAccess is true but discordGuildMember is false (inconsistent state)", async () => {
    getDiscordProfileStateMock.mockResolvedValue({
      discordUserId: "123",
      discordUsername: "alice",
      discordConnectedAt: "2026-01-01T00:00:00Z",
      discordGuildMember: false,
      betaAccess: true,
      betaAccessGrantedAt: "2026-01-01T00:00:00Z",
    });

    await expect(hasBetaAccess("user-1")).resolves.toBe(false);
  });

  it("returns false when discordGuildMember is true but betaAccess is false", async () => {
    getDiscordProfileStateMock.mockResolvedValue({
      discordUserId: "123",
      discordUsername: "alice",
      discordConnectedAt: "2026-01-01T00:00:00Z",
      discordGuildMember: true,
      betaAccess: false,
      betaAccessGrantedAt: null,
    });

    await expect(hasBetaAccess("user-1")).resolves.toBe(false);
  });

  it("returns false when the user has never connected Discord", async () => {
    getDiscordProfileStateMock.mockResolvedValue({
      discordUserId: null,
      discordUsername: null,
      discordConnectedAt: null,
      discordGuildMember: false,
      betaAccess: false,
      betaAccessGrantedAt: null,
    });

    await expect(hasBetaAccess("user-1")).resolves.toBe(false);
  });

  it("returns false when the profile itself cannot be found", async () => {
    getDiscordProfileStateMock.mockResolvedValue(null);

    await expect(hasBetaAccess("missing-user")).resolves.toBe(false);
  });
});
