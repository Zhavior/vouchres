# Aurora Architecture

## Purpose

Aurora defines how VouchEdge is engineered.

This document is the canonical engineering reference.

If implementation conflicts with this document, either:

- improve the implementation, or
- formally update this document.

Never allow architecture to drift.

---

# Engineering Goals

Every system should optimize for:

- Simplicity
- Reusability
- Predictability
- Testability
- Performance
- Scalability

---

# Repository Philosophy

The repository is organized around features—not file types.

Each feature should own:

- UI
- Business logic
- Data access
- Tests
- Types
- Hooks

Avoid large shared folders unless functionality is genuinely shared.

---

# Data Flow

The canonical flow is:

Request
↓

Validation

↓

Service

↓

Transformation

↓

Business Rules

↓

Presentation Model

↓

UI

Business rules never live inside UI components.

Aurora begins at the presentation-model boundary. It may select hierarchy,
format values, disclose provenance, and reveal deeper evidence. It may not
calculate predictions, rewrite confidence, infer verification, or settle an
outcome.

The intelligence boundary is:

Research Engine → Prediction Models → Trust Ledger → Resolution Engine → Aurora → User

Each upstream system owns its domain. Aurora consumes typed, source-aware
presentation models and remains replaceable without changing recorded truth.

---

# Component Hierarchy

Application

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

Dependencies always flow downward.

Never create circular dependencies.

Legacy Z8 components may remain during migration, but new shared UI must use
Aurora names and contracts. Compatibility aliases must point toward Aurora;
Aurora must never depend on a second competing design system.

---

# State Hierarchy

1. Server State
2. URL State
3. Feature State
4. UI State
5. Local Component State

Keep state as close as possible to where it is needed.

---

# API Principles

Every endpoint must:

- Validate inputs.
- Return typed responses.
- Be deterministic.
- Fail predictably.
- Expose useful errors.
- Never leak implementation details.

---

# Performance Budget

Prefer:

- lazy loading
- memoization only when measured
- virtualization for large lists
- streaming where appropriate
- optimistic updates only when safe

Measure before optimizing.

---

# Testing Strategy

Critical paths require tests.

Prioritize:

1. Business logic
2. API contracts
3. User journeys
4. Components

Snapshot tests are not sufficient.

---

# Future Expansion

Aurora is designed to support:

- MLB
- NBA
- NFL
- NHL
- WNBA
- Soccer
- Tennis
- eSports

without changing the architectural model.

Every new sport should extend the system—not fork it.

---

# Architecture Rule

The simplest architecture that scales wins.

Complexity must always justify itself.

Aurora grows through small, proven migrations. Do not pause product delivery for
a whole-application rewrite and do not rename code without improving behavior,
accessibility, consistency, or maintainability.
