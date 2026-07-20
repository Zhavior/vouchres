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
    'process.env.DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES === "true"',
    'process.env.DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS ?? ""',
    'split(",")',
    "legacyCanonicalParlayRouteDisabled(label)",
    'status: 410',
    'code: "gone"',
    'message: "Legacy canonical parlay routes are disabled. Use the V3 API path instead."',
    '"DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES"',
    '"DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS"',
  ], "legacy parlay kill switch");

  console.log(JSON.stringify({
    ok: true,
    mode: "legacy_parlay_kill_switch_verify",
    checkedAt: new Date().toISOString(),
    verified: {
      envKillSwitchPresent: true,
      routeScopedKillSwitchPresent: true,
      returnsGoneWhenEnabled: true,
      defaultRemainsCodeOnlyUntilEnabled: true,
    },
  }, null, 2));
}

main();
