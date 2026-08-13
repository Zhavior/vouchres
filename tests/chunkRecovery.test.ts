// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

describe("chunkRecovery", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    sessionStorage.clear();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("automatically attempts one recovery for a chunk failure", async () => {
    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => undefined);

    const { recoverFromChunkFailure, isChunkRecoveryPending } =
      await import("../src/lib/chunkRecovery");

    recoverFromChunkFailure();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(isChunkRecoveryPending()).toBe(true);

    reload.mockRestore();
  });

  it("does not enter an automatic reload loop", async () => {
    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => undefined);

    const { recoverFromChunkFailure } =
      await import("../src/lib/chunkRecovery");

    recoverFromChunkFailure();
    recoverFromChunkFailure();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain(
      "We couldn't finish loading this page",
    );

    reload.mockRestore();
  });

  it("successful recovery clears the reload guard", async () => {
    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => undefined);

    const {
      recoverFromChunkFailure,
      isChunkRecoveryPending,
      onChunkRecoveryMountSuccess,
    } = await import("../src/lib/chunkRecovery");

    recoverFromChunkFailure();

    expect(isChunkRecoveryPending()).toBe(true);

    onChunkRecoveryMountSuccess();

    expect(isChunkRecoveryPending()).toBe(false);

    reload.mockRestore();
  });

  it("manual recovery renders a user-facing fallback after a second failure", async () => {
    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => undefined);

    const { recoverFromChunkFailure } =
      await import("../src/lib/chunkRecovery");

    recoverFromChunkFailure();
    recoverFromChunkFailure();

    expect(document.body.textContent).toContain("Vouchres");
    expect(document.body.textContent).not.toContain("latest app bundle");
    expect(document.body.textContent).not.toContain("deploy");

    reload.mockRestore();
  });

  it("MODE===test still subscribes to vite:preloadError and reloads once", async () => {
    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => undefined);
    const addEventListener = vi.spyOn(window, "addEventListener");

    try {
      const { initChunkRecovery } = await import("../src/lib/chunkRecovery");
      initChunkRecovery();

      const preloadHandler = addEventListener.mock.calls.find(
        ([type]) => type === "vite:preloadError",
      )?.[1] as EventListener | undefined;

      expect(preloadHandler).toBeTypeOf("function");

      window.dispatchEvent(new Event("vite:preloadError"));
      expect(reload).toHaveBeenCalledTimes(1);

      if (preloadHandler) {
        window.removeEventListener("vite:preloadError", preloadHandler);
      }
    } finally {
      addEventListener.mockRestore();
      reload.mockRestore();
    }
  });

  it("DEV (not test) initChunkRecovery does not subscribe to vite:preloadError or auto-reload", async () => {
    const originalMode = import.meta.env.MODE;
    const originalDev = import.meta.env.DEV;

    (import.meta.env as { DEV: boolean }).DEV = true;
    (import.meta.env as { MODE: string }).MODE = "development";
    vi.resetModules();

    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => undefined);
    const addEventListener = vi.spyOn(window, "addEventListener");

    try {
      const { initChunkRecovery, recoverFromChunkFailure } =
        await import("../src/lib/chunkRecovery");

      initChunkRecovery();

      expect(
        addEventListener.mock.calls.filter(([type]) => type === "vite:preloadError"),
      ).toHaveLength(0);

      recoverFromChunkFailure();
      expect(reload).not.toHaveBeenCalled();
    } finally {
      addEventListener.mockRestore();
      reload.mockRestore();
      (import.meta.env as { MODE: string }).MODE = originalMode;
      (import.meta.env as { DEV: boolean }).DEV = originalDev;
    }
  });
});

