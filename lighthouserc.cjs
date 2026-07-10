/** @type {import('@lhci/cli').Config}
 *
 * Perf floor aligns with scripts/lighthouse-ci.mjs (default 0.58).
 * Bundle/CSS gzip budgets live in scripts/perf-check.mjs (88 KiB CSS, 130 KiB JS).
 * Enable strict mode in CI: LIGHTHOUSE_STRICT=1 npm run lighthouse-ci
 */
module.exports = {
  ci: {
    collect: {
      url: [process.env.LIGHTHOUSE_URL || "http://127.0.0.1:4173"],
      numberOfRuns: 1,
      settings: {
        onlyCategories: ["performance"],
        chromeFlags: "--headless --no-sandbox --disable-gpu",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: Number(process.env.LIGHTHOUSE_PERF_MIN ?? 0.58) }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
