# VouchEdge Architecture
*Version 1.0 — July 25, 2026*

> This document describes how the VouchEdge Constitution is implemented.
> The Constitution governs this document, not the reverse.
> When implementation details conflict with constitutional principles, the Constitution takes precedence.

*See also: CONSTITUTION.md, RESOLUTION_CONTRACT_STANDARD.md*

---

## System Map

```
              VOUCHEDGE
                  │
    ┌─────────────┼──────────────┐
    ▼             ▼              ▼
 Aurora       Trust Ledger   Resolution Engine
                  ▲
                  │
              Governance
```

Sports data enters through Aurora. Aurora writes predictions to the Trust Ledger. The Resolution Engine reads official data sources and writes outcomes to the Trust Ledger. Governance publishes the contracts the Resolution Engine applies. The Trust Ledger surfaces calibration data to the Trust Dashboard.

---

## Aurora

Aurora is VouchEdge's reasoning engine. It assembles evidence, scores confidence, and produces recommendations. It is intentionally designed to be replaceable — the Trust Ledger is the durable asset, not Aurora.

### Inputs
- Sports data feeds (official and third-party)
- Trust Ledger Layer 2 projections (read-only, for model learning)

### Outputs
- Decision records written to the Trust Ledger (Layer 1)
- Each decision record contains:
  - Market identifier
  - Resolution Contract version in effect at time of decision
  - Assumptions (enumerated, timestamped)
  - Confidence score
  - Recommendation
  - Timestamp

### Calibration Standard
Aurora's confidence scores must be calibrated, not merely accurate. Over any statistically meaningful sample, a stated confidence of X% should resolve correctly approximately X% of the time. Calibration is measured continuously and published on the Trust Dashboard.

### What Aurora Must Never Do
- Write to Layer 1 after the initial decision record is committed
- Access Governance or Resolution Contract data
- Read Layer 1 directly (reads only from Layer 2 projections)

---

## The Trust Ledger

The Trust Ledger is the system of record. It is built on an append-only event sourcing pattern: every state change is written as a new event. No event is ever modified or deleted.

### Layer 1 — Facts (Immutable)

The raw event log. Every event is written once. The authoritative source for all downstream state.

Event types:
- `DECISION_RECORDED` — written by Aurora at prediction time
- `OUTCOME_CERTIFIED` — written by the Resolution Engine after grading
- `CONTRACT_VERSION_APPLIED` — appended alongside every outcome, recording which contract version governed the grade

No system may overwrite, amend, or delete a Layer 1 event.

### Layer 2 — Projections (Derived)

Materialized views derived from Layer 1 events. These are what the UI and Aurora read. They can be fully rebuilt from Layer 1 at any time. They are never the source of truth.

Example projections:
- Current state of each decision (LIVE / SETTLING / FINAL)
- Calibration statistics by market, by confidence band, by time period
- Trust Dashboard aggregates

### Layer 3 — Intelligence (Read-Only for Aurora)

Aurora reads Layer 2 projections to update its models. Aurora never reads Layer 1 directly. Aurora never writes to Layer 2 or Layer 3.

### Visibility Modes

**Mode 1 — Live** *(before event starts)*

The Trust Ledger displays for each decision:
- Market
- Assumptions (enumerated)
- Confidence score
- Recommendation
- Resolution Contract version governing this decision

No outcome. No resolution. The record is fully inspectable before any result exists.

**Mode 2 — Settling** *(event complete, outcome not yet certified)*

All Live data, plus:
- Status: `PENDING RESOLUTION`
- Avg. resolution time (live)
- SLA status
- Time elapsed since event end

Nothing is hidden. The system is visibly waiting.

**Mode 3 — Final** *(Resolution Engine has certified)*

Ledger appends:
- Outcome: `CORRECT` / `INCORRECT` / `VOID` / `PUSH` / `UNRESOLVED`
- Resolution Contract version applied
- Official data source used
- Timestamp of certification
- Calibration updated

History is permanent. No edits. No deletions.

---

## The Resolution Engine

The Resolution Engine is the Referee. It reads official data sources and applies the published Resolution Contract to produce a certified outcome. It has no discretion. It has no opinions. It applies rules.

### Inputs
- Official data sources (as designated by Governance per Resolution Contract)
- The current versioned Resolution Contract for each market

### Outputs
- `OUTCOME_CERTIFIED` events written to the Trust Ledger Layer 1
- Each outcome record contains: result, contract version applied, official source used, timestamp

### The No Human Override Rule

If an edge case arises that no published Resolution Contract addresses:

```
State:    UNRESOLVED
Reason:   No applicable contract rule
Awaiting: Governance — new contract version required
```

No person, AI system, or administrator may substitute judgment for a missing rule. The state remains `UNRESOLVED` until Governance publishes a new contract version. That version applies to future events only.

### Resolution SLA

The Resolution Engine must certify outcomes within the SLA published on the Trust Dashboard. The default target is 95% of outcomes certified within 6 hours of event completion. SLA performance is published in real time.

---

## Governance

Governance is the rule-making layer. It publishes and versions Resolution Contracts. It maintains the Amendment Log. It certifies new markets. It designates official data sources.

Governance has no runtime role. It does not run during events. It governs the system that does.

### The Amendment Log

Public. Permanent. Append-only. Every change to every Resolution Contract is logged:

```
Contract:       HR
From Version:   1.0
To Version:     1.1
Published:      2026-08-12
Reason:         Clarified suspended-game handling
Effective:      Future events only
Retroactive:    No
```

Decisions resolved under prior contract versions are never regraded. The version applied is recorded in the Trust Ledger alongside every outcome.

---

## The Trust Dashboard

The Trust Dashboard is the public face of the Trust Ledger. It is a live instrument, not a marketing surface.

```
Trust Dashboard
════════════════════════════════
Total Predictions          18,241
Settled                    17,832
Pending                       409
Voids                         214
Unresolved                      7
════════════════════════════════
Calibration                Excellent
Avg. Resolution Time       4.2 hours
SLA                        95% within 6 hours
Oldest Pending             2h 14m
════════════════════════════════
Most Reliable Markets      HR · Strikeouts · Hits
Markets Improving          RBI · Walks
════════════════════════════════
```

Trust is multidimensional. It is never expressed as a single percentage.

---

## Why Event Sourcing

VouchEdge uses event sourcing not because it is fashionable but because the product promise requires it:

*Every prediction. Every reason. Every outcome. On the record.*

Event sourcing is the only pattern that makes "on the record" structurally true rather than operationally aspirational. Every state change is a written fact. History can be reconstructed at any point. The audit trail cannot be quietly amended.

This introduces real complexity. That complexity is justified here because auditability is not a feature — it is the product.

---

*This document describes implementation. It does not govern principles. See CONSTITUTION.md.*
