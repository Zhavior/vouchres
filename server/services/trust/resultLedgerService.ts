/**
 * In-memory verified-pick ledger. Single source of truth for results + trust.
 * Swap the Map for a real DB later; the service interface stays the same.
 */
import { PickRecord, ResultStatus, LearningNote } from "../results/resultTypes";
import { getSupabaseAdmin } from "../../middleware/auth";

const ledger = new Map<string, PickRecord>();

function seed() {
  if (ledger.size > 0) return;
  const now = Date.now();
  const samples: PickRecord[] = [
    {
      pickId: "seed-1", capperId: "professor", team: "Dodgers", opponent: "Giants",
      market: "Total bases", selection: "Dodgers team total bases vs RHP", score: 81, riskLabel: "Safe",
      reasons: ["Vulnerable RHP", "Strong recent form"],
      createdAt: new Date(now - 4 * 864e5).toISOString(), gameDate: new Date(now - 4 * 864e5).toISOString(), status: "win",
      gradedAt: new Date(now - 3 * 864e5).toISOString(),
    },
    {
      pickId: "seed-2", capperId: "hr-hunter", team: "Yankees", opponent: "Red Sox",
      market: "Anytime HR", selection: "Yankees anytime HR vs LHP", score: 74, riskLabel: "Risky",
      reasons: ["Pull-side power", "HR-prone starter"],
      createdAt: new Date(now - 3 * 864e5).toISOString(), gameDate: new Date(now - 3 * 864e5).toISOString(), status: "loss",
      gradedAt: new Date(now - 2 * 864e5).toISOString(),
    },
    {
      pickId: "seed-3", capperId: "professor", team: "Braves", opponent: "Mets",
      market: "Team total", selection: "Braves team total over", score: 78, riskLabel: "Balanced",
      reasons: ["Run environment edge"],
      createdAt: new Date(now - 2 * 864e5).toISOString(), gameDate: new Date(now - 2 * 864e5).toISOString(), status: "win",
      gradedAt: new Date(now - 1 * 864e5).toISOString(),
    },
    {
      pickId: "seed-4", capperId: "hr-hunter", team: "Astros", opponent: "Mariners",
      market: "Anytime HR", selection: "Astros anytime HR", score: 69, riskLabel: "Risky",
      reasons: ["Park factor", "Hard contact trend"],
      createdAt: new Date(now - 1 * 864e5).toISOString(), gameDate: new Date(now + 1 * 864e5).toISOString(), status: "pending",
    },
  ];
  for (const p of samples) ledger.set(p.pickId, p);
}
seed();

export function addPick(pick: PickRecord): PickRecord {
  ledger.set(pick.pickId, pick);
  return pick;
}

export function getPick(pickId: string): PickRecord | undefined {
  return ledger.get(pickId);
}

export function gradePick(pickId: string, result: ResultStatus, learningNote?: LearningNote): PickRecord | undefined {
  const pick = ledger.get(pickId);
  if (!pick) return undefined;
  pick.status = result;
  pick.gradedAt = new Date().toISOString();
  if (learningNote) pick.learningNote = learningNote;
  ledger.set(pickId, pick);
  return pick;
}

export function getAllPicks(): PickRecord[] {
  return [...ledger.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// ─── Real trust data ─────────────────────────────────────────────────────────
// getCapperPicks/getUserPicks read the REAL picks table (service role), NOT the
// in-memory seed above. The seed/ledger remains only for the learning-note flow
// (addPick/getPick/gradePick). Previously these two returned the fake seed, so
// /api/trust/* served fabricated records (and never reflected real graded picks).

const PICK_COLUMNS =
  "id, user_id, capper_id, market, selection, confidence, explanation, status, created_at, graded_at, game_date";

function mapDbStatus(status: string): ResultStatus | null {
  switch (status) {
    case "won": return "win";
    case "lost": return "loss";
    case "push":
    case "void": return "push"; // void = refunded → treated as a push, not a loss
    case "pending": return "pending";
    default: return null;        // graded_error and unknowns are excluded entirely
  }
}

function mapDbPick(row: any): PickRecord | null {
  const status = mapDbStatus(String(row.status));
  if (status === null) return null;
  return {
    pickId: String(row.id),
    capperId: String(row.capper_id ?? ""),
    userId: row.user_id ? String(row.user_id) : undefined,
    team: "",
    market: String(row.market ?? ""),
    selection: String(row.selection ?? ""),
    score: typeof row.confidence === "number" ? row.confidence : 0,
    // Real picks store a single explanation string; surface it as reasons[] so
    // the transparency factor reflects "has a written rationale."
    reasons: row.explanation ? [String(row.explanation)] : [],
    createdAt: row.created_at ?? new Date().toISOString(),
    gameDate: row.game_date ?? row.created_at ?? new Date().toISOString(),
    status,
    gradedAt: row.graded_at ?? undefined,
  };
}

export async function getCapperPicks(capperId: string): Promise<PickRecord[]> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select(PICK_COLUMNS)
    .eq("capper_id", capperId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map(mapDbPick).filter((p): p is PickRecord => p !== null);
}

export async function getUserPicks(userId: string): Promise<PickRecord[]> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select(PICK_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map(mapDbPick).filter((p): p is PickRecord => p !== null);
}
