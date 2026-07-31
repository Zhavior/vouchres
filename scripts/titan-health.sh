#!/usr/bin/env bash
set -e

echo
echo "VOUCHEDGE TITAN HEALTH"
echo

echo "Git branch:"
git branch --show-current
echo

echo "Git status:"
git status --short
echo

echo "TypeScript:"
npm run typecheck
echo

echo "Production build:"
npm run build
echo

echo "TITAN STATUS GREEN"
