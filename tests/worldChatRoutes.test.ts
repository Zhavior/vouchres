import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { worldChatRoutes } from "../server/routes/worldChatRoutes";
import {
  getResolvedWorldChatStorageMeta,
  honestWinRate,
  listWorldChatChannels,
  listWorldChatEmojis,
  listWorldChatMessages,
  postWorldChatMessage,
  resetWorldChatStore,
  toggleWorldChatReaction,
  upsertWorldChatEmoji,
} from "../server/services/worldChat/worldChatService";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api", worldChatRoutes);
  app.use(apiErrorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Test server did not bind.");
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

beforeEach(() => {
  resetWorldChatStore();
});

describe("worldChatService", () => {
  it("returns null win rate when no decided picks", () => {
    expect(honestWinRate(0, 0)).toBeNull();
    expect(honestWinRate(3, 0)).toBeNull();
  });

  it("computes honest win rate from graded picks", () => {
    expect(honestWinRate(7, 10)).toBe(70);
    expect(honestWinRate(1, 3)).toBe(33.3);
  });

  it("stores author metadata on messages", async () => {
    const msg = await postWorldChatMessage({
      userId: "user-1",
      username: "edge_hunter",
      displayName: "Edge Hunter",
      avatarUrl: "https://example.com/a.png",
      accentColor: "cyan",
      statusLine: "On the board",
      winRate: 62.5,
      text: "Loving the HR board today",
    });

    expect(msg.handle).toBe("edge_hunter");
    expect(msg.winRate).toBe(62.5);
    expect(msg.profilePath).toBe("profile:user-1");
    expect(msg.channelId).toBe("world:lounge");
    expect(await listWorldChatMessages()).toHaveLength(1);
  });

  it("stores reply context on messages in memory fallback", async () => {
    const parent = await postWorldChatMessage({
      userId: "user-1",
      username: "edge_hunter",
      displayName: "Edge Hunter",
      accentColor: "cyan",
      statusLine: "On the board",
      text: "Original edge post",
    });

    const reply = await postWorldChatMessage({
      userId: "user-2",
      username: "tail_queen",
      displayName: "Tail Queen",
      accentColor: "emerald",
      statusLine: "Watching the room",
      replyToMessageId: parent.id,
      text: "I am tailing this one.",
    });

    expect(reply.replyTo).toMatchObject({
      id: parent.id,
      userId: parent.userId,
      handle: parent.handle,
      text: parent.text,
    });

    const listed = await listWorldChatMessages();
    expect(listed[1]?.replyTo).toMatchObject({
      id: parent.id,
      handle: parent.handle,
    });
  });

  it("rejects replies that point at missing messages", async () => {
    await expect(() =>
      postWorldChatMessage({
        userId: "user-2",
        username: "tail_queen",
        displayName: "Tail Queen",
        accentColor: "emerald",
        statusLine: "Watching the room",
        replyToMessageId: "missing-message-id",
        text: "I am tailing this one.",
      }),
    ).rejects.toThrow("invalid_world_chat_reply_target");
  });

  it("supports approved custom emoji reactions in memory fallback", async () => {
    const msg = await postWorldChatMessage({
      userId: "user-1",
      username: "edge_hunter",
      displayName: "Edge Hunter",
      accentColor: "cyan",
      statusLine: "On the board",
      text: "Loving the HR board today",
    });

    await upsertWorldChatEmoji({
      id: "z8-fire",
      shortcode: "z8_fire",
      imageUrl: "https://example.com/z8-fire.png",
      altText: "Z8 Fire",
      sortOrder: 10,
    });

    let reactions = await toggleWorldChatReaction({
      messageId: msg.id,
      emojiId: "z8-fire",
      userId: "user-1",
    });
    expect(reactions).toMatchObject([
      {
        emojiId: "z8-fire",
        count: 1,
        reactedByViewer: true,
      },
    ]);

    reactions = await toggleWorldChatReaction({
      messageId: msg.id,
      emojiId: "z8-fire",
      userId: "user-1",
    });
    expect(reactions).toEqual([]);
  });

  it("exposes the default channel and emoji registry helpers", async () => {
    const channels = await listWorldChatChannels();
    expect(channels[0]).toMatchObject({
      id: "world:lounge",
      isDefault: true,
    });

    await upsertWorldChatEmoji({
      id: "crown",
      shortcode: "crown",
      imageUrl: "https://example.com/crown.png",
      altText: "Crown",
    });

    const emojis = await listWorldChatEmojis();
    expect(emojis).toHaveLength(1);
    expect(emojis[0]).toMatchObject({ id: "crown", isActive: true });
  });
});

describe("world chat routes", () => {
  it("returns an empty honest message list by default", async () => {
    const response = await fetch(`${baseUrl}/api/world-chat/messages`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      messages: [],
      channels: [
        {
          id: "world:lounge",
          isDefault: true,
        },
      ],
      emojis: [],
      preview: true,
      storage: {
        mode: "in_memory_ephemeral",
        multiInstanceSafe: false,
        persistence: "none",
      },
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
    expect(response.headers.get("x-request-id")).toBe(body.meta.requestId);
  });

  it("reports in-memory storage mode when durable backend is unavailable in test", async () => {
    const storage = await getResolvedWorldChatStorageMeta();
    expect(storage.mode).toBe("in_memory_ephemeral");
  });

  it("requires auth to post messages", async () => {
    const response = await fetch(`${baseUrl}/api/world-chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello" }),
    });

    expect(response.status).toBe(401);
  });
});
