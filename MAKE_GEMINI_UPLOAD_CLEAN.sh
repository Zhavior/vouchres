#!/bin/bash
set -e

OUT_DIR="_gemini_clean_upload"
ZIP_NAME="vouchedge_gemini_DEBUG_ONLY.zip"

rm -rf "$OUT_DIR" "$ZIP_NAME"
mkdir -p "$OUT_DIR"

rsync -av \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.vercel' \
  --exclude='_code_backups' \
  --exclude='_gemini_upload' \
  --exclude='_gemini_clean_upload' \
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
  --exclude='*.before*' \
  --exclude='*.backup*' \
  --exclude='*.save' \
  --exclude='* 2' \
  --exclude='* 3' \
  src server scripts public package.json package-lock.json tsconfig.json vite.config.ts server.ts \
  "$OUT_DIR/" 2>/dev/null || true

cat > "$OUT_DIR/GOOGLE_AI_STUDIO_README.md" <<'README'
# READ FIRST — VouchEdge Debug Only

This is NOT a request to design a new website.

VouchEdge is a sports research/proof SaaS app:
- MLB research
- parlay building
- HR board
- capper profiles
- proof ledger
- subscriber/capper system
- The Edge public portal
- The Island logged-in dashboard

## Current bug

Pages load, then disappear/reset.
Buttons sometimes enter the site then bounce back.
Vite was watching backup files and full-reloading.
Auth gate may be redirecting safe public pages.

## Your task

Audit the uploaded codebase and give exact minimal patches for:
1. `src/App.tsx`
2. `src/components/theEdge/TheEdgeShell.tsx`
3. `src/components/theEdge/TheEdgeOverlay.tsx`
4. `src/social/feed/HomeFeedLayout.tsx`
5. `vite.config.ts`

## Do not do this

- Do not redesign the site.
- Do not make a 4K video website.
- Do not invent a different business.
- Do not create new pages.
- Do not remove features.
- Do not rewrite the whole app.

## Desired behavior

Logged out:
- Welcome/The Edge is public.
- Safe preview pages can load.
- Profile, results, parlays, billing, admin require login.

Logged in:
- The Island dashboard loads.
- Dashboard stats come from `/api/me/dashboard-summary`.
- Results stats come from `/api/me/ledger`.

## Output required

Return:
1. Root cause
2. Exact file edits
3. Minimal code patches
4. Build-risk notes
README

zip -qr "$ZIP_NAME" "$OUT_DIR"

echo "✅ Created clean Gemini package:"
ls -lh "$ZIP_NAME"
du -sh "$OUT_DIR"
