import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const AURORA_MIGRATION_STATUSES = [
  'legacy',
  'mapped',
  'migrating',
  'aurora-compliant',
  'deprecated',
  'removed',
] as const;

type AuroraMigrationStatus = typeof AURORA_MIGRATION_STATUSES[number];

interface MigrationEntry {
  flow: string;
  path: string;
  status: AuroraMigrationStatus | string;
  decision: string;
  primaryAction: string;
}

interface MigrationManifest {
  version: number;
  allowedStatuses: string[];
  entries: MigrationEntry[];
}

export interface LegacyImporterComparison {
  newImporters: string[];
  staleBaseline: string[];
}

export interface AuroraValidationResult {
  ok: boolean;
  issues: string[];
  metrics: {
    trackedFlows: number;
    compliantFlows: number;
    z8Importers: number;
  };
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const Z8_TOKEN_IMPORT = /(?:from\s*|import\s*\(|require\s*\()['"`][^'"`]*z8Tokens['"`]/;
const REQUIRED_DOCUMENTS = [
  'aurora/CONSTITUTION.md',
  'aurora/ARCHITECTURE.md',
  'aurora/DESIGN.md',
  'aurora/COMPONENTS.md',
  'aurora/MOTION.md',
  'aurora/TOKENS.md',
  'aurora/QUALITY.md',
  'aurora/MIGRATION.md',
] as const;
const REQUIRED_TOKEN_SOURCES = [
  'src/styles/vouchedge-tokens.css',
  'src/theme/auroraTokens.ts',
  'src/theme/z8Tokens.ts',
] as const;

function extension(path: string): string {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? '';
}

function listSourceFiles(root: string): string[] {
  return execFileSync('git', ['-C', root, 'ls-files', '-z', '--', 'src'], { encoding: 'utf8' })
    .split('\0')
    .filter((path) => path && SOURCE_EXTENSIONS.has(extension(path)));
}

function readLines(path: string): string[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findZ8Importers(root: string): string[] {
  return listSourceFiles(root)
    .filter((path) => Z8_TOKEN_IMPORT.test(readFileSync(join(root, path), 'utf8')))
    .sort();
}

export function compareLegacyImporters(
  actualImporters: readonly string[],
  baselineImporters: readonly string[],
): LegacyImporterComparison {
  const actual = new Set(actualImporters);
  const baseline = new Set(baselineImporters);

  return {
    newImporters: [...actual].filter((path) => !baseline.has(path)).sort(),
    staleBaseline: [...baseline].filter((path) => !actual.has(path)).sort(),
  };
}

function validateManifest(root: string, manifest: MigrationManifest, z8Importers: Set<string>): string[] {
  const issues: string[] = [];
  const allowedStatuses = new Set(AURORA_MIGRATION_STATUSES);
  const manifestStatuses = [...manifest.allowedStatuses].sort();
  const canonicalStatuses = [...AURORA_MIGRATION_STATUSES].sort();

  if (manifest.version !== 1) issues.push(`migration manifest version must be 1; received ${manifest.version}`);
  if (JSON.stringify(manifestStatuses) !== JSON.stringify(canonicalStatuses)) {
    issues.push('migration manifest allowedStatuses must match the canonical Aurora statuses');
  }

  const seenPaths = new Set<string>();
  for (const entry of manifest.entries) {
    if (seenPaths.has(entry.path)) issues.push(`duplicate migration path: ${entry.path}`);
    seenPaths.add(entry.path);

    if (!allowedStatuses.has(entry.status as AuroraMigrationStatus)) {
      issues.push(`invalid migration status for ${entry.path}: ${entry.status}`);
    }
    if (!entry.flow.trim()) issues.push(`missing flow name for ${entry.path}`);
    if (!entry.decision.trim()) issues.push(`missing supported decision for ${entry.path}`);
    if (!entry.primaryAction.trim()) issues.push(`missing primary action for ${entry.path}`);

    const absolutePath = resolve(root, entry.path);
    if (entry.status === 'removed') {
      if (existsSync(absolutePath)) issues.push(`removed migration entry still exists: ${entry.path}`);
      continue;
    }
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      issues.push(`tracked migration file is missing: ${entry.path}`);
      continue;
    }
    if (entry.status === 'aurora-compliant' && z8Importers.has(entry.path)) {
      issues.push(`Aurora-compliant file imports z8Tokens: ${entry.path}`);
    }
  }

  return issues;
}

export function validateAurora(root = process.cwd()): AuroraValidationResult {
  const issues: string[] = [];
  const baselinePath = join(root, 'aurora/z8-import-baseline.txt');
  const manifestPath = join(root, 'aurora/migration-manifest.json');

  for (const path of [...REQUIRED_DOCUMENTS, ...REQUIRED_TOKEN_SOURCES]) {
    if (!existsSync(join(root, path))) issues.push(`required Aurora foundation file is missing: ${path}`);
  }
  if (!existsSync(baselinePath)) issues.push('required Aurora Z8 import baseline is missing');
  if (!existsSync(manifestPath)) issues.push('required Aurora migration manifest is missing');

  if (!existsSync(baselinePath) || !existsSync(manifestPath)) {
    return { ok: false, issues, metrics: { trackedFlows: 0, compliantFlows: 0, z8Importers: 0 } };
  }

  const baseline = readLines(baselinePath);
  const sortedBaseline = [...baseline].sort();
  if (new Set(baseline).size !== baseline.length) issues.push('Z8 import baseline contains duplicate paths');
  if (JSON.stringify(baseline) !== JSON.stringify(sortedBaseline)) issues.push('Z8 import baseline must stay sorted');

  const actualImporters = findZ8Importers(root);
  const comparison = compareLegacyImporters(actualImporters, baseline);
  for (const path of comparison.newImporters) issues.push(`new Z8 token importer is not allowed: ${path}`);
  for (const path of comparison.staleBaseline) issues.push(`stale Z8 baseline entry must be removed: ${path}`);

  let manifest: MigrationManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as MigrationManifest;
  } catch (error) {
    issues.push(`migration manifest is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return {
      ok: false,
      issues,
      metrics: { trackedFlows: 0, compliantFlows: 0, z8Importers: actualImporters.length },
    };
  }

  issues.push(...validateManifest(root, manifest, new Set(actualImporters)));

  return {
    ok: issues.length === 0,
    issues,
    metrics: {
      trackedFlows: manifest.entries.length,
      compliantFlows: manifest.entries.filter((entry) => entry.status === 'aurora-compliant').length,
      z8Importers: actualImporters.length,
    },
  };
}
