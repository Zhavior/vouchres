import { describe, expect, it } from "vitest";
import { AppError } from "../server/errors/AppError";

describe("leakage hardening invariants", () => {
  it("billing portal AppError never embeds raw upstream messages", async () => {
    // Source-level guard: portal catch must use a fixed client message.
    const fs = await import("node:fs/promises");
    const src = await fs.readFile(new URL("../server/routes/billingRoutes.ts", import.meta.url), "utf8");
    expect(src).toContain('message: "Unable to open the billing portal. Please try again."');
    expect(src).not.toMatch(/message:\s*err instanceof Error \? err\.message/);
  });

  it("subscriber profile picks fail closed when visibility is unavailable", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile(new URL("../server/routes/subscriberRoutes.ts", import.meta.url), "utf8");
    expect(src).toContain("refusing unfiltered profile parlays");
    expect(src).not.toMatch(/rows = fallback\.data/);
  });

  it("HR board debug requires staff", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile(new URL("../server/routes/mlbHrBoardRoutes.ts", import.meta.url), "utf8");
    expect(src).toMatch(/hr-board\/today\/debug[\s\S]*requireStaff/);
  });

  it("AppError defaults expose only for <500", () => {
    const client = new AppError({ status: 400, code: "bad_request", message: "nope" });
    const server = new AppError({ status: 500, code: "internal_server_error", message: "secret boom" });
    expect(client.expose).toBe(true);
    expect(server.expose).toBe(false);
  });
});
