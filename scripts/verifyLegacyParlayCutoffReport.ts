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
  const observability = read("server/lib/observability/legacyRouteMetrics.ts");
  const telemetry = read("server/routes/parlay/legacyParlayRouteTelemetry.ts");
  const routesIndex = read("server/routes/index.ts");

  includesAll(observability, [
    "export interface LegacyRouteMetricsSnapshot",
    "export function recordLegacyRouteMetric",
    "export function getLegacyRouteMetricsSnapshot",
    "totals: {",
    "recent:",
  ], "legacy cutoff metrics store");

  includesAll(telemetry, [
    "recordLegacyRouteMetric({",
    "label,",
    "method: req.method,",
  ], "legacy telemetry metric hook");

  includesAll(routesIndex, [
    "const legacyRoutes = getLegacyRouteMetricsSnapshot();",
    "legacyRoutes,",
  ], "legacy cutoff report surface");

  console.log(JSON.stringify({
    ok: true,
    mode: "legacy_parlay_cutoff_report_verify",
    checkedAt: new Date().toISOString(),
    verified: {
      metricsStoreExists: true,
      telemetryFeedsMetrics: true,
      reportExposedInHealthMetrics: true,
    },
  }, null, 2));
}

main();
