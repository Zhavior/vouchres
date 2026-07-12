import { getSupabaseAdmin } from "../../middleware/auth";

export interface PublicTrustEvent {
  action: string;
  label: string;
  created_at: string;
}

const PUBLIC_ACTIONS = new Set([
  "commit_trust_pending",
  "lock_trust_ledger",
  "lock_feed_share",
  "repair_identity",
  "update_summary",
  "grade_live_hr",
  "grade_correction",
]);

const ACTION_LABELS: Record<string, string> = {
  commit_trust_pending: "Committed to trust ledger",
  lock_trust_ledger: "Locked on trust ledger",
  lock_feed_share: "Locked on feed share",
  repair_identity: "Canonical identity verified",
  update_summary: "Summary updated",
  grade_live_hr: "Graded live (home run detected)",
  grade_correction: "Result corrected",
};

export async function listPublicTrustEventsForPick(pickId: string, limit = 20): Promise<PublicTrustEvent[]> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("pick_audit_log")
    .select("action, created_at")
    .eq("pick_id", pickId)
    .in("action", Array.from(PUBLIC_ACTIONS))
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 50));

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }

  return (data ?? []).map((row: { action: string; created_at: string }) => ({
    action: row.action,
    label: ACTION_LABELS[row.action] ?? row.action.replace(/_/g, " "),
    created_at: row.created_at,
  }));
}
