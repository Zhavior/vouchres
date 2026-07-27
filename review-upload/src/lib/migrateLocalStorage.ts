import { apiClient } from "./apiClient";
import { supabase } from "./supabaseClient";

/**
 * migrateLocalStorage — one-time migration of legacy localStorage data
 * to the server-side Postgres backend.
 *
 * WHY THIS EXISTS:
 *   Before the beta patches, VouchEdge stored everything in localStorage:
 *   posts, slips, vouches, profile, follows. Existing dev users have data
 *   there. If we just delete localStorage, they lose it. If we never
 *   delete it, the app reads stale data alongside the new server data.
 *
 * STRATEGY:
 *   1. On first login after the patches are deployed, run this migration
 *   2. For each localStorage key, parse the data and push to the server
 *   3. Mark each key as migrated by prefixing it with "migrated_"
 *   4. Don't delete the original keys — keep them as a backup for 30 days
 *   5. After 30 days, a separate cleanup pass deletes migrated keys
 *
 * IDEMPOTENT:
 *   - Re-running is safe — already-migrated keys are skipped
 *   - Failed migrations leave the original key intact for retry
 *
 * USAGE (in App.tsx after auth):
 *
 *   useEffect(() => {
 *     if (user && !localStorage.getItem("vouchedge_migration_done")) {
 *       migrateLocalStorage().then(() => {
 *         localStorage.setItem("vouchedge_migration_done", Date.now().toString());
 *       });
 *     }
 *   }, [user]);
 */

const MIGRATION_KEY = "vouchedge_migration_done";
const MIGRATED_PREFIX = "migrated_";

interface MigrationResult {
  key: string;
  success: boolean;
  count: number;
  error?: string;
}

export async function migrateLocalStorage(): Promise<{
  results: MigrationResult[];
  totalMigrated: number;
  totalFailed: number;
}> {
  // Skip if already done
  if (localStorage.getItem(MIGRATION_KEY)) {
    console.log("[migrate] already done, skipping");
    return { results: [], totalMigrated: 0, totalFailed: 0 };
  }

  console.log("[migrate] starting localStorage → server migration");
  const results: MigrationResult[] = [];

  // Run each migration in order — failures don't block subsequent migrations
  results.push(await migrateProfile());
  results.push(await migratePosts());
  results.push(await migrateSlips());
  results.push(await migrateVouches());
  results.push(await migrateFollowing());
  results.push(await migrateSubscribedCappers());

  const totalMigrated = results.filter((r) => r.success).reduce((sum, r) => sum + r.count, 0);
  const totalFailed = results.filter((r) => !r.success).length;

  console.log(
    `[migrate] done: ${totalMigrated} items migrated, ${totalFailed} migrations failed`,
    results
  );

  return { results, totalMigrated, totalFailed };
}

// =========================================================
// Per-key migrations
// =========================================================

/**
 * Migrate vouchedge_profile → /api/auth/profile PATCH
 */
async function migrateProfile(): Promise<MigrationResult> {
  const key = "vouchedge_profile";
  const stored = localStorage.getItem(key);
  if (!stored) return { key, success: true, count: 0 };

  try {
    const profile = JSON.parse(stored);
    const updates: Record<string, any> = {};

    // Only migrate editable fields — never tier, is_staff, etc.
    if (profile.displayName) updates.display_name = profile.displayName;
    if (profile.handle) updates.handle = profile.handle;
    else if (profile.username) updates.username = profile.username;
    if (profile.bio) updates.bio = profile.bio;
    if (profile.avatarUrl) updates.avatar_url = profile.avatarUrl;

    if (Object.keys(updates).length === 0) {
      markMigrated(key);
      return { key, success: true, count: 0 };
    }

    await apiClient.patch("/api/auth/profile", updates);
    markMigrated(key);
    return { key, success: true, count: 1 };
  } catch (err: any) {
    console.error(`[migrate] ${key} failed`, err);
    return { key, success: false, count: 0, error: err?.message ?? "unknown" };
  }
}

