# Aurora Motion Language

## Purpose

Motion teaches state, change, priority, navigation, and cause and effect. Motion
that communicates none of these is decoration and must be removed.

## Allowed Uses

- Confirm that an action completed.
- Connect an origin to its resulting surface.
- Reveal progressive detail.
- Explain a live-to-resolved state change.
- Preserve spatial context during navigation.
- Draw attention to newly changed information once.

## Prohibited Uses

- Infinite ambient movement behind decision content.
- Pulsing non-live elements.
- Hover movement that makes dense data harder to scan.
- Delayed entrances that block reading or action.
- Motion used to imply confidence, urgency, or live status that data does not support.

## Timing

- Direct control feedback: 100–160ms.
- Small state transitions: 160–220ms.
- Navigation and disclosure: 200–300ms.
- Do not exceed 400ms without a demonstrated teaching purpose.

Use opacity and small transforms when they preserve layout. Avoid animation that
causes layout shift.

## Reduced Motion

`prefers-reduced-motion: reduce` is mandatory. Under reduced motion:

- remove decorative and spatial transforms;
- replace animated travel with immediate state changes or brief fades;
- stop looping animation;
- preserve status and feedback through text, icons, and focus management.

## Performance

Animate compositor-friendly properties when possible. Measure long tasks and
layout shift. Motion must never delay input, hide loading, or make stale data
look live.

## Review Test

For every animation, finish this sentence: “This motion teaches the user that
___.” If the answer is unclear, delete the animation.
