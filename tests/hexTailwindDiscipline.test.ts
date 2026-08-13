import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Audited baseline after the Aurora landing and HR workspace migration.
 * The scan uses Git-tracked sources so local backup files cannot change CI.
 */
const ALLOWED_BG_HEX_ARBITRARY_COUNT = 142;

const BG_HEX_ARBITRARY = /bg-\[#/g;

function listTrackedSourceFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z', '--', 'src'], { encoding: 'utf8' })
    .split('\0')
    .filter((path) => path.endsWith('.ts') || path.endsWith('.tsx'));
}

function countBgHexArbitrary(): number {
  let total = 0;

  for (const filePath of listTrackedSourceFiles()) {
    const content = readFileSync(filePath, 'utf8');
    const matches = content.match(BG_HEX_ARBITRARY);
    if (matches) total += matches.length;
  }

  return total;
}

describe('hex Tailwind discipline guard', () => {
  it('does not introduce new bg-[# arbitrary hex classes in src', () => {
    const count = countBgHexArbitrary();
    expect(
      count,
      count > ALLOWED_BG_HEX_ARBITRARY_COUNT
        ? `Found ${count} bg-[# usages (baseline ${ALLOWED_BG_HEX_ARBITRARY_COUNT}). Use ve-* tokens instead.`
        : undefined,
    ).toBeLessThanOrEqual(ALLOWED_BG_HEX_ARBITRARY_COUNT);
  });
});
