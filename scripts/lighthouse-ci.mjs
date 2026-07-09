#!/usr/bin/env node
/**
 * Lighthouse CI stub — documents manual / optional CI performance audit.
 *
 * Quick bundle gate (no browser):
 *   npm run build && npm run perf-check
 *
 * Full Lighthouse (local):
 *   npm run build && npm run preview
 *   npx lighthouse http://localhost:4173 --only-categories=performance --quiet
 *
 * Optional @lhci/cli autorun (requires lighthouserc.js):
 *   npm i -D @lhci/cli
 *   npm run preview &
 *   npx lhci autorun
 *
 * Staging soak strict (no MLB upstream required):
 *   BASE_URL=https://staging.example npm run staging-soak:strict
 *   Requires GitHub Actions secret STAGING_BASE_URL when run against real staging.
 */
console.log("[lighthouse-ci] stub — use npm run perf-check for CI bundle/CSS gates");
console.log("[lighthouse-ci] manual: npm run preview && npx lighthouse http://localhost:4173 --only-categories=performance");
process.exit(0);
