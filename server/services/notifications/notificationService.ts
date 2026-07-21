import { getSupabaseAdmin } from "../../middleware/auth";
import type { HrEvent } from "../mlb/hrFeedService";
import { getTodayHomeRuns } from "../mlb/hrFeedService";

export type NotificationType =
  | "HOME_RUN"
  | "PARLAY_GRADED"
  | "NEW_FOLLOWER"
  | "FOLLOWED_POST"
  | "PARLAY_TAILED";

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  dedupe_key: string;
  read_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface NotificationPrefs {
  in_app_enabled: boolean;
  hr_alerts_enabled: boolean;
  parlay_alerts_enabled: boolean;
  follow_alerts_enabled: boolean;
  tail_alerts_enabled: boolean;
  browser_push_enabled: boolean;
}

export interface NotificationCreateResult {
  created: number;
  duplicates: number;
  pushSent: number;
  pushSkipped: number;
  warnings: string[];
}

export interface NotificationListResult {
  notifications: NotificationRecord[];
  unreadCount: number;
  warnings: string[];
}

export interface NotificationListOptions {
  limit?: number;
  includeLiveHomeRuns?: boolean;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

type StoredPushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

const DEFAULT_PREFS: NotificationPrefs = {
  in_app_enabled: true,
  hr_alerts_enabled: true,
  parlay_alerts_enabled: true,
  follow_alerts_enabled: true,
  tail_alerts_enabled: true,
  browser_push_enabled: false,
};

const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205", "PGRST204", "42703"]);

export function missingTable(error: any): boolean {
  return error?.code && MISSING_TABLE_CODES.has(error.code);
}

function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

let webPushModulePromise: Promise<any> | null = null;

async function getWebPushModule() {
  if (!webPushModulePromise) {
    webPushModulePromise = import("web-push").then((mod) => {
      const webPush = mod.default ?? mod;
      webPush.setVapidDetails(
        process.env.VAPID_SUBJECT!,
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!,
      );
      return webPush;
    });
  }
  return webPushModulePromise;
}

export function getPublicVapidKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

function notificationUrl(type: NotificationType, metadata: Record<string, unknown>): string {
  if (type === "HOME_RUN" && metadata.playerId) {
    return `/hr-board?hrPlayer=${encodeURIComponent(String(metadata.playerId))}`;
  }
  if (type === "PARLAY_GRADED" || type === "PARLAY_TAILED") {
    return "/notifications";
  }
  if (type === "NEW_FOLLOWER" || type === "FOLLOWED_POST") {
    return "/following";
  }
  return "/notifications";
}

export function typeEnabled(type: NotificationType, prefs: NotificationPrefs): boolean {
  if (!prefs.in_app_enabled) return false;
  if (type === "HOME_RUN") return prefs.hr_alerts_enabled;
  if (type === "PARLAY_GRADED") return prefs.parlay_alerts_enabled;
  if (type === "NEW_FOLLOWER" || type === "FOLLOWED_POST") return prefs.follow_alerts_enabled;
  if (type === "PARLAY_TAILED") return prefs.tail_alerts_enabled;
  return true;
}

export async function getPrefs(userId: string): Promise<{ prefs: NotificationPrefs; warnings: string[] }> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("notification_preferences")
      .select("in_app_enabled, hr_alerts_enabled, parlay_alerts_enabled, follow_alerts_enabled, tail_alerts_enabled, browser_push_enabled")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      if (missingTable(error)) return { prefs: DEFAULT_PREFS, warnings: ["notification_preferences table missing; using safe defaults"] };
      return { prefs: DEFAULT_PREFS, warnings: [`preference lookup failed: ${error.message}`] };
    }
    return { prefs: { ...DEFAULT_PREFS, ...(data ?? {}) }, warnings: [] };
  } catch (err: any) {
    return { prefs: DEFAULT_PREFS, warnings: [`preference lookup unavailable: ${err?.message ?? "unknown error"}`] };
  }
}

async function getRecipientUserIds(explicitUserIds?: string[]): Promise<{ userIds: string[]; warnings: string[] }> {
  if (explicitUserIds?.length) return { userIds: [...new Set(explicitUserIds)], warnings: [] };
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .limit(1000);
    if (error) return { userIds: [], warnings: [`recipient lookup failed: ${error.message}`] };
    return { userIds: (data ?? []).map((row: any) => String(row.id)), warnings: [] };
  } catch (err: any) {
    return { userIds: [], warnings: [`recipient lookup unavailable: ${err?.message ?? "unknown error"}`] };
  }
}

