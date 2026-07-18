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
- After this pass (code + tests green): **~58 / 100**
- Next to ~72: `npx cap add ios/android`, splash/icons, TestFlight + Play internal
- Next to ~82: store listings, counsel legal, IAP decision, reviewer demo

## Remaining before store submit

1. Install Capacitor packages and generate native projects (`npm run cap:sync` after build)
2. Configure real `VAPID_*` keys in production
3. Counsel review of ToS/Privacy
4. Screenshot + privacy nutrition / data safety forms
5. Subscription IAP vs Stripe decision for iOS
