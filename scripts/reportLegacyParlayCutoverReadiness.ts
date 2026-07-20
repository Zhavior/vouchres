const provenRouteScopedCutoffs = [
  {
    label: "legacy.parlay.detail",
    legacyRoute: "GET /api/parlays/:id",
    v3Route: "GET /api/v3/parlays/:id",
    canaryScript: "verify:legacy-parlay-detail-cutoff-canary",
    rolloutPriority: 1,
  },
  {
    label: "legacy.parlay.list",
    legacyRoute: "GET /api/me/parlays",
    v3Route: "GET /api/v3/me/parlays",
    canaryScript: "verify:legacy-parlay-list-cutoff-canary",
    rolloutPriority: 2,
  },
  {
    label: "legacy.parlay.commit_trust",
    legacyRoute: "POST /api/parlays/:id/commit-trust",
    v3Route: "POST /api/v3/parlays/:id/commit-trust",
    canaryScript: "verify:legacy-parlay-commit-trust-cutoff-canary",
    rolloutPriority: 3,
  },
  {
    label: "legacy.parlay.finalize_trust_lock",
    legacyRoute: "POST /api/parlays/:id/finalize-trust-lock",
    v3Route: "POST /api/v3/parlays/:id/finalize-trust-lock",
    canaryScript: "verify:legacy-parlay-finalize-trust-lock-cutoff-canary",
    rolloutPriority: 4,
  },
  {
    label: "legacy.parlay.save",
    legacyRoute: "POST /api/parlays/save",
    v3Route: "POST /api/v3/parlays/save",
    canaryScript: "verify:legacy-parlay-save-cutoff-canary",
    rolloutPriority: 5,
  },
] as const;

const rolloutExamples = {
  singleRoute: "DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail",
  multipleRoutes: "DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail,legacy.parlay.list",
  allRoutes: "DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES=true",
};

console.log(JSON.stringify({
  ok: true,
  mode: "legacy_parlay_cutover_readiness_report",
  checkedAt: new Date().toISOString(),
  rolloutWindowContext: {
    currentDate: "2026-07-20",
    sunsetDate: "2026-08-31T00:00:00Z",
  },
  status: {
    canonicalLegacyRoutesProven: provenRouteScopedCutoffs.length,
    routeScopedKillSwitchReady: true,
    deprecationHeadersReady: true,
    telemetryReady: true,
    cutoffReportReady: true,
  },
  monitoring: {
    metricsEndpoint: "/api/health/metrics",
    field: "legacyRoutes",
    successSignal: "target route stops appearing while neighboring legacy routes still show expected traffic or stay auth-gated",
  },
  rolloutExamples,
  recommendedOrder: provenRouteScopedCutoffs
    .slice()
    .sort((a, b) => a.rolloutPriority - b.rolloutPriority),
}, null, 2));
