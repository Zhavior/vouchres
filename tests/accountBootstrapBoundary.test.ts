import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../src/app/useAppBootstrap.ts"), "utf8");

describe("authenticated account bootstrap boundary", () => {
  it("waits for an account identity before loading account queries", () => {
    expect(source).toContain("enabled: Boolean(accountId)");
    expect(source).toContain("setAccountStorageScope(userId)");
  });

  it("treats backend data as authoritative for authenticated parlays", () => {
    expect(source).toContain("syncSlips(backendParlays)");
    expect(source).not.toContain("reconcileParlays(backendParlays");
  });
});
