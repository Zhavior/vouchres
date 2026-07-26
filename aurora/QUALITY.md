# Aurora Quality Standard

## Definition of Done

Aurora work is complete only when it improves a real user decision and passes
the relevant evidence gates. A document, mockup, or renamed component is not an
implemented product improvement by itself.

## Product Gate

- The primary question and next action are obvious.
- Answer, reasons, evidence, and deep research appear in that order.
- Uncertainty, provenance, freshness, and blocked states are honest.
- No unsupported product signal or fabricated number is present.
- Beginners can act while experts can inspect deeper evidence.

## Interaction Gate

- Keyboard navigation and visible focus work.
- Screen-reader names and landmarks are meaningful.
- Touch targets meet the mobile contract.
- Loading, empty, error, stale, unavailable, and success states are handled.
- Reduced motion preserves all meaning.

## Responsive Gate

- Verify the critical journey at 390×844.
- Verify a desktop layout appropriate to the feature.
- No unintended horizontal overflow or clipped primary action.
- Dense data has a deliberate narrow-screen treatment.

## Engineering Gate

- Strong TypeScript types and canonical data flow.
- Business rules remain outside presentation components.
- Shared patterns are reused before new abstractions are created.
- Relevant tests, strict lint, typecheck, and production build pass.
- Performance and bundle impact are checked in proportion to the change.

## Trust Gate

- Prediction models, Trust Ledger, Resolution Engine, and Aurora boundaries remain distinct.
- Aurora does not rewrite upstream values or invent rationale.
- Paid status is not treated as verification.
- Confirmed and projected data cannot silently collapse into one state.

## Evidence Record

The change summary must state:

- what changed and why;
- files and systems affected;
- automated checks executed;
- viewport or journey manually verified;
- remaining uncertainty and external configuration.

## Release Rule

Quality is a set of passing evidence gates, not a permanent score. If a critical
trust, auth, billing, accessibility, or data-integrity risk remains unresolved,
the feature is not release-ready.
