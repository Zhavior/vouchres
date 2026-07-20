import fs from "node:fs";
import path from "node:path";

type RouteRecord = {
  method: string;
  path: string;
  source: "legacy_user" | "v3_core" | "v3_support";
};

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function extractRoutes(source: string, routerName: string, owner: RouteRecord["source"]): RouteRecord[] {
  const pattern = new RegExp(`${routerName}\\.(get|post|patch|delete)\\(\\s*"([^"]+)"`, "g");
  const routes: RouteRecord[] = [];

  for (const match of source.matchAll(pattern)) {
    routes.push({
      method: match[1].toUpperCase(),
      path: match[2],
      source: owner,
    });
  }

  return routes;
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function sortRoutes(routes: RouteRecord[]) {
  return routes.slice().sort((a, b) => {
    const pathCompare = a.path.localeCompare(b.path);
    if (pathCompare !== 0) return pathCompare;
    const methodCompare = a.method.localeCompare(b.method);
    if (methodCompare !== 0) return methodCompare;
    return a.source.localeCompare(b.source);
  });
}

function main() {
  const legacySource = read("server/routes/parlay/parlayUserRoutes.ts");
  const v3CoreSource = read("server/v3/modules/parlays/routes.ts");
  const v3SupportSource = read("server/v3/modules/parlays/supportRoutes.ts");
  const sharedSupportSource = read("server/routes/parlay/mountParlaySupportRoutes.ts");

  const legacyCanonicalRoutes = extractRoutes(legacySource, "parlayUserRoutes", "legacy_user");
  const v3CoreRoutes = extractRoutes(v3CoreSource, "v3ParlayRoutes", "v3_core");
  const sharedSupportRoutes = extractRoutes(sharedSupportSource, "router", "v3_support");
  const v3SupportRoutes = extractRoutes(v3SupportSource, "v3ParlaySupportRoutes", "v3_support");
  const legacySupportRoutes = sharedSupportRoutes.map((route) => ({ ...route, source: "legacy_user" as const }));
  const effectiveV3SupportRoutes = sharedSupportRoutes.length > 0 ? sharedSupportRoutes : v3SupportRoutes;
  const legacyRoutes = [...legacyCanonicalRoutes, ...legacySupportRoutes];
  const allRoutes = [...legacyRoutes, ...v3CoreRoutes, ...effectiveV3SupportRoutes];

  const byMethodPath = new Map<string, RouteRecord[]>();
  for (const route of allRoutes) {
    const key = `${route.method} ${route.path}`;
    const existing = byMethodPath.get(key) ?? [];
    existing.push(route);
    byMethodPath.set(key, existing);
  }

  const canonicalOwnedByV3 = [
    "GET /me/parlays",
    "GET /parlays/:id",
    "POST /parlays/save",
    "POST /parlays/:id/commit-trust",
    "POST /parlays/:id/finalize-trust-lock",
  ];

  for (const key of canonicalOwnedByV3) {
    const owners = byMethodPath.get(key) ?? [];
    assert(owners.some((route) => route.source === "v3_core"), `Canonical V3 route missing: ${key}`);
  }

  const overlaps = sortRoutes(
    Array.from(byMethodPath.entries())
      .filter(([, routes]) => routes.length > 1)
      .flatMap(([, routes]) => routes),
  );

  const summary = {
    legacyUserCount: legacyRoutes.length,
    v3CoreCount: v3CoreRoutes.length,
    v3SupportCount: v3SupportRoutes.length,
    totalDistinctMethodPaths: byMethodPath.size,
    duplicateMethodPaths: Array.from(byMethodPath.values()).filter((routes) => routes.length > 1).length,
  };

  const overlapGroups = Array.from(byMethodPath.entries())
    .filter(([, routes]) => routes.length > 1)
    .map(([key, routes]) => ({
      route: key,
      owners: routes.map((route) => route.source).sort(),
    }))
    .sort((a, b) => a.route.localeCompare(b.route));

  console.log(JSON.stringify({
    ok: true,
    mode: "parlay_route_ownership_audit",
    checkedAt: new Date().toISOString(),
    summary,
    canonicalOwnedByV3,
    overlapGroups,
    routes: {
      v3Core: sortRoutes(v3CoreRoutes),
      v3Support: sortRoutes(effectiveV3SupportRoutes),
      legacyUser: sortRoutes(legacyRoutes),
      overlaps,
    },
  }, null, 2));
}

main();
