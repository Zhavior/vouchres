/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

describe("authSessionSync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("notifies subscribers when auth session changes", async () => {
    const { notifyAuthSessionChanged, useIsLoggedIn } = await import("../src/lib/authSessionSync");

    window.localStorage.setItem("vouchedge_auth_token", "x".repeat(24));
    notifyAuthSessionChanged();

    const { result } = renderHook(() => useIsLoggedIn());
    expect(result.current).toBe(true);

    act(() => {
      window.localStorage.removeItem("vouchedge_auth_token");
      notifyAuthSessionChanged();
    });

    expect(result.current).toBe(false);
  });
});
