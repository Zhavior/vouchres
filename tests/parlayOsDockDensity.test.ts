import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dockSource = readFileSync(
  new URL("../src/components/parlay/os/ParlayOsLayer.tsx", import.meta.url),
  "utf8",
);

describe("ParlayOS compact research dock", () => {
  it("uses a tall bounded panel with one independently scrolling leg list", () => {
    expect(dockSource).toContain("h-[min(78dvh,720px)]");
    expect(dockSource).toContain("lg:h-[min(86vh,780px)]");
    expect(dockSource).toContain("h-full space-y-1.5 overflow-y-auto overscroll-contain");
  });

  it("renders compact expandable player rows instead of full cards", () => {
    expect(dockSource).toContain("min-h-[3.55rem]");
    expect(dockSource).toContain("<PlayerHeadshot");
    expect(dockSource).toContain("aria-expanded={expandedLegId === leg.id}");
    expect(dockSource).toContain("expandedLegId === leg.id ?");
  });

  it("reveals a newly added leg without forcing a full-panel jump", () => {
    expect(dockSource).toContain("scrollIntoView({ block: 'nearest'");
    expect(dockSource).toContain("prefers-reduced-motion: reduce");
    expect(dockSource).toContain("data-parlay-leg-id={leg.id}");
  });
});
