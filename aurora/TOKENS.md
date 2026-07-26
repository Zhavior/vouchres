# Aurora Tokens

## Authority

Tokens encode meaning and hierarchy. The canonical color values live in
`src/styles/vouchedge-tokens.css`. TypeScript composition tokens live in
`src/theme/auroraTokens.ts`.

Z8 token names are temporary compatibility aliases. New shared code imports
Aurora tokens. Do not create a second palette during migration.

## Semantic Color

- Ground: application background.
- Surface 1–3: increasing elevation, not importance.
- Accent: selection, focus, and the primary action.
- Positive: confirmed success or favorable resolved state.
- Caution: projected, stale, incomplete, or needs review.
- Negative: error, loss, blocked, or destructive action.
- Live: only verified in-progress state.
- Text primary/muted: hierarchy without lowering readability below acceptable contrast.

Green never means “good” by default and red never means “bad” by default. The
domain state chooses the semantic token.

## Typography

- Display answers the page's primary question.
- Body explains the answer.
- Label identifies compact state or metadata.
- Mono is reserved for tabular data, identifiers, timestamps, odds, and compact labels.
- Tabular numbers are required where changing values must remain aligned.

Do not use small uppercase text as decoration. Shared labels remain at least
11px; essential explanatory text should be larger.

## Spacing and Shape

- Use the shared page, section, and control rhythm.
- Minimum mobile touch target: 44px; preferred: 48px.
- Radius communicates component family, not novelty.
- Borders separate meaning only when spacing or surface elevation is insufficient.
- Avoid one-off spacing and arbitrary radii in reusable components.

## Motion Tokens

Use the timing ranges in `aurora/MOTION.md`. New duration or easing values need
a documented interaction purpose and reduced-motion behavior.

## Compatibility

Legacy `Z8_*` exports must resolve to the corresponding `AURORA_*` token. Remove
an alias only after repository search proves no remaining consumers and the
replacement passes visual and automated checks.
