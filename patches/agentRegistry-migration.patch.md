# agentRegistry.ts migration — persist capper picks to Postgres

## Problem

`server/agents/agentRegistry.ts` currently computes capper picks in-memory
and returns them to the frontend. The picks are NEVER persisted. Every time
the daily report regenerates (every 20 minutes per `cache.ts`), the cappers
"post" entirely new picks. Old picks vanish. There is no record of what
the cappers have actually predicted over time, so trust scores can't be
computed and the leaderboard stays empty.

The current flow:

```
mlbIntelligenceEngine.getDailyReport()
  → agentRegistry.generatePicks(capperId, report)
  → returns JudgedPick[] (in-memory)
  → frontend renders them in the feed
  → picks disappear on next cache refresh
```

## Fix

Add a `persistAgentPicks()` function that runs once per day (after the
daily report is first generated) and writes the picks to Postgres via
`pickService.createPick()`. Subsequent calls to `generatePicks()` for the
same day return the persisted picks instead of regenerating them.

### New file: server/agents/agentPickScheduler.ts

```ts
import { supabaseAdmin } from "../middleware/auth";
import { createPick } from "../services/persistence/pickService";
import { generatePicks, CAPPER_AGENTS } from "./agentRegistry";
import { getDailyMlbReport } from "../services/intelligence/mlbIntelligenceEngine";

/**
 * Once-daily job that has each capper agent post their picks to the DB.
 *
 * Idempotent: checks if the capper has already posted picks today before
 * generating new ones. Safe to call multiple times per day.
 *
 * Schedule: 4 AM ET (before first games start, after daily report is fresh)
 * Run via: Render Cron Job, or node-cron inside the server.
 */
export async function postDailyAgentPicks(opts: { dryRun?: boolean } = {}): Promise<{
  posted: number;
  skipped: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let posted = 0;
  let skipped = 0;

  // 1. Get the daily report
  let report;
  try {
    report = await getDailyMlbReport();
  } catch (err: any) {
    errors.push(`failed to load daily report: ${err.message}`);
    return { posted, skipped, errors };
  }

  // 2. For each capper, check if they've already posted today
  const today = new Date().toISOString().slice(0, 10);

  for (const agent of CAPPER_AGENTS) {
    try {
      // Check for existing picks from this capper today
      const { data: existing, error: checkErr } = await supabaseAdmin
        .from("picks")
        .select("id", { count: "exact", head: true })
        .eq("capper_id", agent.id)
        .gte("created_at", `${today}T00:00:00Z`)
        .lte("created_at", `${today}T23:59:59Z`);

      if (checkErr) {
        errors.push(`capper ${agent.id} check failed: ${checkErr.message}`);
        continue;
      }

      if ((existing as any)?.length > 0 || (existing as any)?.count > 0) {
        skipped++;
        continue;
      }

      // 3. Generate picks for this capper
      const judged = generatePicks(agent.id, report);
      if (judged.length === 0) {
        skipped++;
        continue;
      }

      // 4. Persist each pick
      for (const j of judged) {
        if (opts.dryRun) {
          posted++;
          continue;
        }

        await createPick({
          user_id: null,
          capper_id: agent.id,
          leg_type: j.pick.isParlay ? "parlay" : "single",
          sport: "mlb",
          event_id: extractEventId(j.pick) ?? null,
          market: j.pick.market,
          selection: j.pick.selection,
          odds_decimal: null, // agent picks don't carry odds yet
          stake_units: 1.0,
          confidence: j.pick.score,
          judge_quality: j.verdict.quality,
          judge_risk: j.verdict.risk,
          judge_bias: j.verdict.bias,
          judge_trust: j.verdict.trust,
          judge_verdict: j.verdict.verdict,
          explanation: j.pick.reasons.join(" "),
          is_demo: true, // all capper picks are demo — cappers are agents
        });
        posted++;
      }
    } catch (err: any) {
      errors.push(`capper ${agent.id}: ${err.message}`);
    }
  }

  console.log(
    `[agentScheduler] done: ${posted} posted, ${skipped} skipped, ${errors.length} errors`
  );
  return { posted, skipped, errors };
}

/**
 * Extract event_id from a pick if available.
 * The current AgentPick shape doesn't carry gamePk explicitly — extend
 * baseAgent.ts to include gamePk on each pick, then read it here.
 */
function extractEventId(pick: any): string | null {
  return pick.gamePk ?? pick.event_id ?? null;
}
```

### Update server/agents/baseAgent.ts

Add `gamePk` to the `AgentPick` interface so the scheduler can persist it:

```diff
export interface AgentPick {
  agentId: string;
  agentName: string;
  team: string;
  opponent: string;
  market: string;
  selection: string;
  score: number;
  reasons: string[];
  riskWarnings: string[];
  dataQuality: "full" | "partial" | "limited";
+ gamePk?: string;        // MLB statsapi gamePk, for grading
  isParlay?: boolean;
  legs?: number;
}
```

Then update each capper file to populate `gamePk`:

```diff
// server/agents/cappers/hrHunterAgent.ts
- return report.hrTargets.slice(0, 4).map((t) =>
-   judged({ ... })
- );
+ return report.hrTargets.slice(0, 4).map((t) =>
+   judged({
+     ...
+     gamePk: t.gamePk,  // add this — needs to be propagated from the report
+   })
+ );
```

You'll need to thread `gamePk` from `mlbIntelligenceEngine.ts` →
`hrTargets[]` → capper agents. Check the shape of `HrTarget` in
`server/services/intelligence/hrEngine.ts` — it likely already has the
gamePk from the underlying schedule feed; just expose it.

### Schedule the job

Add to `server/cron/dailyGradeJob.ts` (or create a sibling file):

```ts
import { postDailyAgentPicks } from "../agents/agentPickScheduler";

// Run at 4 AM ET (8 AM UTC during DST) — before games start
export async function runAgentPostJob() {
  const result = await postDailyAgentPicks();
  console.log("[agentPostJob]", result);
}
```

Schedule it via Render Cron Job:
```yaml
- type: cron
  name: vouchedge-agent-poster
  runtime: node
  plan: starter
  schedule: "0 8 * * *"  # 4 AM ET = 8 AM UTC (DST)
  command: node dist/agentPostJob.cjs
  envVars: [same as web service]
```

### What this fixes

1. **Capper picks now persist** — they show up in the feed, on capper
   profiles, and on the public ledger.
2. **Grading works** — the daily grading job can find capper picks with
   `status='pending'` and grade them when games conclude.
3. **Trust scores roll up** — `pickService.gradePick()` calls
   `recomputeTrustForPick()` which updates `trust_scores` and
   `profiles.trust_score`.
4. **Leaderboard populates** — once cappers have 20+ graded picks, they
   appear on `/api/leaderboard`.
5. **Demo flag** — every capper pick has `is_demo: true` so the UI can
   show a DEMO badge. Users can see the cappers are simulated.

### Idempotency

`postDailyAgentPicks()` checks if a capper has any picks created today
before generating new ones. If you re-run the job (e.g. after a deploy
mid-day), it skips cappers that already posted. This prevents duplicate
picks from cluttering the feed.

### Important caveat

Capper picks are now publicly visible forever (or until deleted). This
is the *correct* behavior for a picks product — cappers build a track
record over time. But it means cappers will post picks every day, even
on days when the slate is thin. Consider adding a "capper pass day"
behavior where a capper posts no picks rather than forcing weak plays.
