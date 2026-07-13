import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routes = readFileSync("server/routes/postRoutes.ts", "utf8");
const feedQuery = readFileSync("src/hooks/queries/useFeedQuery.ts", "utf8");
const feedPage = readFileSync("src/social/feed/HomeFeedPage.tsx", "utf8");
const profilePage = readFileSync("src/components/ProfilePage.tsx", "utf8");

describe("Social timeline contracts", () => {
  it("serves the following timeline only to an authenticated account", () => {
    expect(routes).toContain('postRoutes.get("/feed/following", requireAuth');
    expect(routes).toContain('.eq("follower_id", req.user!.id)');
    expect(routes).toContain('.in("author_id", authorIds)');
    expect(routes).toContain('.eq("is_demo", false)');
  });

  it("serves profile activity by its explicit profile id", () => {
    expect(routes).toContain('postRoutes.get("/profiles/:id/posts", optionalAuth');
    expect(routes).toContain('.eq("author_id", req.params.id)');
    expect(feedQuery).toContain("useProfileFeedQuery");
    expect(profilePage).toContain("useProfileFeedQuery");
  });

  it("uses the server following timeline instead of filtering a general feed page", () => {
    expect(feedPage).toContain("useFollowingFeedQuery");
    expect(feedPage).toContain("const followingPosts = followingFeed.data?.posts ?? []");
  });
});
