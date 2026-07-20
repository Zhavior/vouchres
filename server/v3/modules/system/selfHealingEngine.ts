import { getSupabaseAdmin } from "../../../middleware/auth";
import { gradePendingPicks } from "../../../services/grading/gradingService";
import { repairLegacyParlayIdentityForSync } from "../../../routes/parlay/parlayRepairHelpers";
import { recomputeTrustForRecentPicks } from "../../../services/persistence/pickService";

export type SelfHealingSeverity = "info" | "warn" | "critical";
export type SelfHealingStatus = "ok" | "drift_detected";

export interface SelfHealingCheck {
  id: string;
  title: string;
  status: SelfHealingStatus;
  severity: SelfHealingSeverity;
  detectedCount: number;
  detail: string;
  repairActionIds: string[];
}

export interface SelfHealingActionDefinition {
  id: string;
  title: string;
  description: string;
  dryRunSupported: boolean;
}

export interface SelfHealingActionResult {
  actionId: string;
  title: string;
  dryRun: boolean;
  ok: boolean;
  summary: Record<string, unknown>;
  startedAt: string;
  finishedAt: string;
}

export interface SelfHealingScanReport {
  generatedAt: string;
  healthy: boolean;
  checks: SelfHealingCheck[];
  actionCatalog: SelfHealingActionDefinition[];
}

export interface SelfHealingLoopReport {
  startedAt: string;
  finishedAt: string;
  dryRun: boolean;
  before: SelfHealingScanReport;
  actions: SelfHealingActionResult[];
  after: SelfHealingScanReport;
}

const ACTION_CATALOG: SelfHealingActionDefinition[] = [
  {
    id: "grade_pending_picks",
    title: "Grade pending picks",
    description: "Grades stale pending picks through the trusted grading engine.",
    dryRunSupported: true,
  },
  {
    id: "repair_legacy_parlay_identity",
    title: "Repair parlay leg identity",
    description: "Repairs missing event and market identity on legacy parlay legs.",
    dryRunSupported: true,
  },
  {
    id: "recompute_recent_trust",
    title: "Recompute recent trust summaries",
    description: "Rebuilds trust score summaries for recently graded subjects.",
    dryRunSupported: true,
  },
];

export type ActionId = (typeof ACTION_CATALOG)[number]["id"];

let lastLoopReport: SelfHealingLoopReport | null = null;

function isActionId(value: string): value is ActionId {
  return ACTION_CATALOG.some((entry) => entry.id === value);
}

function actionDefinition(actionId: string): SelfHealingActionDefinition {
  if (!isActionId(actionId)) {
    throw new Error(`Unknown self-healing action: ${actionId}`);
  }

  const found = ACTION_CATALOG.find((entry) => entry.id === actionId);
  if (!found) {
    throw new Error(`Unknown self-healing action: ${actionId}`);
  }
  return found;
}

async function countStalePendingPicks(hours: number): Promise<number> {
  const supabaseAdmin = await getSupabaseAdmin();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("picks")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .not("event_id", "is", null)
    .lte("created_at", since);

  if (error) throw error;
  return count ?? 0;
}

async function countLegacyParlayIdentityDrift(): Promise<number> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { count, error } = await supabaseAdmin
    .from("pick_legs")
    .select("id", { count: "exact", head: true })
    .or("event_key.is.null,market_code.is.null,stat_target.is.null,comparator.is.null");

  if (error) throw error;
  return count ?? 0;
}

