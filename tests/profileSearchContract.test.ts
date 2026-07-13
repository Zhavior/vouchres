import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routes = readFileSync("server/routes/publicRoutes.ts", "utf8");
const feed = readFileSync("src/social/feed/HomeFeedPage.tsx", "utf8");

describe("Profile search", () => {
  it("searches public account identity on the server", () => {
    expect(routes).toContain('publicRoutes.get("/profiles/search"');
    expect(routes).toContain("username.ilike");
    expect(routes).toContain("handle.ilike");
    expect(routes).toContain("display_name.ilike");
  });

  it("shows people in the feed search and navigates to the selected profile", () => {
    expect(feed).toContain("useDeferredValue(searchQuery.trim())");
    expect(feed).toContain("/api/profiles/search");
    expect(feed).toContain("onNavigateToProfile?.(person.id)");
    expect(feed).toContain("People");
  });
});
