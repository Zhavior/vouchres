import { runLegacyParlayCutoffCanary } from "./runLegacyParlayCutoffCanary";

runLegacyParlayCutoffCanary({
  disabledLabel: "legacy.parlay.commit_trust",
  legacyDisabledPath: "/api/parlays/test-id/commit-trust",
  legacyStillLivePath: "/api/parlays/test-id/finalize-trust-lock",
  v3UnaffectedPath: "/api/v3/parlays/test-id/commit-trust",
  legacyDisabledMethod: "POST",
  legacyStillLiveMethod: "POST",
  v3UnaffectedMethod: "POST",
  mode: "legacy_parlay_commit_trust_cutoff_canary",
  successFlags: {
    legacyCommitTrustReturnsGone: true,
    otherLegacyCanonicalRoutesStillLive: true,
    v3CommitTrustUnaffected: true,
  },
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
