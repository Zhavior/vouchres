import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearChunkRecoveryFlag,
  initChunkRecovery,
  isChunkRecoveryPending,
  onChunkRecoveryMountSuccess,
  setChunkRecoveryFallback,
} from "../src/lib/chunkRecovery";

const CHUNK_RELOAD_KEY = "vouchedge_chunk_reload_v1";
const CHUNK_FAILED_KEY = "vouchedge_chunk_failed_v1";

function createSessionStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: () => store.clear(),
  };
}

describe("chunk recovery", () => {
  let sessionStorageMock: ReturnType<typeof createSessionStorageMock>;
  let reloadMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorageMock = createSessionStorageMock();
    reloadMock = vi.fn();

    vi.stubGlobal("sessionStorage", sessionStorageMock);
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      location: { reload: reloadMock },
    });
    vi.stubGlobal("document", {
      getElementById: vi.fn(() => null),
    });
    setChunkRecoveryFallback(null);
  });

  afterEach(() => {
    setChunkRecoveryFallback(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports pending recovery when reload guard is set", () => {
    sessionStorageMock.setItem(CHUNK_RELOAD_KEY, "1");
    expect(isChunkRecoveryPending()).toBe(true);
  });

  it("reloads once on the first chunk failure", () => {
    const listeners = new Map<string, EventListener>();
    const windowMock = {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      location: { reload: reloadMock },
    };

    vi.stubGlobal("window", windowMock);
    initChunkRecovery();

    listeners.get("vite:preloadError")?.(new Event("vite:preloadError"));

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(CHUNK_RELOAD_KEY, "1");
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStorageMock.getItem(CHUNK_FAILED_KEY)).toBeNull();
  });

  it("sets double-failure fallback flag and uses fallback hook on second failure", () => {
    const fallback = vi.fn();
    setChunkRecoveryFallback(fallback);
    sessionStorageMock.setItem(CHUNK_RELOAD_KEY, "1");

    const listeners = new Map<string, EventListener>();
    const windowMock = {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      location: { reload: reloadMock },
    };

    vi.stubGlobal("window", windowMock);
    initChunkRecovery();

    listeners.get("vite:preloadError")?.(new Event("vite:preloadError"));

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(CHUNK_FAILED_KEY, "1");
    expect(reloadMock).not.toHaveBeenCalled();
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("shows fallback UI on boot when double-failure flags are present", () => {
    const root = { id: "root", innerHTML: "" };
    vi.stubGlobal("document", {
      getElementById: vi.fn((id: string) => {
        if (id === "root") return root;
        if (id === "vouchedge-chunk-retry") return { addEventListener: vi.fn() };
        return null;
      }),
    });
    sessionStorageMock.setItem(CHUNK_RELOAD_KEY, "1");
    sessionStorageMock.setItem(CHUNK_FAILED_KEY, "1");

    initChunkRecovery();

    expect(root.innerHTML).toContain("New version available");
    expect(root.innerHTML).toContain("Reload VouchEdge");
  });

  it("clears recovery flags after a successful mount", () => {
    sessionStorageMock.setItem(CHUNK_RELOAD_KEY, "1");
    sessionStorageMock.setItem(CHUNK_FAILED_KEY, "1");

    onChunkRecoveryMountSuccess();

    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(CHUNK_RELOAD_KEY);
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(CHUNK_FAILED_KEY);
    expect(isChunkRecoveryPending()).toBe(false);
  });

  it("clears stale flags when no reload is pending", () => {
    sessionStorageMock.setItem(CHUNK_FAILED_KEY, "1");

    clearChunkRecoveryFlag();

    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(CHUNK_RELOAD_KEY);
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(CHUNK_FAILED_KEY);
  });

  it("does not clear pending reload guard before mount success", () => {
    sessionStorageMock.setItem(CHUNK_RELOAD_KEY, "1");
    sessionStorageMock.removeItem.mockClear();

    clearChunkRecoveryFlag();

    expect(sessionStorageMock.removeItem).not.toHaveBeenCalled();
    expect(isChunkRecoveryPending()).toBe(true);
  });

  it("handles dynamic import rejection as a chunk failure", () => {
    const listeners = new Map<string, EventListener>();
    const windowMock = {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      location: { reload: reloadMock },
    };

    vi.stubGlobal("window", windowMock);
    initChunkRecovery();

    const event = new Event("unhandledrejection") as PromiseRejectionEvent;
    Object.defineProperty(event, "reason", {
      value: new Error("Failed to fetch dynamically imported module"),
    });
    Object.defineProperty(event, "preventDefault", {
      value: vi.fn(),
    });

    listeners.get("unhandledrejection")?.(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(CHUNK_RELOAD_KEY, "1");
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
