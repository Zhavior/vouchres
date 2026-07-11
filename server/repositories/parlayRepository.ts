import { getSupabaseAdmin } from "../middleware/auth";

export type ParlayRow = Record<string, any>;
export type ParlayLegRow = Record<string, any>;

export interface PaginatedParlayRows {
  rows: ParlayRow[];
  total: number;
}

async function admin() {
  return getSupabaseAdmin();
}

export async function findUserParlayById(userId: string, parlayId: string): Promise<ParlayRow | null> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("*")
    .eq("id", parlayId)
    .eq("user_id", userId)
    .eq("leg_type", "parlay")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function findLegsForPick(pickId: string): Promise<ParlayLegRow[]> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("pick_legs")
    .select("*")
    .eq("pick_id", pickId)
    .order("leg_index", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function findUserParlayByClientRef(input: {
  userId: string;
  clientRef: string;
}): Promise<ParlayRow | null> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("*")
    .eq("user_id", input.userId)
    .eq("client_ref", input.clientRef)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function findLegsForPicks(pickIds: string[]): Promise<Record<string, ParlayLegRow[]>> {
  if (pickIds.length === 0) return {};

  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("pick_legs")
    .select("*")
    .in("pick_id", pickIds)
    .order("leg_index", { ascending: true });

  if (error) throw error;

  return (data ?? []).reduce((acc: Record<string, ParlayLegRow[]>, leg: ParlayLegRow) => {
    const key = String(leg.pick_id);
    acc[key] = acc[key] ?? [];
    acc[key].push(leg);
    return acc;
  }, {});
}

export async function listVisibleUserParlayRows(input: {
  userId: string;
  limit: number;
  offset: number;
}): Promise<PaginatedParlayRows> {
  const supabaseAdmin = await admin();
  const { data, count, error } = await supabaseAdmin
    .from("picks")
    .select("*", { count: "exact" })
    .eq("user_id", input.userId)
    .eq("leg_type", "parlay")
    .is("user_hidden_at", null)
    .order("created_at", { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);

  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function updateUserParlay(input: {
  userId: string;
  parlayId: string;
  updates: Record<string, unknown>;
}): Promise<ParlayRow | null> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .update(input.updates)
    .eq("id", input.parlayId)
    .eq("user_id", input.userId)
    .eq("leg_type", "parlay")
    .select()
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function createParlayWithLegsRpc(payload: Record<string, unknown>): Promise<ParlayRow | ParlayRow[] | null> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin.rpc("create_parlay_with_legs", payload);

  if (error) throw error;
  return data ?? null;
}

export async function insertParlayParent(payload: Record<string, unknown>): Promise<ParlayRow> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin.from("picks").insert(payload).select("*").single();

  if (error) throw error;
  return data;
}

export async function insertParlayLegRows(payload: Record<string, unknown>[]): Promise<ParlayLegRow[]> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin.from("pick_legs").insert(payload).select("*");

  if (error) throw error;
  return data ?? [];
}

export async function deleteParlayById(parlayId: string): Promise<void> {
  const supabaseAdmin = await admin();
  const { error } = await supabaseAdmin.from("picks").delete().eq("id", parlayId);

  if (error) throw error;
}

export async function findPublicParlayById(parlayId: string): Promise<ParlayRow | null> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("*")
    .eq("id", parlayId)
    .eq("leg_type", "parlay")
    .eq("visibility", "public")
    .is("user_hidden_at", null)
    .maybeSingle();

  if (error) {
    if (error.code === "42703" || error.code === "PGRST204") {
      const { data: row, error: rowError } = await supabaseAdmin
        .from("picks")
        .select("*")
        .eq("id", parlayId)
        .eq("leg_type", "parlay")
        .is("user_hidden_at", null)
        .maybeSingle();
      if (rowError) throw rowError;
      if (!row) return null;
      const { data: postLink } = await supabaseAdmin
        .from("posts")
        .select("id")
        .eq("pick_id", parlayId)
        .limit(1)
        .maybeSingle();
      return postLink ? row : null;
    }
    throw error;
  }

  return data ?? null;
}

export async function setPickVisibilityPublic(pickId: string, userId: string): Promise<void> {
  const supabaseAdmin = await admin();
  const { error } = await supabaseAdmin
    .from("picks")
    .update({ visibility: "public", updated_at: new Date().toISOString() })
    .eq("id", pickId)
    .eq("user_id", userId);

  if (error && error.code !== "42703" && error.code !== "PGRST204") {
    throw error;
  }
}

