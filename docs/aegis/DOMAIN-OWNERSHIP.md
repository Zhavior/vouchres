# Domain ownership

The code registry in `server/aegis/ownership.ts` is the enforceable source for
the first parlay slice.

| Capability | Owner | Canonical handler | Current Aegis state |
| --- | --- | --- | --- |
| Save parlay | Parlay | `saveUserParlay` | Migrated |
| Commit trust window | Parlay | `commitParlayTrustLedger` | Migrated |
| Finalize trust lock | Trust | `finalizeParlayTrustLock` | Migrated |
| Resolve legs/parlay | Resolution | `gradePendingPicks` + sport graders | Planned adapter |
| Generate/publish proof | Trust | proof hash + OTS anchor services | Planned durable worker |
| Notify outcome | Notification | notification service/worker | Planned event consumer |
| Subscription state | Billing | V3 billing + Stripe webhook worker | Future domain |
| HR Board publication | Sports Intelligence | MLB HR pipeline | Future domain |
| AI recommendation | Intelligence | Central Brain/AI services | Future domain |

Routes, workers, and cron jobs may establish context and call these handlers.
They may not independently reproduce the domain rules.
