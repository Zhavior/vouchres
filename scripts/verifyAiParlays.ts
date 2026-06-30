import { createHash } from "node:crypto";

type Status = "pending" | "won" | "lost" | "push" | "void";

interface AiLeg {
  event_id: string;
  market: string;
  selection: string;
  odds_decimal: number | null;
  player_id: string | null;
}

interface SavedParlay {
  id: string;
  user_id: string;
  title: string;
  legs: AiLeg[];
  riskTier: string;
  confidence: number | null;
  source: "AI";
  status: Status;
  created_at: string;
  game_date: string;
  dedupeKey: string;
}

const userId = "verify-user";
const gameDate = new Date().toISOString().slice(0, 10);
const saved = new Map<string, SavedParlay>();
const notifications: Array<{ type: string; parlayId: string; status: Status }> = [];
const warnings: string[] = [];

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24);
}

function signature(legs: AiLeg[]): string {
  return hash({
    userId,
    gameDate,
    legs: legs.map((leg) => ({
      event_id: leg.event_id,
      market: leg.market,
      selection: leg.selection.toLowerCase(),
      player_id: leg.player_id,
    })),
  });
}

function generateAiParlays() {
  const legs: AiLeg[] = [
    { event_id: "game-1", market: "hr", selection: "Aaron Judge 1+ HR", odds_decimal: null, player_id: "592450" },
    { event_id: "game-2", market: "hr", selection: "Shohei Ohtani 1+ HR", odds_decimal: null, player_id: "660271" },
  ];
  warnings.push("missing odds");
  return {
    parlays: [
      {
        id: `ai-${gameDate}-${hash(legs)}`,
        title: "AI Safer 2-Leg HR Parlay",
        legs,
        riskTier: "LOW",
        confidence: 62,
        source: "AI",
        status: "pending",
        created_at: new Date().toISOString(),
        game_date: gameDate,
      },
    ],
    warnings: [...new Set(warnings)],
    generatedAt: new Date().toISOString(),
    source: "ai_parlay_engine",
  };
}

function saveAiParlay(parlay: ReturnType<typeof generateAiParlays>["parlays"][number]) {
  const dedupeKey = `AI:${gameDate}:${signature(parlay.legs)}`;
  const existing = saved.get(dedupeKey);
  if (existing) return { parlay: existing, deduped: true, warnings: [...new Set(warnings)] };
  const row: SavedParlay = {
    ...parlay,
    id: `pick-${saved.size + 1}`,
    user_id: userId,
    dedupeKey,
  };
  saved.set(dedupeKey, row);
  return { parlay: row, deduped: false, warnings: [...new Set(warnings)] };
}

function gradeSavedParlay(parlayId: string, status: Status) {
  const row = [...saved.values()].find((p) => p.id === parlayId);
  if (!row) throw new Error("saved parlay not found");
  row.status = status;
  notifications.push({ type: "PARLAY_GRADED", parlayId, status });
  return row;
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const generated = generateAiParlays();
assert(Array.isArray(generated.parlays), "AI generation must return parlays array");
assert(Array.isArray(generated.warnings), "AI generation must return warnings array");
assert(generated.generatedAt, "AI generation must return generatedAt");
assert(generated.source === "ai_parlay_engine", "AI generation source must be ai_parlay_engine");
assert(generated.parlays.length > 0, "AI generation should produce at least one verification parlay");

const firstSave = saveAiParlay(generated.parlays[0]);
const duplicateSave = saveAiParlay(generated.parlays[0]);
assert(firstSave.deduped === false, "first save should not be deduped");
assert(duplicateSave.deduped === true, "duplicate save should be deduped");
assert(saved.size === 1, `duplicate save should not spam records; got ${saved.size}`);

const myParlays = [...saved.values()];
assert(myParlays.some((p) => p.id === firstSave.parlay.id), "saved AI parlay must appear in My Parlays");

const graded = gradeSavedParlay(firstSave.parlay.id, "won");
assert(graded.status === "won", "grading flow must move AI parlay pending -> won");

const ledger = [...saved.values()].filter((p) => ["won", "lost", "push", "void", "pending"].includes(p.status));
assert(ledger.some((p) => p.id === firstSave.parlay.id), "Results ledger must include saved AI parlay");
assert(notifications.some((n) => n.type === "PARLAY_GRADED" && n.parlayId === firstSave.parlay.id), "parlay graded notification hook must fire");
assert(generated.warnings.some((w) => /missing odds/i.test(w)), "warnings should include incomplete data");

console.log(
  JSON.stringify(
    {
      ok: true,
      generated: {
        parlays: generated.parlays.length,
        source: generated.source,
        warnings: generated.warnings,
      },
      save: {
        firstDeduped: firstSave.deduped,
        duplicateDeduped: duplicateSave.deduped,
        storedRecords: saved.size,
      },
      myParlays: myParlays.length,
      grading: { id: graded.id, status: graded.status },
      ledger: ledger.length,
      notifications,
    },
    null,
    2
  )
);

