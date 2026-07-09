import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { bootDataStore } from "../src/lib/boot/bootDataStore";
import {
  isGuestHrBoardWarmComplete,
  markGuestHrBoardWarmComplete,
  resetGuestHrBoardWarmCacheForTests,
  seedGuestHrBoardQueryCache,
} from "../src/lib/boot/guestHrBoardWarmCache";
import { getHrBoardBootInitialData, todayISO } from "../src/hooks/queries/hrBoardQuery";
import { resetScrollPane } from "../src/lib/scroll/resetScrollPane";
import {
  FEED_BATCH_SIZE,
  nextVisiblePostCount,
  shouldPrefetchServerFeedPage,
} from "../src/social/feed/feedVirtualizerConfig";

beforeAll(() => {
  vi.stubGlobal("sessionStorage", {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

describe("frontend integration smoke", () => {
  afterEach(() => {
    bootDataStore.clear();
    resetGuestHrBoardWarmCacheForTests();
    vi.unstubAllGlobals();
  });

  it("resets scroll pane position on route section switches", () => {
    const pane = { scrollTop: 480 };
    resetScrollPane(pane);
    expect(pane.scrollTop).toBe(0);
    resetScrollPane(null);
    resetScrollPane(undefined);
  });

  it("grows feed virtualizer batches and triggers server prefetch near the end", () => {
    expect(FEED_BATCH_SIZE).toBe(8);
    expect(nextVisiblePostCount(8, 30)).toBe(16);
    expect(nextVisiblePostCount(28, 30)).toBe(30);

    expect(
      shouldPrefetchServerFeedPage({
        visiblePostCount: 42,
        loadedPostCount: 50,
        hasMoreServer: true,
        isFetchingServer: false,
      }),
    ).toBe(true);

    expect(
      shouldPrefetchServerFeedPage({
        visiblePostCount: 10,
        loadedPostCount: 50,
        hasMoreServer: true,
        isFetchingServer: false,
      }),
    ).toBe(false);

    expect(
      shouldPrefetchServerFeedPage({
        visiblePostCount: 42,
        loadedPostCount: 50,
        hasMoreServer: true,
        isFetchingServer: true,
      }),
    ).toBe(false);
  });

  it("seeds HR board query cache from guest warm-cache boot data", () => {
    const date = todayISO();
    const board = {
      date,
      games: [],
      candidates: [],
      projectedCandidates: [],
      warnings: [],
    };

    bootDataStore.set("dailyHrBoard", board);
    markGuestHrBoardWarmComplete();

    expect(isGuestHrBoardWarmComplete()).toBe(true);
    expect(getHrBoardBootInitialData(date)).toEqual(board);

    seedGuestHrBoardQueryCache(board);
    expect(bootDataStore.has("dailyHrBoard")).toBe(true);
  });
});
