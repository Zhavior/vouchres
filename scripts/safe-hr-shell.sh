#!/bin/zsh

set -e

echo "=== Safe HR shell ==="
echo "Working dir: $(pwd)"

# Never touch canonical HR files
echo "Leaving src/features/hr, src/lib/hr, src/models/HrPlayer.ts alone."

# Clean only Gemini workspaces, if they exist
if [ -d "geminiupload" ]; then
  echo "Cleaning geminiupload…"
  rm -rf geminiupload
fi

if [ -d "geminicleanupload" ]; then
  echo "Cleaning geminicleanupload…"
  rm -rf geminicleanupload
fi

echo "Starting dev server…"
npm run dev
