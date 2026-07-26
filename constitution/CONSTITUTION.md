# VouchEdge Constitution
*Version 1.0 — July 25, 2026*

> This document is the governing foundation of VouchEdge.
> It changes rarely, and never lightly.
> All technical documents, architectural decisions, and product changes are subordinate to it.

*See also: ARCHITECTURE.md, RESOLUTION_CONTRACT_STANDARD.md*

---

## Preamble

VouchEdge is more than a sports betting product. It is an auditable sports decision platform.

Most products in this space compete on claiming accuracy. VouchEdge competes on something harder to fake and harder to lose: a public, permanent, verifiable record of every prediction, every assumption, every outcome, and every resolution.

Aurora can be wrong and VouchEdge still wins — because the product is not the prediction. The product is the evidence.

We never ask users to trust our predictions. We give them enough evidence to decide whether we deserve their trust.

That sentence is the company.

---

## Article 0 — Authority

Authority flows in one direction only:

```
Governance
    ↓
Resolution Contracts
    ↓
Resolution Engine
    ↓
Trust Ledger
    ↓
Calibration
    ↓
Trust
```

No system may modify, reinterpret, or supersede the authority of a system above it.

Aurora is below the Trust Ledger. The Trust Ledger is below Resolution Contracts. Resolution Contracts are below Governance.

This hierarchy is not implementation detail. It is governance.

---

## Article 1 — The Product

**VouchEdge is an evidence company for sports decisions.**

Aurora produces hypotheses.
The Trust Ledger tests them.
Calibration measures them.
The Trust Dashboard publishes them.

This is more durable than "AI picks."

---

## Article 2 — The Trust Ledger

The Trust Ledger is the center of the architecture. Not Aurora. The Ledger.

Aurora is replaceable. The Ledger is not.

The Trust Ledger is append-only. Every decision, assumption, and outcome is written once and preserved permanently. No record is modified. No record is deleted.

**What the Ledger records:**

Not just outcomes. Assumptions.

```
Decision #48291
Assumptions
  ✓ Wind out to RF
  ✓ Cleanup hitter
  ✓ Fly-ball pitcher
  ✓ Bullpen bottom 10
Confidence
  78%

—————

Outcome
  Miss
  
Why?
  Bullpen changed
  Wind shifted
  Cleanup hitter scratched
```

We do not just learn whether Aurora was wrong. We learn which assumptions broke. That is more valuable.

---

## Article 3 — The Engineering Oath

> When uncertainty exists, preserve the audit trail rather than optimize the user experience.

This is not a guideline. It is a decision filter.

- Delay grading? Preserve the audit trail.
- Edge case? Preserve the audit trail.
- Bug? Preserve the audit trail.
- Data outage? Preserve the audit trail.

The audit trail is not a feature. It is the product. Any engineering decision that compromises it has answered the wrong question.

---

## Article 4 — Calibration as Primary Metric

VouchEdge measures itself by calibration, not accuracy.

Calibration means: stated confidence reflects actual outcomes over time. A prediction stated at 90% confidence should win approximately 9 out of 10 times over any meaningful sample. A prediction stated at 55% should win approximately 55% of the time.

That is measurable. It is also honest.

Aurora should not chase being right. It should chase being honestly confident. These are different objectives, and only one of them serves the user.

Secondary metrics — accuracy, edge, confidence distribution — are useful. They are not primary.

---

## Article 5 — Resolution

Every market VouchEdge offers has a published Resolution Contract before a single prediction is recorded. The contract defines:

- Official data source
- Definition of each outcome
- Void conditions
- Push conditions
- Governing version

If the Resolution Engine encounters an outcome no contract rule addresses, the result is:

```
State:    UNRESOLVED
Reason:   No applicable contract rule
Awaiting: Governance — new contract version required
```

**UNRESOLVED is not a failure state. It is the system working correctly.**

No person, AI system, or administrator substitutes judgment for a missing rule. The state remains UNRESOLVED until Governance publishes a new contract version. That version applies to future events only. Past events are never regraded retroactively.

Changing a definition after outcomes are recorded is not a correction. It is rewriting history. VouchEdge does not rewrite history.

---

## Article 6 — Trust Is Earned, Not Claimed

Trust is a product of verifiable behavior over time. It is not a marketing position. It is not a badge.

The Trust Dashboard is a live instrument. It shows:

- Every prediction: pending, settled, void, or unresolved
- Aurora's calibration, measured continuously
- Resolution speed, measured against a published SLA
- The most and least reliable markets

VouchEdge publishes this not because it is always favorable, but because transparency is the product. Users who trust VouchEdge do so because they can verify the claim, not because we asked them to.

---

## What This Document Is Not

This document does not describe how the architecture is built. That is ARCHITECTURE.md.

This document does not describe how contracts are written. That is RESOLUTION_CONTRACT_STANDARD.md.

This document describes what VouchEdge believes, and why every system it builds follows from those beliefs.

When any engineering decision, feature proposal, or architectural change arrives, it must answer one question:

> Does this make the Constitution more true, or less true?

If the answer is "less true," the change does not ship.

---

*VouchEdge Constitution — Version 1.0*
*This document is governed by VouchEdge. Amendments require a formal version increment and public changelog entry.*
