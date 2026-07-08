import { getSupabaseAdmin } from "./auth";

export type OwnedResourceType =
  | "pick"
  | "parlay"
  | "notification"
  | "post"
  | "comment"
  | "push_subscription"
  | "subscription";

type OwnershipLookup = {
  table: string;
  ownerColumn: string;
  idColumn: string;
  extra?: Record<string, string>;
};

const OWNERSHIP_LOOKUPS: Record<OwnedResourceType, OwnershipLookup> = {
  pick: { table: "picks", ownerColumn: "user_id", idColumn: "id" },
  parlay: { table: "picks", ownerColumn: "user_id", idColumn: "id", extra: { leg_type: "parlay" } },
  notification: { table: "notifications", ownerColumn: "user_id", idColumn: "id" },
  post: { table: "posts", ownerColumn: "author_id", idColumn: "id" },
  comment: { table: "post_comments", ownerColumn: "author_id", idColumn: "id" },
  push_subscription: { table: "push_subscriptions", ownerColumn: "user_id", idColumn: "id" },
  subscription: { table: "subscriptions", ownerColumn: "profile_id", idColumn: "id" },
};

export async function assertUserOwnsResource(
  userId: string,
  resourceType: OwnedResourceType,
  resourceId: string
): Promise<{ ok: true } | { ok: false; warning: string }> {
  const lookup = OWNERSHIP_LOOKUPS[resourceType];
  const supabaseAdmin = await getSupabaseAdmin();
  // Dynamic table/column ownership checks are runtime-safe but too dynamic for
  // Supabase's typed select parser. Keep the runtime filters, but prevent the
  // typed query builder from bottlenecking this generic helper.
  let query = (supabaseAdmin.from(lookup.table) as any)
    .select("*")
    .eq(lookup.idColumn, resourceId)
    .eq(lookup.ownerColumn, userId)
    .limit(1)
    .maybeSingle();

  for (const [column, value] of Object.entries(lookup.extra ?? {})) {
    query = query.eq(column, value);
  }

  const { data, error } = await query;
  if (error) {
    console.warn(
      `[ownership] lookup failed resource=${resourceType} id=${resourceId} user=${userId}: ${error.message}`
    );
    return { ok: false, warning: "ownership lookup failed" };
  }
  if (!data) {
    console.warn(`[ownership] rejected cross-user access resource=${resourceType} id=${resourceId} user=${userId}`);
    return { ok: false, warning: "resource not found for authenticated user" };
  }
  return { ok: true };
}
