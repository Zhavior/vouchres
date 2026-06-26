/**
 * In-memory verified-pick ledger. Single source of truth for results + trust.
 * Swap the Map for a real DB later; the service interface stays the same.
 */
import { PickRecord, ResultStatus, LearningNote } from "../results/resultTypes";

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

export function getCapperPicks(capperId: string): PickRecord[] {
  return getAllPicks().filter((p) => p.capperId === capperId);
}

export function getUserPicks(userId: string): PickRecord[] {
  return getAllPicks().filter((p) => p.userId === userId);
}
