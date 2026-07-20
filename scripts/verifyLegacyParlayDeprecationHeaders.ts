import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function includesAll(source: string, snippets: string[], label: string): void {
  for (const snippet of snippets) {
    assert(source.includes(snippet), `${label} missing: ${snippet}`);
  }
}

function main() {
  const telemetry = read("server/routes/parlay/legacyParlayRouteTelemetry.ts");

  includesAll(telemetry, [
    'setHeader("Deprecation", "true")',
    'setHeader("Sunset", sunsetDate)',
    `setHeader("Link", '</api/v3>; rel="successor-version"')`,
    'sunsetAt: sunsetDate',
  ], "legacy parlay deprecation headers");

  console.log(JSON.stringify({
    ok: true,
    mode: "legacy_parlay_deprecation_headers_verify",
    checkedAt: new Date().toISOString(),
    verified: {
      deprecationHeaderPresent: true,
      sunsetHeaderPresent: true,
      successorLinkPresent: true,
    },
  }, null, 2));
}

main();
