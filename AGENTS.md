# VouchEdge AI Operating Manual

> Read this file before making any code changes.

## Governing Documentation

Read these documents in order:

1. constitution/CONSTITUTION.md
2. constitution/ARCHITECTURE.md
3. constitution/RESOLUTION_CONTRACT_STANDARD.md

These documents govern product truth, system authority, the Trust Ledger, and
market resolution. When any other repository document conflicts with them, the
documents above win.

For Aurora implementation and UI work, continue with:

4. aurora/CONSTITUTION.md
5. aurora/ARCHITECTURE.md
6. aurora/DESIGN.md
7. aurora/COMPONENTS.md
8. aurora/MOTION.md
9. aurora/TOKENS.md
10. aurora/QUALITY.md

## Authority Chain

Governance → Resolution Contracts → Resolution Engine → Trust Ledger →
Calibration → Trust.

Aurora is a replaceable reasoning engine below the Trust Ledger. It may record
one complete decision event, but it may never amend that decision or read raw
Layer 1 events.

## Project Mission

VouchEdge is a premium sports intelligence platform.

We optimize for:

- Trust
- Speed
- Clarity
- Confidence

Never optimize for visual novelty at the expense of usability.

## Before Writing Code

Always:

- Understand the existing architecture.
- Reuse existing systems.
- Explain architectural impact.
- Prefer composition over duplication.
- Leave the repository better than you found it.

## Code Standards

- TypeScript strict.
- No duplicated business logic.
- Mobile-first.
- Strong typing.
- Canonical data flow.
- Performance by default.

## Validation

Before considering work complete:

- Run typecheck.
- Run the relevant tests.
- Verify the UI manually if applicable.
- Check for regressions.
- Summarize what changed and why.
