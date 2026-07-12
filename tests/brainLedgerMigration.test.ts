import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(import.meta.dirname, "../supabase/migrations/20260712212002_brain_decision_ledger.sql"),
  "utf8",
);

describe("Brain ledger migration", () => {
  it("separates immutable decisions from official outcomes", () => {
    expect(migration).toContain("create table public.brain_decisions");
    expect(migration).toContain("create table public.brain_decision_outcomes");
    expect(migration).toContain("feature_snapshot jsonb not null");
    expect(migration).toContain("on delete restrict");
    expect(migration).toContain("before update or delete on public.brain_decisions");
  });

  it("keeps raw Brain records server-only", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on public.brain_decisions from anon, authenticated");
    expect(migration).toContain("grant all on public.brain_decisions to service_role");
  });

  it("adds stolen bases as a separate market", () => {
    const stolenBaseMigration = readFileSync(resolve(import.meta.dirname, "../supabase/migrations/20260712215203_brain_stolen_base_market.sql"), "utf8");
    expect(stolenBaseMigration).toContain("'stolen_base'");
    expect(stolenBaseMigration).toContain("brain_decisions_market_check");
  });
});
