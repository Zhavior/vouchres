import { getSupabaseAdmin } from "../middleware/auth";

export interface PickAuditRow {
  id: string;
  pick_id: string;
  user_id: string;
  action: string;
  field_changes: Record<string, unknown>;
  created_at: string;
}

async function admin() {
  return getSupabaseAdmin();
}

export async function insertPickAuditLog(input: {
  pickId: string;
  userId: string;
  action: string;
  fieldChanges: Record<string, unknown>;
}): Promise<PickAuditRow | null> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("pick_audit_log")
    .insert({
      pick_id: input.pickId,
      user_id: input.userId,
      action: input.action,
      field_changes: input.fieldChanges,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    // Table may not exist yet in some environments — log and continue.
    if (error.code === "42P01" || error.code === "PGRST205") {
      console.warn("[pick_audit_log] table missing; skipping audit write");
      return null;
    }
    throw error;
  }

  return (data as PickAuditRow) ?? null;
}

export async function listPickAuditLogs(input: {
  pickId: string;
  userId: string;
  limit?: number;
}): Promise<PickAuditRow[]> {
  const supabaseAdmin = await admin();
  const limit = Math.min(input.limit ?? 50, 100);
  const { data, error } = await supabaseAdmin
    .from("pick_audit_log")
    .select("*")
    .eq("pick_id", input.pickId)
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }

  return (data ?? []) as PickAuditRow[];
}