export async function maybeSendPush(args: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  prefs: NotificationPrefs;
}): Promise<{ sent: number; skipped: number; warnings: string[] }> {
  if (!args.prefs.browser_push_enabled) {
    return { sent: 0, skipped: 1, warnings: ["push skipped: browser push preference disabled"] };
  }
  if (!pushConfigured()) {
    return { sent: 0, skipped: 1, warnings: ["push skipped: VAPID/web push env vars are not configured"] };
  }
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", args.userId);

    if (error) {
      if (missingTable(error)) {
        return { sent: 0, skipped: 1, warnings: [`push skipped: push_subscriptions table missing: ${error.message}`] };
      }
      return { sent: 0, skipped: 1, warnings: [`push subscription lookup failed: ${error.message}`] };
    }

    const subscriptions = (data ?? []) as StoredPushSubscriptionRow[];
    if (subscriptions.length === 0) {
      return { sent: 0, skipped: 1, warnings: ["push skipped: no active push subscriptions for user"] };
    }

    const webPush = await getWebPushModule();
    const payload = JSON.stringify({
      title: args.title,
      message: args.message,
      metadata: args.metadata,
      url: notificationUrl(args.type, args.metadata),
    });

    let sent = 0;
    let skipped = 0;
    const warnings: string[] = [];

    for (const subscription of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        sent += 1;
      } catch (error: any) {
        skipped += 1;
        const statusCode = Number(error?.statusCode ?? 0);
        warnings.push(`push send failed (${statusCode || "unknown"}): ${error?.message ?? "unknown error"}`);
        if (statusCode === 404 || statusCode === 410) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("user_id", args.userId)
            .eq("endpoint", subscription.endpoint);
        }
      }
    }

    return { sent, skipped, warnings: [...new Set(warnings)] };
  } catch (error: any) {
    return { sent: 0, skipped: 1, warnings: [`push sender failed: ${error?.message ?? "unknown error"}`] };
  }
}

export async function createNotification(args: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  dedupeKey: string;
}): Promise<NotificationCreateResult> {
  const warnings: string[] = [];

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("notification_jobs").insert({
      user_id: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      metadata: args.metadata,
      dedupe_key: args.dedupeKey,
      status: "pending"
    });
    
    if (error) {
      if (missingTable(error)) {
        return { created: 0, duplicates: 0, pushSent: 0, pushSkipped: 1, warnings: [`notification_jobs table missing: ${error.message}`] };
      }
      throw error;
    }
  } catch (err: any) {
    return { created: 0, duplicates: 0, pushSent: 0, pushSkipped: 1, warnings: [`notification job insert failed: ${err?.message ?? "unknown error"}`] };
  }

  // Delivery stats are now handled asynchronously by the worker
  return { created: 1, duplicates: 0, pushSent: 0, pushSkipped: 0, warnings };
}

export function homeRunDedupeKey(event: Pick<HrEvent, "gamePk" | "id" | "playerId">): string {
  return `HOME_RUN:${event.gamePk}:${event.id}:${event.playerId}`;
}

export function buildHomeRunNotification(event: HrEvent) {
  return {
    type: "HOME_RUN" as const,
    title: "Home Run Alert",
    message: `${event.playerName} homered for ${event.teamAbbr || event.team}.`,
    metadata: {
      playerId: event.playerId,
      playerName: event.playerName,
      teamId: (event as any).teamId ?? null,
      teamAbbr: event.teamAbbr,
      gameId: String(event.gamePk),
      inning: event.inning,
      eventId: event.id,
      source: "mlb_live_feed",
    },
    dedupeKey: homeRunDedupeKey(event),
  };
}

