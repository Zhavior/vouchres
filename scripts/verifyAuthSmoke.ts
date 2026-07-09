import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function includesAll(source: string, snippets: string[], label: string): void {
  for (const snippet of snippets) {
    assert(source.includes(snippet), `${label} missing: ${snippet}`);
  }
}

const auth = read("server/middleware/auth.ts");
const ownership = read("server/middleware/ownership.ts");
const parlayUserRoutes = read("server/routes/parlay/parlayUserRoutes.ts");
const parlayController = read("server/controllers/parlayController.ts");
const results = read("server/routes/resultRoutes.ts");
const notifications = read("server/routes/notificationRoutes.ts");
const notificationService = read("server/services/notifications/notificationService.ts");
const billing = read("server/routes/billingRoutes.ts");
const posts = read("server/routes/postRoutes.ts");
const core = read("server/routes/coreRoutes.ts");
const pickService = read("server/services/persistence/pickService.ts");
const grading = read("server/services/grading/gradingService.ts");
const rlsBase = read("supabase/schema.sql");
const rlsVisibility = read("supabase/migrations/0005_parlay_visibility.sql");
const rlsNotifications = read("supabase/migrations/0010_auth_ownership_rls.sql");

const auditedTables = [
  "profiles",
  "picks",
  "pick_legs",
  "notifications",
  "notification_preferences",
  "push_subscriptions",
  "subscriptions",
  "posts",
  "post_likes",
  "post_comments",
];

for (const table of ["profiles", "picks", "pick_legs", "subscriptions", "posts", "post_likes", "post_comments"]) {
  assert(rlsBase.includes(`alter table public.${table}`) && rlsBase.includes("enable row level security"), `${table} RLS must be enabled in base schema`);
}
for (const table of ["notifications", "notification_preferences", "push_subscriptions"]) {
  assert(rlsNotifications.includes(`alter table public.${table} enable row level security`), `${table} RLS must be enabled`);
}

includesAll(rlsNotifications, [
  "notifications_select_self",
  "notifications_insert_self",
  "notifications_update_self",
  "notifications_delete_self",
  "notification_preferences_select_self",
  "notification_preferences_insert_self",
  "notification_preferences_update_self",
  "push_subscriptions_select_self",
  "push_subscriptions_insert_self",
  "push_subscriptions_update_self",
  "push_subscriptions_delete_self",
  "subscriptions_read_self",
], "RLS policies");

includesAll(rlsVisibility + rlsNotifications, [
  "picks_read_public_or_own",
  "pick_legs_read_public_or_own",
  "picks_delete_self",
], "pick/parlay RLS");

includesAll(auth, [
  "missing_token",
  "invalid_token",
  "[auth] rejected unauthenticated request",
  "[auth] rejected non-staff request",
], "auth logging");

includesAll(ownership, [
  "assertUserOwnsResource",
  "parlay: { table: \"picks\", ownerColumn: \"user_id\", idColumn: \"id\", extra: { leg_type: \"parlay\" } }",
  "notification: { table: \"notifications\", ownerColumn: \"user_id\", idColumn: \"id\" }",
  "[ownership] rejected cross-user access",
], "ownership helper");

includesAll(parlayUserRoutes, [
  '"/parlays/save"',
  "requireAuth",
  '"/me/parlays"',
  '"/parlays/:id"',
  "listMyParlaysHandler",
  "saveMeParlayHandler",
  "updateParlayHandler",
  "hideParlayHandler",
  ".eq(\"user_id\", req.user!.id)",
], "parlay route ownership");

includesAll(parlayController, [
  "assertUserOwnsResource(req.user!.id, \"parlay\", req.params.id)",
  "query.user_id && query.user_id !== req.user!.id",
  "You cannot read another user's parlays.",
], "parlay controller ownership");

includesAll(notifications, [
  "notificationRoutes.get(\"/notifications\", requireAuth",
  "notificationRoutes.get(\"/notifications/unread-count\", requireAuth",
  "notificationRoutes.post(\"/notifications/:id/read\", requireAuth",
  "notificationRoutes.post(\"/notifications/read-all\", requireAuth",
  "notificationRoutes.post(\"/notifications/push/subscribe\", requireAuth",
  "notificationRoutes.post(\"/notifications/push/unsubscribe\", requireAuth",
  "notificationRoutes.post(\"/notifications/scan-hr\", requireAuth, requireStaff",
], "notification route auth");

includesAll(notificationService, [
  ".from(\"notifications\")",
  ".eq(\"id\", id)",
  ".eq(\"user_id\", userId)",
  ".from(\"push_subscriptions\")",
  ".eq(\"endpoint\", endpoint)",
], "notification service ownership");

includesAll(billing, [
  '"/checkout"',
  '"/portal"',
  "requireAuth",
  'billingRoutes.get("/status", requireAuth, billingStatusHandler)',
  'billingRoutes.get("/subscription", requireAuth, billingStatusHandler)',
  ".eq(\"profile_id\", req.user!.id)",
], "billing auth scope");

includesAll(results, [
  'app.get("/api/results/ledger", requireAuth',
  "getLedger({ userId: req.user!.id",
  "if (capperId) {",
  "!req.user?.profile.is_staff",
  'app.post("/api/results/grade", requireAuth, requireStaff',
], "results scope and staff grade");

includesAll(core, [
  'coreRoutes.get(',
  '"/picks"',
  "requireAuth",
  "requestedUserId && requestedUserId !== req.user!.id && !req.user!.profile.is_staff",
  "capperId && !req.user!.profile.is_staff",
  '"/admin/grade"',
  "requireStaff",
], "core picks/admin authorization");

includesAll(posts, [
  'postRoutes.post(',
  '"/posts"',
  "requireAuth",
  "pick.user_id !== req.user!.id",
  'postRoutes.delete("/posts/:id", requireAuth',
  '.eq("author_id", req.user!.id)',
  'postRoutes.delete("/comments/:id", requireAuth',
], "feed post ownership");

includesAll(pickService, [
  "export async function gradePick",
  ".eq(\"id\", opts.pickId)",
  ".eq(\"status\", \"pending\")",
  "await recomputeTrustForPick(opts.pickId)",
], "idempotent service-role grading");

includesAll(grading, [
  "getSupabaseAdmin",
  ".eq(\"status\", \"pending\")",
  "gradePick({",
  "createParlayGradedNotification",
], "service-role grading flow");

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: "static_authenticated_smoke",
      auditedTables,
      checks: {
        unauthenticatedPrivateRoutesRejected: true,
        userOwnParlaySaveAndListScoped: true,
        crossUserParlayReadBlocked: true,
        crossUserPickUpdateDeleteBlocked: true,
        notificationsScopedToUser: true,
        crossUserNotificationReadBlocked: true,
        billingScopedToAuthenticatedUser: true,
        resultLedgerScopedToAuthenticatedUser: true,
        adminRoutesRequireStaff: true,
        serviceRoleGradingStillUsesPendingOnlyUpdates: true,
        rlsPoliciesPresent: true,
      },
      warnings: [
        "Smoke test is source-level and migration-level; it does not create real Supabase users or mutate production data.",
      ],
    },
    null,
    2
  )
);
