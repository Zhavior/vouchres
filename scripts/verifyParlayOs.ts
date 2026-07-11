/**
 * ParlayOS production smoke — runs trust-critical unit tests + state checks.
 * Use in CI before deploy: npm run verify:parlayos
 */
import { execSync } from "node:child_process";

const VITEST_FILES = [
  "tests/parlayOsState.test.ts",
  "tests/parlayOsLifecycle.test.ts",
  "tests/parlayTierOddsResolver.test.ts",
  "tests/parlayCustomLine.test.ts",
  "tests/parlayLegValidator.test.ts",
  "tests/slipOddsPolicy.test.ts",
  "tests/templateProgress.test.ts",
  "tests/parlayOddsFeedService.test.ts",
].join(" ");

console.log("[verify:parlayos] Running ParlayOS trust unit suite…");
execSync(`npx vitest run ${VITEST_FILES}`, { stdio: "inherit" });

console.log("[verify:parlayos] OK — ParlayOS trust gates passed.");
