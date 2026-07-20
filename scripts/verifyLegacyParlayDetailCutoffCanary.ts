import { runLegacyParlayCutoffCanary } from "./runLegacyParlayCutoffCanary";

runLegacyParlayCutoffCanary({
  disabledLabel: "legacy.parlay.detail",
  legacyDisabledPath: "/api/parlays/test-id",
  legacyStillLivePath: "/api/me/parlays",
  v3UnaffectedPath: "/api/v3/parlays/test-id",
  mode: "legacy_parlay_detail_cutoff_canary",
  successFlags: {
    legacyDetailReturnsGone: true,
    otherLegacyCanonicalRoutesStillLive: true,
    v3DetailUnaffected: true,
  },
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
