#!/usr/bin/env bash
set -euo pipefail

TARGET="src/pages/VouchEdgeLandingV3.tsx"

if [ ! -f "$TARGET" ]; then
  echo "Error: Run this script from the vouchres root directory."
  exit 1
fi

echo "Restoring clean scrolling on VouchEdge landing page..."

# Check out the stable version of VouchEdgeLandingV3 prior to scroll-hijacking commits
git checkout 525ad92a -- "$TARGET"

echo "Verifying TypeScript integrity..."
npx tsc --noEmit

echo "✅ Landing page scrolling successfully restored to native spring-smoothed flow!"
