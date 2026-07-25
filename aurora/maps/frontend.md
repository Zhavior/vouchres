# Frontend Map

## Purpose

This document tells AI and developers where frontend functionality lives.

Do not search the repository if this document answers the question.

---

# Stack

- React
- TypeScript
- Vite
- Tailwind CSS

---

# Primary Features

src/features/

Core areas include:

- brain-edge
- hr-board
- parlay
- research
- social
- profile
- auth
- notifications

Each feature should own:

- components/
- hooks/
- services/
- types/
- utils/
- tests/

Avoid cross-feature dependencies unless they are intentionally shared.

---

# UI Hierarchy

App

↓

Route

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

Business logic must never live in presentation components.

---

# Shared Code

Shared code belongs only in locations that are genuinely shared.

Examples:

- ui
- hooks
- lib
- types

Do not create shared code prematurely.

---

# State

Priority:

1. Server
2. URL
3. Feature
4. UI
5. Local

Keep state as close as possible to its owner.

---

# Performance

Prefer:

- lazy loading
- memoization only after measurement
- virtualization for large datasets

Optimize user experience before micro-optimizations.

---

# Navigation Rule

If adding a new feature:

1. Check if one already exists.
2. Extend before duplicating.
3. Keep ownership inside the feature.
