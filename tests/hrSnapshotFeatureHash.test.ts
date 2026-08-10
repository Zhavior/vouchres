import { describe, expect, it } from "vitest";
import {
  canonicalStringify,
  featureHash,
} from "../server/services/hr-history/featureHash";

const VERSIONS = { featureSetVersion: "hr-snapshot-1", pipelineVersion: "abc1234" };

describe("featureHash — stability", () => {
  it("is independent of key insertion order", () => {
    const a = { hitterPower: 71, pitcherVulnerability: 44, venue: "Fenway Park" };
    const b = { venue: "Fenway Park", pitcherVulnerability: 44, hitterPower: 71 };

    expect(featureHash(a, VERSIONS)).toBe(featureHash(b, VERSIONS));
  });

  it("is independent of key order in nested objects", () => {
    const a = { breakdown: { park: 2, lineup: 1 }, id: 5 };
    const b = { id: 5, breakdown: { lineup: 1, park: 2 } };

    expect(featureHash(a, VERSIONS)).toBe(featureHash(b, VERSIONS));
  });

  it("treats an absent optional field and an explicit undefined as the same", () => {
    const a = { hitterPower: 71 };
    const b = { hitterPower: 71, weather: undefined };

    expect(featureHash(a, VERSIONS)).toBe(featureHash(b, VERSIONS));
  });

  it("repeated calls on the same input agree", () => {
    const row = { hitterPower: 71, reasons: ["barrels", "park"] };
    expect(featureHash(row, VERSIONS)).toBe(featureHash(row, VERSIONS));
  });
});

describe("featureHash — sensitivity", () => {
  it("changes when any captured value changes", () => {
    const before = featureHash({ hitterPower: 71 }, VERSIONS);
    const after = featureHash({ hitterPower: 72 }, VERSIONS);

    expect(after).not.toBe(before);
  });

  it("distinguishes null from absent — 'looked and found nothing' is a fact", () => {
    const withNull = featureHash({ hitterPower: 71, weather: null }, VERSIONS);
    const without = featureHash({ hitterPower: 71 }, VERSIONS);

    expect(withNull).not.toBe(without);
  });

  it("respects array order", () => {
    const a = featureHash({ reasons: ["barrels", "park"] }, VERSIONS);
    const b = featureHash({ reasons: ["park", "barrels"] }, VERSIONS);

    expect(a).not.toBe(b);
  });

  it("changes when featureSetVersion changes", () => {
    const row = { hitterPower: 71 };
    const v1 = featureHash(row, VERSIONS);
    const v2 = featureHash(row, { ...VERSIONS, featureSetVersion: "hr-snapshot-2" });

    expect(v2).not.toBe(v1);
  });

  it("changes when pipelineVersion changes — same inputs, different code is a different observation", () => {
    const row = { hitterPower: 71 };
    const v1 = featureHash(row, VERSIONS);
    const v2 = featureHash(row, { ...VERSIONS, pipelineVersion: "def5678" });

    expect(v2).not.toBe(v1);
  });
});

describe("featureHash — non-finite numbers", () => {
  it.each([NaN, Infinity, -Infinity])("rejects %p rather than hashing it as null", (value) => {
    expect(() => featureHash({ hitterPower: value }, VERSIONS)).toThrow(/non-finite/);
  });
});

describe("canonicalStringify", () => {
  it("sorts keys deterministically", () => {
    expect(canonicalStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
});
