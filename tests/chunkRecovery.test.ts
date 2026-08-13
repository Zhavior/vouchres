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
});
