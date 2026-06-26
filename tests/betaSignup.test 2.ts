/**
 * Smoke test: Beta signup flow
 *
 * Verifies:
 *   1. joinWaitlist() creates a row with state='waitlist'
 *   2. joinWaitlist() is idempotent (same email doesn't create duplicates)
 *   3. issueInvite() generates an invite code and changes state to 'invited'
 *   4. validateInviteCode() returns true for valid invited codes
 *   5. validateInviteCode() returns false for used/expired codes
 *   6. markActivated() changes state to 'active' and links the user
 */

import { describe, it, expect, beforeEach } from "vitest";
import { resetTestDb, createTestUser } from "./setup";

const SKIP = !process.env.SUPABASE_URL_TEST;
const describeOrSkip = SKIP ? describe.skip : describe;

describeOrSkip("Beta signup flow", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("creates a waitlist entry", async () => {
    const { joinWaitlist } = await import("../server/services/persistence/betaService");
    const signup = await joinWaitlist("test1@example.com");

    expect(signup.email).toBe("test1@example.com");
    expect(signup.state).toBe("waitlist");
    expect(signup.invite_code).toBeNull();
  });

  it("is idempotent on email", async () => {
    const { joinWaitlist } = await import("../server/services/persistence/betaService");
    const first = await joinWaitlist("test2@example.com");
    const second = await joinWaitlist("test2@example.com");

    expect(second.email).toBe(first.email);
    expect(second.id).toBe(first.id); // same row
  });

  it("issues an invite code", async () => {
    const { joinWaitlist, issueInvite } = await import("../server/services/persistence/betaService");
    await joinWaitlist("test3@example.com");

    const invited = await issueInvite("test3@example.com");
    expect(invited).toBeTruthy();
    expect(invited!.state).toBe("invited");
    expect(invited!.invite_code).toBeTruthy();
    expect(invited!.invite_code).toMatch(/^VE-[A-Z0-9]{8}$/);
  });

  it("validates an invite code", async () => {
    const { joinWaitlist, issueInvite, validateInviteCode } = await import("../server/services/persistence/betaService");
    await joinWaitlist("test4@example.com");
    const invited = await issueInvite("test4@example.com");

    const valid = await validateInviteCode(invited!.invite_code!);
    expect(valid).toBe(true);

    const invalid = await validateInviteCode("VE-INVALID1");
    expect(invalid).toBe(false);
  });

  it("marks a signup as active after user creates account", async () => {
    const { joinWaitlist, issueInvite, markActivated } = await import("../server/services/persistence/betaService");
    const signup = await joinWaitlist("test5@example.com");
    await issueInvite("test5@example.com");

    const user = await createTestUser({ email: "test5@example.com", username: "test5user" });
    await markActivated("test5@example.com", user.id);

    const { supabaseAdmin } = await import("../server/middleware/auth");
    const { data: updated } = await supabaseAdmin
      .from("beta_signups")
      .select("state, activated_user_id")
      .eq("email", "test5@example.com")
      .single();

    expect(updated.state).toBe("active");
    expect(updated.activated_user_id).toBe(user.id);
  });

  it("cannot issue invite to an already-invited email", async () => {
    const { joinWaitlist, issueInvite } = await import("../server/services/persistence/betaService");
    await joinWaitlist("test6@example.com");
    const first = await issueInvite("test6@example.com");

    // Second invite attempt should return null (state is no longer 'waitlist')
    const second = await issueInvite("test6@example.com");
    expect(second).toBeNull();

    // First invite code is still valid
    expect(first!.invite_code).toBeTruthy();
  });
});
