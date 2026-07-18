import { describe, expect, it } from "vitest";
import { AppError, isAppError } from "../server/errors/AppError";

describe("checkout AppError preservation", () => {
  it("isAppError detects already_subscribed conflicts", () => {
    const err = new AppError({
      status: 409,
      code: "conflict",
      message: "already subscribed",
      details: { reason: "already_subscribed" },
      expose: true,
    });
    expect(isAppError(err)).toBe(true);
    expect(err.status).toBe(409);
  });
});
