import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const composer = readFileSync("src/social/feed/FeedComposer.tsx", "utf8");
const actions = readFileSync("src/domain/feedActions.ts", "utf8");
const routes = readFileSync("server/routes/postRoutes.ts", "utf8");
const bridge = readFileSync("src/lib/feedBridge.ts", "utf8");
const threadModal = readFileSync("src/social/feed/PostThreadModal.tsx", "utf8");

describe("Social post identity", () => {
  it("makes a normal discussion the default composer action", () => {
    expect(composer).toContain("useState<ComposerMode>('DISCUSSION')");
    expect(composer).toContain("{ id: 'DISCUSSION', label: 'Post'");
    expect(actions).toContain("postType: postData.postType || 'DISCUSSION'");
  });

  it("persists a post kind and audio media through the server", () => {
    expect(routes).toContain('"/posts/audio"');
    expect(routes).toContain("post_kind:");
    expect(routes).toContain("media_url:");
    expect(bridge).toContain("row.post_kind === 'audio'");
  });

  it("opens a post as its own conversation surface", () => {
    expect(threadModal).toContain("Conversation");
    expect(threadModal).toContain("<CommentThread post={post} open autoFocus");
  });
});
