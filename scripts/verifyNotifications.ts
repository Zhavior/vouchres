import {
  buildHomeRunNotification,
  buildParlayGradedNotification,
  type NotificationRecord,
} from "../server/services/notifications/notificationService";
import type { HrEvent } from "../server/services/mlb/hrFeedService";

const userId = "verify-user-1";
const notifications: NotificationRecord[] = [];
const dedupe = new Set<string>();
const warnings: string[] = [];

function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

function createInMemory(payload: ReturnType<typeof buildHomeRunNotification> | ReturnType<typeof buildParlayGradedNotification>) {
  if (dedupe.has(`${userId}:${payload.dedupeKey}`)) {
    return { created: 0, duplicates: 1, warnings: [] as string[] };
  }
  dedupe.add(`${userId}:${payload.dedupeKey}`);
  const now = new Date().toISOString();
  notifications.push({
    id: `verify-${notifications.length + 1}`,
    user_id: userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata,
    dedupe_key: payload.dedupeKey,
    read_at: null,
    created_at: now,
    updated_at: now,
  });
  const pushWarning = pushConfigured() ? [] : ["push skipped: VAPID/web push env vars are not configured"];
  warnings.push(...pushWarning);
  return { created: 1, duplicates: 0, warnings: pushWarning };
}

function apiShape() {
  return {
    notifications,
    unreadCount: notifications.filter((n) => n.read_at === null).length,
    warnings: [...new Set(warnings)],
  };
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const hrEvent: HrEvent = {
  id: "824819-42",
  playerId: 592450,
  playerName: "Aaron Judge",
  headshot: "https://example.com/headshot.png",
  team: "New York Yankees",
  teamAbbr: "NYY",
  opponent: "Boston Red Sox",
  inning: 5,
  halfInning: "top",
  description: "Aaron Judge homers.",
  rbi: 2,
  gamePk: 824819,
  matchup: "NYY @ BOS",
  timestamp: new Date().toISOString(),
};

const firstHr = createInMemory(buildHomeRunNotification(hrEvent));
const duplicateHr = createInMemory(buildHomeRunNotification(hrEvent));
const parlay = createInMemory(
  buildParlayGradedNotification({
    parlayId: "parlay-verify-1",
    status: "won",
    legCount: 3,
    wins: 2,
    losses: 0,
    pushes: 1,
    voids: 0,
  })
);
const response = apiShape();

assert(firstHr.created === 1, "first HR should create one notification");
assert(duplicateHr.created === 0 && duplicateHr.duplicates === 1, "duplicate HR should not create another notification");
assert(parlay.created === 1, "parlay graded should create one notification");
assert(response.unreadCount === 2, `unread count should be 2, got ${response.unreadCount}`);
assert(Array.isArray(response.notifications), "notifications response must include notifications array");
assert(Array.isArray(response.warnings), "notifications response must include warnings array");
assert(response.notifications[0].type === "HOME_RUN", "first notification should be HOME_RUN");
assert(response.notifications[0].dedupe_key === "HOME_RUN:824819:824819-42:592450", "HR dedupe key is wrong");
assert(response.notifications[1].type === "PARLAY_GRADED", "second notification should be PARLAY_GRADED");
if (!pushConfigured()) {
  assert(response.warnings.some((w) => /VAPID|push/i.test(w)), "missing push config should be explained in warnings");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      firstHr,
      duplicateHr,
      parlay,
      unreadCount: response.unreadCount,
      warnings: response.warnings,
      notifications: response.notifications.map((n) => ({
        type: n.type,
        title: n.title,
        message: n.message,
        dedupe_key: n.dedupe_key,
        metadata: n.metadata,
      })),
    },
    null,
    2
  )
);

