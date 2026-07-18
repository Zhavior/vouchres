# Mobile P0 execution log

**Branch intent:** raise store-readiness from ~42 → ~58 via shippable product code (not docs alone).

## Shipped in this pass

| Item | Status | Proof |
|------|--------|-------|
| Judge Home mobile surface (`judge_home`) | Done | Page + dock tab + router + tests |
| Dock labels (Home / Judges / Board / Today / Menu) | Done | `AppNav` + dock test |
| Push client subscribe/unsubscribe | Done | `src/lib/pushNotifications.ts` + Settings toggle |
| VAPID public key API | Done | `GET /api/notifications/push/vapid-public-key` |
| LegalGate + CookieConsent mounted | Done | `LegalComplianceHost` in `AppShell` |
| LegalGate `US-XX` jurisdiction bugfix | Done | `jurisdictionLooksPermitted` |
| HR Signal Field mobile width | Done | responsive `min-w` |
| Capacitor config scaffold | Done | `capacitor.config.ts` + npm scripts |

## Score movement (estimate)

- Before P0 execute: **42 / 100**
- After first P0 code pass: **~58 / 100**
- After screenshot-driven mobile UI pass (routing + Judge Home + FAB + empty states): **~64 / 100**
- After Board/Settings/Menu polish + Capacitor deps: **~68 / 100**
- After Android scaffold + Board compact chrome: **~72 / 100**
- Next to ~82: iOS project (macOS), splash/icons, TestFlight + Play internal, counsel legal, IAP decision
- Next to ~88–92: store submit + habit loops (push alerts, widgets)

## Screenshot QA loop

Artifacts: `/opt/cursor/artifacts/screenshots/v4-*.png`

| Shot | Finding → fix |
|------|----------------|
| v1 judge-home showed HR Board | Deep-link routing missing → `resolveDevSectionFromLocation` + `sectionToPath` |
| Wide ParlayOS pill covered copy | Icon-only FAB on phone; raise above labeled dock |
| Judge chips scrolled off-screen | 4-up code grid (DS/PH/MR/RA) always visible |
| Empty feed dead-end | CTAs → Judge Home / Today / HR Board |
| Board dense desktop chrome | Compact title; hide zoom on phone; sticky publish bar above dock |
| Settings Privacy tab clipped | 2×2 tab grid + Alerts/Privacy short labels |
| Menu missing Judges | Shortcuts group with Judge Home / HR / Board / Feed |
| Capacitor | `@capacitor/core` + `@capacitor/cli` installed; `capacitor.config.json` ready |

## Remaining before store submit

1. Install Capacitor packages and generate native projects (`npm run cap:sync` after build)
2. Configure real `VAPID_*` keys in production
3. Counsel review of ToS/Privacy
4. Screenshot + privacy nutrition / data safety forms
5. Subscription IAP vs Stripe decision for iOS
