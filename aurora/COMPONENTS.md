# Aurora Component System

## Philosophy

Components are products.

Not snippets.

Every component has:

- One purpose.
- One responsibility.
- One owner.
- One source of truth.

---

# Hierarchy

App

↓

Feature

↓

Surface

↓

Section

↓

Component

↓

Primitive

Dependencies only flow downward.

---

# Surface

A Surface is the primary layout container.

Responsibilities:

- spacing
- hierarchy
- grouping
- responsive behavior

Never contains business logic.

---

# Section

A Section groups related information.

Examples:

- Hero
- Statistics
- Research
- Timeline
- Verdict

---

# Component

A Component solves exactly one problem.

Examples:

- Verdict
- Judge
- Evidence
- Signal
- Confidence
- Timeline
- Radar

Never combine unrelated responsibilities.

---

# Primitive

Primitives are reusable building blocks.

Examples:

- Button
- Text
- Icon
- Avatar
- Badge
- Divider

Primitives never know business rules.

---

# State Rules

UI State

✓ Expanded
✓ Selected
✓ Hovered

Business State

✓ Live
✓ Won
✓ Lost
✓ Pending

Never mix UI state with business state.

---

# Naming

Good

VerdictPanel

JudgeStack

EvidenceCard

ConfidenceMeter

PlayerTimeline

ResearchSurface

Bad

Widget

Container

Thing

Manager

Helper

Utils

---

# Reuse Rules

Before creating a component ask:

1. Does this already exist?
2. Can it be extended?
3. Can it be composed?
4. Does it belong in this feature?

Only create a new component if all answers are "No."

---

# Component Checklist

Every component must have:

- Single responsibility
- Typed props
- Loading state
- Empty state
- Error state
- Responsive layout
- Accessibility
- Tests (when business critical)

---

# Golden Rule

Small components.

Small files.

Small responsibilities.

Large systems.
