#!/bin/bash
set -e

OUT_DIR="_gemini_upload"
ZIP_NAME="vouchedge_gemini_code_review.zip"

echo "🧹 Cleaning old Gemini package..."
rm -rf "$OUT_DIR" "$ZIP_NAME"

mkdir -p "$OUT_DIR"

echo "📦 Copying code-only files..."

# Main app/backend code
rsync -av \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.vercel' \
  --exclude='.next' \
  --exclude='_code_backups' \
  --exclude='_gemini_upload' \
  --exclude='*.zip' \
  --exclude='*.png' \
  --exclude='*.jpg' \
  --exclude='*.jpeg' \
  --exclude='*.webp' \
  --exclude='*.gif' \
  --exclude='*.mp4' \
  --exclude='*.mov' \
  --exclude='*.log' \
  --exclude='*.DS_Store' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.*' \
  --exclude='src/**/*.before*.tsx' \
  --exclude='src/**/*.backup*.tsx' \
  --exclude='src/**/*.before*.ts' \
  --exclude='src/**/*.backup*.ts' \
  src server scripts public package.json package-lock.json tsconfig*.json vite.config.ts tailwind.config.* postcss.config.* server.ts \
  "$OUT_DIR/" 2>/dev/null || true

echo "📝 Creating AI instructions..."

cat > "$OUT_DIR/GOOGLE_AI_STUDIO_README.md" <<'README'
# VouchEdge / Vouchres Code Review Package

You are reviewing a Vite React TypeScript + Express + Supabase SaaS app.

## Current major goal

Fix and stabilize the app so pages load fully, stick, and do not disappear.

## Important current architecture

- `src/App.tsx` controls routing/state with `activeSection`.
- `src/components/theEdge/TheEdgeShell.tsx` controls The Edge / Welcome / Island experience.
- `src/components/theEdge/TheEdgeOverlay.tsx` controls the floating The Edge/Home button.
- `server/routes/parlayRoutes.ts` has backend routes including:
  - `/api/me/ledger`
  - `/api/me/dashboard-summary`
  - `/api/me/parlays`
- `src/components/ResultsPage.tsx` now has a backend ledger panel using `/api/me/ledger`.
- The Island dashboard should use `/api/me/dashboard-summary`.

## Bug we are fighting

Pages sometimes load then disappear or reset.

Recent clues:
- Vite was watching backup files like `_code_backups/*.tsx`.
- We need Vite to ignore backups.
- We need route state to persist.
- We need auth guard to protect member pages but allow safe public preview pages.
- We need buttons like Explore Site / Preview Site to actually enter public preview pages.

## Desired behavior

Logged out:
- The Edge / Welcome landing page is public.
- Safe preview pages can be viewed:
  - feed/home
  - daily_players
  - live_games
  - hr_board
  - game_research
  - player_research
- Member/account pages require login:
  - profile
  - results
  - notifications
  - parlay_lab
  - my_parlays
  - billing
  - admin

Logged in:
- The Edge becomes The Island dashboard.
- The Island dashboard uses `/api/me/dashboard-summary`.
- Results uses `/api/me/ledger`.
- Account stats must come from Supabase/backend only, not old local/demo stats.

## What to inspect

1. `vite.config.ts`
   - Ensure `_code_backups`, backup files, and before files are ignored by Vite watcher.

2. `src/App.tsx`
   - Check `activeSection`.
   - Check initial route.
   - Check `navigateSection`.
   - Check `PUBLIC_SECTIONS`, `PROTECTED_SECTIONS`, `STICKY_PUBLIC_SECTIONS`.
   - Find redirect loops or state resets.

3. `src/components/theEdge/TheEdgeShell.tsx`
   - Check the layer flow.
   - Check buttons call the right `onSectionChange`.
   - Check logged-in stats do not use local fallback.

4. `src/components/theEdge/TheEdgeOverlay.tsx`
   - Check The Edge/Home switch behavior.

5. `src/components/ResultsPage.tsx`
   - Check `/api/me/ledger` usage.

6. `server/routes/parlayRoutes.ts`
   - Check `/api/me/ledger` and `/api/me/dashboard-summary`.

## Rules

- Do not redesign the whole app.
- Do not create a new landing page.
- Do not delete features.
- Give minimal exact patches.
- Keep build passing.
- Keep The Edge as the product portal.
- Keep backend-protected member pages.
- Do not expose `.env` secrets.
README

echo "📊 Size before zip:"
du -sh "$OUT_DIR"

echo "🗜️ Zipping..."
zip -qr "$ZIP_NAME" "$OUT_DIR"

echo ""
echo "✅ Created: $ZIP_NAME"
echo "📦 Zip size:"
ls -lh "$ZIP_NAME"
echo ""
echo "📁 Folder size:"
du -sh "$OUT_DIR"

SIZE_MB=$(du -m "$ZIP_NAME" | cut -f1)
if [ "$SIZE_MB" -gt 500 ]; then
  echo "❌ Zip is over 500MB. Need stronger exclusions."
  exit 1
fi

echo "✅ Under 500MB and ready for Google AI Studio."
