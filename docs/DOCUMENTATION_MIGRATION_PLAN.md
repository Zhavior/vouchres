# VouchEdge Documentation Migration Plan

Status: Active
Version: 1.0
Owner: Platform Architecture

---

# Objective

Create one canonical documentation architecture for VouchEdge.

Goals:

- One source of truth for every topic
- No duplicate documentation
- Clear ownership
- ADR-driven architecture
- Fast onboarding (<1 hour)

---

# Migration Board

| Document | Current Location | Type | Owner | Action | Target | Priority | Notes |
|----------|------------------|------|-------|--------|--------|----------|-------|
| README.md | docs/README.md | Constitution | Platform | KEEP | docs/ | High | Entry point |
| ARCHITECTURE.md | docs/ARCHITECTURE.md | Constitution | Architecture | KEEP | docs/ | High | Canonical architecture |
| architecture.md | docs/architecture.md | Legacy | Architecture | MERGE | docs/ARCHITECTURE.md | High | Remove duplicate |
| PRODUCT.md | docs/PRODUCT.md | Constitution | Product | KEEP | docs/ | High | Product vision |
| ENGINEERING.md | docs/ENGINEERING.md | Constitution | Engineering | KEEP | docs/ | High | Engineering standards |
| DESIGN_SYSTEM.md | docs/DESIGN_SYSTEM.md | Constitution | Design | KEEP | docs/ | High | Canonical UI |
| AURORA.md | docs/AURORA.md | Constitution | Design | KEEP | docs/ | High | Aurora language |
| CENTRAL_BRAIN_ARCHITECTURE.md | docs/CENTRAL_BRAIN_ARCHITECTURE.md | Specification | Brain | MOVE | docs/architecture/brain/ | High | Brain subsystem |
| PRODUCTION_HOSTING.md | docs/PRODUCTION_HOSTING.md | Guide | Platform | MOVE | docs/architecture/deployment/ | Medium | Deployment docs |
| DEPLOY_CHECKLIST.md | docs/DEPLOY_CHECKLIST.md | Guide | Platform | MOVE | docs/architecture/deployment/ | Medium | Deployment checklist |
| VISUAL_SYSTEM_PLAN.md | docs/VISUAL_SYSTEM_PLAN.md | Specification | Design | MOVE | docs/design-system/ | Medium | Visual system |
| UI_FIX_PLAN.md | docs/UI_FIX_PLAN.md | Guide | Engineering | MOVE | docs/engineering/ | Medium | Engineering guide |
| UI_JUDGE_RESCORE.md | docs/UI_JUDGE_RESCORE.md | Audit | Engineering | MOVE | docs/engineering/ | Low | Historical audit |

---

# Progress

- [ ] Repository classified
- [ ] Canonical documents identified
- [ ] Duplicate documents merged
- [ ] Files relocated
- [ ] Links updated
- [ ] Metadata added
- [ ] ADR references added
- [ ] Folder READMEs completed

---

# Rules

1. One canonical document per topic.
2. Historical documents are archived, never deleted.
3. New architecture decisions require an ADR.
4. Every document has an owner.
5. Every document belongs to one subsystem.
