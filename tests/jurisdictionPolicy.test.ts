import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import {
  assertJurisdictionAllowed,
  getBlockedJurisdictions,
  isValidJurisdictionCode,
  resetJurisdictionPolicyCacheForTests,
} from "../server/lib/jurisdictionPolicy";

describe("jurisdictionPolicy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetJurisdictionPolicyCacheForTests();
  });

  it("validates ISO-like jurisdiction codes", () => {
    expect(isValidJurisdictionCode("US-NV")).toBe(true);
    expect(isValidJurisdictionCode("us-nv")).toBe(true);
    expect(isValidJurisdictionCode("CA")).toBe(true);
    expect(isValidJurisdictionCode("bad code")).toBe(false);
  });

  it("allows jurisdictions when blocklist env is empty", () => {
    vi.stubEnv("BLOCKED_JURISDICTIONS", "");
    resetJurisdictionPolicyCacheForTests();
    expect(getBlockedJurisdictions().size).toBe(0);
    expect(() => assertJurisdictionAllowed("US-NV")).not.toThrow();
  });

  it("blocks jurisdictions listed in BLOCKED_JURISDICTIONS", () => {
    vi.stubEnv("BLOCKED_JURISDICTIONS", "US-CA, US-TX");
    resetJurisdictionPolicyCacheForTests();

    expect(() => assertJurisdictionAllowed("US-CA")).toThrow(AppError);
    expect(() => assertJurisdictionAllowed("US-NV")).not.toThrow();
  });
});