async function countRecentTrustRefreshDrift(hours: number, limit: number): Promise<number> {
  const supabaseAdmin = await getSupabaseAdmin();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("id, user_id, capper_id, sport, graded_at")
    .in("status", ["won", "lost", "push", "void"])
    .not("graded_at", "is", null)
    .gte("graded_at", since)
    .order("graded_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = data ?? [];
  const latestBySubject = new Map<string, string>();

  for (const row of rows) {
    const subjectType = row.user_id ? "user" : row.capper_id ? "capper" : null;
    const subjectId = row.user_id ?? row.capper_id ?? null;
    const scope = String(row.sport ?? "overall");
    const gradedAt = String(row.graded_at ?? "");
    if (!subjectType || !subjectId || !gradedAt) continue;

    const key = `${subjectType}:${subjectId}:${scope}`;
    if (!latestBySubject.has(key)) {
      latestBySubject.set(key, gradedAt);
    }
  }

  let stale = 0;

  for (const [key, latestGradedAt] of latestBySubject.entries()) {
    const [subjectType, subjectId, scope] = key.split(":");
    const { data: trustRow, error: trustError } = await supabaseAdmin
      .from("trust_scores")
      .select("updated_at")
      .eq("subject_type", subjectType)
      .eq("subject_id", subjectId)
      .eq("scope", scope)
      .maybeSingle();

    if (trustError) throw trustError;

    const updatedAt = String(trustRow?.updated_at ?? "");
    if (!updatedAt || new Date(updatedAt).getTime() + 60_000 < new Date(latestGradedAt).getTime()) {
      stale += 1;
    }
  }

  return stale;
}

export async function scanSelfHealingState(options: {
  stalePendingHours?: number;
  trustRefreshHours?: number;
  trustRefreshLimit?: number;
} = {}): Promise<SelfHealingScanReport> {
  const stalePendingHours = Math.min(Math.max(Number(options.stalePendingHours ?? 12), 1), 24 * 14);
  const trustRefreshHours = Math.min(Math.max(Number(options.trustRefreshHours ?? 72), 1), 24 * 14);
  const trustRefreshLimit = Math.min(Math.max(Number(options.trustRefreshLimit ?? 50), 1), 200);

  const [stalePendingCount, legacyParlayCount, staleTrustCount] = await Promise.all([
    countStalePendingPicks(stalePendingHours),
    countLegacyParlayIdentityDrift(),
    countRecentTrustRefreshDrift(trustRefreshHours, trustRefreshLimit),
  ]);

  const checks: SelfHealingCheck[] = [
    {
      id: "stale_pending_picks",
      title: "Pending picks waiting too long for grading",
      status: stalePendingCount > 0 ? "drift_detected" : "ok",
      severity: stalePendingCount > 20 ? "critical" : stalePendingCount > 0 ? "warn" : "info",
      detectedCount: stalePendingCount,
      detail:
        stalePendingCount > 0
          ? `${stalePendingCount} pending picks are older than ${stalePendingHours} hours and should be rechecked by grading.`
          : `No pending picks are older than ${stalePendingHours} hours.`,
      repairActionIds: ["grade_pending_picks"],
    },
    {
      id: "legacy_parlay_identity",
      title: "Parlay legs missing stable identity",
      status: legacyParlayCount > 0 ? "drift_detected" : "ok",
      severity: legacyParlayCount > 0 ? "warn" : "info",
      detectedCount: legacyParlayCount,
      detail:
        legacyParlayCount > 0
          ? `${legacyParlayCount} parlay legs are missing event or market identity fields needed for durable syncing.`
          : "All scanned parlay legs have the expected identity fields.",
      repairActionIds: ["repair_legacy_parlay_identity"],
    },
    {
      id: "recent_trust_refresh",
      title: "Recently graded picks missing a fresh trust refresh",
      status: staleTrustCount > 0 ? "drift_detected" : "ok",
      severity: staleTrustCount > 10 ? "critical" : staleTrustCount > 0 ? "warn" : "info",
      detectedCount: staleTrustCount,
      detail:
        staleTrustCount > 0
          ? `${staleTrustCount} recent trust subjects appear older than their latest grading event and should be recomputed.`
          : "Recent graded subjects appear aligned with trust score refresh timing.",
      repairActionIds: ["recompute_recent_trust"],
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    healthy: checks.every((check) => check.status === "ok"),
    checks,
    actionCatalog: ACTION_CATALOG,
  };
}

export async function runSelfHealingAction(actionId: string, options: {
  dryRun?: boolean;
} = {}): Promise<SelfHealingActionResult> {
  const definition = actionDefinition(actionId);
  const dryRun = definition.dryRunSupported ? options.dryRun ?? false : false;
  const startedAt = new Date().toISOString();

  let summary: Record<string, unknown>;

  switch (actionId) {
    case "grade_pending_picks": {
      const result = await gradePendingPicks({ days: 7, dryRun });
      summary = {
        gradedCount: result.graded.length,
        skippedCount: result.skipped.length,
        totals: result.summary,
      };
      break;
    }
    case "repair_legacy_parlay_identity": {
      const result = await repairLegacyParlayIdentityForSync({ dryRun, limit: 250 });
      summary = result as unknown as Record<string, unknown>;
      break;
    }
    case "recompute_recent_trust": {
      const result = await recomputeTrustForRecentPicks({ hours: 72, limit: 200, dryRun });
      summary = result as unknown as Record<string, unknown>;
      break;
    }
    default:
      throw new Error(`Unknown self-healing action: ${actionId}`);
  }

  return {
    actionId,
    title: definition.title,
    dryRun,
    ok: true,
    summary,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}

export async function runSelfHealingLoop(options: {
  dryRun?: boolean;
  maxActions?: number;
} = {}): Promise<SelfHealingLoopReport> {
  const startedAt = new Date().toISOString();
  const before = await scanSelfHealingState();
  const dryRun = options.dryRun ?? false;
  const maxActions = Math.min(Math.max(Number(options.maxActions ?? 3), 1), ACTION_CATALOG.length);

  const selectedActionIds = before.checks
    .filter((check) => check.status === "drift_detected")
    .flatMap((check) => check.repairActionIds)
    .filter((actionId, index, list) => list.indexOf(actionId) === index)
    .filter(isActionId)
    .slice(0, maxActions);

  const actions: SelfHealingActionResult[] = [];
  for (const actionId of selectedActionIds) {
    actions.push(await runSelfHealingAction(actionId, { dryRun }));
  }

  const after = await scanSelfHealingState();
  const report: SelfHealingLoopReport = {
    startedAt,
    finishedAt: new Date().toISOString(),
    dryRun,
    before,
    actions,
    after,
  };

  lastLoopReport = report;
  return report;
}

export function getLastSelfHealingLoopReport(): SelfHealingLoopReport | null {
  return lastLoopReport;
}
