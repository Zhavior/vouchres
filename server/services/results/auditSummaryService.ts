/**
 * Audited track record — what the pregame ledger can actually prove.
 *
 * Sources, in order of what each one is allowed to claim:
 *   hr_feature_snapshots — append-only pregame captures. The table has no
 *     UPDATE and no DELETE policy (see 20260810120000_hr_feature_snapshots.sql),
 *     so "zero deleted picks" is a property of the schema rather than a promise.
 *   hrFeedService        — what actually happened, for the outcome column.
 *
 * Nothing here is estimated. An empty ledger returns zeros and `hasLedger:
 * false`, and the landing says so — a proof module that invents its own proof
 * would be the exact failure this product exists to call out.
 */
import { getSupabaseAdmin } from "../../middleware/auth";
import { getTodayHomeRuns } from "../mlb/hrFeedService";

export interface AuditedHypothesis {
  slateDate: string;
  playerName: string;
  teamAbbrev: string | null;
  opponent: string | null;
  /** HR score the board published before first pitch. */
  pregameHrScore: number | null;
  /** Evidence coverage the board published with it. */
  pregameConfidence: number | null;
  /** First 12 chars of the SHA-256 canonical feature hash — the receipt. */
  receipt: string;
  capturedAt: string;
  /** Home runs the player actually hit on that slate. Null when the feed is silent. */
  actualHomeRuns: number | null;
}

export interface AuditSummary {
  hasLedger: boolean;
  /** Distinct slates with at least one pregame capture. */
  slatesLogged: number;
  /** Total pregame captures. */
  hypothesesLogged: number;
  /**
   * Share of captures that meet every point-in-time eligibility rule the
   * snapshot table defines: captured before first pitch, lineup status known,
   * opposing pitcher resolved.
   */
  coverageRatePct: number | null;
  deletedPicks: number;
  deletedPicksBasis: string;
  recent: AuditedHypothesis[];
  generatedAt: string;
}

const DELETED_BASIS =
  "hr_feature_snapshots is append-only: no UPDATE or DELETE policy exists for any role, so a capture cannot be revised or removed after the fact.";

const EMPTY: Omit<AuditSummary, "generatedAt"> = {
  hasLedger: false,
  slatesLogged: 0,
  hypothesesLogged: 0,
  coverageRatePct: null,
  deletedPicks: 0,
  deletedPicksBasis: DELETED_BASIS,
  recent: [],
};

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function buildAuditSummary(recentLimit = 3): Promise<AuditSummary> {
  const generatedAt = new Date().toISOString();
  const supabase = await getSupabaseAdmin();
  if (!supabase) return { ...EMPTY, generatedAt };

  const { data, error } = await supabase
    .from("hr_feature_snapshots")
    .select("slate_date, captured_at, features, feature_hash, is_point_in_time, lineup_status, opposing_pitcher_id")
    .order("captured_at", { ascending: false })
    .limit(5000);

  if (error || !data || data.length === 0) return { ...EMPTY, generatedAt };

  type Row = {
    slate_date: string;
    captured_at: string;
    features: Record<string, unknown> | null;
    feature_hash: string;
    is_point_in_time: boolean;
    lineup_status: string;
    opposing_pitcher_id: string | null;
  };
  const rows = data as Row[];

  const eligible = rows.filter(
    (row) => row.is_point_in_time && row.lineup_status !== "unknown" && row.opposing_pitcher_id != null,
  );

  // Outcomes are read per slate, and only for the slates the recent rows touch —
  // the feed is cached per date, so this is a handful of lookups at most.
  const recentRows = rows.slice(0, recentLimit);
  const hrCountsByDate = new Map<string, Map<number, number>>();
  for (const date of new Set(recentRows.map((row) => row.slate_date))) {
    try {
      const feed = await getTodayHomeRuns(date);
      const counts = new Map<number, number>();
      for (const event of feed.events) counts.set(event.playerId, (counts.get(event.playerId) ?? 0) + 1);
      hrCountsByDate.set(date, counts);
    } catch {
      // No feed for that date means the outcome column stays null, not zero.
    }
  }

  const recent: AuditedHypothesis[] = recentRows.map((row) => {
    const features = row.features ?? {};
    const playerId = num((features as any).playerId);
    const counts = hrCountsByDate.get(row.slate_date);

    return {
      slateDate: row.slate_date,
      playerName: String((features as any).playerName ?? "Unknown"),
      teamAbbrev: ((features as any).teamAbbrev as string) ?? null,
      opponent: ((features as any).opponent as string) ?? null,
      pregameHrScore: num((features as any).hrScore),
      pregameConfidence: num((features as any).dataConfidence),
      receipt: row.feature_hash.slice(0, 12),
      capturedAt: row.captured_at,
      actualHomeRuns: counts && playerId != null ? (counts.get(playerId) ?? 0) : null,
    };
  });

  return {
    hasLedger: true,
    slatesLogged: new Set(rows.map((row) => row.slate_date)).size,
    hypothesesLogged: rows.length,
    coverageRatePct: rows.length > 0 ? Math.round((eligible.length / rows.length) * 100) : null,
    deletedPicks: 0,
    deletedPicksBasis: DELETED_BASIS,
    recent,
    generatedAt,
  };
}