/** Lock a pick when shared to feed — idempotent; sets visibility public when available. */
export async function lockPickForFeedShare(input: {
  pickId: string;
  userId: string;
  lockedAt?: string;
}): Promise<ParlayRow | null> {
  const supabaseAdmin = await admin();
  const lockedAt = input.lockedAt ?? new Date().toISOString();

  const baseUpdate: Record<string, unknown> = { locked_at: lockedAt };
  const query = supabaseAdmin
    .from("picks")
    .update({ ...baseUpdate, visibility: "public" })
    .eq("id", input.pickId)
    .eq("user_id", input.userId)
    .is("locked_at", null)
    .select("*")
    .maybeSingle();

  let { data, error } = await query;

  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    ({ data, error } = await supabaseAdmin
      .from("picks")
      .update(baseUpdate)
      .eq("id", input.pickId)
      .eq("user_id", input.userId)
      .is("locked_at", null)
      .select("*")
      .maybeSingle());
  }

  if (error) throw error;
  if (data) return data;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("picks")
    .select("*")
    .eq("id", input.pickId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existingError) throw existingError;
  return existing ?? null;
}

export async function updatePickProofHash(pickId: string, proofHash: string): Promise<void> {
  const supabaseAdmin = await admin();
  const { error } = await supabaseAdmin
    .from("picks")
    .update({ proof_hash: proofHash })
    .eq("id", pickId);

  if (error && error.code !== "42703" && error.code !== "PGRST204") {
    throw error;
  }
}

export type TrustAudience = "private" | "public" | "subscriber";

export async function commitPickTrustPending(input: {
  pickId: string;
  userId: string;
  audience: TrustAudience;
  committedAt: string;
  trustLockAt: string;
}): Promise<ParlayRow | null> {
  const supabaseAdmin = await admin();
  const updates: Record<string, unknown> = {
    committed_at: input.committedAt,
    trust_lock_at: input.trustLockAt,
    updated_at: input.committedAt,
  };

  const withVisibility = { ...updates, visibility: input.audience };
  let { data, error } = await supabaseAdmin
    .from("picks")
    .update(withVisibility)
    .eq("id", input.pickId)
    .eq("user_id", input.userId)
    .is("locked_at", null)
    .is("committed_at", null)
    .select("*")
    .maybeSingle();

  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    ({ data, error } = await supabaseAdmin
      .from("picks")
      .update(updates)
      .eq("id", input.pickId)
      .eq("user_id", input.userId)
      .is("locked_at", null)
      .is("committed_at", null)
      .select("*")
      .maybeSingle());
  }

  if (error) throw error;
  return data ?? null;
}

export async function lockPickForTrustLedger(input: {
  pickId: string;
  userId: string;
  lockedAt: string;
  audience: TrustAudience;
}): Promise<ParlayRow | null> {
  const supabaseAdmin = await admin();
  const baseUpdate: Record<string, unknown> = {
    locked_at: input.lockedAt,
    trust_lock_at: null,
    updated_at: input.lockedAt,
  };

  const withVisibility = { ...baseUpdate, visibility: input.audience };
  let { data, error } = await supabaseAdmin
    .from("picks")
    .update(withVisibility)
    .eq("id", input.pickId)
    .eq("user_id", input.userId)
    .is("locked_at", null)
    .not("committed_at", "is", null)
    .select("*")
    .maybeSingle();

  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    ({ data, error } = await supabaseAdmin
      .from("picks")
      .update(baseUpdate)
      .eq("id", input.pickId)
      .eq("user_id", input.userId)
      .is("locked_at", null)
      .not("committed_at", "is", null)
      .select("*")
      .maybeSingle());
  }

  if (error) throw error;
  if (data) return data;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("picks")
    .select("*")
    .eq("id", input.pickId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existingError) throw existingError;
  return existing ?? null;
}

export async function listDueTrustLockPicks(limit = 50): Promise<ParlayRow[]> {
  const supabaseAdmin = await admin();
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("*")
    .eq("leg_type", "parlay")
    .is("locked_at", null)
    .not("committed_at", "is", null)
    .not("trust_lock_at", "is", null)
    .lte("trust_lock_at", now)
    .order("trust_lock_at", { ascending: true })
    .limit(limit);

  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    return [];
  }
  if (error) throw error;
  return data ?? [];
}

export async function hideUserParlay(input: {
  userId: string;
  parlayId: string;
  hiddenAt: string;
}): Promise<Pick<ParlayRow, "id" | "status" | "user_hidden_at" | "updated_at"> | null> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .update({ user_hidden_at: input.hiddenAt, updated_at: input.hiddenAt })
    .eq("id", input.parlayId)
    .eq("user_id", input.userId)
    .eq("leg_type", "parlay")
    .is("user_hidden_at", null)
    .select("id,status,user_hidden_at,updated_at")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
