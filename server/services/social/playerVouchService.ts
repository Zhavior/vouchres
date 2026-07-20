import { getSupabaseAdmin } from "../../middleware/auth";

type PlayerVouchRow = {
  user_id: string;
  player_id: string;
  player_name: string;
  team: string | null;
  opponent: string | null;
  game_pk: string | null;
  created_at: string;
};

export interface PlayerVouchSummary {
  playerId: string;
  playerName: string;
  team: string | null;
  opponent: string | null;
  gamePk: string | null;
  totalVouches: number;
  viewerHasVouched: boolean;
}

function normalizeDate(input?: string | null): string {
  const value = String(input ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 10);
}

function normalizePlayerId(input: string | number): string {
  return String(input).trim();
}

async function admin() {
  return getSupabaseAdmin();
}

async function countPlayerVouches(date: string, playerId: string): Promise<number> {
  const supabaseAdmin = await admin();
  const { count, error } = await supabaseAdmin
    .from("player_vouches")
    .select("*", { count: "exact", head: true })
    .eq("context_date", date)
    .eq("sport", "mlb")
    .eq("player_id", playerId);

  if (error) throw error;
  return count ?? 0;
}

export async function togglePlayerVouch(input: {
  userId: string;
  playerId: string | number;
  playerName: string;
  team?: string | null;
  opponent?: string | null;
  gamePk?: string | number | null;
  contextDate?: string | null;
  sourcePage?: string | null;
}) {
  const supabaseAdmin = await admin();
  const contextDate = normalizeDate(input.contextDate);
  const playerId = normalizePlayerId(input.playerId);

  const existing = await supabaseAdmin
    .from("player_vouches")
    .select("id")
    .eq("user_id", input.userId)
    .eq("sport", "mlb")
    .eq("player_id", playerId)
    .eq("context_date", contextDate)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    const { error } = await supabaseAdmin
      .from("player_vouches")
      .delete()
      .eq("id", existing.data.id);
    if (error) throw error;

    return {
      vouched: false,
      totalVouches: await countPlayerVouches(contextDate, playerId),
    };
  }

  const { error } = await supabaseAdmin
    .from("player_vouches")
    .insert({
      user_id: input.userId,
      sport: "mlb",
      player_id: playerId,
      player_name: input.playerName,
      team: input.team ?? null,
      opponent: input.opponent ?? null,
      game_pk: input.gamePk == null ? null : String(input.gamePk),
      context_date: contextDate,
      source_page: input.sourcePage ?? null,
    });

  if (error) throw error;

  return {
    vouched: true,
    totalVouches: await countPlayerVouches(contextDate, playerId),
  };
}

export async function getPlayerVouchSummary(input: {
  date?: string | null;
  playerIds: Array<string | number>;
  viewerId?: string | null;
}): Promise<PlayerVouchSummary[]> {
  const supabaseAdmin = await admin();
  const contextDate = normalizeDate(input.date);
  const normalizedIds = Array.from(
    new Set(input.playerIds.map((value) => normalizePlayerId(value)).filter(Boolean)),
  );

  if (normalizedIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from("player_vouches")
    .select("user_id, player_id, player_name, team, opponent, game_pk, created_at")
    .eq("context_date", contextDate)
    .eq("sport", "mlb")
    .in("player_id", normalizedIds);

  if (error) throw error;

  const rows = (data ?? []) as PlayerVouchRow[];
  const map = new Map<string, PlayerVouchSummary>();

  for (const playerId of normalizedIds) {
    map.set(playerId, {
      playerId,
      playerName: "",
      team: null,
      opponent: null,
      gamePk: null,
      totalVouches: 0,
      viewerHasVouched: false,
    });
  }

  for (const row of rows) {
    const current = map.get(row.player_id);
    if (!current) continue;
    current.totalVouches += 1;
    if (!current.playerName) {
      current.playerName = row.player_name;
      current.team = row.team;
      current.opponent = row.opponent;
      current.gamePk = row.game_pk;
    }
    if (input.viewerId && row.user_id === input.viewerId) {
      current.viewerHasVouched = true;
    }
  }

  return normalizedIds.map((playerId) => map.get(playerId)!);
}

export async function getMostVouchedPlayers(input: {
  date?: string | null;
  limit?: number;
  viewerId?: string | null;
}): Promise<PlayerVouchSummary[]> {
  const supabaseAdmin = await admin();
  const contextDate = normalizeDate(input.date);
  const limit = Math.max(1, Math.min(Number(input.limit ?? 8), 20));

  const { data, error } = await supabaseAdmin
    .from("player_vouches")
    .select("user_id, player_id, player_name, team, opponent, game_pk, created_at")
    .eq("context_date", contextDate)
    .eq("sport", "mlb")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as PlayerVouchRow[];
  const map = new Map<string, PlayerVouchSummary>();

  for (const row of rows) {
    const current = map.get(row.player_id) ?? {
      playerId: row.player_id,
      playerName: row.player_name,
      team: row.team,
      opponent: row.opponent,
      gamePk: row.game_pk,
      totalVouches: 0,
      viewerHasVouched: false,
    };
    current.totalVouches += 1;
    if (input.viewerId && row.user_id === input.viewerId) {
      current.viewerHasVouched = true;
    }
    map.set(row.player_id, current);
  }

  return Array.from(map.values())
    .sort((a, b) => {
      if (b.totalVouches !== a.totalVouches) return b.totalVouches - a.totalVouches;
      return a.playerName.localeCompare(b.playerName);
    })
    .slice(0, limit);
}
