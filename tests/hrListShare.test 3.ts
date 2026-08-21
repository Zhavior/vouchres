import { describe, expect, it, beforeEach } from "vitest";
import {
  buildHrListShareText,
  HR_LIST_SHARE_TEXT_LIMITS,
} from "../server/services/hr-list/hrListShareText";
import {
  normalizeHrListEntries,
  normalizeHrListEntry,
  normalizeSlateDate,
  normalizeHrListTitle,
  HR_LIST_MAX_ENTRIES,
} from "../server/services/hr-list/hrListService";
import {
  renderHrListShareCardSvg,
  HR_LIST_CARD_LAYOUT,
  HR_LIST_CARD_UNDER_CONSTRUCTION,
} from "../server/services/share/hrListShareCard";
import { __clearShareImageCache } from "../server/services/share/remoteImage";

function entry(over: Record<string, unknown> = {}) {
  return {
    playerId: 592450,
    playerName: "Aaron Judge",
    team: "NYY",
    teamId: 147,
    opponent: "BOS",
    grade: "A+",
    estimatedHrProb: 0.21,
    bestOdds: "+285",
    addedAt: "2026-08-18T12:00:00.000Z",
    ...over,
  };
}

describe("hr list entry normalisation", () => {
  it("stores probability as a 0-1 fraction whether given a fraction or a percent", () => {
    expect(normalizeHrListEntry(entry({ estimatedHrProb: 0.21 })).estimatedHrProb).toBeCloseTo(0.21);
    expect(normalizeHrListEntry(entry({ estimatedHrProb: 21 })).estimatedHrProb).toBeCloseTo(0.21);
  });

  it("drops unknown keys so a public row cannot carry arbitrary payloads", () => {
    const normalized = normalizeHrListEntry(entry({ evil: "<script>", __proto__: {} }));
    expect(normalized).not.toHaveProperty("evil");
    expect(Object.keys(normalized).sort()).toEqual([
      "addedAt", "bestOdds", "estimatedHrProb", "gamePk", "grade", "note",
      "opponent", "opposingPitcher", "playerId", "playerName", "team", "teamId",
    ]);
  });

  it("rejects an entry with no player id or name", () => {
    expect(() => normalizeHrListEntry({ playerName: "X" })).toThrow(/playerId/);
    expect(() => normalizeHrListEntry({ playerId: 1 })).toThrow(/playerName/);
  });

  it("de-dupes on playerId and keeps the first occurrence", () => {
    const entries = normalizeHrListEntries([
      entry({ playerName: "First" }),
      entry({ playerName: "Duplicate" }),
      entry({ playerId: 660271, playerName: "Shohei Ohtani" }),
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0].playerName).toBe("First");
  });

  it("refuses more than the entry cap", () => {
    const tooMany = Array.from({ length: HR_LIST_MAX_ENTRIES + 1 }, (_, i) =>
      entry({ playerId: 1000 + i }));
    expect(() => normalizeHrListEntries(tooMany)).toThrow(/at most/);
  });

  it("requires a YYYY-MM-DD slate date and a non-empty title", () => {
    expect(normalizeSlateDate("2026-08-18")).toBe("2026-08-18");
    expect(normalizeSlateDate(null)).toBeNull();
    expect(() => normalizeSlateDate("Aug 18 2026")).toThrow(/YYYY-MM-DD/);
    expect(() => normalizeHrListTitle("   ")).toThrow(/needs a title/);
  });
});

describe("hr list share text", () => {
  it("names the leading players and rolls the rest into a count", () => {
    const text = buildHrListShareText({
      title: "Boyd's Bombs",
      slateDate: "2026-08-18",
      entries: [
        entry(),
        entry({ playerId: 660271, playerName: "Shohei Ohtani", estimatedHrProb: 0.19, bestOdds: "+320" }),
        entry({ playerId: 656941, playerName: "Kyle Schwarber", estimatedHrProb: 0.18, bestOdds: "+340" }),
        entry({ playerId: 665742, playerName: "Juan Soto" }),
        entry({ playerId: 624413, playerName: "Pete Alonso" }),
      ],
    });

    expect(text).toContain("Boyd's Bombs · Aug 18");
    expect(text).toContain("Aaron Judge (21% +285)");
    expect(text).toContain("+2 more");
    expect(text).toContain("5 HR targets");
  });

  it("stays inside X's budget once the URL weight is reserved", () => {
    const text = buildHrListShareText({
      title: "A".repeat(80),
      slateDate: "2026-08-18",
      entries: Array.from({ length: 25 }, (_, i) =>
        entry({ playerId: 900 + i, playerName: `Verylongplayername Number ${i}` })),
    });
    expect(text.length).toBeLessThanOrEqual(HR_LIST_SHARE_TEXT_LIMITS.BODY_BUDGET);
    expect(text.length + HR_LIST_SHARE_TEXT_LIMITS.X_URL_WEIGHT + 1)
      .toBeLessThanOrEqual(HR_LIST_SHARE_TEXT_LIMITS.X_LIMIT);
  });

  it("uses singular wording for a one-player list", () => {
    const text = buildHrListShareText({ title: "Solo", entries: [entry()], slateDate: null });
    expect(text).toContain("1 HR target ·");
    expect(text).not.toContain("more");
  });
});

