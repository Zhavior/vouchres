Post-local-cutover backup for the V3 parlay replacement.

What this snapshot captures
- Current base commit for the workspace at backup time.
- Current `git status --short`.
- A tracked patch covering the V3 replacement work and rollout docs.
- A tarball of the core replacement files and rollout scripts.
- The safe local parlay route cutoff labels only.

What this snapshot does not capture
- Full `.env.local` contents.
- Any secrets, tokens, or private keys.

Reason
- The pre-cutover backup preserves the old motherboard.
- This post-cutover backup preserves the new motherboard after the local replacement was proven.

Key local result at backup time
- All 5 canonical legacy parlay routes were disabled locally through the route-scoped kill switch.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run verify:v3-backend` passed.
