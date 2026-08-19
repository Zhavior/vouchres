import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const BG_HEX_ARBITRARY = /bg-\[#/g;

function listTrackedSourceFiles(): string[] {
  return execFileSync(
    'git',
    ['ls-files', '-z', '--', 'src'],
    {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    },
  )
    .split('\0')
    .filter(
      (path) => path.endsWith('.ts') || path.endsWith('.tsx'),
    );
}

function countWorkingTreeBgHex(files: string[]): number {
  let count = 0;

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    count += content.match(BG_HEX_ARBITRARY)?.length ?? 0;
  }

  return count;
}

function countHeadBgHex(): number {
  // Read the entire src tree from HEAD in one Git operation instead of
  // spawning `git show` once for every source file.
  const archive = execFileSync(
    'git',
    ['grep', '-I', '-o', 'bg-\\[\\#', 'HEAD', '--', 'src'],
    {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    },
  );

  return archive
    .split('\n')
    .filter(Boolean)
    .length;
}

describe('hex Tailwind discipline guard', () => {
  it('does not introduce new bg-[# arbitrary hex classes in src', () => {
    const files = listTrackedSourceFiles();
    const baseline = countHeadBgHex();
    const current = countWorkingTreeBgHex(files);

    expect(
      current,
      current > baseline
        ? `Found ${current} bg-[# usages; HEAD has ${baseline}. Use ve-* tokens instead.`
        : undefined,
    ).toBeLessThanOrEqual(baseline);
  });
});
