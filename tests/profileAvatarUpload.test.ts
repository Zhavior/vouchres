import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");

describe("profile avatar upload contract", () => {
  it("stores avatars in account-scoped folders with constrained image types", () => {
    const migration = readFileSync(
      resolve(ROOT, "supabase/migrations/20260712232813_profile_avatars.sql"),
      "utf8",
    );

    expect(migration).toContain("'avatars'");
    expect(migration).toContain("3145728");
    expect(migration).toContain("'image/jpeg'");
    expect(migration).toContain("'image/png'");
    expect(migration).toContain("'image/webp'");
    expect(migration).toContain("storage.foldername(name)");
    expect(migration).toContain("owner_id = (select auth.uid()::text)");
  });

  it("uses immutable object names and saves the resulting URL through the profile API", () => {
    const upload = readFileSync(resolve(ROOT, "src/lib/profileAvatarUpload.ts"), "utf8");
    const domain = readFileSync(resolve(ROOT, "src/app/useAppDomain.ts"), "utf8");

    expect(upload).toContain("crypto.randomUUID()");
    expect(upload).toContain("upsert: false");
    expect(upload).toContain("MAX_AVATAR_BYTES");
    expect(domain).toContain("avatar_url = updatedProfile.avatarUrl || null");
    expect(domain).toContain("/api/auth/profile");
  });
});
