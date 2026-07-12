import { describe, expect, it } from "vitest";
import {
  HANDLE_MAX,
  HANDLE_MIN,
  RESERVED_HANDLES,
  validateHandle,
} from "../server/lib/handleSchema";

describe("handleSchema", () => {
  it("accepts twitter-style handles", () => {
    expect(validateHandle("edge_hunter")).toEqual({ ok: true, handle: "edge_hunter" });
    expect(validateHandle("Player42")).toEqual({ ok: true, handle: "player42" });
    expect(validateHandle("9lives")).toEqual({ ok: true, handle: "9lives" });
  });

  it("normalizes to lowercase", () => {
    expect(validateHandle("  EdgeHunter  ")).toEqual({ ok: true, handle: "edgehunter" });
  });

  it("rejects invalid length", () => {
    expect(validateHandle("ab")).toEqual({ ok: false, reason: "invalid_length" });
    expect(validateHandle("a".repeat(HANDLE_MAX + 1))).toEqual({ ok: false, reason: "invalid_length" });
  });

  it("rejects invalid format", () => {
    expect(validateHandle("_starts_with_underscore")).toEqual({ ok: false, reason: "invalid_format" });
    expect(validateHandle("bad-handle")).toEqual({ ok: false, reason: "invalid_format" });
    expect(validateHandle("has spaces")).toEqual({ ok: false, reason: "invalid_format" });
  });

  it("rejects reserved handles", () => {
    for (const reserved of RESERVED_HANDLES) {
      expect(validateHandle(reserved)).toEqual({ ok: false, reason: "reserved" });
    }
  });

  it("enforces documented bounds", () => {
    expect(HANDLE_MIN).toBe(3);
    expect(HANDLE_MAX).toBe(30);
    expect(validateHandle("a".repeat(HANDLE_MIN))).toEqual({
      ok: true,
      handle: "a".repeat(HANDLE_MIN),
    });
    expect(validateHandle("a".repeat(HANDLE_MAX))).toEqual({
      ok: true,
      handle: "a".repeat(HANDLE_MAX),
    });
  });
});
