/**
 * Cappers — storage access for the tracked handles and their daily picks.
 *
 * This module only reads and writes what was *called*. It never stores or
 * returns a graded outcome: grading lives in slateResultsService.ts and is
 * derived from the real HR feed every time it is asked for.
 */
import { getSupabaseAdmin } from "../../middleware/auth";
import { AppError } from "../../errors/AppError";

export interface CapperRecord {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  sort_order: number;
  active: boolean;
}

export type CapperPickSlot = "ticket" | "board";

export interface CapperPickRecord {
  id: string;
  capper_id: string;
  slate_date: string;
  player_id: number;
  player_name: string;
  team_abbr: string | null;
  game_pk: number | null;
  slot: CapperPickSlot;
  locked_at: string;
}

async function requireDb() {
  const supabase = await getSupabaseAdmin();
  if (!supabase) {
    throw new AppError({
      status: 503,
      code: "upstream_unavailable",
      message: "Cappers storage is unavailable.",
    });
  }
  return supabase;
}

function badRequest(message: string): AppError {
  return new AppError({ status: 400, code: "bad_request", message, expose: true });
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function requireSlateDate(value: unknown): string {
  const date = String(value ?? "").trim();
  if (!YMD.test(date)) throw badRequest("slateDate must be YYYY-MM-DD.");
  return date;
}

/** Active cappers in display order. Inactive handles stay in history but off the desk. */
export async function listActiveCappers(): Promise<CapperRecord[]> {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("tracked_cappers")
    .select("id, handle, display_name, avatar_url, sort_order, active")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true });

  if (error) {
    throw new AppError({
      status: 502,
      code: "external_service_error",
      message: "Could not load cappers.",
      details: { supabase: error.message },
    });
  }
  return (data ?? []) as CapperRecord[];
}

/** Every pick recorded for one slate, across all cappers. */
export async function listPicksForSlate(slateDate: string): Promise<CapperPickRecord[]> {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("tracked_capper_picks")
    .select("id, capper_id, slate_date, player_id, player_name, team_abbr, game_pk, slot, locked_at")
    .eq("slate_date", slateDate);

  if (error) {
    throw new AppError({
      status: 502,
      code: "external_service_error",
      message: "Could not load capper picks.",
      details: { supabase: error.message },
    });
  }
  return (data ?? []) as CapperPickRecord[];
}

export interface CapperPickInput {
  capperId: string;
  slateDate: string;
  playerId: number;
  playerName: string;
  teamAbbr?: string | null;
  gamePk?: number | null;
  slot?: CapperPickSlot;
}

function normalizePick(input: CapperPickInput) {
  const playerId = Number(input.playerId);
  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw badRequest("playerId must be a positive MLB player id.");
  }
  const playerName = String(input.playerName ?? "").trim();
  if (!playerName) throw badRequest("playerName is required.");
  const slot: CapperPickSlot = input.slot === "ticket" ? "ticket" : "board";

  return {
    capper_id: String(input.capperId ?? "").trim(),
    slate_date: requireSlateDate(input.slateDate),
    player_id: playerId,
    player_name: playerName.slice(0, 80),
    team_abbr: input.teamAbbr ? String(input.teamAbbr).trim().slice(0, 5) : null,
    game_pk: Number.isInteger(Number(input.gamePk)) ? Number(input.gamePk) : null,
    slot,
  };
}

/**
 * Records picks for one slate. Re-recording the same (capper, slate, player)
 * updates the snapshot rather than duplicating the call — the desk is allowed to
 * correct a name or team, never to add a second copy of the same pick.
 */
export async function upsertCapperPicks(inputs: CapperPickInput[]): Promise<CapperPickRecord[]> {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw badRequest("At least one pick is required.");
  }
  if (inputs.length > 200) throw badRequest("Too many picks in one request (max 200).");

  const rows = inputs.map(normalizePick);
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("tracked_capper_picks")
    .upsert(rows, { onConflict: "capper_id,slate_date,player_id" })
    .select("id, capper_id, slate_date, player_id, player_name, team_abbr, game_pk, slot, locked_at");

  if (error) {
    throw new AppError({
      status: 502,
      code: "external_service_error",
      message: "Could not save capper picks.",
      details: { supabase: error.message },
    });
  }
  return (data ?? []) as CapperPickRecord[];
}

export async function deleteCapperPick(pickId: string): Promise<void> {
  const id = String(pickId ?? "").trim();
  if (!id) throw badRequest("pickId is required.");
  const supabase = await requireDb();
  const { error } = await supabase.from("tracked_capper_picks").delete().eq("id", id);
  if (error) {
    throw new AppError({
      status: 502,
      code: "external_service_error",
      message: "Could not delete the pick.",
      details: { supabase: error.message },
    });
  }
}
