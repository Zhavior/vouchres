import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/components/ProfilePage.tsx", "utf8");

describe("Profile trust layout", () => {
  it("does not present fabricated membership or grader status", () => {
    expect(source).not.toContain(
      "Member registered verification: June 19, 2026",
    );
    expect(source).not.toContain("ACTIVE GRADER");
    expect(source).not.toContain(
      "Every parlay risk leg is archived in your browser ledger",
    );
  });

  it("labels performance as settled data with a clear disclosure", () => {
    expect(source).toContain("SETTLED DATA");
    expect(source).toMatch(
      /Unsettled picks and local-only drafts\s+are excluded\./,
    );
    expect(source).toMatch(
      /profile\.totalPicks > 0\s+\? `\$\{profile\.totalPicks\} PICKS TRACKED`\s+: "NO SETTLED PICKS"/,
    );
  });

  it("keeps owner-only actions off community profiles", () => {
    expect(source).toContain(
      "const isOwnProfile = !viewUserId || viewUserId === user?.id;",
    );
    expect(source).toContain("{isOwnProfile && (");
    expect(source).toContain("Back to your profile");
    expect(source).not.toContain('"Trust record and identity"');
  });

  it("loads another member identity from the public profile endpoint", () => {
    expect(source).toContain('queryKey: ["profile", "public", viewUserId]');
    expect(source).toContain("/api/profile/${encodeURIComponent(viewUserId!)}");
    expect(source).toContain("Loading community profile...");
    expect(source).not.toContain("u-user-current");
  });
});