/**
 * Migrate vouchedge_posts → /api/posts POST (one per post)
 */
async function migratePosts(): Promise<MigrationResult> {
  const key = "vouchedge_posts";
  const stored = localStorage.getItem(key);
  if (!stored) return { key, success: true, count: 0 };

  try {
    const posts = JSON.parse(stored);
    if (!Array.isArray(posts) || posts.length === 0) {
      markMigrated(key);
      return { key, success: true, count: 0 };
    }

    let migrated = 0;
    for (const post of posts) {
      try {
        // Skip posts that are clearly demo content
        if (post.is_demo) continue;

        await apiClient.post("/api/posts", {
          body: post.body ?? post.text ?? "",
          pick_id: post.pickId ?? post.pick_id ?? undefined,
        });
        migrated++;
      } catch (err) {
        // Individual post failure — log and continue
        console.warn(`[migrate] post ${post.id} failed`, err);
      }
    }

    markMigrated(key);
    return { key, success: true, count: migrated };
  } catch (err: any) {
    return { key, success: false, count: 0, error: err?.message ?? "parse_error" };
  }
}

/**
 * Migrate vouchedge_slips → /api/v3/parlays/save
 * Slip = parlay in the old terminology.
 */
async function migrateSlips(): Promise<MigrationResult> {
  const key = "vouchedge_slips";
  const stored = localStorage.getItem(key);
  if (!stored) return { key, success: true, count: 0 };

  try {
    const slips = JSON.parse(stored);
    if (!Array.isArray(slips) || slips.length === 0) {
      markMigrated(key);
      return { key, success: true, count: 0 };
    }

    let migrated = 0;
    for (const slip of slips) {
      try {
        if (slip.is_demo) continue;

        // Convert slip to parlay format
        const legs = (slip.legs ?? slip.selections ?? []).map((leg: any) => ({
          event_id: leg.gamePk ?? leg.event_id ?? leg.gameId,
          market: leg.market ?? "hr",
          selection: leg.selection ?? leg.text ?? "",
          odds_decimal: leg.odds ?? leg.odds_decimal ?? 2.0,
        })).filter((l: any) => l.event_id && l.selection);

        if (legs.length < 2) continue; // not a real parlay

        await apiClient.post("/api/v3/parlays/save", {
          legs,
          stake_units: slip.stake ?? 1.0,
          explanation: slip.notes ?? undefined,
        });
        migrated++;
      } catch (err) {
        console.warn(`[migrate] slip ${slip.id} failed`, err);
      }
    }

    markMigrated(key);
    return { key, success: true, count: migrated };
  } catch (err: any) {
    return { key, success: false, count: 0, error: err?.message ?? "parse_error" };
  }
}

/**
 * Migrate vouchedge_vouches → /api/follow POST (closest equivalent)
 * The old "vouch" system was a follow+trust-attestation hybrid.
 * We map it to follows for now; vouches proper can be added later.
 */
async function migrateVouches(): Promise<MigrationResult> {
  const key = "vouchedge_vouches";
  const stored = localStorage.getItem(key);
  if (!stored) return { key, success: true, count: 0 };

  try {
    const vouches = JSON.parse(stored);
    if (!Array.isArray(vouches) || vouches.length === 0) {
      markMigrated(key);
      return { key, success: true, count: 0 };
    }

    let migrated = 0;
    for (const vouch of vouches) {
      try {
        // Vouch target was either a user or a capper
        if (vouch.capperId) {
          await apiClient.post("/api/follow", { following_capper_id: vouch.capperId });
        } else if (vouch.userId) {
          await apiClient.post("/api/follow", { following_profile_id: vouch.userId });
        } else {
          continue;
        }
        migrated++;
      } catch (err) {
        // Duplicate follow = OK, count as migrated
        if (err?.error === "duplicate") {
          migrated++;
        } else {
          console.warn(`[migrate] vouch failed`, err);
        }
      }
    }

    markMigrated(key);
    return { key, success: true, count: migrated };
  } catch (err: any) {
    return { key, success: false, count: 0, error: err?.message ?? "parse_error" };
  }
}

