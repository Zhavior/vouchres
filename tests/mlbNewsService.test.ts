import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchJson: vi.fn(),
}));

import { sportsFetchJson } from "../server/lib/sports/sportsHttpClient";
import { getMlbNewsArticle, getMlbNewsWire } from "../server/services/mlb/mlbNewsService";

const mockFetch = sportsFetchJson as unknown as ReturnType<typeof vi.fn>;

function article(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    headline: "Reds rally past Cardinals",
    description: "— Elly De La Cruz delivered his first career walk-off hit.",
    published: "2026-08-18T02:05:30Z",
    links: { web: { href: "http://www.espn.com/mlb/recap?gameId=1" } },
    categories: [],
    ...overrides,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("getMlbNewsWire", () => {
  it("maps an ESPN article onto the wire shape", async () => {
    mockFetch.mockResolvedValue({ articles: [article()] });

    const { items, source } = await getMlbNewsWire();

    expect(source).toBe("ESPN");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "1",
      headline: "Reds rally past Cardinals",
      publishedAt: "2026-08-18T02:05:30.000Z",
      category: "NEWS",
      // The AP wire's leading em dash is stripped.
      description: "Elly De La Cruz delivered his first career walk-off hit.",
      // http links are upgraded so the sheet never opens a mixed-content page.
      url: "https://www.espn.com/mlb/recap?gameId=1",
    });
  });

  it("tags stories by keyword, injury before rotation", async () => {
    mockFetch.mockResolvedValue({
      articles: [
        article({ id: 1, headline: "Ober exits with a blister", description: "" }),
        article({ id: 2, headline: "Judge batting second tonight", description: "" }),
        article({ id: 3, headline: "Royals call up top prospect", description: "" }),
        article({ id: 4, headline: "Rain in the forecast at Wrigley", description: "" }),
        article({ id: 5, headline: "Rotation shuffled after a strained oblique", description: "" }),
      ],
    });

    const byId = new Map((await getMlbNewsWire()).items.map((item) => [item.id, item.category]));

    expect(byId.get("1")).toBe("INJURY");
    expect(byId.get("2")).toBe("LINEUP");
    expect(byId.get("3")).toBe("ROSTER");
    expect(byId.get("4")).toBe("ALERT");
    // Both rules match; injury is the more specific read of the story.
    expect(byId.get("5")).toBe("INJURY");
  });

  it("takes player mentions from athlete categories only, deduped", async () => {
    mockFetch.mockResolvedValue({
      articles: [
        article({
          categories: [
            { type: "league", description: "MLB" },
            { type: "team", description: "Cincinnati Reds" },
            { type: "athlete", description: "Elly De La Cruz", athlete: { id: 4917694, displayName: "Elly De La Cruz" } },
            { type: "athlete", description: "Elly De La Cruz", athlete: { id: 4917694, displayName: "Elly De La Cruz" } },
          ],
        }),
      ],
    });

    const [item] = (await getMlbNewsWire()).items;

    expect(item.playerMentions).toEqual([{ espnId: "4917694", name: "Elly De La Cruz" }]);
  });

  it("drops unusable articles and sorts newest first", async () => {
    mockFetch.mockResolvedValue({
      articles: [
        article({ id: 1, published: "2026-08-18T01:00:00Z" }),
        article({ id: 2, published: "2026-08-18T03:00:00Z" }),
        article({ id: 3, headline: "" }),
        article({ id: "", headline: "No id" }),
      ],
    });

    const { items } = await getMlbNewsWire();

    expect(items.map((item) => item.id)).toEqual(["2", "1"]);
  });

  it("returns an empty wire rather than throwing when the feed has no articles", async () => {
    mockFetch.mockResolvedValue({});

    await expect(getMlbNewsWire()).resolves.toMatchObject({ items: [] });
  });
});

describe("getMlbNewsArticle", () => {
  it("parses the story body into clean paragraphs", async () => {
    mockFetch.mockResolvedValue({
      headlines: [
        article({
          story:
            'PHILADELPHIA -- \u2014 S\u00e1nchez beat the <a href="http://espn.com/mia">Marlins</a>.\n\n' +
            "<hl2>Up next</hl2>\n\nWheeler starts Tuesday &amp; the Marlins have not named one.\n\n" +
            "See AP\u2019s full MLB coverage here",
          images: [{ url: "http://a.espncdn.com/photo/hero.jpg", alt: "Sanchez [600x400]", width: 600, height: 400 }],
        }),
      ],
    });

    const found = await getMlbNewsArticle("49644273");

    expect(found?.hasFullStory).toBe(true);
    // Markup is stripped, entities decoded, the doubled AP dateline collapsed,
    // and the link-only wire footer dropped.
    expect(found?.paragraphs).toEqual([
      "PHILADELPHIA \u2014 S\u00e1nchez beat the Marlins.",
      "Up next",
      "Wheeler starts Tuesday & the Marlins have not named one.",
    ]);
    expect(found?.image).toEqual({
      url: "https://a.espncdn.com/photo/hero.jpg",
      alt: "Sanchez",
      width: 600,
      height: 400,
    });
  });

  it("falls back to the summary when the story body is missing", async () => {
    mockFetch.mockResolvedValue({ headlines: [article()] });

    const found = await getMlbNewsArticle("1");

    expect(found?.hasFullStory).toBe(false);
    expect(found?.paragraphs).toEqual(["Elly De La Cruz delivered his first career walk-off hit."]);
  });

  it("rejects a non-numeric id without touching the upstream", async () => {
    expect(await getMlbNewsArticle("../../etc/passwd")).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when the payload carries no story", async () => {
    mockFetch.mockResolvedValue({ headlines: [] });

    expect(await getMlbNewsArticle("1")).toBeNull();
  });
});