export async function createHomeRunNotifications(
  event: HrEvent,
  opts: { userIds?: string[] } = {}
): Promise<NotificationCreateResult> {
  const start = Date.now();
  const recipients = await getRecipientUserIds(opts.userIds);
  const warnings = [...recipients.warnings];
  
  if (recipients.userIds.length === 0) {
    return { created: 0, duplicates: 0, pushSent: 0, pushSkipped: 0, warnings };
  }

  const payload = buildHomeRunNotification(event);
  const jobs = recipients.userIds.map(userId => ({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata,
    dedupe_key: payload.dedupeKey,
    status: "pending"
  }));

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    // Chunk insert in batches of 500
    for (let i = 0; i < jobs.length; i += 500) {
      const chunk = jobs.slice(i, i + 500);
      const { error } = await supabaseAdmin.from("notification_jobs").insert(chunk);
      if (error) throw error;
    }
  } catch (err: any) {
    warnings.push(`bulk job insert failed: ${err.message}`);
    return { created: 0, duplicates: 0, pushSent: 0, pushSkipped: jobs.length, warnings };
  }

  console.log(
    `[notifications] HR event ${event.id} queued ${jobs.length} delivery jobs in ${Date.now() - start}ms`
  );
  
  return { created: jobs.length, duplicates: 0, pushSent: 0, pushSkipped: 0, warnings: [...new Set(warnings)] };
}

export async function processHomeRunEvents(
  events: HrEvent[],
  opts: { userIds?: string[] } = {}
): Promise<NotificationCreateResult & { scanned: number }> {
  let created = 0;
  let duplicates = 0;
  let pushSent = 0;
  let pushSkipped = 0;
  const warnings: string[] = [];
  for (const event of events) {
    const result = await createHomeRunNotifications(event, opts);
    created += result.created;
    duplicates += result.duplicates;
    pushSent += result.pushSent;
    pushSkipped += result.pushSkipped;
    warnings.push(...result.warnings);
  }
  console.log(`[notifications] HR events scanned=${events.length} created=${created} duplicates=${duplicates}`);
  return { scanned: events.length, created, duplicates, pushSent, pushSkipped, warnings: [...new Set(warnings)] };
}

export async function syncLiveHomeRunNotificationsForUser(userId: string): Promise<string[]> {
  try {
    const feed = await getTodayHomeRuns();
    const result = await processHomeRunEvents(feed.events, { userIds: [userId] });
    return result.warnings;
  } catch (err: any) {
    return [`live HR notification sync failed: ${err?.message ?? "unknown error"}`];
  }
}

export function buildParlayGradedNotification(args: {
  parlayId: string;
  status: string;
  legCount: number;
  wins: number;
  losses: number;
  pushes: number;
  voids: number;
}) {
  return {
    type: "PARLAY_GRADED" as const,
    title: "Parlay Graded",
    message: `Your ${args.legCount}-leg parlay was graded: ${args.status}.`,
    metadata: {
      parlayId: args.parlayId,
      status: args.status,
      wins: args.wins,
      losses: args.losses,
      pushes: args.pushes,
      voids: args.voids,
    },
    dedupeKey: `PARLAY_GRADED:${args.parlayId}`,
  };
}

export async function ensureFollowAlertsEnabled(userId: string): Promise<void> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data } = await supabaseAdmin
      .from("notification_preferences")
      .select("user_id, follow_alerts_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) {
      await supabaseAdmin.from("notification_preferences").upsert({
        user_id: userId,
        follow_alerts_enabled: true,
        tail_alerts_enabled: true,
        updated_at: new Date().toISOString(),
      });
      return;
    }

    if (data.follow_alerts_enabled === false) {
      await supabaseAdmin
        .from("notification_preferences")
        .update({
          follow_alerts_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
  } catch (err: any) {
    if (missingTable(err)) return;
    throw err;
  }
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPrefs> {
  const { prefs } = await getPrefs(userId);
  return prefs;
}

export async function updateNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> {
  const supabaseAdmin = await getSupabaseAdmin();
  const payload = {
    user_id: userId,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin.from("notification_preferences").upsert(payload);
  if (error && !missingTable(error)) throw error;
  return getNotificationPreferences(userId);
}

export async function createNewFollowerNotification(input: {
  followerId: string;
  followingProfileId: string;
  relationshipType: string;
}): Promise<NotificationCreateResult> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: follower } = await supabaseAdmin
    .from("profiles")
    .select("username, display_name")
    .eq("id", input.followerId)
    .maybeSingle();

  const name = String(follower?.display_name ?? follower?.username ?? "Someone");
  const action = input.relationshipType === "tail"
    ? "started tailing you"
    : input.relationshipType === "subscribe"
      ? "subscribed to you"
      : "followed you";

  return createNotification({
    userId: input.followingProfileId,
    type: "NEW_FOLLOWER",
    title: "New follower",
    message: `${name} ${action}.`,
    metadata: {
      followerId: input.followerId,
      relationshipType: input.relationshipType,
    },
    dedupeKey: `NEW_FOLLOWER:${input.followerId}:${input.followingProfileId}:${input.relationshipType}`,
  });
}

export async function createFollowedActivityNotification(input: {
  userId: string;
  authorId: string;
  authorName: string;
  postId: string;
  pickId?: string | null;
  relationshipType: string;
  message: string;
}): Promise<NotificationCreateResult> {
  return createNotification({
    userId: input.userId,
    type: "FOLLOWED_POST",
    title: input.relationshipType === "tail" ? "Tailing update" : "Following update",
    message: input.message,
    metadata: {
      authorId: input.authorId,
      authorName: input.authorName,
      postId: input.postId,
      pickId: input.pickId ?? null,
      relationshipType: input.relationshipType,
    },
    dedupeKey: `FOLLOWED_POST:${input.userId}:${input.postId}`,
  });
}

export async function createParlayTailedNotification(input: {
  sourceUserId: string;
  tailedByUserId: string;
  sourcePickId: string;
  tailedPickId: string;
}): Promise<NotificationCreateResult> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: tailedBy } = await supabaseAdmin
    .from("profiles")
    .select("username, display_name")
    .eq("id", input.tailedByUserId)
    .maybeSingle();

  const name = String(tailedBy?.display_name ?? tailedBy?.username ?? "Someone");

  return createNotification({
    userId: input.sourceUserId,
    type: "PARLAY_TAILED",
    title: "Parlay tailed",
    message: `${name} tailed your parlay slip.`,
    metadata: {
      tailedByUserId: input.tailedByUserId,
      sourcePickId: input.sourcePickId,
      tailedPickId: input.tailedPickId,
    },
    dedupeKey: `PARLAY_TAILED:${input.sourcePickId}:${input.tailedByUserId}`,
  });
}

