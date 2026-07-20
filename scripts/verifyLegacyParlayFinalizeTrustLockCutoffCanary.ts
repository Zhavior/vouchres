import { runLegacyParlayCutoffCanary } from "./runLegacyParlayCutoffCanary";

runLegacyParlayCutoffCanary({
  disabledLabel: "legacy.parlay.finalize_trust_lock",
  legacyDisabledPath: "/api/parlays/test-id/finalize-trust-lock",
  legacyStillLivePath: "/api/parlays/test-id/commit-trust",
  v3UnaffectedPath: "/api/v3/parlays/test-id/finalize-trust-lock",
  legacyDisabledMethod: "POST",
  legacyStillLiveMethod: "POST",
  v3UnaffectedMethod: "POST",
  mode: "legacy_parlay_finalize_trust_lock_cutoff_canary",
  successFlags: {
    legacyFinalizeTrustLockReturnsGone: true,
    otherLegacyCanonicalRoutesStillLive: true,
    v3FinalizeTrustLockUnaffected: true,
  },
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
