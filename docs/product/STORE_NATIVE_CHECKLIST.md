# Native store packaging checklist

## Capacitor status

| Item | Status |
|------|--------|
| `capacitor.config.json` | Present (`app.vouchedge.mobile`) |
| `@capacitor/core` + `@capacitor/cli` | Installed |
| `@capacitor/android` + `android/` project | Scaffolded |
| `@capacitor/ios` + `ios/` project | Needs macOS + Xcode (`npm i @capacitor/ios && npx cap add ios`) |
| Web build synced into native shells | Run `npm run cap:sync` after `vite` build |

## Sync workflow

```bash
npm run build
npx cap sync
npx cap open android   # Android Studio
npx cap open ios       # Xcode (macOS)
```

## Store blockers still outside Capacitor

1. Production `VAPID_*` keys for push
2. Counsel-reviewed ToS / Privacy URLs on live domain
3. App icons (1024 / adaptive) + splash screens
4. Subscription IAP vs Stripe decision for iOS
5. Reviewer demo account + “research, not a sportsbook” review notes
6. Privacy Nutrition Labels / Play Data safety form

## Positioning (do not break)

VouchEdge is research + graded proof. Not a sportsbook. No deposit/wager CTAs in store listing or screenshots.
