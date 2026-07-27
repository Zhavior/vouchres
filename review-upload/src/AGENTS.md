# Frontend Rules

Apply this file for UI work under `src/`.

## Product framing

Frontend work must respect the real backend truth.

- do not present projected HR data as confirmed
- do not present in-memory or MVP backends as if they are production-grade
- do not invent live delivery, trust guarantees, or billing guarantees the backend does not actually provide

## System map

Main UI families:

- `ParlayOS`
- `SocialOS`
- `TrustOS`
- `HR / Truth OS`
- `AI / Agent OS`

## UX rules

- keep “truth-first” copy
- do not oversell predictions or guarantees
- when a system is gated, locked, or degraded, say so clearly in the UI

## Implementation rules

- preserve existing app-shell and section-routing patterns unless asked to replace them
- prefer improving an existing page or surface over inventing a second competing one
- if backend ownership has moved to V3, reflect that through existing API clients and loaders instead of reviving legacy request shapes
