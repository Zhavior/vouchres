import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { shareRoutes } from "../server/routes/shareRoutes";

vi.mock("../server/services/persistence/vouchService", () => ({
  getPublicVouch: vi.fn(async () => null),
}));

vi.mock("../server/services/hubs/hrBoardHub", () => ({
  getCachedValidatedHrBoard: vi.fn(),
}));

vi.mock("../server/services/share/hrShareCard", () => ({
  HR_SHARE_CARD_HEADERS: {},
  HrShareCardRequestError: class HrShareCardRequestError extends Error {
    statusCode: number;
    payload: Record<string, unknown>;
    constructor(statusCode: number, payload: Record<string, unknown>) {
      super("hr share error");
      this.statusCode = statusCode;
      this.payload = payload;
    }
  },
  parseHrShareCardParams: vi.fn(() => {
    throw Object.assign(new Error("invalid"), {
      statusCode: 400,
      payload: { error: "playerId required" },
    });
  }),
  findHrShareCardCandidate: vi.fn(),
  renderHrShareCardSvg: vi.fn(),
}));

vi.mock("../server/services/share/vouchShareCard", () => ({
  VOUCH_SHARE_CARD_HEADERS: {},
  renderVouchShareCardSvg: vi.fn(),
}));

vi.mock("sharp", () => ({
  default: vi.fn(),
}));

import { getPublicVouch } from "../server/services/persistence/vouchService";
import {
  HrShareCardRequestError,
  parseHrShareCardParams,
} from "../server/services/share/hrShareCard";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use("/api", shareRoutes);
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

describe("share routes", () => {
  it("returns unified not_found for missing vouch cards", async () => {
    vi.mocked(getPublicVouch).mockResolvedValueOnce(null);

    const response = await fetch(`${baseUrl}/api/share/vouch/missing/card.png`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "Vouch not found.",
      },
    });
  });

  it("maps HR share card request errors to AppError envelopes", async () => {
    vi.mocked(parseHrShareCardParams).mockImplementationOnce(() => {
      throw new HrShareCardRequestError(400, { error: "playerId required" });
    });

    const response = await fetch(`${baseUrl}/api/share/hr-card`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "playerId required",
      },
    });
  });
});
