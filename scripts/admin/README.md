# VouchEdge Admin Scripts

These scripts are for local/server-side maintenance only.

Rules:
- Never run these from the browser.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`.
- Prefer dry-run/probe scripts before mutation scripts.
- Mutation scripts must require an explicit `--execute` flag.
- Run only after verifying the target rows and customer impact.

Scripts:
- `fake_legacy_probe.mjs` checks for fake pending legacy `leg-*` / `ai-leg-*` rows.
- `repair_probe.mjs` inspects legacy repair status.
- `status_probe.mjs` checks parlay/pick-leg status truth.
- `void_fake_child_legs.mjs` voids fake pending child legs only when parent picks are already void; requires `--execute`.
