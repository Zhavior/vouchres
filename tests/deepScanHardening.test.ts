import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("deep-scan backend hardening", () => {
  it("public capper picks require visibility=public and fail closed", () => {
    const src = readFileSync("server/routes/publicRoutes.ts", "utf8");
    expect(src).toContain('.eq("visibility", "public")');
    expect(src).toContain("refusing unfiltered capper picks");
  });

  it("follower-gated subscriber routes deliver public and subscriber visibility", () => {
    const src = readFileSync("server/routes/subscriberRoutes.ts", "utf8");
    expect(src).toContain('FOLLOWER_PICK_VISIBILITIES = ["public", "subscriber"]');
    expect(src).toContain("isFollowerVisiblePick");
    expect(src).toContain('.in("visibility", [...FOLLOWER_PICK_VISIBILITIES])');
    expect(src).toContain("loadCapperAnnouncementPosts");
    // Open feed/public embeds stay public-only; feed-linked fallback stays public-only.
    expect(src).toMatch(/postedPicks[\s\S]*\.eq\("visibility", "public"\)/);
  });

  it("schedules Stripe cancel on account deletion", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    const stripe = readFileSync("server/services/billing/stripeService.ts", "utf8");
    expect(privacy).toContain("cancelSubscriptionsForProfile");
    expect(stripe).toContain("export async function cancelSubscriptionsForProfile");
  });

  it("hard deletion clears notifications, vouches, DMs, stories, and join tables", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    expect(privacy).toContain('table: "notifications"');
    expect(privacy).toContain('table: "vouches"');
    expect(privacy).toContain('table: "dm_participants"');
    expect(privacy).toContain('table: "user_stories"');
    expect(privacy).toContain('table: "story_views"');
    expect(privacy).toContain('table: "comment_likes"');
    expect(privacy).toContain('table: "parlay_tails"');
  });

  it("distributed lock release is atomic compare-and-delete", () => {
    const lock = readFileSync("server/lib/distributedLock.ts", "utf8");
    const redis = readFileSync("server/lib/upstashRedis.ts", "utf8");
    expect(redis).toContain("export async function redisReleaseLock");
    expect(redis).toContain('redis.call("get", KEYS[1]) == ARGV[1]');
    expect(lock).toContain("redisReleaseLock");
    expect(lock).not.toContain("redisGet(key)");
  });

  it("quota reservation refunds on failed responses", () => {
    const entitlements = readFileSync("server/middleware/entitlements.ts", "utf8");
    expect(entitlements).toContain("refundQuotaCounter");
    expect(entitlements).toContain('maybeRefund("finish")');
    expect(entitlements).toContain("pending: true");
  });

  it("results grade writes to Postgres persistence", () => {
    const src = readFileSync("server/routes/resultRoutes.ts", "utf8");
    expect(src).toContain("persistGradePick");
    expect(src).toContain('source: "postgres"');
    expect(src).not.toContain("gradeAndLearn");
  });

  it("auth epoch Redis failure does not trust cache as epoch 0", () => {
    const auth = readFileSync("server/middleware/auth.ts", "utf8");
    expect(auth).toContain("epoch === null");
    expect(auth).toContain("Promise<number | null>");
  });

  it("auth epoch L1 expires so Redis bumps propagate across instances", () => {
    const auth = readFileSync("server/middleware/auth.ts", "utf8");
    expect(auth).toContain("AUTH_EPOCH_L1_TTL_MS");
    expect(auth).toContain("expiresAt");
    expect(auth).toContain("local.expiresAt > Date.now()");
  });

  it("discover feed is demo-only", () => {
    const posts = readFileSync("server/routes/postRoutes.ts", "utf8");
    expect(posts).toMatch(/\/feed\/discover[\s\S]*\.eq\("is_demo", true\)/);
  });

  it("memory lock uses promise-chain mutex (no thundering herd)", () => {
    const lock = readFileSync("server/lib/distributedLock.ts", "utf8");
    expect(lock).toContain("memoryLockTails");
    expect(lock).toContain("await previous");
    expect(lock).not.toContain("while (memoryWaiters.has");
  });

  it("erasure checks anonymize RPC errors and wipes trust_scores", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    const migration = readFileSync(
      "supabase/migrations/20260718190000_fix_anonymize_user_picks.sql",
      "utf8",
    );
    expect(privacy).toContain("anonymize_user_picks failed");
    expect(privacy).toContain('.from("trust_scores")');
    expect(migration).toContain("delete from public.picks");
    expect(migration).toContain("delete from public.trust_scores");
  });

  it("live HR matcher and parent settle refuse ambiguous states", () => {
    const matcher = readFileSync("server/services/grading/liveHrParlayService.ts", "utf8");
    const parent = readFileSync("server/services/grading/liveHrParlayWriteService.ts", "utf8");
    const pipeline = readFileSync("server/services/mlb/hrPipeline.ts", "utf8");
    expect(matcher).toContain("CANONICAL_HR_MARKET_CODES");
    expect(matcher).not.toContain('haystack.includes("hr")');
    expect(parent).toContain("TERMINAL_LEG_STATUSES");
    expect(pipeline).toContain("officialStarterSpot");
    expect(pipeline).toContain("officialStartersFromBoxscoreTeam");
    expect(pipeline).not.toContain("batters.forEach((playerId: number, index: number)");
  });

  it("DMs require mutual follow on create and send", () => {
    const hub = readFileSync("server/services/social/followingHubService.ts", "utf8");
    expect(hub).toContain("assertMutualFollowForDm");
    expect(hub).toContain("dm_requires_mutual_follow");
    expect(hub).toContain("isFriend");
    expect(hub).toMatch(/sendDirectMessage[\s\S]*assertMutualFollowForDm/);
    expect(hub).toMatch(/findOrCreateDirectConversation[\s\S]*assertMutualFollowForDm/);
    const routes = readFileSync("server/routes/socialHubRoutes.ts", "utf8");
    expect(routes).toContain("dm_requires_mutual_follow");
  });

  it("paid expensive routes have paidDailyLimit ceilings", () => {
    expect(readFileSync("server/routes/coreRoutes.ts", "utf8")).toContain(
      'requireTierOrQuota("gold", 3, "picks_per_day", 100)',
    );
    expect(readFileSync("server/routes/agentRoutes.ts", "utf8")).toContain(
      'requireTierOrQuota("gold", 5, "agent_generate_picks", 100)',
    );
    expect(readFileSync("server/routes/parlay/mountParlaySupportRoutes.ts", "utf8")).toContain(
      'requireTierOrQuota("gold", 2, "parlay_lab_saves")',
    );
  });

  it("owner subscriber channels require targetId === userId", () => {
    const src = readFileSync("server/routes/subscriberRoutes.ts", "utf8");
    expect(src).toContain('kind === "owner"');
    expect(src).toContain("owner_channel_forbidden");
    expect(src).toContain("targetId !== userId");
  });

  it("feed-linked profile parlays require visibility=public", () => {
    const src = readFileSync("server/routes/subscriberRoutes.ts", "utf8");
    expect(src).toContain("refusing unfiltered feed-linked parlays");
    expect(src).toMatch(/postedPicks[\s\S]*\.eq\("visibility", "public"\)/);
  });

  it("feed share locks and forces public before post insert and strips private embeds", () => {
    const posts = readFileSync("server/routes/postRoutes.ts", "utf8");
    expect(posts).toContain("Lock + public BEFORE insert");
    expect(posts).toContain("sanitizePostPickEmbed");
    expect(posts).toContain("pick_lock_required");
    expect(posts).toContain("pick_visibility_required");
    expect(posts).toContain("visibility !== \"public\"");
    expect(posts).not.toContain("parlay lock failed");
  });

  it("quota gate reserves under a per-user lock before the handler", () => {
    const entitlements = readFileSync("server/middleware/entitlements.ts", "utf8");
    expect(entitlements).toContain("runWithDistributedLock");
    expect(entitlements).toContain("`quota:${profileId}:${quotaKey}:${day}`");
    expect(entitlements).toContain("incrementQuotaCounter");
  });

  it("Stripe customer ensure is serialized per profile", () => {
    const stripe = readFileSync("server/services/billing/stripeService.ts", "utf8");
    expect(stripe).toContain("`stripe-customer:${profileId}`");
    expect(stripe).toContain("Do not mutate local entitlements when Stripe cancel was incomplete");
  });

  it("Stripe customer bind fails closed and cleans up orphans", () => {
    const stripe = readFileSync("server/services/billing/stripeService.ts", "utf8");
    expect(stripe).toContain("stripe_customer_bind_failed");
    expect(stripe).toContain("deleteStripeCustomer(customer.id)");
    expect(stripe).toMatch(/update\(\{\s*stripe_customer_id: customer\.id\s*\}\)[\s\S]*\.select\("id"\)[\s\S]*\.maybeSingle\(\)/);
  });

  it("legal confirm bumps auth epoch so gates refresh immediately", () => {
    const core = readFileSync("server/routes/coreRoutes.ts", "utf8");
    expect(core).toContain("bumpAuthUserEpoch");
    expect(core).toMatch(/\/legal\/confirm[\s\S]*await bumpAuthUserEpoch\(req\.user!\.id\)/);
  });

  it("avatar and story media URLs require https", () => {
    const schema = readFileSync("server/lib/httpsUrlSchema.ts", "utf8");
    const auth = readFileSync("server/routes/authRoutes.ts", "utf8");
    const social = readFileSync("server/routes/socialHubRoutes.ts", "utf8");
    expect(schema).toContain('protocol === "https:"');
    expect(auth).toContain("HttpsUrlSchema");
    expect(auth).toContain("avatar_url: HttpsUrlSchema");
    expect(social).toContain("HttpsUrlSchema");
    expect(social).toContain("media_url: HttpsUrlSchema");
  });

  it("deletion schedule does not toggle is_banned", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    expect(privacy).not.toContain("is_banned: true");
    expect(privacy).not.toContain("is_banned: false");
    const auth = readFileSync("server/middleware/auth.ts", "utf8");
    expect(auth).toContain("authAccessError");
    expect(auth).toContain("pendingDeletionAuthError");
  });

  it("production deletion fails closed when Stripe cancel is incomplete", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    expect(privacy).toContain("isProductionRuntime");
    expect(privacy).toContain("stripe_cancel_incomplete");
    expect(privacy).toContain("deletion_scheduled_at: null");
  });

  it("checkout session creation is serialized per profile", () => {
    const stripe = readFileSync("server/services/billing/stripeService.ts", "utf8");
    expect(stripe).toContain("runWithDistributedLock");
    expect(stripe).toContain("`checkout:${opts.profileId}`");
  });

  it("checkout preserves AppError conflicts and expires open sessions", () => {
    const billing = readFileSync("server/v3/modules/billing/handlers.ts", "utf8");
    const stripe = readFileSync("server/services/billing/stripeService.ts", "utf8");
    expect(billing).toContain("if (isAppError(err)) throw err");
    expect(stripe).toContain('status: "open"');
    expect(stripe).toContain("checkout.sessions.expire");
    expect(stripe).toContain("subscriptions.list");
  });

  it("portal always repairs via ensureStripeCustomer", () => {
    const stripe = readFileSync("server/services/billing/stripeService.ts", "utf8");
    expect(stripe).toMatch(/createPortalSession[\s\S]*ensureStripeCustomer/);
    expect(stripe).not.toMatch(/createPortalSession[\s\S]*profile\?\.stripe_customer_id\s*\?\s*profile\.stripe_customer_id/);
  });

  it("refund/dispute cancels Stripe subscriptions before access revoke", () => {
    const billing = readFileSync("server/services/billing/stripeWebhookProcessor.ts", "utf8");
    expect(billing).toContain("cancelSubscriptionsForProfile");
    expect(billing).toContain("charge.refunded");
    expect(billing).toContain("charge.dispute.created");
  });

  it("DSAR export supplements deletion-surface tables", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    expect(privacy).toContain("loadDsarRows");
    expect(privacy).toContain('table: "notifications"');
    expect(privacy).toContain('table: "vouches"');
    expect(privacy).toContain('table: "user_stories"');
    expect(privacy).toContain('table: "dm_messages"');
    expect(privacy).toContain('table: "parlay_tails"');
  });

  it("expensive HR reads use a tighter limiter and debug stays staff-only", () => {
    const limits = readFileSync("server/middleware/rateLimit.ts", "utf8");
    const hr = readFileSync("server/routes/mlbHrBoardRoutes.ts", "utf8");
    expect(limits).toContain("mlbExpensiveReadLimiter");
    expect(hr).toContain("mlbExpensiveReadLimiter");
    expect(hr).toMatch(/today\/debug[\s\S]*requireStaff/);
    expect(hr).toMatch(/today\/deep[\s\S]*mlbExpensiveReadLimiter/);
  });

  it("AI social drafts prefer confirmed candidates and label projected fallback", () => {
    const drafts = readFileSync("server/services/aiJudges/socialDraftService.ts", "utf8");
    expect(drafts).toContain("projectedUnconfirmed");
    expect(drafts).toContain("Official lineup not posted yet");
    expect(drafts).not.toMatch(/const candidates = \[\s*\.\.\.safeArray[\s\S]*projectedCandidates/);
  });

  it("HR notification scan refuses unscoped profile fan-out", () => {
    const notifications = readFileSync("server/services/notifications/notificationService.ts", "utf8");
    expect(notifications).toContain("refusing unscoped profile fan-out");
    expect(notifications).toContain('eq("hr_alerts_enabled", true)');
    expect(notifications).not.toMatch(/from\("profiles"\)\s*\n\s*\.select\("id"\)\s*\n\s*\.limit\(1000\)/);
  });
});