describe("hr list share card — full renderer", () => {
  beforeEach(() => { __clearShareImageCache(); });

  it("renders a 1200x630 card carrying the link, brand, and disclaimer", async () => {
    const svg = await renderHrListShareCardSvg({
      listId: "abc123",
      title: "Boyd's Bombs",
      ownerHandle: "zhavior",
      slateDate: "2026-08-18",
      publicOrigin: "https://vouchedge.app",
      entries: [entry()],
    }, { underConstruction: false });

    expect(svg).toContain(`width="${HR_LIST_CARD_LAYOUT.WIDTH}"`);
    expect(svg).toContain(`height="${HR_LIST_CARD_LAYOUT.HEIGHT}"`);
    // X shows only the image, so brand + destination must be drawn in.
    expect(svg).toContain("VOUCHEDGE");
    expect(svg).toContain("vouchedge.app/l/abc123");
    expect(svg).toContain("not betting advice");
    expect(svg).toContain("Aaron Judge");
  });

  it("summarises overflow instead of clipping rows", async () => {
    const svg = await renderHrListShareCardSvg({
      listId: "abc123",
      title: "Deep list",
      publicOrigin: "https://vouchedge.app",
      slateDate: null,
      entries: Array.from({ length: 9 }, (_, i) =>
        entry({ playerId: 700 + i, playerName: `Player ${i}` })),
    }, { underConstruction: false });

    expect(svg).toContain(`+ ${9 - HR_LIST_CARD_LAYOUT.MAX_ROWS} more`);
    expect(svg).toContain("9 players");
  });

  it("escapes user-controlled text rather than emitting raw markup", async () => {
    const svg = await renderHrListShareCardSvg({
      listId: "abc123",
      title: '<script>alert("x")</script>',
      publicOrigin: "https://vouchedge.app",
      slateDate: null,
      entries: [entry({ playerName: "Bad <tag> & co" })],
    }, { underConstruction: false });

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&amp;");
  });

  it("renders initials when a headshot cannot be inlined", async () => {
    const svg = await renderHrListShareCardSvg({
      listId: "abc123",
      title: "Fallback",
      publicOrigin: "https://vouchedge.app",
      slateDate: null,
      // playerId 0 resolves to a URL the upstream host 404s.
      entries: [entry({ playerId: 0, playerName: "Ghost Player", teamId: null })],
    }, { underConstruction: false });

    expect(svg).toContain("GP");
  });
});


describe("hr list share card — under construction", () => {
  const data = {
    listId: "abc123",
    title: "Boyd's Bombs",
    ownerHandle: "zhavior",
    slateDate: "2026-08-18",
    publicOrigin: "https://vouchedge.app",
    entries: [entry(), entry({ playerId: 660271, playerName: "Shohei Ohtani" })],
  };

  it("is the shipped default, so nothing posted to X reads as finished", () => {
    expect(HR_LIST_CARD_UNDER_CONSTRUCTION).toBe(true);
  });

  it("says under construction and keeps the brand and destination", async () => {
    const svg = await renderHrListShareCardSvg(data);
    expect(svg).toContain("UNDER CONSTRUCTION");
    expect(svg).toContain("VOUCHEDGE");
    expect(svg).toContain("vouchedge.app");
    expect(svg).toContain(`width="${HR_LIST_CARD_LAYOUT.WIDTH}"`);
    expect(svg).toContain(`height="${HR_LIST_CARD_LAYOUT.HEIGHT}"`);
  });

  it("leaks no player names, prices or probabilities", async () => {
    const svg = await renderHrListShareCardSvg(data);
    // A half-built card that still shows real numbers reads as a shipped
    // product, and those numbers outlive the post.
    expect(svg).not.toContain("Aaron Judge");
    expect(svg).not.toContain("Shohei Ohtani");
    expect(svg).not.toContain("+285");
    expect(svg).not.toContain("21%");
    expect(svg).not.toContain("A+");
  });

  it("still escapes the list title it does show", async () => {
    const svg = await renderHrListShareCardSvg({
      ...data,
      title: '<script>alert("x")</script>',
    });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("fetches no remote assets while gated off", async () => {
    __clearShareImageCache();
    const before = Date.now();
    await renderHrListShareCardSvg(data);
    // The full renderer awaits headshot + logo fetches; this path must not,
    // so it returns without any network round trip.
    expect(Date.now() - before).toBeLessThan(150);
  });

  it("renders the full card when explicitly asked", async () => {
    const svg = await renderHrListShareCardSvg(data, { underConstruction: false });
    expect(svg).toContain("Aaron Judge");
    expect(svg).not.toContain("UNDER CONSTRUCTION");
  });
});
