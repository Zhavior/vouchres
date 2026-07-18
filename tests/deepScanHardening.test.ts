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
    expect(readFileSync("server/routes/parlay/parlayUserRoutes.ts", "utf8")).toContain(
      'requireTierOrQuota("gold", 2, "parlay_lab_saves", 50)',
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
});
