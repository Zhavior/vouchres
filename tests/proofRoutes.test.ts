import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { proofRoutes } from "../server/routes/proofRoutes";

vi.mock("../server/services/proof/parlayProofService", () => ({
  getPublicParlayProof: vi.fn(async () => null),
}));

vi.mock("../server/services/persistence/vouchService", () => ({
  getPublicVouchWithAuthor: vi.fn(async () => null),
}));

import { getPublicParlayProof } from "../server/services/proof/parlayProofService";
import { getPublicVouchWithAuthor } from "../server/services/persistence/vouchService";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use("/api", proofRoutes);
  app.use("/api", apiErrorHandler);

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

describe("proof routes", () => {
  it("returns not_found when parlay proof is missing", async () => {
    vi.mocked(getPublicParlayProof).mockResolvedValueOnce(null);
    const res = await fetch(`${baseUrl}/api/proof/parlay/00000000-0000-4000-8000-000000000001`);
    expect(res.status).toBe(404);
  });

  it("returns parlay proof payload when available", async () => {
    vi.mocked(getPublicParlayProof).mockResolvedValueOnce({
      id: "00000000-0000-4000-8000-000000000001",
      user_id: "user-1",
      capper_id: null,
      sport: "mlb",
      market: "2-leg parlay",
      selection: "Judge HR | Stanton hit",
      odds_decimal: 4.5,
      stake_units: 1,
      status: "pending",
      explanation: "Yankees slip",
      source: "manual",
      created_at: "2026-07-10T12:00:00.000Z",
      updated_at: "2026-07-10T12:00:00.000Z",
      legs: [],
      author: {
        id: "user-1",
        handle: "edgeking",
        username: "edgeking",
        display_name: "Edge King",
        avatar_url: null,
      },
      capper: null,
      proof_url: "http://127.0.0.1/p/00000000-0000-4000-8000-000000000001",
    });

    const res = await fetch(`${baseUrl}/api/proof/parlay/00000000-0000-4000-8000-000000000001`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.proof.author.handle).toBe("edgeking");
  });

  it("returns vouch proof with author metadata", async () => {
    vi.mocked(getPublicVouchWithAuthor).mockResolvedValueOnce({
      vouch: {
        id: "00000000-0000-4000-8000-000000000002",
        user_id: "user-1",
        vouch_source: "hr_board",
        user_note: "",
        market: "HR",
        sport: "mlb",
        player_or_team: "Aaron Judge",
        game_name: "NYY @ BOS",
        odds: "+150",
        line: null,
        selection: "Aaron Judge HR",
        status: "pending",
        saved_count: 0,
        vouched_count: 0,
        ai_confidence: 72,
        capper_confidence: null,
        risk_tier: "MEDIUM",
        is_locked: false,
        lock_time: null,
        longer_breakdown: null,
        card_theme: null,
        visibility: "public",
        is_demo: false,
        user_hidden_at: null,
        created_at: "2026-07-10T12:00:00.000Z",
        updated_at: "2026-07-10T12:00:00.000Z",
      },
      author: {
        id: "user-1",
        handle: "edgeking",
        username: "edgeking",
        display_name: "Edge King",
        avatar_url: null,
      },
    });

    const res = await fetch(`${baseUrl}/api/proof/vouch/00000000-0000-4000-8000-000000000002`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.proof.author.handle).toBe("edgeking");
    expect(body.proof.created_at).toBe("2026-07-10T12:00:00.000Z");
  });
});
