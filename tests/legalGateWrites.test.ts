import { describe, expect, it, vi } from "vitest";
import { requireLegalConfirmed } from "../server/middleware/auth";
import { AppError } from "../server/errors/AppError";

describe("requireLegalConfirmed on betting writes", () => {
  it("blocks when age is not confirmed", () => {
    const next = vi.fn();
    requireLegalConfirmed(
      {
        user: {
          id: "user_test",
          profile: {
            age_confirmed_at: null,
            jurisdiction_confirmed_at: "2026-01-01",
            jurisdiction: "US-CA",
          },
        },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(403);
    expect((error as AppError).message).toContain("Age confirmation");
  });

  it("blocks when jurisdiction is not confirmed", () => {
    const next = vi.fn();
    requireLegalConfirmed(
      {
        user: {
          id: "user_test",
          profile: {
            age_confirmed_at: "2026-01-01",
            jurisdiction_confirmed_at: null,
            jurisdiction: null,
          },
        },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(403);
    expect((error as AppError).message).toContain("Jurisdiction confirmation");
  });

  it("allows confirmed users in allowed jurisdictions", () => {
    const next = vi.fn();
    requireLegalConfirmed(
      {
        user: {
          id: "user_test",
          profile: {
            age_confirmed_at: "2026-01-01",
            jurisdiction_confirmed_at: "2026-01-01",
            jurisdiction: "US-CA",
          },
        },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });
});
