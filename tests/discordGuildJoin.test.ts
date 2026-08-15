import { beforeEach, describe, expect, it, vi } from "vitest";

const putGuildMemberRoleMock = vi.fn();

vi.mock("../server/services/discord/discordApiClient", () => ({
  putGuildMember: vi.fn(),
  putGuildMemberRole: (...args: unknown[]) => putGuildMemberRoleMock(...args),
}));

import { interpretGuildMemberResult } from "../server/services/discord/discordGuildService";
import { isGuildJoinSuccess } from "../server/services/discord/discordTypes";
import type { PutGuildMemberResult } from "../server/services/discord/discordApiClient";

describe("interpretGuildMemberResult — Discord guild join status handling", () => {
  beforeEach(() => {
    putGuildMemberRoleMock.mockReset();
  });

  it("201 (newly added) — roles were applied at creation, no follow-up call needed", async () => {
    const result: PutGuildMemberResult = { status: 201, member: { nick: null, roles: ["role-1"], joined_at: "now" }, errorBody: null };

    const outcome = await interpretGuildMemberResult(result, "discord-user-1");

    expect(outcome).toEqual({ kind: "joined_new_member", roleAssigned: true });
    expect(putGuildMemberRoleMock).not.toHaveBeenCalled();
  });

  it("204 (already a member) + role assignment succeeds", async () => {
    putGuildMemberRoleMock.mockResolvedValue({ status: 204, errorBody: null });
    const result: PutGuildMemberResult = { status: 204, member: null, errorBody: null };

    const outcome = await interpretGuildMemberResult(result, "discord-user-2");

    expect(outcome).toEqual({ kind: "already_member_role_assigned", roleAssigned: true });
    expect(putGuildMemberRoleMock).toHaveBeenCalledWith("discord-user-2");
  });

  it("204 (already a member) + role assignment forbidden — still verified membership", async () => {
    putGuildMemberRoleMock.mockResolvedValue({ status: 403, errorBody: { code: 50013, message: "Missing Permissions" } });
    const result: PutGuildMemberResult = { status: 204, member: null, errorBody: null };

    const outcome = await interpretGuildMemberResult(result, "discord-user-3");

    expect(outcome).toEqual({ kind: "already_member", roleAssigned: false });
    expect(isGuildJoinSuccess(outcome)).toBe(true);
  });

  it("204 (already a member) + role 403 for the guild owner — still verified membership", async () => {
    putGuildMemberRoleMock.mockResolvedValue({ status: 403, errorBody: { code: 50013, message: "Missing Permissions" } });
    const result: PutGuildMemberResult = { status: 204, member: null, errorBody: null };

    const outcome = await interpretGuildMemberResult(result, "discord-owner");

    expect(outcome).toEqual({ kind: "already_member", roleAssigned: false });
    expect(isGuildJoinSuccess(outcome)).toBe(true);
  });

  it("403 on the initial join call — forbidden, never marks access granted", async () => {
    const result: PutGuildMemberResult = { status: 403, member: null, errorBody: { code: 50013, message: "Missing Permissions" } };

    const outcome = await interpretGuildMemberResult(result, "discord-user-4");

    expect(outcome).toEqual({ kind: "forbidden", roleAssigned: false, reason: "guild_join_forbidden" });
    expect(putGuildMemberRoleMock).not.toHaveBeenCalled();
  });

  it("unexpected status on the initial join call — error, never marks access granted", async () => {
    const result: PutGuildMemberResult = { status: 500, member: null, errorBody: { message: "Internal Server Error" } };

    const outcome = await interpretGuildMemberResult(result, "discord-user-5");

    expect(outcome).toEqual({ kind: "error", roleAssigned: false, reason: "guild_join_status_500" });
  });

  it("unexpected status on the role-assignment follow-up call — membership still verified", async () => {
    putGuildMemberRoleMock.mockResolvedValue({ status: 500, errorBody: { message: "Internal Server Error" } });
    const result: PutGuildMemberResult = { status: 204, member: null, errorBody: null };

    const outcome = await interpretGuildMemberResult(result, "discord-user-6");

    expect(outcome).toEqual({ kind: "already_member", roleAssigned: false });
    expect(isGuildJoinSuccess(outcome)).toBe(true);
  });
});
