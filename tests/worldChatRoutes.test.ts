import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseAdmin = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("../server/middleware/auth", async () => {
  const actual = await vi.importActual<typeof import("../server/middleware/auth")>("../server/middleware/auth");
  return { ...actual, getSupabaseAdmin: vi.fn(async () => supabaseAdmin) };
});
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { worldChatRoutes } from "../server/routes/worldChatRoutes";
import {
  honestWinRate,
  listWorldChatMessages,
  postWorldChatMessage,
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
  supabaseAdmin.from.mockImplementation((table: string) => {
    if (table === "world_chat_messages") {
      return {
        select: vi.fn(() => ({
          order: vi.fn(() => ({ limit: vi.fn(async () => ({ data: [], error: null })) })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: "message-1",
                user_id: "user-1",
                text: "Loving the HR board today",
                accent_color: "cyan",
                status_line: "On the board",
                border_id: null,
                created_at: "2026-07-13T00:00:00.000Z",
              },
              error: null,
            })),
          })),
        })),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });
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

  it("persists author metadata on messages", async () => {
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
    expect(supabaseAdmin.from).toHaveBeenCalledWith("world_chat_messages");
  });

  it("returns messages oldest-first after reading the capped database result", async () => {
    supabaseAdmin.from.mockImplementation((table: string) => {
      if (table === "world_chat_messages") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(async () => ({
                data: [{
                  id: "message-1", user_id: "user-1", text: "hello", accent_color: "cyan",
                  status_line: "Researching edges", border_id: null, created_at: "2026-07-13T00:00:00.000Z",
                }],
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(async () => ({
              data: [{ id: "user-1", username: "edge_hunter", display_name: "Edge Hunter", avatar_url: null, won_picks: 7, total_picks: 10 }],
              error: null,
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(listWorldChatMessages()).resolves.toMatchObject([{ username: "edge_hunter", winRate: 70 }]);
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
      preview: true,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
    expect(response.headers.get("x-request-id")).toBe(body.meta.requestId);
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
