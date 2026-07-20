const rolloutPhases = [
  {
    phase: 1,
    label: "legacy.parlay.detail",
    envValue: "legacy.parlay.detail",
    legacyRoute: "GET /api/parlays/:id",
    v3Route: "GET /api/v3/parlays/:id",
    canaryScript: "verify:legacy-parlay-detail-cutoff-canary",
  },
  {
    phase: 2,
    label: "legacy.parlay.list",
    envValue: "legacy.parlay.detail,legacy.parlay.list",
    legacyRoute: "GET /api/me/parlays",
    v3Route: "GET /api/v3/me/parlays",
    canaryScript: "verify:legacy-parlay-list-cutoff-canary",
  },
  {
    phase: 3,
    label: "legacy.parlay.commit_trust",
    envValue: "legacy.parlay.detail,legacy.parlay.list,legacy.parlay.commit_trust",
    legacyRoute: "POST /api/parlays/:id/commit-trust",
    v3Route: "POST /api/v3/parlays/:id/commit-trust",
    canaryScript: "verify:legacy-parlay-commit-trust-cutoff-canary",
  },
  {
    phase: 4,
    label: "legacy.parlay.finalize_trust_lock",
    envValue:
      "legacy.parlay.detail,legacy.parlay.list,legacy.parlay.commit_trust,legacy.parlay.finalize_trust_lock",
    legacyRoute: "POST /api/parlays/:id/finalize-trust-lock",
    v3Route: "POST /api/v3/parlays/:id/finalize-trust-lock",
    canaryScript: "verify:legacy-parlay-finalize-trust-lock-cutoff-canary",
  },
  {
    phase: 5,
    label: "legacy.parlay.save",
    envValue:
      "legacy.parlay.detail,legacy.parlay.list,legacy.parlay.commit_trust,legacy.parlay.finalize_trust_lock,legacy.parlay.save",
    legacyRoute: "POST /api/parlays/save",
    v3Route: "POST /api/v3/parlays/save",
    canaryScript: "verify:legacy-parlay-save-cutoff-canary",
  },
] as const;

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: "legacy_parlay_production_rollout_report",
      checkedAt: new Date().toISOString(),
      productionEnv: {
        routeScopedFlag: "DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS",
        fullKillSwitch: "DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES",
        successorApiBase: "/api/v3",
      },
      monitoring: {
        metricsEndpoint: "/api/health/metrics",
        metricsField: "legacyRoutes",
        successSignal:
          "the retired route disappears from legacyRoutes traffic while the paired V3 route continues to answer normally",
      },
      rollback: {
        fastRollback: "remove the newest label from DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS and redeploy",
        emergencyRollback: "set DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES=false or remove the variable entirely and redeploy",
      },
      phases: rolloutPhases,
    },
    null,
    2,
  ),
);
