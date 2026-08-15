# HR Max receipt export Implementation Plan

Status: WAITING_APPROVAL
Slug: 2026-08-14-hr-max-receipt-export
Repo: /Users/boydsantos/Desktop/Projects/Vouch/vouchres
Mode: FULL

This is **not** hr-max perf Phase 4 (virtualization). That plan remains blocked on confirm after save-state Phase 1.

## Goal
`Export receipts` on the live Command Desk downloads JSON + Markdown of the rows already on screen (starred set, else visible slate), with a SHA-256 **checksum** of the canonical JSON. Copy must not claim tamper-proof signatures, Statcast hashes, or a cryptographic audit the backend does not perform.

## Why the pasted spec is rejected as-written

| Pasted piece | Product truth |
|---|---|
| `'use server'` / `actions/exportReceipts.ts` | VouchEdge is Vite + `server.ts`, not Next.js App Router. No Server Actions. |
| `PlayerSignal` / `signalStore` / `EvidenceLayer` | Do not exist. Live type is `HrMaxDeskRow` from `useHrBoardViewModel` → `mapHrWatchToDeskRow`. |
| `SYSTEM_AUDIT_SALT` + “cryptographic signature” | SHA-256 of public fields plus a salt in source is a checksum, not a signature. Not tamper-proof. Shipping that label is a trust guarantee the product does not provide. |
| `statcastDataHash` from `id_score_lineup` | Not Statcast. L009 / L015: do not invent Statcast. |
| `ENGINE_VERSION = 'AURORA_MAX_HRPI_V2.4'` | Invented. `package.json` is `0.0.0`. |
| Quartet 1–3 (slip drawer, `/api/signals/stream`, Trust Ledger Brier panel) | Not in this repo. Advertising them is `KILL:ADVERTISED_UNBUILT`. |
| Slip-drawer export button | No research slip drawer on hr-max. Parlay add is `openParlayAdd`. |

## In scope (if approved)

- Pure serializer: `HrMaxDeskRow[]` → JSON string + Markdown string + hex checksum.
- Checksum: Web Crypto `SHA-256` of the UTF-8 JSON (same bytes as the `.json` file). Label: **integrity checksum**, never signature / proof / tamper-proof / Statcast.
- Schema version field: `hr-max-receipt-export/1` (export format, not an HRPI engine).
- Markdown dossier lists only mapped `HrMaxDeskRow` fields. Missing evidence / sources stay as the row already stores them (`receipt.missing`).
- Replace inline `exportReceipts` in `HrMaxDesk.tsx`. Same target rule: starred ids if any, else `visibleRows`.
- Download `.json` and `.md` via the existing blob + `revokeObjectURL` pattern.
- Unit tests for canonical JSON + checksum determinism (node `crypto.subtle` or `node:crypto`).
- Optional same helper for `AuroraHqDesk.tsx` if Boyd includes HQ in approval (duplicate exporter today).

## Out of scope

- Next.js Server Actions, `signalStore`, ResearchSlipDrawer, `/api/signals/stream`, `gradeSlatePicks`, HMAC secrets, keypair signatures.
- Invented Statcast / “5-layer evidence trees” that are not `row.evidence`.
- Perf Phase 2–4 (toolbar split already exists; virtualization not started).
- Changing data-fetching, polling, or API contracts.
- UI restyle beyond status text if we mention checksum (keep current “N receipts prepared”).

## Files

- `src/features/hr-max/exportDeskReceipts.ts` — serialize, checksum, markdown, trigger downloads
- `src/features/hr-max/components/HrMaxDesk.tsx` — call the helper from `handleExport`
- `tests/hrMaxReceiptExport.test.ts` — determinism + field mapping (no Statcast / signature strings)
- `src/features/aurora-hr-hq/components/AuroraHqDesk.tsx` — only if HQ is in the approve note

## Risks

- Calling a hash a signature in the file or UI → Architecture FAIL (`KILL:INVENTED_COPY`).
- Evidence `value` is `ReactNode`; export must stringify only `string` / number, else `null` (HQ already does this).
- Checksum is integrity of **this download**, not authenticity. Anyone can recompute it.

## Effort

Workers: 0
Iolaus: after diff (HR / Aurora copy)

## Phases

1. Serializer + checksum + markdown from `HrMaxDeskRow`
2. Wire `handleExport` on Command Desk
3. Tests + grep that export artifacts do not contain signature / tamper-proof / Statcast checksum copy

> [!IMPORTANT]
> **User Review Required**
>
> Reply **approve** (or lock it / go / execute) to start.
> Reply with changes to revise. I will not edit the product until you approve.
>
> If you want the pasted Next.js “cryptographic signature” copy anyway, say so explicitly — that is a product-truth override, not the default.
