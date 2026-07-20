# V3 Pre-Cutover Backup

Date: 2026-07-20

This backup captures the replacement backend work before legacy cutover.

## Base repo state

- Base commit: `cbd1942dd985f2bf038345d32c21143711f4f640`
- Repo path: `/Users/boydsantos/Desktop/Projects/Vouch/vouchres`

## What is included

- `base-commit.txt`
  - the commit this backup was made from
- `git-status.txt`
  - the exact working tree status at backup time
- `tracked-changes.patch`
  - patch for tracked file changes
- `v3-replacement-files.tar.gz`
  - archive containing the replacement backend files and architecture docs

## Files captured in the archive

- `package.json`
- `server/services/persistence/pickService.ts`
- `docs/architecture/VOUCHRES_BACKEND_94_PLUS_MATRIX.md`
- `docs/architecture/VOUCHRES_BACKEND_ARCHITECTURE_V2.md`
- `server/v3/`

## Why this exists

This is the backup point after the replacement backend gained:

- V3 bootstrap and app shell
- V3 system self-healing module
- V3 trust routes
- V3 grading routes
- V3 billing mount
- V3 user parlay ownership mount

## Restore idea

If we need to restore this work onto the base commit:

1. Reset the repo to the base commit or check out that commit on a new branch.
2. Extract `v3-replacement-files.tar.gz` at the repo root.
3. Apply `tracked-changes.patch` if needed for tracked diffs.
4. Compare with `git-status.txt` to confirm the expected restored state.

## Safety note

Legacy backend ownership still exists at backup time. This is a migration
checkpoint, not a cutover checkpoint.
