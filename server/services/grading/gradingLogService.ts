import { getSupabaseAdmin } from "../../middleware/auth";
import { insertPickAuditLog } from "../../repositories/pickAuditRepository";

export interface GradingLogRow {
  pick_id: string;
  status: string;
  reason: string;
  source: string;
  evidence?: Record<string, unknown> | null;
  previous_status?: string | null;
  user_id?: string | null;
}

async function resolvePickUserId(pickId: string, userId?: string | null): Promise<string | null> {
  if (userId) return userId;
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("picks")
      .select("user_id")
      .eq("id", pickId)
      .maybeSingle();
    if (error) return null;
    return data?.user_id ? String(data.user_id) : null;
  } catch {
    return null;
  }
}

export async function persistGradingRunLogs(rows: GradingLogRow[]): Promise<{ written: number; corrections: number }> {
  if (rows.length === 0) return { written: 0, corrections: 0 };

  let written = 0;
  let corrections = 0;

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const payload = rows.map((row) => ({
      pick_id: row.pick_id,
      status: row.status,
      reason: row.reason,
      source: row.source,
      evidence: row.evidence ?? null,
    }));

    const { error } = await supabaseAdmin.from("grading_logs").insert(payload);
    if (error && !["42P01", "PGRST205"].includes(error.code)) {
      console.warn("[gradingLogService] insert failed", error.message);
    } else if (!error) {
      written = payload.length;
    }
  } catch (err) {
    console.warn("[gradingLogService] unavailable", (err as Error)?.message);
  }

  for (const row of rows) {
    const prev = String(row.previous_status ?? "").toLowerCase();
    const next = String(row.status ?? "").toLowerCase();
    const isCorrection =
      prev &&
      ["won", "lost", "push", "void"].includes(prev) &&
      ["won", "lost", "push", "void"].includes(next) &&
      prev !== next;

    if (isCorrection) {
      corrections += 1;
      const userId = await resolvePickUserId(row.pick_id, row.user_id);
      if (userId) {
        await insertPickAuditLog({
          pickId: row.pick_id,
          userId,
          action: "grade_correction",
          fieldChanges: {
            status: { before: prev, after: next },
            reason: row.reason,
            source: row.source,
          },
        }).catch((err) => {
          console.warn("[gradingLogService] grade_correction audit failed", (err as Error)?.message);
        });
      }
      continue;
    }

    if (["won", "lost", "push", "void"].includes(next) && row.source === "live-hr-sync") {
      const userId = await resolvePickUserId(row.pick_id, row.user_id);
      if (userId) {
        await insertPickAuditLog({
          pickId: row.pick_id,
          userId,
          action: "grade_live_hr",
          fieldChanges: {
            status: { before: prev || "pending", after: next },
            evidence: row.evidence ?? null,
          },
        }).catch((err) => {
          console.warn("[gradingLogService] grade_live_hr audit failed", (err as Error)?.message);
        });
      }
    }
  }

  return { written, corrections };
}

export function buildGradeDueLogRows(input: {
  settled: Array<{ pick_id: string; status: string }>;
  pending: Array<{ pick_id: string }>;
  errors: Array<{ pick_id: string; error?: string }>;
  source?: string;
}): GradingLogRow[] {
  const source = input.source ?? "grade-due";
  return [
    ...input.settled.map((row) => ({
      pick_id: row.pick_id,
      status: row.status,
      reason: "graded",
      source,
    })),
    ...input.pending.map((row) => ({
      pick_id: row.pick_id,
      status: "pending",
      reason: "pending_not_final",
      source,
    })),
    ...input.errors.map((row) => ({
      pick_id: row.pick_id,
      status: "graded_error",
      reason: row.error ?? "error",
      source,
    })),
  ];
}
