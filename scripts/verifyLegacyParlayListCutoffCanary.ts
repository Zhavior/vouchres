import { runLegacyParlayCutoffCanary } from "./runLegacyParlayCutoffCanary";

runLegacyParlayCutoffCanary({
  disabledLabel: "legacy.parlay.list",
  legacyDisabledPath: "/api/me/parlays",
  legacyStillLivePath: "/api/parlays/test-id",
  v3UnaffectedPath: "/api/v3/me/parlays",
  mode: "legacy_parlay_list_cutoff_canary",
  successFlags: {
    legacyListReturnsGone: true,
    otherLegacyCanonicalRoutesStillLive: true,
    v3ListUnaffected: true,
  },
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
