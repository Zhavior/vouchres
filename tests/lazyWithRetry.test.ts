import { describe, expect, it, vi } from "vitest";
import { lazyWithRetry, isLazyChunkError } from "../src/lib/lazyWithRetry";

vi.mock("../src/lib/chunkRecovery", () => ({
  recoverFromChunkFailure: vi.fn(),
}));

import { recoverFromChunkFailure } from "../src/lib/chunkRecovery";

describe("lazyWithRetry", () => {
  it("returns a React lazy component without importing immediately", () => {
    const importer = vi.fn(async () => ({
      default: () => null,
    }));

    const component = lazyWithRetry(importer);

    expect(component).toBeTruthy();
    expect(importer).not.toHaveBeenCalled();
  });

  it("recognizes common Vite chunk failures", () => {
    expect(
      isLazyChunkError(
        new Error("Failed to fetch dynamically imported module"),
      ),
    ).toBe(true);

    expect(
      isLazyChunkError(
        new Error("Importing a module script failed"),
      ),
    ).toBe(true);

    expect(
      isLazyChunkError(
        new Error("Loading chunk 42 failed"),
      ),
    ).toBe(true);
  });

  it("does not classify ordinary application errors as chunk failures", () => {
    expect(
      isLazyChunkError(new Error("Cannot read properties of undefined")),
    ).toBe(false);
  });

  it("keeps deprecated retry options source-compatible", () => {
    expect(() =>
      lazyWithRetry(
        async () => ({
          default: () => null,
        }),
        {
          retries: 3,
          retryDelayMs: 150,
          reloadOnFailure: true,
        },
      ),
    ).not.toThrow();
  });

  it("does not trigger recovery merely by constructing the lazy component", () => {
    lazyWithRetry(async () => {
      throw new Error("Failed to fetch dynamically imported module");
    });

    expect(recoverFromChunkFailure).not.toHaveBeenCalled();
  });
});
