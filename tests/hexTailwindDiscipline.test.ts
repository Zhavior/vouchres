import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = join(process.cwd(), 'src');

/** Baseline after 9.5 gap-close hex purge (was 482). */
const ALLOWED_BG_HEX_ARBITRARY_COUNT = 399;

const BG_HEX_ARBITRARY = /bg-\[#/g;

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }
    if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function countBgHexArbitrary(): number {
  let total = 0;

  for (const filePath of listSourceFiles(SRC_ROOT)) {
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
