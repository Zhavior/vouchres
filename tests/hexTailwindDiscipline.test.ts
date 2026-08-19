import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const BG_HEX_ARBITRARY = /bg-\[#/g;

function listTrackedSourceFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z', '--', 'src'], {
    encoding: 'utf8',
  })
    .split('\0')
    .filter((path) => path.endsWith('.ts') || path.endsWith('.tsx'));
}

function countWorkingTreeBgHex(): number {
  return listTrackedSourceFiles().reduce((total, filePath) => {
    const content = readFileSync(filePath, 'utf8');
    return total + (content.match(BG_HEX_ARBITRARY)?.length ?? 0);
  }, 0);
}

function countHeadBgHex(): number {
  return listTrackedSourceFiles().reduce((total, filePath) => {
    try {
      const content = execFileSync(
        'git',
        ['show', `HEAD:${filePath}`],
        { encoding: 'utf8' },
      );

      return total + (content.match(BG_HEX_ARBITRARY)?.length ?? 0);
    } catch {
      // New file: it does not exist in HEAD.
      return total;
    }
  }, 0);
}

describe('hex Tailwind discipline guard', () => {
  it('does not introduce new bg-[# arbitrary hex classes in src', () => {
    const baseline = countHeadBgHex();
    const current = countWorkingTreeBgHex();

    expect(
      current,
      current > baseline
        ? `Found ${current} bg-[# usages; HEAD has ${baseline}. Use ve-* tokens instead.`
        : undefined,
    ).toBeLessThanOrEqual(baseline);
  });
});