export async function createParlayGradedNotification(args: {
  userId: string;
  parlayId: string;
  status: string;
  legCount: number;
  wins: number;
  losses: number;
  pushes: number;
  voids: number;
}): Promise<NotificationCreateResult> {
  const payload = buildParlayGradedNotification(args);
  const result = await createNotification({
    userId: args.userId,
    ...payload,
  });
  console.log(`[notifications] parlay graded parlay=${args.parlayId} status=${args.status} created=${result.created} duplicates=${result.duplicates}`);
  return result;
}

export async function listNotifications(userId: string, options: number | NotificationListOptions = 50): Promise<NotificationListResult> {
  const opts = typeof options === "number"
    ? { limit: options, includeLiveHomeRuns: true }
    : { limit: options.limit ?? 50, includeLiveHomeRuns: options.includeLiveHomeRuns ?? true };
  const warnings: string[] = [];
  if (opts.includeLiveHomeRuns) {
    warnings.push(...(await syncLiveHomeRunNotificationsForUser(userId)));
  }
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const [rows, unread] = await Promise.all([
      supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(Math.min(opts.limit, 100)),
      supabaseAdmin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null),
    ]);
    if (rows.error) throw rows.error;
    if (unread.error) throw unread.error;
    return { notifications: (rows.data ?? []) as NotificationRecord[], unreadCount: unread.count ?? 0, warnings };
  } catch (err: any) {
    return { notifications: [], unreadCount: 0, warnings: [`notifications unavailable: ${err?.message ?? "unknown error"}`] };
  }
}

export async function markNotificationRead(userId: string, id: string): Promise<NotificationListResult> {
  const supabaseAdmin = await getSupabaseAdmin();
  await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  return listNotifications(userId);
}

export async function markAllNotificationsRead(userId: string): Promise<NotificationListResult> {
  const supabaseAdmin = await getSupabaseAdmin();
  await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  return listNotifications(userId);
}

export async function savePushSubscription(userId: string, input: PushSubscriptionInput, userAgent?: string): Promise<{ ok: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  if (!pushConfigured()) warnings.push("push subscription stored, but VAPID/web push env vars are not configured");
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      user_agent: userAgent ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" }
  );
  if (error) return { ok: false, warnings: [`push subscription failed: ${error.message}`, ...warnings] };
  return { ok: true, warnings };
}

export async function deletePushSubscription(userId: string, endpoint: string): Promise<{ ok: boolean; warnings: string[] }> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
  if (error) return { ok: false, warnings: [`push unsubscribe failed: ${error.message}`] };
  return { ok: true, warnings: [] };
}
