/**
 * My HR List — persistence and share-provenance service.
 *
 * Entry snapshots are immutable by design: `entries` records what the HR board
 * said when the player was added, so a list that has been shared cannot be
 * quietly rewritten to look better afterwards. Live board values are re-read
 * for in-app display; they never overwrite the snapshot.
 */
import { getSupabaseAdmin } from "../../middleware/auth";
import { AppError } from "../../errors/AppError";

/** Mirrors the client contract in src/features/hr-list/hrListTypes.ts. */
export type HrListEntryRecord = {
  playerId: number | string;
  playerName: string;
  team?: string | null;
  teamId?: number | string | null;
  opponent?: string | null;
  gamePk?: number | string | null;
  grade?: string | null;
  estimatedHrProb?: number | null;
  bestOdds?: string | null;
  opposingPitcher?: string | null;
  note?: string | null;
  /** When this snapshot was taken. */
  addedAt: string;
};

export type HrListRecord = {
  id: string;
  user_id: string;
  title: string;
  slate_date: string | null;
  entries: HrListEntryRecord[];
  visibility: "private" | "public";
  first_shared_at: string | null;
  share_count: number;
  created_at: string;
  updated_at: string;
};

export type PublicHrList = HrListRecord & {
  ownerHandle: string | null;
  ownerUsername: string | null;
};

export const HR_LIST_MAX_ENTRIES = 25;
export const HR_LIST_MAX_TITLE = 80;
/** Guardrail on free-text notes so they cannot be used as a payload channel. */
export const HR_LIST_MAX_NOTE = 140;

async function requireDb() {
  const supabase = await getSupabaseAdmin();
  if (!supabase) {
    throw new AppError({
      status: 503,
      code: "upstream_unavailable",
      message: "HR list storage is unavailable.",
    });
  }
  return supabase;
}

function badRequest(message: string, details?: Record<string, unknown>): AppError {
  return new AppError({
    status: 400,
    code: "bad_request",
    message,
    details,
    expose: true,
  });
}

function coerceNumeric(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function trimOrNull(value: unknown, max: number): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, max);
}

/**
 * Normalises a client-supplied entry into the stored snapshot shape. Unknown
 * keys are dropped rather than passed through — `entries` is jsonb, so without
 * a whitelist a client could store arbitrary payloads on a publicly readable row.
 */
export function normalizeHrListEntry(raw: unknown): HrListEntryRecord {
  if (!raw || typeof raw !== "object") {
    throw badRequest("Each HR list entry must be an object.");
  }
  const input = raw as Record<string, unknown>;

  const playerId = input.playerId ?? input.player_id;
  if (playerId == null || String(playerId).trim() === "") {
    throw badRequest("HR list entry is missing playerId.");
  }

  const playerName = trimOrNull(input.playerName ?? input.player_name, 80);
  if (!playerName) {
    throw badRequest("HR list entry is missing playerName.", { playerId: String(playerId) });
  }

  const prob = coerceNumeric(input.estimatedHrProb ?? input.estimated_hr_prob);

  return {
    playerId: typeof playerId === "number" ? playerId : String(playerId).slice(0, 32),
    playerName,
    team: trimOrNull(input.team, 8),
    teamId: coerceNumeric(input.teamId ?? input.team_id),
    opponent: trimOrNull(input.opponent, 8),
    gamePk: coerceNumeric(input.gamePk ?? input.game_pk),
    grade: trimOrNull(input.grade, 3),
    // Accept 0–1 or 0–100 from callers; store the 0–1 fraction canonically.
    estimatedHrProb: prob == null ? null : prob > 1 ? Math.min(prob, 100) / 100 : Math.max(prob, 0),
    bestOdds: trimOrNull(input.bestOdds ?? input.best_odds, 12),
    opposingPitcher: trimOrNull(input.opposingPitcher ?? input.opposing_pitcher, 48),
    note: trimOrNull(input.note, HR_LIST_MAX_NOTE),
    addedAt: trimOrNull(input.addedAt ?? input.added_at, 40) ?? new Date().toISOString(),
  };
}

