import { describe, expect, it } from "vitest";
import { mapBackendFeedPost } from "../src/lib/feedBridge";

describe("feedBridge", () => {
  it("maps backend feed rows into FeedPost shape", () => {
    const mapped = mapBackendFeedPost({
      id: "post-1",
      body: "NYY HR lean",
      created_at: "2026-07-09T12:00:00.000Z",
      view_count: 12,
      is_demo: false,
      author: {
        id: "user-1",
        username: "edgecapper",
        display_name: "Edge Capper",
        avatar_url: "https://example.com/a.png",
        tier: "gold",
      },
      likes_count: [{ count: 3 }],
      comments_count: [{ count: 1 }],
      liked_by_me: true,
      pick: {
        id: "pick-1",
        market: "HR",
        selection: "Aaron Judge HR",
        status: "pending",
      },
    });

    expect(mapped).toMatchObject({
      id: "post-1",
      backendPostId: "post-1",
      userId: "user-1",
      username: "edgecapper",
      displayName: "Edge Capper",
      subscriptionTier: "GOLD",
      content: "NYY HR lean",
      postType: "PARLAY",
      likesCount: 3,
      commentsCount: 1,
      viewsCount: 12,
      isLiked: true,
      parlay: {
        id: "pick-1",
        backendPickId: "pick-1",
      },
    });
  });
});
