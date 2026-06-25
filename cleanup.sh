#!/usr/bin/env bash
# cleanup.sh — run from project root to delete dead weight from the repo.
#
# What this removes:
#   1. server_BACKUP_BEFORE_MLB_ROUTES.ts — the safety-net snapshot of the
#      pre-refactor server.ts. Should not be in version control.
#   2. Duplicate asset files (manifest 2.json, vouchedge-icon 2.svg).
#   3. The dead compat MLB routes inside server.ts (lines 757-1152) — they
#      bypass the new server/routes/mlbRoutes.ts in production.
#   4. The AI Studio landing page (AisLandingPage.tsx, 1,583 lines) if you're
#      not using it as your actual splash. (Optional — comment out to keep.)
#   5. The V226L_TWITTER_STYLE_VOUCHEDGE_HOME_FEED_REPORT.md dev report.
#
# Run this AFTER committing the current state, so you can `git revert` if needed.

set -e

echo "== VouchEdge cleanup == "

if [ ! -f "package.json" ]; then
  echo "ERROR: Run this from the project root (where package.json lives)."
  exit 1
fi

# 1. Delete the backup server file
if [ -f "server_BACKUP_BEFORE_MLB_ROUTES.ts" ]; then
  echo "[-] Removing server_BACKUP_BEFORE_MLB_ROUTES.ts"
  rm server_BACKUP_BEFORE_MLB_ROUTES.ts
fi

# 2. Delete duplicate assets (macOS "Copy" artifacts)
for dup in "public/manifest 2.json" "public/vouchedge-icon 2.svg"; do
  if [ -f "$dup" ]; then
    echo "[-] Removing duplicate: $dup"
    rm "$dup"
  fi
done

# 3. Delete the dev report
if [ -f "V226L_TWITTER_STYLE_VOUCHEDGE_HOME_FEED_REPORT.md" ]; then
  echo "[-] Removing dev report V226L_TWITTER_STYLE_VOUCHEDGE_HOME_FEED_REPORT.md"
  rm V226L_TWITTER_STYLE_VOUCHEDGE_HOME_FEED_REPORT.md
fi

# 4. (Optional) Delete the AI Studio landing page if you have a real splash
# Uncomment if you're sure:
# if [ -f "src/components/AisLandingPage.tsx" ]; then
#   echo "[-] Removing AisLandingPage.tsx (AI Studio splash)"
#   rm src/components/AisLandingPage.tsx
# fi

# 5. Update branding (require sed; manual review recommended)
echo "[*] Updating index.html title"
# Replace "My Google AI Studio App" with "VouchEdge — MLB Picks & Intelligence"
if command -v sed >/dev/null 2>&1; then
  if grep -q "My Google AI Studio App" index.html; then
    # -i behavior differs on macOS vs Linux; use a portable approach
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' 's|My Google AI Studio App|VouchEdge — MLB Picks \& Intelligence|g' index.html
    else
      sed -i 's|My Google AI Studio App|VouchEdge — MLB Picks \& Intelligence|g' index.html
    fi
    echo "    ✓ index.html title updated"
  else
    echo "    (title already updated)"
  fi
else
  echo "    ! sed not found — manually edit index.html line 6"
fi

echo "[*] Updating package.json name"
if command -v sed >/dev/null 2>&1; then
  if grep -q '"name": "react-example"' package.json; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' 's|"name": "react-example"|"name": "vouchedge"|' package.json
    else
      sed -i 's|"name": "react-example"|"name": "vouchedge"|' package.json
    fi
    echo "    ✓ package.json name updated"
  else
    echo "    (name already updated)"
  fi
fi

# 6. Verify the dead compat MLB routes are still in server.ts
if [ -f "server.ts" ] && grep -q "VOUCHEDGE COMPAT MLB ROUTES" server.ts; then
  echo
  echo "[!] server.ts still contains the dead 'VOUCHEDGE COMPAT MLB ROUTES' block."
  echo "    This block (around lines 757-1152 in the production else-branch)"
  echo "    duplicates the real routes in server/routes/mlbRoutes.ts and"
  echo "    bypasses the intelligence engines in production."
  echo
  echo "    MANUAL ACTION REQUIRED:"
  echo "    Open server.ts, find the line:"
  echo "      // === VOUCHEDGE COMPAT MLB ROUTES ==="
  echo "    Delete from that line through the matching '});' that closes the block."
  echo "    Then run: npm run lint && npm run dev"
  echo "    Verify /api/mlb/games/today still works."
fi

echo
echo "== Cleanup done. Review with: git diff =="
echo "== Then commit: git add -A && git commit -m 'chore: remove dead weight, fix branding' =="