export function normalizeHrListEntries(raw: unknown): HrListEntryRecord[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw badRequest("HR list entries must be an array.");
  if (raw.length > HR_LIST_MAX_ENTRIES) {
    throw badRequest(`An HR list holds at most ${HR_LIST_MAX_ENTRIES} players.`, {
      received: raw.length,
    });
  }

  const entries = raw.map(normalizeHrListEntry);

  // De-dupe on playerId, keeping first occurrence so user ordering survives.
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = String(entry.playerId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeHrListTitle(raw: unknown): string {
  const title = trimOrNull(raw, HR_LIST_MAX_TITLE);
  if (!title) throw badRequest("An HR list needs a title.");
  return title;
}

export function normalizeSlateDate(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const text = String(raw).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw badRequest("slateDate must be formatted YYYY-MM-DD.", { received: text });
  }
  return text;
}

function rowToRecord(row: Record<string, unknown>): HrListRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? ""),
    slate_date: row.slate_date ? String(row.slate_date) : null,
    entries: Array.isArray(row.entries) ? (row.entries as HrListEntryRecord[]) : [],
    visibility: row.visibility === "public" ? "public" : "private",
    first_shared_at: row.first_shared_at ? String(row.first_shared_at) : null,
    share_count: Number(row.share_count ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function listHrListsForUser(userId: string): Promise<HrListRecord[]> {
  const db = await requireDb();
  const { data, error } = await db
    .from("hr_lists")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load HR lists.",
      cause: error,
    });
  }
  return (data ?? []).map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function getHrListForOwner(userId: string, listId: string): Promise<HrListRecord> {
  const db = await requireDb();
  const { data, error } = await db
    .from("hr_lists")
    .select("*")
    .eq("id", listId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "HR list not found.",
      details: { listId },
      cause: error ?? undefined,
    });
  }
  return rowToRecord(data as Record<string, unknown>);
}

export async function createHrList(input: {
  userId: string;
  title: unknown;
  slateDate?: unknown;
  entries?: unknown;
}): Promise<HrListRecord> {
  const db = await requireDb();
  const { data, error } = await db
    .from("hr_lists")
    .insert({
      user_id: input.userId,
      title: normalizeHrListTitle(input.title),
      slate_date: normalizeSlateDate(input.slateDate),
      entries: normalizeHrListEntries(input.entries),
      visibility: "private",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to create HR list.",
      cause: error,
    });
  }
  return rowToRecord(data as Record<string, unknown>);
}

export async function updateHrList(input: {
  userId: string;
  listId: string;
  title?: unknown;
  slateDate?: unknown;
  entries?: unknown;
  visibility?: unknown;
}): Promise<HrListRecord> {
  const db = await requireDb();

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = normalizeHrListTitle(input.title);
  if (input.slateDate !== undefined) patch.slate_date = normalizeSlateDate(input.slateDate);
  if (input.entries !== undefined) patch.entries = normalizeHrListEntries(input.entries);

  if (input.visibility !== undefined) {
    if (input.visibility !== "private" && input.visibility !== "public") {
      throw badRequest("visibility must be 'private' or 'public'.");
    }
    patch.visibility = input.visibility;
    // Stamp provenance the first time a list goes public; never clear it, so a
    // list that was once shared keeps an auditable trace.
    if (input.visibility === "public") {
      const existing = await getHrListForOwner(input.userId, input.listId);
      if (!existing.first_shared_at) patch.first_shared_at = new Date().toISOString();
    }
  }

  if (Object.keys(patch).length === 0) {
    return getHrListForOwner(input.userId, input.listId);
  }

  // The user_id predicate is defence in depth — RLS already scopes this, but
  // the service role bypasses RLS.
  const { data, error } = await db
    .from("hr_lists")
    .update(patch)
    .eq("id", input.listId)
    .eq("user_id", input.userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "HR list not found.",
      details: { listId: input.listId },
      cause: error ?? undefined,
    });
  }
  return rowToRecord(data as Record<string, unknown>);
}

export async function deleteHrList(userId: string, listId: string): Promise<void> {
  const db = await requireDb();
  const { error } = await db
    .from("hr_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to delete HR list.",
      cause: error,
    });
  }
}

/**
 * Public read for /l/:id and the share card. Returns null for private or
 * missing lists — callers must not distinguish the two, so a private list id
 * cannot be probed for existence.
 */
export async function getPublicHrList(listId: string): Promise<PublicHrList | null> {
  const db = await requireDb();
  const { data, error } = await db
    .from("hr_lists")
    .select("*, profiles:user_id (handle, username)")
    .eq("id", listId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const profile = row.profiles as { handle?: string | null; username?: string | null } | null;

  return {
    ...rowToRecord(row),
    ownerHandle: profile?.handle ?? null,
    ownerUsername: profile?.username ?? null,
  };
}

/** Best-effort share counter — telemetry failure must never fail the share. */
export async function recordHrListShare(userId: string, listId: string): Promise<void> {
  try {
    const db = await requireDb();
    const current = await getHrListForOwner(userId, listId);
    await db
      .from("hr_lists")
      .update({ share_count: current.share_count + 1 })
      .eq("id", listId)
      .eq("user_id", userId);
  } catch {
    // Intentionally swallowed: see above.
  }
}

export function hrListAuthorLabel(list: PublicHrList): string {
  if (list.ownerHandle) return `@${list.ownerHandle}`;
  if (list.ownerUsername) return `@${list.ownerUsername}`;
  return "a VouchEdge user";
}
