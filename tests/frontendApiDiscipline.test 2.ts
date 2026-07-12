import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = join(process.cwd(), 'src');

/** Canonical fetch wrappers — raw fetch is expected here. */
const INFRA_ALLOWLIST = new Set([
  'lib/apiClient.ts',
  'api/safeApiClient.ts',
  'api/vouchedgeApi.ts',
  'lib/clientApiCache.ts',
]);

/** Known legacy call sites pending migration to apiClient. */
const LEGACY_ALLOWLIST = new Set<string>([]);

const RAW_API_FETCH = /fetch\s*\(/;
const BACKEND_API_HINT = /apiUrl\s*\(|['"`]\/api\//;

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

function isAllowlisted(relativePath: string): boolean {
  return INFRA_ALLOWLIST.has(relativePath) || LEGACY_ALLOWLIST.has(relativePath);
}

function findRawApiFetchViolations(): string[] {
  const violations: string[] = [];

  for (const filePath of listSourceFiles(SRC_ROOT)) {
    const relativePath = relative(SRC_ROOT, filePath);
    if (isAllowlisted(relativePath)) continue;

    const lines = readFileSync(filePath, 'utf8').split('\n');

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!RAW_API_FETCH.test(line)) continue;
      if (/\.\s*refetch\s*\(/.test(line) || /Query\.refetch/.test(line)) continue;
      if (!BACKEND_API_HINT.test(line)) continue;

      violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
    }
  }

  return violations;
}

describe('frontend API discipline guard', () => {
  it('does not introduce new raw fetch() to /api/ outside the allowlist', () => {
    const violations = findRawApiFetchViolations();
    expect(
      violations,
      violations.length
        ? `Use apiClient instead of raw fetch for backend /api/ calls:\n${violations.join('\n')}`
        : undefined,
    ).toEqual([]);
  });
});
