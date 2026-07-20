import { runLegacyParlayCutoffCanary } from "./runLegacyParlayCutoffCanary";

runLegacyParlayCutoffCanary({
  disabledLabel: "legacy.parlay.save",
  legacyDisabledPath: "/api/parlays/save",
  legacyStillLivePath: "/api/me/parlays",
  v3UnaffectedPath: "/api/v3/parlays/save",
  legacyDisabledMethod: "POST",
  v3UnaffectedMethod: "POST",
  mode: "legacy_parlay_save_cutoff_canary",
  successFlags: {
    legacySaveReturnsGone: true,
    otherLegacyCanonicalRoutesStillLive: true,
    v3SaveUnaffected: true,
  },
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
