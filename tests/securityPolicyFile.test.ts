import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("security policy file", () => {
  it("does not ship GitHub SECURITY.md boilerplate without a reporting contact", () => {
    if (!existsSync("SECURITY.md")) {
      expect(existsSync("SECURITY.md")).toBe(false);
      return;
    }

    const policy = readFileSync("SECURITY.md", "utf8");
    expect(policy).not.toContain("Use this section to tell people");
    expect(policy).toMatch(/security@|vulnerability|responsible disclosure/i);
  });
});
