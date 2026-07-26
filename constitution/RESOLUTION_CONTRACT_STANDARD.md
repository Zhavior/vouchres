# VouchEdge Resolution Contract Standard
*Version 1.0 — July 25, 2026*

> This document governs how Resolution Contracts are written, versioned, and amended.
> It does not define the rules themselves. It defines the rules for writing rules.

*See also: CONSTITUTION.md, ARCHITECTURE.md*

---

## Purpose

The Trust Ledger cannot exist without agreed definitions. A prediction recorded under one definition cannot be resolved under a different one. If we change the definition after outcomes are recorded, we have not built trust — we have rewritten history.

Resolution Contracts are the agreed definitions. They are published before any prediction is recorded. They are versioned so that every outcome in the Trust Ledger can be traced to the exact contract version that governed it.

---

## Required Fields

Every Resolution Contract must define the following fields. No field may be left ambiguous. If a field genuinely does not apply, it must be explicitly stated as `N/A`.

```
Market:            [Market identifier]
Official Source:   [Data provider name + feed identifier]
Definition:        [Exact definition of a WIN outcome]
Void Rule:         [Exact condition(s) under which the bet is voided]
Push Rule:         [Exact condition(s) under which the bet pushes — or N/A]
Version:           [e.g., 1.0]
Effective Date:    [Date this version takes effect]
Supersedes:        [Prior version number, or "None" for initial version]
```

---

## Example Contracts

### Home Run (HR)

```
Market:            HR
Official Source:   MLB official game data
Definition:        Batter records an official home run in the game.
Void Rule:         Player scratched before first plate appearance.
Push Rule:         N/A
Version:           1.0
Effective Date:    2026-03-01
Supersedes:        None
```

### Hits

```
Market:            Hits
Official Source:   MLB official game data
Definition:        Player records 1 or more official hits in the game.
Void Rule:         Player scratched before first plate appearance.
Push Rule:         N/A
Version:           1.0
Effective Date:    2026-03-01
Supersedes:        None
```

### Strikeouts (Pitcher)

```
Market:            Strikeouts (Pitcher)
Official Source:   MLB official game data
Definition:        Pitcher records [threshold] or more strikeouts in the game.
                   Threshold is set per prediction at time of recording.
Void Rule:         Pitcher does not start. Pitcher leaves before recording 1 out.
Push Rule:         N/A
Version:           1.0
Effective Date:    2026-03-01
Supersedes:        None
```

---

## Versioning Rules

**Versions are numbered sequentially.** `1.0`, `1.1`, `1.2`, `2.0`, etc.

**Minor version** (`1.0 → 1.1`): Clarification of existing language with no material change to outcomes. Example: clarifying that a suspended game void requires the suspension to occur before the first plate appearance.

**Major version** (`1.0 → 2.0`): Any change that could produce a different outcome for any previously recorded prediction, if applied retroactively (which it never is). Example: changing the void trigger or the definition of a WIN.

Version changes must be drafted by Governance, reviewed by at least two parties, and logged in the Amendment Log before publication.

---

## Amendment Process

### When a New Version May Be Published

- A gap is discovered (no rule covers an encountered edge case)
- An existing rule produced an unintended outcome
- An official data source changes its definitions
- A market is being introduced for the first time

### When a New Version May NOT Be Published

- To change the outcome of any already-recorded decision
- To benefit any party in an active dispute
- Without a publicly logged Amendment Log entry

### The Amendment Log

Every version change must produce an Amendment Log entry before the new version takes effect. The entry must contain:

```
Contract:         [Market identifier]
From Version:     [Prior version]
To Version:       [New version]
Published:        [Date published]
Effective Date:   [Date new version takes effect for new predictions]
Reason:           [Plain-language explanation of the change]
Retroactive:      No
```

Retroactive is always `No`. There are no exceptions.

---

## Market Certification

A market may not be offered until:

1. A Resolution Contract is fully written and reviewed
2. The official data source has been confirmed as available and reliable
3. The contract is published in the public contract registry
4. Governance has logged the effective date

No prediction may be recorded in a market without an active, published contract.

---

## What Resolution Contracts Do Not Do

Resolution Contracts do not express opinions on whether an outcome was fair. They do not interpret unofficial reports, social media, or team communications. They do not defer to Aurora. They do not respond to user complaints.

They apply the rule.

If no rule applies, the Resolution Engine produces `UNRESOLVED`. Governance publishes a new version. That version applies to future events only.

This is correct behavior. It is the system working.

---

*VouchEdge Resolution Contract Standard — Version 1.0*
*Amendments require Governance review and a public Amendment Log entry.*
