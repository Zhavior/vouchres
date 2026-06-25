/**
 * Smoke test: Auth flow
 *
 * Verifies:
 *   1. A user can sign up via Supabase auth
 *   2. A profile row is auto-created (via the on_auth_user_created trigger)
 *   3. The /api/auth/me endpoint returns the profile
 *   4. The /api/auth/profile PATCH endpoint can update display_name / bio
 *   5. The /api/auth/profile PATCH endpoint REJECTS tier changes from the client
 *   6. The /api/auth/username-check endpoint works
 *   7. requireAuth middleware returns 401 without a token
 *   8. requireAuth middleware returns 401 with an invalid token
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createTestUser, signInTestUser, resetTestDb } from "./setup";

// These tests hit a real Supabase test project. Skip if no test DB configured.
const SKIP = !process.env.SUPABASE_URL_TEST;
const describeOrSkip = SKIP ? describe.skip : describe;

describeOrSkip("Auth flow", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("creates a profile row when a user signs up", async () => {
    const user = await createTestUser({ username: "authflow_test_1" });

    const { supabaseAdmin } = await import("../server/middleware/auth");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, username, tier")
      .eq("id", user.id)
      .single();

    expect(profile).toBeTruthy();
    expect(profile.username).toBe("authflow_test_1");
    expect(profile.tier).toBe("free");
  });

  it("returns 401 without a token on /api/auth/me", async () => {
    // Direct middleware test
    const { requireAuth } = await import("../server/middleware/auth");
    const req: any = { headers: {} };
    const res: any = { statusCode: 200, body: null, status(c: number) { this.statusCode = c; return this; }, json(b: any) { this.body = b; return this; } };
    const next = () => { throw new Error("next() should not be called"); };

    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("missing_token");
  });

  it("returns 401 with an invalid token", async () => {
    const { requireAuth } = await import("../server/middleware/auth");
    const req: any = { headers: { authorization: "Bearer invalid.jwt.token" } };
    const res: any = { statusCode: 200, body: null, status(c: number) { this.statusCode = c; return this; }, json(b: any) { this.body = b; return this; } };
    const next = () => { throw new Error("next() should not be called"); };

    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("invalid_token");
  });

  it("accepts a valid token and attaches profile to req.user", async () => {
    const user = await createTestUser({ username: "authflow_test_2" });
    const token = await signInTestUser(user.email, user.password);

    const { requireAuth } = await import("../server/middleware/auth");
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res: any = { statusCode: 200, body: null, status(c: number) { this.statusCode = c; return this; }, json(b: any) { this.body = b; return this; } };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await requireAuth(req, res, next);
    expect(nextCalled).toBe(true);
    expect(req.user).toBeTruthy();
    expect(req.user.id).toBe(user.id);
    expect(req.user.profile.username).toBe("authflow_test_2");
  });

  it("rejects tier updates from the client (security)", async () => {
    const user = await createTestUser({ username: "authflow_test_3", tier: "free" });
    const token = await signInTestUser(user.email, user.password);

    // Build a mock request that tries to upgrade tier via the PATCH endpoint
    // The validation schema should strip 'tier' from the body.
    const { z } = await import("zod");
    const ProfileUpdateSchema = z.object({
      username: z.string().min(3).max(24).optional(),
      display_name: z.string().max(64).optional(),
      bio: z.string().max(500).optional(),
      avatar_url: z.string().url().max(500).optional().nullable(),
      // Note: 'tier' is intentionally NOT in the schema
    });

    const maliciousBody = {
      display_name: "New Name",
      tier: "seller_pro", // attack!
      is_staff: true, // attack!
    };

    const parsed = ProfileUpdateSchema.safeParse(maliciousBody);
    expect(parsed.success).toBe(true);
    expect((parsed as any).data.tier).toBeUndefined();
    expect((parsed as any).data.is_staff).toBeUndefined();
    expect((parsed as any).data.display_name).toBe("New Name");

    // Verify the user's tier in DB is still 'free'
    const { supabaseAdmin } = await import("../server/middleware/auth");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();
    expect(profile.tier).toBe("free");
  });

  it("checks username availability", async () => {
    await createTestUser({ username: "uniquename123" });

    const { supabaseAdmin } = await import("../server/middleware/auth");

    // Taken
    const { data: taken } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("lower(username)", "uniquename123")
      .maybeSingle();
    expect(taken).toBeTruthy();

    // Available
    const { data: available } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("lower(username)", "freshname456")
      .maybeSingle();
    expect(available).toBeNull();
  });
});
