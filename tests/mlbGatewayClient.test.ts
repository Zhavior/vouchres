import { describe, expect, it } from "vitest";
import { isMlbDirectFallbackAllowed } from "../src/lib/mlbDirectFallbackPolicy";

describe("mlbGatewayClient", () => {
  it("allows direct MLB fallback only in dev or when explicitly enabled", () => {
    const originalDev = import.meta.env.DEV;
    const originalFlag = import.meta.env.VITE_ALLOW_MLB_DIRECT_FALLBACK;

    try {
      (import.meta.env as { DEV: boolean }).DEV = false;
      (import.meta.env as { VITE_ALLOW_MLB_DIRECT_FALLBACK?: string }).VITE_ALLOW_MLB_DIRECT_FALLBACK = undefined;
      expect(isMlbDirectFallbackAllowed()).toBe(false);

      (import.meta.env as { VITE_ALLOW_MLB_DIRECT_FALLBACK?: string }).VITE_ALLOW_MLB_DIRECT_FALLBACK = "true";
      expect(isMlbDirectFallbackAllowed()).toBe(true);

      (import.meta.env as { VITE_ALLOW_MLB_DIRECT_FALLBACK?: string }).VITE_ALLOW_MLB_DIRECT_FALLBACK = undefined;
      (import.meta.env as { DEV: boolean }).DEV = true;
      expect(isMlbDirectFallbackAllowed()).toBe(true);
    } finally {
      (import.meta.env as { DEV: boolean }).DEV = originalDev;
      (import.meta.env as { VITE_ALLOW_MLB_DIRECT_FALLBACK?: string }).VITE_ALLOW_MLB_DIRECT_FALLBACK = originalFlag;
    }
  });
});
