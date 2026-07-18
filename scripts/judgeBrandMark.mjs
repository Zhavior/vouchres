/**
 * Run the Brand Mark Judge panel against the shipping icon.
 * Usage: npx tsx scripts/judgeBrandMark.ts
 * (This .mjs wrapper prints a friendly summary via dynamic import of the TS service.)
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const result = spawnSync(
  'npx',
  ['tsx', resolve(process.cwd(), 'scripts/judgeBrandMark.ts')],
  { stdio: 'inherit', env: process.env },
);
process.exit(result.status ?? 1);
