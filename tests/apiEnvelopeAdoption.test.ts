import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTES_ROOT = join(process.cwd(), "server/routes");
const RAW_OK_PATTERN = /res\.json\(\s*\{\s*ok:\s*true/;

/** Paths or line snippets exempt from apiOkFlat enforcement. */
const ALLOWLIST: Array<{ file: string; lineIncludes?: string[] }> = [
  // Stripe webhook ack shape is intentionally frozen.
  { file: "billingRoutes.ts", lineIncludes: ["received: true"] },
  // Health/metrics probes — deferred to index.ts apiOkFlat consolidation.
  { file: "index.ts", lineIncludes: ['service: "vouchedge', 'schema: "route_metrics', "routes: {"] },
];

function listRouteFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...listRouteFiles(fullPath));
      continue;
    }
    if (entry.endsWith(".ts")) files.push(fullPath);
  }

  return files;
}

function isAllowlisted(relativePath: string, line: string): boolean {
  const fileName = relativePath.split("/").pop() ?? relativePath;

  return ALLOWLIST.some((rule) => {
    if (!relativePath.endsWith(rule.file) && fileName !== rule.file) return false;
    if (!rule.lineIncludes?.length) return true;
    return rule.lineIncludes.some((snippet) => line.includes(snippet));
  });
}

function findRawOkViolations(): string[] {
  const violations: string[] = [];

  for (const filePath of listRouteFiles(ROUTES_ROOT)) {
    const relativePath = relative(ROUTES_ROOT, filePath);
    const lines = readFileSync(filePath, "utf8").split("\n");

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!RAW_OK_PATTERN.test(line)) continue;
      if (isAllowlisted(relativePath, line)) continue;
      violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
    }
  }

  return violations;
}

describe("api envelope adoption guard", () => {
  it("does not introduce raw res.json({ ok: true }) outside the allowlist", () => {
    const violations = findRawOkViolations();
    expect(
      violations,
      violations.length
        ? `Use apiOkFlat/apiOk instead of raw ok:true envelopes:\n${violations.join("\n")}`
        : undefined,
    ).toEqual([]);
  });

  it("reports envelope adoption coverage for server/routes", () => {
    const routeFiles = listRouteFiles(ROUTES_ROOT);
    let enveloped = 0;
    let rawAllowed = 0;
    let rawViolations = 0;

    for (const filePath of routeFiles) {
      const relativePath = relative(ROUTES_ROOT, filePath);
      const content = readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      enveloped += (content.match(/res\.json\(apiOkFlat/g) ?? []).length;
      enveloped += (content.match(/res\.json\(apiOk\(/g) ?? []).length;

      for (const line of lines) {
        if (!RAW_OK_PATTERN.test(line)) continue;
        if (isAllowlisted(relativePath, line)) rawAllowed += 1;
        else rawViolations += 1;
      }
    }

    const total = enveloped + rawAllowed + rawViolations;
    const adoptionPct = total === 0 ? 100 : Math.round((enveloped / total) * 1000) / 10;

    expect(rawViolations).toBe(0);
    expect(adoptionPct).toBeGreaterThanOrEqual(95);
    expect(enveloped).toBeGreaterThan(100);
  });
});
