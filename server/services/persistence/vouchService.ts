import { getSupabaseAdmin } from "../../middleware/auth";

/** Vouch persistence — replaces src/App.tsx's localStorage-only savedVouches. */

export interface VouchRecord {
  id: string;
  user_id: string;
  vouch_source: string;
  user_note: string;
  market: string;
  sport: string;
  player_or_team: string | null;
  game_name: string;
  odds: string;
  line: string | null;
  selection: string | null;
  status: "pending" | "won" | "lost" | "push" | "void" | "graded_error";
  saved_count: number;
  vouched_count: number;
  ai_confidence: number | null;
  capper_confidence: number | null;
  risk_tier: string | null;
  is_locked: boolean;
  lock_time: string | null;
  longer_breakdown: string | null;
  card_theme: string | null;
  visibility: "public" | "private";
  is_demo: boolean;
  user_hidden_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function createVouch(
  input: Partial<
    Omit<VouchRecord, "id" | "status" | "saved_count" | "vouched_count" | "user_hidden_at" | "created_at" | "updated_at">
  > & {
    user_id: string;
    vouch_source: string;
    market: string;
    game_name: string;
    odds: string;
  }
): Promise<VouchRecord> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("vouches")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data as VouchRecord;
}

export async function listVouchesForUser(userId: string): Promise<VouchRecord[]> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("vouches")
    .select("*")
    .eq("user_id", userId)
    .is("user_hidden_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as VouchRecord[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public lookup for the /v/:id share permalink and share-card image — no auth. */
export async function getPublicVouch(id: string): Promise<VouchRecord | null> {
  if (!UUID_RE.test(id)) return null;
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("vouches")
    .select("*")
    .eq("id", id)
    .eq("visibility", "public")
    .is("user_hidden_at", null)
    .maybeSingle();

  if (error) throw error;
  return (data as VouchRecord) ?? null;
}

/** User-facing hide, not a real delete — mirrors picks.user_hidden_at. */
export async function hideVouch(id: string, userId: string): Promise<boolean> {
  if (!UUID_RE.test(id)) return false;
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("vouches")
    .update({ user_hidden_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
