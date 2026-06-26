/**
 * Smoke test: Grading service
 *
 * Verifies that the grading service correctly:
 *   1. Fetches only picks with status='pending'
 *   2. Skips picks whose games aren't final yet
 *   3. Correctly grades HR picks (player hits 1+ HR → won)
 *   4. Correctly grades RBI picks
 *   5. Updates settled_units based on odds_decimal and stake_units
 *   6. Updates trust score after grading
 *   7. Is idempotent — re-running on already-graded picks is a no-op
 *   8. Logs errors for unknown markets
 *
 * Uses a mock fetch to return deterministic boxscore data.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestUser, resetTestDb } from "./setup";

const SKIP = !process.env.SUPABASE_URL_TEST;
const describeOrSkip = SKIP ? describe.skip : describe;

// Mock boxscore — Aaron Judge hits 2 HR, 3 RBI, 2 runs
const MOCK_BOXSCORE = {
  info: { state: "final" },
  status: { state: "final" },
  teams: {
    away: {
      team: { name: "New York Yankees" },
      players: {
        "ID123": {
          person: { fullName: "Aaron Judge" },
          stats: {
            batting: { homeRuns: 2, rbi: 3, runs: 2, atBats: 4 },
          },
        },
        "ID124": {
          person: { fullName: "Giancarlo Stanton" },
          stats: {
            batting: { homeRuns: 0, rbi: 1, runs: 0, atBats: 4 },
          },
        },
      },
    },
    home: {
      team: { name: "Boston Red Sox" },
      players: {},
    },
  },
};

describeOrSkip("Grading service", () => {
  beforeEach(async () => {
    await resetTestDb();
    // Mock global fetch to return our boxscore
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/v1/game/99999/boxscore")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_BOXSCORE),
        } as Response);
      }
      if (url.includes("/v1/game/88888/boxscore")) {
        // Game not final yet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            info: { state: "in_progress" },
            status: { state: "in_progress" },
            teams: { away: { players: {} }, home: { players: {} } },
          }),
        } as Response);
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    }) as any;
  });

  it("grades a winning HR pick (Aaron Judge 1+ HR)", async () => {
    const user = await createTestUser({ username: "grade_test_1", ageConfirmed: true });
    const { createPick } = await import("../server/services/persistence/pickService");
    const { gradePendingPicks } = await import("../server/services/grading/gradingService");

    await createPick({
      user_id: user.id, capper_id: null, leg_type: "single", sport: "mlb",
      event_id: "99999", market: "hr", selection: "Aaron Judge HR",
      odds_decimal: 3.0, stake_units: 2.0, is_demo: false,
    });

    const { graded, skipped } = await gradePendingPicks({ days: 1 });

    expect(graded.length).toBe(1);
    expect(graded[0].status).toBe("won");
    expect(graded[0].settled_units).toBe(4.0); // 2.0 * (3.0 - 1.0) = 4.0
    expect(skipped.length).toBe(0);

    const { supabaseAdmin } = await import("../server/middleware/auth");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("won_picks, lost_picks, net_units, trust_score")
      .eq("id", user.id)
      .single();
    expect(profile.won_picks).toBe(1);
    expect(profile.lost_picks).toBe(0);
    expect(Number(profile.net_units)).toBe(4.0);
    expect(profile.trust_score).toBeGreaterThan(50);
  });

  it("grades a losing HR pick (Stanton 0 HR)", async () => {
    const user = await createTestUser({ username: "grade_test_2", ageConfirmed: true });
    const { createPick } = await import("../server/services/persistence/pickService");
    const { gradePendingPicks } = await import("../server/services/grading/gradingService");

    await createPick({
      user_id: user.id, capper_id: null, leg_type: "single", sport: "mlb",
      event_id: "99999", market: "hr", selection: "Giancarlo Stanton HR",
      odds_decimal: 2.5, stake_units: 1.0, is_demo: false,
    });

    const { graded } = await gradePendingPicks({ days: 1 });

    expect(graded.length).toBe(1);
    expect(graded[0].status).toBe("lost");
    expect(graded[0].settled_units).toBe(-1.0);
  });

  it("grades an RBI-over pick", async () => {
    const user = await createTestUser({ username: "grade_test_3", ageConfirmed: true });
    const { createPick } = await import("../server/services/persistence/pickService");
    const { gradePendingPicks } = await import("../server/services/grading/gradingService");

    // Judge has 3 RBI in the mock — over 2.5 wins
    await createPick({
      user_id: user.id, capper_id: null, leg_type: "single", sport: "mlb",
      event_id: "99999", market: "rbi_over", selection: "Aaron Judge over 2.5 RBI",
      odds_decimal: 2.0, stake_units: 1.0, is_demo: false,
    });

    const { graded } = await gradePendingPicks({ days: 1 });
    expect(graded.length).toBe(1);
    expect(graded[0].status).toBe("won");
  });

  it("skips picks whose games aren't final yet", async () => {
    const user = await createTestUser({ username: "grade_test_4", ageConfirmed: true });
    const { createPick } = await import("../server/services/persistence/pickService");
    const { gradePendingPicks } = await import("../server/services/grading/gradingService");

    await createPick({
      user_id: user.id, capper_id: null, leg_type: "single", sport: "mlb",
      event_id: "88888", market: "hr", selection: "Aaron Judge HR",
      odds_decimal: 3.0, stake_units: 1.0, is_demo: false,
    });

    const { graded, skipped } = await gradePendingPicks({ days: 1 });
    expect(graded.length).toBe(0);
    expect(skipped.length).toBe(1);
    expect(skipped[0].error).toContain("not final");

    // Pick should still be pending in the DB
    const { supabaseAdmin } = await import("../server/middleware/auth");
    const { data: pick } = await supabaseAdmin
      .from("picks")
      .select("status")
      .eq("user_id", user.id)
      .single();
    expect(pick.status).toBe("pending");
  });

  it("is idempotent — re-running doesn't re-grade", async () => {
    const user = await createTestUser({ username: "grade_test_5", ageConfirmed: true });
    const { createPick } = await import("../server/services/persistence/pickService");
    const { gradePendingPicks } = await import("../server/services/grading/gradingService");

    await createPick({
      user_id: user.id, capper_id: null, leg_type: "single", sport: "mlb",
      event_id: "99999", market: "hr", selection: "Aaron Judge HR",
      odds_decimal: 3.0, stake_units: 1.0, is_demo: false,
    });

    const first = await gradePendingPicks({ days: 1 });
    expect(first.graded.length).toBe(1);

    // Re-run — the pick is now 'won', not 'pending', so it shouldn't be picked up
    const second = await gradePendingPicks({ days: 1 });
    expect(second.graded.length).toBe(0);
    expect(second.skipped.length).toBe(0);
  });

  it("records graded_error for unknown markets", async () => {
    const user = await createTestUser({ username: "grade_test_6", ageConfirmed: true });
    const { createPick } = await import("../server/services/persistence/pickService");
    const { gradePendingPicks } = await import("../server/services/grading/gradingService");

    await createPick({
      user_id: user.id, capper_id: null, leg_type: "single", sport: "mlb",
      event_id: "99999", market: "stolen_bases", selection: "Some Guy 2+ SB",
      odds_decimal: 2.0, stake_units: 1.0, is_demo: false,
    });

    const { graded, skipped } = await gradePendingPicks({ days: 1 });
    expect(graded.length).toBe(0);
    expect(skipped.length).toBe(1);
    expect(skipped[0].error).toContain("unknown_market:stolen_bases");
  });

  it("dry-run mode returns results without writing to DB", async () => {
    const user = await createTestUser({ username: "grade_test_7", ageConfirmed: true });
    const { createPick } = await import("../server/services/persistence/pickService");
    const { gradePendingPicks } = await import("../server/services/grading/gradingService");

    await createPick({
      user_id: user.id, capper_id: null, leg_type: "single", sport: "mlb",
      event_id: "99999", market: "hr", selection: "Aaron Judge HR",
      odds_decimal: 3.0, stake_units: 1.0, is_demo: false,
    });

    const result = await gradePendingPicks({ days: 1, dryRun: true });
    expect(result.graded.length).toBe(1);
    expect(result.graded[0].status).toBe("won");

    // Pick should still be pending — dry run didn't write
    const { supabaseAdmin } = await import("../server/middleware/auth");
    const { data: pick } = await supabaseAdmin
      .from("picks")
      .select("status")
      .eq("user_id", user.id)
      .single();
    expect(pick.status).toBe("pending");
  });
});
