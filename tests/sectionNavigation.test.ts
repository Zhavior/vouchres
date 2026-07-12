import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveDevSectionFromLocation } from "../src/app/sectionNavigation";

const storage = new Map<string, string>();

beforeEach(() => {
  const location = { pathname: "/", hash: "" };
  vi.stubGlobal("window", {
    location,
    history: { replaceState: (_state: unknown, _title: string, path: string) => { location.pathname = path; location.hash = ""; } },
  });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    key: () => null,
    get length() { return storage.size; },
  });
});

afterEach(() => {
  storage.clear();
  vi.unstubAllGlobals();
});

describe("section navigation", () => {
  it.each([
    ["/brain-picks", "brain_picks"],
    ["/brain_picks", "brain_picks"],
    ["/brain-performance", "brain_performance"],
    ["/brain_performance", "brain_performance"],
  ])("restores %s directly", (path, expected) => {
    window.location.pathname = path;
    expect(resolveDevSectionFromLocation()).toBe(expected);
  });
});
