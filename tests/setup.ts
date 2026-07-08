/**
 * Test setup — runs before every test file.
 *
 * Requirements:
 *   - A dedicated TEST Supabase project (NEVER your production project).
 *     Set SUPABASE_URL_TEST + SUPABASE_SERVICE_ROLE_KEY_TEST in .env.test.local
 *   - Stripe in TEST MODE (use sk_test_... keys)
 *   - The test Supabase project must have schema.sql applied
 *
 * Test isolation:
 *   - Each test file calls `resetTestDb()` in beforeEach to TRUNCATE all tables.
 *   - NEVER run these tests against a project with real user data.
 */

import { beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL_TEST ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_TEST ?? "";
const TEST_DB_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn(
    "[test-setup] SUPABASE_URL_TEST or SUPABASE_SERVICE_ROLE_KEY_TEST not set. " +
      "Tests that hit the DB will fail. Copy .env.test.example to .env.test.local."
  );
}

export const testDb = createClient(
  TEST_DB_CONFIGURED ? SUPABASE_URL : "http://127.0.0.1:54321",
  TEST_DB_CONFIGURED ? SUPABASE_SERVICE_KEY : "test-service-role-key",
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

/**
 * Wipe all user-generated rows from the test DB.
 * Preserves the seeded cappers (they have is_demo = true).
 *
 * Call this in beforeEach() of every test file.
 */
export async function resetTestDb(): Promise<void> {
  if (!TEST_DB_CONFIGURED) return; // skip in CI without test DB

  // Order matters: child tables first
  await Promise.all([
    testDb.from("pick_legs").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    testDb.from("post_likes").delete().neq("post_id", "00000000-0000-0000-0000-000000000000"),
    testDb.from("post_comments").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    testDb.from("posts").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    testDb.from("follows").delete().neq("follower_id", "00000000-0000-0000-0000-000000000000"),
    testDb.from("picks").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    testDb.from("subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    testDb.from("beta_signups").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    testDb.from("daily_quotas").delete().neq("profile_id", "00000000-0000-0000-0000-000000000000"),
  ]);

  // Reset trust_scores for cappers back to baseline
  await testDb
    .from("trust_scores")
    .update({
      score: 50.0,
      total_picks: 0,
      won_picks: 0,
      lost_picks: 0,
      pushed_picks: 0,
      net_units: 0.0,
    })
    .eq("subject_type", "capper");

  // Delete all test user profiles (preserve cappers — different table)
  await testDb
    .from("profiles")
    .delete()
    .eq("is_demo", false);

  // Delete test auth.users (cascade will clean up profiles)
  const { data: testUsers } = await testDb.auth.admin.listUsers();
  for (const u of testUsers.users ?? []) {
    if (u.email?.endsWith("@test.vouchedge.dev") || u.email?.includes("+test")) {
      await testDb.auth.admin.deleteUser(u.id);
    }
  }
}

/**
 * Create a test user via the Supabase admin API.
 * Returns { id, email, password }.
 *
 * Email format: test+<random>@test.vouchedge.dev
 * This lets resetTestDb() find and delete them later.
 */
export async function createTestUser(opts?: {
  email?: string;
  password?: string;
  username?: string;
  tier?: "free" | "gold" | "seller_pro";
  ageConfirmed?: boolean;
}): Promise<{
  id: string;
  email: string;
  password: string;
  username: string;
}> {
  const random = Math.random().toString(36).slice(2, 10);
  const email = opts?.email ?? `test+${random}@test.vouchedge.dev`;
  const password = opts?.password ?? `Test1234!${random}`;
  const username = opts?.username ?? `testuser_${random}`;

  const { data, error } = await testDb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: username },
  });

  if (error || !data.user) {
    throw new Error(`createTestUser failed: ${error?.message ?? "unknown"}`);
  }

  // Update profile directly (bypasses the trigger which only sets defaults)
  const profileUpdate: any = {
    username,
    display_name: username,
    tier: opts?.tier ?? "free",
  };
  if (opts?.ageConfirmed) {
    profileUpdate.age_confirmed_at = new Date().toISOString();
    profileUpdate.jurisdiction_confirmed_at = new Date().toISOString();
    profileUpdate.jurisdiction = "US-NV"; // Nevada — legal
  }

  await testDb.from("profiles").update(profileUpdate).eq("id", data.user.id);

  return {
    id: data.user.id,
    email,
    password,
    username,
  };
}

/**
 * Sign in as a test user and return a valid JWT.
 */
export async function signInTestUser(email: string, password: string): Promise<string> {
  const { data, error } = await testDb.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`signInTestUser failed: ${error?.message ?? "no session"}`);
  }
  return data.session.access_token;
}

/**
 * Generate a valid Express request mock for testing middleware directly.
 */
export function mockRequest(overrides: any = {}) {
  return {
    headers: {} as Record<string, string>,
    body: {},
    query: {},
    params: {},
    ip: "127.0.0.1",
    ...overrides,
  };
}

export function mockResponse() {
  const res: any = {
    status: (code: number) => {
      res.statusCode = code;
      return res;
    },
    json: (body: any) => {
      res.body = body;
      return res;
    },
    send: (body: any) => {
      res.body = body;
      return res;
    },
  };
  return res;
}

// Global setup / teardown
beforeAll(async () => {
  // Verify test DB is reachable
  if (TEST_DB_CONFIGURED) {
    const { error } = await testDb.from("cappers").select("id").limit(1);
    if (error) {
      console.error("[test-setup] cannot reach test DB:", error.message);
      throw error;
    }
  }
});

afterAll(async () => {
  // Clean up — final reset
  await resetTestDb();
});
