import { afterEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({
    from: (...args: unknown[]) => fromMock(...args),
  })),
}));

import { assertUserOwnsResource } from "../server/middleware/ownership";

function chainResult(data: unknown, error: unknown = null) {
  const api: Record<string, unknown> = {};
  api.select = (cols: string) => {
    expect(cols).not.toBe("*");
    return api;
  };
  api.eq = () => api;
  api.limit = () => api;
  // Mirror PostgREST: terminalizers stay chainable/thenable until awaited.
  api.maybeSingle = () => api;
  api.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve({ data, error }).then(resolve, reject);
  return api;
}

describe("assertUserOwnsResource ownership regressions", () => {
  afterEach(() => {
    fromMock.mockReset();
  });

  it("allows user A to mutate their own parlay/post/vouch", async () => {
    fromMock.mockImplementation(() => chainResult({ id: "res-1" }));

    await expect(assertUserOwnsResource("user-a", "parlay", "res-1")).resolves.toEqual({ ok: true });
    await expect(assertUserOwnsResource("user-a", "post", "res-1")).resolves.toEqual({ ok: true });
    await expect(assertUserOwnsResource("user-a", "vouch", "res-1")).resolves.toEqual({ ok: true });
  });

  it("denies user A mutating user B resources (lookup scoped to owner)", async () => {
    fromMock.mockImplementation(() => chainResult(null));

    const denied = await assertUserOwnsResource("user-a", "parlay", "user-b-parlay");
    expect(denied).toEqual({ ok: false, warning: "resource not found for authenticated user" });

    const deniedPost = await assertUserOwnsResource("user-a", "post", "user-b-post");
    expect(deniedPost.ok).toBe(false);

    const deniedVouch = await assertUserOwnsResource("user-a", "vouch", "user-b-vouch");
    expect(deniedVouch.ok).toBe(false);
  });
});
