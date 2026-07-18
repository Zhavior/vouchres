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
    expect(upload).toContain("MAX_IMAGE_BYTES");
    expect(domain).toContain("avatar_url = updatedProfile.avatarUrl || null");
    expect(domain).toContain("/api/auth/profile");
  });

  it("uploads header images under an account-scoped header folder and persists header_url", () => {
    const upload = readFileSync(resolve(ROOT, "src/lib/profileAvatarUpload.ts"), "utf8");
    const domain = readFileSync(resolve(ROOT, "src/app/useAppDomain.ts"), "utf8");
    const profilePage = readFileSync(resolve(ROOT, "src/components/ProfilePageZ8.tsx"), "utf8");
    const authRoutes = readFileSync(resolve(ROOT, "server/routes/authRoutes.ts"), "utf8");
    const migration = readFileSync(
      resolve(ROOT, "supabase/migrations/20260718183000_profile_header_url.sql"),
      "utf8",
    );

    expect(upload).toContain("uploadProfileHeader");
    expect(upload).toContain("${userId}/header/");
    expect(domain).toContain("header_url = updatedProfile.headerUrl || null");
    expect(profilePage).toContain("uploadProfileHeader");
    expect(profilePage).toContain("upload-profile-header-btn");
    expect(authRoutes).toContain("header_url");
    expect(authRoutes).toContain("header_customization_requires_gold");
    expect(migration).toContain("header_url");
  });
});
