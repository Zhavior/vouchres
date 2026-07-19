# Archived Next.js apps (do not deploy for API truth)

**Update 2026-07-19:** both directories below have been physically moved out
of the working tree to `~/Desktop/Projects/Vouch/vouchres-archive-2026-07-19/`
as part of repository hygiene (see that archive's `ARCHIVE_MANIFEST.md`). The
Z8 Obsidian design tokens they originated were already ported into
`src/styles/z8-design-system.css` before the move. This doc is kept for
historical context and as the restoration record.

The production VouchEdge app is the **Vite React + Express** stack at the repo root (`npm run dev`, `server/routes/*`).

These directories were **legacy / experimental Next.js shells** and must not be treated as canonical API hosts:

| Directory | Risk |
| --- | --- |
| `vouchedge/` (archived) | Duplicate `/app/api/mlb/*` routes that proxy or reimplement HR/live feeds — can drift from `server/routes` |
| `vouchedge-terminal/` (archived) | Same pattern — terminal UI + shadow API routes |

## Policy

1. **Do not deploy** either Next app as the primary backend for `/api/mlb/*`.
2. Canonical MLB/HR endpoints live under `server/routes/` (registered via `registerApiRoutes`).
3. If you need a separate frontend CDN, point `VITE_API_BASE_URL` at the Render/Express API (see `docs/PRODUCTION_HOSTING.md`).
4. Changes to HR honesty, validation, or board contracts must land in `server/` — not the Next `app/api` copies.

## Safe use

- Reference-only UI experiments
- Local prototyping with explicit `VITE_API_BASE_URL` aimed at the Express server

To retire completely: archive the folders or delete after confirming no CI job builds them.
