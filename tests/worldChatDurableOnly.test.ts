import { afterEach, describe, expect, it, vi } from "vitest";
import { postWorldChatMessage, resetWorldChatStore } from "../server/services/worldChat/worldChatService";
import { requireDurableWorldChat } from "../server/services/worldChat/worldChatStorage";

describe("WORLD_CHAT_REQUIRE_DURABLE", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetWorldChatStore();
  });

  it("defaults off outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("WORLD_CHAT_REQUIRE_DURABLE", "");
    expect(requireDurableWorldChat()).toBe(false);
  });

  it("defaults on in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WORLD_CHAT_REQUIRE_DURABLE", "");
    expect(requireDurableWorldChat()).toBe(true);
  });

  it("refuses silent memory writes when durable-only is forced", async () => {
    vi.stubEnv("WORLD_CHAT_REQUIRE_DURABLE", "1");
    await expect(
      postWorldChatMessage({
        userId: "user-1",
        username: "edge_hunter",
        displayName: "Edge Hunter",
        accentColor: "cyan",
        statusLine: "On the board",
        text: "should not land in memory",
      }),
    ).rejects.toThrow("world_chat_durable_unavailable");
  });
});