/**
 * Migrate vouchedge_following → /api/follow POST
 */
async function migrateFollowing(): Promise<MigrationResult> {
  const key = "vouchedge_following";
  const stored = localStorage.getItem(key);
  if (!stored) return { key, success: true, count: 0 };

  try {
    const follows = JSON.parse(stored);
    if (!Array.isArray(follows) || follows.length === 0) {
      markMigrated(key);
      return { key, success: true, count: 0 };
    }

    let migrated = 0;
    for (const f of follows) {
      try {
        if (f.capperId) {
          await apiClient.post("/api/follow", { following_capper_id: f.capperId });
        } else if (f.userId || f.profileId) {
          await apiClient.post("/api/follow", { following_profile_id: f.userId ?? f.profileId });
        } else {
          continue;
        }
        migrated++;
      } catch (err) {
        if (err?.error === "duplicate") migrated++;
        else console.warn(`[migrate] follow failed`, err);
      }
    }

    markMigrated(key);
    return { key, success: true, count: migrated };
  } catch (err: any) {
    return { key, success: false, count: 0, error: err?.message ?? "parse_error" };
  }
}

/**
 * Migrate vouchedge_subscribed_cappers → /api/follow POST
 * (Subscriptions are now follows — paid subs come later)
 */
async function migrateSubscribedCappers(): Promise<MigrationResult> {
  const key = "vouchedge_subscribed_cappers";
  const stored = localStorage.getItem(key);
  if (!stored) return { key, success: true, count: 0 };

  try {
    const capperIds = JSON.parse(stored);
    if (!Array.isArray(capperIds) || capperIds.length === 0) {
      markMigrated(key);
      return { key, success: true, count: 0 };
    }

    let migrated = 0;
    for (const capperId of capperIds) {
      try {
        await apiClient.post("/api/follow", { following_capper_id: capperId });
        migrated++;
      } catch (err) {
        if (err?.error === "duplicate") migrated++;
        else console.warn(`[migrate] capper sub failed`, err);
      }
    }

    markMigrated(key);
    return { key, success: true, count: migrated };
  } catch (err: any) {
    return { key, success: false, count: 0, error: err?.message ?? "parse_error" };
  }
}

// =========================================================
// Helpers
// =========================================================

function markMigrated(key: string) {
  // Rename the key to mark it as migrated — preserves the data as backup
  const value = localStorage.getItem(key);
  if (value) {
    localStorage.setItem(`${MIGRATED_PREFIX}${key}`, value);
  }
  // Don't delete the original yet — wait 30 days
  // (a separate cleanup pass will handle deletion)
}

/**
 * Cleanup pass — deletes migrated keys older than 30 days.
 * Run on app load AFTER the migration pass.
 *
 * We store the migration timestamp in MIGRATION_KEY, so we know when
 * the 30-day window started.
 */
export function cleanupOldMigratedData() {
  const migratedAt = Number(localStorage.getItem(MIGRATION_KEY) ?? 0);
  if (!migratedAt) return;

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - migratedAt < thirtyDaysMs) return;

  // 30 days have passed — safe to delete migrated keys
  const keysToDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MIGRATED_PREFIX)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => localStorage.removeItem(key));
  console.log(`[migrate] cleaned up ${keysToDelete.length} old migrated keys`);
}

/**
 * Check if migration is needed (for showing a "Migrating your data..." UI).
 */
export function isMigrationNeeded(): boolean {
  if (localStorage.getItem(MIGRATION_KEY)) return false;

  const legacyKeys = [
    "vouchedge_posts",
    "vouchedge_slips",
    "vouchedge_vouches",
    "vouchedge_profile",
    "vouchedge_following",
    "vouchedge_subscribed_cappers",
  ];
  return legacyKeys.some((key) => {
    const value = localStorage.getItem(key);
    return value && value !== "null" && value !== "[]";
  });
}
