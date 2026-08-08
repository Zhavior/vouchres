import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8").toLowerCase();
const migration = readFileSync(
  new URL("../supabase/migrations/20260808074500_fix_follows_nullable_targets.sql", import.meta.url),
  "utf8",
).toLowerCase();
const seed = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8").toLowerCase();

describe("follow target persistence", () => {
  it("allows one nullable target while preserving idempotency", () => {
    expect(schema).toContain("id            uuid primary key default gen_random_uuid()");
    expect(schema).toContain("unique nulls not distinct (follower_id, following_profile_id, following_capper_id)");
    expect(migration).toContain("drop constraint if exists follows_pkey");
    expect(migration).toContain("add constraint follows_target_unique");
    expect(migration).toContain("unique nulls not distinct (follower_id, following_profile_id, following_capper_id)");
  });

  it("seeds demo profile parents through local auth users", () => {
    expect(seed).toContain("insert into auth.users");
    expect(seed).toContain("demo_alice@local.vouchedge.dev");
    expect(seed).toContain("on conflict (id) do update set");
  });
});
