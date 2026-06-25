#!/usr/bin/env bash
# apply-patches.sh — copy all patch-kit files into your VouchEdge repo.
#
# Run from the project ROOT (where package.json lives).
# Argument: path to the patch kit (default: ./download/vouchedge-beta-patches)
#
# What this does:
#   1. Copies every .ts file from server/ and src/ into the matching path
#   2. Renames *.replacement files to their target name (strips .replacement)
#   3. Copies .env.example, render.yaml, vitest.config.ts, etc. to root
#   4. Copies supabase/schema.sql to supabase/migrations/0001_init.sql
#   5. Copies tests/ to tests/
#   6. Copies legal/ to legal/
#   7. Copies .github/workflows/test.yml to .github/workflows/test.yml
#   8. Prints a checklist of manual patches still needed
#
# This does NOT:
#   - Apply .patch.md diffs (those need manual review)
#   - Install dependencies (run `npm install` yourself after)
#   - Run the cleanup script (run `bash cleanup.sh` separately)
#   - Migrate existing data (this is a fresh install)
#
# Idempotent: re-running overwrites existing files. Safe to re-run after
# pulling patch-kit updates.

set -e

PATCH_KIT="${1:-./download/vouchedge-beta-patches}"

if [ ! -d "$PATCH_KIT" ]; then
  echo "ERROR: Patch kit not found at $PATCH_KIT"
  echo "Usage: bash apply-patches.sh [path-to-patch-kit]"
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "ERROR: Run this from the project root (where package.json lives)."
  exit 1
fi

echo "== VouchEdge patch application =="
echo "Source: $PATCH_KIT"
echo "Target: $(pwd)"
echo

# 1. Server-side files
echo "[1/8] Copying server files..."
mkdir -p server/middleware server/routes server/services/billing \
         server/services/persistence server/services/grading \
         server/lib server/cron
cp -v "$PATCH_KIT/server/middleware/"*.ts server/middleware/
cp -v "$PATCH_KIT/server/routes/"*.ts server/routes/
# .replacement files — strip the suffix
for f in "$PATCH_KIT/server/routes/"*.replacement; do
  if [ -f "$f" ]; then
    target="server/routes/$(basename "$f" .replacement)"
    cp -v "$f" "$target"
  fi
done
cp -v "$PATCH_KIT/server/services/billing/"*.ts server/services/billing/
cp -v "$PATCH_KIT/server/services/persistence/"*.ts server/services/persistence/
cp -v "$PATCH_KIT/server/services/grading/"*.ts server/services/grading/
cp -v "$PATCH_KIT/server/lib/"*.ts server/lib/
cp -v "$PATCH_KIT/server/cron/"*.ts server/cron/

# 2. Frontend files
echo
echo "[2/8] Copying frontend files..."
mkdir -p src/lib src/components/auth src/components/legal src/components/admin
cp -v "$PATCH_KIT/src/lib/"*.ts src/lib/
cp -v "$PATCH_KIT/src/components/auth/"*.tsx src/components/auth/
cp -v "$PATCH_KIT/src/components/legal/"*.tsx src/components/legal/
cp -v "$PATCH_KIT/src/components/admin/"*.tsx src/components/admin/

# 3. Schema
echo
echo "[3/8] Copying Supabase schema..."
mkdir -p supabase/migrations
cp -v "$PATCH_KIT/supabase/schema.sql" supabase/migrations/0001_init.sql

# 4. Config files
echo
echo "[4/8] Copying config files..."
cp -v "$PATCH_KIT/.env.example" .env.example
cp -v "$PATCH_KIT/render.yaml" render.yaml
cp -v "$PATCH_KIT/vitest.config.ts" vitest.config.ts
cp -v "$PATCH_KIT/package.json.diff.txt" package.json.diff.txt

# 5. Tests
echo
echo "[5/8] Copying tests..."
mkdir -p tests
cp -v "$PATCH_KIT/tests/"*.ts tests/
cp -v "$PATCH_KIT/.env.test.example" .env.test.example

# 6. Legal
echo
echo "[6/8] Copying legal docs..."
mkdir -p legal
cp -v "$PATCH_KIT/legal/"*.md legal/

# 7. CI workflow
echo
echo "[7/8] Copying CI workflow..."
mkdir -p .github/workflows
cp -v "$PATCH_KIT/.github/workflows/test.yml" .github/workflows/test.yml

# 8. Patches (manual-apply instructions)
echo
echo "[8/8] Copying manual-patch instructions..."
mkdir -p patches
cp -v "$PATCH_KIT/patches/"*.md patches/
cp -v "$PATCH_KIT/patches/"*.replacement patches/ 2>/dev/null || true

# Copy cleanup script
cp -v "$PATCH_KIT/cleanup.sh" cleanup.sh
chmod +x cleanup.sh

# Copy README and IMPLEMENTATION
cp -v "$PATCH_KIT/README.md" PATCHES_README.md
cp -v "$PATCH_KIT/IMPLEMENTATION.md" IMPLEMENTATION.md

echo
echo "== Files copied. Next steps: =="
echo
echo "1. Install new dependencies:"
echo "   npm install @supabase/supabase-js stripe express-rate-limit cors helmet zod cookie-parser"
echo "   npm install -D @types/cors @types/cookie-parser vitest @vitest/coverage-v8"
echo "   npm install @sentry/react @sentry/node posthog-js   # optional but recommended"
echo
echo "2. Configure environment:"
echo "   cp .env.example .env.local"
echo "   # Edit .env.local with your Supabase URL, Stripe keys, etc."
echo
echo "3. Run cleanup to remove dead weight:"
echo "   bash cleanup.sh"
echo
echo "4. Apply manual patches (read each .md file before applying):"
echo "   ls patches/"
echo "   # Apply each .patch.md and .tsx.replacement as documented"
echo
echo "5. Set up Supabase:"
echo "   npm install -g supabase"
echo "   supabase login"
echo "   supabase link --project-ref YOUR_REF"
echo "   supabase db push"
echo "   supabase gen types typescript --project-id YOUR_REF > src/types/db.ts"
echo
echo "6. Update server.ts to wire in middleware (read server.ts.patch.md):"
echo "   # Add helmetMiddleware, corsMiddleware, globalLimiter before routes"
echo "   # Register /api/billing/webhook with express.raw() BEFORE express.json()"
echo
echo "7. Run type-check and dev server:"
echo "   npm run lint"
echo "   npm run dev"
echo
echo "8. Run tests (requires test Supabase project):"
echo "   cp .env.test.example .env.test.local"
echo "   # Edit .env.test.local"
echo "   npm test"
echo
echo "See IMPLEMENTATION.md for the full 3-week plan."
