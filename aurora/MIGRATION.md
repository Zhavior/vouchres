# Aurora Migration Standard

Aurora migration is a controlled product change, not a rename or restyle.

## Statuses

- `legacy`: not mapped to Aurora yet.
- `mapped`: legacy behavior has a documented Aurora destination.
- `migrating`: a real flow is partially converted and legacy dependencies remain.
- `aurora-compliant`: the tracked file uses Aurora contracts and no Z8 token import.
- `deprecated`: replacement is verified and the legacy implementation must receive no new consumers.
- `removed`: the legacy implementation no longer exists.

The canonical tracked-flow registry is `aurora/migration-manifest.json`.

## Z8 ratchet

`aurora/z8-import-baseline.txt` lists every current source file that imports
`z8Tokens`. The baseline may only shrink. A new importer fails Aurora validation.
When a listed file migrates away from Z8, remove its baseline entry in the same
change. An `aurora-compliant` manifest entry can never appear in the baseline.

## Required screen record

Every tracked flow states:

1. the user decision it supports;
2. the primary action;
3. its current migration status.

Before changing a status to `aurora-compliant`, verify the decision hierarchy,
loading/error/empty/unavailable states, 390x844 behavior, desktop behavior,
keyboard and screen-reader semantics, relevant tests, strict lint, typecheck,
build, and performance impact.

## Commands

Run `npm run aurora:validate` locally. CI runs the same command and rejects:

- new or untracked Z8 token importers;
- stale baseline entries;
- duplicate or invalid manifest entries;
- missing tracked files;
- Aurora-compliant files that import Z8 tokens;
- missing canonical Aurora documents or token sources.

This gate does not claim that Z8 is removed. It makes migration progress
measurable and prevents new Z8 debt while existing flows are converted.
