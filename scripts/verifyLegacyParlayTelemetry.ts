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
  const userRoutes = read("server/routes/parlay/parlayUserRoutes.ts");

  includesAll(telemetry, [
    "event: \"legacy_route_used\"",
    "Legacy canonical parlay route used; migrate callers to V3.",
    "canonicalTarget: \"/api/v3\"",
  ], "legacy telemetry helper");

  includesAll(userRoutes, [
    "markLegacyParlayRoute(\"legacy.parlay.detail\")",
    "markLegacyParlayRoute(\"legacy.parlay.list\")",
    "markLegacyParlayRoute(\"legacy.parlay.save\")",
    "markLegacyParlayRoute(\"legacy.parlay.commit_trust\")",
    "markLegacyParlayRoute(\"legacy.parlay.finalize_trust_lock\")",
  ], "legacy canonical parlay telemetry hooks");

  console.log(JSON.stringify({
    ok: true,
    mode: "legacy_parlay_telemetry_verify",
    checkedAt: new Date().toISOString(),
    verified: {
      helperExists: true,
      allLegacyCanonicalParlayRoutesInstrumented: true,
    },
  }, null, 2));
}

main();
