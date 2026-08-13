// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_SECTIONS, resolveDevSectionFromLocation } from "../src/app/sectionNavigation";

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
    ["/hr-max", "hr_max"],
    ["/hr-command-desk", "hr_max"],
    ["/hr-intel-v2", "hr_max"],
    ["/hr-aurora-max", "hr_max"],
    ["/hr-board", "hr_max"],
    ["/daily-hr-watch-new", "hr_max"],
    ["/daily-hr-board", "hr_max"],
    ["/player_research", "research"],
    ["/player-research", "research"],
    ["/aurora-hr-hq", "aurora_hr_hq"],
    ["/aurora_hr_hq", "aurora_hr_hq"],
    ["/aurora-daily-slate", "aurora_daily_slate"],
    ["/aurora_daily_slate", "aurora_daily_slate"],
    ["/daily-slate", "aurora_daily_slate"],
  ])("restores %s directly", (path, expected) => {
    window.location.pathname = path;
    expect(resolveDevSectionFromLocation()).toBe(expected);
  });

  it("keeps /player_research reachable while logged out", () => {
    window.location.pathname = "/player_research";
    expect(PUBLIC_SECTIONS.has(resolveDevSectionFromLocation()!)).toBe(true);
  });
});
