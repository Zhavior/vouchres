import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(import.meta.dirname, "../supabase/migrations/20260712221904_brain_ai_reviews.sql"), "utf8");

describe("Brain AI review persistence", () => {
  it("keeps explanation reviews server-only and separate from decisions", () => {
    expect(migration).toContain("create table public.brain_ai_reviews");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on public.brain_ai_reviews from anon, authenticated");
    expect(migration).not.toContain("references public.brain_decisions");
  });
});
