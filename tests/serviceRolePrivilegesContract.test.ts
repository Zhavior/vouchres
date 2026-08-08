import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260808081000_grant_service_role_public_schema.sql", import.meta.url),
  "utf8",
);

describe("service-role schema privileges", () => {
  it("keeps backend access explicit without opening browser roles", () => {
    expect(migration).toMatch(/grant usage on schema public to service_role/i);
    expect(migration).toMatch(/grant all privileges on all tables in schema public to service_role/i);
    expect(migration).toMatch(/grant all privileges on all sequences in schema public to service_role/i);
    expect(migration).not.toMatch(/to\s+(anon|authenticated|public)\b/i);
  });
});
